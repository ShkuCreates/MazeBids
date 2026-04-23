"use client";
import { useEffect, useState, use } from "react";
import { io } from "socket.io-client";
import { Gavel, Clock, Users, Coins, ShoppingBag, Trophy, ArrowLeft, Star, TrendingUp, ShieldCheck, ExternalLink, AlertCircle, X, Flame, Diamond, Zap, Eye, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import LiveInterestIndicator from "@/components/LiveInterestIndicator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(API_URL, { withCredentials: true });

interface Bid {
  id: string;
  amount: number;
  timestamp: string;
  user: {
    username: string;
    avatar: string | null;
  };
}

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
  highestBidder: { username: string; avatar: string | null } | null;
  status: string;
  bids: Bid[];
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

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const [timeLeft, setTimeLeft] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [showFundsError, setShowFundsError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Live Popups State
  const [popups, setPopups] = useState<Popup[]>([]);

  // Live Activity Feed State
  const [activities, setActivities] = useState<Activity[]>([]);

  // Upcoming Auctions Timers
  const [upcomingTimers, setUpcomingTimers] = useState<Record<string, string>>({});

  // Featured Auction State
  const [featuredTimer, setFeaturedTimer] = useState("00:00:00");
  const [featuredBidCount, setFeaturedBidCount] = useState(127);

  // Mock upcoming auctions with censored images - use static timestamps
  const upcomingAuctions = [
    { id: "up-1", title: "Mystery Reward 🔒", startTime: "2024-12-25T10:00:00.000Z", isPremium: true },
    { id: "up-2", title: "Premium Drop (Hidden)", startTime: "2024-12-25T13:00:00.000Z", isPremium: true },
    { id: "up-3", title: "Mystery Reward 🔒", startTime: "2024-12-25T16:00:00.000Z", isPremium: false },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch auction data
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auctions/${id}`);
        setAuction(response.data);
      } catch (err) {
        setError("Failed to load auction details");
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();

    socket.emit("joinAuction", id);

    socket.on("bidUpdated", (updatedAuction: Auction) => {
      if (updatedAuction.id === id) {
        setAuction(updatedAuction);
        if (updatedAuction.highestBidderId === user?.id) {
          refreshUser();
        }
      }
    });

    socket.on("error", (err: { message: string }) => {
      if (err.message.toLowerCase().includes("insufficient coins") || err.message.toLowerCase().includes("out of funds")) {
        setShowFundsError(true);
        setTimeout(() => setShowFundsError(false), 5000);
      }
      setIsBidding(false);
    });

    return () => {
      socket.emit("leaveAuction", id);
      socket.off("bidUpdated");
      socket.off("error");
    };
  }, [id, user?.id, refreshUser]);

  // Main auction timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!auction) return;
      const total = Date.parse(auction.endTime) - Date.now();
      if (total <= 0) {
        setTimeLeft("ENDED");
        clearInterval(timer);
      } else {
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  // Featured auction timer
  useEffect(() => {
    if (!mounted) return;
    const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = endTime.getTime() - now;
      if (diff <= 0) {
        setFeaturedTimer("00:00:00");
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setFeaturedTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Featured auction bid count
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setFeaturedBidCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Upcoming auctions timers
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const t: Record<string, string> = {};
      upcomingAuctions.forEach((a) => {
        const now = Date.now();
        const start = new Date(a.startTime).getTime();
        const diff = start - now;
        if (diff <= 0) {
          t[a.id] = "Starting soon";
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          t[a.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      setUpcomingTimers(t);
    }, 1000);
    return () => clearInterval(interval);
  }, [upcomingAuctions, mounted]);

  // Live Popups generator
  useEffect(() => {
    if (!mounted) return;
    const messages = [
      { icon: <Eye className="w-4 h-4 text-blue-400" />, template: () => `👀 ${Math.floor(Math.random() * 450) + 50} users are watching right now` },
      { icon: <Coins className="w-4 h-4 text-yellow-400" />, template: () => `💰 ${(Math.floor(Math.random() * 4500) + 500).toLocaleString()} coins just farmed` },
      { icon: <Flame className="w-4 h-4 text-orange-400" />, template: () => `🔥 ${["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"][Math.floor(Math.random() * 5)]} joined an auction` },
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

  // Live Activity Feed generator
  useEffect(() => {
    if (!mounted) return;
    const usernames = ["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"];
    const actions = ["placed a bid on", "joined auction for", "won", "is watching"];
    const items = ["iPhone 15", "MacBook Air", "PS5", "AirPods Pro", "Samsung Galaxy", "iPad Pro"];

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

    setActivities(Array.from({ length: 5 }, () => generateActivity()));

    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateActivity();
        return [newActivity, ...prev.slice(0, 6)];
      });
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [mounted]);

  const handleBid = () => {
    if (!user) return alert("Please login to bid");
    if (!auction) return;
    setIsBidding(true);
    const amount = auction.currentBid + auction.minBidIncrement;
    socket.emit("placeBid", { auctionId: auction.id, userId: user.id, amount });
    setTimeout(() => setIsBidding(false), 500);
  };

  const getTimeAgo = (timestamp: Date): string => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 120) return "1 min ago";
    return `${Math.floor(seconds / 60)} min ago`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : !auction ? (
        <div className="py-20 text-center text-white">Auction not found.</div>
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

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 relative">
        <AdBanner placement="AUCTIONS" />

        {/* Featured Mega Auction */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-purple-600/20 border-2 border-purple-500 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl shadow-purple-500/30"
        >
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-30 animate-pulse blur-sm" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-white text-xl tracking-wider">🔥 MEGA AUCTION</h2>
                  <p className="text-purple-300 text-xs font-medium">Premium Drop • Limited Time</p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/40">
                <span className="text-purple-300 text-[10px] font-black uppercase tracking-widest">Live Now</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-3">💻</div>
                  <h3 className="font-black text-white text-2xl">MacBook Air M2</h3>
                  <p className="text-purple-300 text-sm mt-1">Space Gray • 256GB SSD</p>
                </div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40">
                  <span className="text-yellow-300 text-[10px] font-black uppercase tracking-widest">💎 Premium</span>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider">Entry Coins</p>
                      <p className="font-black text-white text-xl">500</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider">Live Bids</p>
                      <p className="font-black text-white text-xl">{featuredBidCount}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider">Time Left</p>
                      <p className="font-black text-white text-xl font-mono">{featuredTimer}</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="#auction-details"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-lg tracking-wider transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Gavel className="w-5 h-5" />
                  JOIN AUCTION
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <Link
          href="/auctions"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-black tracking-widest uppercase">Back to Marketplace</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Content: Auction Info & Bidding */}
          <div className="lg:col-span-8 space-y-8" id="auction-details">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0f0f18] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="aspect-video relative overflow-hidden group">
                <img
                  src={auction.image}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                  alt={auction.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-transparent to-transparent opacity-80" />

                <div className="absolute top-8 left-8 flex flex-col gap-3">
                  <div className="px-5 py-2.5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center gap-2 shadow-2xl animate-pulse uppercase tracking-widest">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    Live Auction
                  </div>
                  <div className="px-5 py-2.5 bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-black rounded-full flex items-center gap-2 border border-white/10 uppercase tracking-widest">
                    <ShoppingBag className="w-4 h-4 text-purple-400" />
                    {auction.product}
                  </div>
                  <LiveInterestIndicator auctionId={auction.id} />
                </div>

                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-6">
                  <div className="space-y-2">
                    <h1 className="text-5xl font-black text-white tracking-tighter">{auction.title}</h1>
                    <p className="text-gray-400 font-medium max-w-lg">{auction.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 bg-gradient-to-b from-transparent to-purple-500/5">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Bid</p>
                      <p className="text-4xl font-black text-white">{auction.currentBid.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Time Remaining</p>
                      <p className="text-4xl font-black text-purple-400 tracking-tighter">{timeLeft}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBid}
                    disabled={auction.status !== 'ACTIVE' || isBidding}
                    className={`relative w-full py-6 rounded-2xl font-black text-lg tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all ${
                      auction.status === 'ACTIVE'
                      ? "bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/40"
                      : "bg-white/5 text-gray-500 grayscale cursor-not-allowed"
                    }`}
                  >
                    <Gavel className={`w-6 h-6 ${isBidding ? 'animate-bounce' : ''}`} />
                    PLACE BID (+{auction.minBidIncrement})
                    {isBidding && <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse" />}
                  </motion.button>
                  <p className="text-center text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                    {user ? `Your Balance: ${user.coins.toLocaleString()} Coins` : "Please login to start bidding"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Ad Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-12 text-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sponsored Placement</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Earn Free Coins instantly</h3>
                  <p className="text-gray-500 text-sm font-medium">Watch a quick 15-second sponsor video to get 250 coins for your next bid.</p>
                </div>
                <Link
                  href="/earn"
                  className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-black text-sm hover:bg-purple-500 hover:text-white transition-all shadow-xl"
                >
                  EARN COINS NOW
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Live Activity Feed */}
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
                    <p className="text-[10px] text-gray-500 font-medium">Real-time platform updates</p>
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
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Upcoming Auctions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

              <h3 className="font-black text-white text-lg tracking-wider uppercase mb-4 flex items-center gap-2 relative z-10">
                <Clock className="w-5 h-5 text-purple-400" />
                Upcoming Auctions
              </h3>

              <div className="space-y-4 relative z-10">
                {upcomingAuctions.map((auction, index) => (
                  <motion.div
                    key={auction.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/5 group-hover:border-purple-500/40 transition-all duration-300 shadow-lg shadow-purple-500/10 group-hover:shadow-purple-500/20">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black/60 backdrop-blur-md group-hover:backdrop-blur-[4px] transition-all duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-[#0f0f18]/80 to-transparent opacity-90" />

                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-full">
                        <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1">
                          🔒 Locked
                        </span>
                      </div>

                      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2">
                        <div className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                          <Flame className="w-3 h-3 text-orange-400" />
                        </div>
                        {auction.isPremium && (
                          <div className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                            <Diamond className="w-3 h-3 text-blue-400" />
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2 animate-pulse">🔮</div>
                          <p className="text-white font-black text-sm">{auction.title}</p>
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                        <span className="text-[11px] font-black text-white">
                          {upcomingTimers[auction.id] || "00:00:00"}
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-[10px] text-purple-300 uppercase tracking-wider">
                          Starts in {upcomingTimers[auction.id] || "00:00:00"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Leading Bidder Profile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
              <div className="flex items-center gap-3 relative">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Leading Bidder</h2>
              </div>

              {auction.highestBidder ? (
                <div className="flex items-center gap-5 p-4 bg-white/[0.03] rounded-2xl border border-white/5 group transition-all hover:bg-white/[0.05]">
                  <div className="relative">
                    <img
                      src={auction.highestBidder.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                      className="w-16 h-16 rounded-2xl border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                      alt={auction.highestBidder.username}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-5 h-5 rounded-full border-4 border-[#0f0f18]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-white group-hover:text-purple-400 transition-colors">{auction.highestBidder.username}</p>
                    <div className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-black text-purple-400">HIGHEST BID</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <p className="text-sm font-bold text-gray-600">No bids yet. Be the first!</p>
                </div>
              )}
            </motion.div>

            {/* Recent Bids */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-black text-white tracking-tight uppercase">Recent Bids</h2>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-gray-500">
                  LIVE
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {auction.bids?.slice(0, 8).map((bid, index) => (
                    <motion.div
                      key={bid.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        index === 0
                        ? "bg-purple-500/10 border-purple-500/30"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={bid.user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                          className={`w-8 h-8 rounded-lg ${index === 0 ? 'border border-purple-500' : ''}`}
                          alt={bid.user.username}
                        />
                        <span className={`text-sm font-bold ${index === 0 ? 'text-white' : 'text-gray-400'}`}>
                          {bid.user.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Coins className={`w-3 h-3 ${index === 0 ? 'text-yellow-500' : 'text-gray-600'}`} />
                        <span className={`text-sm font-black ${index === 0 ? 'text-purple-400' : 'text-gray-500'}`}>
                          {bid.amount.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {(!auction.bids || auction.bids.length === 0) && (
                  <p className="text-center text-xs font-bold text-gray-600 py-10">Waiting for the first bid...</p>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Secured Bidding</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Insufficient Funds Popup */}
        <AnimatePresence>
          {showFundsError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-10 right-10 z-[100] max-w-sm w-full"
            >
              <div className="bg-[#1a1025] border border-red-500/30 rounded-3xl p-6 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-white font-black uppercase tracking-widest text-xs">Transaction Failed</h3>
                    <p className="text-gray-400 text-sm font-medium">You are out of funds, can't Bid More!</p>
                    <Link
                      href="/earn"
                      className="inline-flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase hover:text-purple-300 pt-2 transition-colors"
                    >
                      Earn More Coins <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <button
                    onClick={() => setShowFundsError(false)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </>
      )}
    </div>
  );
}
