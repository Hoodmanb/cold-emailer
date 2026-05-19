"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  userVersion: number;
  role: string;
}

interface AppState {
  user: User | null;
  userProfile: User | null; // Alias for compatibility
  token: string | null;
  isAuthenticated: boolean;
  selectedModel: string;
  theme: "light" | "dark";

  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  setSelectedModel: (model: string) => void;
  setTheme: (theme: "light" | "dark") => void;
}

const useAuthStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null,
      token: null,
      isAuthenticated: false,
      selectedModel: "openai/gpt-4o",
      theme: "dark",

      setAuth: (user, token) => {
        // Smart update: only update if version is newer or data changed
        const current = get().user;
        if (
          !current || 
          current.id !== user.id || 
          user.userVersion > (current.userVersion || 0) ||
          JSON.stringify(current) !== JSON.stringify(user)
        ) {
          console.log("[AuthStore] Updating user state", { version: user.userVersion });
          set({ user, userProfile: user, token, isAuthenticated: true });
        }
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          const next = { ...current, ...updates };
          if (JSON.stringify(current) !== JSON.stringify(next)) {
            set({ user: next, userProfile: next });
          }
        }
      },

      clearAuth: () => {
        console.log("[AuthStore] Clearing auth state");
        set({ user: null, userProfile: null, token: null, isAuthenticated: false });
      },

      setSelectedModel: (model) => set({ selectedModel: model }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "career-bot-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;
