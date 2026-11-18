import * as React from "react"

import { GlIcon } from "@/components/gl-icon"
import { NavUser } from "@/components/nav-user"
import { NAV_ITEMS, NAV_MODULES, type TabId } from "@/components/nav-items"
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
  useSidebar,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeTab: TabId
  onNavigate: (tab: TabId) => void
  kdsPending: number
  theme: "dark" | "light"
  onToggleTheme: () => void
}

export function AppSidebar({
  activeTab,
  onNavigate,
  kdsPending,
  theme,
  onToggleTheme,
  ...props
}: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="overflow-hidden px-2 py-4 text-sm font-extrabold tracking-tight whitespace-nowrap text-sidebar-foreground">
              MANGO BRASIL
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_MODULES.map((module) => <SidebarGroup key={module.label}>
          <SidebarGroupLabel>{module.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {module.items.map((id) => NAV_ITEMS.find((item) => item.id === id)!).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={activeTab === item.id}
                    onClick={() => { onNavigate(item.id); if (isMobile) setOpenMobile(false) }}
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
        </SidebarGroup>)}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              <GlIcon name={theme === "dark" ? "sun" : "moon"} />
              <span>{theme === "dark" ? "Tema escuro" : "Tema claro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
        </SidebarMenu>
        <NavUser user={{ name: "Lucas Atendente", role: "ATENDENTE (PDV)" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
