import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, ShieldCheck, Plus, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuditCycles() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [cycles, setCycles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCycle, setNewCycle] = useState({ title: '', scope_type: 'department', scope_value: '', date_range_start: '', date_range_end: '', auditors: [] as string[] });
  
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
      
      if (profileData.role !== 'Admin') {
        navigate('/dashboard');
        return;
      }
      
      // Fetch cycles with discrepancy report count
      const { data: cycleData, error: cycleError } = await supabase
        .from('audit_cycles')
        .select(`
          *,
          audit_cycle_auditors(employees(name)),
          audit_items(verification_status)
        `)
        .order('created_at', { ascending: false });
        
      if (cycleError) throw cycleError;
      setCycles(cycleData || []);
      
      const { data: empData } = await supabase.from('employees').select('*');
      setEmployees(empData || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: cycle, error: cycleError } = await supabase.from('audit_cycles').insert({
        title: newCycle.title,
        scope_type: newCycle.scope_type,
        scope_value: newCycle.scope_value,
        date_range_start: new Date(newCycle.date_range_start).toISOString(),
        date_range_end: new Date(newCycle.date_range_end).toISOString(),
        created_by: currentUser.id,
        status: 'open'
      }).select().single();
      
      if (cycleError) throw cycleError;
      
      if (newCycle.auditors.length > 0) {
        const auditorInserts = newCycle.auditors.map(id => ({
          cycle_id: cycle.id,
          auditor_id: id
        }));
        
        await supabase.from('audit_cycle_auditors').insert(auditorInserts);
      }
      
      // Populate audit items based on scope
      let assetQuery = supabase.from('assets').select('id');
      // For scope, normally you would join with departments/locations. 
      // For this demo, we'll just pull all active assets to simplify if it's "All", 
      // otherwise we could filter by type or other fields. We'll pull all for now.
      const { data: scopeAssets } = await assetQuery;
      
      if (scopeAssets && scopeAssets.length > 0) {
        const itemInserts = scopeAssets.map((asset: any) => ({
          cycle_id: cycle.id,
          asset_id: asset.id,
          verification_status: null
        }));
        await supabase.from('audit_items').insert(itemInserts);
      }
      
      setIsFormOpen(false);
      setNewCycle({ title: '', scope_type: 'department', scope_value: '', date_range_start: '', date_range_end: '', auditors: [] });
      fetchData();
    } catch (err) {
      console.error('Error creating cycle:', err);
      alert('Failed to create audit cycle');
    }
  };

  const handleCloseCycle = async (id: string) => {
    try {
      const { error } = await supabase.from('audit_cycles').update({ status: 'closed' }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error closing cycle:', err);
      alert('Failed to close cycle');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative text-white font-inter">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -z-10"></div>
      
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-white transition-colors">
              &larr; Back
            </button>
            <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Audit Cycles
            </span>
          </div>
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            New Cycle
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        
        {isFormOpen && (
          <div className="mb-8 glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            <h3 className="text-xl font-outfit font-bold mb-4">Create Audit Cycle</h3>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
                  <input
                    required
                    type="text"
                    value={newCycle.title}
                    onChange={(e) => setNewCycle({...newCycle, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Q3 IT Assets Audit"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scope</label>
                  <input
                    required
                    type="text"
                    value={newCycle.scope_value}
                    onChange={(e) => setNewCycle({...newCycle, scope_value: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Engineering Dept"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                  <input
                    required
                    type="date"
                    value={newCycle.date_range_start}
                    onChange={(e) => setNewCycle({...newCycle, date_range_start: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</label>
                  <input
                    required
                    type="date"
                    value={newCycle.date_range_end}
                    onChange={(e) => setNewCycle({...newCycle, date_range_end: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Auditors</label>
                  <select
                    multiple
                    value={newCycle.auditors}
                    onChange={(e) => setNewCycle({...newCycle, auditors: Array.from(e.target.selectedOptions, option => option.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors h-24"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all">
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-outfit font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Audit Cycles
          </h3>
          
          {cycles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <p className="text-muted-foreground text-sm">No audit cycles found.</p>
            </div>
          ) : (
            cycles.map(cycle => {
              const items = cycle.audit_items || [];
              const discrepancies = items.filter((i: any) => i.verification_status === 'missing' || i.verification_status === 'damaged').length;
              const verified = items.filter((i: any) => i.verification_status === 'verified').length;
              const pending = items.length - discrepancies - verified;
              
              return (
                <div key={cycle.id} className="glass-card p-5 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-white">{cycle.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${cycle.status === 'open' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                        {cycle.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mb-3 space-x-4">
                      <span>Scope: <strong>{cycle.scope_value}</strong></span>
                      <span>Dates: {new Date(cycle.date_range_start).toLocaleDateString()} - {new Date(cycle.date_range_end).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-4 text-xs font-semibold">
                      <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Verified: {verified}</span>
                      {discrepancies > 0 && (
                        <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Discrepancies: {discrepancies}
                        </span>
                      )}
                      <span className="text-slate-400 bg-slate-400/10 px-2 py-1 rounded">Pending: {pending}</span>
                    </div>
                  </div>
                  
                  {cycle.status === 'open' && (
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => handleCloseCycle(cycle.id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 text-sm font-semibold transition-all flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Close Cycle
                      </button>
                      <span className="text-[10px] text-muted-foreground max-w-[150px] text-right">
                        Closing will automatically mark missing items as 'Lost' in the asset registry.
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
      </main>
    </div>
  );
}
