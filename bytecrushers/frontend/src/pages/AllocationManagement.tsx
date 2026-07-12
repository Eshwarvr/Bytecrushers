import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Calendar, Send, ShieldCheck, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function AllocationManagement() {
  const [activeTab, setActiveTab] = useState<'allocations' | 'transfers' | 'bookings'>('allocations');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [allocations, setAllocations] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/api/me');
      setCurrentUser(profileRes.data);

      const [allocRes, transRes, bookRes] = await Promise.all([
        api.get('/api/allocations'),
        api.get('/api/transfers'),
        api.get('/api/bookings')
      ]);

      setAllocations(allocRes.data);
      setTransfers(transRes.data);
      setBookings(bookRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load allocation data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleReturn = async (id: string) => {
    if (!confirm('Return this asset?')) return;
    try {
      await api.post(`/api/allocations/${id}/return`, {});
      showNotification('Asset returned successfully', 'success');
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to return', 'error');
    }
  };

  const processTransfer = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/api/transfers/${id}/process`, { action });
      showNotification(`Transfer ${action}d successfully`, 'success');
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || `Failed to ${action} transfer`, 'error');
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.delete(`/api/bookings/${id}`);
      showNotification('Booking cancelled', 'success');
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to cancel', 'error');
    }
  };

  const canManage = currentUser?.employee?.role === 'Admin' || currentUser?.employee?.role === 'AssetManager';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-outfit">Loading Workflow Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative font-inter">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -z-10"></div>
      
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded text-xs">ERP</span>
              Workflows
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" /><span>{success}</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-outfit text-white tracking-tight">Resource Engine</h1>
          <p className="text-muted-foreground text-sm mt-1">Track active allocations, transfer approvals, and future bookings.</p>
        </div>

        <div className="flex border-b border-white/10 mb-8 p-1 bg-white/5 rounded-xl max-w-lg">
          <button onClick={() => setActiveTab('allocations')} className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${activeTab === 'allocations' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
            <ShieldCheck className="w-4 h-4" /> Active Allocations
          </button>
          <button onClick={() => setActiveTab('transfers')} className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${activeTab === 'transfers' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
            <Send className="w-4 h-4" /> Transfers
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${activeTab === 'bookings' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
            <Calendar className="w-4 h-4" /> Bookings
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {activeTab === 'allocations' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Allocations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase">
                      <th className="py-3 px-2">Asset</th>
                      <th className="py-3 px-2">Employee</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allocations.map(a => (
                      <tr key={a.id} className="hover:bg-white/5">
                        <td className="py-3 px-2 font-semibold text-white">{a.asset?.name} <span className="text-xs text-purple-400 font-mono">({a.asset?.tag})</span></td>
                        <td className="py-3 px-2">{a.employee?.name}</td>
                        <td className="py-3 px-2 text-center">
                          {a.returned_at ? <span className="text-emerald-400 text-xs">Returned</span> : <span className="text-amber-400 text-xs">Active</span>}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {canManage && !a.returned_at && (
                            <button onClick={() => handleReturn(a.id)} className="text-xs text-purple-400 hover:text-white px-3 py-1 bg-white/5 rounded">Return</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transfers' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Transfer Requests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase">
                      <th className="py-3 px-2">Asset</th>
                      <th className="py-3 px-2">From</th>
                      <th className="py-3 px-2">To</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transfers.map(t => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="py-3 px-2 font-semibold text-white">{t.asset?.name}</td>
                        <td className="py-3 px-2 text-rose-400">{t.from_employee?.name}</td>
                        <td className="py-3 px-2 text-emerald-400">{t.to_employee?.name}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="uppercase text-[10px] tracking-wider">{t.status}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {canManage && t.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => processTransfer(t.id, 'approve')} className="text-xs text-emerald-400 hover:text-white px-2 py-1 bg-white/5 rounded">Approve</button>
                              <button onClick={() => processTransfer(t.id, 'reject')} className="text-xs text-rose-400 hover:text-white px-2 py-1 bg-white/5 rounded">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Future Bookings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase">
                      <th className="py-3 px-2">Asset</th>
                      <th className="py-3 px-2">Employee</th>
                      <th className="py-3 px-2">Start Time</th>
                      <th className="py-3 px-2">End Time</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-white/5">
                        <td className="py-3 px-2 font-semibold text-white">{b.asset?.name}</td>
                        <td className="py-3 px-2">{b.employee?.name}</td>
                        <td className="py-3 px-2 text-xs">{new Date(b.start_time).toLocaleString()}</td>
                        <td className="py-3 px-2 text-xs">{new Date(b.end_time).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          {(canManage || currentUser?.employee?.id === b.employee_id) && (
                            <button onClick={() => deleteBooking(b.id)} className="text-xs text-rose-400 hover:text-white px-3 py-1 bg-white/5 rounded">Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
