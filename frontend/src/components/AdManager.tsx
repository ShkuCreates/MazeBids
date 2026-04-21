"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, ExternalLink, Layout, User, Gavel, Wallet, Monitor, Play, Link as LinkIcon, Image as ImageIcon, Save, X, Calendar, Clock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const PLACEMENTS = [
  { label: "Dashboard", value: "DASHBOARD", icon: Layout },
  { label: "Profile", value: "PROFILE", icon: User },
  { label: "Auctions", value: "AUCTIONS", icon: Gavel },
  { label: "Earn Section", value: "EARN", icon: Wallet },
  { label: "Watch Ads Section", value: "WATCH_ADS", icon: Play },
];

const AD_TYPES = [
  { label: "Image", value: "IMAGE", icon: ImageIcon },
  { label: "Video", value: "VIDEO", icon: Play },
  { label: "Link/Button", value: "LINK", icon: LinkIcon },
];

export default function AdManager() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "IMAGE",
    contentUrl: "",
    targetUrl: "",
    placement: "DASHBOARD",
    duration: "30",
    expiresAt: "",
    reward: "0",
  });

  const fetchAds = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ads/all`, { withCredentials: true });
      setAds(res.data);
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await axios.put(`${API_URL}/api/ads/${editingAd.id}`, formData, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/ads`, formData, { withCredentials: true });
      }
      setShowForm(false);
      setEditingAd(null);
      setFormData({
        title: "",
        type: "IMAGE",
        contentUrl: "",
        targetUrl: "",
        placement: "DASHBOARD",
        duration: "30",
        expiresAt: "",
      });
      fetchAds();
    } catch (err) {
      alert("Failed to save ad");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad campaign?")) return;
    try {
      await axios.delete(`${API_URL}/api/ads/${id}`, { withCredentials: true });
      fetchAds();
    } catch (err) {
      alert("Failed to delete ad");
    }
  };

  const handleEdit = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      type: ad.type,
      contentUrl: ad.contentUrl,
      targetUrl: ad.targetUrl || "",
      placement: ad.placement,
      duration: ad.duration?.toString() || "30",
      reward: ad.reward?.toString() || "0",
      expiresAt: ad.expiresAt ? new Date(ad.expiresAt).toISOString().split('T')[0] : "",
    });
    setShowForm(true);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Ad Manager...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Monitor className="text-purple-400" /> AD CAMPAIGNS
        </h2>
        <button 
          onClick={() => {
            setShowForm(true);
            setEditingAd(null);
          }}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" /> CREATE AD
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
          
          <div className="flex items-center justify-between relative">
            <h3 className="text-xl font-bold">{editingAd ? "EDIT AD" : "NEW AD CAMPAIGN"}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Title</label>
              <input 
                type="text" required placeholder="e.g. Join our Discord"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 transition-all text-white font-medium"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Placement Area</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 transition-all text-white font-medium appearance-none"
                value={formData.placement} onChange={e => setFormData({...formData, placement: e.target.value})}
              >
                {PLACEMENTS.map(p => <option key={p.value} value={p.value} className="bg-[#0f0f18]">{p.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Type</label>
              <div className="grid grid-cols-3 gap-2">
                {AD_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({...formData, type: type.value})}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${formData.type === type.value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date (Optional)</label>
              <input 
                type="date"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 transition-all text-white font-medium"
                value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Content URL (Image/Video/Discord Link)</label>
              <input 
                type="text" required placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 transition-all text-white font-medium"
                value={formData.contentUrl} onChange={e => setFormData({...formData, contentUrl: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target URL (Optional Link Click)</label>
              <input 
                type="text" placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 transition-all text-white font-medium"
                value={formData.targetUrl} onChange={e => setFormData({...formData, targetUrl: e.target.value})}
              />
            </div>

            {formData.type === "VIDEO" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Video Duration (Seconds)</label>
                <input 
                  type="number" required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 transition-all text-white font-medium"
                  value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Reward (Coins)</label>
              <input 
                type="number" required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 transition-all text-white font-medium"
                value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})}
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <button 
                type="submit"
                className="w-full py-5 bg-white text-black hover:bg-purple-400 hover:text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> {editingAd ? "UPDATE CAMPAIGN" : "START AD CAMPAIGN"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => {
          const PlacementIcon = PLACEMENTS.find(p => p.value === ad.placement)?.icon || Monitor;
          const TypeIcon = AD_TYPES.find(t => t.value === ad.type)?.icon || LinkIcon;
          
          return (
            <div key={ad.id} className="bg-[#0f0f18] border border-white/5 rounded-[2rem] p-6 space-y-6 hover:border-purple-500/30 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <PlacementIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm truncate max-w-[150px]">{ad.title}</h4>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{ad.placement}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(ad)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative group-hover:border-purple-500/20 transition-all">
                {ad.type === 'IMAGE' ? (
                  <img src={ad.contentUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600">
                    <TypeIcon className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{ad.type} AD</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white/80 border border-white/10 uppercase tracking-widest">
                  {ad.type}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{ad.expiresAt ? new Date(ad.expiresAt).toLocaleDateString() : "NEVER"}</span>
                  </div>
                </div>
                {ad.targetUrl && (
                  <a href={ad.targetUrl} target="_blank" className="text-purple-400 hover:text-purple-300 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {ads.length === 0 && !loading && (
          <div className="md:col-span-3 py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
            <p className="text-gray-500 font-bold">No active ad campaigns</p>
          </div>
        )}
      </div>
    </div>
  );
}