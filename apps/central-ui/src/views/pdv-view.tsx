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
  const itemCount = cart.reduce((total, line) => total + line.quantity, 0)

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
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-card px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Frescor que tempera o dia</p>
            <h1 className="mt-1 text-xl font-extrabold">Manga boa. Tempero brasileiro.</h1>
            <p className="mt-1 text-xs text-muted-foreground">Clássica, picante ou agridoce: escolha o sabor do próximo pedido.</p>
          </div>
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

      <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-card lg:w-[380px]">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Venda presencial</p>
            <h3 className="mt-1 text-base font-bold tracking-tight">Pedido do balcão</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {itemCount === 1 ? "1 item no pedido" : itemCount + " itens no pedido"}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setCart([])} disabled={cart.length === 0}>
            <GlIcon name="remove" /> Limpar
          </Button>
        </div>

        <div className="flex min-h-36 flex-1 flex-col overflow-y-auto px-5 py-2">
          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full border bg-muted/50 text-muted-foreground">
                <GlIcon name="doc-text" className="size-5" />
              </div>
              <p className="text-sm font-semibold">Seu pedido está vazio</p>
              <p className="mt-1 max-w-52 text-xs leading-relaxed text-muted-foreground">
                Selecione os produtos no cardápio para iniciar uma venda.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map((l) => (
                <div key={l.product.id} className="flex items-start gap-3 py-4">
                  <img src={l.product.imageUrl} alt="" className="size-12 shrink-0 rounded-md bg-muted object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{brl(l.product.basePrice)} / unidade</p>
                    <div className="mt-2 flex items-center gap-1">
                      <Button variant="outline" size="icon-xs" aria-label={"Diminuir quantidade de " + l.product.name} onClick={() => changeQty(l.product.id, -1)}>
                        <GlIcon name="dash" />
                      </Button>
                      <span className="w-6 text-center text-xs font-semibold tabular-nums">{l.quantity}</span>
                      <Button variant="outline" size="icon-xs" aria-label={"Aumentar quantidade de " + l.product.name} onClick={() => changeQty(l.product.id, 1)}>
                        <GlIcon name="plus" />
                      </Button>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{brl(l.quantity * l.product.basePrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 border-t px-5 py-5">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{brl(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tributos aproximados inclusos</span>
              <span className="tabular-nums">{brl(ibpt)}</span>
            </div>
            <div className="flex items-end justify-between border-t pt-3">
              <span className="font-semibold">Total a pagar</span>
              <span className="text-xl font-bold tracking-tight tabular-nums">{brl(subtotal)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold">Forma de pagamento</p>
            <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Forma de pagamento">
              {PAYMENTS.map((p) => (
                <Button key={p.method} variant="outline" aria-pressed={method === p.method}
                  className={cn(
                    "h-14 flex-col gap-1 rounded-lg px-1 text-[11px] font-medium",
                    method === p.method && "border-primary bg-primary/10 text-foreground ring-1 ring-primary hover:bg-primary/15 dark:bg-primary/10",
                  )}
                  onClick={() => setMethod(p.method)}>
                  <GlIcon name={p.icon} className={cn("size-4", method === p.method && "text-primary")} />
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {method === "CASH" && (
            <div className="space-y-2">
              <label htmlFor="cash-given" className="text-xs font-semibold">Valor recebido</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <Input id="cash-given" type="number" min="0" step="0.01" value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)} placeholder="0,00" className="h-10 pl-9 text-sm tabular-nums" />
                </div>
                <div className="min-w-24 text-right">
                  <span className="block text-[11px] text-muted-foreground">Troco</span>
                  <span className="text-sm font-semibold tabular-nums">{brl(change)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="customer-cpf" className="text-xs font-semibold">
              CPF na nota <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input id="customer-cpf" value={cpf} onChange={(e) => setCpf(e.target.value)}
              placeholder="Somente números" inputMode="numeric" className="h-10 text-sm" />
          </div>

          <Button size="lg" disabled={busy} onClick={finalize}
            className="h-11 w-full rounded-lg text-sm font-semibold">
            {busy ? <><GlIcon name="hourglass" /> Finalizando venda...</> : <>Finalizar venda <GlIcon name="arrow-right" /></>}
          </Button>
        </div>
      </aside>
    </div>
  )
}
