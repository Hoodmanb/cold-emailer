// src/domains/documents/services/aiValidator.ts
import { z } from 'zod';
import { sectionSchema } from '../schemas/sectionSchema';

/**
 * Validate raw AI payloads before they are merged into the document state.
 * Returns the typed Section on success or throws a ZodError.
 */
export function validateAiSection(payload: unknown) {
  const result = sectionSchema.safeParse(payload);
  if (!result.success) {
    // Re‑throw with more context for the caller.
    throw new Error(`AI section validation failed: ${result.error.message}`);
  }
  return result.data;
}
