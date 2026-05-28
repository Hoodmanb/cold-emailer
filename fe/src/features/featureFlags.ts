// src/features/featureFlags.ts

/**
 * Centralized feature flag accessor.
 * Reads from environment variable or defaults to false.
 * All structured‑document code should guard with `isStructuredDocumentsEnabled()`.
 */
export function isStructuredDocumentsEnabled(): boolean {
  // In a browser environment process.env may be undefined;
  // during build we replace `process.env` via bundler.
  const flag = process?.env?.ENABLE_STRUCTURED_DOCUMENTS;
  return flag === "true" || flag === "1";
}
