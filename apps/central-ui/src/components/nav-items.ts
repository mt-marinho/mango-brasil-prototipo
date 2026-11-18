export type TabId =
  | "pdv"
  | "kds"
  | "caixa"
  | "overview"
  | "cardapio"
  | "totens"
  | "fiscal"
  | "usuarios"
  | "perfis"
  | "config"

export const NAV_ITEMS: { id: TabId; label: string; title: string; icon: string }[] = [
  { id: "pdv", label: "PDV Assistido (Caixa)", title: "PDV Assistido (Caixa Balcão)", icon: "monitor" },
  { id: "kds", label: "KDS Preparo", title: "KDS Preparo (Fila de Produção)", icon: "timer" },
  { id: "caixa", label: "Caixa & Turnos", title: "Gestão de Caixa & Turnos", icon: "credit-card" },
  { id: "overview", label: "Visão Geral & Métricas", title: "Visão Geral & Métricas", icon: "dashboard" },
  { id: "cardapio", label: "Cardápio & Preços", title: "Cardápio & Preços", icon: "food" },
  { id: "totens", label: "Totens & Manutenção", title: "Totens & Manutenção", icon: "tablet" },
  { id: "fiscal", label: "Notas fiscais", title: "Notas fiscais", icon: "doc-text" },
  { id: "usuarios", label: "Usuários", title: "Usuários", icon: "users" },
  { id: "perfis", label: "Perfis de acesso", title: "Perfis de acesso", icon: "user-permissions" },
  { id: "config", label: "Configurações", title: "Configurações da Empresa", icon: "settings" },
]

export const NAV_MODULES: { label: string; items: TabId[] }[] = [
  { label: "Vendas", items: ["pdv", "caixa"] },
  { label: "Operação", items: ["kds", "cardapio", "totens"] },
  { label: "Gestão", items: ["overview", "fiscal"] },
  { label: "Administração", items: ["usuarios", "perfis", "config"] },
]
