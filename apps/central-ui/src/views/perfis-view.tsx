import { useState } from "react"
import { GlIcon } from "@/components/gl-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

type Level = "none" | "view" | "edit" | "manage"
type Profile = { id: string; name: string; description: string; permissions: Record<string, Level> }
const modules = [
  { id: "pdv", name: "PDV assistido", description: "Pedidos, pagamentos e atendimento no balcão." },
  { id: "caixa", name: "Caixa e turnos", description: "Abertura, movimentações e fechamento de caixa." },
  { id: "kds", name: "Preparo", description: "Consulta e acompanhamento da fila de pedidos." },
  { id: "cardapio", name: "Produtos", description: "Consulta e gerenciamento do cardápio e preços." },
  { id: "totens", name: "Totens", description: "Acompanhamento dos totens e periféricos." },
  { id: "overview", name: "Visão geral", description: "Indicadores de vendas e operação." },
  { id: "fiscal", name: "Notas fiscais", description: "Consulta da situação fiscal e documentos." },
  { id: "usuarios", name: "Usuários", description: "Consulta e gerenciamento de usuários." },
  { id: "perfis", name: "Perfis", description: "Gerenciamento dos perfis e permissões." },
  { id: "config", name: "Configurações", description: "Configurações gerais do estabelecimento." },
]
const levels: { value: Level; label: string }[] = [{ value: "none", label: "Sem acesso" }, { value: "view", label: "Ver" }, { value: "edit", label: "Editar" }, { value: "manage", label: "Gerenciar" }]
const all = (level: Level) => Object.fromEntries(modules.map((m) => [m.id, level])) as Record<string, Level>
const initial: Profile[] = [
  { id: "admin", name: "Administrador", description: "Gerencia o estabelecimento e todos os módulos.", permissions: all("manage") },
  { id: "gerente", name: "Gerente", description: "Acompanha as vendas, o caixa e a operação.", permissions: { ...all("view"), pdv: "manage", caixa: "manage", kds: "manage", cardapio: "edit", usuarios: "edit", perfis: "none", config: "none" } },
  { id: "atendente", name: "Atendente", description: "Atende clientes e registra vendas no balcão.", permissions: { ...all("none"), pdv: "edit", caixa: "view", kds: "view", cardapio: "view" } },
  { id: "preparo", name: "Equipe de preparo", description: "Acompanha e atualiza a fila de produção.", permissions: { ...all("none"), kds: "edit", cardapio: "view" } },
]
const storageKey = "mango-perfis-prototipo-v1"
function loadProfiles(): Profile[] { try { const raw = localStorage.getItem(storageKey); const parsed = raw ? JSON.parse(raw) : null; return Array.isArray(parsed) && parsed.every((p) => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.description === "string" && p.permissions && typeof p.permissions === "object") ? parsed : initial } catch { return initial } }

export function PerfisView() {
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles)
  const [selected, setSelected] = useState(() => profiles[0]?.id || "")
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [saveError, setSaveError] = useState("")
  const filtered = profiles.filter((p) => p.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")))
  const current = profiles.find((p) => p.id === selected)
  function save() {
    if (!editing) return
    const name = editing.name.trim()
    if (!name) { setError("Informe o nome do perfil."); return }
    if (profiles.some((p) => p.id !== editing.id && p.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) { setError("Já existe um perfil com esse nome."); return }
    const profile = { ...editing, name, description: editing.description.trim() }
    const updated = creating ? [...profiles, profile] : profiles.map((p) => p.id === profile.id ? profile : p)
    try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch { setSaveError("Não foi possível salvar neste navegador."); return }
    setProfiles(updated); setSelected(profile.id); setEditing(null); setError(""); setSaveError("")
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-xl font-semibold tracking-tight">Perfis de acesso</h1><p className="mt-1 text-sm text-muted-foreground">Organize as permissões por função e módulo.</p></div><Button onClick={() => { setCreating(true); setError(""); setSaveError(""); setEditing({ id: crypto.randomUUID(), name: "", description: "", permissions: all("none") }) }}><GlIcon name="plus" /> Novo perfil</Button></div>
    <p className="text-xs text-muted-foreground">Protótipo: perfis são salvos neste navegador e ainda não controlam o acesso ao sistema.</p>
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(250px,1fr)_minmax(0,2fr)]">
      <div className="space-y-3"><div className="relative"><GlIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 pl-9" aria-label="Buscar perfil" placeholder="Buscar perfil" value={query} onChange={(e) => setQuery(e.target.value)} /></div><p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "perfil" : "perfis"}</p><div className="space-y-2">{filtered.map((profile) => <button key={profile.id} type="button" onClick={() => setSelected(profile.id)} aria-pressed={current?.id === profile.id} className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${current?.id === profile.id ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/40"}`}><span className="block text-sm font-semibold">{profile.name}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{profile.description || "Sem descrição"}</span></button>)}{filtered.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum perfil encontrado.</p>}</div></div>
      {current ? <section className="overflow-hidden rounded-xl border bg-card"><div className="flex flex-wrap items-start justify-between gap-3 border-b p-5"><div><h2 className="text-base font-semibold">{current.name}</h2><p className="mt-1 text-sm text-muted-foreground">{current.description || "Sem descrição"}</p><p className="mt-3 text-xs text-muted-foreground">{modules.filter((m) => current.permissions[m.id] && current.permissions[m.id] !== "none").length} de {modules.length} módulos com acesso</p></div><Button variant="outline" size="sm" onClick={() => { setCreating(false); setError(""); setSaveError(""); setEditing({ ...current, permissions: { ...current.permissions } }) }}><GlIcon name="pencil" /> Editar</Button></div><ul className="divide-y">{modules.map((m) => <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold">{m.name}</p><p className="mt-1 text-xs text-muted-foreground">{m.description}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{levels.find((l) => l.value === current.permissions[m.id])?.label || "Sem acesso"}</span></li>)}</ul></section> : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Selecione um perfil para ver suas permissões.</div>}
    </div>
    <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}><DialogContent className="pdv-scroll max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogTitle>{creating ? "Novo perfil" : "Editar perfil"}</DialogTitle><DialogDescription>Defina os dados e o nível de acesso em cada módulo.</DialogDescription>{editing && <div className="space-y-4"><label className="block space-y-1.5 text-sm font-medium">Nome do perfil<Input value={editing.name} maxLength={80} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label><label className="block space-y-1.5 text-sm font-medium">Descrição<Input value={editing.description} maxLength={160} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}{saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}<div className="space-y-1"><h3 className="font-semibold">Permissões por módulo</h3><p className="text-xs text-muted-foreground">Escolha um nível para cada módulo.</p></div><div className="divide-y rounded-lg border">{modules.map((m) => <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><span className="text-sm font-medium">{m.name}</span><select aria-label={`Permissão para ${m.name}`} value={editing.permissions[m.id] || "none"} onChange={(e) => setEditing({ ...editing, permissions: { ...editing.permissions, [m.id]: e.target.value as Level } })} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">{levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></div>)}</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={save}>Salvar perfil</Button></div></div>}</DialogContent></Dialog>
  </div>
}
