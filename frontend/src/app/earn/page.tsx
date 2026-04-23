"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Coins, Play, Clock, CheckCircle, AlertCircle, Target, Brain, Flame, Eye, Calendar, TrendingUp, Gamepad2, Users, Trophy, Star, Ticket, Loader2, Bell } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import ClickGame from "@/components/games/ClickGame";
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import EmojiHitGame from "@/components/games/EmojiHitGame";
import AdPlayer from "@/components/AdPlayer";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EarningActivity {
  id: string;
  username: string;
  action: string;
  coins: number;
  timestamp: Date;
}

interface Popup {
  id: string;
  icon: React.ReactNode;
  message: string;
}

export default function EarnPage() {
  const { user, refreshUser } = useAuth();
  const [activeGame, setActiveGame] = useState<{ id: string, reward: number, type: string } | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [redeemRefCode, setRedeemRefCode] = useState("");
  const [mounted, setMounted] = useState(false);

  // Daily Streak State
  const [streak, setStreak] = useState(3);
  const [canClaimDaily, setCanClaimDaily] = useState(true);
  const [dailyReward, setDailyReward] = useState(100);

  // Earning Progress State
  const [todayEarned, setTodayEarned] = useState(2750);
  const [dailyGoal] = useState(5000);

  // Limited Offer Timer
  const [offerTimer, setOfferTimer] = useState("02:30:00");

  // Live Earnings Feed State
  const [earnings, setEarnings] = useState<EarningActivity[]>([]);

  // Live Popups State
  const [popups, setPopups] = useState<Popup[]>([]);

  // Referral Progress
  const [referralsInvited, setReferralsInvited] = useState(3);
  const [referralsGoal] = useState(5);

  // Leaderboard State
  const [leaderboard] = useState([
    { username: "CryptoKing", coins: 5200, rank: 1 },
    { username: "SnehaX", coins: 4800, rank: 2 },
    { username: "Rahul_23", coins: 4100, rank: 3 },
    { username: "AryanLive", coins: 3800, rank: 4 },
    { username: "NehaOP", coins: 3200, rank: 5 },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      refreshUser();
    } catch (err: any) {
      setRedeemMessage({ text: err.response?.data?.message || "Failed to redeem code", type: 'error' });
    } finally {
      setRedeeming(false);
    }
  };

  const tasks = [
    {
      id: "1",
      title: "Speed Clicker",
      reward: 0,
      type: "GAME",
      icon: Target,
      desc: "Click as many times as you can in 10 seconds!",
      color: "from-purple-500 to-indigo-600",
      tag: "🔥 Popular",
      highScore: "Score 1000 → +200 coins"
    },
    {
      id: "2",
      title: "Memory Match",
      reward: 0,
      type: "GAME",
      icon: Brain,
      desc: "Find all pairs in the shortest time.",
      color: "from-blue-500 to-cyan-600",
      tag: "⚡ Fast Earn",
      highScore: "Score 500 → +150 coins"
    },
    {
      id: "3",
      title: "Emoji Hit",
      reward: 0,
      type: "GAME",
      icon: Target,
      desc: "Hit as many emojis as you can!",
      color: "from-rose-500 to-pink-600",
      tag: "💎 High Reward",
      highScore: "Score 800 → +250 coins"
    },
    {
      id: "4",
      title: "Watch Ad",
      reward: 25,
      type: "AD",
      icon: Play,
      desc: "Support us by watching a short video.",
      color: "from-green-500 to-emerald-600",
      tag: "⚡ Quick",
      highScore: null
    }
  ];

  const handleRedeemReferral = async () => {
    if (!redeemRefCode) return;
    setRedeeming(true);
    try {
      const res = await axios.post(`${API_URL}/api/users/redeem-referral`, { code: redeemRefCode }, { withCredentials: true });
      alert(res.data.message);
      setRedeemRefCode("");
      refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to redeem code");
    } finally {
      setRedeeming(false);
    }
  };

  const handleClaimDaily = () => {
    if (!canClaimDaily) return;
    setStreak((prev) => prev + 1);
    setCanClaimDaily(false);
    setTodayEarned((prev) => prev + dailyReward);
    refreshUser();
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
    return rewards[day - 1] || 50;
  };

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

  // Live earnings feed generator
  useEffect(() => {
    if (!mounted) return;
    const usernames = ["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"];
    const activities = ["earned 250 coins from game", "watched video +40 coins", "redeemed code +100 coins", "completed daily bonus +50 coins"];

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
        return [newEarning, ...prev.slice(0, 6)];
      });
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Live popups generator
  useEffect(() => {
    if (!mounted) return;
    const messages = [
      { icon: <Coins className="w-4 h-4 text-yellow-400" />, template: () => `💰 ${(Math.floor(Math.random() * 4500) + 500).toLocaleString()} coins just earned` },
      { icon: <Flame className="w-4 h-4 text-orange-400" />, template: () => `🔥 ${["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"][Math.floor(Math.random() * 5)]} completed a task` },
      { icon: <Eye className="w-4 h-4 text-blue-400" />, template: () => `👀 ${Math.floor(Math.random() * 200) + 50} users earning now` },
    ];

    const addPopup = () => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const newPopup = { id: `popup-${Date.now()}-${Math.random()}`, icon: msg.icon, message: msg.template() };
      setPopups((prev) => [newPopup, ...prev.slice(0, 1)]);
    };

    addPopup();
    const interval = setInterval(addPopup, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Live Popups */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {popups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-[#0f0f18]/95 backdrop-blur-md border border-purple-500/30 rounded-2xl px-4 py-3 shadow-2xl shadow-purple-500/20 flex items-center gap-3 pointer-events-auto"
            >
              {popup.icon}
              <span className="text-white text-xs font-bold">{popup.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-6xl mx-auto space-y-6 py-8 px-4 relative">
        {/* SECTION 1: TOP PRIORITY (FOCUS AREA) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Check-in Bonus (Horizontal) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f18] border border-purple-500/30 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-sm tracking-wider">DAILY CHECK-IN</h2>
                    <p className="text-purple-300 text-[10px] font-medium">Day {streak}/7</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-yellow-300 text-[9px] font-black uppercase tracking-widest">🔥 {streak} Day</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-3">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${
                      day < streak
                        ? "bg-green-500/20 border-green-500/30"
                        : day === streak
                        ? "bg-purple-500/20 border-purple-500/30 ring-1 ring-purple-500"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className="text-[8px] font-black text-gray-400">{day}</span>
                    <span className="text-[9px] font-bold text-white">+{getDailyReward(day)}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleClaimDaily}
                disabled={!canClaimDaily}
                className={`w-full py-3 rounded-xl font-black text-xs tracking-wider transition-all ${
                  canClaimDaily
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canClaimDaily ? `CLAIM +${dailyReward} COINS` : "CLAIMED"}
              </button>
            </div>
          </motion.div>

          {/* Today's Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#0f0f18] border border-white/10 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm tracking-wider">TODAY'S PROGRESS</h3>
                    <p className="text-gray-400 text-[10px]">{todayEarned.toLocaleString()} / {dailyGoal.toLocaleString()} coins</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <span className="text-purple-300 text-[9px] font-black uppercase tracking-widest">{Math.round((todayEarned / dailyGoal) * 100)}%</span>
                </div>
              </div>

              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${(todayEarned / dailyGoal) * 100}%` }} />
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Secondary Actions (smaller cards) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">⚡ Bonus</span>
            </div>

            {/* Referral Boost */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#0f0f18] border border-white/10 rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-white">Referral Boost</h3>
                    <p className="text-gray-400 text-xs">🔥 Best Method</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Progress</span>
                    <span className="text-purple-400 text-[10px] font-black">{referralsInvited} / {referralsGoal}</span>
                  </div>
                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(referralsInvited / referralsGoal) * 100}%` }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
                <div className="space-y-1 text-[10px]">
                  <p className="text-gray-400">• Invite 5 → +500 BONUS</p>
                  <p className="text-gray-400">• Invite 10 → VIP unlock</p>
                </div>
              </div>
            </motion.div>

            {/* Limited Offer */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-600/10 to-red-600/10 border border-orange-500/30 rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-white">Limited Offer</h3>
                      <p className="text-orange-300 text-[10px]">Watch 3 videos → +100</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-400" />
                    <span className="text-red-300 text-[9px] font-black font-mono">{offerTimer}</span>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-xs tracking-wider transition-all">
                  START OFFER
                </button>
              </div>
            </motion.div>

            {/* Bonus Code */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#0f0f18] border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 blur-xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Ticket className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm">Redeem Code</h3>
                    <p className="text-gray-400 text-[10px]">Extra Coins</p>
                  </div>
                </div>
                <form onSubmit={handleRedeem} className="space-y-2">
                  <input
                    type="text"
                    placeholder="ENTER CODE..."
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl p-2.5 text-center font-black tracking-widest outline-none transition-all placeholder:text-gray-700 text-xs"
                  />
                  <button
                    disabled={redeeming || !redeemCode}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {redeeming ? <Loader2 className="w-3 h-3 animate-spin" /> : "REDEEM NOW"}
                  </button>
                </form>
                {redeemMessage && (
                  <p className={`text-center text-[10px] font-bold ${redeemMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {redeemMessage.text}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* SECTION 3: LIVE & SOCIAL PROOF */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Live Earnings Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0f0f18] border border-white/10 rounded-2xl overflow-hidden h-[320px] flex flex-col"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                  <Bell className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm tracking-wider">LIVE EARNINGS</h3>
                  <p className="text-[10px] text-gray-500">Real-time activity</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">LIVE</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
              <AnimatePresence mode="popLayout">
                {earnings.map((earning) => (
                  <motion.div
                    key={earning.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 border-b border-white/5 hover:bg-white/[0.02] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                        <span className="text-[10px] font-black text-purple-300">{earning.username.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300">
                          <span className="font-bold text-white">{earning.username}</span>
                          <span className="text-gray-500"> {earning.action}</span>
                        </p>
                        <p className="text-[9px] text-gray-500">{getTimeAgo(earning.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Coins className="w-3 h-3" />
                        <span className="text-[10px] font-black">+{earning.coins}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Top Earners Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#0f0f18] border border-white/10 rounded-2xl overflow-hidden h-[320px] flex flex-col"
          >
            <div className="p-4 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/20">
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm tracking-wider">TOP EARNERS</h3>
                <p className="text-[10px] text-gray-500">Today's leaderboard</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent p-4 space-y-2">
              {leaderboard.map((user, index) => (
                <motion.div
                  key={user.username}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    index === 0
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : index === 1
                      ? "bg-gray-500/10 border-gray-500/30"
                      : index === 2
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs ${
                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-500" : "bg-white/10"
                  }`}>
                    {user.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-xs">{user.username}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-3 h-3" />
                    <span className="text-[10px] font-black">{user.coins.toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* SECTION 4: HELPER / GUIDE (BOTTOM) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0f0f18] border border-white/10 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-black text-white text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Best Way to Earn
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">Watch Videos</p>
                  <p className="text-gray-400 text-[9px]">Quick coins</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">Play Games</p>
                  <p className="text-gray-400 text-[9px]">Medium reward</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">Referrals</p>
                  <p className="text-gray-400 text-[9px]">High reward</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Game Modals */}
        {activeGame && activeGame.id === "1" && (
          <ClickGame
            taskId={activeGame.id}
            reward={activeGame.reward}
            onComplete={() => setActiveGame(null)}
            onCancel={() => setActiveGame(null)}
          />
        )}

        {activeGame && activeGame.id === "2" && (
          <MemoryMatchGame
            taskId={activeGame.id}
            reward={activeGame.reward}
            onComplete={() => setActiveGame(null)}
            onCancel={() => setActiveGame(null)}
          />
        )}

        {activeGame && activeGame.id === "3" && (
          <EmojiHitGame
            taskId={activeGame.id}
            reward={activeGame.reward}
            onComplete={() => setActiveGame(null)}
            onCancel={() => setActiveGame(null)}
          />
        )}

        {activeGame && activeGame.type === "AD" && (
          <AdPlayer
            taskId={activeGame.id}
            reward={activeGame.reward}
            onComplete={() => setActiveGame(null)}
            onCancel={() => setActiveGame(null)}
          />
        )}
      </div>
    </div>
  );
}
