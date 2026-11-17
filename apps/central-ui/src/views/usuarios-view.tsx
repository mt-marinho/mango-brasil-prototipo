import { GlIcon } from "@/components/gl-icon"
import { StatusBadge, type Tone } from "@/components/status-badge"

const USERS: { name: string; role: string; tone: Tone; icon: string; description: string }[] = [
  {
    name: "Roberto Dono",
    role: "DONO",
    tone: "info",
    icon: "admin",
    description:
      "Acesso ilimitado, configurações fiscais, relatórios gerenciais e fechamento de caixa.",
  },
  {
    name: "Mariana Gerente",
    role: "GERENTE",
    tone: "success",
    icon: "user-permissions",
    description:
      "Permissão para autorizar cancelamentos, sangrias de caixa e conferência cega de turnos.",
  },
  {
    name: "Lucas Atendente",
    role: "ATENDENTE",
    tone: "warning",
    icon: "user",
    description:
      "Operação exclusiva do PDV balcão, lançamento de pedidos e recebimento de dinheiro.",
  },
]

export function UsuariosView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {USERS.map((u) => (
          <div key={u.name} className="space-y-2 rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{u.name}</span>
              <StatusBadge tone={u.tone} icon={u.icon}>
                {u.role}
              </StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground">{u.description}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-4 text-sm font-bold">
          <span>Log de Cancelamentos e Auditoria</span>
          <span className="font-mono text-xs font-normal text-muted-foreground">LGPD &amp; Compliance</span>
        </div>
        <div className="space-y-2 p-4 font-mono text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-2.5">
            <div className="flex items-center gap-2">
              <GlIcon name="cancel" className="text-destructive" />
              <span>
                <span className="font-bold text-destructive">[CANCELAMENTO]</span> Pedido #038 &bull;
                Motivo: Cliente solicitou cancelamento antes do preparo.
              </span>
            </div>
            <span>Autorizado por: Mariana Gerente (Há 2h)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
