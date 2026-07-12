import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, 
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader 
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, Building, Box, Repeat, Calendar, Wrench, 
  ClipboardCheck, FileText, Bell, Activity
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Organization setup', url: '/organization', icon: Building },
  { title: 'Assets', url: '/assets', icon: Box },
  { title: 'Allocation & Transfer', url: '/allocation', icon: Repeat },
  { title: 'Resource Booking', url: '/bookings', icon: Calendar },
  { title: 'Maintenance', url: '/maintenance', icon: Wrench },
  { title: 'Audit', url: '/audit', icon: ClipboardCheck },
  { title: 'Reports', url: '/reports', icon: FileText },
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Activity Logs', url: '/activity', icon: Activity },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
            AF
          </div>
          AssetFlow
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
