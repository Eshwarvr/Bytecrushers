import { NotificationBell } from './NotificationBell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocation } from 'react-router-dom';

export function TopBar() {
  const location = useLocation();
  
  let pageName = "Dashboard";
  if (location.pathname.startsWith('/reports')) pageName = "Reports & Analytics";
  else if (location.pathname.startsWith('/activity')) pageName = "Activity Logs";
  else if (location.pathname.startsWith('/notifications')) pageName = "Notifications";
  else if (location.pathname !== '/') {
    // Generate name from path
    pageName = location.pathname.split('/')[1] || '';
    pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6">
      <SidebarTrigger className="-ml-2" />
      <div className="w-px h-4 bg-border" />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">{pageName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="ml-auto flex items-center gap-4">
        <NotificationBell />
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-sm text-left">
            <span className="font-medium leading-none">Admin User</span>
            <span className="text-xs text-muted-foreground">admin@assetflow.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
