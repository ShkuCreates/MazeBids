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
      
      {/* Referral System - Smaller */}
      <div className="bg-[#0f0f18] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[100px] rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="space-y-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Ticket className="text-purple-400" /> REFERRAL SYSTEM
            </h2>
            <p className="text-gray-500 text-sm font-medium">Invite friends and get <span className="text-purple-400">300 Coins</span> each!</p>
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Code</p>
                <p className="text-lg font-black text-white tracking-widest">{user?.referralCode || "LOGIN"}</p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(user?.referralCode || "");
                  alert("Code copied!");
                }}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg text-xs font-black transition-all"
              >
                COPY
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Zap className="text-yellow-500" /> REDEEM CODE
            </h2>
            <p className="text-gray-500 text-sm font-medium">Got a referral or bonus code? Enter it below.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="ENTER CODE" 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 outline-none focus:border-purple-500 transition-all font-black text-white tracking-widest text-sm"
                value={redeemRefCode}
                onChange={(e) => setRedeemRefCode(e.target.value.toUpperCase())}
              />
              <button 
                onClick={handleRedeemReferral}
                disabled={redeeming}
                className="px-6 py-3 bg-white text-black hover:bg-purple-400 hover:text-white rounded-xl font-black transition-all flex items-center gap-2 text-sm"
              >
                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "REDEEM"}
              </button>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Games */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="text-purple-400" /> GAMES
          </h2>
          {tasks.filter(task => task.type === 'GAME').map((task) => (
            <div
              key={task.id}
              className="group relative bg-[#0f0f18] border border-white/5 rounded-xl p-4 overflow-hidden hover:border-purple-500/30 transition-all"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${task.color} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${task.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <task.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{task.title}</h3>
                    <p className="text-xs text-gray-400">{task.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                    <Coins className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-black text-white">+{task.reward}</span>
                  </div>
                  <button 
                    onClick={() => setActiveGame({ id: task.id, reward: task.reward, type: task.type })}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition-all"
                  >
                    PLAY
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side - Watch Videos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Play className="text-purple-400" /> WATCH VIDEOS AND EARN
          </h2>
          <div className="space-y-3">
            <div className="bg-[#0f0f18] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">MAZE BIDS TUTORIAL</h3>
                  <p className="text-xs text-gray-400">Learn how to play and win</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-black text-white">+25</span>
                </div>
                <button 
                  onClick={() => setActiveGame({ id: "3", reward: 25, type: "AD" })}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition-all"
                >
                  WATCH
                </button>
              </div>
            </div>
            
            <div className="bg-[#0f0f18] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">WINNING STRATEGIES</h3>
                  <p className="text-xs text-gray-400">Pro tips from top players</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-black text-white">+30</span>
                </div>
                <button 
                  onClick={() => setActiveGame({ id: "4", reward: 30, type: "AD" })}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition-all"
                >
                  WATCH
                </button>
              </div>
            </div>
            
            <div className="bg-[#0f0f18] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">FEATURE UPDATE</h3>
                  <p className="text-xs text-gray-400">New features and improvements</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-black text-white">+20</span>
                </div>
                <button 
                  onClick={() => setActiveGame({ id: "5", reward: 20, type: "AD" })}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition-all"
                >
                  WATCH
                </button>
              </div>
            </div>
          </div>

          {/* Bonus Code Section - Smaller Rectangular */}
          <div className="bg-[#0f0f18] border border-purple-500/20 rounded-xl p-4 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-xl rounded-full" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                <Ticket className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">REDEEM BONUS CODE</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Extra Coins</p>
              </div>
            </div>

            <form onSubmit={handleRedeem} className="space-y-3">
              <input 
                type="text" 
                placeholder="ENTER CODE..." 
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl p-3 text-center font-black tracking-widest outline-none transition-all placeholder:text-gray-700 text-sm"
              />
              <button 
                disabled={redeeming || !redeemCode}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 text-sm"
              >
                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "REDEEM NOW"}
              </button>
            </form>

            {redeemMessage && (
              <p className={`text-center text-xs font-bold ${redeemMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {redeemMessage.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
