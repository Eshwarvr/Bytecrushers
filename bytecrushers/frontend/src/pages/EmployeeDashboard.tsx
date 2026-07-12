import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';
import { LogOut, Building, ShieldCheck, Loader2, Award, Box, HardDrive, Wrench, Calendar, Repeat, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Phase 4 Imports
import { KPICard } from '../features/dashboard/components/KPICard';
import { OverdueReturnsAlert } from '../features/dashboard/components/OverdueReturnsAlert';
import { ReportReadyPanel } from '../features/dashboard/components/ReportReadyPanel';
import { useDashboardKPIs, useRecentActivity } from '../features/dashboard/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

interface UserProfile {
  user: any;
  employee: {
    name: string;
    role: string;
    email: string;
    department?: { name: string };
    status: string;
  };
}

export default function EmployeeDashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Phase 4 Data Hooks
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/me');
      setCurrentUser(res.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session expired or profile loading failed.';
      console.error('Error loading employee profile:', errorMessage);
      setError(errorMessage);
      setTimeout(() => navigate('/login'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-outfit text-sm">Loading workspace dashboard...</p>
      </div>
    );
  }

  const { employee } = currentUser || {};

  return (
    <div className="min-h-screen bg-background flex flex-col relative pb-12">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -z-10"></div>

      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded text-xs">ERP</span>
            AssetFlow
          </span>

          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer font-inter"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 font-inter flex flex-col gap-8">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* --- Employee Profile Header (Original Phase 2/3) --- */}
        <div className="w-full glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <div className="flex flex-col items-center text-center md:items-start md:text-left shrink-0">
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 text-3xl font-bold font-outfit uppercase">
              {employee?.name ? employee.name[0] : 'U'}
            </div>
            <h2 className="text-3xl font-bold font-outfit text-white">{employee?.name}</h2>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Role Rank: {employee?.role}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Email Address</span>
              <span className="text-sm font-semibold text-white font-mono truncate">{employee?.email}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Department</span>
              <span className="text-sm font-semibold text-white">{employee?.department?.name || 'Unassigned'}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{employee?.status}</span>
            </div>
          </div>
        </div>

        {/* --- Phase 4 Overdue Alert --- */}
        <OverdueReturnsAlert />

        {/* --- Phase 4 Analytics KPI Cards --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard title="Available Assets" value={kpis?.available} icon={<Box className="h-4 w-4" />} isLoading={kpiLoading} />
          <KPICard title="Allocated" value={kpis?.allocated} icon={<HardDrive className="h-4 w-4" />} isLoading={kpiLoading} />
          <KPICard title="In Maintenance" value={kpis?.inMaintenance} icon={<Wrench className="h-4 w-4 text-destructive" />} isLoading={kpiLoading} />
          <KPICard title="Active Bookings" value={kpis?.activeBookings} icon={<Calendar className="h-4 w-4" />} isLoading={kpiLoading} />
          <KPICard title="Pending Transfers" value={kpis?.pendingTransfers} icon={<Repeat className="h-4 w-4" />} isLoading={kpiLoading} />
          <KPICard title="Upcoming Returns" value={kpis?.upcomingReturns} icon={<Activity className="h-4 w-4" />} isLoading={kpiLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- Phase 4 Recent Activity Panel --- */}
          <Card className="col-span-2 border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity?.map(log => (
                    <div key={log.id} className="flex items-start gap-4 border-b border-border/10 pb-4 last:border-0 last:pb-0">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none text-white">
                          {log.actor} <span className="font-normal text-slate-400">{log.action}</span> {log.entityName}
                        </p>
                        <p className="text-sm text-slate-400">
                          {log.details}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                  {recentActivity?.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No recent activity found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- Integrated Actions & Reports --- */}
          <div className="col-span-1 flex flex-col gap-6">
            <ReportReadyPanel />
            
            {/* Quick Links / Role-Based Actions (Original Phase 2/3) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-3">
              <h3 className="text-lg font-bold font-outfit text-white mb-2">Actions</h3>
              
              <button onClick={() => navigate('/assets')} className="w-full p-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded-xl flex items-center gap-3 transition-all">
                <Building className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm font-semibold">Asset Registry</span>
              </button>
              
              <button onClick={() => navigate('/workflows')} className="w-full p-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl flex items-center gap-3 transition-all">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-white text-sm font-semibold">Resource Engine</span>
              </button>

              <button onClick={() => navigate('/maintenance')} className="w-full p-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 rounded-xl flex items-center gap-3 transition-all">
                <Wrench className="w-4 h-4 text-rose-400" />
                <span className="text-white text-sm font-semibold">Maintenance Hub</span>
              </button>

              {employee?.role === 'Admin' && (
                <>
                  <button onClick={() => navigate('/audit-cycles')} className="w-full p-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-xl flex items-center gap-3 transition-all">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-sm font-semibold">Audit Cycles</span>
                  </button>
                  <button onClick={() => navigate('/org-setup')} className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold border border-white/10 transition-all">
                    <span className="w-4 h-4" /> 
                    <span className="text-white text-sm font-semibold">Organization Setup</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
