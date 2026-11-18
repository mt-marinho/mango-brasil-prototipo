import { useMemo, useState } from "react"

import { GlIcon } from "@/components/gl-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { brl } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"
import type { Order, PaymentMethod, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CartLine {
  product: Product
  quantity: number
}

const CATEGORY_ICONS: Record<string, string> = {
  "cat-1": "food",
  "cat-2": "package",
  "cat-3": "tag",
  "cat-4": "star",
}

const PAYMENTS: { method: PaymentMethod; label: string; icon: string }[] = [
  { method: "CASH", label: "Dinheiro", icon: "scale" },
  { method: "DEBIT_CARD", label: "Débito", icon: "credit-card" },
  { method: "CREDIT_CARD", label: "Crédito", icon: "credit-card" },
  { method: "PIX", label: "Pix", icon: "bolt" },
]

export function PdvView({
  data,
  onSaleCompleted,
}: {
  data: CentralData
  onSaleCompleted: (order: Order) => void
}) {
  const [category, setCategory] = useState("all")
  const [cart, setCart] = useState<CartLine[]>([])
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [cashGiven, setCashGiven] = useState("")
  const [cpf, setCpf] = useState("")
  const [busy, setBusy] = useState(false)

  const products = useMemo(
    () =>
      data.products.filter((p) => p.active && (category === "all" || p.categoryId === category)),
    [data.products, category],
  )

  const subtotal = cart.reduce((acc, l) => acc + l.quantity * l.product.basePrice, 0)
  const ibpt = cart.reduce(
    (acc, l) =>
      acc + l.quantity * l.product.basePrice * ((l.product.fiscal?.aliquotaIbpt ?? 18) / 100),
    0,
  )
  const given = Number(cashGiven || 0)
  const change = given >= subtotal && subtotal > 0 ? given - subtotal : 0

  const add = (product: Product) =>
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === product.id)
      return found
        ? prev.map((l) => (l === found ? { ...l, quantity: l.quantity + 1 } : l))
        : [...prev, { product, quantity: 1 }]
    })

  const changeQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    )

  async function finalize() {
    if (cart.length === 0) {
      alert("Adicione pelo menos um produto ao pedido!")
      return
    }
    setBusy(true)
    const payload = {
      origin: "PDV_ASSISTED",
      clientCpf: cpf.trim() || undefined,
      items: cart.map((l, idx) => ({
        id: `item-${idx + 1}`,
        productId: l.product.id,
        productName: l.product.name,
        unitPrice: l.product.basePrice,
        quantity: l.quantity,
        totalPrice: l.quantity * l.product.basePrice,
        fiscal: l.product.fiscal,
      })),
      payments: [
        {
          id: `pay-${Date.now()}`,
          method,
          amount: subtotal,
          status: "APPROVED",
          paidAt: new Date().toISOString(),
        },
      ],
    }
    try {
      const order = await api.createOrder(payload)
      setCart([])
      setCashGiven("")
      setCpf("")
      await data.reload()
      onSaleCompleted(order)
    } catch (err) {
      alert("Erro ao finalizar pedido: " + (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-6 lg:h-full lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-[#21452e] to-card px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Frescor que tempera o dia</p>
            <h1 className="mt-1 text-xl font-extrabold">Manga boa. Tempero brasileiro.</h1>
            <p className="mt-1 text-xs text-muted-foreground">Clássica, picante ou agridoce: escolha o sabor do próximo pedido.</p>
          </div>
          <img src="/mango-mark.svg" alt="Mango Brasil" className="size-14 shrink-0" />
        </div>
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-1 text-xs">
          <Button
            size="sm"
            variant={category === "all" ? "default" : "outline"}
            onClick={() => setCategory("all")}
          >
            Todos os Itens
          </Button>
          {data.categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={category === c.id ? "default" : "outline"}
              onClick={() => setCategory(c.id)}
            >
              <GlIcon name={CATEGORY_ICONS[c.id] ?? "tag"} />
              {c.name}
            </Button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col justify-between rounded-2xl border bg-card p-3 transition-colors hover:border-primary/50"
            >
              <div>
                <div className="relative mb-2.5 h-40 overflow-hidden rounded-xl bg-background">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute right-2 bottom-2 rounded-lg bg-black/80 px-2 py-0.5 font-mono text-xs font-extrabold text-primary">
                    {brl(p.basePrice)}
                  </span>
                </div>
                <h4 className="mb-1 text-xs leading-tight font-bold">{p.name}</h4>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => add(p)}>
                <GlIcon name="plus" />
                Adicionar ao Carrinho
              </Button>
            </div>
          ))}
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col lg:w-96 justify-between rounded-2xl border bg-card p-4 shadow-2xl">
        <div>
          <div className="mb-3 flex items-center justify-between border-b pb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <GlIcon name="doc-text" /> Pedido do Balcão
            </h3>
            <Button variant="ghost" size="xs" className="text-destructive" onClick={() => setCart([])}>
              <GlIcon name="remove" /> Limpar Carrinho
            </Button>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1 text-xs">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum item adicionado. Clique nos produtos para vender.
              </div>
            ) : (
              cart.map((l) => (
                <div
                  key={l.product.id}
                  className="flex items-center justify-between gap-2 rounded-xl border bg-background p-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{l.product.name}</div>
                    <div className="font-mono text-[10px] text-primary">
                      {brl(l.product.basePrice)} un.
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      aria-label="Diminuir quantidade"
                      onClick={() => changeQty(l.product.id, -1)}
                    >
                      <GlIcon name="dash" />
                    </Button>
                    <span className="w-6 text-center font-mono text-xs font-bold">{l.quantity}</span>
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      aria-label="Aumentar quantidade"
                      onClick={() => changeQty(l.product.id, 1)}
                    >
                      <GlIcon name="plus" />
                    </Button>
                  </div>
                  <div className="w-16 shrink-0 text-right font-mono text-xs font-bold">
                    {brl(l.quantity * l.product.basePrice)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-3 space-y-3 border-t pt-3 text-xs">
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{brl(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tributos Aprox. (IBPT):</span>
              <span className="text-primary">{brl(ibpt)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-base font-bold">
              <span>TOTAL A PAGAR:</span>
              <span className="text-lg font-extrabold text-success">{brl(subtotal)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Forma de Pagamento:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENTS.map((p) => (
                <Button
                  key={p.method}
                  variant={method === p.method ? "default" : "outline"}
                  aria-pressed={method === p.method}
                  className="h-auto flex-col gap-1 py-2 text-[11px]"
                  onClick={() => setMethod(p.method)}
                >
                  <GlIcon name={p.icon} />
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {method === "CASH" && (
            <div className="space-y-1.5 rounded-xl border bg-background p-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="cash-given" className="text-muted-foreground">
                  Valor Recebido (R$):
                </label>
                <Input
                  id="cash-given"
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0,00"
                  className="h-7 w-24 text-right font-bold"
                />
              </div>
              <div
                className={cn(
                  "flex items-center justify-between border-t pt-1 font-bold",
                  change > 0 ? "text-success" : "text-primary",
                )}
              >
                <span>TROCO:</span>
                <span>{brl(change)}</span>
              </div>
            </div>
          )}

          <Input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF na nota (opcional, apenas números)"
            className="font-mono text-[11px]"
          />

          <Button
            size="lg"
            disabled={busy}
            onClick={finalize}
            className="h-11 w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-400"
          >
            {busy ? (
              <>
                <GlIcon name="hourglass" /> Emitindo NFC-e &amp; Enviando...
              </>
            ) : (
              <>
                <GlIcon name="rocket" /> Finalizar Venda &amp; Emitir NFC-e
              </>
            )}
          </Button>
        </div>
      </aside>
    </div>
  )
}
