"use client";
import React, { useState, useEffect, useRef } from "react";
import { Play, ShieldCheck, X, Loader2, Coins } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";

interface VideoAd {
  id: string;
  title: string;
  contentUrl?: string;
  targetUrl?: string;
  reward: number;
  duration?: number;
}

interface VideoAdPlayerProps {
  ad: VideoAd;
  onComplete: (reward: number) => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    if (url.includes("youtube.com/embed/")) {
      return url.includes("?") ? url + "&autoplay=1" : url + "?autoplay=1";
    }
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch)
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch)
      return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
    return null;
  } catch {
    return null;
  }
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

const VideoAdPlayer: React.FC<VideoAdPlayerProps> = ({ ad, onComplete, onCancel }) => {
  const { updateCoins } = useAuth();
  const totalSeconds = ad.duration || 15;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isFinished, setIsFinished] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const embedUrl = ad.contentUrl ? toEmbedUrl(ad.contentUrl) : null;
  const directVideo = ad.contentUrl ? isDirectVideo(ad.contentUrl) : false;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFinished && !isClaiming) onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isFinished, isClaiming, onCancel]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
    });
  };

  const claimReward = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    setClaimError(null);
    try {
      const response = await axios.post(
        `${API_URL}/api/ads/${ad.id}/claim`,
        {},
        { withCredentials: true }
      );
      if (response.data.coins !== undefined) {
        setClaimSuccess(true);
        triggerConfetti();
        updateCoins(response.data.coins);
        setTimeout(() => {
          onComplete(ad.reward);
        }, 2000);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to claim reward. Please try again.";
      setClaimError(msg);
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4">

      {/* Close button — only after ad finishes */}
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
            >
              <X className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown badge */}
      {!isFinished && (
        <div className="absolute top-8 right-8 z-[10000]">
          <div className="text-white/60 text-sm font-bold flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Ad ends in {timeLeft}s
          </div>
        </div>
      )}

      {/* Ad label */}
      <div className="absolute top-8 left-8 z-[10000]">
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
          Sponsored
        </p>
        <p className="text-white font-bold text-sm truncate max-w-[220px]">
          {ad.title}
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl bg-white/5 rounded-3xl border border-white/10 overflow-hidden z-[10001] relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 pointer-events-none" />

        <AnimatePresence mode="wait">

          {/* ── WATCHING ── */}
          {!isFinished ? (
            <motion.div
              key="watching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {directVideo ? (
                <video
                  src={ad.contentUrl}
                  autoPlay
                  className="w-full aspect-video object-cover"
                  onEnded={() => setIsFinished(true)}
                />
              ) : embedUrl ? (
                <div className="w-full aspect-video">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={ad.title}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white">
                      Watching Rewarded Ad
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Do not close this window to receive your coins.
                    </p>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div className="h-1 bg-white/10 w-full">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / totalSeconds) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            </motion.div>

          ) : claimSuccess ? (
            /* ── SUCCESS ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-4 py-16 px-8"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.6)]">
                <Coins className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white">REWARD CLAIMED!</h3>
              <p className="text-green-400 font-bold text-xl">
                +{ad.reward} coins added
              </p>
            </motion.div>

          ) : (
            /* ── CLAIM ── */
            <motion.div
              key="claim"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-6 py-16 px-8"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)]">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black text-white">AD COMPLETED!</h3>
                <p className="text-green-400 font-bold mt-1">
                  You can now claim your {ad.reward} coins.
                </p>
              </div>

              {claimError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {claimError}
                </motion.div>
              )}

              <motion.button
                onClick={claimReward}
                disabled={isClaiming}
                whileHover={{ scale: isClaiming ? 1 : 1.05 }}
                whileTap={{ scale: isClaiming ? 1 : 0.95 }}
                className={`
                  relative z-[10002] px-12 py-4 rounded-2xl font-black text-xl transition-all
                  ${isClaiming
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 cursor-pointer"
                  }
                  text-white shadow-xl shadow-purple-500/20 pointer-events-auto select-none
                `}
                style={{
                  pointerEvents: "auto",
                  cursor: isClaiming ? "not-allowed" : "pointer",
                  touchAction: "manipulation",
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
                      CLAIM +{ad.reward} COINS
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center text-white/30 text-xs max-w-md z-[10001]">
        Rewarded ads help us provide real rewards for free. Thank you for your support!
      </div>
    </div>
  );
};

export default VideoAdPlayer;