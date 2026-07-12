import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Loader2, Calendar, HardDrive, Tag, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const res = await api.get(`/api/assets/${id}`);
      setAsset(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-outfit">Loading Asset Details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <p className="text-white font-outfit text-xl">{error || 'Asset not found'}</p>
        <button onClick={() => navigate('/assets')} className="mt-4 text-purple-400 hover:text-purple-300">Return to Registry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative font-inter">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -z-10"></div>
      
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/assets')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded text-xs">ERP</span>
              Asset Details
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-transparent"></div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold font-mono tracking-widest mb-3 inline-block">
                    {asset.tag || 'PENDING'}
                  </span>
                  <h1 className="text-4xl font-bold font-outfit text-white mb-2">{asset.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <HardDrive className="w-4 h-4" /> {asset.type}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    asset.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    asset.status === 'allocated' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {asset.status}
                </span>
              </div>

              {asset.category && (
                <div className="border-t border-white/10 pt-6 mt-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" /> Category Details: {asset.category.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(asset.custom_attributes || {}).map(([key, value]) => (
                      <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/10">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">{key}</span>
                        <span className="text-sm font-semibold text-white">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Allocation History Placeholder */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> Allocation History
              </h3>
              <p className="text-sm text-slate-500 italic">Phase 3 placeholder: Timeline of historical allocations will appear here.</p>
            </div>

            {/* Maintenance Placeholder */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Maintenance Logs
              </h3>
              <p className="text-sm text-slate-500 italic">Phase 3 placeholder: Repair and audit logs will appear here.</p>
            </div>
          </div>

          {/* Sidebar / QR Code */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Asset Tag QR</h3>
              <div className="bg-white p-4 rounded-xl mb-4">
                <QRCodeSVG 
                  value={JSON.stringify({ tag: asset.tag, id: asset.id })} 
                  size={160} 
                  level="H" 
                  includeMargin={true} 
                />
              </div>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Scan to quickly allocate, return, or view asset details in the mobile app.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
