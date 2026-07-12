import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { 
  Search, Filter, Plus, Edit2, Trash2, Loader2, ArrowLeft,
  CheckCircle, AlertTriangle
} from 'lucide-react';

interface Asset {
  id: string;
  tag: string;
  name: string;
  type: string;
  status: 'available' | 'allocated' | 'retired';
  category_id: string | null;
  custom_attributes: any;
  category?: { id: string; name: string; custom_fields: any[] } | null;
}

export default function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [assetId, setAssetId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'available' | 'allocated' | 'retired'>('available');
  const [categoryId, setCategoryId] = useState('');
  const [customAttributes, setCustomAttributes] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/api/me');
      setCurrentUser(profileRes.data);

      const [assetsRes, catsRes] = await Promise.all([
        api.get('/api/assets'),
        api.get('/api/admin/categories') // Using admin endpoint as it returns all categories
      ]);

      setAssets(assetsRes.data);
      setCategories(catsRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load assets');
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

  const openNewModal = () => {
    setAssetId(null);
    setName('');
    setType('');
    setStatus('available');
    setCategoryId('');
    setCustomAttributes({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setAssetId(asset.id);
    setName(asset.name);
    setType(asset.type);
    setStatus(asset.status);
    setCategoryId(asset.category_id || '');
    setCustomAttributes(asset.custom_attributes || {});
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) {
      showNotification('Name and Type are required', 'error');
      return;
    }

    try {
      const payload = {
        name,
        type,
        status,
        category_id: categoryId || null,
        custom_attributes: customAttributes
      };

      if (isEditing && assetId) {
        await api.put(`/api/assets/${assetId}`, payload);
        showNotification('Asset updated successfully', 'success');
      } else {
        await api.post('/api/assets', payload);
        showNotification('Asset created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.delete(`/api/assets/${id}`);
      showNotification('Asset deleted successfully', 'success');
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          (a.tag || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || a.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const selectedCategory = categories.find(c => c.id === categoryId);
  const canManage = currentUser?.employee?.role === 'Admin' || currentUser?.employee?.role === 'AssetManager';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-outfit">Loading Asset Registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative font-inter">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -z-10"></div>
      
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded text-xs">ERP</span>
              Asset Registry
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

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-white tracking-tight">Assets</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track company assets.</p>
          </div>
          {canManage && (
            <button onClick={openNewModal} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer">
              <Plus className="w-4 h-4" /> Register Asset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search name or tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs font-medium" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs font-medium appearance-none cursor-pointer">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs font-medium appearance-none cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="allocated">Allocated</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold tracking-wider text-muted-foreground uppercase bg-white/5">
                  <th className="py-4 px-4">Tag</th>
                  <th className="py-4 px-4">Name / Type</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAssets.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">No assets found.</td></tr>
                ) : (
                  filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-4 font-mono text-xs text-purple-400 font-bold">{asset.tag || 'PENDING'}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{asset.name}</div>
                        <div className="text-xs text-slate-500">{asset.type}</div>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {asset.category ? (
                          <span className="bg-white/10 px-2 py-0.5 rounded text-slate-300">{asset.category.name}</span>
                        ) : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          asset.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          asset.status === 'allocated' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/assets/${asset.id}`)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-indigo-400 cursor-pointer">View</button>
                          {canManage && (
                            <>
                              <button onClick={() => openEditModal(asset)} className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white font-outfit">{isEditing ? 'Edit Asset' : 'Register Asset'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><AlertTriangle className="w-5 h-5 hidden" />X</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4 font-inter text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Name <span className="text-rose-400">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 rounded-lg glass-input" placeholder="e.g. MacBook Pro 16" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Type <span className="text-rose-400">*</span></label>
                  <input type="text" value={type} onChange={e => setType(e.target.value)} required className="w-full px-3 py-2 rounded-lg glass-input" placeholder="e.g. Laptop" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Category</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2 rounded-lg glass-input appearance-none">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-lg glass-input appearance-none">
                    <option value="available">Available</option>
                    <option value="allocated">Allocated</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                {/* Dynamic Custom Fields */}
                {selectedCategory?.custom_fields && selectedCategory.custom_fields.length > 0 && (
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Category Attributes</h3>
                    {selectedCategory.custom_fields.map((field: any, idx: number) => (
                      <div key={idx}>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          {field.name} {field.required && <span className="text-rose-400">*</span>}
                        </label>
                        <input 
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          required={field.required}
                          value={customAttributes[field.name] || ''}
                          onChange={(e) => setCustomAttributes({...customAttributes, [field.name]: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg glass-input"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer">
                    {isEditing ? 'Save Changes' : 'Register Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
