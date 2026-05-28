"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axiosInstance from "@/hooks/axios";
import useAuthStore, { waitForAuthHydration } from "@/store/useAuthStore";
import AuthInitializingScreen from "@/components/auth/AuthInitializingScreen";
import { syncAuthCookie } from "@/utils/authSession";

const AuthContext = createContext(null);

const PUBLIC_PATHS = ["/login", "/signup", "/pricing", "/"];
/** Authenticated users are redirected away from these entry routes only. */
const AUTH_ENTRY_PATHS = ["/login", "/signup"];
const ME_TIMEOUT_MS = 8000;

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthEntryPath(pathname) {
  return AUTH_ENTRY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthFailure(error) {
  const original = error?.originalError || error;
  const status = original?.response?.status ?? error?.statusCode;
  const type = original?.response?.data?.type;
  return status === 401 && type !== "external_api_error";
}

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

  const { user, token, isAuthenticated, hasHydrated, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      console.log("[Auth] Initialization start");
      try {
        await waitForAuthHydration();
        if (cancelled) return;

        const { token: storedToken, setAuth: applyAuth, clearAuth: resetAuth } = useAuthStore.getState();

        if (!storedToken) {
          console.log("[Auth] No token after hydration — unauthenticated");
          return;
        }

        syncAuthCookie(storedToken);

        try {
          console.log("[Auth] Validating session via /api/auth/me");
          const res = await axiosInstance.get("/api/auth/me", {
            timeout: ME_TIMEOUT_MS,
            headers: { "X-Bypass-Global-Toast": "true" },
          });

          if (cancelled) return;

          if (res.status >= 200 && res.status < 300 && res.data?.success && res.data?.data) {
            console.log("[Auth] Session valid", { version: res.data.data?.userVersion });
            applyAuth(res.data.data, storedToken);
          } else {
            console.warn("[Auth] Session validation returned unexpected payload");
            resetAuth("bootstrap_unexpected_response");
          }
        } catch (err) {
          if (cancelled) return;

          if (isAuthFailure(err)) {
            console.warn("[Auth] Session invalid — clearing auth", err?.message);
            resetAuth("bootstrap_auth_failure");
          } else {
            console.warn("[Auth] Transient bootstrap error — keeping stored session", err?.message);
          }
        }
      } finally {
        if (!cancelled) {
          console.log("[Auth] Initialization end");
          setIsInitializingAuth(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth]);

  useEffect(() => {
    if (!hasHydrated || isInitializingAuth) return;

    const isPublic = isPublicPath(pathname);
    console.log("[Auth] Route guard check", { pathname, isAuthenticated, isPublic });

    if (!isAuthenticated && !isPublic) {
      console.log("[Auth] Redirect → /login (unauthenticated protected route)");
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isAuthEntryPath(pathname)) {
      console.log("[Auth] Redirect → /dashboard (authenticated auth entry route)");
      router.replace("/dashboard");
    }
  }, [pathname, isAuthenticated, hasHydrated, isInitializingAuth, router]);

  const signup = async ({ name, email, password }) => {
    const res = await axiosInstance.post("/api/auth/signup", { name, email, password });
    if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
      throw new Error(res.data?.message || "Signup failed");
    }
    const { token: nextToken, user: nextUser } = res.data.data;
    setAuth(nextUser, nextToken);
    setIsInitializingAuth(false);
    router.replace("/dashboard");
  };

  const login = async ({ email, password }) => {
    const res = await axiosInstance.post("/api/auth/login", { email, password });
    if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
      throw new Error(res.data?.message || "Login failed");
    }
    const { token: nextToken, user: nextUser } = res.data.data;
    setAuth(nextUser, nextToken);
    setIsInitializingAuth(false);
    router.replace("/dashboard");
  };

  const logout = () => {
    clearAuth("user_logout");
    if (typeof window !== "undefined") {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("job-bot:") || k.includes("persist"))
        .forEach((k) => localStorage.removeItem(k));
      window.location.href = "/login";
    }
  };

  const loading = !hasHydrated || isInitializingAuth;

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isInitializingAuth,
      hasHydrated,
      login,
      signup,
      logout,
      isAuthenticated,
    }),
    [token, user, loading, isInitializingAuth, hasHydrated, isAuthenticated]
  );

  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <AuthInitializingScreen />
      </AuthContext.Provider>
    );
  }

  const isPublic = isPublicPath(pathname);
  if (!isAuthenticated && !isPublic) {
    return (
      <AuthContext.Provider value={value}>
        <AuthInitializingScreen label="Redirecting..." />
      </AuthContext.Provider>
    );
  }

  if (isAuthenticated && isAuthEntryPath(pathname)) {
    return (
      <AuthContext.Provider value={value}>
        <AuthInitializingScreen label="Redirecting..." />
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
