"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Eye, Coins, Plus, Trash2, Play, X, Loader2 } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Ad {
  id: string;
  title: string;
  type: string;
  contentUrl: string;
  targetUrl: string | null;
  placement: string;
  duration: number | null;
  reward: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  maxViews?: number;
  viewCount?: number;
}

interface FormData {
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  reward: string;
  totalUsers: string;
}

export default function AdManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    thumbnailUrl: "",
    videoUrl: "",
    duration: "30",
    reward: "25",
    totalUsers: "100",
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

  const handleSubmit = async () => {
    if (!formData.title || !formData.videoUrl || !formData.duration || !formData.reward || !formData.totalUsers) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await axios.post(`${API_URL}/api/ads`, {
        title: formData.title,
        type: "VIDEO",
        contentUrl: formData.videoUrl,
        targetUrl: formData.thumbnailUrl || formData.videoUrl,
        placement: "EARN_PAGE",
        duration: parseInt(formData.duration),
        reward: parseInt(formData.reward),
        maxViews: parseInt(formData.totalUsers),
      }, { withCredentials: true });

      setSuccess("Ad campaign created successfully!");
      setModalOpen(false);
      setFormData({ title: "", thumbnailUrl: "", videoUrl: "", duration: "30", reward: "25", totalUsers: "100" });
      fetchAds();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create ad campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad campaign?")) return;
    try {
      await axios.delete(`${API_URL}/api/ads/${id}`, { withCredentials: true });
      setAds(ads.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete ad:", err);
    }
  };

  const handleToggleStatus = async (ad: Ad) => {
    const newStatus = ad.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await axios.put(`${API_URL}/api/ads/${ad.id}`, { status: newStatus }, { withCredentials: true });
      setAds(ads.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error("Failed to update ad status:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "PAUSED": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Ad Management</h1>
          <p className="text-gray-500 mt-1">Manage video ad campaigns and rewards</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {success && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl font-bold">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <ImageIcon className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Campaigns</p>
          <p className="text-2xl font-black text-white">{ads.filter(a => a.status === "ACTIVE").length}</p>
        </div>
        <div className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Campaigns</p>
          <p className="text-2xl font-black text-white">{ads.length}</p>
        </div>
        <div className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Rewards</p>
          <p className="text-2xl font-black text-white">{ads.reduce((acc, a) => acc + (a.reward || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold">No ad campaigns yet</p>
          <p className="text-sm">Click Create Campaign to add your first video ad</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ads.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{ad.title}</h3>
                  <p className="text-xs text-gray-500">Created {new Date(ad.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`ml-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(ad.status)}`}>
                  {ad.status}
                </span>
              </div>

              {ad.targetUrl && (
                <div className="w-full h-28 rounded-xl overflow-hidden mb-4 bg-white/5 flex items-center justify-center">
                  <img src={ad.targetUrl} alt={ad.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Duration</p>
                  <p className="font-bold text-white text-sm">{ad.duration || 0}s</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Reward</p>
                  <p className="font-bold text-yellow-400 text-sm">+{ad.reward}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Placement</p>
                  <p className="font-bold text-purple-400 text-sm truncate">{ad.placement}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(ad)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    ad.status === "ACTIVE"
                      ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"
                      : "bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20"
                  }`}
                >
                  {ad.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f18] border border-white/10 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Create Video Campaign</h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ad title shown to users..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-white placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://... (image shown as task thumbnail)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-white placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Video URL *</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://... (video played when user watches)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-white placeholder:text-gray-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Duration (sec) *</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="30"
                      min="5"
                      max="300"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Coins/User *</label>
                    <input
                      type="number"
                      value={formData.reward}
                      onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                      placeholder="25"
                      min="1"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Total Users *</label>
                    <input
                      type="number"
                      value={formData.totalUsers}
                      onChange={(e) => setFormData({ ...formData, totalUsers: e.target.value })}
                      placeholder="100"
                      min="1"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none transition-all text-white"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-bold">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                  ) : (
                    <><Play className="w-5 h-5" /> START CAMPAIGN</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
