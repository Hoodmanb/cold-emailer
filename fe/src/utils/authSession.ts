export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function syncAuthCookie(token: string | null | undefined) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SEC}; samesite=lax`;
    console.log("[AuthSession] Cookie synced from token");
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    console.log("[AuthSession] Cookie cleared");
  }
}

export function readAuthCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export type LogoutReason =
  | "explicit_logout"
  | "auth_me_invalid"
  | "auth_error_response"
  | "bootstrap_auth_failure";

export function logLogoutTrigger(reason: LogoutReason, detail?: string) {
  console.warn("[AuthSession] Logout triggered", { reason, detail });
}
export function getAuthToken(): string | null {
  // Returns the auth token stored in the cookie, or null if not present.
  return readAuthCookie();
}
