import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSocket } from '@/lib/socket';

// Components
import { AppSidebar } from '@/features/dashboard/components/AppSidebar';
import { TopBar } from '@/features/dashboard/components/TopBar';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { ReportsPage } from '@/features/dashboard/components/ReportsPage';
import { ActivityLogsPage } from '@/features/dashboard/components/ActivityLogsPage';

const queryClient = new QueryClient();

// Stub for teammate phases
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        This section is currently being developed in another phase. 
        It will be available once the branches are merged.
      </p>
    </div>
  );
}

function Layout() {
  // Initialize socket connection
  useSocket();

  // Force dark mode for demo purposes
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="activity" element={<ActivityLogsPage />} />
              
              {/* Stub Routes */}
              <Route path="organization" element={<PlaceholderPage title="Organization Setup" />} />
              <Route path="assets/*" element={<PlaceholderPage title="Asset Management" />} />
              <Route path="allocation" element={<PlaceholderPage title="Allocation & Transfer" />} />
              <Route path="bookings/*" element={<PlaceholderPage title="Resource Booking" />} />
              <Route path="maintenance/*" element={<PlaceholderPage title="Maintenance Workflow" />} />
              <Route path="audit" element={<PlaceholderPage title="Audit Cycles" />} />
              <Route path="notifications" element={<PlaceholderPage title="All Notifications" />} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
