"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Flag, Clock, Zap, Ban, UserCheck, Eye } from "lucide-react";

interface FlaggedUser {
  id: string;
  username: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  flaggedAt: string;
  bidsInLastHour: number;
}

interface SuspiciousActivity {
  id: string;
  type: "rapid_bidding" | "unusual_pattern" | "multiple_accounts";
  user: string;
  description: string;
  timestamp: string;
  status: "pending" | "reviewed" | "resolved";
}

const mockFlaggedUsers: FlaggedUser[] = [
  { id: "1", username: "FastBidder99", reason: "Rapid bidding pattern detected", riskLevel: "high", flaggedAt: "2024-04-23T10:30:00", bidsInLastHour: 45 },
  { id: "2", username: "SuspiciousUser", reason: "Multiple account suspicion", riskLevel: "medium", flaggedAt: "2024-04-23T09:15:00", bidsInLastHour: 12 },
  { id: "3", username: "NewBidder2024", reason: "Unusual bidding behavior", riskLevel: "low", flaggedAt: "2024-04-23T11:00:00", bidsInLastHour: 8 },
];

const mockSuspiciousActivities: SuspiciousActivity[] = [
  { id: "1", type: "rapid_bidding", user: "FastBidder99", description: "45 bids in the last hour", timestamp: "2024-04-23T10:30:00", status: "pending" },
  { id: "2", type: "unusual_pattern", user: "SuspiciousUser", description: "Bidding on multiple auctions simultaneously", timestamp: "2024-04-23T09:15:00", status: "reviewed" },
  { id: "3", type: "multiple_accounts", user: "NewBidder2024", description: "IP address matches banned user", timestamp: "2024-04-23T11:00:00", status: "pending" },
];

export default function ModerationTools() {
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>(mockFlaggedUsers);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>(mockSuspiciousActivities);
  const [bidRateLimit, setBidRateLimit] = useState(30);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "reviewed": return "bg-blue-500/20 text-blue-400";
      case "resolved": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleResolveActivity = (activityId: string) => {
    setSuspiciousActivities(activities =>
      activities.map(a => a.id === activityId ? { ...a, status: "resolved" as const } : a)
    );
  };

  const handleUnflagUser = (userId: string) => {
    setFlaggedUsers(users => users.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Moderation & Security</h1>
        <p className="text-gray-500 mt-1">Monitor and manage platform security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">High Risk Users</p>
          <p className="text-2xl font-black text-white">{flaggedUsers.filter(u => u.riskLevel === "high").length}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
            <Flag className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Flagged Activities</p>
          <p className="text-2xl font-black text-white">{suspiciousActivities.filter(a => a.status === "pending").length}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Bid Rate Limit</p>
          <p className="text-2xl font-black text-white">{bidRateLimit}/hr</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Flagged Users</h3>
          </div>

          <div className="space-y-4">
            {flaggedUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-red-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center font-bold text-white">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.bidsInLastHour} bids in last hour</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getRiskColor(user.riskLevel)}`}>
                    {user.riskLevel} risk
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{user.reason}</p>
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all">
                    <Ban className="w-3.5 h-3.5" />
                    Ban User
                  </button>
                  <button
                    onClick={() => handleUnflagUser(user.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Unflag
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Security Settings</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Bid Rate Limit (bids per hour)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={bidRateLimit}
                  onChange={(e) => setBidRateLimit(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="w-16 text-center font-bold text-white">{bidRateLimit}</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Auto-flag Rapid Bidding</p>
                  <p className="text-xs text-gray-500">Automatically flag users exceeding rate limit</p>
                </div>
                <div className="w-12 h-6 bg-purple-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">IP Address Tracking</p>
                  <p className="text-xs text-gray-500">Detect multiple accounts from same IP</p>
                </div>
                <div className="w-12 h-6 bg-purple-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Suspension on Violation</p>
                  <p className="text-xs text-gray-500">Auto-suspend high-risk users</p>
                </div>
                <div className="w-12 h-6 bg-gray-700 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all">
              Save Security Settings
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Flag className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">Suspicious Activities</h3>
        </div>

        <div className="space-y-4">
          {suspiciousActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-yellow-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === "rapid_bidding" ? "bg-red-500/20" :
                    activity.type === "unusual_pattern" ? "bg-yellow-500/20" : "bg-blue-500/20"
                  }`}>
                    <Zap className={`w-5 h-5 ${
                      activity.type === "rapid_bidding" ? "text-red-400" :
                      activity.type === "unusual_pattern" ? "text-yellow-400" : "text-blue-400"
                    }`} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{activity.user}</p>
                    <p className="text-xs text-gray-500 capitalize">{activity.type.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{activity.description}</p>
              {activity.status === "pending" && (
                <button
                  onClick={() => handleResolveActivity(activity.id)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Mark as Resolved
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
