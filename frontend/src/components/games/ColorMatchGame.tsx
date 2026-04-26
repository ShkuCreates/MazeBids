"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Palette, Timer, Trophy } from "lucide-react";
import axios from "axios";

interface ColorMatchGameProps {
  taskId: string;
  reward: number;
  onComplete: (actualReward: number) => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOTAL_TIME = 20;
const ROUNDS_FOR_FULL_REWARD = 10;

const COLORS = [
  { name: "RED",    bg: "bg-red-500",    border: "border-red-400",    text: "text-red-400",    hex: "#ef4444" },
  { name: "BLUE",   bg: "bg-blue-500",   border: "border-blue-400",   text: "text-blue-400",   hex: "#3b82f6" },
  { name: "GREEN",  bg: "bg-green-500",  border: "border-green-400",  text: "text-green-400",  hex: "#22c55e" },
  { name: "YELLOW", bg: "bg-yellow-400", border: "border-yellow-300", text: "text-yellow-400", hex: "#facc15" },
  { name: "PURPLE", bg: "bg-purple-500", border: "border-purple-400", text: "text-purple-400", hex: "#a855f7" },
  { name: "PINK",   bg: "bg-pink-500",   border: "border-pink-400",   text: "text-pink-400",   hex: "#ec4899" },
];

function getRandom<T>(arr: T[], exclude?: T): T {
  const filtered = exclude !== undefined ? arr.filter((x) => x !== exclude) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

interface Round {
  targetColor: typeof COLORS[0];   // the color shown as text label (what user must match)
  textColor: typeof COLORS[0];     // the color the label text is rendered in (distractor)
  options: typeof COLORS[0][];     // 4 color buttons shown
}

function generateRound(): Round {
  const targetColor = getRandom(COLORS);
  // text is rendered in a DIFFERENT color to create the Stroop-like challenge
  const textColor = getRandom(COLORS, targetColor);
  // options: target + 3 random others, shuffled
  const others = COLORS.filter((c) => c !== targetColor)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [targetColor, ...others].sort(() => Math.random() - 0.5);
  return { targetColor, textColor, options };
}

const ColorMatchGame: React.FC<ColorMatchGameProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "FINISHED">("IDLE");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const claimDoneRef = useRef<number | null>(null);
  const scoreRef = useRef(0);

  const finishGame = useCallback(async (finalScore: number) => {
    setGameState("FINISHED");
    const calculatedReward = Math.min(
      Math.round((finalScore / ROUNDS_FOR_FULL_REWARD) * reward),
      reward
    );
    const traceId = Date.now();
    const claimId = `${traceId}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      const res = await axios.post(
        `${API_URL}/api/tasks/complete`,
        { reward: calculatedReward, traceId, claimId },
        { withCredentials: true }
      );
      if (res.data.success === true && !res.data.alreadyClaimed) {
        claimDoneRef.current = calculatedReward;
      }
    } catch (err) {
      console.error("Failed to save score", err);
    }
  }, [reward]);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, finishGame]);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setRound(generateRound());
    setFeedback(null);
    setGameState("PLAYING");
  }, []);

  const handlePick = useCallback((picked: typeof COLORS[0]) => {
    if (!round || feedback) return;
    if (picked.name === round.targetColor.name) {
      setFeedback("correct");
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      setFeedback("wrong");
    }
    setTimeout(() => {
      setFeedback(null);
      setRound(generateRound());
    }, 400);
  }, [round, feedback]);

  const finalReward = claimDoneRef.current ?? Math.min(
    Math.round((score / ROUNDS_FOR_FULL_REWARD) * reward),
    reward
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f0f18] border border-teal-500/30 rounded-[2.5rem] w-full max-w-md p-8 text-center space-y-6 shadow-[0_0_50px_-12px_rgba(20,184,166,0.4)]">

        {/* IDLE */}
        {gameState === "IDLE" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-teal-500/20 rounded-3xl flex items-center justify-center mx-auto border border-teal-500/30">
              <Palette className="w-10 h-10 text-teal-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">COLOR MATCH</h2>
              <p className="text-gray-400">
                Tap the button that matches the <span className="text-white font-bold">COLOR NAME</span> shown — not the text color!
              </p>
              <p className="text-teal-400 text-sm font-bold">{TOTAL_TIME} seconds. React fast!</p>
            </div>
            {/* Example preview */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Example</p>
              <p className="text-2xl font-black" style={{ color: "#ef4444" }}>BLUE</p>
              <p className="text-[10px] text-gray-400 mt-1">→ Tap the BLUE button, not the red one!</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={startGame}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black text-lg transition-all"
              >
                START GAME
              </button>
              <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors text-sm">
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* PLAYING */}
        {gameState === "PLAYING" && round && (
          <div className="space-y-6">
            {/* HUD */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-teal-400" />
                <span className="text-2xl font-black text-white">{timeLeft}s</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-black">{score}</span>
              </div>
            </div>

            {/* Prompt */}
            <div className={`rounded-2xl p-6 border-2 transition-all ${
              feedback === "correct"
                ? "bg-green-500/20 border-green-400"
                : feedback === "wrong"
                ? "bg-red-500/20 border-red-400"
                : "bg-white/5 border-white/10"
            }`}>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-2">Tap the color:</p>
              <p
                className="text-5xl font-black tracking-wider"
                style={{ color: round.textColor.hex }}
              >
                {round.targetColor.name}
              </p>
              {feedback && (
                <p className={`text-sm font-black mt-2 ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
                  {feedback === "correct" ? "✓ CORRECT!" : "✗ WRONG!"}
                </p>
              )}
            </div>

            {/* Color Options */}
            <div className="grid grid-cols-2 gap-3">
              {round.options.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handlePick(color)}
                  className={`
                    h-16 rounded-2xl font-black text-white text-lg transition-all active:scale-95 border-2
                    ${color.bg} ${color.border} hover:opacity-90
                  `}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FINISHED */}
        {gameState === "FINISHED" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-teal-500/20 rounded-3xl flex items-center justify-center mx-auto border border-teal-500/30">
              <Trophy className="w-10 h-10 text-teal-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">TIME'S UP!</h2>
              <p className="text-teal-300">
                You matched <span className="text-white font-black">{score}</span> colors correctly!
              </p>
              <p className="text-green-400 font-bold text-lg">+{finalReward} Coins earned!</p>
            </div>
            <button
              onClick={() => onComplete(finalReward)}
              className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black text-lg transition-all"
            >
              COLLECT REWARD
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default React.memo(ColorMatchGame);
