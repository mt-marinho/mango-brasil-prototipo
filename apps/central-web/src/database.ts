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
    {
        "id": "cat-1",
        "name": "Mangas Clássicas",
        "slug": "mangas-classicas",
        "order": 1,
        "icon": "food",
        "active": true
    },
    {
        "id": "cat-2",
        "name": "Mangas Picantes",
        "slug": "mangas-picantes",
        "order": 2,
        "icon": "fire",
        "active": true
    },
    {
        "id": "cat-3",
        "name": "Bebidas Naturais",
        "slug": "bebidas-naturais",
        "order": 3,
        "icon": "tag",
        "active": true
    },
    {
        "id": "cat-4",
        "name": "Combos para Compartilhar",
        "slug": "combos",
        "order": 4,
        "icon": "package",
        "active": true
    }
];

  // Dados fiscais ilustrativos do protótipo em homologação; validar antes de uso real.
  public products: Product[] = [
    {
        "id": "prod-1",
        "categoryId": "cat-1",
        "name": "Manga Limão & Sal",
        "description": "Manga fresquinha em palitos, limão espremido na hora e uma pitada de sal. O clássico brasileiro que dá água na boca.",
        "imageUrl": "/images/manga-classica.png",
        "basePrice": 12.9,
        "active": true,
        "availableInKiosk": true,
        "availableInPdv": true,
        "sizes": [
            {
                "id": "size-1",
                "name": "Copo 300 g",
                "priceModifier": 0
            },
            {
                "id": "size-2",
                "name": "Bowl 500 g",
                "priceModifier": 7
            }
        ],
        "additions": [
            {
                "id": "add-1",
                "name": "Limão extra",
                "price": 1.5,
                "maxQuantity": 2
            },
            {
                "id": "add-2",
                "name": "Mix de pimentas",
                "price": 2,
                "maxQuantity": 2
            },
            {
                "id": "add-3",
                "name": "Melado de cana",
                "price": 2.5,
                "maxQuantity": 2
            }
        ],
        "fiscal": {
            "ncm": "2106.90.90",
            "cfop": "5.102",
            "origem": 0,
            "cstCsosn": "102",
            "aliquotaIcms": 0,
            "aliquotaIbpt": 18.45
        },
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    {
        "id": "prod-2",
        "categoryId": "cat-2",
        "name": "Manga Picante da Casa",
        "description": "Palitos de manga com limão, páprica e mix de pimentas da casa. Ardência equilibrada e muito sabor.",
        "imageUrl": "/images/manga-picante.png",
        "basePrice": 15.9,
        "active": true,
        "availableInKiosk": true,
        "availableInPdv": true,
        "sizes": [
            {
                "id": "size-1",
                "name": "Copo 300 g",
                "priceModifier": 0
            },
            {
                "id": "size-2",
                "name": "Bowl 500 g",
                "priceModifier": 7
            }
        ],
        "additions": [
            {
                "id": "add-1",
                "name": "Limão extra",
                "price": 1.5,
                "maxQuantity": 2
            },
            {
                "id": "add-2",
                "name": "Mix de pimentas",
                "price": 2,
                "maxQuantity": 2
            },
            {
                "id": "add-3",
                "name": "Melado de cana",
                "price": 2.5,
                "maxQuantity": 2
            }
        ],
        "fiscal": {
            "ncm": "2106.90.90",
            "cfop": "5.102",
            "origem": 0,
            "cstCsosn": "102",
            "aliquotaIcms": 0,
            "aliquotaIbpt": 18.45
        },
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    {
        "id": "prod-3",
        "categoryId": "cat-2",
        "name": "Manga Fogo Tropical",
        "description": "Manga temperada com pimenta calabresa, páprica picante e limão. Para quem gosta de uma porção com mais atitude.",
        "imageUrl": "/images/manga-picante.png",
        "basePrice": 17.9,
        "active": true,
        "availableInKiosk": true,
        "availableInPdv": true,
        "sizes": [
            {
                "id": "size-1",
                "name": "Copo 300 g",
                "priceModifier": 0
            },
            {
                "id": "size-2",
                "name": "Bowl 500 g",
                "priceModifier": 7
            }
        ],
        "additions": [
            {
                "id": "add-1",
                "name": "Limão extra",
                "price": 1.5,
                "maxQuantity": 2
            },
            {
                "id": "add-2",
                "name": "Mix de pimentas",
                "price": 2,
                "maxQuantity": 2
            },
            {
                "id": "add-3",
                "name": "Melado de cana",
                "price": 2.5,
                "maxQuantity": 2
            }
        ],
        "fiscal": {
            "ncm": "2106.90.90",
            "cfop": "5.102",
            "origem": 0,
            "cstCsosn": "102",
            "aliquotaIcms": 0,
            "aliquotaIbpt": 18.45
        },
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    {
        "id": "prod-4",
        "categoryId": "cat-3",
        "name": "Suco de Manga Natural",
        "description": "Manga batida na hora com água e gelo. Sem adição de açúcar; peça do seu jeito. Copo de 400 ml.",
        "imageUrl": "/images/mango-bebida.png",
        "basePrice": 8,
        "active": true,
        "availableInKiosk": true,
        "availableInPdv": true,
        "sizes": [
            {
                "id": "size-400",
                "name": "400 ml",
                "priceModifier": 0
            },
            {
                "id": "size-500",
                "name": "500 ml",
                "priceModifier": 2
            }
        ],
        "additions": [],
        "fiscal": {
            "ncm": "2106.90.90",
            "cfop": "5.102",
            "origem": 0,
            "cstCsosn": "102",
            "aliquotaIcms": 0,
            "aliquotaIbpt": 18.45
        },
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    {
        "id": "prod-5",
        "categoryId": "cat-1",
        "name": "Manga Agridoce",
        "description": "O frescor da manga com limão e um toque de melado de cana. Uma combinação doce, cítrica e irresistível.",
        "imageUrl": "/images/manga-classica.png",
        "basePrice": 14.9,
        "active": true,
        "availableInKiosk": true,
        "availableInPdv": true,
        "sizes": [
            {
                "id": "size-1",
                "name": "Copo 300 g",
                "priceModifier": 0
            },
            {
                "id": "size-2",
                "name": "Bowl 500 g",
                "priceModifier": 7
            }
        ],
        "additions": [
            {
                "id": "add-1",
                "name": "Limão extra",
                "price": 1.5,
                "maxQuantity": 2
            },
            {
                "id": "add-2",
                "name": "Mix de pimentas",
                "price": 2,
                "maxQuantity": 2
            },
            {
                "id": "add-3",
                "name": "Melado de cana",
                "price": 2.5,
                "maxQuantity": 2
            }
        ],
        "fiscal": {
            "ncm": "2106.90.90",
            "cfop": "5.102",
            "origem": 0,
            "cstCsosn": "102",
            "aliquotaIcms": 0,
            "aliquotaIbpt": 18.45
        },
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    {
        "id": "prod-6",
        "categoryId": "cat-4",
        "name": "Combo Dupla Tropical",
        "description": "Um copo de Manga Limão & Sal (300 g), um de Manga Picante da Casa (300 g) e um suco de manga de 400 ml para compartilhar.",
        "imageUrl": "/images/mango-combo.png",
        "basePrice": 34.9,
        "active": true,
        "availableInKiosk": true,
        "availableInPdv": true,
        "sizes": [],
        "additions": [],
        "fiscal": {
            "ncm": "2106.90.90",
            "cfop": "5.102",
            "origem": 0,
            "cstCsosn": "102",
            "aliquotaIcms": 0,
            "aliquotaIbpt": 18.45
        },
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    }
];

  public fiscalConfig: FiscalConfig = {
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'MANGO BRASIL ALIMENTOS LTDA',
    nomeFantasia: 'MANGO BRASIL',
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
      name: 'Totem Balcão Mango',
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
          productName: 'Manga Limão & Sal',
          unitPrice: 12.90,
          quantity: 1,
          totalPrice: 14.90,
          additions: [{ additionId: 'add-2', name: 'Mix de pimentas', price: 2.00, quantity: 1 }],
          fiscal: { ncm: '2106.90.90', cfop: '5.102', origem: 0, cstCsosn: '102', aliquotaIcms: 0, aliquotaIbpt: 18.45 }
        }
      ],
      subtotal: 14.90,
      discount: 0,
      total: 14.90,
      payments: [
        {
          id: 'pay-1',
          method: 'CREDIT_CARD',
          amount: 14.90,
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
          productName: 'Manga Picante da Casa',
          unitPrice: 15.90,
          quantity: 2,
          totalPrice: 31.80,
          additions: [],
          fiscal: { ncm: '2106.90.90', cfop: '5.102', origem: 0, cstCsosn: '102', aliquotaIcms: 0, aliquotaIbpt: 18.45 }
        },
        {
          id: 'item-3',
          productId: 'prod-4',
          productName: 'Suco de Manga Natural',
          unitPrice: 8.00,
          quantity: 2,
          totalPrice: 16.00,
          additions: [],
          fiscal: { ncm: '2106.90.90', cfop: '5.102', origem: 0, cstCsosn: '102', aliquotaIcms: 0, aliquotaIbpt: 18.45 }
        }
      ],
      subtotal: 47.80,
      discount: 0,
      total: 47.80,
      payments: [
        {
          id: 'pay-2',
          method: 'PIX',
          amount: 47.80,
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
