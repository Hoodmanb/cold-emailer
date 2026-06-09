import { apiUrl } from "@/config/env";

/**
 * Resolve a backend asset path for browser or SSR.
 * In the browser, use same-origin relative paths (proxied by Next.js rewrites).
 */
export function resolveBackendAssetUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") return normalized;
  return `${apiUrl}${normalized}`;
}

export function isImageAssetPath(path: string): boolean {
  return /\.(webp|png|jpe?g|gif|svg)(\?|$)/i.test(path);
}
