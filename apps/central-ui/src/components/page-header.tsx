import type { ReactNode } from "react"

export function SectionHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-3">
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  valueClassName,
  hintClassName = "text-muted-foreground",
}: {
  label: string
  value: ReactNode
  hint: ReactNode
  valueClassName?: string
  hintClassName?: string
}) {
  return (
    <div className="space-y-1 rounded-2xl border bg-card p-4">
      <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
      <div className={`text-2xl font-extrabold ${valueClassName ?? ""}`}>{value}</div>
      <p className={`text-[11px] ${hintClassName}`}>{hint}</p>
    </div>
  )
}
