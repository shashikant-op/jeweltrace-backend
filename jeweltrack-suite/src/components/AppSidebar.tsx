import { 
  LayoutDashboard, Package, Receipt, Users, Wrench, BarChart3, Settings, Crown,
  ChevronLeft, ChevronRight, ShieldAlert
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useStore } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Repairs", url: "/repairs", icon: Wrench },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ['superadmin', 'owner', 'manager'] },
  { title: "Subscription", url: "/subscription", icon: Crown, roles: ['superadmin', 'owner'] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ['superadmin', 'owner'] },
  { title: "SuperAdmin", url: "/superadmin", icon: ShieldAlert, roles: ['superadmin'] },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: store } = useStore();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden">
            <img src="/favicon.ico" alt="Logo" className="h-full w-full rounded-full object-cover" draggable={false} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-accent-foreground font-display">
                JewelTrack
              </span>
              <span className="text-xs text-sidebar-foreground">
                {store?.name || 'My Store'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`px-2 ${collapsed ? "items-center" : ""}`}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
