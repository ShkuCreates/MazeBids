"use client";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { User, Bell, Shield, Wallet, Clock, Award, Settings, LogOut, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import AdBanner from "@/components/AdBanner";
import RecentActivityPanel from "@/components/RecentActivityPanel";
import AchievementsBadges from "@/components/AchievementsBadges";
import WalletOverview from "@/components/WalletOverview";
import NotificationSettings from "@/components/NotificationSettings";
import AnimatedCounter from "@/components/AnimatedCounter";
import ProgressRing from "@/components/ProgressRing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [togglingNotify, setTogglingNotify] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/profile`, { withCredentials: true });
        setProfileData(res.data);
        console.log('Profile data updated:', res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    
    if (user) {
      fetchProfile(); // Initial fetch
      const interval = setInterval(fetchProfile, 3000); // Update every 3 seconds for real-time updates
      return () => clearInterval(interval);
    }
  }, [user, refreshUser]);

  const handleToggleNotifications = async () => {
    setTogglingNotify(true);
    try {
      const res = await axios.post(`${API_URL}/api/users/toggle-notifications`, {}, { withCredentials: true });
      setProfileData({ ...profileData, notifications: res.data.notifications });
      await refreshUser();
    } catch (err) {
      console.error("Failed to toggle notifications:", err);
    } finally {
      setTogglingNotify(false);
    }
  };

  if (loading) return <div className="py-20 text-center">Loading profile...</div>;
  
  if (!user) return (
    <div className="py-20 text-center space-y-6">
      <h1 className="text-4xl font-black">Please login to view your profile</h1>
      <Link href="/" className="inline-block px-8 py-4 bg-purple-600 rounded-2xl font-bold">Back Home</Link>
    </div>
  );

  const stats = [
    { label: "Current Balance", value: user.coins, icon: Wallet, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Total Earned", value: profileData?.totalEarned || 0, icon: ArrowUpRight, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Total Spent", value: profileData?.totalSpent || 0, icon: ArrowDownRight, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Auctions Won", value: profileData?.auctionsWonCount || 0, icon: Award, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-8">
      <AdBanner placement="PROFILE" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center gap-8 bg-[#0f0f18] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/5 blur-[80px] rounded-full" />
        
        <div className="relative">
          <motion.img
            src={user.avatar || ""}
            className="w-32 h-32 rounded-[2.5rem] border-4 border-purple-500/20 shadow-2xl"
            whileHover={{ scale: 1.05 }}
          />
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-[#0f0f18] flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>

        <div className="text-center md:text-left space-y-4 flex-1">
          <h1 className="text-4xl font-black text-white">{user.username}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {profileData?.discordRoles?.map((role: string, index: number) => {
              const isVIP = role.toLowerCase().includes('vip');
              const isAdmin = role.toLowerCase().includes('admin') || role.toLowerCase().includes('mod');
              
              return (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                    isVIP 
                      ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-[0_0_15px_-5px_rgba(234,179,8,0.4)]" 
                      : isAdmin 
                        ? "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]"
                        : "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_-5px_rgba(168,85,247,0.4)]"
                  }`}
                >
                  {role}
                </motion.span>
              );
            }) || (
              <span className="px-4 py-1.5 bg-gray-500/10 text-gray-500 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/5">
                Member
              </span>
            )}
          </div>
          <p className="text-gray-500 font-bold text-xs">Discord ID: {user.discordId}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-bold transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <ProgressRing progress={Math.min((stat.value / 10000) * 100, 100)} size={50} strokeWidth={4}>
                <span className="text-[10px] font-bold text-gray-500">{Math.min(Math.round((stat.value / 10000) * 100), 100)}%</span>
              </ProgressRing>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white">
              <AnimatedCounter value={stat.value} />
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WalletOverview
            currentBalance={user.coins}
            earnedToday={profileData?.totalEarned ? Math.round(profileData.totalEarned / 7) : 0}
            earnedWeek={profileData?.totalEarned || 0}
            spent={profileData?.totalSpent || 0}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecentActivityPanel />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <AchievementsBadges />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6"
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Account Info
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-500 text-sm">Member Since</span>
              <span className="text-white font-bold">
                {new Date(profileData?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-500 text-sm">Account Status</span>
              <span className="text-green-400 font-bold">Active</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <NotificationSettings />
        </motion.div>
      </div>
    </div>
  );
}
