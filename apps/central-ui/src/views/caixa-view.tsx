import { useState } from "react"

import { GlIcon } from "@/components/gl-icon"
import { MetricCard } from "@/components/page-header"
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

type Modal = null | "sangria" | "suprimento" | "fechamento"

export function CaixaView({ data }: { data: CentralData }) {
  const [modal, setModal] = useState<Modal>(null)
  const shift = data.shift

  const reconciled = (method: string) =>
    shift?.reconciliation.find((r) => r.method === method)?.systemCalculatedAmount ?? 0
  const cardTotal = reconciled("CREDIT_CARD") + reconciled("DEBIT_CARD")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Saldo Atual em Dinheiro"
          value={brl(shift?.finalCalculatedCash ?? 0)}
          valueClassName="text-success"
          hint="Terminal: CAIXA-BALCAO-01"
        />
        <MetricCard
          label="Vendas no Cartão (Créd/Déb)"
          value={brl(cardTotal)}
          valueClassName="text-info"
          hint="Via TEF / Pinpad integrado"
        />
        <MetricCard
          label="Vendas em Pix"
          value={brl(reconciled("PIX"))}
          valueClassName="text-chart-4"
          hint="QR Code dinâmico"
        />
        <div className="space-y-1 rounded-2xl border bg-card p-4">
          <span className="text-xs font-bold text-muted-foreground uppercase">Status do Turno</span>
          <div className="pt-1">
            {shift ? (
              <StatusBadge tone="success" icon="status_success" className="h-7 text-sm">
                ABERTO
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral" icon="lock" className="h-7 text-sm">
                FECHADO
              </StatusBadge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {shift ? "Turno em andamento" : "Nenhum turno aberto"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={() => setModal("sangria")}>
            <GlIcon name="arrow-down" /> Realizar Sangria de Caixa
          </Button>
          <Button
            variant="outline"
            className="border-success/30 bg-success/10 text-success hover:bg-success/20"
            onClick={() => setModal("suprimento")}
          >
            <GlIcon name="arrow-up" /> Realizar Suprimento de Caixa
          </Button>
        </div>
        <Button className="font-extrabold" onClick={() => setModal("fechamento")}>
          <GlIcon name="lock" /> Fechar Turno com Conferência (Relatório Z)
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-4 text-sm font-bold">
          <span>Histórico de Movimentações do Turno</span>
          <span className="font-mono text-xs font-normal text-muted-foreground">
            Auditoria Contábil
          </span>
        </div>
        <Table className="font-mono text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Horário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição / Motivo</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(shift?.movements ?? [])
              .slice()
              .reverse()
              .map((m) => {
                const sangria = m.type === "BLEED_SANGRIA"
                const suprimento = m.type === "SUPPLY" || m.type === "INITIAL_SUPPLY"
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={sangria ? "danger" : suprimento ? "success" : "info"}
                        icon={sangria ? "arrow-down" : suprimento ? "arrow-up" : "credit-card"}
                      >
                        {m.type}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="font-sans">{m.description}</TableCell>
                    <TableCell className="font-sans text-muted-foreground">{m.operatorName}</TableCell>
                    <TableCell
                      className={`text-right font-bold ${sangria ? "text-destructive" : "text-success"}`}
                    >
                      {sangria ? "-" : "+"} {brl(m.amount)}
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      <MovementDialog
        kind="sangria"
        open={modal === "sangria"}
        onClose={() => setModal(null)}
        onDone={data.reload}
      />
      <MovementDialog
        kind="suprimento"
        open={modal === "suprimento"}
        onClose={() => setModal(null)}
        onDone={data.reload}
      />
      <ClosingDialog open={modal === "fechamento"} onClose={() => setModal(null)} onDone={data.reload} />
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
    descPlaceholder: "Ex: Pagamento fornecedor pães / Recolhimento cofre",
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
