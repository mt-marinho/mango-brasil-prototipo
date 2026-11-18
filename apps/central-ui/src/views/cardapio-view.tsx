import { useState } from "react"

import { GlIcon } from "@/components/gl-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { brl } from "@/lib/format"
import type { CentralData } from "@/lib/use-central-data"

const TAB_STYLE = "flex-none px-4 data-active:border-primary/50 data-active:bg-primary/10 data-active:text-foreground dark:data-active:border-primary/50 dark:data-active:bg-primary/10"

export function CardapioView({ data }: { data: CentralData }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const categories = data.categories.filter((item) => data.products.some((product) => product.categoryId === item.id))
  const filtered = data.products.filter((product) =>
    (category === "all" || product.categoryId === category) &&
    product.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")),
  )

  async function toggle(id: string) {
    setPending((current) => ({ ...current, [id]: true }))
    setErrors((current) => ({ ...current, [id]: "" }))
    try {
      await api.toggleProduct(id)
      await data.reload()
    } catch {
      setErrors((current) => ({ ...current, [id]: "Não foi possível alterar a disponibilidade. Tente novamente." }))
    } finally {
      setPending((current) => ({ ...current, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulte o cardápio e gerencie a disponibilidade dos produtos.</p>
        </div>
        <Button className="h-10 px-4" onClick={() => alert("Cadastro de produtos ainda não implementado nesta versão.")}>
          <GlIcon name="plus" /> Cadastrar produto
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={category} onValueChange={(value) => setCategory(String(value))} className="min-w-0 max-w-full">
          <div className="pdv-scroll max-w-full overflow-x-auto py-1">
            <TabsList aria-label="Categorias do cardápio" className="w-max justify-start gap-1 bg-muted/60 p-1 group-data-horizontal/tabs:h-11">
              <TabsTrigger value="all" className={TAB_STYLE}>Todos</TabsTrigger>
              {categories.map((item) => <TabsTrigger key={item.id} value={item.id} className={TAB_STYLE}>{item.name}</TabsTrigger>)}
            </TabsList>
          </div>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <GlIcon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Buscar produto" className="h-10 pl-9" placeholder="Buscar produto" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="!mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "produto" : "produtos"}</p>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="text-sm font-medium">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente outra busca ou selecione outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((product) => {
            const categoryName = data.categories.find((item) => item.id === product.categoryId)?.name
            return (
              <article key={product.id} className="flex min-w-0 flex-col rounded-xl border bg-card p-4">
                <div className="flex items-start gap-4">
                  <img src={product.imageUrl} alt="" className="size-20 shrink-0 rounded-lg bg-background object-cover" />
                  <div className="min-w-0 flex-1">
                    {categoryName && <p className="text-xs text-muted-foreground">{categoryName}</p>}
                    <h3 className="mt-1 text-sm leading-5 font-semibold">{product.name}</h3>
                    <p className="mt-2 text-base font-semibold tabular-nums">{brl(product.basePrice)}</p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-xs leading-5 text-muted-foreground">{product.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <GlIcon name={product.active ? "check-circle" : "pause"} className="size-4" />
                    {product.active ? "Disponível no cardápio" : "Indisponível no cardápio"}
                  </span>
                  <Switch checked={product.active} disabled={pending[product.id]} onCheckedChange={() => void toggle(product.id)} aria-label={`Disponibilidade de ${product.name}`} />
                </div>
                {errors[product.id] && <p role="alert" className="mt-3 text-xs text-destructive">{errors[product.id]}</p>}
              </article>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
