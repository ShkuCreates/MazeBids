"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  coins: number;
  role: 'USER' | 'ADMIN';
  notifications: boolean;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  referralCode?: string;
  referredById?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
  updateCoins: (newCoins: number) => void;
  updateTotalSpent: (newSpent: number, spentAmount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AUTH_BUILD_MARKER = 'frontend-auth-refresh-2026-04-22-v1';

// Create axios instance with credentials
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const refreshUser = async () => {
    try {
      console.log('[AUTH]', AUTH_BUILD_MARKER, 'Fetching user from /api/auth/me');
      const response = await apiClient.get('/api/auth/me');
      console.log('[AUTH] User fetched:', response.data);
      // Ensure we set the user with the backend's coin balance
      setUser(response.data);
      return true;
    } catch (error) {
      console.log('[AUTH] User fetch failed or not authenticated');
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch fresh data on mount (don't clear localStorage to preserve balance)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshUser();
  }, [mounted]);

  // Simple polling for real-time balance updates (every 30 seconds)
  useEffect(() => {
    if (!mounted || !user) return;

    const interval = setInterval(async () => {
      await refreshUser();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [mounted, user]);

  const login = () => {
    if (loading || user) return;
    window.location.href = `${API_URL}/api/auth/discord`;
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      await apiClient.post('/api/auth/logout');
      console.log('Logout successful');
      setUser(null);
      // Clear any stored auth data
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
      // Even if logout fails on backend, clear local state
      setUser(null);
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const updateCoins = (newCoins: number) => {
    if (user) {
      setUser({
        ...user,
        coins: newCoins
      });
    }
  };

  const updateTotalSpent = (newSpent: number, spentAmount: number) => {
    if (user) {
      setUser({ 
        ...user, 
        totalSpent: newSpent
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateCoins, updateTotalSpent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
