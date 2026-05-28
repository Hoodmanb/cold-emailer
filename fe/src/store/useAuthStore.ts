"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { logLogoutTrigger, syncAuthCookie } from "@/utils/authSession";

interface User {
  id: string;
  email: string;
  name: string;
  userVersion: number;
  role: string;
}

interface AppState {
  user: User | null;
  userProfile: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  selectedModel: string;
  theme: "light" | "dark";

  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: (reason?: string) => void;
  setHasHydrated: (value: boolean) => void;
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
      hasHydrated: false,
      selectedModel: "openai/gpt-4o",
      theme: "dark",

      setAuth: (user, token) => {
        const current = get().user;
        const shouldUpdateUser =
          !current ||
          current.id !== user.id ||
          user.userVersion > (current.userVersion || 0) ||
          JSON.stringify(current) !== JSON.stringify(user);

        if (shouldUpdateUser || get().token !== token || !get().isAuthenticated) {
          console.log("[AuthStore] setAuth", { userId: user.id, version: user.userVersion });
          set({ user, userProfile: user, token, isAuthenticated: true });
        }

        syncAuthCookie(token);
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

      clearAuth: (reason = "unspecified") => {
        logLogoutTrigger("explicit_logout", reason);
        set({ user: null, userProfile: null, token: null, isAuthenticated: false });
        syncAuthCookie(null);
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setSelectedModel: (model) => set({ selectedModel: model }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "career-bot-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        selectedModel: state.selectedModel,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("[AuthStore] Rehydration failed", error);
        } else if (state?.token) {
          console.log("[AuthStore] Rehydrated token from storage");
          syncAuthCookie(state.token);
        } else {
          console.log("[AuthStore] Rehydrated with no active session");
        }
      },
    }
  )
);

/** Ensure persist hydration completes (with fallback) before auth bootstrap runs. */
export function waitForAuthHydration(timeoutMs = 2500): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (useAuthStore.persist.hasHydrated()) {
      useAuthStore.getState().setHasHydrated(true);
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      useAuthStore.getState().setHasHydrated(true);
      console.log("[AuthStore] Hydration complete");
      resolve();
    };

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      finish();
    });

    void useAuthStore.persist.rehydrate();

    window.setTimeout(() => {
      unsub();
      if (!settled) {
        console.warn("[AuthStore] Hydration fallback timeout — continuing");
        finish();
      }
    }, timeoutMs);
  });
}

export default useAuthStore;
