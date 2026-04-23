"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Coins, Gavel, Users, ChevronRight, Flame, Zap } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const socket = io(API_URL, { withCredentials: true });

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
  highestBidder: { username: string; avatar: string } | null;
  status: string;
}

export default function ActiveAuctionsPanel() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [recentBids, setRecentBids] = useState<Record<string, boolean>>({});

  const fetchAuctions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auctions`);
      const active = res.data.filter((a: Auction) => a.status === "ACTIVE");
      // Sort by ending soon first
      active.sort((a: Auction, b: Auction) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
      setAuctions(active.slice(0, 4)); // Max 4 for dashboard
    } catch (err) {
      console.error("Failed to fetch auctions for dashboard:", err);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();

    socket.on("bidUpdated", (updated: Auction) => {
      setAuctions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setRecentBids((prev) => ({ ...prev, [updated.id]: true }));
      setTimeout(() => setRecentBids((prev) => ({ ...prev, [updated.id]: false })), 1200);
    });

    const refetch = setInterval(fetchAuctions, 30000);
    return () => {
      clearInterval(refetch);
      socket.off("bidUpdated");
    };
  }, [fetchAuctions]);

  const getTimeLeft = useCallback((endTime: string) => {
    const total = Date.parse(endTime) - Date.now();
    if (total <= 0) return "ENDED";
    const s = Math.floor((total / 1000) % 60);
    const m = Math.floor((total / 1000 / 60) % 60);
    const h = Math.floor((total / (1000 * 60 * 60)) % 24);
    const d = Math.floor(total / (1000 * 60 * 60 * 24));
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const isEndingSoon = useCallback((endTime: string) => {
    const total = Date.parse(endTime) - Date.now();
    return total > 0 && total < 5 * 60 * 1000; // < 5 min
  }, []);

  const getSecondsLeft = useCallback((endTime: string) => {
    return Math.max(0, Date.parse(endTime) - Date.now());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const t: Record<string, string> = {};
      auctions.forEach((a) => {
        t[a.id] = getTimeLeft(a.endTime);
      });
      setTimers(t);
    }, 1000);
    return () => clearInterval(interval);
  }, [auctions, getTimeLeft]);

  if (auctions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-16 bg-[#0f0f18] border border-white/5 rounded-[2rem] text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
          <Gavel className="w-8 h-8 text-purple-400 opacity-40" />
        </div>
        <p className="text-gray-500 font-bold text-sm">No active auctions</p>
        <p className="text-gray-600 text-xs mt-1">Check back soon for new drops</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Active Auctions</h2>
        </div>
        <Link
          href="/auctions"
          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors flex items-center gap-1"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {auctions.map((auction) => {
            const ending = isEndingSoon(auction.endTime);
            const secs = getSecondsLeft(auction.endTime);
            const timer = timers[auction.id] || "00:00:00";
            const bidFlash = recentBids[auction.id];

            return (
              <motion.div
                key={auction.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_60px_-15px_rgba(139,92,246,0.35)] hover:-translate-y-1 ${
                  ending
                    ? "border-2 border-red-500/40 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]"
                    : "border border-white/10 hover:border-purple-500/40"
                } bg-[#0f0f18]`}
              >
                {/* Red pulse overlay for ending soon */}
                {ending && (
                  <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                )}

                {/* Bid flash overlay */}
                <AnimatePresence>
                  {bidFlash && (
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1.2 }}
                      className="absolute inset-0 bg-purple-400/10 pointer-events-none z-20"
                    />
                  )}
                </AnimatePresence>

                {/* Image */}
                <div className="relative h-32 overflow-hidden bg-[#0a0a0f]">
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-transparent to-transparent" />

                  {/* Ending soon badge */}
                  {ending && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md text-white shadow-lg shadow-red-500/30">
                      <Zap className="w-3 h-3 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Ending Soon</span>
                    </div>
                  )}

                  {/* Timer overlay */}
                  <div className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md border ${
                    ending
                      ? "bg-red-500/20 border-red-500/30"
                      : "bg-black/50 border-white/10"
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${ending ? "text-red-400 animate-pulse" : "text-purple-400"}`} />
                    <span className={`text-xs font-black tracking-tight ${ending ? "text-red-300" : "text-white"}`}>
                      {timer}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors leading-tight line-clamp-1">
                      {auction.title}
                    </h3>
                  </div>

                  {/* Bid info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-lg font-black text-white">{auction.currentBid.toLocaleString()}</span>
                    </div>
                    {auction.highestBidder && (
                      <div className="flex items-center gap-1.5">
                        {auction.highestBidder.avatar ? (
                          <img src={auction.highestBidder.avatar} className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-[8px] text-white font-bold">
                            {auction.highestBidder.username[0]}
                          </div>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">{auction.highestBidder.username}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/auctions/${auction.id}`}
                    className={`block w-full py-2.5 rounded-xl font-black text-xs tracking-wider text-center transition-all active:scale-95 ${
                      ending
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                    }`}
                  >
                    {ending ? "BID NOW — ENDING SOON" : "PLACE BID"}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
