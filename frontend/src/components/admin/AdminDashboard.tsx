"use client";

import { motion } from "framer-motion";
import { Users, Activity, Coins, DollarSign, Gavel, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AnimatedCounter from "../AnimatedCounter";

const dailyBidsData = [
  { day: "Mon", bids: 120, users: 45 },
  { day: "Tue", bids: 180, users: 62 },
  { day: "Wed", bids: 150, users: 55 },
  { day: "Thu", bids: 220, users: 78 },
  { day: "Fri", bids: 280, users: 95 },
  { day: "Sat", bids: 350, users: 120 },
  { day: "Sun", bids: 310, users: 110 },
];

const coinsData = [
  { day: "Mon", earned: 5000, spent: 3200 },
  { day: "Tue", earned: 6200, spent: 4100 },
  { day: "Wed", earned: 4800, spent: 3800 },
  { day: "Thu", earned: 7500, spent: 5200 },
  { day: "Fri", earned: 8900, spent: 6100 },
  { day: "Sat", earned: 12000, spent: 8500 },
  { day: "Sun", earned: 10500, spent: 7200 },
];

const userGrowthData = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 180 },
  { month: "Mar", users: 250 },
  { month: "Apr", users: 320 },
  { month: "May", users: 450 },
  { month: "Jun", users: 580 },
];

export default function AdminDashboard() {
  const stats = [
    { label: "Total Users", value: 15847, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10", change: "+12.5%", positive: true },
    { label: "Active Users", value: 342, icon: Activity, color: "text-green-400", bg: "bg-green-500/10", change: "+8.2%", positive: true },
    { label: "Coins in Circulation", value: 2450000, icon: Coins, color: "text-yellow-400", bg: "bg-yellow-500/10", change: "+5.1%", positive: true },
    { label: "Total Revenue", value: 18500, icon: DollarSign, color: "text-blue-400", bg: "bg-blue-500/10", change: "-2.3%", positive: false },
    { label: "Active Auctions", value: 24, icon: Gavel, color: "text-pink-400", bg: "bg-pink-500/10", change: "+3", positive: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of platform performance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live Data
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
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
        <h3 className="text-lg font-bold text-white mb-6">User Growth</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
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
    </div>
  );
}
