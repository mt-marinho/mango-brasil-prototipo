import { GlIcon } from "@/components/gl-icon"
import { SectionHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { brl } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"

export function CardapioView({ data }: { data: CentralData }) {
  async function toggle(id: string) {
    try {
      await api.toggleProduct(id)
      await data.reload()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Cadastro de Produtos & Regras de Preço"
        description="Ative/desative produtos na hora (reflete no totem e no PDV)"
      >
        <Button
          className="font-extrabold"
          onClick={() => alert("Cadastro de produtos ainda não implementado nesta versão.")}
        >
          <GlIcon name="plus" /> Cadastrar Produto
        </Button>
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.products.map((p) => (
          <div key={p.id} className="space-y-3 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <img src={p.imageUrl} alt={p.name} className="size-16 rounded-xl bg-background object-cover" />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold">{p.name}</h4>
                <span className="font-mono text-xs font-bold text-primary">{brl(p.basePrice)}</span>
                <p className="font-mono text-[10px] text-muted-foreground">
                  NCM: {p.fiscal.ncm} &bull; CFOP: {p.fiscal.cfop}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-xs">
              <span className="text-muted-foreground">Disponível no Cardápio:</span>
              <button
                type="button"
                onClick={() => void toggle(p.id)}
                aria-label={`${p.active ? "Desativar" : "Ativar"} ${p.name}`}
              >
                {p.active ? (
                  <StatusBadge tone="success" icon="check-circle-filled">
                    ATIVADO
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="danger" icon="cancel">
                    DESATIVADO
                  </StatusBadge>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
