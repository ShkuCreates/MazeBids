"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Hash, Timer, Trophy } from "lucide-react";
import axios from "axios";

interface NumberRushGameProps {
  taskId: string;
  reward: number;
  onComplete: (actualReward: number) => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOTAL_TIME = 15;
const GRID_SIZE = 9;

const NumberRushGame: React.FC<NumberRushGameProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "FINISHED">("IDLE");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [next, setNext] = useState(1); // next number user must tap
  const [score, setScore] = useState(0); // how many correct taps
  const [grid, setGrid] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [correctFlash, setCorrectFlash] = useState<number | null>(null);
  const claimDoneRef = useRef<number | null>(null);
  const nextRef = useRef(1);

  const shuffleGrid = useCallback(() => {
    const nums = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setGrid(nums);
  }, []);

  const finishGame = useCallback(async (finalScore: number) => {
    setGameState("FINISHED");
    const calculatedReward = Math.round((finalScore / GRID_SIZE) * reward);
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
          finishGame(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, score, finishGame]);

  const startGame = useCallback(() => {
    nextRef.current = 1;
    setNext(1);
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    shuffleGrid();
    setGameState("PLAYING");
  }, [shuffleGrid]);

  const handleTap = useCallback((num: number) => {
    if (gameState !== "PLAYING") return;
    if (num === nextRef.current) {
      setCorrectFlash(num);
      setTimeout(() => setCorrectFlash(null), 300);
      const newNext = nextRef.current + 1;
      nextRef.current = newNext;
      setNext(newNext);
      const newScore = score + 1;
      setScore(newScore);
      if (newNext > GRID_SIZE) {
        // Completed all 9 — reshuffle and reset
        nextRef.current = 1;
        setNext(1);
        shuffleGrid();
      }
    } else {
      setWrongFlash(num);
      setTimeout(() => setWrongFlash(null), 300);
    }
  }, [gameState, score, shuffleGrid]);

  const finalReward = claimDoneRef.current ?? Math.round((score / GRID_SIZE) * reward);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f0f18] border border-yellow-500/30 rounded-[2.5rem] w-full max-w-md p-8 text-center space-y-6 shadow-[0_0_50px_-12px_rgba(234,179,8,0.4)]">

        {/* IDLE */}
        {gameState === "IDLE" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/30">
              <Hash className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">NUMBER RUSH</h2>
              <p className="text-gray-400">Tap numbers <span className="text-white font-bold">1 → 9</span> in order as fast as you can!</p>
              <p className="text-yellow-400 text-sm font-bold">You have {TOTAL_TIME} seconds. Go!</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={startGame}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-2xl font-black text-lg transition-all"
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
        {gameState === "PLAYING" && (
          <div className="space-y-5">
            {/* HUD */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-black text-white">{timeLeft}s</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tap next</p>
                <span className="text-3xl font-black text-yellow-400">{next}</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-black">{score}</span>
              </div>
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-3 gap-3">
              {grid.map((num) => (
                <button
                  key={num}
                  onClick={() => handleTap(num)}
                  className={`
                    h-20 rounded-2xl font-black text-3xl transition-all active:scale-95 border-2
                    ${correctFlash === num
                      ? "bg-green-500 border-green-400 text-white scale-95"
                      : wrongFlash === num
                      ? "bg-red-500 border-red-400 text-white scale-95"
                      : "bg-white/5 border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-white"
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FINISHED */}
        {gameState === "FINISHED" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/30">
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">TIME'S UP!</h2>
              <p className="text-yellow-300">
                You tapped <span className="text-white font-black">{score}</span> numbers correctly!
              </p>
              <p className="text-green-400 font-bold text-lg">+{finalReward} Coins earned!</p>
            </div>
            <button
              onClick={() => onComplete(finalReward)}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-2xl font-black text-lg transition-all"
            >
              COLLECT REWARD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(NumberRushGame);
