"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, Activity, Target } from "lucide-react";

const bidsPerDayData = [
  { day: "Mon", bids: 120 },
  { day: "Tue", bids: 180 },
  { day: "Wed", bids: 150 },
  { day: "Thu", bids: 220 },
  { day: "Fri", bids: 280 },
  { day: "Sat", bids: 350 },
  { day: "Sun", bids: 310 },
];

const popularAuctionsData = [
  { name: "iPhone 15 Pro", bids: 45, value: 45000 },
  { name: "MacBook Air", bids: 38, value: 38000 },
  { name: "AirPods Pro", bids: 32, value: 32000 },
  { name: "iPad Pro", bids: 28, value: 28000 },
  { name: "Apple Watch", bids: 25, value: 25000 },
];

const engagementData = [
  { source: "Games", value: 45, color: "#a855f7" },
  { source: "Ads", value: 30, color: "#ec4899" },
  { source: "Referrals", value: 15, color: "#3b82f6" },
  { source: "Direct", value: 10, color: "#10b981" },
];

const conversionData = [
  { month: "Jan", rate: 12 },
  { month: "Feb", rate: 15 },
  { month: "Mar", rate: 18 },
  { month: "Apr", rate: 22 },
  { month: "May", rate: 25 },
  { month: "Jun", rate: 28 },
];

export default function AnalyticsPanel() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Analytics</h1>
        <p className="text-gray-500 mt-1">Platform performance insights and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Bids</p>
          <p className="text-2xl font-black text-white">1,610</p>
          <p className="text-xs text-green-400 mt-2">+15.3% this week</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Users</p>
          <p className="text-2xl font-black text-white">342</p>
          <p className="text-xs text-green-400 mt-2">+8.2% this week</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Avg Session</p>
          <p className="text-2xl font-black text-white">12m</p>
          <p className="text-xs text-green-400 mt-2">+2.1% this week</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-pink-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Conversion</p>
          <p className="text-2xl font-black text-white">28%</p>
          <p className="text-xs text-green-400 mt-2">+3.5% this week</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Bids Per Day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bidsPerDayData}>
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
                <Bar dataKey="bids" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Most Popular Auctions</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularAuctionsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 15, 24, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="bids" fill="#a855f7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">User Engagement Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 15, 24, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {engagementData.map((item) => (
              <div key={item.source} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-400">{item.source}</span>
                <span className="text-sm font-bold text-white ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Conversion Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionData}>
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
                  dataKey="rate"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#a855f7" }}
                  activeDot={{ r: 8 }}
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
