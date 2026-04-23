"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Lock, Clock, Flame, Diamond, Zap } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Auction {
  id: string;
  title: string;
  image: string | null;
  startTime: string;
  isPremium: boolean;
}

export default function UpcomingAuctionsPanel() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auctions/upcoming`);
        setAuctions(res.data);
      } catch (err) {
        console.error("Failed to fetch upcoming auctions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  // Mock data for exciting upcoming auctions with censored images - use static timestamps
  const mockUpcoming: Auction[] = [
    {
      id: "mock-1",
      title: "Mystery Reward 🔒",
      image: null,
      startTime: "2024-12-25T10:00:00.000Z",
      isPremium: true,
    },
    {
      id: "mock-2",
      title: "Premium Drop (Hidden)",
      image: null,
      startTime: "2024-12-25T13:00:00.000Z",
      isPremium: true,
    },
    {
      id: "mock-3",
      title: "Mystery Reward 🔒",
      image: null,
      startTime: "2024-12-25T16:00:00.000Z",
      isPremium: false,
    },
    {
      id: "mock-4",
      title: "Premium Drop (Hidden)",
      image: null,
      startTime: "2024-12-25T20:00:00.000Z",
      isPremium: true,
    },
  ];

  const displayAuctions = auctions.length > 0 ? auctions : mockUpcoming;

  const getTimeLeft = (startTime: string): string => {
    if (!mounted) return "00:00:00";
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const diff = start - now;

    if (diff <= 0) return "Starting soon";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const t: Record<string, string> = {};
      displayAuctions.forEach((a) => {
        t[a.id] = getTimeLeft(a.startTime);
      });
      setTimers(t);
    }, 1000);
    return () => clearInterval(interval);
  }, [displayAuctions, mounted]);

  const handleNotify = async (auctionId: string) => {
    try {
      await axios.post(`${API_URL}/api/auctions/${auctionId}/notify`, {}, {
        withCredentials: true,
      });
      setSubscribed((prev) => new Set(prev).add(auctionId));
    } catch (err) {
      console.error("Failed to subscribe:", err);
    }
  };

  return (
    <div className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-white/10 rounded mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-64 h-48 bg-white/5 rounded-2xl shrink-0" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

          <h3 className="font-black text-white text-lg tracking-wider uppercase mb-4 flex items-center gap-2 relative z-10">
            <Clock className="w-5 h-5 text-purple-400" />
            Upcoming Auctions
          </h3>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10">
            {displayAuctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="w-72 shrink-0 relative group"
              >
                {/* Card */}
                <div className="relative h-52 rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/5 group-hover:border-purple-500/40 transition-all duration-300 shadow-lg shadow-purple-500/10 group-hover:shadow-purple-500/20">
                  {/* Censored image with blur */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black/60 backdrop-blur-md group-hover:backdrop-blur-[4px] transition-all duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-[#0f0f18]/80 to-transparent opacity-90" />

                  {/* Locked badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-full">
                    <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1">
                      🔒 Locked
                    </span>
                  </div>

                  {/* Tags */}
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

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2 animate-pulse">🔮</div>
                      <p className="text-white font-black text-sm">{auction.title}</p>
                    </div>
                  </div>

                  {/* Countdown badge */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                    <span className="text-[11px] font-black text-white">
                      {timers[auction.id] || "00:00:00"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[10px] text-purple-300 uppercase tracking-wider">
                      Starts in {timers[auction.id] || "00:00:00"}
                    </p>
                  </div>
                </div>

                {/* Notify button */}
                {subscribed.has(auction.id) ? (
                  <div className="mt-3 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                    <span className="text-[11px] font-black text-green-400 uppercase tracking-wider flex items-center justify-center gap-2">
                      <Bell className="w-3.5 h-3.5" />
                      You're notified
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNotify(auction.id)}
                    className="mt-3 w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-center border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                  >
                    <span className="text-[11px] font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
                      <Bell className="w-3.5 h-3.5" />
                      Notify Me
                    </span>
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
