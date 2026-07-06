'use client';

import { create } from 'zustand';
import { authAPI } from './api';
import type { User, AuthResponse, RegisterResponse } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<RegisterResponse>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<RegisterResponse>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('zingo_token') : null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data.data as AuthResponse;
      localStorage.setItem('zingo_token', token);
      localStorage.setItem('zingo_user', JSON.stringify(user));
      set({ user: user as unknown as User, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.register(email, password, name);
      const data = response.data.data as RegisterResponse;
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  verifyEmail: async (email, code) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.verifyEmail(email, code);
      const { user, token } = response.data.data as AuthResponse;
      localStorage.setItem('zingo_token', token);
      localStorage.setItem('zingo_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resendVerification: async (email) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.resendVerification(email);
      const data = response.data.data as RegisterResponse;
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('zingo_token');
    localStorage.removeItem('zingo_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('zingo_token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    try {
      const response = await authAPI.getMe();
      set({ user: response.data.data as User, isAuthenticated: true });
    } catch {
      localStorage.removeItem('zingo_token');
      localStorage.removeItem('zingo_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
