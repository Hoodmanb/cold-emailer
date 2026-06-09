// src/config/qstash.ts
/**
 * Frontend configuration for QStash integration.
 * Uses the public NEXT_PUBLIC_SCHEDULER_ENABLED flag to toggle behaviour.
 */
export const IS_QSTASH_ENABLED = process.env.NEXT_PUBLIC_SCHEDULER_ENABLED === "true";

/**
 * Returns the base endpoint used by scheduler‑related hooks/components.
 * The backend abstracts QStash, so we point to the API routes.
 */
export const getSchedulerEndpoint = () => "/api/scheduler";
