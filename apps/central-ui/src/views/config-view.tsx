import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const FIELDS = [
  { label: "Razão Social:", value: "MANGO BRASIL ALIMENTOS LTDA" },
  { label: "CNPJ:", value: "12.345.678/0001-90" },
  { label: "Regime Tributário:", value: "Simples Nacional" },
  { label: "Ambiente SEFAZ:", value: "Homologação / Simulado", highlight: true },
]

export function ConfigView() {
  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border bg-card p-6">
      <h3 className="text-base font-bold">Dados Cadastrais da Empresa</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        {FIELDS.map((f) => (
          <div key={f.label} className="space-y-1">
            <Label htmlFor={f.label}>{f.label}</Label>
            <Input
              id={f.label}
              value={f.value}
              readOnly
              className={`font-mono ${f.highlight ? "font-bold text-success" : ""}`}
            />
          </div>
        ))}
      </div>
      <Button className="font-extrabold" onClick={() => alert("Configurações salvas!")}>
        Salvar Alterações
      </Button>
    </div>
  )
}
