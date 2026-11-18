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
            <StatusBadge tone={shift ? "success" : "neutral"} icon={shift ? "check-circle" : "lock"} className="h-7 font-sans text-xs font-semibold">
              {shift ? "Turno aberto" : "Turno fechado"}
            </StatusBadge>
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
