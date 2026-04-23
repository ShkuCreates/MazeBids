"use client";

import { motion } from "framer-motion";
import { Award, Star, Flame, Target, Zap, Lock, TrendingUp, Crown, Gem, Gavel, Coins, Trophy } from "lucide-react";
import { useState } from "react";

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress?: number;
  requirement?: number;
}

interface AchievementsBadgesProps {
  badges?: Badge[];
}

const defaultBadges: Badge[] = [
  { id: "first-bid", title: "First Bid", description: "Place your first bid", icon: Gavel, unlocked: true },
  { id: "100-coins", title: "100 Coins", description: "Earn 100 coins total", icon: Coins, unlocked: true, progress: 100, requirement: 100 },
  { id: "auction-winner", title: "Winner", description: "Win your first auction", icon: Trophy, unlocked: true },
  { id: "daily-streak", title: "Daily Streak", description: "Login 7 days in a row", icon: Flame, unlocked: false, progress: 5, requirement: 7 },
  { id: "1000-coins", title: "Coin Master", description: "Earn 1000 coins total", icon: Star, unlocked: false, progress: 650, requirement: 1000 },
  { id: "10-wins", title: "Champion", description: "Win 10 auctions", icon: Crown, unlocked: false, progress: 3, requirement: 10 },
  { id: "big-spender", title: "Big Spender", description: "Spend 5000 coins", icon: TrendingUp, unlocked: false, progress: 1200, requirement: 5000 },
  { id: "early-bird", title: "Early Bird", description: "Join auction within first hour", icon: Zap, unlocked: false },
  { id: "collector", title: "Collector", description: "Win 5 different items", icon: Gem, unlocked: false, progress: 2, requirement: 5 },
  { id: "veteran", title: "Veteran", description: "Active for 30 days", icon: Target, unlocked: false, progress: 15, requirement: 30 },
];

export default function AchievementsBadges({ badges = defaultBadges }: AchievementsBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalProgress = Math.round((unlockedCount / badges.length) * 100);

  return (
    <div className="bg-[#0f0f18] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400" />
          Achievements
        </h3>
        <span className="text-sm text-gray-500 font-bold">
          {unlockedCount}/{badges.length} Unlocked
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span>{totalProgress}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedBadge(badge)}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${
                badge.unlocked
                  ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                  : "bg-white/5 border-white/5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                badge.unlocked ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-white/10"
              }`}>
                {badge.unlocked ? (
                  <Icon className="w-6 h-6 text-white" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-500" />
                )}
              </div>
              
              <p className="text-xs font-bold text-center text-white mb-1">{badge.title}</p>
              
              {badge.progress !== undefined && badge.requirement && (
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(badge.progress / badge.requirement) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 text-center mt-1">
                    {badge.progress}/{badge.requirement}
                  </p>
                </div>
              )}
              
              {!badge.unlocked && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock className="w-5 h-5 text-white" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {selectedBadge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
              selectedBadge.unlocked ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-white/10"
            }`}>
              {selectedBadge.unlocked ? (
                <selectedBadge.icon className="w-10 h-10 text-white" />
              ) : (
                <Lock className="w-10 h-10 text-gray-500" />
              )}
            </div>
            
            <h4 className="text-2xl font-bold text-white text-center mb-2">{selectedBadge.title}</h4>
            <p className="text-gray-400 text-center mb-6">{selectedBadge.description}</p>
            
            {selectedBadge.progress !== undefined && selectedBadge.requirement && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-white font-bold">{selectedBadge.progress}/{selectedBadge.requirement}</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedBadge.progress / selectedBadge.requirement) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </div>
            )}
            
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
