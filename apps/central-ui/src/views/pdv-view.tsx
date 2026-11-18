import { useMemo, useState, type ReactNode } from "react"

import { GlIcon } from "@/components/gl-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  { method: "PIX", label: "Pix" },
  { method: "CREDIT_CARD", label: "Crédito" },
  { method: "DEBIT_CARD", label: "Débito" },
  { method: "CASH", label: "Dinheiro" },
]

const ACTIVE_CATEGORY_STYLE = "flex-none px-4 data-active:border-primary/50 data-active:bg-primary/10 data-active:text-foreground dark:data-active:border-primary/50 dark:data-active:bg-primary/10"

function PaymentIcon({ method, selected }: { method: PaymentMethod; selected: boolean }) {
  if (method === "CASH") {
    return <span aria-hidden="true" className={cn("flex size-5 items-center justify-center text-base leading-none font-semibold", selected && "text-primary")}>$</span>
  }
  if (method === "PIX") {
    return <img src="/pix.svg" alt="" aria-hidden="true" className="size-5 shrink-0 dark:invert" />
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cn("size-5 shrink-0", selected && "text-primary")}>
      <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 9.5h18" />
          {method === "DEBIT_CARD" ? <path d="M8 13v3m-1.5-1.5L8 16l1.5-1.5" /> : <path d="M7 15h4" />}
      </>
    </svg>
  )
}

export function PdvView({
  data,
  onSaleCompleted,
  header,
}: {
  data: CentralData
  onSaleCompleted: (order: Order) => void
  header: ReactNode
}) {
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [cashGiven, setCashGiven] = useState("")
  const [cpf, setCpf] = useState("")
  const [showCpf, setShowCpf] = useState(false)
  const [busy, setBusy] = useState(false)

  const products = useMemo(
    () =>
      data.products.filter((p) => p.active && (category === "all" || p.categoryId === category)
        && p.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))),
    [data.products, category, search],
  )

  const subtotal = cart.reduce((acc, l) => acc + l.quantity * l.product.basePrice, 0)
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
      setShowCpf(false)
      await data.reload()
      onSaleCompleted(order)
    } catch (err) {
      alert("Erro ao finalizar pedido: " + (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pdv-scroll flex h-full min-h-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <section aria-label="Produtos" className="flex min-w-0 shrink-0 flex-col lg:min-h-0 lg:flex-1">
        {header}
        <div className="flex flex-col gap-4 px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6 lg:min-h-0 lg:flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
        <Tabs value={category} onValueChange={(value) => { if (typeof value === "string") setCategory(value) }}
          className="flex min-h-0 flex-col gap-4 lg:flex-1">
        <div className="pdv-scroll shrink-0 overflow-x-auto py-1">
          <TabsList aria-label="Categorias de produtos" className="w-max justify-start gap-1 bg-muted/60 p-1 group-data-horizontal/tabs:h-11">
          <TabsTrigger value="all" className={ACTIVE_CATEGORY_STYLE}>
            Todos
          </TabsTrigger>
          {data.categories.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className={ACTIVE_CATEGORY_STYLE}>
              {c.name}
            </TabsTrigger>
          ))}
          </TabsList>
        </div>

        <TabsContent value={category} className="pdv-scroll grid min-h-0 grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:flex-1 lg:overflow-y-auto lg:pr-1 xl:grid-cols-3">
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
        </TabsContent>
        </Tabs>
        </div>
      </section>

      <aside aria-label="Pedido do balcão" className="pdv-scroll flex w-full shrink-0 flex-col overflow-x-hidden overflow-y-auto border-t bg-card lg:h-full lg:min-h-0 lg:w-[380px] lg:border-t-0 lg:border-l">
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
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M4 10h16l-1.3 8.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8L4 10Z" />
                  <path d="m8 10 4-6 4 6M9 14v2.5M15 14v2.5" />
                </svg>
              </div>
              <p className="text-sm font-semibold">Seu pedido está vazio</p>
              <p className="mt-1 max-w-52 text-xs leading-relaxed text-muted-foreground">
                Selecione os produtos no cardápio para iniciar uma venda.
              </p>
            </div>
          ) : (
            <div>
              {cart.map((l) => (
                <div key={l.product.id} className="relative flex items-start gap-3 py-4 after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-[60px] after:h-px after:bg-border/50 last:after:hidden">
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

        <div className="flex flex-col gap-5 border-t px-5 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Total a pagar</span>
            <span className="text-xl font-bold tracking-tight tabular-nums">{brl(subtotal)}</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold">Forma de pagamento</p>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Forma de pagamento">
              {PAYMENTS.map((p) => (
                <Button key={p.method} variant="outline" aria-pressed={method === p.method}
                  className={cn(
                    "h-15 flex-col gap-1.5 rounded-lg px-1 text-[11px] font-medium",
                    method === p.method && "border-primary/50 bg-primary/10 text-foreground hover:bg-primary/15 dark:border-primary/50 dark:bg-primary/10",
                  )}
                  onClick={() => setMethod(p.method)}>
                  <PaymentIcon method={p.method} selected={method === p.method} />
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {method === "CASH" && (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2">
              <label htmlFor="cash-given" className="text-xs font-semibold">Valor recebido</label>
              <span className="text-right text-xs font-semibold text-muted-foreground">Troco</span>
                <div className="relative min-w-0">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <Input id="cash-given" type="number" min="0" step="0.01" value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)} placeholder="0,00" className="h-10 pl-9 text-sm tabular-nums" />
                </div>
                <div className="flex h-10 min-w-20 items-center justify-end text-right">
                  <span className="text-sm font-semibold tabular-nums">{brl(change)}</span>
                </div>
            </div>
          )}

          <div className="space-y-2">
            <button type="button" aria-expanded={showCpf} aria-controls={showCpf ? "customer-cpf-field" : undefined}
              onClick={() => { setShowCpf(!showCpf); if (showCpf) setCpf("") }}
              className="flex min-h-8 items-center gap-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <GlIcon name={showCpf ? "dash" : "plus"} />
              {showCpf ? "Remover CPF da nota" : "Adicionar CPF na nota"}
            </button>
            {showCpf && <div id="customer-cpf-field" className="space-y-2">
              <label htmlFor="customer-cpf" className="block text-xs font-semibold">CPF na nota</label>
              <Input id="customer-cpf" value={cpf} onChange={(e) => setCpf(e.target.value)}
                placeholder="Somente números" inputMode="numeric" className="h-10 text-sm" />
            </div>}
          </div>

          <Button size="lg" disabled={busy} onClick={finalize}
            className="h-12 w-full rounded-lg text-sm font-semibold">
            {busy ? <><GlIcon name="hourglass" /> Finalizando venda...</> : <>Finalizar venda <GlIcon name="arrow-right" /></>}
          </Button>
        </div>
      </aside>
    </div>
  )
}
