"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, Plus, Minus, Settings, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import AnimatedCounter from "../AnimatedCounter";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EconomyStats {
  totalGenerated: number;
  totalSpent: number;
  inCirculation: number;
  totalTransactions: number;
  inflationRate: number;
  todayEarned: number;
  todaySpent: number;
  userCount: number;
  avgCoinsPerUser: number;
}

export default function CoinEconomy() {
  const [economyData, setEconomyData] = useState<EconomyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  const [rewardSettings, setRewardSettings] = useState({
    dailyLimit: 5000,
    gameReward: 50,
    adReward: 25,
    referralReward: 100,
  });

  const [manualAmount, setManualAmount] = useState("");
  const [manualUserId, setManualUserId] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  const fetchEconomyData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/economy`, {
        withCredentials: true
      });
      setEconomyData(res.data);
    } catch (err) {
      console.error("[Admin] Failed to fetch economy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEconomyData();
    
    // Setup socket.io connection for real-time reset events
    const newSocket = io(API_URL, { withCredentials: true });
    setSocket(newSocket);
    
    // Listen for economy-reset event from server
    newSocket.on('economy-reset', (data) => {
      console.log('[CoinEconomy] Economy reset detected:', data);
      // Force immediate refresh when reset is detected
      fetchEconomyData();
      alert(`⚠️ Economy Reset Alert: ${data.message}\nUsers affected: ${data.usersAffected}`);
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleRewardChange = (key: string, value: string) => {
    setRewardSettings({ ...rewardSettings, [key]: parseInt(value) || 0 });
  };

  const handleManualAction = async (type: "inject" | "remove") => {
    const amount = parseInt(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setManualLoading(true);
    try {
      const actualAmount = type === "inject" ? amount : -amount;
      
      if (manualUserId) {
        // Add/remove coins from specific user
        await axios.post(`${API_URL}/api/admin/users/${manualUserId}/coins`, {
          amount: actualAmount,
          reason: type === "inject" ? "Admin economy injection" : "Admin economy removal"
        }, {
          withCredentials: true
        });
      }
      
      await fetchEconomyData();
      setManualAmount("");
      setManualUserId("");
      alert(`Successfully ${type === "inject" ? "injected" : "removed"} ${amount} coins`);
    } catch (err) {
      console.error("[Admin] Manual action failed:", err);
      alert("Failed to process request");
    } finally {
      setManualLoading(false);
    }
  };

  // ECONOMY RESET FUNCTION - CRITICAL
  const handleEconomyReset = async () => {
    if (resetConfirm !== "RESET_ALL_COINS_CONFIRMED") {
      alert("Please type the confirmation phrase exactly: RESET_ALL_COINS_CONFIRMED");
      return;
    }

    setResetLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/economy/reset`, {
        confirmReset: "RESET_ALL_COINS_CONFIRMED"
      }, {
        withCredentials: true
      });

      // IMMEDIATELY update UI with fresh stats from response (zero delay)
      if (res.data.freshStats) {
        setEconomyData({
          totalGenerated: res.data.freshStats.totalEarned,
          totalSpent: res.data.freshStats.totalSpent,
          inCirculation: res.data.freshStats.inCirculation,
          totalTransactions: 0,
          inflationRate: 0,
          todayEarned: 0,
          todaySpent: 0,
          userCount: res.data.freshStats.userCount,
          avgCoinsPerUser: 0
        });
      }

      alert(`✅ ${res.data.message}\nUsers affected: ${res.data.usersAffected}\nTotal coins in circulation: ${res.data.freshStats?.inCirculation || 0}`);
      setShowResetModal(false);
      setResetConfirm("");
      
      // Force refresh after a short delay to ensure consistency
      setTimeout(() => {
        fetchEconomyData();
      }, 1000);
    } catch (err: any) {
      console.error("[Admin] Economy reset failed:", err);
      alert(err.response?.data?.message || "Failed to reset economy");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Coin Economy</h1>
          <p className="text-gray-500 mt-1">Manage platform coin circulation and rewards</p>
        </div>
        <button
          onClick={fetchEconomyData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
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
            <AnimatedCounter value={economyData?.totalGenerated || 0} />
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
            <AnimatedCounter value={economyData?.totalSpent || 0} />
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
            <AnimatedCounter value={economyData?.inCirculation || 0} />
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
          <p className="text-2xl font-black text-white">{economyData?.inflationRate?.toFixed(2) || 0}%</p>
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
                disabled={manualLoading}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
              >
                {manualLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Inject Coins
              </button>
              <button
                onClick={() => handleManualAction("remove")}
                disabled={manualLoading}
                className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
              >
                {manualLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
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

      {/* DANGER ZONE - Economy Reset */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold text-red-400">DANGER ZONE - Reset Economy</h3>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-500 mb-1">⚠️ EXTREME WARNING</p>
                <p className="text-xs text-gray-400">
                  This will RESET ALL USERS' COINS TO 0. This action is IRREVERSIBLE and will affect {economyData?.userCount || 0} users.
                  All coinsEarnedToday will also be reset to 0.
                </p>
              </div>
            </div>
          </div>

          {!showResetModal ? (
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
            >
              Initiate Economy Reset
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                To confirm, type: <span className="text-red-400 font-mono">RESET_ALL_COINS_CONFIRMED</span>
              </p>
              <input
                type="text"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="Type confirmation phrase..."
                className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 focus:border-red-500/50 outline-none transition-all text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirm("");
                  }}
                  className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEconomyReset}
                  disabled={resetLoading || resetConfirm !== "RESET_ALL_COINS_CONFIRMED"}
                  className="py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all"
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    "CONFIRM RESET"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
}
