import { useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DanfeDialog } from "@/components/danfe-dialog"
import { GlIcon } from "@/components/gl-icon"
import { NAV_ITEMS, type TabId } from "@/components/nav-items"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { brl } from "@/lib/format"
import { useCentralData } from "@/lib/use-central-data"
import type { Order } from "@/lib/types"
import { CaixaView } from "@/views/caixa-view"
import { CardapioView } from "@/views/cardapio-view"
import { ConfigView } from "@/views/config-view"
import { FiscalView } from "@/views/fiscal-view"
import { KdsView } from "@/views/kds-view"
import { OverviewView } from "@/views/overview-view"
import { PdvView } from "@/views/pdv-view"
import { TotensView } from "@/views/totens-view"
import { UsuariosView } from "@/views/usuarios-view"

export default function App() {
  const data = useCentralData()
  const [tab, setTab] = useState<TabId>("pdv")
  const [danfeOrder, setDanfeOrder] = useState<Order | null>(null)

  const current = NAV_ITEMS.find((n) => n.id === tab)!
  const openDanfe = (orderId: string) =>
    setDanfeOrder(data.orders.find((o) => o.id === orderId) ?? null)

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar activeTab={tab} onNavigate={setTab} kdsPending={data.kdsOrders.length} />
        <SidebarInset className="min-w-0 overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-vertical:h-4" />
              <h2 className="flex items-center gap-2 text-base font-bold">
                <GlIcon name={current.icon} className="size-5 text-primary" />
                {current.title}
              </h2>
              <StatusBadge tone="success" icon="status_success" className="ml-2 hidden md:inline-flex">
                Terminal CAIXA-BALCAO-01
              </StatusBadge>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 font-mono">
                <GlIcon name="scale" className="text-muted-foreground" />
                <span className="text-muted-foreground">Saldo Caixa:</span>
                <span className="font-bold text-success">
                  {brl(data.shift?.finalCalculatedCash ?? 0)}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                title="Atualizar dados"
                aria-label="Atualizar dados"
                onClick={() => void data.reload()}
              >
                <GlIcon name="retry" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === "pdv" && <PdvView data={data} onSaleCompleted={setDanfeOrder} />}
            {tab === "kds" && <KdsView data={data} />}
            {tab === "caixa" && <CaixaView data={data} />}
            {tab === "overview" && <OverviewView data={data} onOpenDanfe={openDanfe} />}
            {tab === "cardapio" && <CardapioView data={data} />}
            {tab === "totens" && <TotensView data={data} />}
            {tab === "fiscal" && <FiscalView data={data} onOpenDanfe={openDanfe} />}
            {tab === "usuarios" && <UsuariosView />}
            {tab === "config" && <ConfigView />}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <DanfeDialog order={danfeOrder} onClose={() => setDanfeOrder(null)} />
    </TooltipProvider>
  )
}
