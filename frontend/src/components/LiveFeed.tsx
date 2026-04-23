import React, { memo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Eye, Coins, Flame, Trophy } from "lucide-react";
import { generateMockActivity, generateMockAuctionBid, generateWatcherCount, getTimeAgo } from "@/services/mockAuctionGenerator";

interface MockActivity {
  id: string;
  username: string;
  action: string;
  item?: string;
  timestamp: Date;
}

const LiveActivityFeed = memo(() => {
  const [activities, setActivities] = useState<MockActivity[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const usernames = ["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP"];
    const items = ["iPhone 13", "AirPods Pro", "MacBook Air", "PS5", "Nintendo Switch"];
    const actions = ["placed a bid on", "won", "joined auction for"];

    const generateActivity = (): MockActivity => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      return {
        id: `activity-${Date.now()}-${Math.random()}`,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        action,
        item: action !== "joined auction for" ? items[Math.floor(Math.random() * items.length)] : undefined,
        timestamp: new Date(),
      };
    };

    setActivities(Array.from({ length: 5 }, () => generateActivity()));

    const interval = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateActivity();
        return [newActivity, ...prev.slice(0, 6)];
      });
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-500/5 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
            <Bell className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm tracking-wider">LIVE ACTIVITY</h3>
            <p className="text-[10px] text-gray-500 font-medium">Mock data - UI demonstration only</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      <div className="h-[400px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                  <span className="text-sm font-black text-purple-300">{activity.username.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    <span className="font-bold text-white">{activity.username}</span>
                    <span className="text-gray-500"> {activity.action} </span>
                    {activity.item && <span className="text-purple-400 font-bold">{activity.item}</span>}
                  </p>
                  <p className="text-[10px] text-gray-500">{getTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

LiveActivityFeed.displayName = 'LiveActivityFeed';

const LivePopups = memo(() => {
  const [popups, setPopups] = useState<Array<{ id: string; icon: React.ReactNode; message: string }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const messages = [
      { icon: <Eye className="w-4 h-4 text-blue-400" />, template: () => `👀 ${Math.floor(Math.random() * 450) + 50} users are watching right now` },
      { icon: <Coins className="w-4 h-4 text-yellow-400" />, template: () => `💰 ${(Math.floor(Math.random() * 4500) + 500).toLocaleString()} coins just farmed` },
      { icon: <Flame className="w-4 h-4 text-orange-400" />, template: () => `🔥 ${"Rahul_23|SnehaX|CryptoKing|AryanLive|NehaOP".split("|")[Math.floor(Math.random() * 5)]} joined an auction` },
      { icon: <Trophy className="w-4 h-4 text-purple-400" />, template: () => `🏆 ${"Rahul_23|SnehaX|CryptoKing|AryanLive|NehaOP".split("|")[Math.floor(Math.random() * 5)]} won ${"iPhone 13|AirPods Pro|MacBook Air|PS5".split("|")[Math.floor(Math.random() * 4)]}` },
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
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-[#0f0f18]/95 backdrop-blur-md border border-purple-500/30 rounded-2xl px-4 py-3 shadow-2xl shadow-purple-500/20 flex items-center gap-3 pointer-events-auto"
          >
            {popup.icon}
            <span className="text-white text-xs font-bold">{popup.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

LivePopups.displayName = 'LivePopups';

export { LiveActivityFeed, LivePopups };
