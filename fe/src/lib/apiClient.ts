import axios from "axios";
import useAuthStore from "@/store/useAuthStore";
import { showToast } from "@/context/SnackbarContext";
import { parseApiError, ApiError } from "@/utils/parseApiError";
import { logLogoutTrigger } from "@/utils/authSession";
import { getApiBaseUrl } from "@/config/env";
import supabase from "@/lib/supabaseClient";

/**
 * Decodes a JWT payload and returns whether it has expired.
 * Pure local check — no network calls. Works even when Supabase is unreachable.
 * Returns true (expired) when the token cannot be decoded.
 */
function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // Allow 30s clock-skew tolerance
    return Date.now() > (payload.exp * 1000) + 30_000;
  } catch {
    return true;
  }
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Refresh lock – prevents concurrent refresh requests ─────────────────────
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempts to refresh the Supabase session and returns the new token.
 * Returns null if refresh fails (session truly expired).
 */
async function refreshSupabaseSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session?.access_token) {
        console.warn("[API] Supabase refresh failed:", error?.message || "no session");
        return null;
      }
      // Update store with new token
      const { setAuth, user } = useAuthStore.getState();
      const sessionUser = data.session.user;
      const userFromSession = {
        id: sessionUser.id,
        email: sessionUser.email || "",
        name: sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "",
        role: (sessionUser.user_metadata?.role || "user").toLowerCase(),
        userVersion: sessionUser.user_metadata?.userVersion || 0,
      };
      setAuth(userFromSession, data.session.access_token);
      return data.session.access_token;
    } catch (err) {
      console.warn("[API] Supabase refresh exception:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Verifies if Supabase session is truly invalid.
 * Only logs out if Supabase confirms no valid session exists.
 */
async function verifyAndHandleLogout(requestUrl: string, reason: string): Promise<void> {
  // Double-check with Supabase before logging out
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    // Supabase says session is still valid — this was a transient 401
    // Update store with verified session and don't logout
    const { setAuth } = useAuthStore.getState();
    const userFromSession = {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
      role: (session.user.user_metadata?.role || "user").toLowerCase(),
      userVersion: session.user.user_metadata?.userVersion || 0,
    };
    setAuth(userFromSession, session.access_token);
    console.log("[API] 401 but Supabase session valid — keeping auth, retrying request");
    return;
  }

  // Supabase confirms no session — perform logout
  const logReason = requestUrl.includes("/api/auth/me")
    ? "auth_me_invalid"
    : "backend_401_no_session";
  logLogoutTrigger(logReason, reason);

  const { clearAuth } = useAuthStore.getState();
  clearAuth(logReason);

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const { auth, data: payloadData } = response.data || {};
    const { setAuth, user: currentUser } = useAuthStore.getState();
    const isAuthRoute = response.config.url?.includes("/api/auth/");

    // Sync backend user data if newer version returned
    if (!isAuthRoute && auth?.isAuthenticated && payloadData?.user) {
      if (!currentUser || (auth.userVersion && auth.userVersion > (currentUser.userVersion || 0))) {
        console.log("[API] Auth sync triggered by userVersion change");
        setAuth(payloadData.user, useAuthStore.getState().token || "");
      }
    }

    return response;
  },
  async (error) => {
    const cleanMsg = parseApiError(error);
    const requestUrl = error.config?.url || "";
    const isAuthCheck =
      requestUrl.includes("/api/auth/me") ||
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/signup");
    const isSilent = isAuthCheck || error.config?.headers?.["X-Bypass-Global-Toast"] === "true";

    if (!isSilent) {
      showToast(cleanMsg, "error");
    }

    if (error.response && typeof window !== "undefined") {
      const responseData = error.response.data || {};
      const status = error.response.status;

      if (responseData.errorCode === "INSUFFICIENT_CREDITS" || status === 402) {
        window.dispatchEvent(
          new CustomEvent("billing:insufficient-credits", {
            detail: responseData.details || {},
          })
        );
      }

      // ── 401 handler: frontend decides whether to logout ─────────────────────
      if (status === 401) {
        const { token: storeToken } = useAuthStore.getState();

        // No token at all — definitely logout
        if (!storeToken) {
          await verifyAndHandleLogout(requestUrl, "no_store_token");
          return Promise.reject(new ApiError(cleanMsg, error));
        }

        // Token expired locally — try refresh first
        if (isJwtExpired(storeToken)) {
          console.log("[API] Local JWT expired, attempting Supabase refresh");
          const newToken = await refreshSupabaseSession();
          if (newToken) {
            // Refresh succeeded — retry original request with new token
            error.config.headers = error.config.headers || {};
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(error.config);
          }
          // Refresh failed — Supabase session is dead, logout
          await verifyAndHandleLogout(requestUrl, "refresh_failed_after_expired");
          return Promise.reject(new ApiError(cleanMsg, error));
        }

        // Token still valid locally — try refresh (might be edge case)
        // Then verify with Supabase before deciding to logout
        console.log("[API] 401 with valid local JWT, attempting refresh");
        const newToken = await refreshSupabaseSession();
        if (newToken) {
          error.config.headers = error.config.headers || {};
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(error.config);
        }

        // Refresh failed — verify with Supabase before final logout decision
        await verifyAndHandleLogout(requestUrl, "refresh_failed_with_valid_local_jwt");
        return Promise.reject(new ApiError(cleanMsg, error));
      }
    }

    return Promise.reject(new ApiError(cleanMsg, error));
  }
);

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    const isAuthRoute = config.url?.includes("/api/auth/");
    const isPublicPath = ["/login", "/signup", "/pricing", "/reset-password"].some(
      (p) => path === p || path.startsWith(p + "/")
    );

    // Don't fire authorized background calls on public pages without token
    if (isPublicPath && !isAuthRoute && !token) {
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort("Auth required but user is on a public path without token");
    }
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminGet = async <T>(url: string): Promise<T> => {
  const { data } = await apiClient.get<T>(url);
  return data;
};

export default apiClient;