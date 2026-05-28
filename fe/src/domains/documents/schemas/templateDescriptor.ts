// src/domains/documents/schemas/templateDescriptor.ts
import { z } from "zod";

export const templateDescriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  atsCompatible: z.boolean(),
  layout: z.object({
    columns: z.number().int().positive(),
    spacing: z.enum(["compact", "comfortable"]),
  }),
  allowedSections: z.array(z.string()),
  previewImage: z.string().optional(),
});

export type TemplateDescriptor = z.infer<typeof templateDescriptorSchema>;
