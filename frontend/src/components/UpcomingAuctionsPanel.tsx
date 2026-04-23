"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Lock, Clock, Flame } from "lucide-react";
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
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  // Mock data for exciting upcoming auctions (when API returns empty)
  const mockUpcoming = [
    {
      id: "mock-1",
      title: "🔥 Mystery Tech Drop - Limited Edition",
      image: null,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      isPremium: true,
    },
    {
      id: "mock-2",
      title: "💎 Rare Gemstone Auction - One of a Kind",
      image: null,
      startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      isPremium: true,
    },
    {
      id: "mock-3",
      title: "🎮 Gaming Console Bundle - Ultimate Setup",
      image: null,
      startTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      isPremium: false,
    },
    {
      id: "mock-4",
      title: "⚡ Electric Scooter - Premium Model",
      image: null,
      startTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      isPremium: true,
    },
  ];

  const displayAuctions = auctions.length > 0 ? auctions : mockUpcoming;

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

  const formatCountdown = (startTime: string): string => {
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const diff = start - now;

    if (diff <= 0) return "Starting soon";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<string, string> = {};
      auctions.forEach((a) => {
        newCountdowns[a.id] = formatCountdown(a.startTime);
      });
      setCountdowns(newCountdowns);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [auctions]);

  if (loading) {
    return (
      <div className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-white/10 rounded mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-64 h-48 bg-white/5 rounded-2xl shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden">
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
            className="w-72 shrink-0 relative group"
          >
            {/* Card */}
            <div className="relative h-52 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] group-hover:border-purple-500/30 transition-all duration-300">
              {/* Blurred image */}
              {auction.image ? (
                <div className="absolute inset-0">
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-full object-cover blur-md scale-110 opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-[#0f0f18]/80 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
              )}

              {/* Lock icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              {/* High value badge */}
              {auction.isPremium && (
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">
                    High Value
                  </span>
                </div>
              )}

              {/* Countdown badge */}
              <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <span className="text-[11px] font-black text-white">
                  {countdowns[auction.id] || formatCountdown(auction.startTime)}
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="font-black text-white text-sm mb-1 line-clamp-1">
                  {auction.title}
                </h4>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Starts in {countdowns[auction.id] || formatCountdown(auction.startTime)}
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
    </div>
  );
}
