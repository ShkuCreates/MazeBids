"use client";
import { useState } from "react";
import { Coins, Gamepad2, Play, CheckCircle2, Trophy, ArrowRight, Ticket, Loader2, Zap } from "lucide-react";
import ClickGame from "@/components/games/ClickGame";
import AdPlayer from "@/components/AdPlayer";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import AdBanner from "@/components/AdBanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EarnPage() {
  const { user, refreshUser } = useAuth();
  const [activeGame, setActiveGame] = useState<{ id: string, reward: number, type: string } | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [redeemRefCode, setRedeemRefCode] = useState("");

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      const res = await axios.post(`${API_URL}/api/users/redeem-code`, { code: redeemCode }, { withCredentials: true });
      setRedeemMessage({ text: res.data.message, type: 'success' });
      setRedeemCode("");
      refreshUser();
    } catch (err: any) {
      setRedeemMessage({ text: err.response?.data?.message || "Failed to redeem code", type: 'error' });
    } finally {
      setRedeeming(false);
    }
  };

  const tasks = [
    {
      id: "1",
      title: "Speed Clicker",
      reward: 50,
      type: "GAME",
      icon: Gamepad2,
      desc: "Click as many times as you can in 30 seconds!",
      color: "from-purple-500 to-indigo-600"
    },
    {
      id: "2",
      title: "Memory Match",
      reward: 75,
      type: "GAME",
      icon: Gamepad2,
      desc: "Find all pairs in the shortest time.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "3",
      title: "Watch Ad",
      reward: 25,
      type: "AD",
      icon: Play,
      desc: "Support us by watching a short video.",
      color: "from-rose-500 to-pink-600"
    }
  ];

  const handleRedeemReferral = async () => {
    if (!redeemRefCode) return;
    setRedeeming(true);
    try {
      const res = await axios.post(`${API_URL}/api/users/redeem-referral`, { code: redeemRefCode }, { withCredentials: true });
      alert(res.data.message);
      setRedeemRefCode("");
      refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to redeem code");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-12 py-8">
      <AdBanner placement="EARN" />
      
      {/* Referral System */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#0f0f18] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full" />
        <div className="space-y-4 relative">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Ticket className="text-purple-400" /> REFERRAL SYSTEM
          </h2>
          <p className="text-gray-500 text-sm font-medium">Invite friends to MazeBids and you both get <span className="text-purple-400">300 Coins</span> when they redeem your code!</p>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Referral Code</p>
              <p className="text-xl font-black text-white tracking-widest">{user?.referralCode || "LOGIN TO SEE"}</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(user?.referralCode || "");
                alert("Code copied!");
              }}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-xl text-xs font-black transition-all"
            >
              COPY
            </button>
          </div>
        </div>

        <div className="space-y-4 relative">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="text-yellow-500" /> REDEEM CODE
          </h2>
          <p className="text-gray-500 text-sm font-medium">Got a referral or bonus code? Enter it below to claim your reward instantly.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="ENTER CODE HERE" 
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-purple-500 transition-all font-black text-white tracking-widest"
              value={redeemRefCode}
              onChange={(e) => setRedeemRefCode(e.target.value.toUpperCase())}
            />
            <button 
              onClick={handleRedeemReferral}
              disabled={redeeming}
              className="px-8 py-4 bg-white text-black hover:bg-purple-400 hover:text-white rounded-2xl font-black transition-all flex items-center gap-2"
            >
              {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : "REDEEM"}
            </button>
          </div>
        </div>
      </div>

      {activeGame && activeGame.type === "GAME" && (
        <ClickGame 
          taskId={activeGame.id} 
          reward={activeGame.reward} 
          onComplete={() => setActiveGame(null)}
          onCancel={() => setActiveGame(null)}
        />
      )}

      {activeGame && activeGame.type === "AD" && (
        <AdPlayer
          taskId={activeGame.id}
          reward={activeGame.reward}
          onComplete={() => setActiveGame(null)}
          onCancel={() => setActiveGame(null)}
        />
      )}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-5xl font-black text-white">EARN COINS</h1>
        <p className="text-purple-300/60 text-lg">Complete fun tasks and games to fill your wallet. No purchase necessary, ever.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          {/* Daily Streak */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold">Daily Streak</h3>
            <p className="text-gray-400 text-sm">Login 5 days in a row to get a massive bonus!</p>
            <div className="flex gap-2 pt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center border ${i <= 3 ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500" : "bg-white/5 border-white/10 text-gray-600"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Redeem Code Section */}
          <div className="bg-[#0f0f18] border border-purple-500/20 rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                <Ticket className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">REDEEM CODE</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Bonus Coins</p>
              </div>
            </div>

            <form onSubmit={handleRedeem} className="space-y-4">
              <input 
                type="text" 
                placeholder="ENTER CODE HERE..." 
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-2xl p-4 text-center font-black tracking-widest outline-none transition-all placeholder:text-gray-700"
              />
              <button 
                disabled={redeeming || !redeemCode}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                {redeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : "REDEEM NOW"}
              </button>
            </form>

            {redeemMessage && (
              <p className={`text-center text-sm font-bold ${redeemMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {redeemMessage.text}
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <AdBanner placement="WATCH_ADS" />
          </div>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group relative bg-[#0f0f18] border border-white/5 rounded-[2rem] p-8 overflow-hidden hover:border-purple-500/30 transition-all"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${task.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
              
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${task.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <task.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-black text-white">+{task.reward}</span>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-2xl font-bold">{task.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{task.desc}</p>
              </div>

              <button 
                onClick={() => setActiveGame({ id: task.id, reward: task.reward, type: task.type })}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn"
              >
                PLAY NOW
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
