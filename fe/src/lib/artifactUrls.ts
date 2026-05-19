/**
 * Absolute API URLs for artifacts (use for <img src>, <iframe src>, window.open).
 * Keeps Base64 decoding on the server only.
 */
export function getArtifactApiBase(): string {
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
    "http://localhost:9000"
  );
}

export function artifactPreviewUrl(id: string): string {
  return `${getArtifactApiBase().replace(/\/$/, "")}/api/artifacts/${encodeURIComponent(id)}/preview`;
}

export function artifactDownloadUrl(id: string): string {
  return `${getArtifactApiBase().replace(/\/$/, "")}/api/artifacts/${encodeURIComponent(id)}/download`;
}
