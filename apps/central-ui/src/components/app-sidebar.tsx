import * as React from "react"

import { GlIcon } from "@/components/gl-icon"
import { NavUser } from "@/components/nav-user"
import { NAV_ITEMS, type TabId } from "@/components/nav-items"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeTab: TabId
  onNavigate: (tab: TabId) => void
  kdsPending: number
}

export function AppSidebar({
  activeTab,
  onNavigate,
  kdsPending,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#153e2b] text-white">
                <img src="/mango-mark.svg" alt="" className="size-8" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-extrabold tracking-tight">MANGO BRASIL</span>
                <span className="truncate font-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
                  Mangas temperadas
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={activeTab === item.id}
                    onClick={() => onNavigate(item.id)}
                  >
                    <GlIcon name={item.icon} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.id === "kds" && kdsPending > 0 && (
                    <SidebarMenuBadge className="font-mono text-primary">
                      {kdsPending}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Abrir Totem Kiosk"
              className="bg-info/15 font-bold text-info hover:bg-info/25 hover:text-info"
              render={<a href="/totem" target="_blank" rel="noreferrer" />}
            >
              <GlIcon name="tablet" />
              <span>Abrir Totem Kiosk</span>
              <GlIcon name="external-link" className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cockpit Mesa Redonda"
              render={<a href="http://localhost:5050" target="_blank" rel="noreferrer" />}
            >
              <GlIcon name="orbit" />
              <span>Cockpit Mesa Redonda</span>
              <GlIcon name="external-link" className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={{ name: "Lucas Atendente", role: "ATENDENTE (PDV)" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
