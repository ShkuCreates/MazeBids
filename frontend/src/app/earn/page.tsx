"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { EarnProvider, useEarn } from "@/context/EarnContext";
import axios from "axios";
import { 
  Coins, Play, Clock, Target, Brain, Flame, Eye, Calendar, 
  TrendingUp, Gamepad2, Users, Ticket, Loader2, Bell, 
  ChevronRight, Sparkles, Activity 
} from "lucide-react";
import ClickGame from "@/components/games/ClickGame";
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import EmojiHitGame from "@/components/games/EmojiHitGame";
import AdPlayer from "@/components/AdPlayer";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EarningActivity {
  id: string;
  username: string;
  action: string;
  coins: number;
  timestamp: Date;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface FloatingCoin {
  id: string;
  amount: number;
  x: number;
  y: number;
}

// Skeleton Loader Component
function SkeletonLoader({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />;
}

// Toast Container Component
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`px-4 py-3 rounded-lg shadow-lg font-bold text-sm ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Floating Coin Animation Component
function FloatingCoins({ coins }: { coins: FloatingCoin[] }) {
  return (
    <>
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -80, scale: 0.5 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="fixed z-50 pointer-events-none"
          style={{ left: coin.x, top: coin.y }}
        >
          <div className="flex items-center gap-1 bg-yellow-500 text-black px-3 py-1.5 rounded-full font-black text-sm shadow-lg">
            <Coins className="w-4 h-4" />
            +{coin.amount}
          </div>
        </motion.div>
      ))}
    </>
  );
}

// Wrapper to provide EarnContext
export default function EarnPageWrapper() {
  return (
    <EarnProvider>
      <EarnPage />
    </EarnProvider>
  );
}

function EarnPage() {
  const { user, refreshUser } = useAuth();
  const { 
    state, 
    claimDaily, 
    updateBalance, 
    addToTodayProgress, 
    refreshState,
    animatedBalance,
    animatedToday 
  } = useEarn();
  
  const [activeGame, setActiveGame] = useState<{ id: string, reward: number, type: string } | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Live Earnings Feed State
  const [earnings, setEarnings] = useState<EarningActivity[]>([]);
  const [hourlyTotal, setHourlyTotal] = useState(5000);
  
  // Floating coins animation
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  
  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Limited Offer Timer
  const [offerTimer, setOfferTimer] = useState("02:30:00");

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Trigger confetti explosion
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    });
  }, []);

  // Add floating coin animation
  const addFloatingCoin = useCallback((amount: number, x: number, y: number) => {
    const id = `coin-${Date.now()}-${Math.random()}`;
    setFloatingCoins(prev => [...prev, { id, amount, x, y }]);
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(c => c.id !== id));
    }, 1500);
  }, []);

  // Handle daily claim with effects
  const handleClaimDaily = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    try {
      await claimDaily();
      triggerConfetti();
      addFloatingCoin(state.getDailyReward(state.streak), x, y);
      showToast(`+${state.getDailyReward(state.streak)} coins claimed!`, 'success');
    } catch (error) {
      showToast('Failed to claim. Already claimed today!', 'error');
    }
  };

  // Handle game completion
  const handleGameComplete = (reward: number) => {
    updateBalance(reward);
    addToTodayProgress(reward);
    triggerConfetti();
    showToast(`+${reward} coins earned!`, 'success');
    setActiveGame(null);
  };

  // Handle ad completion
  const handleAdComplete = (reward: number) => {
    updateBalance(reward);
    addToTodayProgress(reward);
    triggerConfetti();
    showToast(`+${reward} coins earned!`, 'success');
    setActiveGame(null);
  };

  useEffect(() => {
    setMounted(true);
    refreshState();
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [refreshState]);

  // Live earnings feed generator (simulated)
  useEffect(() => {
    if (!mounted) return;
    const usernames = ["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"];
    const activities = ["earned 250 coins from Speed Clicker", "watched video +40 coins", "redeemed code +100 coins", "completed daily bonus +50 coins"];

    const generateEarning = (): EarningActivity => {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const coinsMatch = activity.match(/\d+/);
      const coins = coinsMatch ? parseInt(coinsMatch[0]) : 50;
      return {
        id: `earning-${Date.now()}-${Math.random()}`,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        action: activity,
        coins,
        timestamp: new Date(),
      };
    };

    setEarnings(Array.from({ length: 5 }, () => generateEarning()));

    const interval = setInterval(() => {
      setEarnings((prev) => {
        const newEarning = generateEarning();
        setHourlyTotal(prev => prev + newEarning.coins);
        return [newEarning, ...prev.slice(0, 8)];
      });
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Limited offer timer
  useEffect(() => {
    if (!mounted) return;
    const endTime = new Date(Date.now() + 2.5 * 60 * 60 * 1000);
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = endTime.getTime() - now;
      if (diff <= 0) {
        setOfferTimer("00:00:00");
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setOfferTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  const handleGameClick = (task: any) => {
    setActiveGame({ id: task.id, reward: task.reward, type: task.type });
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      const res = await axios.post(`${API_URL}/api/users/redeem-code`, { code: redeemCode }, { withCredentials: true });
      setRedeemMessage({ text: res.data.message, type: 'success' });
      setRedeemCode("");
      if (res.data.reward) {
        updateBalance(res.data.reward);
        addToTodayProgress(res.data.reward);
        triggerConfetti();
        showToast(`+${res.data.reward} coins from code!`, 'success');
      }
      refreshUser();
    } catch (err: any) {
      setRedeemMessage({ text: err.response?.data?.message || "Failed to redeem code", type: 'error' });
      showToast('Code redemption failed!', 'error');
    } finally {
      setRedeeming(false);
    }
  };

  // Secret admin: Reset coins to 0
  const handleResetCoins = async () => {
    if (!confirm('WARNING: This will reset ALL your coins to 0. Are you sure?')) return;
    try {
      const res = await axios.post(`${API_URL}/api/users/admin/reset-my-coins`, {}, { withCredentials: true });
      if (res.data.success) {
        // Force refresh all contexts
        await refreshUser();
        refreshState();
        showToast('Coins reset to 0!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reset coins', 'error');
    }
  };

  const getTimeAgo = (timestamp: Date): string => {
    if (!mounted) return "Loading...";
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 120) return "1 min ago";
    return `${Math.floor(seconds / 60)} min ago`;
  };

  const getDailyReward = (day: number): number => {
    const rewards = [50, 75, 100, 125, 150, 175, 500];
    return rewards[Math.min(day - 1, 6)] || 50;
  };

  const progress = Math.min((animatedToday / state.dailyGoal) * 100, 100);

  const tasks = [
    { id: "1", title: "Speed Clicker", reward: 50, type: "GAME", icon: Target, desc: "Click as fast as you can in 10 seconds!", color: "from-purple-500 to-indigo-600", thumbnail: "🎯" },
    { id: "2", title: "Memory Match", reward: 75, type: "GAME", icon: Brain, desc: "Find all matching pairs quickly.", color: "from-blue-500 to-cyan-600", thumbnail: "🧠" },
    { id: "3", title: "Emoji Hit", reward: 100, type: "GAME", icon: Flame, desc: "Hit as many emojis as you can!", color: "from-rose-500 to-pink-600", thumbnail: "🔥" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
      
      {/* Floating Coin Animations */}
      <FloatingCoins coins={floatingCoins} />

      <div className="max-w-5xl mx-auto py-6 px-4 space-y-5">
        
        {/* SECTION 1: Top Compact Row - Today Progress + Referral System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's Progress */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f18] border border-white/10 rounded-xl p-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs tracking-wider uppercase">Today's Progress</h3>
                    <p className="text-gray-400 text-[10px]">{animatedToday.toLocaleString()} / {state.dailyGoal.toLocaleString()} coins</p>
                  </div>
                </div>
                <span className="text-purple-300 text-xs font-black">{Math.round(progress)}%</span>
              </div>
              <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Referral System */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#0f0f18] border border-purple-500/20 rounded-xl p-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs tracking-wider uppercase">Referral System</h3>
                    <p className="text-purple-300 text-[10px]">{state.referralsInvited}/{state.referralsGoal} invites</p>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400 font-black">+500 bonus</span>
              </div>
              
              {/* Display User's Referral Code */}
              {user?.referralCode && (
                <div className="mb-3 p-2 bg-white/5 rounded-lg border border-purple-500/20">
                  <p className="text-[10px] text-gray-400 mb-1">Your Referral Code:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono font-bold text-purple-300 tracking-wider">{user.referralCode}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(user.referralCode!);
                        showToast('Referral code copied!', 'success');
                      }}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(state.referralsInvited / state.referralsGoal) * 100}%` }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECTION 2: Priority Large - Games (60%) + Watch Ads (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Games Section - 60% Width */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-[#0f0f18] border border-white/10 rounded-xl p-5 relative overflow-hidden min-h-[320px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
                    <Gamepad2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm tracking-wider uppercase">Play Games</h3>
                    <p className="text-gray-400 text-[10px]">High engagement, instant rewards</p>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>

              {isLoading ? (
                <div className="space-y-3 flex-1">
                  <SkeletonLoader className="h-16 w-full" />
                  <SkeletonLoader className="h-16 w-full" />
                  <SkeletonLoader className="h-16 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 flex-1">
                  {tasks.map((task) => (
                    <motion.button
                      key={task.id}
                      onClick={() => handleGameClick(task)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/30 rounded-xl transition-all text-left group"
                    >
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${task.color} flex items-center justify-center text-2xl shadow-lg group-hover:shadow-purple-500/20 transition-shadow`}>
                        {task.thumbnail}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{task.title}</h4>
                        <p className="text-gray-400 text-[11px] truncate">{task.desc}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm font-black">+{task.reward}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Watch Ads Section - 40% Width */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-[#0f0f18] border border-white/10 rounded-xl p-5 relative overflow-hidden min-h-[320px] flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 pointer-events-none" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20">
                    <Play className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm tracking-wider uppercase">Watch Ads</h3>
                    <p className="text-gray-400 text-[10px]">Quick rewards</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span className="text-[9px] text-red-400 font-mono">{offerTimer}</span>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3 flex-1">
                  <SkeletonLoader className="h-20 w-full" />
                  <SkeletonLoader className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Flame className="w-6 h-6 text-orange-400" />
                      <div>
                        <p className="text-white font-bold text-sm">Limited Offer</p>
                        <p className="text-orange-300 text-[10px]">Watch 3 videos → +100 bonus</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1" />

                  <motion.button
                    onClick={() => setActiveGame({ id: "4", reward: 25, type: "AD" })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all shadow-lg shadow-green-500/20"
                  >
                    <Play className="w-6 h-6 text-white" />
                    <span className="text-white font-black text-base">WATCH VIDEO</span>
                    <div className="flex items-center gap-1 text-yellow-200 ml-2">
                      <Coins className="w-5 h-5" />
                      <span className="text-base font-bold">+25</span>
                    </div>
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* SECTION 3: Redeem Code - Medium Centered */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg mx-auto bg-[#0f0f18] border border-purple-500/20 rounded-xl p-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Ticket className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-black text-white text-sm tracking-wider uppercase">Redeem Code</h3>
            </div>
            
            <form onSubmit={handleRedeem} className="flex gap-2">
              <input
                type="text"
                placeholder="ENTER CODE..."
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-3 text-center font-black tracking-widest outline-none transition-all placeholder:text-gray-600 text-sm"
              />
              <button
                disabled={redeeming || !redeemCode}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm transition-all flex items-center gap-2"
              >
                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "REDEEM"}
              </button>
            </form>
            
            {redeemMessage && (
              <p className={`text-center text-xs font-bold mt-3 ${redeemMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {redeemMessage.text}
              </p>
            )}
          </div>
        </motion.div>

        {/* SECTION 4: Live Earnings - Full Width with Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#0f0f18] border border-white/10 rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-sm tracking-wider">Live Earnings</h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-red-400 uppercase">LIVE</span>
                  </div>
                </div>
                <p className="text-[10px] text-green-400 font-bold">Over {hourlyTotal.toLocaleString()} coins earned by users in the last hour</p>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {earnings.slice(0, 6).map((earning) => (
                  <motion.div
                    key={earning.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/20 rounded-xl transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                      <span className="text-sm font-black text-purple-300">{earning.username.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">
                        <span className="font-bold text-white">{earning.username}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{earning.action}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 shrink-0">
                      <Coins className="w-3.5 h-3.5" />
                      <span className="text-xs font-black">+{earning.coins}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Daily Check-In Card - Compact below */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0f0f18] border border-orange-500/20 rounded-xl p-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Daily Check-In</h3>
                  <p className="text-orange-300 text-xs">Day {state.streak}/7 • Next: +{getDailyReward(state.streak)} coins</p>
                </div>
              </div>
              
              <button
                onClick={handleClaimDaily}
                disabled={!state.canClaimDaily || state.isLoading}
                className={`px-6 py-3 rounded-xl font-black text-sm tracking-wider transition-all ${
                  state.canClaimDaily
                    ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                }`}
              >
                {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : state.canClaimDaily ? `CLAIM +${getDailyReward(state.streak)}` : "CLAIMED"}
              </button>
            </div>

            <div className="flex gap-1 mt-4">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isCompleted = day < state.streak || (day === state.streak && !state.canClaimDaily);
                const isCurrentClaimable = day === state.streak && state.canClaimDaily;
                return (
                  <div
                    key={day}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      isCompleted ? "bg-green-500" : isCurrentClaimable ? "bg-orange-500 animate-pulse" : "bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Secret Admin: Reset Coins Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleResetCoins}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition-all"
          >
            🚨 RESET MY COINS TO 0 (ADMIN)
          </button>
        </div>

      </div>

      {/* Game Modals */}
      {activeGame && activeGame.id === "1" && (
        <ClickGame taskId={activeGame.id} reward={activeGame.reward} onComplete={() => handleGameComplete(50)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.id === "2" && (
        <MemoryMatchGame taskId={activeGame.id} reward={activeGame.reward} onComplete={() => handleGameComplete(75)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.id === "3" && (
        <EmojiHitGame taskId={activeGame.id} reward={activeGame.reward} onComplete={() => handleGameComplete(100)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.type === "AD" && (
        <AdPlayer taskId={activeGame.id} reward={activeGame.reward} onComplete={() => handleAdComplete(25)} onCancel={() => setActiveGame(null)} />
      )}
    </div>
  );
}
