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
  referralCode?: string;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
  updateCoins: (newCoins: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AUTH_BUILD_MARKER = 'frontend-auth-refresh-2026-04-22-v1';

// Create axios instance with credentials
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      console.log('[AUTH]', AUTH_BUILD_MARKER, 'Fetching user from /api/auth/me');
      const response = await apiClient.get('/api/auth/me');
      console.log('[AUTH] User fetched:', response.data);
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

  useEffect(() => {
    refreshUser();
  }, []);

  const login = () => {
    if (loading || user) return;
    window.location.href = `${API_URL}/api/auth/discord`;
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const updateCoins = (newCoins: number) => {
    if (user) {
      setUser({ ...user, coins: newCoins });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateCoins }}>
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
