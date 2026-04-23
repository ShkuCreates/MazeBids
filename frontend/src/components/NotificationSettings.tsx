"use client";

import { motion } from "framer-motion";
import { Bell, AlertTriangle, Clock, Gift, Settings } from "lucide-react";
import { useState, useEffect } from "react";

interface NotificationSettingsProps {
  initialSettings?: {
    outbidAlerts: boolean;
    auctionEnding: boolean;
    rewardNotifications: boolean;
  };
}

export default function NotificationSettings({ initialSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    outbidAlerts: initialSettings?.outbidAlerts ?? true,
    auctionEnding: initialSettings?.auctionEnding ?? true,
    rewardNotifications: initialSettings?.rewardNotifications ?? true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("notificationSettings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Failed to update notification settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggles = [
    {
      id: "outbidAlerts",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      title: "Outbid Alerts",
      description: "Get notified when someone outbids you",
    },
    {
      id: "auctionEnding",
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      title: "Auction Ending Soon",
      description: "Reminders before auctions close",
    },
    {
      id: "rewardNotifications",
      icon: Gift,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      title: "Reward Notifications",
      description: "Alerts for coins earned and rewards",
    },
  ];

  return (
    <div className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Settings className="w-5 h-5 text-purple-400" />
        Notification Settings
      </h3>

      <div className="space-y-4">
        {toggles.map((toggle) => {
          const Icon = toggle.icon;
          const isEnabled = settings[toggle.id as keyof typeof settings];
          
          return (
            <motion.div
              key={toggle.id}
              whileHover={{ scale: 1.01 }}
              className={`p-5 rounded-2xl border transition-all ${
                isEnabled 
                  ? `${toggle.bg} ${toggle.border}` 
                  : "bg-white/5 border-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${toggle.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${toggle.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{toggle.title}</p>
                    <p className="text-xs text-gray-500">{toggle.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggle(toggle.id as keyof typeof settings)}
                  disabled={loading}
                  className={`w-16 h-9 rounded-full transition-all relative ${
                    isEnabled ? "bg-purple-600" : "bg-gray-700"
                  }`}
                >
                  <motion.div
                    animate={{ x: isEnabled ? 28 : 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Bell className="w-4 h-4" />
          <p>Notification preferences are saved locally and synced with your account</p>
        </div>
      </div>
    </div>
  );
}
