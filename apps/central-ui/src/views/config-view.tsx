import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

type Settings = { tradeName: string; companyName: string; cnpj: string; address: string; phone: string; initialCash: string; allowCash: boolean; allowPix: boolean; allowCredit: boolean; allowDebit: boolean; requireBleedReason: boolean; blindClose: boolean; welcome: string; idleSeconds: string; autoReturn: boolean }
const defaults: Settings = { tradeName: "Mango Brasil", companyName: "MANGO BRASIL ALIMENTOS LTDA", cnpj: "12.345.678/0001-90", address: "", phone: "", initialCash: "150.00", allowCash: true, allowPix: true, allowCredit: true, allowDebit: true, requireBleedReason: true, blindClose: true, welcome: "Bem-vindo à Mango Brasil!", idleSeconds: "60", autoReturn: true }
const storageKey = "mango-configuracoes-prototipo-v1"
function load(): Settings { try { const raw = localStorage.getItem(storageKey); const value = raw ? JSON.parse(raw) : null; if (!value || typeof value !== "object") return defaults; return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, typeof value[key] === typeof fallback ? value[key] : fallback])) as Settings } catch { return defaults } }
const sections = [{ id: "estabelecimento", label: "Estabelecimento" }, { id: "vendas", label: "Vendas e caixa" }] as const
type Section = typeof sections[number]["id"]

export function ConfigView() {
  const [settings, setSettings] = useState<Settings>(load)
  const [saved, setSaved] = useState<Settings>(load)
  const [section, setSection] = useState<Section>("estabelecimento")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved)
  function update<K extends keyof Settings>(key: K, value: Settings[K]) { setSettings((current) => ({ ...current, [key]: value })); setMessage(""); setError("") }
  function save() {
    if (!settings.tradeName.trim()) { setError("Informe o nome fantasia."); setSection("estabelecimento"); return }
    if (settings.initialCash === "" || !Number.isFinite(Number(settings.initialCash)) || Number(settings.initialCash) < 0) { setError("Informe um fundo inicial válido."); setSection("vendas"); return }
    if (![settings.allowCash, settings.allowPix, settings.allowCredit, settings.allowDebit].some(Boolean)) { setError("Selecione ao menos uma forma de pagamento."); setSection("vendas"); return }
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); setSaved(settings); setError(""); setMessage("Configurações salvas neste navegador.") } catch { setError("Não foi possível salvar as configurações neste navegador.") }
  }
  const field = (label: string, key: "tradeName" | "companyName" | "cnpj" | "address" | "phone" | "welcome", placeholder?: string) => <label className="block space-y-2 text-sm font-medium">{label}<Input className="h-10" value={settings[key]} placeholder={placeholder} onChange={(e) => update(key, e.target.value)} /></label>
  const toggle = (label: string, description: string, key: "allowCash" | "allowPix" | "allowCredit" | "allowDebit" | "requireBleedReason" | "blindClose" | "autoReturn") => <div className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch aria-label={label} checked={settings[key]} onCheckedChange={(checked) => update(key, checked)} /></div>
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-xl font-semibold tracking-tight">Configurações</h1><p className="mt-1 text-sm text-muted-foreground">Personalize os dados e as preferências do estabelecimento.</p></div><div className="flex gap-2"><Button variant="outline" disabled={!dirty} onClick={() => { setSettings(saved); setError(""); setMessage("") }}>Descartar alterações</Button><Button onClick={save} disabled={!dirty}>Salvar alterações</Button></div></div>
    <p className="text-xs text-muted-foreground">Protótipo: as configurações são salvas neste navegador e ainda não alteram o funcionamento do PDV ou do totem.</p>
    {(error || message) && <p role={error ? "alert" : "status"} className={`text-sm ${error ? "text-destructive" : "text-success"}`}>{error || message}</p>}
    <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"><nav aria-label="Seções de configurações" className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-2 lg:flex-col">{sections.map((item) => <button key={item.id} type="button" aria-current={section === item.id ? "page" : undefined} onClick={() => { setSection(item.id); setError("") }} className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${section === item.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item.label}</button>)}</nav>
      <div className="rounded-xl border bg-card"><div className="border-b px-5 py-4"><h2 className="font-semibold">{sections.find((item) => item.id === section)?.label}</h2><p className="mt-1 text-xs text-muted-foreground">{section === "estabelecimento" ? "Informações de identificação e contato." : "Preferências para recebimentos e operação do caixa."}</p></div>
        {section === "estabelecimento" && <div className="grid gap-5 p-5 sm:grid-cols-2">{field("Nome fantasia", "tradeName")}{field("Razão social", "companyName")}{field("CNPJ", "cnpj")}{field("Telefone", "phone", "(00) 00000-0000")}<div className="sm:col-span-2">{field("Endereço", "address", "Rua, número, bairro, cidade e UF")}</div></div>}
        {section === "vendas" && <div className="space-y-6 p-5"><label className="block max-w-xs space-y-2 text-sm font-medium">Fundo inicial sugerido (R$)<Input className="h-10" type="number" min="0" step="0.01" value={settings.initialCash} onChange={(e) => update("initialCash", e.target.value)} /></label><div><h3 className="text-sm font-semibold">Formas de pagamento</h3><div className="mt-2 divide-y">{toggle("Dinheiro", "Recebimentos em espécie.", "allowCash")}{toggle("Pix", "Pagamento via Pix.", "allowPix")}{toggle("Cartão de crédito", "Recebimentos por cartão de crédito.", "allowCredit")}{toggle("Cartão de débito", "Recebimentos por cartão de débito.", "allowDebit")}</div></div><div><h3 className="text-sm font-semibold">Operação do caixa</h3><div className="mt-2 divide-y">{toggle("Exigir motivo na sangria", "Solicita uma justificativa para a retirada de valores.", "requireBleedReason")}{toggle("Fechamento cego", "Operador informa os valores contados antes da conferência.", "blindClose")}</div></div></div>}
      </div>
    </div>
  </div>
}
