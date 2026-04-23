"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Activity, Coins, Gavel, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AnimatedCounter from "../AnimatedCounter";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCoins: number;
  totalEarned: number;
  totalSpent: number;
  activeAuctions: number;
  endedAuctions: number;
  todayBids: number;
  weekBids: number;
  todayEarned: number;
  todaySpent: number;
  inflationRate: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyBidsData, setDailyBidsData] = useState([]);
  const [coinsData, setCoinsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/dashboard-stats`, {
        withCredentials: true
      });
      
      setStats(res.data.stats);
      setDailyBidsData(res.data.dailyBidsData);
      setCoinsData(res.data.coinsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[Admin] Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = stats ? [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10", change: `+${stats.activeUsers} active`, positive: true },
    { label: "Coins in Circulation", value: stats.totalCoins, icon: Coins, color: "text-yellow-400", bg: "bg-yellow-500/10", change: `${stats.inflationRate}% inflation`, positive: stats.inflationRate < 5 },
    { label: "Total Earned", value: stats.totalEarned, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10", change: `+${stats.todayEarned} today`, positive: true },
    { label: "Total Spent", value: stats.totalSpent, icon: ArrowDownRight, color: "text-red-400", bg: "bg-red-500/10", change: `${stats.todaySpent} today`, positive: false },
    { label: "Active Auctions", value: stats.activeAuctions, icon: Gavel, color: "text-pink-400", bg: "bg-pink-500/10", change: `${stats.endedAuctions} ended`, positive: true },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of platform performance</p>
          <p className="text-xs text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Data
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white mb-2">
                <AnimatedCounter value={stat.value} />
              </p>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Daily Bids</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyBidsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 15, 24, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Line type="monotone" dataKey="bids" stroke="#a855f7" strokeWidth={3} dot={{ fill: "#a855f7" }} />
                <Line type="monotone" dataKey="users" stroke="#ec4899" strokeWidth={3} dot={{ fill: "#ec4899" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Coins Earned vs Spent</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coinsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 15, 24, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="earned" fill="#a855f7" radius={[8, 8, 0, 0]} />
                <Bar dataKey="spent" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-6">User Activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyBidsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 15, 24, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="url(#gradient)"
                strokeWidth={3}
                dot={{ fill: "#a855f7" }}
                activeDot={{ r: 8 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
}
