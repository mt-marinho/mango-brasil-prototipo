export type TabId =
  | "pdv"
  | "kds"
  | "caixa"
  | "overview"
  | "cardapio"
  | "totens"
  | "fiscal"
  | "usuarios"
  | "config"

export const NAV_ITEMS: { id: TabId; label: string; title: string; icon: string }[] = [
  { id: "pdv", label: "PDV Assistido (Caixa)", title: "PDV Assistido (Caixa Balcão)", icon: "monitor" },
  { id: "kds", label: "KDS Cozinha", title: "KDS Cozinha (Fila de Produção)", icon: "timer" },
  { id: "caixa", label: "Caixa & Turnos", title: "Gestão de Caixa & Turnos", icon: "credit-card" },
  { id: "overview", label: "Visão Geral & Métricas", title: "Visão Geral & Métricas", icon: "dashboard" },
  { id: "cardapio", label: "Cardápio & Preços", title: "Cardápio & Preços", icon: "food" },
  { id: "totens", label: "Totens & Manutenção", title: "Totens & Manutenção", icon: "tablet" },
  { id: "fiscal", label: "Motor Fiscal (NFC-e)", title: "Motor Fiscal NFC-e (SEFAZ)", icon: "doc-text" },
  { id: "usuarios", label: "Usuários & Logs", title: "Usuários & Permissões", icon: "users" },
  { id: "config", label: "Configurações", title: "Configurações da Empresa", icon: "settings" },
]
