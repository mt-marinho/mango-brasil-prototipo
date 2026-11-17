/**
 * @totem-pdv/shared-types
 * Contratos de domínio compartilhados entre Central Web, Totem Flutter e Motor Fiscal.
 */

// ==========================================
// 1. PRODUTOS & CARDÁPIO
// ==========================================

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  icon?: string;
  active: boolean;
}

export interface ProductSize {
  id: string;
  name: string; // Ex: 'Pequeno', 'Médio', 'Grande', '500ml'
  description?: string;
  priceModifier: number; // Ex: +3.50 ou valor base
}

export interface ProductAddition {
  id: string;
  name: string; // Ex: 'Bacon Extra', 'Queijo Cheddar', 'Molho Especial'
  price: number;
  maxQuantity: number;
}

export interface FiscalTaxData {
  ncm: string;          // Ex: '2106.90.90' (Nomenclatura Comum do Mercosul)
  cest?: string;        // Ex: '17.049.00' (Código Especificador da Substituição Tributária)
  cfop: string;         // Ex: '5.102' (Venda interna) ou '5.405' (ST)
  origem: number;       // 0 = Nacional
  cstCsosn: string;     // Ex: '102' (Tributada pelo SN sem permissão de crédito) ou '500'
  aliquotaIcms: number; // Percentual de ICMS (ex: 0 ou 18%)
  aliquotaIbpt: number; // Percentual aprox. tributos (Lei da Transparência)
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl?: string;
  basePrice: number;
  active: boolean;
  availableInKiosk: boolean;
  availableInPdv: boolean;
  sizes: ProductSize[];
  additions: ProductAddition[];
  fiscal: FiscalTaxData;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. PEDIDOS & PRODUÇÃO (KDS)
// ==========================================

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type OrderOrigin = 'TOTEM' | 'PDV_ASSISTIDO' | 'DELIVERY';

export interface SelectedAddition {
  additionId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sizeId?: string;
  sizeName?: string;
  unitPrice: number;
  quantity: number;
  additions: SelectedAddition[];
  notes?: string;
  totalPrice: number;
  fiscal: FiscalTaxData;
}

export type PaymentMethodType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';

export interface OrderPayment {
  id: string;
  method: PaymentMethodType;
  amount: number;
  changeAmount?: number; // Para pagamentos em dinheiro
  tefTransactionId?: string;
  authorizationCode?: string;
  nsu?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVERSED';
  paidAt?: string;
}

export interface Order {
  id: string;
  publicTicketNumber: string; // Senha sequencial do dia (ex: '042', 'A-12')
  origin: OrderOrigin;
  kioskId?: string;
  shiftId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payments: OrderPayment[];
  nfceKey?: string;
  nfceStatus?: 'NOT_EMITTED' | 'AUTHORIZED' | 'CONTINGENCY' | 'CANCELLED' | 'REJECTED';
  nfceXmlUrl?: string;
  clientCpf?: string; // Opcional para nota fiscal
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. CAIXA & TURNOS
// ==========================================

export type ShiftStatus = 'OPEN' | 'CLOSED';

export type CashMovementType = 'INITIAL_SUPPLY' | 'SUPPLY' | 'BLEED_SANGRIA' | 'ORDER_PAYMENT';

export interface CashMovement {
  id: string;
  shiftId: string;
  type: CashMovementType;
  amount: number;
  description: string;
  operatorId: string;
  operatorName: string;
  createdAt: string;
}

export interface PaymentMethodReconciliation {
  method: PaymentMethodType;
  systemCalculatedAmount: number;
  operatorDeclaredAmount?: number;
  difference?: number;
}

export interface Shift {
  id: string;
  terminalId: string; // Identificador do terminal (ex: 'CAIXA-01' ou 'TOTEM-01')
  terminalType: 'PDV' | 'TOTEM';
  operatorId: string;
  operatorName: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  initialCash: number;
  finalCalculatedCash: number;
  finalDeclaredCash?: number;
  cashDifference?: number;
  movements: CashMovement[];
  reconciliation: PaymentMethodReconciliation[];
  notes?: string;
}

// ==========================================
// 4. MOTOR FISCAL (NFC-e)
// ==========================================

export type FiscalEnvironment = 'HOMOLOGATION' | 'PRODUCTION';

export interface FiscalConfig {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  regimeTributario: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  cscId: string;
  cscToken: string;
  certificateA1Path?: string;
  certificateA1Password?: string;
  serieNFCe: number;
  proximoNumeroNFCe: number;
  environment: FiscalEnvironment;
  offlineContingencyEnabled: boolean;
}

export interface NFCeInvoice {
  id: string;
  orderId: string;
  chaveAcesso: string;
  serie: number;
  numero: number;
  status: 'PENDING' | 'AUTHORIZED' | 'CONTINGENCY_PENDING' | 'REJECTED' | 'CANCELLED';
  protocoloAutorizacao?: string;
  motivoRejeicao?: string;
  qrCodeUrl: string;
  digestValue?: string;
  xmlAssinado: string;
  xmlProtocolado?: string;
  emissaoContingencia: boolean;
  justificativaContingencia?: string;
  dataEmissao: string;
}

// ==========================================
// 5. TOTEM & PINPAD (TEF)
// ==========================================

export type KioskStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export interface KioskTerminal {
  id: string;
  name: string;
  ipAddress?: string;
  status: KioskStatus;
  currentShiftId?: string;
  appVersion: string;
  lastHeartbeatAt: string;
  printerStatus: 'READY' | 'OUT_OF_PAPER' | 'ERROR';
  pinpadStatus: 'CONNECTED' | 'DISCONNECTED';
}

export type TEFOperationType = 'CREDIT' | 'DEBIT' | 'PIX_PINPAD';

export type TEFTransactionStatus = 
  | 'INITIALIZING'
  | 'WAITING_CARD_INSERTION'
  | 'WAITING_PASSWORD'
  | 'COMMUNICATING_HOST'
  | 'AUTHORIZED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'FAILED'
  | 'PENDING_REVERSAL';

export interface TEFTransaction {
  id: string;
  orderId: string;
  operationType: TEFOperationType;
  amount: number;
  status: TEFTransactionStatus;
  nsu?: string;
  authorizationCode?: string;
  cardBrand?: string; // Ex: 'Mastercard', 'Visa', 'Elo'
  cardLastDigits?: string; // Ex: '1234'
  acquirerName?: string; // Ex: 'Rede', 'Cielo', 'Stone'
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
