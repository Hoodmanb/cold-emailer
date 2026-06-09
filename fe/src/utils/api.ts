// Centralized API request helper for the front‑end.
// This file is imported as '../../../../utils/api' from admin pages.
// It uses the browser's fetch API and injects an auth token when available.

import { getAuthToken } from './authSession';

/**
 * Generic function to call backend APIs.
 *
 * @param endpoint   Relative endpoint, e.g. "/admin/billing/config"
 * @param options    Optional fetch init options (method, body, headers, …)
 * @returns          Parsed JSON response (typed via generic `T`).
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Base URL can be configured via env var; fallback to empty string for relative calls.
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE ?? '';
  const url = `${baseUrl}${endpoint}`;

  // Attach bearer token if the user is logged in.
  const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`API error ${response.status}: ${response.statusText}\n${text}`);
    (err as any).status = response.status;
    (err as any).body = text;
    throw err;
  }

  // 204 No Content – nothing to parse.
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data = (await response.json()) as T;
  return data;
}
