import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { db } from './database.js';
import { FiscalEngineService } from '@totem-pdv/fiscal-engine';
import { CashMovement, CreateOrderRequest, Order, OrderPayment, OrderStatus, Shift } from '@totem-pdv/shared-types';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const fiscalService = new FiscalEngineService(db.fiscalConfig);

// Helper to notify the Cockpit on port 5050
async function notifyCockpit(agentId: string, thought: string, category: string, fileLink?: string) {
  try {
    await fetch('http://localhost:5050/api/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'totem-pdv-central',
        agentId,
        thought,
        category,
        fileLink: fileLink || 'F:\\totem-pdv-central\\apps\\central-web\\src\\server.ts'
      })
    });
  } catch (e) {
    // Ignore if cockpit is not running
  }
}

// ==========================================
// 1. ROTAS DE PRODUTOS & CARDÁPIO
// ==========================================

app.get('/api/categories', (req: Request, res: Response) => {
  res.json(db.categories.filter((c) => c.active).sort((a, b) => a.order - b.order));
});

app.get('/api/products', (req: Request, res: Response) => {
  const { categoryId, activeOnly, kioskOnly } = req.query;
  let items = db.products;

  if (activeOnly === 'true') items = items.filter((p) => p.active);
  if (kioskOnly === 'true') items = items.filter((p) => p.availableInKiosk && p.active);
  if (categoryId) items = items.filter((p) => p.categoryId === categoryId);

  res.json(items);
});

app.patch('/api/products/:id/toggle', (req: Request, res: Response) => {
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  product.active = !product.active;
  product.updatedAt = new Date().toISOString();

  notifyCockpit(
    'claude',
    `Status do produto "${product.name}" alterado para ${product.active ? 'ATIVADO' : 'DESATIVADO'}. Refletindo no totem e PDV imediatamente.`,
    'Cardápio & Preços'
  );

  res.json({ success: true, active: product.active });
});

// ==========================================
// 2. ROTAS DE PEDIDOS & KDS (COZINHA)
// ==========================================

app.get('/api/orders/kds', (req: Request, res: Response) => {
  const activeOrders = db.orders
    .filter((o) => ['RECEIVED', 'PREPARING', 'READY'].includes(o.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(activeOrders);
});

app.get('/api/orders', (req: Request, res: Response) => {
  res.json(db.orders.slice().reverse());
});

app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body as { status: OrderStatus };
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  order.status = status;
  order.updatedAt = new Date().toISOString();

  notifyCockpit(
    'codex',
    `Status do pedido #${order.publicTicketNumber} atualizado para "${status}" na fila KDS de preparo.`,
    'KDS Preparo'
  );

  res.json(order);
});

// Same lifetime as the prototype's in-memory orders. Reserve the promise before
// replying so concurrent retries cannot create two tickets or fiscal emissions.
const kioskOrderSubmissions = new Map<string, { fingerprint: string; result: Promise<Order> }>();

app.post('/api/orders', async (req: Request, res: Response) => {
  const { items, payments, clientCpf, origin = 'TOTEM', kioskId } = req.body as CreateOrderRequest;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Pedido deve conter itens' });
  }

  const idempotencyKey = req.body.idempotency_key;
  if (idempotencyKey !== undefined && (typeof idempotencyKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey))) {
    return res.status(400).json({ error: 'Chave de idempotência inválida' });
  }
  const fingerprint = JSON.stringify({ items, payments, clientCpf, origin, kioskId });
  const existing = idempotencyKey ? kioskOrderSubmissions.get(idempotencyKey) : undefined;
  if (existing && existing.fingerprint !== fingerprint) {
    return res.status(409).json({ error: 'Chave já utilizada para outro pedido' });
  }

  const createOrder = async (): Promise<Order> => {
    const subtotal = items.reduce((acc: number, item: any) => acc + item.totalPrice, 0);
    const total = subtotal;

    const ticketNumber = db.nextTicketSequence.toString().padStart(3, '0');
    db.nextTicketSequence += 1;

    const currentShift = db.shifts.find((s) => s.status === 'OPEN') || db.shifts[0];

    const newOrder: Order = {
      id: `ord-${idempotencyKey || Date.now()}`,
      idempotency_key: idempotencyKey,
      publicTicketNumber: ticketNumber,
      origin,
      kioskId,
      shiftId: currentShift.id,
      status: 'RECEIVED',
      items,
      subtotal,
      discount: 0,
      total,
      payments: payments || [],
      clientCpf,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
  };

  // Se o pagamento for em dinheiro no PDV assistido, registra movimento de caixa
  const cashPay = payments?.find((p: OrderPayment) => p.method === 'CASH');
  if (cashPay && currentShift) {
    currentShift.finalCalculatedCash += cashPay.amount;
    currentShift.movements.push({
      id: `mov-${Date.now()}`,
      shiftId: currentShift.id,
      type: 'ORDER_PAYMENT',
      amount: cashPay.amount,
      description: `Venda #${ticketNumber} - Dinheiro`,
      operatorId: currentShift.operatorId,
      operatorName: currentShift.operatorName,
      createdAt: new Date().toISOString()
    });
  }

  // Emissão fiscal da NFC-e via Motor Fiscal
  try {
    const invoice = await fiscalService.emitNFCe(newOrder);
    newOrder.nfceKey = invoice.chaveAcesso;
    newOrder.nfceStatus = invoice.status === 'CONTINGENCY_PENDING' ? 'CONTINGENCY' : 'AUTHORIZED';
    newOrder.nfceXmlUrl = `/api/fiscal/xml/${invoice.id}`;

    notifyCockpit(
      'fiscal',
      `NFC-e #${invoice.numero} emitida com sucesso (Chave: ${invoice.chaveAcesso.slice(0, 16)}...). Tributos IBPT calculados.`,
      'Fiscal'
    );
  } catch (err) {
    console.error('Falha ao emitir NFC-e:', err);
    newOrder.nfceStatus = 'CONTINGENCY';
    notifyCockpit(
      'fiscal',
      `NFC-e gerada em contingência offline (tpEmis=9) com buffer local.`,
      'Fiscal'
    );
  }

  db.orders.push(newOrder);

  if (origin === 'TOTEM') {
    notifyCockpit(
      'codex',
      `Venda de R$ ${total.toFixed(2)} finalizada no Totem Kiosk (${payments?.[0]?.method}). Pedido #${ticketNumber} entrou na fila de preparo.`,
      'Totem Kiosk'
    );
  } else {
    notifyCockpit(
      'claude',
      `Atendente registrou venda #${ticketNumber} no PDV Assistido (R$ ${total.toFixed(2)}). Caixa atualizado.`,
      'PDV Assistido'
    );
  }

  return newOrder;
  };

  const result = existing?.result || createOrder();
  if (idempotencyKey && !existing) kioskOrderSubmissions.set(idempotencyKey, { fingerprint, result });
  try {
    res.status(existing ? 200 : 201).json(await result);
  } catch {
    // Retain failed reservations: an ambiguous failure must not start a second sale.
    res.status(500).json({ error: 'Não foi possível confirmar o pedido. Solicite atendimento.' });
  }
});

// ==========================================
// 3. ROTAS DE CAIXA, TURNOS, SANGRIA E SUPRIMENTO
// ==========================================

app.get('/api/shifts/current', (req: Request, res: Response) => {
  const currentShift = db.shifts.find((s) => s.status === 'OPEN');
  if (!currentShift) return res.json({ open: false });

  // Recalcular totais com base nos pedidos pagos deste turno
  const shiftOrders = db.orders.filter((o) => o.shiftId === currentShift.id);
  let totalCash = currentShift.initialCash;
  let totalCredit = 0;
  let totalDebit = 0;
  let totalPix = 0;

  for (const o of shiftOrders) {
    for (const p of o.payments) {
      if (p.status === 'APPROVED') {
        if (p.method === 'CASH') totalCash += p.amount;
        if (p.method === 'CREDIT_CARD') totalCredit += p.amount;
        if (p.method === 'DEBIT_CARD') totalDebit += p.amount;
        if (p.method === 'PIX') totalPix += p.amount;
      }
    }
  }

  // Descontar sangrias e somar suprimentos
  for (const m of currentShift.movements) {
    if (m.type === 'BLEED_SANGRIA') totalCash -= m.amount;
    if (m.type === 'SUPPLY') totalCash += m.amount;
  }

  currentShift.finalCalculatedCash = totalCash;
  currentShift.reconciliation = [
    { method: 'CASH', systemCalculatedAmount: totalCash },
    { method: 'CREDIT_CARD', systemCalculatedAmount: totalCredit },
    { method: 'DEBIT_CARD', systemCalculatedAmount: totalDebit },
    { method: 'PIX', systemCalculatedAmount: totalPix }
  ];

  res.json({ open: true, shift: currentShift });
});

app.post('/api/shifts/open', (req: Request, res: Response) => {
  const { terminalId, initialCash, operatorName } = req.body;
  const existingOpen = db.shifts.find((s) => s.status === 'OPEN' && s.terminalId === terminalId);
  if (existingOpen) return res.status(400).json({ error: 'Já existe um turno aberto para este terminal' });

  const newShift: Shift = {
    id: `shift-${Date.now()}`,
    terminalId: terminalId || 'CAIXA-01',
    terminalType: 'PDV',
    operatorId: 'user-op',
    operatorName: operatorName || 'Operador Padrão',
    status: 'OPEN',
    openedAt: new Date().toISOString(),
    initialCash: Number(initialCash) || 0,
    finalCalculatedCash: Number(initialCash) || 0,
    movements: [
      {
        id: `mov-${Date.now()}`,
        shiftId: `shift-${Date.now()}`,
        type: 'INITIAL_SUPPLY',
        amount: Number(initialCash) || 0,
        description: 'Abertura de Caixa (Fundo Inicial)',
        operatorId: 'user-op',
        operatorName: operatorName || 'Operador Padrão',
        createdAt: new Date().toISOString()
      }
    ],
    reconciliation: []
  };

  db.shifts.unshift(newShift);

  notifyCockpit(
    'claude',
    `Abertura de turno confirmada no terminal ${newShift.terminalId}. Fundo inicial: R$ ${newShift.initialCash.toFixed(2)}.`,
    'Caixa & Turnos'
  );

  res.status(201).json(newShift);
});

app.post('/api/shifts/movement', (req: Request, res: Response) => {
  const { type, amount, description } = req.body; // 'SUPPLY' ou 'BLEED_SANGRIA'
  const currentShift = db.shifts.find((s) => s.status === 'OPEN');
  if (!currentShift) return res.status(400).json({ error: 'Nenhum turno aberto' });

  const mov: CashMovement = {
    id: `mov-${Date.now()}`,
    shiftId: currentShift.id,
    type,
    amount: Number(amount),
    description,
    operatorId: currentShift.operatorId,
    operatorName: currentShift.operatorName,
    createdAt: new Date().toISOString()
  };

  currentShift.movements.push(mov);

  notifyCockpit(
    'claude',
    `Movimento de caixa: ${type === 'BLEED_SANGRIA' ? 'SANGRIA' : 'SUPRIMENTO'} de R$ ${Number(amount).toFixed(2)}. Motivo: ${description}`,
    'Caixa & Turnos'
  );

  res.json(mov);
});

app.post('/api/shifts/close', (req: Request, res: Response) => {
  const { declaredCash, declaredCredit, declaredDebit, declaredPix } = req.body;
  const currentShift = db.shifts.find((s) => s.status === 'OPEN');
  if (!currentShift) return res.status(400).json({ error: 'Nenhum turno aberto' });

  currentShift.status = 'CLOSED';
  currentShift.closedAt = new Date().toISOString();
  currentShift.finalDeclaredCash = Number(declaredCash);
  currentShift.cashDifference = (currentShift.finalDeclaredCash || 0) - currentShift.finalCalculatedCash;

  notifyCockpit(
    'claude',
    `Fechamento de turno concluído. Relatório Z emitido. Declarado: R$ ${declaredCash}. Diferença de caixa: R$ ${currentShift.cashDifference.toFixed(2)}`,
    'Auditoria Contábil'
  );

  res.json(currentShift);
});

// ==========================================
// 4. ROTAS DE TOTENS & STATUS
// ==========================================

app.get('/api/totems', (req: Request, res: Response) => {
  res.json(db.totems);
});

app.post('/api/totems/:id/heartbeat', (req: Request, res: Response) => {
  const totem = db.totems.find((t) => t.id === req.params.id);
  if (totem) {
    totem.lastHeartbeatAt = new Date().toISOString();
    totem.status = 'ONLINE';
    if (req.body.printerStatus) totem.printerStatus = req.body.printerStatus;
    if (req.body.pinpadStatus) totem.pinpadStatus = req.body.pinpadStatus;
  }
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// ==========================================
// 5. PÁGINAS WEB (CENTRAL & TOTEM SIMULATOR)
// ==========================================

app.get('/totem', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/totem.html'));
});

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🥭 MANGO BRASIL - CENTRAL WEB & PDV ASSISTIDO`);
  console.log(`👉 Painel Central: http://localhost:${PORT}`);
  console.log(`📱 Simulador Totem Kiosk: http://localhost:${PORT}/totem`);
  console.log(`=======================================================`);
});
