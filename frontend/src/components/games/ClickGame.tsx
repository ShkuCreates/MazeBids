"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MousePointer2, Timer, Trophy } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface ClickGameProps {
  taskId: string;
  reward: number;
  onComplete: (actualReward: number) => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ClickGame: React.FC<ClickGameProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const { user, refreshUser, updateCoins } = useAuth();

  const finishGame = useCallback(async () => {
    setGameState('FINISHED');
    const calculatedReward = score * 10; // Clicks * 10 coins
    try {
      const res = await axios.post(`${API_URL}/api/tasks/complete`, {
        score,
        reward: calculatedReward,
        source: 'Speed Clicker'
      }, { withCredentials: true });

      // Use backend response for real-time update (single source of truth)
      if (res.data.coins !== undefined && updateCoins) {
        updateCoins(res.data.coins);
      }
    } catch (error) {
      console.error('Failed to save score', error);
    }
  }, [score, updateCoins, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime === 0) {
            setGameState('FINISHED');
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const handleClick = useCallback(() => {
    setScore(prev => prev + 1);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(10);
    setGameState('PLAYING');
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f0f18] border border-purple-500/30 rounded-[2.5rem] w-full max-w-md p-8 text-center space-y-8 shadow-[0_0_50px_-12px_rgba(139,92,246,0.5)]">
        {gameState === 'IDLE' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/30">
              <MousePointer2 className="w-10 h-10 text-purple-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black">SPEED CLICKER</h2>
              <p className="text-gray-400">Click as many times as you can in 10 seconds!</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={startGame}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-lg transition-all"
              >
                START GAME
              </button>
              <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">Maybe later</button>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-purple-400" />
                <span className="text-2xl font-black">{timeLeft}s</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-black">{score}</span>
              </div>
            </div>
            
            <button
              onClick={handleClick}
              className="w-48 h-48 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full mx-auto shadow-[0_0_40px_-5px_rgba(139,92,246,0.6)] active:scale-95 transition-transform flex items-center justify-center border-8 border-white/10"
            >
              <span className="text-4xl font-black select-none">CLICK!</span>
            </button>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/30">
              <Trophy className="w-10 h-10 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black">TIME'S UP!</h2>
              <p className="text-purple-300">You clicked <span className="text-white font-black">{score}</span> times!</p>
              <p className="text-green-400 font-bold">+{score * 10} Coins earned!</p>
            </div>
            <button 
              onClick={() => onComplete(score * 10)}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-lg transition-all"
            >
              COLLECT REWARD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ClickGame);
