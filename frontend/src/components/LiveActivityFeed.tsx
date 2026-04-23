"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gavel, Trophy, ShoppingBag, Clock, User } from "lucide-react";
import Link from "next/link";
import { io } from "socket.io-client";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Activity {
  id: string;
  username: string;
  action: "bid" | "won" | "listed" | "joined";
  itemName: string;
  itemId?: string;
  amount?: number;
  timestamp: Date;
}

const getActionIcon = (action: Activity["action"]) => {
  switch (action) {
    case "bid":
      return <Gavel className="w-3.5 h-3.5 text-yellow-400" />;
    case "won":
      return <Trophy className="w-3.5 h-3.5 text-purple-400" />;
    case "listed":
      return <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />;
    case "joined":
      return <User className="w-3.5 h-3.5 text-green-400" />;
  }
};

const getActionText = (action: Activity["action"]) => {
  switch (action) {
    case "bid":
      return "placed a bid on";
    case "won":
      return "won the";
    case "listed":
      return "listed";
    case "joined":
      return "joined the auction for";
  }
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const getAvatarColor = (username: string): string => {
  const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"];
  const index = username.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch recent bids from API on mount
  useEffect(() => {
    const fetchRecentBids = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auctions`);
        const activeAuctions = res.data || [];

        // Build activity list from recent bids across auctions
        const recentActivities: Activity[] = [];
        for (const auction of activeAuctions) {
          if (auction.highestBidder) {
            recentActivities.push({
              id: `init-${auction.id}`,
              username: auction.highestBidder.username,
              action: "bid",
              itemName: auction.title,
              itemId: auction.id,
              amount: auction.currentBid,
              timestamp: new Date(auction.updatedAt || Date.now()),
            });
          }
        }
        // Sort by most recent
        recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(recentActivities.slice(0, 15));
      } catch (err) {
        console.error("Failed to fetch recent activity:", err);
      }
    };
    fetchRecentBids();
  }, []);

  // Listen for real-time bid updates via socket.io
  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });

    socket.on("bidUpdated", (updatedAuction: any) => {
      if (updatedAuction.highestBidder) {
        const newActivity: Activity = {
          id: `live-${Date.now()}-${updatedAuction.id}`,
          username: updatedAuction.highestBidder.username,
          action: "bid",
          itemName: updatedAuction.title,
          itemId: updatedAuction.id,
          amount: updatedAuction.currentBid,
          timestamp: new Date(),
        };

        setActivities((prev) => {
          // Avoid duplicates for same auction within 5 seconds
          const filtered = prev.filter(
            (a) => !(a.itemId === updatedAuction.id && Date.now() - a.timestamp.getTime() < 5000)
          );
          return [newActivity, ...filtered].slice(0, 15);
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-500/5 relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm tracking-wider">LIVE ACTIVITY</h3>
            <p className="text-[10px] text-gray-500 font-medium">Real-time platform updates</p>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Activity List */}
      <div 
        ref={scrollRef}
        className="h-[400px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent"
      >
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index < 3 ? index * 0.05 : 0,
                ease: "easeOut" 
              }}
            >
              <Link 
                href={activity.itemId ? `/auctions/${activity.itemId}` : "#"}
                className="block p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl ${getAvatarColor(activity.username)} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-black/20`}>
                    {activity.username.charAt(0)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{activity.username}</span>
                      <span className="text-gray-500 text-xs">{getActionText(activity.action)}</span>
                      <span className="text-purple-400 font-bold text-sm truncate">{activity.itemName}</span>
                    </div>
                    
                    {activity.amount && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-yellow-400 font-black text-xs">₹{activity.amount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                        {getActionIcon(activity.action)}
                        <span className="capitalize">{activity.action}</span>
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Arrow indicator on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Empty state if no activities */}
        {activities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No recent activity</p>
          </div>
        )}
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0f0f18] to-transparent pointer-events-none" />
    </div>
  );
}
