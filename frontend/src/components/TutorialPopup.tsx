"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Coins, Gavel, Trophy, Gift, Gamepad2 } from "lucide-react";

const STORAGE_KEY = "mazebids_tutorial_seen";

const slides = [
  {
    icon: <Coins className="w-10 h-10 text-yellow-400" />,
    bg: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/30",
    title: "Welcome to MazeBids! 🎉",
    description:
      "MazeBids is a gamified auction platform where you earn coins by playing games, watching ads, and completing daily tasks — then use those coins to bid on real prizes.",
  },
  {
    icon: <Gamepad2 className="w-10 h-10 text-purple-400" />,
    bg: "from-purple-500/20 to-blue-500/10",
    border: "border-purple-500/30",
    title: "Step 1 — Earn Coins",
    description:
      "Go to the Earn page and play mini games like Speed Clicker, Memory Match, Number Rush, and Color Match. Watch sponsored videos, claim your daily check-in, and invite friends to earn even more coins.",
  },
  {
    icon: <Gavel className="w-10 h-10 text-blue-400" />,
    bg: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/30",
    title: "Step 2 — Place Bids",
    description:
      "Use your coins to bid on live auctions. Every bid increases the price by a small percentage. The highest bidder when the timer hits zero wins the prize. Stay sharp — you can be outbid at any time!",
  },
  {
    icon: <Trophy className="w-10 h-10 text-green-400" />,
    bg: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
    title: "Step 3 — Win Real Prizes",
    description:
      "Win and we'll contact you on Discord to arrange delivery of your prize. Make sure your Discord is linked in your Profile so we can reach you instantly when you win!",
  },
  {
    icon: <Gift className="w-10 h-10 text-pink-400" />,
    bg: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/30",
    title: "Pro Tips 💡",
    description:
      "• Keep your daily streak going for up to 2x coin bonuses on Day 7\n• Watch 3 videos in a row for a bonus +100 coins\n• Enable Discord notifications so you never miss a new auction\n• Refer friends to earn 250 coins per successful invite",
  },
];

interface TutorialPopupProps {
  show: boolean;
  onClose: () => void;
}

export function TutorialPopup({ show, onClose }: TutorialPopupProps) {
  const [step, setStep] = useState(0);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const current = slides[step];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl shadow-purple-500/10"
          >
            {/* Skip button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10 flex items-center gap-1 text-xs font-bold"
            >
              Skip <X className="w-3.5 h-3.5" />
            </button>

            {/* Slide content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="p-8 space-y-5"
              >
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${current.bg} border ${current.border} flex items-center justify-center mx-auto`}>
                  {current.icon}
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                  <h2 className="text-white font-black text-xl">{current.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {current.description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pb-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`rounded-full transition-all ${
                    i === step ? "w-6 h-2 bg-purple-500" : "w-2 h-2 bg-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 px-8 pb-8">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-sm transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                {step === slides.length - 1 ? "Let's Go! 🚀" : "Next"}
                {step < slides.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hook — returns true only on first visit, never again */
export function useTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setShow(true);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  return { show, close };
}
