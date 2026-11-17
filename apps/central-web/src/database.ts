import { 
  FiscalConfig, 
  KioskTerminal, 
  Order, 
  Product, 
  ProductCategory, 
  Shift 
} from '@totem-pdv/shared-types';

export class Database {
  public categories: ProductCategory[] = [
    { id: 'cat-1', name: 'Hambúrgueres Artesanais', slug: 'hamburgueres', order: 1, icon: 'burger', active: true },
    { id: 'cat-2', name: 'Acompanhamentos', slug: 'acompanhamentos', order: 2, icon: 'fries', active: true },
    { id: 'cat-3', name: 'Bebidas Geladas', slug: 'bebidas', order: 3, icon: 'cup', active: true },
    { id: 'cat-4', name: 'Sobremesas', slug: 'sobremesas', order: 4, icon: 'icecream', active: true },
  ];

  public products: Product[] = [
    {
      id: 'prod-1',
      categoryId: 'cat-1',
      name: 'Smash Bacon Supreme',
      description: 'Pão brioche tostado na manteiga, 2x smash burger 100g, queijo cheddar derretido, fatias de bacon crocante e maionese defumada da casa.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      basePrice: 34.90,
      active: true,
      availableInKiosk: true,
      availableInPdv: true,
      sizes: [
        { id: 'size-1', name: 'Padrão (2x carnes 100g)', priceModifier: 0 },
        { id: 'size-2', name: 'Monstruoso (3x carnes 100g)', priceModifier: 9.90 },
      ],
      additions: [
        { id: 'add-1', name: 'Bacon Crocante Extra', price: 4.50, maxQuantity: 3 },
        { id: 'add-2', name: 'Cheddar Inglês Extra', price: 4.00, maxQuantity: 2 },
        { id: 'add-3', name: 'Cebola Caramelizada', price: 3.50, maxQuantity: 2 },
      ],
      fiscal: {
        ncm: '2106.90.90',
        cfop: '5.102',
        origem: 0,
        cstCsosn: '102',
        aliquotaIcms: 0,
        aliquotaIbpt: 18.45
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-2',
      categoryId: 'cat-1',
      name: 'Classic Cheese Salada',
      description: 'Pão brioche, burger artesanal 160g ao ponto, queijo prato especial, alface americana fresca, tomate italiano e molho especial.',
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
      basePrice: 29.90,
      active: true,
      availableInKiosk: true,
      availableInPdv: true,
      sizes: [
        { id: 'size-1', name: 'Individual', priceModifier: 0 },
      ],
      additions: [
        { id: 'add-1', name: 'Bacon Crocante', price: 4.50, maxQuantity: 2 },
        { id: 'add-4', name: 'Picles Artesanal', price: 2.50, maxQuantity: 2 },
      ],
      fiscal: {
        ncm: '2106.90.90',
        cfop: '5.102',
        origem: 0,
        cstCsosn: '102',
        aliquotaIcms: 0,
        aliquotaIbpt: 18.45
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-3',
      categoryId: 'cat-2',
      name: 'Batata Rústica com Alecrim e Parmesão',
      description: 'Batatas selecionadas cortadas rusticamente, fritas na hora, aromatizadas com alecrim fresco e finalizadas com lascas de queijo parmesão.',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
      basePrice: 18.90,
      active: true,
      availableInKiosk: true,
      availableInPdv: true,
      sizes: [
        { id: 'size-p', name: 'Média (200g)', priceModifier: 0 },
        { id: 'size-g', name: 'Grande (350g)', priceModifier: 7.00 },
      ],
      additions: [
        { id: 'add-cheddar-pot', name: 'Pote de Cheddar Cremoso', price: 5.00, maxQuantity: 2 },
        { id: 'add-maionese', name: 'Maionese de Alho Negro', price: 4.00, maxQuantity: 2 },
      ],
      fiscal: {
        ncm: '2004.10.00',
        cfop: '5.102',
        origem: 0,
        cstCsosn: '102',
        aliquotaIcms: 0,
        aliquotaIbpt: 16.50
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-4',
      categoryId: 'cat-3',
      name: 'Refrigerante Lata 350ml',
      description: 'Coca-Cola Original, Coca Zero, Guaraná Antarctica ou Sprite bem gelados.',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
      basePrice: 7.00,
      active: true,
      availableInKiosk: true,
      availableInPdv: true,
      sizes: [],
      additions: [],
      fiscal: {
        ncm: '2202.10.00',
        cest: '03.010.00',
        cfop: '5.405',
        origem: 0,
        cstCsosn: '500', // Cobrado anteriormente por substituição tributária
        aliquotaIcms: 0,
        aliquotaIbpt: 24.20
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-5',
      categoryId: 'cat-4',
      name: 'Milkshake de Nutella com Ninho',
      description: 'Sorvete cremoso batido com leite Ninho legítimo, calda generosa de Nutella e chantilly artesanal.',
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
      basePrice: 22.00,
      active: true,
      availableInKiosk: true,
      availableInPdv: true,
      sizes: [
        { id: 'size-400', name: '400 ml', priceModifier: 0 },
        { id: 'size-500', name: '500 ml', priceModifier: 4.50 },
      ],
      additions: [
        { id: 'add-chantilly', name: 'Chantilly Extra', price: 3.00, maxQuantity: 1 },
      ],
      fiscal: {
        ncm: '2105.00.10',
        cfop: '5.102',
        origem: 0,
        cstCsosn: '102',
        aliquotaIcms: 0,
        aliquotaIbpt: 19.10
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  public fiscalConfig: FiscalConfig = {
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'BURGER TECH RESTAURANTE LTDA',
    nomeFantasia: 'BURGER TECH GOURMET',
    inscricaoEstadual: '283749102',
    regimeTributario: 'SIMPLES_NACIONAL',
    cscId: '000001',
    cscToken: 'A1B2C3D4E5F678901234567890ABCDEF',
    serieNFCe: 1,
    proximoNumeroNFCe: 104,
    environment: 'HOMOLOGATION',
    offlineContingencyEnabled: true
  };

  public shifts: Shift[] = [
    {
      id: 'shift-today',
      terminalId: 'CAIXA-BALCAO-01',
      terminalType: 'PDV',
      operatorId: 'user-op1',
      operatorName: 'Lucas Atendente',
      status: 'OPEN',
      openedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      initialCash: 150.00,
      finalCalculatedCash: 150.00,
      movements: [
        {
          id: 'mov-1',
          shiftId: 'shift-today',
          type: 'INITIAL_SUPPLY',
          amount: 150.00,
          description: 'Abertura de caixa - Fundo de troco inicial',
          operatorId: 'user-op1',
          operatorName: 'Lucas Atendente',
          createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
        }
      ],
      reconciliation: [
        { method: 'CASH', systemCalculatedAmount: 150.00 },
        { method: 'CREDIT_CARD', systemCalculatedAmount: 0.00 },
        { method: 'DEBIT_CARD', systemCalculatedAmount: 0.00 },
        { method: 'PIX', systemCalculatedAmount: 0.00 }
      ]
    }
  ];

  public totems: KioskTerminal[] = [
    {
      id: 'totem-01',
      name: 'Totem Entrada Principal',
      ipAddress: '192.168.15.50',
      status: 'ONLINE',
      currentShiftId: 'shift-totem-1',
      appVersion: '1.0.0',
      lastHeartbeatAt: new Date().toISOString(),
      printerStatus: 'READY',
      pinpadStatus: 'CONNECTED'
    },
    {
      id: 'totem-02',
      name: 'Totem Salão Mezanino',
      ipAddress: '192.168.15.51',
      status: 'ONLINE',
      appVersion: '1.0.0',
      lastHeartbeatAt: new Date(Date.now() - 20 * 1000).toISOString(),
      printerStatus: 'READY',
      pinpadStatus: 'CONNECTED'
    }
  ];

  public orders: Order[] = [
    {
      id: 'ord-101',
      publicTicketNumber: '040',
      origin: 'TOTEM',
      kioskId: 'totem-01',
      shiftId: 'shift-today',
      status: 'READY',
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productName: 'Smash Bacon Supreme',
          unitPrice: 34.90,
          quantity: 1,
          totalPrice: 38.90,
          additions: [{ additionId: 'add-2', name: 'Cheddar Inglês Extra', price: 4.00, quantity: 1 }],
          fiscal: { ncm: '2106.90.90', cfop: '5.102', origem: 0, cstCsosn: '102', aliquotaIcms: 0, aliquotaIbpt: 18.45 }
        }
      ],
      subtotal: 38.90,
      discount: 0,
      total: 38.90,
      payments: [
        {
          id: 'pay-1',
          method: 'CREDIT_CARD',
          amount: 38.90,
          status: 'APPROVED',
          nsu: '984712',
          authorizationCode: '612849',
          paidAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        }
      ],
      nfceKey: '50241112345678000190650010000001021873912834',
      nfceStatus: 'AUTHORIZED',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'ord-102',
      publicTicketNumber: '041',
      origin: 'TOTEM',
      kioskId: 'totem-01',
      shiftId: 'shift-today',
      status: 'PREPARING',
      items: [
        {
          id: 'item-2',
          productId: 'prod-2',
          productName: 'Classic Cheese Salada',
          unitPrice: 29.90,
          quantity: 2,
          totalPrice: 59.80,
          additions: [],
          fiscal: { ncm: '2106.90.90', cfop: '5.102', origem: 0, cstCsosn: '102', aliquotaIcms: 0, aliquotaIbpt: 18.45 }
        },
        {
          id: 'item-3',
          productId: 'prod-4',
          productName: 'Refrigerante Lata 350ml',
          unitPrice: 7.00,
          quantity: 2,
          totalPrice: 14.00,
          additions: [],
          fiscal: { ncm: '2202.10.00', cfop: '5.405', origem: 0, cstCsosn: '500', aliquotaIcms: 0, aliquotaIbpt: 24.20 }
        }
      ],
      subtotal: 73.80,
      discount: 0,
      total: 73.80,
      payments: [
        {
          id: 'pay-2',
          method: 'PIX',
          amount: 73.80,
          status: 'APPROVED',
          nsu: '512948',
          paidAt: new Date(Date.now() - 6 * 60 * 1000).toISOString()
        }
      ],
      nfceKey: '50241112345678000190650010000001031983019284',
      nfceStatus: 'AUTHORIZED',
      createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString()
    }
  ];

  public nextTicketSequence: number = 42;
}

export const db = new Database();
