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
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import AdBanner from "@/components/AdBanner";
import LiveActivityFeed from "@/components/LiveActivityFeed";
import WalletCoinsPanel from "@/components/WalletCoinsPanel";
import ActiveAuctionsPanel from "@/components/ActiveAuctionsPanel";
import UpcomingAuctionsPanel from "@/components/UpcomingAuctionsPanel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const { user, loading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [siteStats, setSiteStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/profile`, { withCredentials: true }),
          axios.get(`${API_URL}/api/users/site-stats`),
        ]);
        console.log('Dashboard data updated:', { profile: profileRes.data, siteStats: statsRes.data });

        if (profile && profileRes.data.totalSpent > profile.totalSpent) {
          console.log('User won an auction! Updating stats...');
          refreshUser();
        }

        setProfile(profileRes.data);
        setSiteStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };

    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user, refreshUser]);

  if (loading) return <div className="py-20 text-center">Loading dashboard...</div>;
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
            {profile?.wonAuctions?.length > 0 ? (
              profile.wonAuctions.map((auc: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3 hover:border-purple-500/20 transition-all">
                  <img src={auc.image} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs text-gray-300 truncate">{auc.title}</h3>
                    <p className="text-[10px] text-purple-400 font-black">{auc.currentBid} Coins</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center bg-white/[0.03] border border-white/5 rounded-2xl text-gray-600 text-xs font-bold">
                No auctions won yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TIER 3 — LOW PRIORITY ═══
          Global Metrics — muted, small, no glow */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center gap-2">
            <Globe className="text-gray-600 w-4 h-4" />
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Platform Metrics</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Users className="w-3.5 h-3.5 text-gray-600 mb-1.5" />
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Users</p>
            <p className="text-base font-bold text-gray-400">{siteStats?.registeredUsers?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-600 mb-1.5" />
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Earned</p>
            <p className="text-base font-bold text-gray-400">{siteStats?.totalEarned?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Gavel className="w-3.5 h-3.5 text-gray-600 mb-1.5" />
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Spent</p>
            <p className="text-base font-bold text-gray-400">{siteStats?.totalSpent?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <Award className="w-3.5 h-3.5 text-gray-600 mb-1.5" />
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Auctions</p>
            <p className="text-base font-bold text-gray-400">{siteStats?.auctionsHeld?.toLocaleString() || "0"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
