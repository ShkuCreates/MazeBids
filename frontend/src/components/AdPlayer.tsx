"use client";
import React, { useState, useEffect } from 'react';
import { Play, ShieldCheck, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface AdPlayerProps {
  taskId: string;
  reward: number;
  onComplete: () => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const AdPlayer: React.FC<AdPlayerProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const { user, refreshUser, updateCoins } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const claimReward = async () => {
    try {
      console.log('Claiming ad reward for task:', taskId, 'reward:', reward);
      
      const response = await axios.post(`${API_URL}/api/tasks/complete`, {
        taskId,
        score: 1,
        reward
      }, { withCredentials: true });
      
      console.log('Ad reward response:', response.data);
      
      // Update coins in real-time
      if (updateCoins && user) {
        updateCoins(user.coins + reward, reward);
      }
      
      // Also refresh to ensure data consistency
      await refreshUser();
      onComplete();
    } catch (error) {
      console.error('Failed to claim ad reward', error);
      alert('Failed to claim reward. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 right-8">
        {!isFinished ? (
          <div className="text-white/40 text-sm font-bold flex items-center gap-2">
            Ad ends in {timeLeft}s
          </div>
        ) : (
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl aspect-video bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10" />
        
        {!isFinished ? (
          <>
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
            <div className="text-center space-y-2 relative z-10">
              <h3 className="text-2xl font-bold">Watching Rewarded Ad</h3>
              <p className="text-gray-400">Do not close this window to receive your coins.</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)]">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <div className="text-center space-y-2 relative z-10">
              <h3 className="text-3xl font-black">AD COMPLETED!</h3>
              <p className="text-green-400 font-bold">You can now claim your {reward} coins.</p>
            </div>
            <button 
              onClick={claimReward}
              className="px-12 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-purple-500/20"
            >
              CLAIM COINS
            </button>
          </>
        )}
      </div>

      <div className="mt-12 text-center text-white/20 text-xs max-w-md">
        Rewarded ads help us provide real rewards for free. Thank you for your support!
      </div>
    </div>
  );
};

export default AdPlayer;
