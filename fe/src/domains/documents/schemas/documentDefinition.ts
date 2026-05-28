import { z } from 'zod';
import { sectionSchema } from './sectionSchema';

export const documentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  templateId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sections: z.array(sectionSchema),
  // Versioning for migrations
  schemaVersion: z.number().int().positive().default(1),
  // Misc metadata
  meta: z.object({
    ownerId: z.string().uuid(),
    isLinkedMode: z.boolean().default(false),
    linkedDocumentId: z.string().uuid().optional()
  }).partial()
});

export type Document = z.infer<typeof documentSchema>;
