"use client";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Target, Timer, Trophy } from 'lucide-react';

interface EmojiHitGameProps {
  taskId: string;
  reward: number;
  onComplete: (actualReward: number) => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const EMOJIS = ['🍩', '🍪', '🍫', '🍭', '🍬', '🍮', '🍦', '🍨', '🧁', '🍰', '🎂', '🍯'];

interface Emoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

const EmojiHitGame: React.FC<EmojiHitGameProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  const timerRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);
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
    const traceId = Date.now();

    console.log("CLAIM START", { traceId, reward: calculatedReward, game: "EmojiHitGame" });

    try {
      const res = await axios.post(`${API_URL}/api/tasks/complete`, {
        reward: calculatedReward,
        traceId
      }, { withCredentials: true });

      console.log("CLAIM RESPONSE", { traceId, data: res.data });

      // On success, reload page to get fresh data from backend
      if (res.data.success === true) {
        alert(`+${calculatedReward} coins added!`);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to save score', error);
      alert('Failed to save score. Please try again.');
    }
  }, [score]);

  // Use requestAnimationFrame for stable timer independent of click events
  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      let startTime = Date.now();
      let remainingTime = timeLeft;

      const tick = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= 1000) {
          startTime = Date.now();
          remainingTime -= 1;
          setTimeLeft(remainingTime);
          
          if (remainingTime <= 0) {
            setGameState('FINISHED');
            return;
          }
        }
        timerRef.current = requestAnimationFrame(tick);
      };

      timerRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [gameState]);

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
    // Throttle clicks to prevent event flooding (max 10 clicks per second)
    const now = Date.now();
    if (now - lastClickTimeRef.current < 100) {
      return; // Skip if clicked too fast
    }
    lastClickTimeRef.current = now;

    // Prevent stuck counter by using functional updates
    setScore(prev => {
      const newScore = prev + 1;
      return newScore;
    });
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
              onClick={() => onComplete(score * 10)}
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
