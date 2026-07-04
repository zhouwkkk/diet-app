/**
 * Auth Context：全局认证状态管理
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserProfile } from '../types';
import { auth } from '../services/api';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：从 localStorage 恢复用户
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) {
      setLoading(false);
      return;
    }
    // 静默恢复
    setUser(JSON.parse(savedUser));
    auth.getProfile()
      .then(res => { if (res.data.data) setProfile(res.data.data); })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await auth.getProfile();
      if (res.data?.data) setProfile(res.data.data);
    } catch { /* ignore */ }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await auth.login({ email, password });
    const { user: u, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    // 获取资料
    try {
      const profileRes = await auth.getProfile();
      if (profileRes.data?.data) setProfile(profileRes.data.data);
    } catch { /* ignore */ }
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await auth.register({ email, password, name });
    const { user: u, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
