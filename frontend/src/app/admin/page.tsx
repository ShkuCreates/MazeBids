"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Gavel, ShieldAlert, Image as ImageIcon, ShoppingBag, Coins, TrendingUp, Calendar, Clock, Trash2, StopCircle, Timer, Zap, Monitor, Users, Activity } from "lucide-react";
import AdManager from "@/components/AdManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DURATION_OPTIONS = [
  { label: "5 mins", value: 5 },
  { label: "10 mins", value: 10 },
  { label: "30 mins", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
  { label: "5 hours", value: 300 },
  { label: "6 hours", value: 360 },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [durationIndex, setDurationIndex] = useState(2); // Default to 30 mins
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product: "",
    image: "",
    startingBid: "1000",
    minBidIncrement: "100"
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  const fetchAuctions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auctions`);
      setAuctions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAuctions();
    }
  }, [user]);



  const calculatedEndTime = useMemo(() => {
    const start = new Date();
    const duration = DURATION_OPTIONS[durationIndex].value;
    const end = new Date(start.getTime() + duration * 60000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [durationIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Calculate final endTime for submission based on NOW
    const start = new Date();
    const duration = DURATION_OPTIONS[durationIndex].value;
    const endTime = new Date(start.getTime() + duration * 60000);

    try {
      await axios.post(`${API_URL}/api/auctions`, {
        ...formData,
        endTime: endTime.toISOString()
      }, { withCredentials: true });
      
      alert("Auction started instantly! Users have been notified.");
      setFormData({
        title: "",
        description: "",
        product: "",
        image: "",
        startingBid: "1000",
        minBidIncrement: "100"
      });
      setDurationIndex(2);
      fetchAuctions();
    } catch (err) {
      alert("Failed to start auction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this auction? This will remove all associated bids.")) return;
    try {
      await axios.delete(`${API_URL}/api/auctions/${id}`, { withCredentials: true });
      fetchAuctions();
    } catch (err) {
      alert("Failed to delete auction");
    }
  };

  const handleEndEarly = async (id: string) => {
    if (!confirm("Are you sure you want to end this auction early?")) return;
    try {
      await axios.post(`${API_URL}/api/auctions/${id}/end`, {}, { withCredentials: true });
      fetchAuctions();
    } catch (err) {
      alert("Failed to end auction");
    }
  };

  if (loading || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0f0f18] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">ADMIN CONTROL</h1>
            <p className="text-gray-500 font-medium">Manage your marketplace and auctions.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logged in as</p>
            <p className="font-bold text-purple-400">{user.username}</p>
          </div>
          <img src={user.avatar || ""} className="w-10 h-10 rounded-full border-2 border-purple-500/30" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Create Form */}
        <div className="lg:col-span-5 bg-[#0f0f18] border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
          
          <div className="relative space-y-2">
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Zap className="text-yellow-500 w-8 h-8 animate-pulse" /> 
              Instant Launch
            </h2>
            <p className="text-gray-500 text-sm">Auction will start live the moment you click Launch.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Auction Name</label>
                <div className="relative">
                  <Gavel className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input 
                    type="text" required placeholder="e.g. Rare Discord Nitro"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-purple-500 focus:bg-white/[0.05] outline-none transition-all text-white font-medium"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Product Details</label>
                <div className="relative">
                  <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input 
                    type="text" required placeholder="e.g. 1 Month Gift Link"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-purple-500 focus:bg-white/[0.05] outline-none transition-all text-white font-medium"
                    value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Thumbnail URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input 
                    type="url" required placeholder="https://..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-purple-500 focus:bg-white/[0.05] outline-none transition-all text-white font-medium"
                    value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Description</label>
                <textarea 
                  required placeholder="Tell users why they should bid..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-4 focus:border-purple-500 focus:bg-white/[0.05] outline-none transition-all text-white font-medium h-32 resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Timer className="w-3 h-3 text-purple-500" />
                      Auction Duration
                    </label>
                    <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 text-xs font-black">
                      {DURATION_OPTIONS[durationIndex].label}
                    </span>
                  </div>
                  
                  <input 
                    type="range"
                    min="0"
                    max={DURATION_OPTIONS.length - 1}
                    step="1"
                    value={durationIndex}
                    onChange={(e) => setDurationIndex(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  
                  <div className="flex justify-between px-1">
                    <span className="text-[8px] font-bold text-gray-600 uppercase">5m</span>
                    <span className="text-[8px] font-bold text-gray-600 uppercase">6h</span>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Starts</p>
                      <p className="text-white/40 text-[10px] font-bold mt-1 uppercase">Instantly</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Ends At (Approx)</p>
                      <p className="text-white/40 text-[10px] font-bold mt-1 uppercase">{calculatedEndTime}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Min Bid</label>
                  <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/50" />
                    <input 
                      type="number" required min="100"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-purple-500 focus:bg-white/[0.05] outline-none transition-all text-white font-black"
                      value={formData.startingBid} onChange={e => setFormData({...formData, startingBid: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Increment</label>
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500/50" />
                    <input 
                      type="number" required min="10"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-purple-500 focus:bg-white/[0.05] outline-none transition-all text-white font-black"
                      value={formData.minBidIncrement} onChange={e => setFormData({...formData, minBidIncrement: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-[1.5rem] font-black text-lg transition-all shadow-2xl shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group/btn"
            >
              {isSubmitting ? "NOTIFYING USERS..." : "START INSTANT AUCTION"}
              <Zap className="w-5 h-5 group-hover/btn:text-yellow-400 transition-colors" />
            </button>
          </form>
        </div>

        {/* Management List */}
        <div className="lg:col-span-7 space-y-8">


          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Gavel className="text-purple-500 w-8 h-8" /> 
              Active Marketplace
            </h2>
            <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-black text-gray-400 tracking-widest uppercase">
              {auctions.length} Auctions Total
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {auctions.length === 0 ? (
              <div className="bg-[#0f0f18] border border-white/5 border-dashed rounded-[3rem] py-32 flex flex-col items-center justify-center space-y-4 opacity-50">
                <ShoppingBag className="w-16 h-16 text-gray-600" />
                <p className="font-bold text-gray-500">No auctions scheduled yet.</p>
              </div>
            ) : (
              auctions.map((auction: any) => (
                <div 
                  key={auction.id} 
                  className="group bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-purple-500/30 transition-all duration-500"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="relative w-24 h-24 shrink-0 rounded-[1.5rem] overflow-hidden">
                      <img src={auction.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black text-white ${
                        auction.status === 'ACTIVE' ? 'bg-red-500 animate-pulse' : 
                        auction.status === 'UPCOMING' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {auction.status}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors">{auction.title}</h3>
                      <p className="text-sm text-gray-500 font-medium line-clamp-1">{auction.product}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-xs font-black text-white">{auction.currentBid.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs font-black text-white">+{auction.minBidIncrement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    {auction.status !== 'ENDED' && (
                      <button 
                        onClick={() => handleEndEarly(auction.id)}
                        className="flex-1 md:flex-none px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl text-xs font-black transition-all border border-yellow-500/20 uppercase tracking-widest flex items-center gap-2"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        End Early
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(auction.id)}
                      className="flex-1 md:flex-none px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-black transition-all border border-red-500/20 uppercase tracking-widest flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ad Manager Section */}
      <div className="pt-12 border-t border-white/5">
        <AdManager />
      </div>
    </div>
  );
}
