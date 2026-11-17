import { GlIcon } from "@/components/gl-icon"
import { MetricCard } from "@/components/page-header"
import { ORDER_STATUS, PAYMENT_LABEL, StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { brl } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"

export function OverviewView({
  data,
  onOpenDanfe,
}: {
  data: CentralData
  onOpenDanfe: (orderId: string) => void
}) {
  const { orders, totems } = data
  const revenue = orders.reduce((acc, o) => acc + o.total, 0)
  const average = orders.length ? revenue / orders.length : 0
  const online = totems.filter((t) => t.status === "ONLINE").length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Faturado Hoje"
          value={brl(revenue)}
          hint="Total geral de pedidos pagos"
          hintClassName="text-success"
        />
        <MetricCard
          label="Pedidos Processados"
          value={orders.length}
          valueClassName="text-primary"
          hint={`Média ${brl(average)} por pedido`}
        />
        <MetricCard
          label="NFC-e Emitidas (SEFAZ)"
          value={orders.length}
          valueClassName="text-success"
          hint="Ambiente de homologação"
        />
        <MetricCard
          label="Totens Operando"
          value={`${online} / ${totems.length}`}
          valueClassName="text-chart-4"
          hint={totems.length && online === totems.length ? "100% de disponibilidade" : "Verifique os totens"}
          hintClassName={online === totems.length ? "text-success" : "text-destructive"}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-4 text-sm font-bold">
          <span>Últimos Pedidos em Tempo Real</span>
          <Button variant="ghost" size="xs" className="text-primary" onClick={() => void data.reloadOrders()}>
            <GlIcon name="retry" /> Recarregar
          </Button>
        </div>
        <Table className="font-mono text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Senha</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status KDS</TableHead>
              <TableHead>NFC-e</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.RECEIVED
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-extrabold text-primary">#{o.publicTicketNumber}</TableCell>
                  <TableCell>
                    <StatusBadge>{o.origin}</StatusBadge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-sans">
                    {o.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                  </TableCell>
                  <TableCell className="font-bold">{brl(o.total)}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {o.payments[0] ? (PAYMENT_LABEL[o.payments[0].method] ?? o.payments[0].method) : "PENDENTE"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={st.tone} icon={st.icon}>
                      {st.label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone="success" icon="check-circle">
                      {o.nfceStatus || "AUTORIZADA"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="xs" onClick={() => onOpenDanfe(o.id)}>
                      <GlIcon name="doc-text" /> Ver DANFE
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
