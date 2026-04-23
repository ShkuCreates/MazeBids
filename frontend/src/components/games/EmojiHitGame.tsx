"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Target, Timer, Trophy, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface EmojiHitGameProps {
  taskId: string;
  reward: number;
  onComplete: () => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const EMOJIS = ['🍩', '🍪', '🍫', '🍭', '🍬', '🍮', '🍦', '🍨', '🧁', '🍰', '🎂', '🍯'];

const EmojiHitGame: React.FC<EmojiHitGameProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [emojis, setEmojis] = useState<Array<{ id: number; emoji: string; x: number; y: number; size: number }>>([]);
  const { user, refreshUser, updateCoins } = useAuth();

  const generateRandomEmoji = useCallback(() => {
    return {
      id: Date.now() + Math.random(),
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: Math.random() * 80, // 0-80% to keep within bounds
      y: Math.random() * 70, // 0-70% to keep within bounds
      size: Math.random() * 30 + 20 // 20-50px
    };
  }, []);

  const finishGame = useCallback(async () => {
    setGameState('FINISHED');
    const calculatedReward = score * 10; // Hits * 10 coins
    try {
      await axios.post(`${API_URL}/api/tasks/complete`, {
        taskId,
        score,
        reward: calculatedReward
      }, { withCredentials: true });
      
      // Update coins in real-time
      if (updateCoins && user) {
        updateCoins(user.coins + calculatedReward, calculatedReward);
      }
      
      // Also refresh to ensure data consistency
      await refreshUser();
    } catch (error) {
      console.error('Failed to save score', error);
    }
  }, [taskId, score, refreshUser, updateCoins, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      finishGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, finishGame]);

  useEffect(() => {
    let emojiTimer: NodeJS.Timeout;
    if (gameState === 'PLAYING') {
      // Add new emoji every 500ms
      emojiTimer = setInterval(() => {
        setEmojis(prev => {
          if (prev.length < 15) { // Max 15 emojis on screen
            return [...prev, generateRandomEmoji()];
          }
          return prev;
        });
      }, 500);
    }
    return () => clearInterval(emojiTimer);
  }, [gameState, generateRandomEmoji]);

  const handleEmojiClick = useCallback((emojiId: number) => {
    setScore(prev => prev + 1);
    setEmojis(prev => prev.filter(emoji => emoji.id !== emojiId));
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(10);
    setEmojis([]);
    setGameState('PLAYING');
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 border border-white/20 rounded-[2.5rem] w-full max-w-lg h-[600px] p-8 text-center shadow-[0_0_50px_-12px_rgba(139,92,246,0.5)] relative overflow-hidden">
        
        {gameState === 'IDLE' && (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto border border-white/30">
              <Target className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">EMOJI HIT</h2>
              <p className="text-white/80">Hit as many emojis as you can in 10 seconds!</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={startGame}
                className="w-full py-4 bg-white text-purple-600 hover:bg-gray-100 rounded-2xl font-black text-lg transition-all"
              >
                START GAME
              </button>
              <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">Maybe later</button>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="h-full relative">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-white/20 p-3 rounded-2xl border border-white/30 z-10">
              <div className="flex items-center gap-2 text-white">
                <Timer className="w-5 h-5" />
                <span className="text-xl font-black">{timeLeft}s</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300">
                <Trophy className="w-5 h-5" />
                <span className="text-xl font-black">{score}</span>
              </div>
            </div>
            
            <div className="absolute inset-0 mt-20">
              {emojis.map((emoji) => (
                <button
                  key={emoji.id}
                  onClick={() => handleEmojiClick(emoji.id)}
                  className="absolute text-2xl hover:scale-110 transition-transform cursor-pointer select-none"
                  style={{
                    left: `${emoji.x}%`,
                    top: `${emoji.y}%`,
                    fontSize: `${emoji.size}px`
                  }}
                >
                  {emoji.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <div className="w-20 h-20 bg-yellow-400/30 rounded-3xl flex items-center justify-center mx-auto border border-yellow-400/50">
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">TIME'S UP!</h2>
              <p className="text-white/90">You hit <span className="text-white font-black">{score}</span> emojis!</p>
              <p className="text-yellow-300 font-bold">+{score * 10} Coins earned!</p>
            </div>
            <button 
              onClick={onComplete}
              className="w-full py-4 bg-white text-purple-600 hover:bg-gray-100 rounded-2xl font-black text-lg transition-all"
            >
              COLLECT REWARD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EmojiHitGame);
