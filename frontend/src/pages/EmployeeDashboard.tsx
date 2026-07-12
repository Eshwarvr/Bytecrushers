import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';
import { LogOut, Building, ShieldCheck, Mail, Loader2, Award } from 'lucide-react';

export default function EmployeeDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/me');
      setCurrentUser(res.data);
      
      // If Admin lands here, redirect to Admin control center automatically
      if (res.data.employee.role === 'Admin') {
        navigate('/org-setup');
      }
    } catch (err: any) {
      console.error('Error loading employee profile:', err);
      setError('Session expired or profile loading failed.');
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
    <div className="min-h-screen bg-background flex flex-col relative">
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 font-inter flex flex-col items-center justify-center">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full glass-card rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 text-3xl font-bold font-outfit uppercase">
              {employee?.name ? employee.name[0] : 'U'}
            </div>
            <h2 className="text-3xl font-bold font-outfit text-white">{employee?.name}</h2>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Role Rank: {employee?.role}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
              <Mail className="w-6 h-6 text-purple-400 mb-2" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Email Address</span>
              <span className="text-sm font-semibold text-white font-mono">{employee?.email}</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
              <Building className="w-6 h-6 text-indigo-400 mb-2" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Department</span>
              <span className="text-sm font-semibold text-white">
                {employee?.department?.name || 'No Department Assigned'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Employment Status</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {employee?.status}
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 text-center">
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
              Welcome to the AssetFlow employee dashboard! As a <strong>{employee?.role}</strong>, you have access to read your personal assets and department directories. The administrative <strong>Organization Setup Hub</strong> is currently restricted to your profile.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
