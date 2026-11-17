export const brl = (value: number) =>
  `R$ ${value.toFixed(2).replace(".", ",")}`

export function elapsed(isoString: string) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${Math.max(diff, 0)}s`
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  return `${Math.floor(diff / 3600)} h`
}
