import { useState } from "react"

import { GlIcon } from "@/components/gl-icon"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import { brl } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"

export type CashModal = null | "sangria" | "suprimento" | "fechamento"

const MOVEMENT_LABELS: Record<string, { label: string; icon: string; tone: "success" | "danger" | "info" }> = {
  INITIAL_SUPPLY: { label: "Abertura", icon: "arrow-up", tone: "success" },
  SUPPLY: { label: "Suprimento", icon: "arrow-up", tone: "success" },
  BLEED_SANGRIA: { label: "Sangria", icon: "arrow-down", tone: "danger" },
  ORDER_PAYMENT: { label: "Venda", icon: "credit-card", tone: "info" },
}

export function CaixaView({ data, modal, onModalChange }: {
  data: CentralData
  modal: CashModal
  onModalChange: (modal: CashModal) => void
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const shift = data.shift
  const movements = shift?.movements ?? []
  const reconciled = (method: string) =>
    shift?.reconciliation.find((r) => r.method === method)?.systemCalculatedAmount ?? 0
  const cardTotal = reconciled("CREDIT_CARD") + reconciled("DEBIT_CARD")
  const opened = shift?.openedAt
    ? new Date(shift.openedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : null

  const metrics = [
    { label: "Dinheiro em caixa", value: shift ? brl(shift.finalCalculatedCash) : "—", hint: "Saldo atual em dinheiro" },
    { label: "Vendas no cartão", value: shift ? brl(cardTotal) : "—", hint: "Crédito e débito" },
    { label: "Vendas em Pix", value: shift ? brl(reconciled("PIX")) : "—", hint: "Pagamentos recebidos" },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <section aria-labelledby="cash-overview-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 id="cash-overview-title" className="text-xl font-bold tracking-tight">Turno atual</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe os valores e as movimentações do caixa.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button variant="outline" className="h-9 flex-1 px-3 sm:flex-none" disabled={!shift} onClick={() => onModalChange("sangria")}>
              <GlIcon name="arrow-down" /> Sangria
            </Button>
            <Button variant="outline" className="h-9 flex-1 px-3 sm:flex-none" disabled={!shift} onClick={() => onModalChange("suprimento")}>
              <GlIcon name="arrow-up" /> Suprimento
            </Button>
            <Button className="h-9 flex-1 px-3 sm:flex-none" disabled={!shift} onClick={() => onModalChange("fechamento")}>
              <GlIcon name="lock" /> Fechar turno
            </Button>
          </div>
        </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
            {shift ? (
              <button type="button" onClick={() => setDetailsOpen(true)} className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Ver detalhes do turno aberto">
                <StatusBadge tone="success" icon="check-circle" className="h-7 cursor-pointer font-sans text-xs font-semibold hover:opacity-80">
                  Turno aberto · Ver detalhes
                </StatusBadge>
              </button>
            ) : (
              <StatusBadge tone="neutral" icon="lock" className="h-7 font-sans text-xs font-semibold">Turno fechado</StatusBadge>
            )}
            {opened && <span>Aberto em {opened}</span>}
            {opened && shift?.operatorName && <span aria-hidden="true">·</span>}
            {shift?.operatorName && <span>Operador: {shift.operatorName}</span>}
          </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border bg-card px-5 py-4">
              <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="cash-movements-title" className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <div>
            <h2 id="cash-movements-title" className="text-base font-semibold">Movimentações do turno</h2>
            <p className="mt-1 text-xs text-muted-foreground">Histórico de entradas, retiradas e vendas do caixa.</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {movements.length === 1 ? "1 movimentação" : movements.length + " movimentações"}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="h-11 pl-5 text-xs text-muted-foreground">Horário</TableHead>
              <TableHead className="text-xs text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-xs text-muted-foreground">Descrição</TableHead>
              <TableHead className="text-xs text-muted-foreground">Operador</TableHead>
              <TableHead className="pr-5 text-right text-xs text-muted-foreground">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {shift ? "Ainda não há movimentações neste turno." : "Não há turno aberto no momento."}
                </TableCell>
              </TableRow>
            ) : movements.slice().reverse().map((movement) => {
              const config = MOVEMENT_LABELS[movement.type] ?? { label: "Movimentação", icon: "doc-text", tone: "info" as const }
              const sangria = movement.type === "BLEED_SANGRIA"
              return (
                <TableRow key={movement.id}>
                  <TableCell className="py-4 pl-5 text-sm text-muted-foreground tabular-nums">
                    {new Date(movement.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={config.tone} icon={config.icon} className="font-sans text-xs font-medium normal-case">
                      {config.label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm" title={movement.description}>{movement.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{movement.operatorName}</TableCell>
                  <TableCell className="pr-5 text-right text-sm font-semibold tabular-nums">
                    {sangria ? "−" : "+"} {brl(movement.amount)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </section>

      <Sheet open={detailsOpen && !!shift} onOpenChange={setDetailsOpen}>
        <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b px-6 py-5 pr-14">
            <SheetTitle className="text-lg font-semibold">Detalhes do caixa</SheetTitle>
            <SheetDescription>Informações e movimentações do turno atual.</SheetDescription>
          </SheetHeader>
          {shift && <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Turno atual</p>
                <p className="mt-1 text-xs text-muted-foreground">{shift.terminalId || "Caixa balcão"}</p>
              </div>
              <StatusBadge tone="success" icon="check-circle" className="h-7 font-sans text-xs font-semibold">Turno aberto</StatusBadge>
            </div>
            <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Operador</dt><dd className="mt-1 font-medium">{shift.operatorName || "Não informado"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Abertura</dt><dd className="mt-1 font-medium">{opened || "Não informada"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Fundo inicial</dt><dd className="mt-1 font-medium tabular-nums">{brl(movements.find((m) => m.type === "INITIAL_SUPPLY")?.amount ?? 0)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Dinheiro em caixa</dt><dd className="mt-1 font-semibold tabular-nums">{brl(shift.finalCalculatedCash)}</dd></div>
            </dl>
            <section aria-labelledby="cash-details-payments">
              <h3 id="cash-details-payments" className="text-sm font-semibold">Vendas por forma de pagamento</h3>
              <div className="mt-3 space-y-3 text-sm">
                {[
                  ["Dinheiro", movements.filter((m) => m.type === "ORDER_PAYMENT").reduce((sum, m) => sum + m.amount, 0)],
                  ["Pix", reconciled("PIX")],
                  ["Cartão de crédito", reconciled("CREDIT_CARD")],
                  ["Cartão de débito", reconciled("DEBIT_CARD")],
                ].map(([label, amount]) => <div key={label} className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-medium tabular-nums">{brl(Number(amount))}</span></div>)}
              </div>
            </section>
            <section aria-labelledby="cash-details-movements">
              <div className="flex items-center justify-between gap-3"><h3 id="cash-details-movements" className="text-sm font-semibold">Movimentações</h3><span className="text-xs text-muted-foreground">{movements.length} {movements.length === 1 ? "registro" : "registros"}</span></div>
              {movements.length ? <ul className="mt-2 divide-y">{movements.slice().reverse().map((movement) => {
                const config = MOVEMENT_LABELS[movement.type] ?? { label: "Movimentação" }
                return <li key={movement.id} className="flex justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="font-medium">{config.label}</p><p className="mt-1 break-words text-xs text-muted-foreground">{movement.description}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(movement.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {movement.operatorName}</p></div><span className="shrink-0 font-medium tabular-nums">{movement.type === "BLEED_SANGRIA" ? "−" : "+"} {brl(movement.amount)}</span></li>
              })}</ul> : <p className="mt-3 text-sm text-muted-foreground">Ainda não há movimentações neste turno.</p>}
            </section>
          </div>}
        </SheetContent>
      </Sheet>
      <MovementDialog kind="sangria" open={modal === "sangria"} onClose={() => onModalChange(null)} onDone={data.reload} />
      <MovementDialog kind="suprimento" open={modal === "suprimento"} onClose={() => onModalChange(null)} onDone={data.reload} />
      <ClosingDialog open={modal === "fechamento"} onClose={() => onModalChange(null)} onDone={data.reload} />
    </div>
  )
}

const MOVEMENT_COPY = {
  sangria: {
    type: "BLEED_SANGRIA",
    title: "Realizar Sangria de Caixa",
    icon: "arrow-down",
    amountLabel: "Valor a Retirar (R$):",
    amountPlaceholder: "50,00",
    descLabel: "Motivo / Justificativa da Sangria:",
    descPlaceholder: "Ex: Recolhimento para o cofre",
    confirm: "Confirmar Sangria",
    missing: "Informe o valor e a justificativa da sangria!",
    success: (v: number) => `Sangria de ${brl(v)} realizada com sucesso!`,
    destructive: true,
  },
  suprimento: {
    type: "SUPPLY",
    title: "Realizar Suprimento de Caixa",
    icon: "arrow-up",
    amountLabel: "Valor a Inserir (R$):",
    amountPlaceholder: "100,00",
    descLabel: "Justificativa / Origem:",
    descPlaceholder: "Ex: Reforço de moedas para troco",
    confirm: "Confirmar Suprimento",
    missing: "Informe o valor e a justificativa do suprimento!",
    success: (v: number) => `Suprimento de ${brl(v)} adicionado ao caixa!`,
    destructive: false,
  },
} as const

function MovementDialog({
  kind,
  open,
  onClose,
  onDone,
}: {
  kind: "sangria" | "suprimento"
  open: boolean
  onClose: () => void
  onDone: () => Promise<void>
}) {
  const copy = MOVEMENT_COPY[kind]
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  async function submit() {
    const value = Number(amount)
    if (!value || value <= 0 || !description.trim()) {
      alert(copy.missing)
      return
    }
    try {
      await api.movement({ type: copy.type, amount: value, description: description.trim() })
      setAmount("")
      setDescription("")
      onClose()
      await onDone()
      alert(copy.success(value))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GlIcon name={copy.icon} /> {copy.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <Label htmlFor={`${kind}-amount`}>{copy.amountLabel}</Label>
            <Input
              id={`${kind}-amount`}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={copy.amountPlaceholder}
              className="font-mono font-bold"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${kind}-desc`}>{copy.descLabel}</Label>
            <Input
              id={`${kind}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={copy.descPlaceholder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={copy.destructive ? "destructive" : "default"} onClick={() => void submit()}>
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CLOSING_FIELDS = [
  { key: "declaredCash", label: "Dinheiro Contado (Gaveta):" },
  { key: "declaredDebit", label: "Cartão Débito:" },
  { key: "declaredCredit", label: "Cartão Crédito:" },
  { key: "declaredPix", label: "Pix Recebido:" },
] as const

function ClosingDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean
  onClose: () => void
  onDone: () => Promise<void>
}) {
  const [values, setValues] = useState<Record<string, string>>({})

  async function submit() {
    const declared = Object.fromEntries(
      CLOSING_FIELDS.map((f) => [f.key, Number(values[f.key] || 0)]),
    )
    try {
      const closed = await api.closeShift(declared)
      onClose()
      await onDone()
      const diff = closed.cashDifference
      const diffMsg =
        diff === 0
          ? "Caixa bateu perfeitamente!"
          : diff > 0
            ? `Sobra de caixa: ${brl(diff)}`
            : `Quebra de caixa: ${brl(Math.abs(diff))}`
      alert(
        `Turno Fechado com Sucesso!\n\nRelatório Z emitido.\nTotal Declarado em Dinheiro: ${brl(declared.declaredCash)}\nSaldo Calculado: ${brl(closed.finalCalculatedCash)}\n${diffMsg}`,
      )
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GlIcon name="lock" /> Conferência de Fechamento de Caixa
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Insira a contagem física do operador para conferência cega:
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {CLOSING_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1 rounded-xl border bg-background p-3">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                type="number"
                placeholder="0,00"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="font-mono font-bold"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="font-extrabold" onClick={() => void submit()}>
            Emitir Relatório Z &amp; Fechar Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
