/**
 * Normalizes template list API responses (supports legacy + unified shapes).
 */
import type { DocumentTemplate, DocumentTemplateListResponse } from "../types/template.types";

export function normalizeTemplateListResponse(data: unknown): DocumentTemplateListResponse {
  if (!data) return { templates: [], starredIds: [] };
  if (Array.isArray(data)) {
    return { templates: data as DocumentTemplate[], starredIds: [] };
  }
  const obj = data as Record<string, unknown>;
  const templates = (obj.items ?? obj.templates ?? []) as DocumentTemplate[];
  const starredIds = (obj.starredIds ?? []) as string[];
  return { templates, starredIds };
}

export function normalizeTemplateItem<T>(data: unknown): T | null {
  if (!data) return null;
  if (typeof data === "object" && data !== null && "items" in (data as object)) {
    return null;
  }
  return data as T;
}
