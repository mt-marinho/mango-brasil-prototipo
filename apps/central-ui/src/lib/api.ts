import type { Category, Order, OrderStatus, Product, Shift, Totem } from "./types"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init })
  if (!res.ok) throw new Error(`Falha na requisição (${res.status})`)
  return res.json() as Promise<T>
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})


export const api = {
  categories: () => request<Category[]>("/api/categories"),
  products: () => request<Product[]>("/api/products"),
  orders: () => request<Order[]>("/api/orders"),
  kds: () => request<Order[]>("/api/orders/kds"),
  totems: () => request<Totem[]>("/api/totems"),
  currentShift: () =>
    request<{ open: boolean; shift?: Shift }>("/api/shifts/current"),
  toggleProduct: (id: string) =>
    request<{ success: boolean }>(`/api/products/${id}/toggle`, { method: "PATCH" }),
  createOrder: (payload: unknown) =>
    request<Order>("/api/orders", json("POST", payload)),
  updateStatus: (id: string, status: OrderStatus) =>
    request<unknown>(`/api/orders/${id}/status`, json("PATCH", { status })),
  movement: (body: { type: string; amount: number; description: string }) =>
    request<unknown>("/api/shifts/movement", json("POST", body)),
  closeShift: (body: Record<string, number>) =>
    request<{ cashDifference: number; finalCalculatedCash: number }>(
      "/api/shifts/close",
      json("POST", body),
    ),
}
