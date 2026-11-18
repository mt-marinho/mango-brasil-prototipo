import { useEffect, useState } from "react"

import { GlIcon } from "@/components/gl-icon"
import { ORDER_STATUS, StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { elapsed } from "@/lib/format"
import type { OrderStatus } from "@/lib/types"
import type { CentralData } from "@/lib/use-central-data"
import { cn } from "@/lib/utils"

const ACTIONS: Record<string, { next: OrderStatus; label: string; icon: string }> = {
  RECEIVED: { next: "PREPARING", label: "Iniciar preparo", icon: "play" },
  PREPARING: { next: "READY", label: "Marcar como pronto", icon: "check" },
  READY: { next: "DELIVERED", label: "Confirmar entrega", icon: "check" },
}

const ORIGINS: Record<string, string> = {
  TOTEM: "Totem",
  PDV_ASSISTIDO: "Balcão",
  PDV_ASSISTED: "Balcão",
  DELIVERY: "Delivery",
}

export function KdsView({ data }: { data: CentralData }) {
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, setClock] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => setClock((value) => value + 1), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  async function advance(id: string, status: OrderStatus) {
    setPending((current) => ({ ...current, [id]: true }))
    setErrors((current) => ({ ...current, [id]: "" }))
    try {
      await api.updateStatus(id, status)
      await data.reloadOrders()
    } catch {
      setErrors((current) => ({ ...current, [id]: "Não foi possível atualizar. Tente novamente." }))
    } finally {
      setPending((current) => ({ ...current, [id]: false }))
    }
  }

  const counts = [
    { status: "RECEIVED", label: "Aguardando" },
    { status: "PREPARING", label: "Em preparo" },
    { status: "READY", label: "Prontos" },
  ].map((item) => ({ ...item, count: data.kdsOrders.filter((order) => order.status === item.status).length }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Fila de preparo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe os pedidos, do preparo até a entrega.</p>
        </div>
        <div aria-label="Resumo dos pedidos" className="flex flex-wrap gap-2">
          {counts.map(({ status, label, count }) => (
            <div key={status} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold tabular-nums text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {data.kdsOrders.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"><GlIcon name="check-circle" className="size-5" /></div>
          <h2 className="mt-4 text-sm font-semibold">Nenhum pedido na fila</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Os novos pedidos aparecem aqui quando forem enviados para preparo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.kdsOrders.map((order) => {
            const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.RECEIVED
            const action = ACTIONS[order.status]
            const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)
            return (
              <article key={order.id} aria-label={`Pedido ${order.publicTicketNumber}`} className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Pedido</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight tabular-nums">#{order.publicTicketNumber}</h2>
                  </div>
                  <StatusBadge tone={status.tone} icon={status.icon} className="h-7 font-sans text-xs font-medium normal-case">
                    {order.status === "RECEIVED" ? "Aguardando" : order.status === "PREPARING" ? "Em preparo" : order.status === "READY" ? "Pronto" : status.label}
                  </StatusBadge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-4 text-xs text-muted-foreground">
                  <span>{ORIGINS[order.origin] ?? order.origin}</span>
                  <span className="inline-flex items-center gap-1.5"><GlIcon name="clock" className="size-3.5" /> Há {elapsed(order.createdAt)}</span>
                </div>
                <div className="flex-1 px-5 pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "itens"}</p>
                  <ul className="mt-3 space-y-4">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold tabular-nums">{item.quantity}×</span>
                        <div className="min-w-0 pt-1">
                          <p className="text-sm leading-5 font-medium">{item.productName}{item.sizeName ? ` · ${item.sizeName}` : ""}</p>
                          {!!item.additions?.length && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.additions.map((addition) => `+ ${addition.quantity > 1 ? `${addition.quantity}× ` : ""}${addition.name}`).join(", ")}</p>}
                          {item.notes && <p className="mt-1 text-xs leading-5 text-muted-foreground">Observação: {item.notes}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {action && (
                  <div className="px-5 pb-5 pt-2">
                    {errors[order.id] && <p role="alert" className="mb-2 text-xs text-destructive">{errors[order.id]}</p>}
                    <Button
                      variant={order.status === "READY" ? "secondary" : "default"}
                      className={cn("h-10 w-full font-medium", order.status === "PREPARING" && "bg-success text-black hover:bg-success/80")}
                      disabled={pending[order.id]}
                      onClick={() => void advance(order.id, action.next)}
                    >
                      <GlIcon name={action.icon} /> {pending[order.id] ? "Atualizando…" : action.label}
                    </Button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
