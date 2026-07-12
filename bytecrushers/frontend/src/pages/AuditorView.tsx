import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, ClipboardCheck, Check, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuditorView() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();
        
      if (profileError) throw profileError;
      setCurrentUser(profileData);
      
      // Fetch open cycles assigned to this auditor
      const { data: cycleData } = await supabase
        .from('audit_cycle_auditors')
        .select('audit_cycles(*)')
        .eq('auditor_id', profileData.id)
        .eq('audit_cycles.status', 'open');
        
      if (cycleData && cycleData.length > 0) {
        const rawCycle = cycleData[0].audit_cycles;
        const cycle = Array.isArray(rawCycle) ? rawCycle[0] : rawCycle;
        setActiveCycle(cycle);
        
        // Fetch items for this cycle
        const { data: itemsData } = await supabase
          .from('audit_items')
          .select('*, assets(*)')
          .eq('cycle_id', cycle.id);
          
        setAuditItems(itemsData || []);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId: string, status: string, notes: string = '') => {
    try {
      const { error } = await supabase.from('audit_items').update({
        verification_status: status,
        notes: notes,
        verified_by: currentUser.id,
        verified_at: new Date().toISOString()
      }).eq('id', itemId);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update audit item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative text-white font-inter">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -z-10"></div>
      
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-white transition-colors">
              &larr; Back
            </button>
            <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
              Auditor View
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        
        {!activeCycle ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl glass-card">
            <h3 className="text-xl font-bold mb-2">No Active Audits</h3>
            <p className="text-muted-foreground text-sm">You have no open audit cycles assigned at this time.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-2xl font-bold font-outfit text-blue-400 mb-1">{activeCycle.title}</h2>
                <p className="text-sm text-blue-200/70">Scope: {activeCycle.scope_value}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Progress</span>
                <div className="text-2xl font-bold font-mono text-white">
                  {auditItems.filter(i => i.verification_status !== null).length} / {auditItems.length}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {auditItems.map(item => (
                <div key={item.id} className="glass-card p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{item.assets?.name}</span>
                      <span className="text-xs font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">{item.assets?.tag}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {item.verification_status === 'verified' ? (
                      <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-2 font-semibold">
                        <Check className="w-4 h-4" /> Verified
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleUpdateItem(item.id, 'verified')}
                        className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 border border-white/10 rounded transition-all text-sm font-semibold flex justify-center items-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Verify
                      </button>
                    )}
                    
                    {item.verification_status === 'missing' ? (
                      <div className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded flex items-center gap-2 font-semibold">
                        <X className="w-4 h-4" /> Missing
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleUpdateItem(item.id, 'missing')}
                        className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-white/10 rounded transition-all text-sm font-semibold flex justify-center items-center gap-2"
                      >
                        <X className="w-4 h-4" /> Missing
                      </button>
                    )}
                    
                    {item.verification_status === 'damaged' ? (
                      <div className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4" /> Damaged
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleUpdateItem(item.id, 'damaged')}
                        className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/30 border border-white/10 rounded transition-all text-sm font-semibold flex justify-center items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" /> Damaged
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
