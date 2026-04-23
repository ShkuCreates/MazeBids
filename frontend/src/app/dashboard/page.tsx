"use client";
import { useAuth } from "@/context/AuthContext";
import {
  Gavel,
  TrendingUp,
  Award,
  Users,
  Globe,
  Trophy,
  Video,
  Coins,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState, useMemo, useCallback } from "react";
import AdBanner from "@/components/AdBanner";
import LiveActivityFeed from "@/components/LiveActivityFeed";
import WalletCoinsPanel from "@/components/WalletCoinsPanel";
import ActiveAuctionsPanel from "@/components/ActiveAuctionsPanel";
import UpcomingAuctionsPanel from "@/components/UpcomingAuctionsPanel";
import { Skeleton, CardSkeleton } from "@/components/Skeleton";
import { cache } from "@/lib/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const { user, loading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [siteStats, setSiteStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({
    totalUsers: 0,
    auctionsCompleted: 0,
    coinsSpent: 0,
    activeUsers: 0,
  });

  const targetStats = useMemo(() => ({
    totalUsers: 12842,
    auctionsCompleted: 3291,
    coinsSpent: 2400000,
    activeUsers: 1203,
  }), []);

  const fetchData = useCallback(async () => {
    try {
      const cacheKey = `dashboard-${user?.id}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        setProfile(cached.profile);
        setSiteStats(cached.siteStats);
        setDataLoading(false);
        return;
      }

      const [profileRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/profile`, { withCredentials: true }),
        axios.get(`${API_URL}/api/users/site-stats`),
      ]);
      
      const data = { profile: profileRes.data, siteStats: statsRes.data };
      cache.set(cacheKey, data, 30000);
      
      setProfile(data.profile);
      setSiteStats(data.siteStats);
      setDataLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setDataLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (!user) return;
    
    const checkAuctionWin = async () => {
      try {
        const profileRes = await axios.get(`${API_URL}/api/users/profile`, { withCredentials: true });
        if (profile && profileRes.data.totalSpent > profile.totalSpent) {
          refreshUser();
          setProfile(profileRes.data);
        }
      } catch (err) {
        console.error("Failed to check auction win:", err);
      }
    };

    const interval = setInterval(checkAuctionWin, 15000);
    return () => clearInterval(interval);
  }, [user, profile, refreshUser]);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        totalUsers: Math.floor(targetStats.totalUsers * easeOut),
        auctionsCompleted: Math.floor(targetStats.auctionsCompleted * easeOut),
        coinsSpent: Math.floor(targetStats.coinsSpent * easeOut),
        activeUsers: Math.floor(targetStats.activeUsers * easeOut),
      });

      if (step >= steps) {
        clearInterval(interval);
        setAnimatedStats(targetStats);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [targetStats]);

  if (loading) return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4"><CardSkeleton /></div>
          <div className="lg:col-span-8"><CardSkeleton /></div>
        </div>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className="py-20 text-center space-y-6">
      <h1 className="text-4xl font-black">Please login to view your dashboard</h1>
      <Link href="/" className="inline-block px-8 py-4 bg-purple-600 rounded-2xl font-bold">Back Home</Link>
    </div>
  );

  return (
    <div className="space-y-10 py-8">
      {/* Ad Banner */}
      <AdBanner placement="DASHBOARD" />

      {/* ═══ TIER 1 — HIGHEST PRIORITY ═══
          Wallet + Active Auctions — large, glowing, action-driven */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wallet Card — prominent, 4 cols */}
        <div className="lg:col-span-4">
          <WalletCoinsPanel />
        </div>

        {/* Active Auctions — 8 cols, the main attraction */}
        <div className="lg:col-span-8">
          <ActiveAuctionsPanel />
        </div>
      </div>

      {/* ═══ TIER 2 — MEDIUM PRIORITY ═══
          Live Activity Feed + Won Auctions — supporting, subtle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tutorial Section — medium weight */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 px-1">
            <Video className="text-red-500 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-300">Tutorial</h2>
          </div>
          <div className="aspect-video rounded-2xl overflow-hidden bg-[#0f0f18] border border-white/5">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with actual tutorial URL
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              New to MazeBids? Watch this quick guide to learn how to earn coins, participate in auctions, and link your Discord account for instant notifications.
            </p>
          </div>
        </div>

        {/* Right sidebar — Activity + Won Auctions */}
        <div className="space-y-6">
          <LiveActivityFeed />

          <div className="flex items-center gap-2 px-1">
            <Trophy className="text-purple-400 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-300">Won Auctions</h2>
          </div>
          <div className="space-y-3">
            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : profile?.wonAuctions?.length > 0 ? (
              profile.wonAuctions.map((auc: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3 hover:border-purple-500/20 transition-all">
                  <img src={auc.image} className="w-12 h-12 rounded-xl object-cover" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs text-gray-300 truncate">{auc.title}</h3>
                    <p className="text-[10px] text-purple-400 font-black">{auc.currentBid} Coins</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center bg-white/[0.03] border border-white/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-5 h-5 text-purple-400 opacity-40" />
                </div>
                <p className="text-gray-500 text-xs font-medium">No auctions won yet</p>
                <p className="text-gray-600 text-[10px] mt-1">Start bidding to win!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TIER 3 — LOW PRIORITY ═══
          Global Metrics — with counting animation */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center gap-2">
            <Globe className="text-purple-400 w-4 h-4" />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Platform Metrics</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent animate-pulse" />
            <Users className="w-4 h-4 text-purple-400 mb-2 relative z-10" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Total Users</p>
            <p className="text-lg font-black text-white relative z-10">{animatedStats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Gavel className="w-4 h-4 text-blue-400 mb-2 relative z-10" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Auctions Completed</p>
            <p className="text-lg font-black text-white relative z-10">{animatedStats.auctionsCompleted.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
            <Coins className="w-4 h-4 text-yellow-400 mb-2 relative z-10" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Coins Spent</p>
            <p className="text-lg font-black text-white relative z-10">{(animatedStats.coinsSpent / 1000000).toFixed(1)}M</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1.5s' }} />
            <TrendingUp className="w-4 h-4 text-green-400 mb-2 relative z-10" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Active Users</p>
            <p className="text-lg font-black text-white relative z-10">{animatedStats.activeUsers.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
