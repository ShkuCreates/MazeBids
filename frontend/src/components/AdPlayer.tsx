"use client";
import React, { useState, useEffect } from 'react';
import { Play, ShieldCheck, X, Loader2, Coins } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';

interface AdPlayerProps {
  taskId: string;
  reward: number;
  onComplete: () => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const AdPlayer: React.FC<AdPlayerProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const { updateCoins } = useAuth();
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

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

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
    });
  };

  const claimReward = async () => {
    if (isClaiming) return; // Prevent double-clicks

    setIsClaiming(true);
    setClaimError(null);

    try {
      console.log('[AdPlayer] Claiming reward for ad:', taskId, 'reward:', reward);

      // Use correct API endpoint for ad rewards
      const response = await axios.post(
        `${API_URL}/api/ads/${taskId}/claim`,
        {},
        { withCredentials: true }
      );

      console.log('[AdPlayer] Claim response:', response.data);

      // Update global coin state from backend response (single source of truth)
      if (response.data.coins !== undefined && updateCoins) {
        console.log('[AdPlayer] Updating coins from backend:', response.data.coins);
        updateCoins(response.data.coins);
      }

      // Trigger confetti on success
      triggerConfetti();
      setClaimSuccess(true);

      // Wait for confetti then close
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (error: any) {
      console.error('[AdPlayer] Failed to claim ad reward:', error);
      const errorMsg = error.response?.data?.message || 'Failed to claim reward. Please try again.';
      setClaimError(errorMsg);
      setIsClaiming(false);
    }
  };

  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFinished && !isClaiming) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFinished, isClaiming, onCancel]);

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Close button - only show when finished and not claiming */}
      <AnimatePresence>
        {isFinished && !isClaiming && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 right-8 z-[10000]"
          >
            <button 
              onClick={onCancel} 
              className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            >
              <X className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer display during ad */}
      {!isFinished && (
        <div className="absolute top-8 right-8 z-[10000]">
          <div className="text-white/60 text-sm font-bold flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Ad ends in {timeLeft}s
          </div>
        </div>
      )}

      {/* Main content card */}
      <div className="w-full max-w-2xl aspect-video bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-6 relative overflow-hidden z-[10001]">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10" />
        
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key="watching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center space-y-6"
            >
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                <Play className="w-10 h-10 text-white fill-white" />
              </div>
              <div className="text-center space-y-2 relative z-10">
                <h3 className="text-2xl font-bold text-white">Watching Rewarded Ad</h3>
                <p className="text-gray-400">Do not close this window to receive your coins.</p>
              </div>
            </motion.div>
          ) : claimSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.6)]">
                <Coins className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white">REWARD CLAIMED!</h3>
              <p className="text-green-400 font-bold text-xl">+{reward} coins added</p>
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center space-y-6"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)]">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
              <div className="text-center space-y-2 relative z-10">
                <h3 className="text-3xl font-black text-white">AD COMPLETED!</h3>
                <p className="text-green-400 font-bold">You can now claim your {reward} coins.</p>
              </div>
              
              {/* Error message */}
              {claimError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {claimError}
                </motion.div>
              )}
              
              {/* CLAIM BUTTON - With proper z-index, pointer-events, cursor, and loading state */}
              <motion.button 
                onClick={claimReward}
                disabled={isClaiming}
                whileHover={{ scale: isClaiming ? 1 : 1.05 }}
                whileTap={{ scale: isClaiming ? 1 : 0.95 }}
                className={`
                  relative z-[10002] px-12 py-4 rounded-2xl font-black text-xl transition-all
                  ${isClaiming 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 cursor-pointer active:scale-95'
                  }
                  text-white shadow-xl shadow-purple-500/20
                  pointer-events-auto select-none
                `}
                style={{ 
                  pointerEvents: 'auto',
                  cursor: isClaiming ? 'not-allowed' : 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                <span className="flex items-center gap-3">
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      CLAIMING...
                    </>
                  ) : (
                    <>
                      <Coins className="w-6 h-6" />
                      CLAIM +{reward} COINS
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 text-center text-white/30 text-xs max-w-md z-[10001]">
        Rewarded ads help us provide real rewards for free. Thank you for your support!
      </div>
    </div>
  );
};

export default AdPlayer;
