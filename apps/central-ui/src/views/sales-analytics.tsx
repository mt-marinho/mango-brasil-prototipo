import { useState } from "react"
import { RevenueChart } from "@/views/revenue-chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PAYMENT_LABEL } from "@/components/status-badge"
import { brl } from "@/lib/format"
import type { Order, Product } from "@/lib/types"

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const dateKey = (value: string) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? "" : dayKey(d) }
const sevenDaysAgo = () => { const d = new Date(); d.setDate(d.getDate() - 6); return dayKey(d) }
const colors = ["#facc15", "#3b82f6", "#10b981", "#f97316", "#d946ef"]

export function SalesAnalytics({ orders, catalog }: { orders: Order[]; catalog: Product[] }) {
  const [start, setStart] = useState(sevenDaysAgo)
  const [end, setEnd] = useState(() => dayKey(new Date()))
  const valid = Boolean(start && end && start <= end)
  const payments = valid ? orders.flatMap((order) => order.payments.filter((p) => p.status === "APPROVED" && p.paidAt && dateKey(p.paidAt) >= start && dateKey(p.paidAt) <= end).map((payment) => ({ payment, order }))) : []
  const total = payments.reduce((sum, { payment }) => sum + payment.amount, 0)
  const byDay = new Map<string, number>()
  const byMethod = new Map<string, number>()
  for (const { payment } of payments) {
    const date = dateKey(payment.paidAt!)
    byDay.set(date, (byDay.get(date) || 0) + payment.amount)
    byMethod.set(payment.method, (byMethod.get(payment.method) || 0) + payment.amount)
  }
  const byProduct = new Map<string, { name: string; quantity: number; total: number; id: string }>()
  const paidIds = new Set(payments.map(({ order }) => order.id))
  for (const order of orders.filter((o) => paidIds.has(o.id))) for (const item of order.items) {
    const current = byProduct.get(item.productId) || { name: item.productName, quantity: 0, total: 0, id: item.productId }
    current.quantity += item.quantity
    current.total += item.totalPrice
    byProduct.set(item.productId, current)
  }
  const products = [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)
  const methods = [...byMethod.entries()].sort((a, b) => b[1] - a[1])
  let angle = 0
  const gradient = methods.map(([, value], i) => { const startAngle = angle; angle += total ? value / total * 100 : 0; return `${colors[i % colors.length]} ${startAngle}% ${angle}%` }).join(", ")
  const dates: string[] = []
  if (valid) {
    const cursor = new Date(`${start}T12:00:00`)
    const limit = new Date(`${end}T12:00:00`)
    while (cursor <= limit && dates.length < 366) { dates.push(dayKey(cursor)); cursor.setDate(cursor.getDate() + 1) }
  }
  const tooLong = dates.length === 366 && dates[dates.length - 1] !== end
  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-lg font-semibold">Análise de vendas</h2><p className="mt-1 text-xs text-muted-foreground">Pagamentos aprovados no período selecionado</p></div>
      <div className="flex flex-wrap items-end gap-2"><label className="space-y-1 text-xs text-muted-foreground"><span className="block">De</span><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label><label className="space-y-1 text-xs text-muted-foreground"><span className="block">Até</span><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label><Button variant="outline" size="sm" onClick={() => { setStart(sevenDaysAgo()); setEnd(dayKey(new Date())) }}>Últimos 7 dias</Button></div>
    </div>
    {!valid ? <p role="alert" className="text-sm text-destructive">Selecione um período válido.</p> : tooLong ? <p role="alert" className="text-sm text-destructive">Selecione um período de até 366 dias.</p> : <>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 xl:col-span-2"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">Recebimentos por dia</h3><p className="mt-1 text-xs text-muted-foreground">Total de pagamentos aprovados por data</p></div><span className="font-semibold tabular-nums">{brl(total)}</span></div>
          {payments.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Nenhum pagamento aprovado no período.</p> : <RevenueChart dates={dates} values={dates.map((date) => byDay.get(date) || 0)} />}
        </div>
        <div className="rounded-xl border bg-card p-5"><h3 className="font-semibold">Formas de pagamento</h3><p className="mt-1 text-xs text-muted-foreground">Participação no valor recebido</p>{total > 0 ? <div className="mt-5 flex flex-wrap items-center justify-center gap-6"><div className="relative size-32 shrink-0 rounded-full" role="img" aria-label="Distribuição por forma de pagamento" style={{ background: `conic-gradient(${gradient})` }}><div className="absolute inset-3 flex items-center justify-center rounded-full bg-card text-xs font-semibold">{brl(total)}</div></div><ul className="min-w-36 flex-1 space-y-3">{methods.map(([method, value], i) => <li key={method} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />{PAYMENT_LABEL[method as keyof typeof PAYMENT_LABEL] || method}</span><span className="font-medium tabular-nums">{(value / total * 100).toFixed(1).replace(".", ",")}% · {brl(value)}</span></li>)}</ul></div> : <p className="py-16 text-center text-sm text-muted-foreground">Sem pagamentos no período.</p>}</div>
      </div>
      <div className="rounded-xl border bg-card p-5"><h3 className="font-semibold">Produtos mais pedidos</h3><p className="mt-1 text-xs text-muted-foreground">Quantidade em pedidos com pagamento aprovado no período</p>{products.length ? <ol className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">{products.map((product, index) => <li key={product.name} className="flex items-center gap-3 text-sm"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">{index + 1}</span><img src={catalog.find((item) => item.id === product.id)?.imageUrl} alt="" className="size-10 shrink-0 rounded-md bg-muted object-cover" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{product.name}</span><span className="text-xs text-muted-foreground">Média por unidade: {brl(product.quantity ? product.total / product.quantity : 0)}</span></span><span className="text-xs font-semibold tabular-nums">{product.quantity} un.</span></li>)}</ol> : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto no período.</p>}</div>
    </>}
  </section>
}
