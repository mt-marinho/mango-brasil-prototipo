import { useEffect, useState } from "react"

import { GlIcon } from "@/components/gl-icon"
import { ORDER_STATUS, StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { elapsed } from "@/lib/format"
import type { Order, OrderStatus } from "@/lib/types"
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

function exampleOrders(): Order[] {
  const examples = [
    { ticket: "036", origin: "TOTEM", items: [["Manga Picante da Casa", 2], ["Suco de Manga Natural", 1]] as const, minutes: 150 },
    { ticket: "035", origin: "PDV_ASSISTIDO", items: [["Combo Dupla Tropical", 1]] as const, minutes: 195 },
    { ticket: "034", origin: "TOTEM", items: [["Manga Limão & Sal", 1], ["Manga Fogo Tropical", 1]] as const, minutes: 240 },
    { ticket: "033", origin: "PDV_ASSISTIDO", items: [["Manga Agridoce", 2]] as const, minutes: 290 },
  ]
  return examples.map(({ ticket, origin, items, minutes }) => ({
    id: `kds-example-${ticket}`,
    publicTicketNumber: ticket,
    origin,
    status: "DELIVERED",
    total: 0,
    payments: [],
    createdAt: new Date(Date.now() - minutes * 60_000).toISOString(),
    items: items.map(([productName, quantity], index) => ({
      id: `kds-example-${ticket}-${index}`,
      productId: "",
      productName,
      quantity,
      unitPrice: 0,
      totalPrice: 0,
    })),
  }))
}

export function KdsView({ data }: { data: CentralData }) {
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [examples] = useState(exampleOrders)
  const [tab, setTab] = useState("queue")
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
  const history = [...data.orders.filter((order) => order.status === "DELIVERED"), ...examples]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())


  return (
    <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList aria-label="Visualização do preparo" className="w-max justify-start gap-1 bg-muted/60 p-1 group-data-horizontal/tabs:h-11">
          <TabsTrigger value="queue" className="flex-none px-4 data-active:border-primary/50 data-active:bg-primary/10 data-active:text-foreground dark:data-active:border-primary/50 dark:data-active:bg-primary/10">Fila de preparo</TabsTrigger>
          <TabsTrigger value="history" className="flex-none px-4 data-active:border-primary/50 data-active:bg-primary/10 data-active:text-foreground dark:data-active:border-primary/50 dark:data-active:bg-primary/10">Histórico de pedidos</TabsTrigger>
        </TabsList>
        {tab === "queue" && (
        <div aria-label="Resumo dos pedidos" className="flex flex-wrap gap-2">
          {counts.map(({ status, label, count }) => (
            <div key={status} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold tabular-nums text-foreground">{count}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      <TabsContent value="queue">
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
                  <StatusBadge tone={status.tone} icon={status.icon} className={cn("h-7 font-sans text-xs font-medium normal-case", order.status === "PREPARING" && "bg-primary/15 text-primary dark:text-primary")}>
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
                      className="h-10 w-full font-medium"
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
      </TabsContent>
      <TabsContent value="history">
      <section aria-label="Histórico de pedidos" className="space-y-4">
        <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4"><h3 className="text-sm font-semibold">Pedidos registrados</h3><span className="text-xs text-muted-foreground">{history.length} {history.length === 1 ? "pedido" : "pedidos"}</span></div>
        <div className="divide-y">
          {history.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold tabular-nums">#{order.publicTicketNumber} <span className="ml-2 text-xs font-normal text-muted-foreground">{ORIGINS[order.origin] ?? order.origin}{order.id.startsWith("kds-example-") ? " · Exemplo" : ""}</span></p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{order.items.map((item) => `${item.quantity}× ${item.productName}`).join(" · ")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                <StatusBadge tone="neutral" icon="check" className="font-sans text-xs font-medium normal-case">Entregue</StatusBadge>
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum pedido entregue ainda.</p>}
        </div>
        </div>
      </section>
      </TabsContent>
    </Tabs>
  )
}
