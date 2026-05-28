import { getApiBaseUrl } from "@/config/env";

/**
 * API base for artifacts (use for <img src>, <iframe src>, window.open).
 * In the browser uses same-origin `/api/*` via Next.js rewrites.
 */
export function getArtifactApiBase(): string {
  const base = getApiBaseUrl();
  if (base) return base;
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
}

export function artifactPreviewUrl(id: string): string {
  return `${getArtifactApiBase().replace(/\/$/, "")}/api/artifacts/${encodeURIComponent(id)}/preview`;
}

export function artifactDownloadUrl(id: string): string {
  return `${getArtifactApiBase().replace(/\/$/, "")}/api/artifacts/${encodeURIComponent(id)}/download`;
}
