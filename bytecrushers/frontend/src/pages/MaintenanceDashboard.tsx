import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Wrench, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MaintenanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('Employee');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ asset_id: '', issue_description: '', priority: 'medium', photo_url: '' });
  
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
      setUserRole(profileData.role);
      
      // Fetch maintenance requests
      let query = supabase.from('maintenance_requests').select('*, assets(*)').order('created_at', { ascending: false });
      if (profileData.role !== 'AssetManager' && profileData.role !== 'Admin') {
        query = query.eq('raised_by', profileData.id);
      }
      
      const { data: reqData, error: reqError } = await query;
      if (reqError) throw reqError;
      setRequests(reqData || []);
      
      // Fetch available assets for dropdown
      const { data: assetData } = await supabase.from('assets').select('*');
      setAssets(assetData || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('maintenance_requests').insert({
        asset_id: newRequest.asset_id,
        raised_by: currentUser.id,
        issue_description: newRequest.issue_description,
        priority: newRequest.priority,
        photo_url: newRequest.photo_url || null,
        status: 'pending'
      });
      if (error) throw error;
      
      setIsFormOpen(false);
      setNewRequest({ asset_id: '', issue_description: '', priority: 'medium', photo_url: '' });
      fetchData();
    } catch (err) {
      console.error('Error creating request:', err);
      alert('Failed to create maintenance request');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'approved') {
        updates.approved_by = currentUser.id;
      } else if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      
      const { error } = await supabase.from('maintenance_requests').update(updates).eq('id', id);
      if (error) throw error;
      
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-outfit text-sm">Loading Maintenance Hub...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative text-white font-inter">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -z-10"></div>
      
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-white transition-colors">
              &larr; Back
            </button>
            <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-500" />
              Maintenance
            </span>
          </div>
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Raise Request
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        
        {isFormOpen && (
          <div className="mb-8 glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            <h3 className="text-xl font-outfit font-bold mb-4">New Maintenance Request</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset</label>
                  <select
                    required
                    value={newRequest.asset_id}
                    onChange={(e) => setNewRequest({...newRequest, asset_id: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">Select Asset</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Description</label>
                <textarea
                  required
                  rows={3}
                  value={newRequest.issue_description}
                  onChange={(e) => setNewRequest({...newRequest, issue_description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-all">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-outfit font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Requests
          </h3>
          
          {requests.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <p className="text-muted-foreground text-sm">No maintenance requests found.</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="glass-card p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-white">{req.assets?.name} ({req.assets?.tag})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(req.status)}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-700 bg-slate-800/50 px-2 py-0.5 rounded">
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{req.issue_description}</p>
                </div>
                
                {/* Actions for Asset Manager */}
                {(userRole === 'AssetManager' || userRole === 'Admin') && (
                  <div className="flex flex-wrap gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded border border-blue-500/20 text-xs font-semibold flex items-center gap-1 transition-all">
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 text-xs font-semibold flex items-center gap-1 transition-all">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <button onClick={() => handleUpdateStatus(req.id, 'in_progress')} className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded border border-purple-500/20 text-xs font-semibold transition-all">
                        Mark In Progress
                      </button>
                    )}
                    {req.status === 'in_progress' && (
                      <button onClick={() => handleUpdateStatus(req.id, 'resolved')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all">
                        <CheckCircle className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
      </main>
    </div>
  );
}
