import { GlIcon } from "@/components/gl-icon"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import type { CentralData } from "@/lib/use-central-data"

const statusLabels: Record<string, string> = {
  ONLINE: "Online", OFFLINE: "Offline", READY: "Pronta", CONNECTED: "Conectado",
  DISCONNECTED: "Desconectado", ERROR: "Com erro", NOT_READY: "Indisponível",
}

function DeviceStatus({ value }: { value: string }) {
  const key = (value || "").toUpperCase()
  const ok = ["ONLINE", "READY", "CONNECTED"].includes(key)
  return <StatusBadge tone={ok ? "success" : "neutral"} icon={ok ? "check-circle" : "status_failed"} className="font-sans font-medium normal-case">{statusLabels[key] ?? (value || "Não informado")}</StatusBadge>
}

export function TotensView({ data }: { data: CentralData }) {
  const online = data.totems.filter((t) => t.status?.toUpperCase() === "ONLINE").length
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Totens e periféricos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe a conexão dos totens e seus dispositivos.</p>
        </div>
        <Button render={<a href="/totem" target="_blank" rel="noreferrer" />}>
          <GlIcon name="tablet" /> Abrir simulador <GlIcon name="external-link" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-semibold">{data.totems.length} {data.totems.length === 1 ? "totem cadastrado" : "totens cadastrados"}</span>
        <span className="flex items-center gap-1.5 text-muted-foreground"><GlIcon name="check-circle" className="text-success" /> {online} online</span>
      </div>

      {data.totems.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">Nenhum totem cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.totems.map((t) => (
            <article key={t.id} className="min-w-0 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold">{t.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{t.ipAddress} <span aria-hidden="true">·</span> v{t.appVersion}</p>
                </div>
                <DeviceStatus value={t.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Impressora</span>
                  <DeviceStatus value={t.printerStatus} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Pinpad</span>
                  <DeviceStatus value={t.pinpadStatus} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
