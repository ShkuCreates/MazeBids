"use client";
import { useEffect, useState, useCallback, lazy, Suspense, useRef } from "react";
import { io } from "socket.io-client";
import { Gavel, Clock, Users, ChevronRight, Bell, BellRing, Coins, ShoppingBag, Trophy, ArrowUpRight, Eye, Zap, Plus, Trash2, Play, Square, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Auction {
  id: string;
  title: string;
  description: string;
  product: string;
  image: string;
  startTime: string;
  endTime: string;
  currentBid: number;
  minBidIncrement: number;
  highestBidderId: string | null;
  highestBidder: { username: string } | null;
  status: string;
}

interface Activity {
  id: string;
  username: string;
  action: string;
  item?: string;
  timestamp: Date;
}

interface Popup {
  id: string;
  icon: React.ReactNode;
  message: string;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [filter, setFilter] = useState<'ONGOING' | 'ENDED'>('ONGOING');
  const { user, refreshUser } = useAuth();
  const [timers, setTimers] = useState<{ [key: string]: string }>({});
  const [recentBids, setRecentBids] = useState<{ [key: string]: boolean }>({});
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    product: '',
    image: '',
    endTime: '',
    startingBid: '',
    minBidIncrement: '100'
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  // Live Popups State
  const [popups, setPopups] = useState<Popup[]>([]);

  // Live Activity Feed State
  const [activities, setActivities] = useState<Activity[]>([]);


  const fetchAuctions = useCallback(async () => {
    try {
      const endpoint = filter === 'ENDED' ? `${API_URL}/api/auctions/ended` : `${API_URL}/api/auctions`;
      const response = await axios.get(endpoint);
      setAuctions(response.data);
    } catch (err) {
      setError("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Notification toggle with instant UI feedback and backend sync
  const toggleNotifications = async () => {
    if (!user) return alert("Please login to enable notifications");
    if (notifying) return; // Prevent double clicks

    const newState = !user.notifications;
    setNotifying(true);

    try {
      // API call to update backend + trigger Discord subscription
      const res = await axios.post(`${API_URL}/api/users/toggle-notifications`, {}, { withCredentials: true });

      // Refresh user to get updated state from backend
      await refreshUser();

      // Show success feedback
      if (res.data.notificationsEnabled) {
        console.log("[Notifications] Enabled - Discord DM subscription active");
      } else {
        console.log("[Notifications] Disabled - Discord DM subscription stopped");
      }
    } catch (err) {
      console.error("[Notifications] Failed to update:", err);
      alert("Failed to update notification settings. Please try again.");
    } finally {
      setNotifying(false);
    }
  };

  const handleCreateAuction = async () => {
    if (!createForm.title || !createForm.description || !createForm.product || !createForm.image || !createForm.endTime) {
      setCreateError('Please fill in all required fields.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await axios.post(`${API_URL}/api/auctions`, {
        title: createForm.title,
        description: createForm.description,
        product: createForm.product,
        image: createForm.image,
        endTime: createForm.endTime,
        startingBid: parseInt(createForm.startingBid) || 0,
        minBidIncrement: parseInt(createForm.minBidIncrement) || 100,
      }, { withCredentials: true });
      setShowCreateForm(false);
      setCreateForm({ title: '', description: '', product: '', image: '', endTime: '', startingBid: '', minBidIncrement: '100' });
      fetchAuctions();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create auction.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAuction = async (id: string) => {
    if (!confirm('Delete this auction? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/auctions/${id}`, { withCredentials: true });
      setAuctions(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete auction.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEndAuction = async (id: string) => {
    if (!confirm('End this auction now?')) return;
    setActioningId(id);
    try {
      await axios.post(`${API_URL}/api/auctions/${id}/end`, {}, { withCredentials: true });
      fetchAuctions();
    } catch (err) {
      alert('Failed to end auction.');
    } finally {
      setActioningId(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAuctions();

    // Initialize socket only on client side
    if (typeof window !== 'undefined' && !socketRef.current) {
      socketRef.current = io(API_URL, { withCredentials: true });
    }

    const socket = socketRef.current;
    if (!socket) return;

    socket.on("bidUpdated", (updatedAuction: Auction) => {
      setAuctions(prev => prev.map(a => a.id === updatedAuction.id ? updatedAuction : a));
      setRecentBids(prev => ({ ...prev, [updatedAuction.id]: true }));
      setTimeout(() => {
        setRecentBids(prev => ({ ...prev, [updatedAuction.id]: false }));
      }, 1000);
      if (updatedAuction.highestBidderId === user?.id) {
        refreshUser();
      }
    });

    socket.on("error", (err: { message: string }) => {
      alert(err.message);
    });

    return () => {
      socket.off("bidUpdated");
      socket.off("error");
    };
  }, [user?.id, fetchAuctions, refreshUser]);

  useEffect(() => {
    setLoading(true);
    fetchAuctions();
  }, [filter, fetchAuctions]);

  const getTimeLeft = useCallback((endTime: string) => {
    const total = Date.parse(endTime) - Date.now();
    if (total <= 0) return "ENDED";
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: { [key: string]: string } = {};
      auctions.forEach(a => {
        newTimers[a.id] = getTimeLeft(a.endTime);
      });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [auctions, getTimeLeft]);


  // Live Popups generator
  useEffect(() => {
    if (!mounted) return;
    const messages = [
      { icon: <Eye className="w-4 h-4 text-blue-400" />, template: () => `👀 ${Math.floor(Math.random() * 450) + 50} users are watching right now` },
      { icon: <Coins className="w-4 h-4 text-yellow-400" />, template: () => `💰 ${(Math.floor(Math.random() * 4500) + 500).toLocaleString()} coins just farmed` },
      { icon: <Trophy className="w-4 h-4 text-purple-400" />, template: () => `🔥 ${["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"][Math.floor(Math.random() * 5)]} joined an auction` },
      { icon: <Trophy className="w-4 h-4 text-purple-400" />, template: () => `🏆 ${["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"][Math.floor(Math.random() * 5)]} won ${["iPhone 13", "AirPods Pro", "MacBook Air", "PS5"][Math.floor(Math.random() * 4)]}` },
    ];

    const addPopup = () => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const newPopup = { id: `popup-${Date.now()}-${Math.random()}`, icon: msg.icon, message: msg.template() };
      setPopups((prev) => [newPopup, ...prev.slice(0, 1)]);
    };

    addPopup();
    const interval = setInterval(addPopup, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Live Activity Feed generator - MOCK DATA ONLY (frontend only, no backend)
  useEffect(() => {
    if (!mounted) return;
    const usernames = ["Rahul_23", "CryptoKing", "SnehaX", "TechNinja", "BidMaster", "AuctionKing", "GamerPro99", "MobileMaster"];
    const actions = ["placed a bid on", "joined auction for", "won", "is watching"];
    const items = ["iPhone 15 Pro", "MacBook Air M2", "PS5", "AirPods Pro", "Samsung Galaxy S24", "iPad Pro", "Apple Watch Ultra"];

    const generateActivity = (): Activity => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      return {
        id: `activity-${Date.now()}-${Math.random()}`,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        action,
        item: action !== "joined auction for" && action !== "is watching" ? items[Math.floor(Math.random() * items.length)] : undefined,
        timestamp: new Date(),
      };
    };

    // Initialize with 5 mock activities
    setActivities(Array.from({ length: 5 }, () => generateActivity()));

    // Add new mock activity every 2-5 seconds (no backend calls)
    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateActivity();
        // Keep only last 15 entries to prevent memory issues
        return [newActivity, ...prev.slice(0, 14)];
      });
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [mounted]);

  const getTimeAgo = (timestamp: Date): string => {
    if (!mounted) return "Loading...";
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 120) return "1 min ago";
    return `${Math.floor(seconds / 60)} min ago`;
  };

  const filteredAuctions = auctions.filter(a => {
    if (filter === 'ONGOING') return a.status === 'ACTIVE';
    return a.status === 'ENDED';
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Admin Panel - Only for Admins */}
      {isAdmin && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Admin Controls
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Auction
            </button>
          </div>

          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0f0f18] border border-purple-500/30 rounded-2xl p-6 mb-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black">New Auction</h3>
                  <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Title *</label>
                    <input type="text" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} placeholder="Auction title..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Product *</label>
                    <input type="text" value={createForm.product} onChange={e => setCreateForm({...createForm, product: e.target.value})} placeholder="e.g. Discord Nitro" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Description *</label>
                    <textarea value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} placeholder="Auction description..." rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 text-sm resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Image URL *</label>
                    <input type="url" value={createForm.image} onChange={e => setCreateForm({...createForm, image: e.target.value})} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">End Time *</label>
                    <input type="datetime-local" value={createForm.endTime} onChange={e => setCreateForm({...createForm, endTime: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Starting Bid</label>
                    <input type="number" value={createForm.startingBid} onChange={e => setCreateForm({...createForm, startingBid: e.target.value})} placeholder="0" min="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Min Bid Increment</label>
                    <input type="number" value={createForm.minBidIncrement} onChange={e => setCreateForm({...createForm, minBidIncrement: e.target.value})} placeholder="100" min="1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 text-sm" />
                  </div>
                </div>
                {createError && (
                  <p className="text-red-400 text-sm font-bold mt-3">{createError}</p>
                )}
                <button
                  onClick={handleCreateAuction}
                  disabled={creating}
                  className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2"
                >
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Auction</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Live Popups */}
          <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence mode="popLayout">
              {popups.map((popup) => (
                <motion.div
                  key={popup.id}
                  initial={{ opacity: 0, x: -50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-[#0f0f18]/95 backdrop-blur-md border border-purple-500/30 rounded-2xl px-4 py-3 shadow-2xl shadow-purple-500/20 flex items-center gap-3 pointer-events-auto"
                >
                  {popup.icon}
                  <span className="text-white text-xs font-bold">{popup.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="max-w-7xl mx-auto space-y-12 py-12 px-4 relative">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Premium Rewards</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter">
                  LIVE <span className="text-purple-500">AUCTIONS</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl font-medium">
                  Join thousands of users bidding in real-time. Use your hard-earned coins to win exclusive digital assets and rewards.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-[#0f0f18] p-2 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-2 mr-4 ml-2">
                  <button
                    onClick={toggleNotifications}
                    disabled={notifying}
                    className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 group relative ${
                      user?.notifications
                        ? "bg-green-500/20 text-green-400 border border-green-500/40 shadow-lg shadow-green-500/20"
                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    } ${notifying ? "opacity-50 cursor-wait" : ""}`}
                    title={user?.notifications ? "Notifications ON - Discord DMs Active" : "Click to Enable Notifications"}
                  >
                    {notifying ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : user?.notifications ? (
                      <BellRing className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                      {notifying ? "Updating..." : user?.notifications ? "ON" : "OFF"}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {(['ONGOING', 'ENDED'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      className={`px-8 py-3 rounded-[1.5rem] font-black text-xs tracking-widest transition-all ${
                        filter === t
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                          : "text-gray-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            {/* Live Activity Feed - MOCK DATA ONLY (Frontend Generated) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-500/5 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

              <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                    <Bell className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm tracking-wider">LIVE ACTIVITY</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Mock data - UI demonstration only</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">LIVE</span>
                </div>
              </div>

              <div className="h-[400px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                          <span className="text-sm font-black text-purple-300">{activity.username.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300">
                            <span className="font-bold text-white">{activity.username}</span>
                            <span className="text-gray-500"> {activity.action} </span>
                            {activity.item && <span className="text-purple-400 font-bold">{activity.item}</span>}
                          </p>
                          <p className="text-[10px] text-gray-500">{getTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Grid */}
            {filteredAuctions.length === 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="group relative bg-[#0f0f18] border border-white/5 rounded-[3.5rem] overflow-hidden hover:border-purple-500/40 transition-all duration-700 hover:shadow-[0_0_80px_-20px_rgba(139,92,246,0.4)] flex flex-col"
                  >
                    <div className="flex flex-col md:flex-row min-h-[300px] sm:min-h-[400px]">
                      <div className="md:w-[45%] relative overflow-hidden bg-[#0a0a0f]">
                        <div className="w-full h-full bg-white/5 animate-pulse" />
                      </div>
                      <div className="md:w-[55%] p-4 sm:p-10 flex flex-col justify-center space-y-4 sm:space-y-8 relative">
                        <div className="h-8 w-3/4 bg-white/5 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
                        <div className="h-20 w-full bg-white/5 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <AnimatePresence mode="popLayout">
                  {filteredAuctions.map((auction) => (
                    <motion.div
                      layout
                      key={auction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative bg-[#0f0f18] border border-white/5 rounded-[3.5rem] overflow-hidden hover:border-purple-500/40 transition-all duration-700 hover:shadow-[0_0_80px_-20px_rgba(139,92,246,0.4)] flex flex-col"
                    >
                      <div className="flex flex-col md:flex-row min-h-[300px] sm:min-h-[400px]">
                        <div className="md:w-[45%] relative overflow-hidden bg-[#0a0a0f]">
                          <img
                            src={auction.image}
                            alt={auction.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-transparent to-transparent opacity-60" />
                          <div className="absolute top-6 left-6 flex flex-col gap-2">
                            <div className={`px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 shadow-2xl backdrop-blur-md ${
                              auction.status === 'ACTIVE' ? 'bg-red-600/90 text-white animate-pulse' : 'bg-blue-600/90 text-white'
                            }`}>
                              <div className={`w-2 h-2 rounded-full bg-white ${auction.status === 'ACTIVE' ? 'animate-ping' : ''}`} />
                              {auction.status}
                            </div>
                            <div className="bg-black/60 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-[10px] font-black border border-white/10 flex items-center gap-2">
                              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                              {auction.product}
                            </div>
                          </div>
                        </div>
                        <div className="md:w-[55%] p-4 sm:p-10 flex flex-col justify-between space-y-4 sm:space-y-8 relative">
                          <div className="space-y-2 sm:space-y-4">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-xl sm:text-3xl font-black text-white group-hover:text-purple-400 transition-colors leading-tight">
                                {auction.title}
                              </h3>
                              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all">
                                <ArrowUpRight className="w-6 h-6 text-gray-500 group-hover:text-purple-400 transition-colors" />
                              </div>
                            </div>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-3">
                              {auction.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 bg-white/[0.03] rounded-2xl sm:rounded-[2rem] border border-white/5 relative overflow-hidden">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Bid</p>
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                                <p className="text-xl sm:text-3xl font-black text-white">{auction.currentBid.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Time Left</p>
                              <div className="flex items-center gap-2 text-purple-400">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                <p className="text-2xl font-black tracking-tighter">{timers[auction.id] || "00:00:00"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pt-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center shadow-inner">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Highest Bidder</p>
                                <p className="text-white font-bold text-sm sm:text-base">{auction.highestBidder?.username || "No bids yet"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Link
                                href={`/auctions/${auction.id}`}
                                className="group/btn relative px-6 sm:px-8 py-3 sm:py-5 rounded-2xl font-black text-sm tracking-widest transition-all shadow-2xl active:scale-95 bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/30 flex-1 sm:flex-none text-center"
                              >
                                <span className="relative z-10 flex items-center gap-2 uppercase">
                                  {auction.status === 'ACTIVE' ? 'Bid Now' : 'View Details'}
                                  <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity blur-lg" />
                              </Link>
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  {auction.status === 'ACTIVE' && (
                                    <button
                                      onClick={(e) => { e.preventDefault(); handleEndAuction(auction.id); }}
                                      disabled={actioningId === auction.id}
                                      title="End Auction Now"
                                      className="p-3 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 rounded-xl transition-all disabled:opacity-50"
                                    >
                                      {actioningId === auction.id ? <Loader2 className="w-4 h-4 text-orange-400 animate-spin" /> : <Square className="w-4 h-4 text-orange-400" />}
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.preventDefault(); handleDeleteAuction(auction.id); }}
                                    disabled={deletingId === auction.id}
                                    title="Delete Auction"
                                    className="p-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl transition-all disabled:opacity-50"
                                  >
                                    {deletingId === auction.id ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-400" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}
