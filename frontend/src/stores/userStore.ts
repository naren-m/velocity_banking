import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  getOrCreateUser: (email: string, name: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  clearUser: () => void;
  clearError: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      setUser: (user: User) => {
        set({ user, error: null });
      },

      getOrCreateUser: async (email: string, name: string) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch('http://localhost:3001/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, name }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create or get user');
          }

          const user = await response.json();
          set({ user, loading: false });
          return user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      clearUser: () => {
        set({ user: null, error: null });
      },

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch('http://localhost:3001/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
          }

          const user = await response.json();
          set({ user, loading: false });
          return user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
