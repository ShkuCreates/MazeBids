"use client";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { User, Bell, Shield, Wallet, Clock, Award, Settings, LogOut, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import AdBanner from "@/components/AdBanner";

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
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    
    if (user) {
      fetchProfile(); // Initial fetch
      const interval = setInterval(fetchProfile, 8000); // Update every 8 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

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
    { label: "Current Balance", value: user.coins.toLocaleString(), icon: Wallet, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Total Earned", value: profileData?.totalEarned?.toLocaleString() || "0", icon: ArrowUpRight, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Total Spent", value: profileData?.totalSpent?.toLocaleString() || "0", icon: ArrowDownRight, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Auctions Won", value: profileData?.auctionsWonCount || "0", icon: Award, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <AdBanner placement="PROFILE" />
      <div className="flex flex-col md:flex-row items-center gap-8 bg-[#0f0f18] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full" />
        
        <div className="relative">
          <img src={user.avatar || ""} className="w-32 h-32 rounded-[2.5rem] border-4 border-purple-500/20 shadow-2xl" />
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
                <span 
                  key={index}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                    isVIP 
                      ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-[0_0_15px_-5px_rgba(234,179,8,0.4)]" 
                      : isAdmin 
                        ? "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]"
                        : "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_-5px_rgba(168,85,247,0.4)]"
                  }`}
                >
                  {role}
                </span>
              );
            }) || (
              <span className="px-4 py-1.5 bg-gray-500/10 text-gray-500 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/5">
                Member
              </span>
            )}
          </div>
          <p className="text-gray-500 font-bold text-xs">Discord ID: {user.discordId}</p>
        </div>

        <button 
          onClick={logout}
          className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-bold transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Statistics Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-purple-400" /> User Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl font-black text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences & Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-purple-400" /> Settings
          </h2>
          <div className="p-8 rounded-[2.5rem] bg-[#0f0f18] border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" /> Notifications
                </p>
                <p className="text-xs text-gray-500">Get DMed by the bot for new auctions</p>
              </div>
              <button 
                onClick={handleToggleNotifications}
                disabled={togglingNotify}
                className={`w-14 h-8 rounded-full transition-all relative ${profileData?.notifications ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                <motion.div 
                  animate={{ x: profileData?.notifications ? 28 : 4 }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                />
              </button>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" /> Account Created
                  </p>
                  <p className="text-xs text-gray-500">Member since {new Date(profileData?.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
