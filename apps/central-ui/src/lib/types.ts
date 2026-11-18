export interface Category {
  id: string
  name: string
  order: number
  active: boolean
}

export interface ProductFiscal {
  ncm: string
  cfop: string
  aliquotaIbpt?: number
}

export interface Product {
  id: string
  categoryId: string
  name: string
  description: string
  imageUrl: string
  basePrice: number
  active: boolean
  fiscal: ProductFiscal
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  totalPrice: number
  fiscal?: ProductFiscal
}

export interface OrderPayment {
  id: string
  method: PaymentMethod
  amount: number
  status: string
  paidAt?: string
}

export type OrderStatus = "RECEIVED" | "PREPARING" | "READY" | "DELIVERED"

export interface Order {
  id: string
  publicTicketNumber: number | string
  origin: string
  status: OrderStatus
  total: number
  items: OrderItem[]
  payments: OrderPayment[]
  nfceKey?: string
  nfceStatus?: string
  createdAt: string
}

export type PaymentMethod = "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "PIX"

export interface CashMovement {
  id: string
  type: string
  amount: number
  description: string
  operatorName: string
  createdAt: string
}

export interface Shift {
  terminalId?: string
  operatorName?: string
  openedAt?: string
  finalCalculatedCash: number
  movements: CashMovement[]
  reconciliation: { method: string; systemCalculatedAmount: number }[]
}

export interface Totem {
  id: string
  name: string
  ipAddress: string
  appVersion: string
  status: string
  printerStatus: string
  pinpadStatus: string
}
