"use client";
import { useEffect, useState, useCallback, use } from "react";
import { io } from "socket.io-client";
import { Gavel, Clock, Users, ChevronRight, Coins, ShoppingBag, Trophy, ArrowLeft, Star, TrendingUp, ShieldCheck, ExternalLink, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import LiveInterestIndicator from "@/components/LiveInterestIndicator";
import RecentWins from "@/components/RecentWins";
import UpcomingAuctionsPanel from "@/components/UpcomingAuctionsPanel";
import EarnWhileYouWait from "@/components/EarnWhileYouWait";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(API_URL, {
  withCredentials: true
});

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

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const [timeLeft, setTimeLeft] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [showFundsError, setShowFundsError] = useState(false);
  const router = useRouter();

  const fetchAuction = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auctions/${id}`);
      setAuction(response.data);
    } catch (err) {
      setError("Failed to load auction details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
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
      console.error("Bid error:", err.message);
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
  }, [id, user?.id, fetchAuction, refreshUser]);

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

  const handleBid = () => {
    if (!user) return alert("Please login to bid");
    if (!auction) return;
    setIsBidding(true);
    const amount = auction.currentBid + auction.minBidIncrement;
    socket.emit("placeBid", { auctionId: auction.id, userId: user.id, amount });
    setTimeout(() => setIsBidding(false), 500);
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );

  if (!auction) return <div className="py-20 text-center text-white">Auction not found.</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 relative">
      <AdBanner placement="AUCTIONS" />
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
        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f18] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl"
          >
            {/* Main Product Image */}
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

            {/* Bidding Controls */}
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
        </div>

        {/* Right Sidebar: Leaderboard & Stats */}
        <div className="lg:col-span-4 space-y-8">
          {/* Upcoming Auctions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <UpcomingAuctionsPanel />
          </motion.div>

          {/* Earn Coins While You Wait */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
          >
            <EarnWhileYouWait />
          </motion.div>

          {/* Recent Wins */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <RecentWins />
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

          {/* Leaderboard / Recent Bids */}
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
    </div>
  );
}
