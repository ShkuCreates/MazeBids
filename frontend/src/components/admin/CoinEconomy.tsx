"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, Plus, Minus, Settings, AlertTriangle } from "lucide-react";
import AnimatedCounter from "../AnimatedCounter";

export default function CoinEconomy() {
  const [economyData, setEconomyData] = useState({
    totalGenerated: 5420000,
    totalSpent: 3890000,
    inCirculation: 1530000,
    inflationRate: 2.3,
  });

  const [rewardSettings, setRewardSettings] = useState({
    dailyLimit: 500,
    gameReward: 50,
    adReward: 25,
    referralReward: 100,
  });

  const [manualAmount, setManualAmount] = useState("");
  const [manualUserId, setManualUserId] = useState("");

  const handleRewardChange = (key: string, value: string) => {
    setRewardSettings({ ...rewardSettings, [key]: parseInt(value) || 0 });
  };

  const handleManualAction = (type: "inject" | "remove") => {
    const amount = parseInt(manualAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const multiplier = type === "inject" ? 1 : -1;
    setEconomyData({
      ...economyData,
      totalGenerated: economyData.totalGenerated + (amount * multiplier),
      inCirculation: economyData.inCirculation + (amount * multiplier),
    });
    setManualAmount("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Coin Economy</h1>
        <p className="text-gray-500 mt-1">Manage platform coin circulation and rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Generated</p>
          <p className="text-2xl font-black text-white">
            <AnimatedCounter value={economyData.totalGenerated} />
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingDown className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Spent</p>
          <p className="text-2xl font-black text-white">
            <AnimatedCounter value={economyData.totalSpent} />
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">In Circulation</p>
          <p className="text-2xl font-black text-white">
            <AnimatedCounter value={economyData.inCirculation} />
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
        >
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Inflation Rate</p>
          <p className="text-2xl font-black text-white">{economyData.inflationRate}%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Reward Settings</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Daily Earning Limit (per user)
              </label>
              <input
                type="number"
                value={rewardSettings.dailyLimit}
                onChange={(e) => handleRewardChange("dailyLimit", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Game Reward (coins per game)
              </label>
              <input
                type="number"
                value={rewardSettings.gameReward}
                onChange={(e) => handleRewardChange("gameReward", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Ad Reward (coins per ad view)
              </label>
              <input
                type="number"
                value={rewardSettings.adReward}
                onChange={(e) => handleRewardChange("adReward", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Referral Reward (coins per referral)
              </label>
              <input
                type="number"
                value={rewardSettings.referralReward}
                onChange={(e) => handleRewardChange("referralReward", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>

            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all">
              Save Settings
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f18] border border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Coins className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Manual Coin Management</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                User ID (optional, leave empty for global)
              </label>
              <input
                type="text"
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                placeholder="Enter user ID..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Coin Amount
              </label>
              <input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleManualAction("inject")}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                Inject Coins
              </button>
              <button
                onClick={() => handleManualAction("remove")}
                className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
              >
                <Minus className="w-4 h-4" />
                Remove Coins
              </button>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-500 mb-1">Warning</p>
                  <p className="text-xs text-gray-400">
                    Manual coin adjustments affect the economy directly. Use with caution and keep records of all changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
