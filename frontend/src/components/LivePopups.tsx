"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Coins, Flame, Trophy, Users } from "lucide-react";

interface Popup {
  id: string;
  icon: React.ReactNode;
  message: string;
}

export default function LivePopups() {
  const [popups, setPopups] = useState<Popup[]>([]);

  const messages = [
    { icon: <Eye className="w-4 h-4 text-blue-400" />, template: (n?: number) => n ? `👀 ${n} users are watching right now` : `👀 ${Math.floor(Math.random() * 450) + 50} users are watching right now` },
    { icon: <Coins className="w-4 h-4 text-yellow-400" />, template: (n?: number) => n ? `💰 ${n.toLocaleString()} coins just farmed` : `💰 ${(Math.floor(Math.random() * 4500) + 500).toLocaleString()} coins just farmed` },
    { icon: <Flame className="w-4 h-4 text-orange-400" />, template: () => `🔥 ${usernames[Math.floor(Math.random() * usernames.length)]} joined an auction` },
    { icon: <Trophy className="w-4 h-4 text-purple-400" />, template: () => `🏆 ${usernames[Math.floor(Math.random() * usernames.length)]} won ${items[Math.floor(Math.random() * items.length)]}` },
    { icon: <Users className="w-4 h-4 text-green-400" />, template: (n?: number) => n ? `🎯 ${n} people placed bids in the last hour` : `🎯 ${Math.floor(Math.random() * 200) + 50} people placed bids in the last hour` },
  ];

  const usernames = ["Rahul_23", "SnehaX", "CryptoKing", "AryanLive", "NehaOP", "GamerPro99", "BidMaster"];
  const items = ["iPhone 13", "AirPods Pro", "MacBook Air", "PS5", "Nintendo Switch"];

  const generatePopup = (): Popup => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const id = `popup-${Date.now()}-${Math.random()}`;
    return { id, icon: msg.icon, message: msg.template() };
  };

  useEffect(() => {
    const addPopup = () => {
      setPopups((prev) => {
        const newPopup = generatePopup();
        const updated = [newPopup, ...prev.slice(0, 1)];
        return updated;
      });
    };

    addPopup();
    const interval = setInterval(addPopup, 3500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

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
}
