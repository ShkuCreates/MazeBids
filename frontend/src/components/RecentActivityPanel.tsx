"use client";

import { motion } from "framer-motion";
import { Gavel, TrendingUp, Trophy, Clock, Gift, Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Activity {
  type: "bid" | "earn" | "win" | "lose" | "join";
  amount?: number;
  item?: string;
  source?: string;
  time: Date;
}

interface RecentActivityPanelProps {
  activities?: Activity[];
}

const defaultActivities: Activity[] = [
  { type: "bid", amount: 200, item: "iPhone 15", time: new Date("2024-01-15T10:28:00.000Z") },
  { type: "earn", amount: 50, source: "video", time: new Date("2024-01-15T10:15:00.000Z") },
  { type: "win", amount: 1500, item: "MacBook Air", time: new Date("2024-01-15T09:00:00.000Z") },
  { type: "join", item: "Gaming Console", time: new Date("2024-01-15T08:00:00.000Z") },
  { type: "earn", amount: 100, source: "daily bonus", time: new Date("2024-01-15T07:00:00.000Z") },
  { type: "bid", amount: 300, item: "AirPods Pro", time: new Date("2024-01-15T05:00:00.000Z") },
  { type: "lose", amount: 450, item: "Smart Watch", time: new Date("2024-01-15T02:00:00.000Z") },
  { type: "earn", amount: 25, source: "referral", time: new Date("2024-01-14T22:00:00.000Z") },
  { type: "join", item: "iPad Pro", time: new Date("2024-01-14T10:00:00.000Z") },
  { type: "bid", amount: 100, item: "Gift Card", time: new Date("2024-01-13T22:00:00.000Z") },
];

const getActivityConfig = (activity: Activity) => {
  switch (activity.type) {
    case "bid":
      return { icon: Gavel, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Bid Placed" };
    case "earn":
      return { icon: Coins, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Coins Earned" };
    case "win":
      return { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Auction Won" };
    case "lose":
      return { icon: Clock, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Auction Lost" };
    case "join":
      return { icon: Gift, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Auction Joined" };
    default:
      return { icon: Clock, color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", label: "Activity" };
  }
};

const getRelativeTime = (date: Date, mounted: boolean) => {
  if (!mounted) return "Loading...";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function RecentActivityPanel({ activities = defaultActivities }: RecentActivityPanelProps) {
  const [displayActivities, setDisplayActivities] = useState(activities);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDisplayActivities(activities.slice(0, 10));
  }, [activities]);

  return (
    <div className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-400" />
        Recent Activity
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        {displayActivities.map((activity, index) => {
          const config = getActivityConfig(activity);
          const Icon = config.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-2xl ${config.bg} ${config.border} border hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer group`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{config.label}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {activity.item || activity.source || "Activity"}
                  </p>
                </div>
                
                <div className="text-right">
                  {activity.amount !== undefined && (
                    <p className={`font-bold text-sm ${activity.type === "earn" || activity.type === "win" ? "text-green-400" : "text-red-400"} flex items-center gap-1 justify-end`}>
                      {activity.type === "earn" || activity.type === "win" ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {activity.amount}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{getRelativeTime(activity.time, mounted)}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
