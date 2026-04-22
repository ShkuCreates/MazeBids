"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  const searchParams = useSearchParams();
  const handledAuthTokenRef = useRef<string | null>(null);

  const refreshUser = async () => {
    try {
      console.log('[AUTH] Fetching user from /api/auth/me');
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

  const verifyAuthToken = async (token: string) => {
    try {
      console.log('[AUTH] Verifying auth token...');
      const response = await apiClient.post('/api/auth/verify-token', { token });
      console.log('[AUTH] Token verified, sessionId:', response.data.sessionId, 'user:', response.data.userId);
      
      // Wait longer for session to be fully established and cookie to be stored
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now fetch the actual user data - browser should send cookie automatically
      return await refreshUser();
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    const authToken = searchParams?.get('auth_token');
    
    if (authToken) {
      if (handledAuthTokenRef.current === authToken) {
        return;
      }

      handledAuthTokenRef.current = authToken;
      console.log('[AUTH] Auth token found in URL, verifying...');

      // Remove the one-time token from the URL immediately so it doesn't trigger repeated verification.
      window.history.replaceState({}, document.title, window.location.pathname);

      verifyAuthToken(authToken).then((success) => {
        if (success) {
          console.log('[AUTH] Successfully authenticated with token');
        } else {
          console.log('[AUTH] Token verification failed');
        }
      });
    } else {
      // No token in URL, just try to load existing session
      const timer = setTimeout(() => {
        refreshUser();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const login = () => {
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
