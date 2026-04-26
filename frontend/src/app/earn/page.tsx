"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { EarnProvider, useEarn } from "@/context/EarnContext";
import AdPlayer from "@/components/AdPlayer";
import VideoAdPlayer from "@/components/VideoAdPlayer";
import axios from "axios";
import { 
  Coins, Play, Clock, Target, Brain, Flame, Eye, Calendar, 
  TrendingUp, Gamepad2, Users, Ticket, Loader2, Bell, 
  ChevronRight, Sparkles, Activity, X
} from "lucide-react";
import ClickGame from "@/components/games/ClickGame";
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import EmojiHitGame from "@/components/games/EmojiHitGame";
import NumberRushGame from "@/components/games/NumberRushGame";
import ColorMatchGame from "@/components/games/ColorMatchGame";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { playCoinSound } from "@/lib/sounds";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EarningActivity {
  id: string;
  username: string;
  avatarUrl: string;
  action: string;
  coins: number;
  timeAgo: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface FloatingCoin {
  id: string;
  amount: number;
  x: number;
  y: number;
}

function SkeletonLoader({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />;
}

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
              toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

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

export default function EarnPageWrapper() {
  return (
    <EarnProvider>
      <EarnPage />
    </EarnProvider>
  );
}

function EarnPage() {
  const { user, refreshUser, updateCoins } = useAuth();
  const {
    state,
    claimDaily,
    updateBalance,
    addToTodayProgress,
    refreshState,
    animatedBalance,
    animatedToday,
  } = useEarn();

  const [activeGame, setActiveGame] = useState<{ id: string; reward: number; type: string } | null>(null);
  const [activeVideoAd, setActiveVideoAd] = useState<any | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [referralRedeemCode, setReferralRedeemCode] = useState("");
  const [redeemingReferral, setRedeemingReferral] = useState(false);
  const [referralRedeemMessage, setReferralRedeemMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdForm, setShowAdForm] = useState(false);
  const [adForm, setAdForm] = useState({
    title: "",
    thumbnailUrl: "",
    videoUrl: "",
    coinsPerUser: "",
    campaignDuration: "",
  });
  const [submittingAd, setSubmittingAd] = useState(false);
  const [watchAds, setWatchAds] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<EarningActivity[]>([]);
  const [hourlyTotal, setHourlyTotal] = useState(5000);
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [offerTimer, setOfferTimer] = useState("02:30:00");
  const [dailyCountdown, setDailyCountdown] = useState<string>("");

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
    });
  }, []);

  const addFloatingCoin = useCallback((amount: number, x: number, y: number) => {
    const id = `coin-${Date.now()}-${Math.random()}`;
    setFloatingCoins((prev) => [...prev, { id, amount, x, y }]);
    setTimeout(() => {
      setFloatingCoins((prev) => prev.filter((c) => c.id !== id));
    }, 1500);
  }, []);

  const handleClaimDaily = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    try {
      await claimDaily();
      triggerConfetti();
      playCoinSound();
      addFloatingCoin(state.getDailyReward(state.streak), x, y);
      showToast(`+${state.getDailyReward(state.streak)} coins claimed!`, "success");
    } catch (error) {
      showToast("Failed to claim. Already claimed today!", "error");
    }
  };

  const handleGameComplete = async (reward: number) => {
    updateCoins((user?.coins || 0) + reward);
    updateBalance(reward);
    addToTodayProgress(reward);
    triggerConfetti();
    playCoinSound();
    showToast(`+${reward} coins earned!`, "success");
    setActiveGame(null);
    refreshUser();
  };

  const handleAdComplete = async (reward: number) => {
    updateCoins((user?.coins || 0) + reward);
    updateBalance(reward);
    addToTodayProgress(reward);
    triggerConfetti();
    playCoinSound();
    showToast(`+${reward} coins earned!`, "success");
    setActiveGame(null);
    refreshUser();
  };

  useEffect(() => {
    setMounted(true);
    refreshState();
    const checkAdmin = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
        setIsAdmin(res.data?.role === "ADMIN" || false);
      } catch (err) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [refreshState]);

  useEffect(() => {
    const fetchWatchAds = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ads/placement/WATCH_ADS`);
        setWatchAds(res.data);
      } catch (err) {
        console.error("Failed to fetch watch ads:", err);
      }
    };
    fetchWatchAds();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const avatarStyles = ["adventurer", "avataaars", "bottts", "croodles", "fun-emoji", "icons", "lorelei", "micah", "miniavs", "open-peeps", "personas", "pixel-art"];
    const usernames = [
      "Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP",
      "PlayMaster99", "CoinHunter", "SpeedDemon", "LuckyStrike", "ProGamer",
      "NightOwl", "EarlyBird", "WinnerWinner", "JackpotKing", "CryptoQueen",
      "BitMaster", "TokenLord", "DogeLover", "MoonShot", "DiamondHands",
      "WhaleAlert", "TraderJoe", "StockMaster", "CryptoNinja", "BlockchainPro",
      "DeFiKing", "NFTCollector", "MetaverseGod", "Web3Wizard", "SmartContract",
      "SolanaSurfer", "EtherealBeing", "BinanceBoss", "CoinGeek", "TokenWhale",
      "CryptoAngel", "BitBoy", "ChainReaction", "HashRateHero", "MiningMaster",
      "StakingKing", "YieldFarmer", "LiquidityLord", "DexTrader", "CexGuru",
      "AirdropHunter", "BountySeeker", "TestnetTester", "MainnetMaster", "DevGuru",
      "Arjun_S", "PriyaM", "VikramX", "AnishaK", "RohanD",
      "TanviP", "KaranB", "MeghaR", "AditiBT", "SiddharthN",
      "ZephyrQ", "BlazeFX", "NovaStar", "OmegaX", "PhoenixRise",
      "DeltaForce", "GammaByte", "AlphaWolf", "BetaRush", "ThetaKing",
    ];
    const activities = [
      "completed Speed Clicker", "won Memory Match", "hit streak in Emoji Hit",
      "claimed daily bonus", "watched sponsored ad", "redeemed bonus code",
      "won auction bid", "claimed referral reward", "completed daily check-in",
      "hit top score in Speed Clicker", "matched all pairs in Memory Match",
      "earned streak bonus", "redeemed promo code", "completed challenge", "won jackpot reward",
    ];
    const coinAmounts = [25, 40, 50, 60, 75, 87, 100, 111, 125, 147, 150, 166, 174, 176, 200, 202, 250, 300, 400, 500];

    const generateEarning = (): EarningActivity => {
      const username = usernames[Math.floor(Math.random() * usernames.length)];
      const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
      const seed = Math.random().toString(36).substr(2, 8);
      return {
        id: `earning-${Date.now()}-${Math.random()}`,
        username,
        avatarUrl: `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`,
        action: activities[Math.floor(Math.random() * activities.length)],
        coins: coinAmounts[Math.floor(Math.random() * coinAmounts.length)],
        timeAgo: "just now",
      };
    };

    setEarnings(Array.from({ length: 6 }, () => generateEarning()));

    const scheduleNext = () => {
      const delay = 1000 + Math.random() * 1000;
      return setTimeout(() => {
        setEarnings((prev) => {
          const newEarning = generateEarning();
          setHourlyTotal((t) => t + newEarning.coins);
          return [newEarning, ...prev.slice(0, 8)];
        });
        intervalRef.current = scheduleNext();
      }, delay);
    };

    const intervalRef = { current: scheduleNext() };
    return () => clearTimeout(intervalRef.current);
  }, [mounted]);

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
        setOfferTimer(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || state.canClaimDaily) return;
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diff = nextMidnightUTC.getTime() - now.getTime();
      if (diff <= 0) {
        setDailyCountdown("00:00:00");
        refreshState();
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setDailyCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [mounted, state.canClaimDaily, refreshState]);

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
      setRedeemMessage({ text: res.data.message, type: "success" });
      setRedeemCode("");
      if (res.data.coins !== undefined && updateCoins) updateCoins(res.data.coins);
      triggerConfetti();
      showToast(`+${res.data.reward || 0} coins from code!`, "success");
      refreshUser();
    } catch (err: any) {
      setRedeemMessage({ text: err.response?.data?.message || "Failed to redeem code", type: "error" });
      showToast("Code redemption failed!", "error");
    } finally {
      setRedeeming(false);
    }
  };

  const handleReferralRedeem = async () => {
    if (!referralRedeemCode || redeemingReferral) return;
    setRedeemingReferral(true);
    setReferralRedeemMessage(null);
    try {
      const res = await axios.post(`${API_URL}/api/users/redeem-referral`, { code: referralRedeemCode }, { withCredentials: true });
      setReferralRedeemMessage({ text: res.data.message, type: "success" });
      setReferralRedeemCode("");
      if (res.data.coins !== undefined && updateCoins) updateCoins(res.data.coins);
      triggerConfetti();
      showToast(`Referral redeemed! +${res.data.reward || 0} coins!`, "success");
      refreshUser();
    } catch (err: any) {
      setReferralRedeemMessage({ text: err.response?.data?.message || "Failed to redeem referral code", type: "error" });
      showToast("Referral redemption failed!", "error");
    } finally {
      setRedeemingReferral(false);
    }
  };

  const handleAdFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title || !adForm.coinsPerUser || !adForm.campaignDuration) {
      showToast("Please fill all required fields", "error");
      return;
    }
    setSubmittingAd(true);
    try {
      await axios.post(
        `${API_URL}/api/ads`,
        {
          title: adForm.title,
          type: adForm.videoUrl ? "VIDEO" : "IMAGE",
          contentUrl: adForm.videoUrl || adForm.thumbnailUrl,
          targetUrl: adForm.thumbnailUrl || "https://mazebids.com",
          placement: "WATCH_ADS",
          position: "TOP",
          size: "MEDIUM",
          reward: parseInt(adForm.coinsPerUser),
          duration: parseInt(adForm.campaignDuration),
        },
        { withCredentials: true }
      );
      showToast("Ad campaign created successfully!", "success");
      setShowAdForm(false);
      setAdForm({ title: "", thumbnailUrl: "", videoUrl: "", coinsPerUser: "", campaignDuration: "" });
      // Refresh watch ads list
      const res = await axios.get(`${API_URL}/api/ads/placement/WATCH_ADS`);
      setWatchAds(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to create ad campaign", "error");
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleResetCoins = async () => {
    if (!confirm("WARNING: This will reset ALL your coins to 0. Are you sure?")) return;
    try {
      const res = await axios.post(`${API_URL}/api/users/admin/reset-my-coins`, {}, { withCredentials: true });
      if (res.data.success) {
        await refreshUser();
        refreshState();
        showToast("Coins reset to 0!", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to reset coins", "error");
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

  const tasks = [
    { id: "1", title: "Speed Clicker", reward: 50, type: "GAME", icon: Target, desc: "Click as fast as you can in 10 seconds!", color: "from-purple-500 to-indigo-600", thumbnail: "🎯" },
    { id: "2", title: "Memory Match", reward: 75, type: "GAME", icon: Brain, desc: "Find all matching pairs quickly.", color: "from-blue-500 to-cyan-600", thumbnail: "🧠" },
    { id: "3", title: "Emoji Hit", reward: 100, type: "GAME", icon: Flame, desc: "Hit as many emojis as you can!", color: "from-rose-500 to-pink-600", thumbnail: "🔥" },
    { id: "4", title: "Number Rush", reward: 65, type: "GAME", icon: TrendingUp, desc: "Tap numbers 1–9 in order as fast as you can!", color: "from-yellow-500 to-orange-500", thumbnail: "🔢" },
    { id: "5", title: "Color Match", reward: 85, type: "GAME", icon: Eye, desc: "Match the color shown before time runs out!", color: "from-teal-500 to-green-500", thumbnail: "🎨" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      <ToastContainer toasts={toasts} />
      <FloatingCoins coins={floatingCoins} />

      <div className="max-w-5xl mx-auto py-6 px-4 space-y-5">

        {/* ROW 1: Referral + Live Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Referral System — small left box */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-[#0f0f18] border border-purple-500/20 rounded-xl p-4 relative overflow-hidden h-full"
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
                {user?.referralCode && (
                  <div className="mb-3 p-2 bg-white/5 rounded-lg border border-purple-500/20">
                    <p className="text-[10px] text-gray-400 mb-1">Your Referral Code:</p>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono font-bold text-purple-300 tracking-wider">{user.referralCode}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(user.referralCode!); showToast("Referral code copied!", "success"); }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Enter friend's referral code..."
                        value={referralRedeemCode}
                        onChange={(e) => setReferralRedeemCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-lg px-3 py-2 text-xs font-mono tracking-widest outline-none transition-all placeholder:text-gray-600"
                      />
                      <button
                        onClick={handleReferralRedeem}
                        disabled={redeemingReferral || !referralRedeemCode}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-black text-xs transition-all flex items-center gap-1"
                      >
                        {redeemingReferral ? <Loader2 className="w-3 h-3 animate-spin" /> : "USE"}
                      </button>
                    </div>
                    {referralRedeemMessage && (
                      <p className={`text-[10px] font-bold mt-1 ${referralRedeemMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
                        {referralRedeemMessage.text}
                      </p>
                    )}
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
          {/* Live Earnings — wide right bar */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0f0f18] border border-white/10 rounded-xl p-5 relative overflow-hidden h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-sm tracking-wider uppercase">Live Earnings</h3>
                      <p className="text-gray-400 text-[10px]">Over {hourlyTotal.toLocaleString()} coins earned by users in the last hour</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                    <Clock className="w-3 h-3 text-red-400" />
                    <span className="text-[9px] text-red-400 font-mono">{offerTimer}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
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
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20 overflow-hidden">
                          <img src={earning.avatarUrl} alt={earning.username} className="w-full h-full object-cover" />
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
          </div>
        </div>

        {/* ROW 2: Games + Watch Ads */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Games Section */}
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
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Watch Ads Section */}
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-sm tracking-wider uppercase">Watch Ads</h3>
                      {isAdmin && (
                        <button
                          onClick={() => setShowAdForm(true)}
                          className="w-5 h-5 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-all"
                          title="Create Ad Campaign (Admin)"
                        >
                          <span className="text-white font-black text-xs leading-none">+</span>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-400 text-[10px]">Quick rewards</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span className="text-[9px] text-red-400 font-mono">{offerTimer}</span>
                </div>
              </div>

              {/* Limited Offer Banner */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Flame className="w-6 h-6 text-orange-400" />
                  <div>
                    <p className="text-white font-bold text-sm">Limited Offer</p>
                    <p className="text-orange-300 text-[10px]">Watch 3 videos → +100 bonus</p>
                  </div>
                </div>
              </div>

              {/* Ad Campaign List */}
              {isLoading ? (
                <div className="space-y-3">
                  <SkeletonLoader className="h-16 w-full" />
                  <SkeletonLoader className="h-16 w-full" />
                </div>
              ) : watchAds.length > 0 ? (
                <div className="space-y-3 flex-1">
                  {watchAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-green-500/30 rounded-xl transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/10 flex items-center justify-center">
                        {ad.targetUrl ? (
                          <img
                            src={ad.targetUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <Play className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{ad.title}</p>
                        <p className="text-gray-400 text-[10px]">{ad.duration || 15}s video</p>
                      </div>
                      {/* Coins */}
                      <div className="flex items-center gap-1 text-yellow-400 font-black text-sm shrink-0">
                        <Coins className="w-4 h-4" />+{ad.reward}
                      </div>
                      {/* Watch Button */}
                      <button
                        onClick={() => setActiveVideoAd(ad)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3 h-3" /> WATCH
                      </button>
                      {/* Delete Button — Admin Only */}
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete "${ad.title}"?`)) return;
                            try {
                              await axios.delete(`${API_URL}/api/ads/${ad.id}`, { withCredentials: true });
                              setWatchAds((prev) => prev.filter((a) => a.id !== ad.id));
                              showToast("Ad campaign deleted!", "success");
                            } catch (err: any) {
                              showToast(err.response?.data?.message || "Failed to delete ad", "error");
                            }
                          }}
                          className="p-2 bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-xl transition-all shrink-0"
                          title="Delete Campaign (Admin)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
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

        {/* ROW 3: Daily Check-In + Redeem Code */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Check-In — left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#0f0f18] border border-orange-500/20 rounded-xl p-4 relative overflow-hidden h-full"
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
                      <p className="text-orange-300 text-xs">
                        Day {state.streak}/7 • Next: +{getDailyReward(state.streak)} coins
                        {!state.canClaimDaily && dailyCountdown && (
                          <span className="ml-2 text-gray-400 font-mono">• Resets in {dailyCountdown}</span>
                        )}
                      </p>
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
                    {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : state.canClaimDaily ? `CLAIM +${getDailyReward(state.streak)}` : dailyCountdown ? dailyCountdown : "CLAIMED"}
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
          </div>
          {/* Redeem Code — right */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0f0f18] border border-purple-500/20 rounded-xl p-5 relative overflow-hidden h-full"
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
                  <p className={`text-center text-xs font-bold mt-3 ${redeemMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
                    {redeemMessage.text}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

      </div>

      {/* Game Modals */}
      {activeGame && activeGame.id === "1" && (
        <ClickGame taskId={activeGame.id} reward={activeGame.reward} onComplete={(r) => handleGameComplete(r)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.id === "2" && (
        <MemoryMatchGame taskId={activeGame.id} reward={activeGame.reward} onComplete={(r) => handleGameComplete(r)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.id === "3" && (
        <EmojiHitGame taskId={activeGame.id} reward={activeGame.reward} onComplete={(r) => handleGameComplete(r)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.id === "4" && activeGame.type === "GAME" && (
        <NumberRushGame taskId={activeGame.id} reward={65} onComplete={(r) => handleGameComplete(r)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.id === "5" && activeGame.type === "GAME" && (
        <ColorMatchGame taskId={activeGame.id} reward={85} onComplete={(r) => handleGameComplete(r)} onCancel={() => setActiveGame(null)} />
      )}
      {activeGame && activeGame.type === "AD" && (
        <AdPlayer taskId={activeGame.id} reward={activeGame.reward} onComplete={() => handleAdComplete(25)} onCancel={() => setActiveGame(null)} />
      )}
      {activeVideoAd && (
        <VideoAdPlayer
          ad={activeVideoAd}
          onComplete={(reward) => { handleAdComplete(reward); setActiveVideoAd(null); }}
          onCancel={() => setActiveVideoAd(null)}
        />
      )}

      {/* Ad Campaign Form (Admin Only) */}
      <AnimatePresence>
        {showAdForm && isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAdForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#1a1a24] border border-purple-500/30 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-white text-base">Create Ad Campaign</h4>
                <button onClick={() => setShowAdForm(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdFormSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Title *"
                  value={adForm.title}
                  onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-all"
                />
                <input
                  type="text"
                  placeholder="Thumbnail URL"
                  value={adForm.thumbnailUrl}
                  onChange={(e) => setAdForm({ ...adForm, thumbnailUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-all"
                />
                <input
                  type="text"
                  placeholder="Video URL (YouTube link)"
                  value={adForm.videoUrl}
                  onChange={(e) => setAdForm({ ...adForm, videoUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-all"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Coins per user *"
                    value={adForm.coinsPerUser}
                    onChange={(e) => setAdForm({ ...adForm, coinsPerUser: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Duration (seconds) *"
                    value={adForm.campaignDuration}
                    onChange={(e) => setAdForm({ ...adForm, campaignDuration: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdForm(false)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white font-black text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAd}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl text-white font-black text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {submittingAd ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Campaign"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}