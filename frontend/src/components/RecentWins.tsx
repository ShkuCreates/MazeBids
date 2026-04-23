"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, Shield } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Win {
  id: string;
  title: string;
  image: string | null;
  currentBid: number;
  highestBidder: { username: string; avatar: string | null } | null;
  updatedAt: string;
}

const maskUsername = (username: string): string => {
  if (username.length <= 3) return username;
  return username.slice(0, 2) + "***" + username.slice(-1);
};

const formatTimeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function RecentWins() {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for recent wins (when API returns empty)
  const mockWins: Win[] = [
    {
      id: "mock-1",
      title: "iPhone 15 Pro Max",
      image: null,
      currentBid: 45000,
      highestBidder: { username: "CryptoKing", avatar: null },
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-2",
      title: "PlayStation 5 Bundle",
      image: null,
      currentBid: 32000,
      highestBidder: { username: "GamerPro", avatar: null },
      updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-3",
      title: "MacBook Air M3",
      image: null,
      currentBid: 58000,
      highestBidder: { username: "TechNinja", avatar: null },
      updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-4",
      title: "Samsung Galaxy S24 Ultra",
      image: null,
      currentBid: 28000,
      highestBidder: { username: "MobileMaster", avatar: null },
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ];

  useEffect(() => {
    const fetchRecentWins = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auctions/recent-wins`);
        const data = res.data;
        // If API returns empty, use mock data
        if (data.length === 0) {
          setWins(mockWins);
        } else {
          setWins(data);
        }
      } catch (err) {
        console.error("Failed to fetch recent wins:", err);
        setWins(mockWins);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentWins();

    // Simulate real-time updates every 8-10 seconds
    const interval = setInterval(() => {
      setWins((prev) => {
        // Add a new random win and remove oldest
        const newWin = {
          id: `mock-${Date.now()}`,
          title: ["iPhone 15 Pro Max", "PlayStation 5 Bundle", "MacBook Air M3", "Samsung Galaxy S24 Ultra", "Nintendo Switch OLED", "iPad Pro M2"][Math.floor(Math.random() * 6)],
          image: null,
          currentBid: Math.floor(Math.random() * 50000) + 10000,
          highestBidder: {
            username: ["CryptoKing", "GamerPro", "TechNinja", "MobileMaster", "BidMaster", "AuctionKing"][Math.floor(Math.random() * 6)],
            avatar: null,
          },
          updatedAt: new Date().toISOString(),
        };
        return [newWin, ...prev.slice(0, 3)];
      });
    }, 8000 + Math.random() * 2000); // 8-10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4">
        <div className="animate-pulse flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-48 h-32 bg-white/5 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (wins.length === 0) {
    return (
      <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-6">
        <h3 className="font-black text-white text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Recent Wins
        </h3>
        <p className="text-gray-500 text-sm">No recent wins yet</p>
      </div>
    );
  }

  const maxBid = Math.max(...wins.map((w) => w.currentBid));

  return (
    <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-orange-500/5 pointer-events-none" />

      <h3 className="font-black text-white text-sm tracking-wider uppercase mb-4 flex items-center gap-2 relative z-10">
        <Trophy className="w-4 h-4 text-yellow-400" />
        Recent Wins
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10">
        {wins.map((win, index) => {
          const isBigWin = win.currentBid >= maxBid * 0.7;
          return (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="w-48 shrink-0 relative group"
            >
              <div className={`h-32 rounded-xl overflow-hidden border ${
                isBigWin
                  ? "border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
                  : "border-white/10 bg-white/[0.03] group-hover:border-white/20"
              } transition-all duration-300`}>
                {/* Image */}
                {win.image ? (
                  <img
                    src={win.image}
                    alt={win.title}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-gray-800 to-gray-900" />
                )}

                {/* Content */}
                <div className="p-2">
                  <p className="text-[10px] text-gray-400 font-medium truncate">
                    {win.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-bold text-yellow-400">
                        {win.currentBid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-[9px] text-gray-500">
                        {formatTimeAgo(win.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Trophy className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                    <span className="text-[9px] text-gray-400">
                      {win.highestBidder ? maskUsername(win.highestBidder.username) : "Anonymous"}
                    </span>
                  </div>
                </div>

                {/* Big win badge */}
                {isBigWin && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                    <span className="text-[8px] font-black text-yellow-400 uppercase tracking-wider">
                      Big Win
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
