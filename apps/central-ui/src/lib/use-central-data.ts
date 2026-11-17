import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { Category, Order, Product, Shift, Totem } from "@/lib/types"

export interface CentralData {
  categories: Category[]
  products: Product[]
  orders: Order[]
  kdsOrders: Order[]
  totems: Totem[]
  shift: Shift | null
  reload: () => Promise<void>
  reloadOrders: () => Promise<void>
}

const POLL_MS = 4000

/** Carrega e mantém sincronizados os dados da API central (polling a cada 4s). */
export function useCentralData(): CentralData {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [kdsOrders, setKdsOrders] = useState<Order[]>([])
  const [totems, setTotems] = useState<Totem[]>([])
  const [shift, setShift] = useState<Shift | null>(null)

  const reloadOrders = useCallback(async () => {
    try {
      const [all, kds] = await Promise.all([api.orders(), api.kds()])
      setOrders(all)
      setKdsOrders(kds)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const reload = useCallback(async () => {
    await Promise.all([
      api.categories().then(setCategories).catch(console.error),
      api.products().then(setProducts).catch(console.error),
      api.totems().then(setTotems).catch(console.error),
      api
        .currentShift()
        .then((d) => setShift(d.open && d.shift ? d.shift : null))
        .catch(console.error),
      reloadOrders(),
    ])
  }, [reloadOrders])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
    const id = setInterval(() => void reloadOrders(), POLL_MS)
    return () => clearInterval(id)
  }, [reload, reloadOrders])

  return { categories, products, orders, kdsOrders, totems, shift, reload, reloadOrders }
}
