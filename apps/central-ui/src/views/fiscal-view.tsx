import { GlIcon } from "@/components/gl-icon"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { brl } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"

const SIMULATED_KEY = "50241112345678000190650010000001021873912834"

export function FiscalView({
  data,
  onOpenDanfe,
}: {
  data: CentralData
  onOpenDanfe: (orderId: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2 rounded-2xl border bg-card p-4">
          <span className="text-xs font-bold text-muted-foreground uppercase">Certificado A1 &amp; CSC</span>
          <div className="text-sm font-bold">BURGER TECH RESTAURANTE LTDA</div>
          <p className="font-mono text-[11px] text-success">CNPJ: 12.345.678/0001-90</p>
          <p className="font-mono text-[11px] text-muted-foreground">CSC Token: A1B2...CDEF (ID 000001)</p>
        </div>
        <div className="space-y-2 rounded-2xl border bg-card p-4">
          <span className="text-xs font-bold text-muted-foreground uppercase">Série &amp; Numeração</span>
          <div className="text-sm font-bold">Série: 1 &bull; Modelo: 65 (NFC-e)</div>
          <p className="font-mono text-[11px] text-primary">Próximo Número: #000104</p>
          <p className="text-[11px] text-muted-foreground">Módulo 11 de Chave validado</p>
        </div>
        <div className="space-y-2 rounded-2xl border bg-card p-4">
          <span className="text-xs font-bold text-muted-foreground uppercase">Contingência Offline</span>
          <div>
            <StatusBadge tone="success" icon="check-circle">
              Buffer Habilitado (tpEmis=9)
            </StatusBadge>
          </div>
          <p className="text-[11px] text-muted-foreground">Fallback automático se SEFAZ oscilar</p>
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0"
            onClick={() => alert("Contingência offline ativada para testes de queda de conexão!")}
          >
            <GlIcon name="warning" /> Simular Queda de SEFAZ
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-4 text-sm font-bold">
          <span>Repositório de NFC-e Emitidas</span>
          <span className="font-mono text-xs font-normal text-muted-foreground">XMLs Armazenados</span>
        </div>
        <Table className="font-mono text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Senha</TableHead>
              <TableHead>Chave de Acesso (44 dígitos)</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-bold text-primary">#{o.publicTicketNumber}</TableCell>
                <TableCell
                  className="max-w-sm truncate text-[11px]"
                  title={o.nfceKey || "Chave simulada"}
                >
                  {o.nfceKey || SIMULATED_KEY}
                </TableCell>
                <TableCell className="font-bold">{brl(o.total)}</TableCell>
                <TableCell>
                  <StatusBadge tone="success" icon="check-circle">
                    AUTORIZADA
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="xs" className="font-extrabold" onClick={() => onOpenDanfe(o.id)}>
                    <GlIcon name="doc-text" /> Ver DANFE NFC-e
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
