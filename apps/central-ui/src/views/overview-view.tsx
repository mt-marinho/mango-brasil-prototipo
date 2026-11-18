import { GlIcon } from "@/components/gl-icon"
import { ORDER_STATUS, PAYMENT_LABEL, StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { brl } from "@/lib/format"
import type { Order } from "@/lib/types"
import type { CentralData } from "@/lib/use-central-data"
import { SalesAnalytics } from "@/views/sales-analytics"

const fiscalLabels: Record<string, string> = { AUTHORIZED: "Autorizada", NOT_EMITTED: "Não emitida", REJECTED: "Rejeitada", PENDING: "Pendente", CONTINGENCY: "Em contingência" }
const originLabels: Record<string, string> = { TOTEM: "Totem", PDV_ASSISTED: "PDV assistido" }

function fiscalStatus(order: Order) {
  const status = order.nfceStatus || ""
  return { label: fiscalLabels[status] || status || "Não informada", authorized: status === "AUTHORIZED" }
}

export function OverviewView({ data, onOpenDanfe }: { data: CentralData; onOpenDanfe: (orderId: string) => void }) {
  const now = new Date()
  const isToday = (value: string) => {
    const date = new Date(value)
    return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  }
  const todayOrders = data.orders.filter((order) => isToday(order.createdAt))
  const paidOrders = todayOrders.filter((order) => order.payments.some((payment) => payment.status === "APPROVED" && payment.paidAt && isToday(payment.paidAt)))
  const revenue = todayOrders.flatMap((order) => order.payments).filter((payment) => payment.status === "APPROVED" && payment.paidAt && isToday(payment.paidAt)).reduce((sum, payment) => sum + payment.amount, 0)
  const paymentsToday = data.orders.flatMap((order) => order.payments).filter((payment) => payment.status === "APPROVED" && payment.paidAt && isToday(payment.paidAt))
  const receivedToday = paymentsToday.reduce((sum, payment) => sum + payment.amount, 0)
  const pending = data.orders.filter((order) => order.status === "RECEIVED" || order.status === "PREPARING").length
  const ready = data.orders.filter((order) => order.status === "READY").length
  const authorized = todayOrders.filter((order) => order.nfceStatus === "AUTHORIZED").length
  const online = data.totems.filter((totem) => totem.status === "ONLINE").length
  const recent = [...data.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
  const cards = [
    { label: "Recebido hoje", value: brl(receivedToday), hint: "Pagamentos aprovados hoje", icon: "money" },
    { label: "Pedidos pagos hoje", value: String(paidOrders.length), hint: `Ticket médio ${brl(paidOrders.length ? revenue / paidOrders.length : 0)}`, icon: "check-circle" },
    { label: "Na fila de preparo", value: String(pending), hint: `${ready} ${ready === 1 ? "pedido pronto" : "pedidos prontos"} para retirada`, icon: "time" },
    { label: "NFC-e autorizadas", value: String(authorized), hint: `${todayOrders.length} pedidos criados hoje`, icon: "doc-text" },
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-xl font-semibold tracking-tight">Visão geral</h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe as vendas e a operação de hoje.</p></div>
        <span className="text-sm text-muted-foreground">{now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => <div key={card.label} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-muted-foreground">{card.label}</p></div><p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{card.value}</p><p className="mt-1 text-xs text-muted-foreground">{card.hint}</p></div>)}
      </div>
      <SalesAnalytics orders={data.orders} catalog={data.products} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-5 py-4 text-sm"><GlIcon name="tablet" className="size-5 text-muted-foreground" /><span className="font-semibold">Totens</span><StatusBadge tone={data.totems.length > 0 && online === data.totems.length ? "success" : "neutral"} icon="check-circle" className="font-sans normal-case">{online} de {data.totems.length} online</StatusBadge><span className="text-xs text-muted-foreground">Situação informada pelos dispositivos</span></div>
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"><div><h2 className="font-semibold">Pedidos recentes</h2><p className="mt-1 text-xs text-muted-foreground">Últimos pedidos registrados, de todas as datas.</p></div><Button variant="outline" size="sm" onClick={() => void data.reloadOrders()}><GlIcon name="retry" /> Atualizar</Button></div>
        {recent.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum pedido registrado.</p> : <Table><TableHeader><TableRow><TableHead>Senha</TableHead><TableHead>Origem</TableHead><TableHead>Itens</TableHead><TableHead>Total</TableHead><TableHead>Pagamento</TableHead><TableHead>Preparo</TableHead><TableHead>NFC-e</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>
          {recent.map((order) => { const status = ORDER_STATUS[order.status]; const fiscal = fiscalStatus(order); return <TableRow key={order.id}>
            <TableCell className="font-semibold">#{order.publicTicketNumber}</TableCell><TableCell>{originLabels[order.origin] || order.origin}</TableCell><TableCell className="max-w-xs truncate" title={order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}>{order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</TableCell><TableCell className="font-semibold tabular-nums">{brl(order.total)}</TableCell><TableCell>{order.payments.length ? order.payments.map((payment) => PAYMENT_LABEL[payment.method] || payment.method).join(", ") : "Pendente"}</TableCell><TableCell><StatusBadge tone={status?.tone || "neutral"} icon={status?.icon} className="font-sans">{status?.label || order.status}</StatusBadge></TableCell><TableCell><StatusBadge tone={fiscal.authorized ? "success" : "neutral"} icon={fiscal.authorized ? "check-circle" : undefined} className="font-sans normal-case">{fiscal.label}</StatusBadge></TableCell><TableCell className="text-right">{fiscal.authorized && order.nfceKey ? <Button variant="outline" size="sm" onClick={() => onOpenDanfe(order.id)}><GlIcon name="doc-text" /> Ver DANFE</Button> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
          </TableRow> })}
        </TableBody></Table>}
      </section>
    </div>
  )
}
