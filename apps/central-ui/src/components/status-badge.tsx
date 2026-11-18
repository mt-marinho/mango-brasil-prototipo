import type { ReactNode } from "react"

import { GlIcon } from "@/components/gl-icon"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TONES = {
  success: "bg-success/15 text-success",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  info: "bg-info/15 text-info",
  danger: "bg-destructive/15 text-destructive",
  neutral: "bg-secondary text-secondary-foreground",
} as const

export type Tone = keyof typeof TONES

/** Estado = Forma (ícone) + Texto + Cor — nunca apenas cor. */
export function StatusBadge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone
  icon?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Badge variant="secondary" className={cn("font-mono font-bold", TONES[tone], className)}>
      {icon && <GlIcon name={icon} />}
      {children}
    </Badge>
  )
}

export const ORDER_STATUS: Record<string, { tone: Tone; icon: string; label: string }> = {
  RECEIVED: { tone: "info", icon: "status_scheduled", label: "RECEBIDO" },
  PREPARING: { tone: "warning", icon: "status_running", label: "PREPARANDO" },
  READY: { tone: "success", icon: "status_success", label: "PRONTO" },
  DELIVERED: { tone: "neutral", icon: "check", label: "ENTREGUE" },
}

export const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  PIX: "Pix",
}
