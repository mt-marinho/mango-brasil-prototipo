import { GlIcon } from "@/components/gl-icon"
import { SectionHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import type { CentralData } from "@/lib/use-central-data"

export function TotensView({ data }: { data: CentralData }) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Parque de Totens & Periféricos"
        description="Status dos quiosques, impressoras térmicas e pinpads"
      >
        <Button
          className="bg-info font-bold text-black hover:bg-info/80"
          render={<a href="/totem" target="_blank" rel="noreferrer" />}
        >
          <GlIcon name="tablet" /> Abrir Tela do Totem em Nova Aba
          <GlIcon name="external-link" />
        </Button>
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.totems.map((t) => (
          <div key={t.id} className="space-y-3 rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <GlIcon name="tablet" className="size-6 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-bold">{t.name}</h4>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    IP: {t.ipAddress} &bull; v{t.appVersion}
                  </p>
                </div>
              </div>
              <StatusBadge tone="success" icon="status_success">
                {t.status}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="rounded-xl border bg-background p-2.5">
                <span className="block text-[10px] text-muted-foreground">Impressora Térmica:</span>
                <span className="flex items-center gap-1 font-bold text-success">
                  <GlIcon name="check-circle" className="size-3" />
                  {t.printerStatus}
                </span>
              </div>
              <div className="rounded-xl border bg-background p-2.5">
                <span className="block text-[10px] text-muted-foreground">Pinpad TEF:</span>
                <span className="flex items-center gap-1 font-bold text-chart-4">
                  <GlIcon name="credit-card" className="size-3" />
                  {t.pinpadStatus}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-info/30 bg-info/10 text-info hover:bg-info/20"
                render={<a href="/totem" target="_blank" rel="noreferrer" />}
              >
                Abrir Simulador
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert("Totem reiniciado remotamente com sucesso!")}
              >
                <GlIcon name="retry" /> Reiniciar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
