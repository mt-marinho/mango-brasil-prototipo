import { GlIcon } from "@/components/gl-icon"
import { SectionHeader } from "@/components/page-header"
import { ORDER_STATUS, StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { brl, elapsed } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"
import type { OrderStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACTIONS: Record<string, { next: OrderStatus; label: string; icon: string; className: string }> = {
  RECEIVED: {
    next: "PREPARING",
    label: "Iniciar Preparo",
    icon: "play",
    className: "bg-primary text-primary-foreground hover:bg-primary/80",
  },
  PREPARING: {
    next: "READY",
    label: "Marcar como Pronto",
    icon: "notifications",
    className: "bg-success text-black hover:bg-success/80",
  },
  READY: {
    next: "DELIVERED",
    label: "Entregar ao Cliente",
    icon: "check",
    className: "bg-secondary text-secondary-foreground hover:bg-accent",
  },
}

export function KdsView({ data }: { data: CentralData }) {
  async function advance(id: string, status: OrderStatus) {
    try {
      await api.updateStatus(id, status)
      await data.reloadOrders()
    } catch (e) {
      alert("Erro ao atualizar status: " + (e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Fila de Produção da Cozinha (KDS Tablet)"
        description="Pedidos pagos aguardando preparo e expedição"
      >
        <Button variant="outline" size="sm" onClick={() => void data.reloadOrders()}>
          <GlIcon name="retry" /> Atualizar Cozinha
        </Button>
      </SectionHeader>

      {data.kdsOrders.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 font-mono text-muted-foreground">
          <GlIcon name="check-circle" className="size-5" />
          Nenhum pedido pendente na cozinha. Tudo entregue!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {data.kdsOrders.map((o) => {
            const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.RECEIVED
            const action = ACTIONS[o.status]
            return (
              <div
                key={o.id}
                className={cn(
                  "flex flex-col justify-between space-y-3 rounded-2xl border bg-card p-4",
                  o.status === "READY" && "border-success/60 shadow-lg shadow-success/10",
                  o.status === "PREPARING" && "border-primary/60 shadow-lg shadow-primary/10",
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-mono text-2xl font-extrabold text-primary">
                      #{o.publicTicketNumber}
                    </span>
                    <StatusBadge tone={st.tone} icon={st.icon}>
                      {st.label}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      Origem: <strong>{o.origin}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <GlIcon name="clock" className="size-3" />
                      há {elapsed(o.createdAt)}
                    </span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {o.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-start justify-between border-b py-1 text-xs"
                      >
                        <span className="font-bold">
                          {it.quantity}x {it.productName}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {brl(it.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {action && (
                  <div className="border-t pt-3">
                    <Button
                      className={cn("w-full font-extrabold", action.className)}
                      onClick={() => void advance(o.id, action.next)}
                    >
                      <GlIcon name={action.icon} /> {action.label}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
