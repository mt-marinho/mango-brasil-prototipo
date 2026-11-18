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

const PAYMENTS: { method: PaymentMethod; label: string }[] = [
  { method: "CASH", label: "Dinheiro" },
  { method: "DEBIT_CARD", label: "Débito" },
  { method: "CREDIT_CARD", label: "Crédito" },
  { method: "PIX", label: "Pix" },
]

function PaymentIcon({ method, selected }: { method: PaymentMethod; selected: boolean }) {
  if (method === "PIX") {
    return <img src="/pix.svg" alt="" aria-hidden="true" className="size-5 shrink-0 dark:invert" />
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn("size-5 shrink-0", selected && "text-primary")}>
      {method === "CASH" ? (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 9h.01M18 15h.01" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 9.5h18" />
          {method === "DEBIT_CARD" ? <path d="M8 13v3m-1.5-1.5L8 16l1.5-1.5" /> : <path d="M7 15h4" />}
        </>
      )}
    </svg>
  )
}

export function PdvView({
  data,
  onSaleCompleted,
}: {
  data: CentralData
  onSaleCompleted: (order: Order) => void
}) {
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [cashGiven, setCashGiven] = useState("")
  const [cpf, setCpf] = useState("")
  const [busy, setBusy] = useState(false)

  const products = useMemo(
    () =>
      data.products.filter((p) => p.active && (category === "all" || p.categoryId === category)
        && p.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))),
    [data.products, category, search],
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
    <div className="flex min-h-full flex-col gap-5 lg:h-full lg:min-h-0 lg:flex-row">
      <section aria-label="Produtos" className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Produtos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Selecione os itens para adicionar ao pedido.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <GlIcon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Buscar produto" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto" className="h-10 pl-9 text-sm" />
          </div>
        </div>
        <div className="pdv-scroll flex shrink-0 items-center gap-2 overflow-x-auto pb-1" aria-label="Categorias de produtos">
          <Button
            variant={category === "all" ? "secondary" : "ghost"}
            className={cn("h-10 px-3 text-sm", category === "all" && "bg-primary/15 text-foreground ring-1 ring-primary/50")}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            Todos
          </Button>
          {data.categories.map((c) => (
            <Button
              key={c.id}
              variant={category === c.id ? "secondary" : "ghost"}
              className={cn("h-10 px-3 text-sm", category === c.id && "bg-primary/15 text-foreground ring-1 ring-primary/50")}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <div className="pdv-scroll grid flex-1 grid-cols-1 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {products.length === 0 && <p className="col-span-full rounded-xl border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">Nenhum produto encontrado. Tente outra busca ou categoria.</p>}
          {products.map((p) => (
            <div
              key={p.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
            >
              <div>
                <div className="h-32 overflow-hidden bg-muted xl:h-36">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="size-full object-cover"
                  />
                </div>
                <div className="space-y-1 px-4 pt-3">
                  <h4 className="text-sm leading-snug font-semibold">{p.name}</h4>
                  <p className="line-clamp-2 min-h-9 text-xs leading-[1.45] text-muted-foreground">{p.description}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 px-4 pt-3 pb-4">
                <span className="text-base font-bold tabular-nums">{brl(p.basePrice)}</span>
                <Button variant="outline" className="h-9 px-3 text-xs font-semibold" onClick={() => add(p)} aria-label={"Adicionar " + p.name + " ao pedido"}>
                  <GlIcon name="plus" /> Adicionar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside aria-label="Pedido do balcão" className="pdv-scroll flex w-full shrink-0 flex-col overflow-x-hidden overflow-y-auto rounded-xl border bg-card lg:min-h-0 lg:w-[380px]">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight">Pedido do balcão</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {itemCount === 1 ? "1 item no pedido" : itemCount + " itens no pedido"}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setCart([])} disabled={cart.length === 0}>
            <GlIcon name="remove" /> Limpar
          </Button>
        </div>

        <div className="pdv-scroll flex min-h-36 max-h-72 flex-1 flex-col overflow-y-auto overscroll-contain px-5 lg:min-h-[72px] lg:max-h-none" tabIndex={0} aria-label="Itens selecionados">
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
                <div key={l.product.id} className="flex items-start gap-3 py-3.5">
                  <img src={l.product.imageUrl} alt="" className="size-12 shrink-0 rounded-lg bg-muted object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-semibold">{l.product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{brl(l.product.basePrice)} / unidade</p>
                    <div className="mt-2 flex items-center gap-1">
                      <Button variant="outline" size="icon-sm" aria-label={"Diminuir quantidade de " + l.product.name} onClick={() => changeQty(l.product.id, -1)}>
                        <GlIcon name="dash" />
                      </Button>
                      <span className="w-6 text-center text-xs font-semibold tabular-nums">{l.quantity}</span>
                      <Button variant="outline" size="icon-sm" aria-label={"Aumentar quantidade de " + l.product.name} onClick={() => changeQty(l.product.id, 1)}>
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

        <div className="space-y-4 border-t px-5 py-4">
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
                  <PaymentIcon method={p.method} selected={method === p.method} />
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
