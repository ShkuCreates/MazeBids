"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, Users, Coins, Gavel } from "lucide-react";
import Link from "next/link";

export default function FeaturedAuction() {
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [bidCount, setBidCount] = useState(127);

  const getTimeLeft = (): string => {
    const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const now = Date.now();
    const diff = endTime.getTime() - now;

    if (diff <= 0) return "00:00:00";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBidCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-purple-600/20 border-2 border-purple-500 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl shadow-purple-500/30"
    >
      {/* Animated glow border */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-30 animate-pulse blur-sm" />
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-20 blur-md" style={{ animation: "spin 4s linear infinite" }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
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

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image side */}
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

          {/* Info side */}
          <div className="flex flex-col justify-center space-y-4">
            {/* Entry coins */}
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

            {/* Bid count */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider">Live Bids</p>
                  <p className="font-black text-white text-xl">{bidCount}</p>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider">Time Left</p>
                  <p className="font-black text-white text-xl font-mono">{timeLeft}</p>
                </div>
              </div>
            </div>

            {/* CTA button */}
            <Link
              href="/auctions"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-lg tracking-wider transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Gavel className="w-5 h-5" />
              JOIN AUCTION
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
