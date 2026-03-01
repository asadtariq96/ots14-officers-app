import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogOut, Shield, ShieldCheck, Users, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/use-auth'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar'
import { Separator } from '../ui/separator'
import type { ReactNode } from 'react'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/officers',
    label: 'Officers',
    icon: Users,
  },
  {
    to: '/subscriptions',
    label: 'Subscriptions',
    icon: Wallet,
  },
]

function AppSidebar() {
  const location = useLocation()
  const { signOut, role, user } = useAuth()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brass/15">
            <Shield className="h-4 w-4 text-brass" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brass/70">
              14th OTS
            </p>
            <p className="text-sm font-semibold leading-tight text-sidebar-foreground">
              Officers Database
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(to)}
                    tooltip={label}
                  >
                    <NavLink to={to}>
                      <Icon />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex flex-col gap-2.5 px-2 py-3">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1.5 border-brass/20 bg-brass/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brass group-data-[collapsible=icon]:hidden"
            >
              <ShieldCheck className="h-3 w-3" />
              {role ?? 'unknown'}
            </Badge>
          </div>
          <p className="truncate text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            {user?.email}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-sidebar-border bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-card px-5">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
              Pakistan Army
            </p>
            <span className="text-muted-foreground/30">|</span>
            <p className="text-sm font-medium text-foreground">
              Alumni Records
            </p>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-5 p-5 md:p-7">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
