// src/domains/documents/schemas/sectionSchema.ts
import { z } from "zod";

export const summarySectionSchema = z.object({
  id: z.string(),
  type: z.literal("summary"),
  visible: z.boolean(),
  order: z.number().int().nonnegative(),
  content: z.object({
    text: z.string()
  }),
  sourceBlockId: z.string().optional(),
  linked: z.boolean().optional()
});

export const experienceSectionSchema = z.object({
  id: z.string(),
  type: z.literal("experience"),
  visible: z.boolean(),
  order: z.number().int().nonnegative(),
  content: z.object({
    company: z.string(),
    role: z.string(),
    bullets: z.array(z.string()),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }),
  sourceBlockId: z.string().optional(),
  linked: z.boolean().optional()
});

// Export a union schema for any section type
export const sectionSchema = z.union([summarySectionSchema, experienceSectionSchema]);

export type Section = z.infer<typeof sectionSchema>;
