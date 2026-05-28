export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';

/** Backend origin for server-side calls and Next.js rewrites. */
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

/**
 * Base URL for axios and browser API calls.
 * In the browser we use same-origin `/api/*` (proxied by Next.js rewrites) to avoid CORS.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return apiUrl;
}
