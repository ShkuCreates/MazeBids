"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Plus, ArrowUpRight, ArrowDownRight, History, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

export default function WalletCoinsPanel() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5000);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const coinBalance = user?.coins ?? 0;

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/api/users/transactions?limit=3`, {
        withCredentials: true,
      });
      setTransactions(res.data.transactions);
      setDailyUsed(res.data.dailyEarned);
      setDailyLimit(res.data.dailyLimit);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  }, [user]);

  const refreshBalance = useCallback(async () => {
    if (!mounted || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshUser();
      await fetchTransactions();
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [mounted, isRefreshing, refreshUser, fetchTransactions]);

  useEffect(() => {
    if (!mounted) return;
    fetchTransactions();
  }, [mounted, fetchTransactions]);

  useEffect(() => {
    if (!mounted) return;
    // Refresh balance every 30 seconds to stay in sync with backend
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);
    return () => clearInterval(interval);
  }, [mounted, refreshBalance]);

  const handleAddCoins = useCallback(() => {
    router.push("/earn");
  }, [router]);

  const dailyPercent = Math.min((dailyUsed / dailyLimit) * 100, 100);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-purple-500/20 shadow-2xl shadow-purple-500/10"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-blue-600/30" />
        <div className="absolute inset-0 bg-[#0f0f18]/60" />

        {/* Animated glow orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex items-center justify-center border border-yellow-400/20">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm tracking-wider uppercase">Coin Wallet</h3>
                <p className="text-[10px] text-gray-400 font-medium">Available Balance</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Coins</span>
            </div>
          </div>

          {/* Balance display */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {coinBalance.toLocaleString()}
              </span>
              <Coins className="w-6 h-6 text-yellow-400 shrink-0" />
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              Total Earned: <span className="text-green-400 font-bold">{user?.totalEarned?.toLocaleString() ?? 0}</span>
              {" · "}
              Total Spent: <span className="text-red-400 font-bold">{user?.totalSpent?.toLocaleString() ?? 0}</span>
            </p>
          </div>

          {/* Daily usage progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coins Used Today</span>
              <span className="text-[10px] font-black text-purple-300">{dailyUsed} / {dailyLimit}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dailyPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddCoins}
              disabled={isRefreshing}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-sm transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Plus className="w-4 h-4" />
              Add Coins
            </button>
            <Link
              href="/profile"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-purple-500/30 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <History className="w-4 h-4" />
              Transactions
            </Link>
          </div>

          {/* Recent Transactions */}
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Recent Activity</p>
            <div className="space-y-2">
              <AnimatePresence>
                {transactions.map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-purple-500/20 transition-all duration-200 group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      txn.type === "EARN"
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}>
                      {txn.type === "EARN" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-medium truncate group-hover:text-white transition-colors">
                        {txn.description}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {mounted && Math.floor((Date.now() - new Date(txn.timestamp).getTime()) / 60000)}m ago
                      </p>
                    </div>
                    <span className={`text-sm font-black ${
                      txn.type === "EARN" ? "text-green-400" : "text-red-400"
                    }`}>
                      {txn.type === "EARN" ? "+" : "-"}{txn.amount}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Coins Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0f0f18] border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/10 relative overflow-hidden"
            >
              {/* Modal glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                    <Coins className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Add Coins</h2>
                    <p className="text-xs text-gray-400">Choose a method to earn more coins</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <Link
                    href="/earn"
                    onClick={() => setShowAddModal(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.08] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">Earn Coins</p>
                      <p className="text-[10px] text-gray-500">Watch ads, complete tasks & quizzes</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  </Link>

                  <button
                    onClick={() => {
                      alert("Payment integration coming soon!");
                      setShowAddModal(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.08] transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">Purchase Coins</p>
                      <p className="text-[10px] text-gray-500">Buy coins directly (coming soon)</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  </button>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
