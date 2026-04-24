"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Timer, Trophy } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface MemoryMatchGameProps {
  taskId: string;
  reward: number;
  onComplete: (actualReward: number) => void;
  onCancel: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CARDS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑', '🥝', '🍍'];

const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ taskId, reward, onComplete, onCancel }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [cards, setCards] = useState<Array<{ id: number; emoji: string; isFlipped: boolean; isMatched: boolean }>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const { user, refreshUser, updateCoins } = useAuth();

  const finishGame = useCallback(async () => {
    setGameState('FINISHED');
    const calculatedReward = score * 10; // Matches * 10 coins
    const rewardAmount = calculatedReward;

    console.log("🚨 REWARD FUNCTION HIT", rewardAmount);
    console.log("GAME REWARD TRIGGERED", rewardAmount);

    try {
      console.log("COIN API REQUEST START", rewardAmount);
      const res = await fetch(`${API_URL}/api/coins/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          amount: rewardAmount,
          source: "game"
        })
      });

      const data = await res.json();
      console.log("COIN API RESPONSE", data);
      console.log("COIN API REQUEST END", rewardAmount);
    } catch (err) {
      console.error("COIN API ERROR", err);
    }

    try {
      const res = await axios.post(`${API_URL}/api/tasks/complete`, {
        taskId,
        score,
        reward: calculatedReward
      }, { withCredentials: true });
      
      // Use backend response for real-time update (single source of truth)
      if (res.data.coins !== undefined && updateCoins) {
        updateCoins(res.data.coins);
      }
    } catch (error) {
      console.error('Failed to save score', error);
    }
  }, [taskId, score, updateCoins, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      finishGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, finishGame]);

  const initializeCards = useCallback(() => {
    const shuffledCards = [...CARDS, ...CARDS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    setCards(shuffledCards);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setFlippedCards([]);
    initializeCards();
    setGameState('PLAYING');
  }, [initializeCards]);

  const handleCardClick = useCallback((cardId: number) => {
    if (flippedCards.length === 2) return;
    if (cards[cardId].isMatched || cards[cardId].isFlipped) return;

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      const [first, second] = newFlippedCards;
      if (cards[first].emoji === cards[second].emoji) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setScore(prev => prev + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [cards, flippedCards]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f0f18] border border-blue-500/30 rounded-[2.5rem] w-full max-w-2xl p-8 text-center space-y-8 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]">
        
        {gameState === 'IDLE' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/30">
              <Brain className="w-10 h-10 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">MEMORY MATCH</h2>
              <p className="text-gray-400">Find all matching pairs in the shortest time!</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={startGame}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all"
              >
                START GAME
              </button>
              <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">Maybe later</button>
            </div>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-black text-white">{timeLeft}s</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-black text-white">{score}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-xl text-3xl font-bold transition-all transform hover:scale-105 ${
                    card.isFlipped || card.isMatched
                      ? 'bg-white text-black rotate-0'
                      : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white rotate-180'
                  } ${card.isMatched ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={card.isMatched}
                >
                  {card.isFlipped || card.isMatched ? card.emoji : '?'}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/30">
              <Trophy className="w-10 h-10 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">GAME COMPLETE!</h2>
              <p className="text-blue-300">You matched <span className="text-white font-black">{score}</span> pairs!</p>
              <p className="text-green-400 font-bold">+{score * 10} Coins earned!</p>
            </div>
            <button 
              onClick={() => onComplete(score * 10)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all"
            >
              COLLECT REWARD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MemoryMatchGame);
