import { useState } from "react"
import { GlIcon } from "@/components/gl-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type User = { id: string; name: string; email: string; profileId: string; active: boolean }
type Profile = { id: string; name: string }
const initial: User[] = [
  { id: "001", name: "Ana Martins", email: "ana@example.com", profileId: "admin", active: true },
  { id: "002", name: "Bruno Almeida", email: "bruno@example.com", profileId: "gerente", active: true },
  { id: "003", name: "Carla Santos", email: "carla@example.com", profileId: "atendente", active: true },
  { id: "004", name: "Diego Costa", email: "diego@example.com", profileId: "atendente", active: true },
  { id: "005", name: "Fernanda Lima", email: "fernanda@example.com", profileId: "preparo", active: true },
  { id: "006", name: "Gabriel Rocha", email: "gabriel@example.com", profileId: "preparo", active: false },
]
const defaults: Profile[] = [{ id: "admin", name: "Administrador" }, { id: "gerente", name: "Gerente" }, { id: "atendente", name: "Atendente" }, { id: "preparo", name: "Equipe de preparo" }]
const key = "mango-usuarios-prototipo-v1"
function loadUsers(): User[] { try { const raw = localStorage.getItem(key); const value = raw ? JSON.parse(raw) : null; return Array.isArray(value) && value.every((u) => u && typeof u.id === "string" && typeof u.name === "string" && typeof u.email === "string" && typeof u.profileId === "string" && typeof u.active === "boolean") ? value : initial } catch { return initial } }
function loadProfiles(): Profile[] { try { const raw = localStorage.getItem("mango-perfis-prototipo-v1"); const value = raw ? JSON.parse(raw) : null; return Array.isArray(value) && value.every((p) => p && typeof p.id === "string" && typeof p.name === "string") ? value : defaults } catch { return defaults } }

export function UsuariosView() {
  const [users, setUsers] = useState<User[]>(loadUsers)
  const [profiles] = useState<Profile[]>(loadProfiles)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [profileFilter, setProfileFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [draft, setDraft] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [saveError, setSaveError] = useState("")
  const term = search.trim().toLocaleLowerCase("pt-BR")
  const filtered = users.filter((u) => `${u.id} ${u.name} ${u.email}`.toLocaleLowerCase("pt-BR").includes(term) && (status === "all" || u.active === (status === "active")) && (profileFilter === "all" || u.profileId === profileFilter))
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  function persist(next: User[]) { try { localStorage.setItem(key, JSON.stringify(next)); setUsers(next); setSaveError(""); return true } catch { setSaveError("Não foi possível salvar neste navegador."); return false } }
  function save() {
    if (!draft) return
    const id = draft.id.trim(), name = draft.name.trim(), email = draft.email.trim()
    if (!id || !name || !email || !draft.profileId) { setError("Preencha todos os campos."); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Informe um e-mail válido."); return }
    if (users.some((u) => u.id.toLowerCase() === id.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())) { setError("Identificador ou e-mail já cadastrado."); return }
    if (persist([...users, { ...draft, id, name, email }])) { setDraft(null); setError("") }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-xl font-semibold tracking-tight">Usuários</h1><p className="mt-1 text-sm text-muted-foreground">Consulte os usuários e seus perfis de acesso.</p></div><Button onClick={() => { setError(""); setSaveError(""); setDraft({ id: "", name: "", email: "", profileId: profiles[0]?.id || "", active: true }) }}><GlIcon name="plus" /> Cadastrar usuário</Button></div>
    <p className="text-xs text-muted-foreground">Protótipo: os dados são salvos neste navegador e não criam contas nem controlam o acesso ao sistema.</p>
    <div className="flex flex-wrap justify-end gap-2"><div className="relative w-full sm:w-72"><GlIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 pl-9" aria-label="Buscar usuários" placeholder="Buscar por nome, código ou e-mail" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div><select aria-label="Filtrar por perfil" value={profileFilter} onChange={(e) => { setProfileFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Todos os perfis</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select aria-label="Filtrar por situação" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Todas as situações</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></div>
    {saveError && !draft && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
    <div className="overflow-hidden rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Perfil</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader><TableBody>{visible.map((u) => <TableRow key={u.id}><TableCell className="font-medium tabular-nums">{u.id}</TableCell><TableCell className="font-medium">{u.name}</TableCell><TableCell className="text-muted-foreground">{u.email}</TableCell><TableCell>{profiles.find((p) => p.id === u.profileId)?.name || "Perfil indisponível"}</TableCell><TableCell><label className="inline-flex items-center gap-2 text-sm"><Switch aria-label={`Alterar situação de ${u.name}`} checked={u.active} onCheckedChange={(active) => persist(users.map((item) => item.id === u.id ? { ...item, active } : item))} /><span>{u.active ? "Ativo" : "Inativo"}</span></label></TableCell></TableRow>)}</TableBody></Table>{visible.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>}</div>
    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground"><span>{filtered.length ? `Mostrando ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} de ${filtered.length}` : "Nenhum registro"}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button><span>Página {currentPage} de {pages}</span><Button variant="outline" size="sm" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Próximo</Button></div><label className="flex items-center gap-2">Itens por página <select className="h-9 rounded-lg border border-input bg-background px-2" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label></div>
    <Dialog open={!!draft} onOpenChange={(open) => { if (!open) setDraft(null) }}><DialogContent className="sm:max-w-md"><DialogTitle>Cadastrar usuário</DialogTitle><DialogDescription>Informe os dados e selecione o perfil do usuário.</DialogDescription>{draft && <div className="space-y-4"><label className="block space-y-1.5 text-sm font-medium">Código<Input value={draft.id} maxLength={40} onChange={(e) => setDraft({ ...draft, id: e.target.value })} /></label><label className="block space-y-1.5 text-sm font-medium">Nome<Input value={draft.name} maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label className="block space-y-1.5 text-sm font-medium">E-mail<Input type="email" value={draft.email} maxLength={150} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label><label className="block space-y-1.5 text-sm font-medium">Perfil<select className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={draft.profileId} onChange={(e) => setDraft({ ...draft, profileId: e.target.value })}>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{(error || saveError) && <p role="alert" className="text-xs text-destructive">{error || saveError}</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button><Button onClick={save}>Cadastrar</Button></div></div>}</DialogContent></Dialog>
  </div>
}
