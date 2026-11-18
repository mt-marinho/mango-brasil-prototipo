import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DanfeDialog } from "@/components/danfe-dialog"
import { NAV_ITEMS, type TabId } from "@/components/nav-items"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useCentralData } from "@/lib/use-central-data"
import type { Order } from "@/lib/types"
import { CaixaView, type CashModal } from "@/views/caixa-view"
import { CardapioView } from "@/views/cardapio-view"
import { ConfigView } from "@/views/config-view"
import { FiscalView } from "@/views/fiscal-view"
import { KdsView } from "@/views/kds-view"
import { OverviewView } from "@/views/overview-view"
import { PdvView } from "@/views/pdv-view"
import { PerfisView } from "@/views/perfis-view"
import { TotensView } from "@/views/totens-view"
import { UsuariosView } from "@/views/usuarios-view"

export default function App() {
  const data = useCentralData()
  const [tab, setTab] = useState<TabId>("pdv")
  const [danfeOrder, setDanfeOrder] = useState<Order | null>(null)
  const [cashModal, setCashModal] = useState<CashModal>(null)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try { return localStorage.getItem("mango-theme") === "light" ? "light" : "dark" }
    catch { return "dark" }
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    try { localStorage.setItem("mango-theme", theme) } catch { /* browser storage may be unavailable */ }
  }, [theme])

  useEffect(() => {
    if (tab !== "caixa") return
    void data.reload()
    const interval = window.setInterval(() => void data.reload(), 10_000)
    return () => window.clearInterval(interval)
  }, [tab, data.reload])

  const current = NAV_ITEMS.find((n) => n.id === tab)!
  const openDanfe = (orderId: string) =>
    setDanfeOrder(data.orders.find((o) => o.id === orderId) ?? null)

  const header = (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-center" />
        <nav aria-label="Página atual" className="flex min-w-0 items-center">
          <h2 className="truncate text-sm leading-none font-medium text-foreground">{current.title}</h2>
        </nav>
      </div>
    </header>
  )

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar activeTab={tab} onNavigate={(next) => { setTab(next); if (next === "cardapio" || next === "pdv") void data.reload() }} kdsPending={data.kdsOrders.length} theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} />
        <SidebarInset className="min-w-0 overflow-hidden">
          {tab === "pdv" ? (
            <PdvView data={data} onSaleCompleted={setDanfeOrder} header={header} />
          ) : tab === "caixa" ? (
            <CaixaView data={data} modal={cashModal} onModalChange={setCashModal} header={header} />
          ) : <>
          {header}
          <div className={`flex-1 overflow-y-auto px-6 pt-2 pb-6 ${tab === "kds" ? "kds-scroll" : tab === "fiscal" || tab === "overview" ? "pdv-scroll" : ""}`} tabIndex={tab === "kds" ? 0 : undefined}>
            {tab === "kds" && <KdsView data={data} />}
            {tab === "overview" && <OverviewView data={data} onOpenDanfe={openDanfe} />}
            {tab === "cardapio" && <CardapioView data={data} />}
            {tab === "totens" && <TotensView data={data} />}
            {tab === "fiscal" && <FiscalView data={data} onOpenDanfe={openDanfe} />}
            {tab === "usuarios" && <UsuariosView />}
            {tab === "perfis" && <PerfisView />}
            {tab === "config" && <ConfigView />}
          </div>
          </>}
        </SidebarInset>
      </SidebarProvider>

      <DanfeDialog order={danfeOrder} onClose={() => setDanfeOrder(null)} />
    </TooltipProvider>
  )
}
