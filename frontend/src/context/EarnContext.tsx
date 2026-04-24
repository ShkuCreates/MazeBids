"use client";

import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { playCoinSound } from '@/lib/sounds';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EarningState {
  todayEarned: number;
  dailyGoal: number;
  totalBalance: number;
  streak: number;
  canClaimDaily: boolean;
  dailyReward: number;
  getDailyReward: (day: number) => number;
  referralsInvited: number;
  referralsGoal: number;
  isLoading: boolean;
}

interface EarnContextType {
  state: EarningState;
  claimDaily: () => Promise<void>;
  updateBalance: (amount: number) => void;
  addToTodayProgress: (amount: number) => void;
  refreshState: () => Promise<void>;
  animatedBalance: number;
  animatedToday: number;
}

const EarnContext = createContext<EarnContextType | undefined>(undefined);

export function EarnProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser, updateCoins } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Core state - initialize from 0 to avoid undefined
  const [todayEarned, setTodayEarned] = useState(0);
  const [dailyGoal] = useState(5000);
  const [totalBalance, setTotalBalance] = useState(user?.coins || 0);
  const [streak, setStreak] = useState(1);
  const [canClaimDaily, setCanClaimDaily] = useState(true);
  
  // Calculate daily reward based on streak (matches backend logic)
  const getDailyReward = useCallback((day: number) => {
    const rewards = [50, 75, 100, 125, 150, 175, 500];
    return rewards[Math.min(day - 1, 6)] || 50;
  }, []);
  
  const dailyReward = getDailyReward(streak);
  const [referralsInvited, setReferralsInvited] = useState(0);
  const [referralsGoal] = useState(5);
  
  // Animated values for smooth transitions
  const [animatedBalance, setAnimatedBalance] = useState(user?.coins || 0);
  const [animatedToday, setAnimatedToday] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Smooth number animation helper
  const animateNumber = (
    from: number,
    to: number,
    setter: (val: number) => void,
    duration: number = 800
  ) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const startTime = performance.now();
    const diff = to - from;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(from + diff * easeOut);
      
      setter(current);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Optimistic update balance with animation - also syncs with AuthContext
  const updateBalance = useCallback((amount: number) => {
    setTotalBalance(prev => prev + amount);
    setAnimatedBalance(prev => prev + amount);
    // Play coin sound effect
    playCoinSound();
  }, []);

  // Add to today's progress with animation
  // Remove local progress accumulation - always use backend truth
// Progress is now fetched from backend via coinsEarnedToday
const addToTodayProgress = useCallback((amount: number) => {
  // This is now a no-op - progress is managed by backend
  // Kept for backwards compatibility but does nothing
}, []);

  // Claim daily reward
  const claimDaily = useCallback(async () => {
    if (!canClaimDaily || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // API call - backend is single source of truth
      const res = await axios.post(
        `${API_URL}/api/users/daily-claim`,
        {},
        { withCredentials: true }
      );
      
      // Sync with actual server response and global state
      if (res.data.coins !== undefined && updateCoins && user) {
        // Sync with global AuthContext state
        updateCoins(res.data.coins);
        // Also update local state
        setTotalBalance(res.data.coins);
        animateNumber(animatedBalance, res.data.coins, setAnimatedBalance, 400);
      }
      
      // Sync streak and claimed status from server
      if (res.data.streak !== undefined) {
        setStreak(Math.min(res.data.streak, 7));
      }
      if (res.data.dailyCheckInClaimed !== undefined) {
        setCanClaimDaily(!res.data.dailyCheckInClaimed);
      }
      if (res.data.coinsEarnedToday !== undefined) {
        setTodayEarned(res.data.coinsEarnedToday);
        setAnimatedToday(res.data.coinsEarnedToday);
      }
      
      // Refresh user in auth context
      await refreshUser();
    } catch (error) {
      console.error("Daily claim failed:", error);
      // No rollback needed - backend is single source of truth
    } finally {
      setIsLoading(false);
    }
  }, [canClaimDaily, isLoading, refreshUser, updateCoins, user]);

  // Refresh state from server
  const refreshState = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch fresh daily progress from backend
      const response = await axios.get(`${API_URL}/api/users/daily-progress`, { withCredentials: true });
      
      // Hydrate state with backend data
      setTodayEarned(response.data.earned || 0);
      setAnimatedToday(response.data.earned || 0);
      setCanClaimDaily(response.data.canClaimCheckIn || false);
      setStreak(response.data.streak || 1);
      
      // Sync balance with auth user (which is fetched separately)
      if (user) {
        setTotalBalance(user.coins || 0);
        setAnimatedBalance(user.coins || 0);
      }
    } catch (error) {
      console.error("Failed to refresh earn state:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Fetch fresh data from backend on mount
      refreshState();
    }
  }, [user]);

  const state: EarningState = {
    todayEarned,
    dailyGoal,
    totalBalance,
    streak,
    canClaimDaily,
    dailyReward,
    getDailyReward,
    referralsInvited,
    referralsGoal,
    isLoading,
  };

  return (
    <EarnContext.Provider
      value={{
        state,
        claimDaily,
        updateBalance,
        addToTodayProgress,
        refreshState,
        animatedBalance,
        animatedToday,
      }}
    >
      {children}
    </EarnContext.Provider>
  );
}

export function useEarn() {
  const context = useContext(EarnContext);
  if (context === undefined) {
    throw new Error("useEarn must be used within an EarnProvider");
  }
  return context;
}
