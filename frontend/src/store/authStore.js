import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Authentication store
 * Manages user authentication state and tokens
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Actions
      setAuth: (user, accessToken, refreshToken) => {
        // Store tokens in localStorage for axios interceptor
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // Initialize auth from localStorage on app start
      initializeAuth: () => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (token && refreshToken) {
          set({
            accessToken: token,
            refreshToken: refreshToken,
            isAuthenticated: true,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      // Only persist user data, not tokens (tokens handled separately)
      partialize: (state) => ({ user: state.user }),
    }
  )
);
