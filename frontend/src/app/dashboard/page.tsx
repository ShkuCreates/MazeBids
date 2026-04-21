"use client";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Coins, Gavel, History, TrendingUp, Award, Clock, Users, ArrowUpRight, ArrowDownRight, Globe, Trophy, Play, Info, Video } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import AdBanner from "@/components/AdBanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [siteStats, setSiteStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/profile`, { withCredentials: true }),
          axios.get(`${API_URL}/api/users/site-stats`)
        ]);
        setProfile(profileRes.data);
        setSiteStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) return <div className="py-20 text-center">Loading dashboard...</div>;
  if (!user) return (
    <div className="py-20 text-center space-y-6">
      <h1 className="text-4xl font-black">Please login to view your dashboard</h1>
      <Link href="/" className="inline-block px-8 py-4 bg-purple-600 rounded-2xl font-bold">Back Home</Link>
    </div>
  );

  return (
    <div className="space-y-12 py-8">
      {/* Ad Banner */}
      <AdBanner placement="DASHBOARD" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#0f0f18] border border-white/5 p-8 rounded-[2.5rem]">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">PLATFORM <span className="text-purple-400">OVERVIEW</span></h1>
          <p className="text-gray-500 font-medium">Real-time statistics and activity across Mazebids.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/earn" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-purple-500/20 text-center">
            EARN COINS
          </Link>
        </div>
      </div>

      {/* Site-wide Statistics */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 px-2">
          <Globe className="text-purple-400 w-6 h-6" /> GLOBAL METRICS
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-purple-500/30 transition-all">
            <Users className="w-5 h-5 text-blue-400 mb-3" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Registered Users</p>
            <p className="text-2xl font-black text-white">{siteStats?.registeredUsers?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-purple-500/30 transition-all">
            <TrendingUp className="w-5 h-5 text-green-400 mb-3" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Earned</p>
            <p className="text-2xl font-black text-white">{siteStats?.totalEarned?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-purple-500/30 transition-all">
            <Gavel className="w-5 h-5 text-red-400 mb-3" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Spent</p>
            <p className="text-2xl font-black text-white">{siteStats?.totalSpent?.toLocaleString() || "0"}</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-purple-500/30 transition-all">
            <Award className="w-5 h-5 text-purple-400 mb-3" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Auctions Held</p>
            <p className="text-2xl font-black text-white">{siteStats?.auctionsHeld?.toLocaleString() || "0"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tutorial Section */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 px-2">
            <Video className="text-red-500 w-6 h-6" /> TUTORIAL SECTION
          </h2>
          <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-[#0f0f18] border border-white/5 shadow-2xl">
            <iframe 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with actual tutorial URL
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              New to MazeBids? Watch this quick guide to learn how to earn coins, participate in auctions, and link your Discord account for instant notifications.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 px-2">
            <Trophy className="text-purple-400" /> WON AUCTIONS
          </h2>
          <div className="space-y-4">
            {profile?.wonAuctions?.length > 0 ? (
              profile.wonAuctions.map((auc: any, i: number) => (
                <div key={i} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4 hover:border-purple-500/30 transition-all">
                  <img src={auc.image} className="w-16 h-16 rounded-2xl object-cover" />
                  <div>
                    <h3 className="font-bold text-sm">{auc.title}</h3>
                    <p className="text-xs text-purple-400 font-black">{auc.currentBid} Coins</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white/5 border border-white/10 rounded-3xl text-gray-500 text-sm font-bold">
                No auctions won yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
