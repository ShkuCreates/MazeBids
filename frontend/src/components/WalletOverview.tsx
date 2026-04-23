"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AnimatedCounter from "./AnimatedCounter";
import Link from "next/link";

interface WalletOverviewProps {
  currentBalance?: number;
  earnedToday?: number;
  earnedWeek?: number;
  spent?: number;
  chartData?: any[];
}

const defaultChartData = [
  { day: "Mon", earned: 150, spent: 80 },
  { day: "Tue", earned: 200, spent: 120 },
  { day: "Wed", earned: 100, spent: 50 },
  { day: "Thu", earned: 300, spent: 200 },
  { day: "Fri", earned: 250, spent: 150 },
  { day: "Sat", earned: 400, spent: 300 },
  { day: "Sun", earned: 350, spent: 180 },
];

export default function WalletOverview({
  currentBalance = 5250,
  earnedToday = 150,
  earnedWeek = 1750,
  spent = 1080,
  chartData = defaultChartData
}: WalletOverviewProps) {
  return (
    <div className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Wallet className="w-5 h-5 text-purple-400" />
        Wallet Overview
      </h3>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-blue-500/20 p-8 border border-purple-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 blur-[60px] rounded-full" />
        
        <div className="relative">
          <p className="text-sm font-bold text-gray-400 mb-2">Current Balance</p>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter
              value={currentBalance}
              className="text-5xl font-black text-white"
            />
            <span className="text-2xl font-bold text-purple-400">coins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:shadow-lg hover:shadow-green-500/10 transition-all"
        >
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Today</p>
          <p className="text-lg font-bold text-green-400">+{earnedToday}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
        >
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2">
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">This Week</p>
          <p className="text-lg font-bold text-blue-400">+{earnedWeek}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 transition-all"
        >
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Spent</p>
          <p className="text-lg font-bold text-red-400">-{spent}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
        >
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Net</p>
          <p className="text-lg font-bold text-purple-400">+{earnedWeek - spent}</p>
        </motion.div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-gray-400">Coins Earned vs Spent</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="day" 
                stroke="rgba(255,255,255,0.3)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 15, 24, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="earned" 
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ fill: "#a855f7", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="spent" 
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ fill: "#ec4899", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Link 
        href="/earn"
        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold transition-all hover:shadow-lg hover:shadow-purple-500/25"
      >
        <Plus className="w-5 h-5" />
        Earn More Coins
      </Link>
    </div>
  );
}
