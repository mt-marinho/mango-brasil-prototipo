import { useState } from "react"
import { GlIcon } from "@/components/gl-icon"
import { StatusBadge, type Tone } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { brl } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"

const fiscalStatuses: Record<string, { label: string; tone: Tone; icon: string }> = {
  AUTHORIZED: { label: "Autorizada", tone: "success", icon: "check-circle" },
  NOT_EMITTED: { label: "Não emitida", tone: "neutral", icon: "dash" },
  CONTINGENCY: { label: "Em contingência", tone: "warning", icon: "warning" },
  CONTINGENCY_PENDING: { label: "Em contingência", tone: "warning", icon: "warning" },
  REJECTED: { label: "Rejeitada", tone: "danger", icon: "status_failed" },
  PENDING: { label: "Pendente", tone: "warning", icon: "clock" },
}

export function FiscalView({ data, onOpenDanfe }: { data: CentralData; onOpenDanfe: (orderId: string) => void }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const sorted = [...data.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const authorized = sorted.filter((order) => order.nfceStatus === "AUTHORIZED").length
  const contingency = sorted.filter((order) => ["CONTINGENCY", "CONTINGENCY_PENDING"].includes(order.nfceStatus || "")).length
  const notEmitted = sorted.filter((order) => !order.nfceStatus || order.nfceStatus === "NOT_EMITTED").length
  const filtered = sorted.filter((order) => {
    const status = order.nfceStatus || "NOT_INFORMED"
    const matchesStatus = filter === "all" || (filter === "CONTINGENCY" ? ["CONTINGENCY", "CONTINGENCY_PENDING"].includes(status) : filter === "NOT_EMITTED" ? ["NOT_EMITTED", "NOT_INFORMED"].includes(status) : status === filter)
    return matchesStatus && `${order.publicTicketNumber} ${order.nfceKey || ""}`.toLowerCase().includes(query.trim().toLowerCase())
  })
  const cards = [
    { label: "Autorizadas", value: authorized, icon: "check-circle", hint: "Pedidos com status autorizado" },
    { label: "Em contingência", value: contingency, icon: "warning", hint: "Pedidos registrados em contingência" },
    { label: "Não emitidas", value: notEmitted, icon: "doc-text", hint: "Sem emissão ou sem status informado" },
  ]
  return <div className="space-y-6">
    <div><h1 className="text-xl font-semibold tracking-tight">Notas fiscais</h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe a situação fiscal dos pedidos e consulte os documentos disponíveis.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">{cards.map((card) => <div key={card.label} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-muted-foreground">{card.label}</p></div><p className="mt-3 text-2xl font-semibold tabular-nums">{card.value}</p><p className="mt-1 text-xs text-muted-foreground">{card.hint}</p></div>)}</div>
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b p-5"><div><h2 className="font-semibold">Situação dos pedidos</h2><p className="mt-1 text-xs text-muted-foreground">Consulte o status fiscal, a chave e o valor de cada pedido.</p></div><div className="flex flex-wrap gap-2"><div className="relative"><GlIcon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar por senha ou chave" placeholder="Buscar senha ou chave" className="h-9 w-56 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select aria-label="Filtrar por status fiscal" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Todos os status</option><option value="AUTHORIZED">Autorizadas</option><option value="CONTINGENCY">Em contingência</option><option value="NOT_EMITTED">Não emitidas</option><option value="PENDING">Pendentes</option><option value="REJECTED">Rejeitadas</option></select></div></div>
      {filtered.length === 0 ? <div className="px-5 py-12 text-center"><p className="text-sm font-medium">Nenhum pedido encontrado</p><p className="mt-1 text-xs text-muted-foreground">Experimente alterar a busca ou o filtro.</p></div> : <Table><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Data</TableHead><TableHead>Chave de acesso</TableHead><TableHead>Valor</TableHead><TableHead>Situação fiscal</TableHead><TableHead className="text-right">Documento</TableHead></TableRow></TableHeader><TableBody>{filtered.map((order) => { const status = fiscalStatuses[order.nfceStatus || ""] || { label: order.nfceStatus || "Não informada", tone: "neutral" as Tone, icon: "dash" }; const date = new Date(order.createdAt); return <TableRow key={order.id}><TableCell className="font-semibold">#{order.publicTicketNumber}</TableCell><TableCell className="text-muted-foreground">{Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</TableCell><TableCell className="max-w-xs truncate font-mono text-xs" title={order.nfceKey || "Sem chave de acesso"}>{order.nfceKey || "—"}</TableCell><TableCell className="font-semibold tabular-nums">{brl(order.total)}</TableCell><TableCell><StatusBadge tone={status.tone} icon={status.icon} className="font-sans font-medium normal-case">{status.label}</StatusBadge></TableCell><TableCell className="text-right">{order.nfceStatus === "AUTHORIZED" && order.nfceKey ? <Button variant="outline" size="sm" onClick={() => onOpenDanfe(order.id)}><GlIcon name="doc-text" /> Ver DANFE</Button> : <span className="text-xs text-muted-foreground">Indisponível</span>}</TableCell></TableRow> })}</TableBody></Table>}
      <div className="border-t px-5 py-3 text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "pedido exibido" : "pedidos exibidos"}</div>
    </section>
  </div>
}
