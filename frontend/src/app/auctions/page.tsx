"use client";
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { Gavel, Clock, Users, ChevronRight, Bell, BellRing, Coins, ShoppingBag, Trophy, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import AdBanner from "@/components/AdBanner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(API_URL, {
  withCredentials: true
});

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

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [filter, setFilter] = useState<'ACTIVE' | 'UPCOMING' | 'ENDED'>('ACTIVE');
  const { user, refreshUser } = useAuth();
  const [timers, setTimers] = useState<{ [key: string]: string }>({});
  const [recentBids, setRecentBids] = useState<{ [key: string]: boolean }>({});

  const fetchAuctions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auctions`);
      setAuctions(response.data);
    } catch (err) {
      setError("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleNotifications = async () => {
    if (!user) return alert("Please login to enable notifications");
    setNotifying(true);
    try {
      await axios.post(`${API_URL}/api/users/toggle-notifications`, {}, { withCredentials: true });
      await refreshUser();
    } catch (err) {
      alert("Failed to update notification settings");
    } finally {
      setNotifying(false);
    }
  };

  useEffect(() => {
    fetchAuctions();

    socket.on("bidUpdated", (updatedAuction: Auction) => {
      setAuctions(prev => prev.map(a => a.id === updatedAuction.id ? updatedAuction : a));
      
      // Trigger animation
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

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );

  const filteredAuctions = auctions.filter(a => {
    if (filter === 'ACTIVE') return a.status === 'ACTIVE';
    if (filter === 'UPCOMING') return a.status === 'UPCOMING';
    return a.status === 'ENDED';
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-12 px-4">
      <AdBanner placement="AUCTIONS" />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Premium Rewards</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter">
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
              className={`p-2 rounded-xl transition-all flex items-center gap-2 group relative ${
                user?.notifications 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
              title={user?.notifications ? "Notifications Active" : "Enable Notifications"}
            >
              {user?.notifications ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                {user?.notifications ? "Active" : "Notify Me"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(['ACTIVE', 'UPCOMING', 'ENDED'] as const).map((t) => (
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

      {/* Grid */}
      {filteredAuctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-8 bg-[#0f0f18] border border-white/5 rounded-[4rem] text-center px-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="w-28 h-28 bg-purple-600/10 rounded-full flex items-center justify-center border border-purple-500/20 relative z-10">
            <Gavel className="w-14 h-14 text-purple-400 opacity-50" />
          </div>
          <div className="space-y-3 relative z-10">
            <h2 className="text-4xl font-black text-white tracking-tight">Marketplace is quiet...</h2>
            <p className="text-gray-400 max-w-md mx-auto font-medium">
              We're restocking the vault. No {filter.toLowerCase()} auctions at the moment.
            </p>
          </div>
          
          <div className="p-1 rounded-[2.5rem] bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-blue-500/30 relative z-10">
            <div className="bg-[#161621] rounded-[2.4rem] p-10 space-y-8 max-w-lg shadow-2xl">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Never Miss a Drop</h3>
                <p className="text-gray-500 text-sm font-medium">Get a Discord DM the second we launch a new high-value auction.</p>
              </div>
              
              <button 
                onClick={toggleNotifications}
                disabled={notifying}
                className={`w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 ${
                  user?.notifications 
                    ? "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30" 
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30"
                }`}
              >
                {user?.notifications ? (
                  <>
                    <BellRing className="w-6 h-6" />
                    NOTIFICATIONS ACTIVE
                  </>
                ) : (
                  <>
                    <Bell className="w-6 h-6" />
                    NOTIFY ME ON DISCORD
                  </>
                )}
              </button>
            </div>
          </div>
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
                <div className="flex flex-col md:flex-row min-h-[400px]">
                  {/* Image Section */}
                  <div className="md:w-[45%] relative overflow-hidden bg-[#0a0a0f]">
                    <img
                      src={auction.image}
                      alt={auction.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-transparent to-transparent opacity-60" />
                    
                    {/* Status Badges */}
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

                  {/* Content Section */}
                  <div className="md:w-[55%] p-10 flex flex-col justify-between space-y-8 relative">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-3xl font-black text-white group-hover:text-purple-400 transition-colors leading-tight">
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

                    {/* Stats Card */}
                    <div className="grid grid-cols-2 gap-6 p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 relative overflow-hidden">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Bid</p>
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-500" />
                          <p className="text-3xl font-black text-white">{auction.currentBid.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Time Left</p>
                        <div className="flex items-center gap-2 text-purple-400">
                          <Clock className="w-5 h-5" />
                          <p className="text-2xl font-black tracking-tighter">{timers[auction.id] || "00:00:00"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="flex items-center justify-between gap-6 pt-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center shadow-inner">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Leading Bidder</p>
                          <p className="text-sm font-black text-white truncate max-w-[120px]">
                            {auction.highestBidder?.username || "NO BIDS YET"}
                          </p>
                        </div>
                      </div>
                      
                      <Link
                        href={`/auctions/${auction.id}`}
                        className="group/btn relative px-8 py-5 rounded-2xl font-black text-sm tracking-widest transition-all shadow-2xl active:scale-95 bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/30"
                      >
                        <span className="relative z-10 flex items-center gap-2 uppercase">
                          View Details
                          <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity blur-lg" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
