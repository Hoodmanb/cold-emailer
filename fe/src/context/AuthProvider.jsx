"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axiosInstance from "@/hooks/axios";
import useAuthStore from "@/store/useAuthStore";

const AuthContext = createContext(null);

const PUBLIC_PATHS = ["/login", "/signup"];

// Shared promise for deduplicating /me calls during initialization
let bootstrapPromise = null;

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      // Deduplicate auth check if multiple components trigger this
      if (bootstrapPromise) return bootstrapPromise;

      bootstrapPromise = (async () => {
        try {
          // Check if we already have a session in store (Zustand persist will handle localStorage)
          if (!token) return;

          console.log("[Auth] Bootstrap: Validating session...");
          const res = await axiosInstance.get("/api/auth/me");
          
          if (res.status >= 200 && res.status < 300 && res.data?.success) {
            console.log("[Auth] Bootstrap: Session valid", { version: res.data.data?.userVersion });
            setAuth(res.data.data, token);
          } else {
            console.warn("[Auth] Bootstrap: Session invalid or expired");
            clearAuth();
          }
        } catch (err) {
          console.error("[Auth] Bootstrap error:", err);
          clearAuth();
        } finally {
          setLoading(false);
          bootstrapPromise = null;
        }
      })();

      return bootstrapPromise;
    };

    void bootstrap();
  }, [setAuth, clearAuth, token]);

  // Route protection logic
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    
    if (!isAuthenticated && !isPublic) {
      console.log("[Auth] Redirecting to login: Unauthenticated on protected route", pathname);
      router.replace("/login");
    }
    if (isAuthenticated && isPublic) {
      console.log("[Auth] Redirecting to dashboard: Already authenticated", pathname);
      router.replace("/dashboard");
    }
  }, [pathname, isAuthenticated, loading, router]);

  const signup = async ({ name, email, password }) => {
    const res = await axiosInstance.post("/api/auth/signup", { name, email, password });
    if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
      throw new Error(res.data?.message || "Signup failed");
    }
    const { token: nextToken, user: nextUser } = res.data.data;
    setAuth(nextUser, nextToken);
    document.cookie = `auth_token=${nextToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    router.replace("/dashboard");
  };

  const login = async ({ email, password }) => {
    const res = await axiosInstance.post("/api/auth/login", { email, password });
    if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
      throw new Error(res.data?.message || "Login failed");
    }
    const { token: nextToken, user: nextUser } = res.data.data;
    setAuth(nextUser, nextToken);
    document.cookie = `auth_token=${nextToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    router.replace("/dashboard");
  };

  const logout = () => {
    clearAuth();
    document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
    // Clear all app-specific storage
    if (typeof window !== "undefined") {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("job-bot:") || k.includes("persist"))
        .forEach((k) => localStorage.removeItem(k));
      window.location.href = "/login";
    }
  };

  const value = useMemo(
    () => ({ token, user, loading, login, signup, logout, isAuthenticated }),
    [token, user, loading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
