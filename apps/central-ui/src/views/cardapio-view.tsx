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

      <div className="!mb-2 flex flex-wrap items-center justify-between gap-4">
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

      <div className="!mt-0">
      <p className="pb-3 text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "produto" : "produtos"}</p>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="text-sm font-medium">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente outra busca ou selecione outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((product) => {
            return (
              <article key={product.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="relative h-32 overflow-hidden bg-muted xl:h-36">
                  <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
                  <Button variant="outline" size="icon" className="absolute top-2 right-2 bg-card" aria-label={`Editar ${product.name}`} onClick={() => alert("Edição de produtos ainda não implementada nesta versão.")}>
                    <GlIcon name="pencil" />
                  </Button>
                </div>
                <div className="space-y-1 px-4 pt-3">
                  <h3 className="text-sm leading-snug font-semibold">{product.name}</h3>
                  <p className="line-clamp-2 min-h-9 text-xs leading-[1.45] text-muted-foreground">{product.description}</p>
                </div>
                <div className="px-4 pt-3 text-base font-bold tabular-nums">{brl(product.basePrice)}</div>
                <div className="mt-auto flex items-center justify-between gap-3 px-4 pt-3 pb-4">
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <GlIcon name={product.active ? "check-circle" : "pause"} className="size-4" />
                    {product.active ? "Disponível no cardápio" : "Indisponível no cardápio"}
                  </span>
                  <Switch checked={product.active} disabled={pending[product.id]} onCheckedChange={() => void toggle(product.id)} aria-label={`Disponibilidade de ${product.name}`} />
                </div>
                {errors[product.id] && <p role="alert" className="px-4 pb-4 text-xs text-destructive">{errors[product.id]}</p>}
              </article>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
