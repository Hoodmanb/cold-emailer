// src/domains/documents/schemas/index.ts

// Types
export type { Document } from "./documentDefinition";
export type { DocumentSection, SummarySection, ExperienceSection } from "./sectionTypes";
export type { TemplateDescriptor } from "./templateDescriptor";

// Zod schemas
export { documentSchema } from "./documentDefinition";
export { sectionSchema } from "./sectionSchema";
export { templateDescriptorSchema } from "./templateDescriptor";
