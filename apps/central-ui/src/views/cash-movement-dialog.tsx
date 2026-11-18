import { useState } from "react"
import { GlIcon } from "@/components/gl-icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { brl } from "@/lib/format"

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

export function MovementDialog({
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
