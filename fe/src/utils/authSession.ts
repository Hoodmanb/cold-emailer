export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function syncAuthCookie(token: string | null | undefined) {
  if (typeof document === "undefined") return;
  const isProd = window.location.protocol === "https:";
  const secureFlag = isProd ? "; secure" : "";

  if (token) {
    document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SEC}; samesite=lax${secureFlag}`;
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax${secureFlag}`;
  }
}

export function readAuthCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function getAuthToken(): string | null {
  return readAuthCookie();
}

// ── Logout reasons ──────────────────────────────────────────────────────────
export type LogoutReason =
  | "explicit_logout"
  | "auth_me_invalid"
  | "auth_error_response"
  | "bootstrap_auth_failure"
  | "bootstrap_auth_unauthorized"
  | "bootstrap_legacy_unauthorized"
  | "supabase_signed_out"
  | "axios_interceptor"
  | "backend_401_no_session"
  | "user_logout";

const LOGOUT_LOG_KEY = "auth:logout-history";
const MAX_LOG_ENTRIES = 20;

/**
 * Logs a logout trigger to the console and to localStorage for later inspection.
 * This helps diagnose unexpected logouts.
 */
export function logLogoutTrigger(reason: LogoutReason, detail?: string) {
  const entry = {
    reason,
    detail: detail ?? null,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.pathname : null,
  };
  console.warn("[AuthSession] Logout triggered", entry);

  // Persist to localStorage for post-mortem inspection
  if (typeof window !== "undefined") {
    try {
      const existing: typeof entry[] = JSON.parse(
        localStorage.getItem(LOGOUT_LOG_KEY) ?? "[]"
      );
      existing.push(entry);
      // Keep only the last N entries
      if (existing.length > MAX_LOG_ENTRIES) existing.splice(0, existing.length - MAX_LOG_ENTRIES);
      localStorage.setItem(LOGOUT_LOG_KEY, JSON.stringify(existing));
    } catch {
      // Silently ignore storage errors
    }
  }
}

// ── Supabase auth event diagnostics ────────────────────────────────────────
export type SupabaseAuthEvent =
  | "INITIAL_SESSION"
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | string; // allow unknown future events

interface AuthEventLog {
  event: SupabaseAuthEvent;
  hasSession: boolean;
  hasToken: boolean;
  reason?: string;
  timestamp: string;
}

const AUTH_EVENT_LOG_KEY = "auth:event-history";

/**
 * Logs a Supabase auth event with context.
 * Call this from onAuthStateChange handlers and anywhere auth state is derived.
 */
export function logAuthEvent(
  event: SupabaseAuthEvent,
  session: { access_token?: string } | null | undefined,
  reason?: string
) {
  const entry: AuthEventLog = {
    event,
    hasSession: session != null,
    hasToken: !!(session?.access_token),
    reason: reason ?? undefined,
    timestamp: new Date().toISOString(),
  };

  // Always log to console for real-time visibility
  console.log("[AuthDiagnostics]", JSON.stringify(entry));

  // Persist to localStorage for post-mortem inspection
  if (typeof window !== "undefined") {
    try {
      const existing: AuthEventLog[] = JSON.parse(
        localStorage.getItem(AUTH_EVENT_LOG_KEY) ?? "[]"
      );
      existing.push(entry);
      if (existing.length > MAX_LOG_ENTRIES) existing.splice(0, existing.length - MAX_LOG_ENTRIES);
      localStorage.setItem(AUTH_EVENT_LOG_KEY, JSON.stringify(existing));
    } catch {
      // Silently ignore storage errors
    }
  }
}

/**
 * Returns the stored auth event history for debugging.
 */
export function getAuthEventHistory(): AuthEventLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(AUTH_EVENT_LOG_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Returns the stored logout history for debugging.
 */
export function getLogoutHistory() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOGOUT_LOG_KEY) ?? "[]");
  } catch {
    return [];
  }
}

