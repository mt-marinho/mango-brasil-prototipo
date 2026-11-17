import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { brl } from "@/lib/format"
import type { Order } from "@/lib/types"
import { PAYMENT_LABEL } from "@/components/status-badge"

const SIMULATED_KEY = "50241112345678000190650010000001021873912834"

/** Cupom DANFE NFC-e — o "papel" mantém tema claro de propósito (simula impressão térmica). */
export function DanfeDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const key = order?.nfceKey || SIMULATED_KEY
  const qty = order?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0
  const method = order?.payments[0]?.method

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-sm gap-3 overflow-y-auto bg-[#fbfbfb] p-6 font-mono text-xs text-[#1a1a1a] shadow-2xl">
        {order && (
          <>
            <div className="space-y-1 border-b border-dashed border-neutral-400 pb-3 text-center">
              <DialogTitle className="text-sm font-extrabold tracking-tight text-[#1a1a1a]">
                BURGER TECH RESTAURANTE
              </DialogTitle>
              <p className="text-[10px]">CNPJ: 12.345.678/0001-90 &bull; IE: 283749102</p>
              <p className="text-[10px]">Rua das Lanchonetes, 100 - Centro</p>
              <DialogDescription className="mt-1 text-[11px] font-bold text-[#1a1a1a]">
                DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
              </DialogDescription>
            </div>

            <div className="space-y-1 border-b border-dashed border-neutral-400 py-2 text-[11px]">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>
                    {it.quantity}x {it.productName}
                  </span>
                  <span>{brl(it.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between">
                <span>QTD. TOTAL DE ITENS:</span>
                <span>{qty}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VALOR TOTAL R$:</span>
                <span>{brl(order.total)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-normal">
                <span>FORMA PAGAMENTO:</span>
                <span className="uppercase">{method ? (PAYMENT_LABEL[method] ?? method) : "DINHEIRO"}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-dashed border-neutral-400 pt-3 text-center">
              <p className="text-[9px] font-bold text-neutral-600 uppercase">
                Consulte pela Chave de Acesso em sefaz.gov.br:
              </p>
              <p className="rounded bg-neutral-200 p-1.5 font-mono text-[9px] break-all">{key}</p>
              <div className="flex flex-col items-center justify-center rounded border border-neutral-300 bg-white p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                    `https://www.sefaz.gov.br/nfce/qrcode?p=${key}`,
                  )}`}
                  alt="QR Code NFC-e"
                  className="size-28"
                />
                <span className="mt-1 text-[9px] text-neutral-500">QR-Code Versão 2.0 (CSC Assinado)</span>
              </div>
              <div className="font-mono text-[9px] text-neutral-500">
                Protocolo de Autorização: 150240001928374
                <br />
                Data de Emissão: {new Date(order.createdAt).toLocaleString("pt-BR")}
              </div>
              <Button
                className="mt-2 w-full bg-neutral-900 text-xs font-bold text-white hover:bg-neutral-700"
                onClick={onClose}
              >
                Fechar Cupom
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
