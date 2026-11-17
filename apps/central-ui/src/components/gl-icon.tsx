import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Ícone da biblioteca GitLab SVGs (@gitlab/svgs).
 * O sprite é copiado de node_modules para /gitlab-icons.svg (ver script `sync:icons`).
 * Catálogo: https://gitlab-org.gitlab.io/gitlab-svgs/
 */
export type GlIconName = string

export function GlIcon({
  name,
  className,
  ...props
}: { name: GlIconName } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("size-4 shrink-0 fill-current", className)}
      {...props}
    >
      <use href={`/gitlab-icons.svg#${name}`} />
    </svg>
  )
}
