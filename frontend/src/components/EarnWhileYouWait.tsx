"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Gift, Users, ArrowRight, CheckCircle, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EarnOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  reward: string;
  cta: string;
  action: () => void;
  color: string;
  gradient: string;
}

export default function EarnWhileYouWait() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  const referralLink = `${process.env.NEXT_PUBLIC_FRONTEND_URL || "https://mazebids.online"}?ref=${user?.referralCode || ""}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDailyReward = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/tasks/complete`, {
        taskId: "daily-reward",
      }, { withCredentials: true });
      if (res.data.reward) {
        setDailyClaimed(true);
      }
    } catch (err) {
      console.error("Daily reward claim failed:", err);
    }
  };

  const earnOptions: EarnOption[] = [
    {
      id: "ads",
      icon: <Video className="w-6 h-6" />,
      title: "Watch Ads",
      description: "Watch short video ads to earn coins instantly",
      reward: "+50 coins per ad",
      cta: "Earn Now",
      action: () => window.location.href = "/earn",
      color: "text-purple-400",
      gradient: "from-purple-500/20 to-blue-500/20",
    },
    {
      id: "daily",
      icon: <Gift className="w-6 h-6" />,
      title: "Daily Reward",
      description: "Claim your daily bonus just for logging in",
      reward: "+100 coins daily",
      cta: dailyClaimed ? "Claimed" : "Claim Now",
      action: handleDailyReward,
      color: "text-yellow-400",
      gradient: "from-yellow-500/20 to-orange-500/20",
    },
    {
      id: "referral",
      icon: <Users className="w-6 h-6" />,
      title: "Referral Bonus",
      description: "Invite friends and earn coins when they join",
      reward: "+100 coins per referral",
      cta: copied ? "Copied!" : "Invite Friends",
      action: handleCopyReferral,
      color: "text-green-400",
      gradient: "from-green-500/20 to-teal-500/20",
    },
  ];

  return (
    <div className="bg-[#0f0f18] border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-pink-500/5 pointer-events-none" />

      <h3 className="font-black text-white text-lg tracking-wider uppercase mb-4 flex items-center gap-2 relative z-10">
        <Gift className="w-5 h-5 text-orange-400" />
        Earn While You Wait
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {earnOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative group"
          >
            <div className={`h-full rounded-2xl border border-white/10 bg-gradient-to-br ${option.gradient} p-5 hover:border-white/20 transition-all duration-300`}>
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center mb-4 border border-white/10 group-hover:border-white/20 transition-colors`}>
                <div className={option.color}>{option.icon}</div>
              </div>

              {/* Content */}
              <h4 className="font-black text-white text-sm mb-2">{option.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{option.description}</p>

              {/* Reward badge */}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                <span className="text-[10px] font-bold text-yellow-400">{option.reward}</span>
              </div>

              {/* CTA Button */}
              <button
                onClick={option.action}
                disabled={option.id === "daily" && dailyClaimed}
                className={`w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                  option.id === "daily" && dailyClaimed
                    ? "bg-green-500/10 text-green-400 border border-green-500/20 cursor-default"
                    : "bg-purple-600 hover:bg-purple-700 text-white border border-purple-500/30 hover:border-purple-500/50 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                }`}
              >
                {option.id === "daily" && dailyClaimed ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {option.cta}
                  </>
                ) : option.id === "referral" && copied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {option.cta}
                  </>
                ) : (
                  <>
                    {option.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
