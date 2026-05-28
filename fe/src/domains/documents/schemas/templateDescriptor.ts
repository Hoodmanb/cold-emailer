// src/domains/documents/schemas/templateDescriptor.ts
export type TemplateDescriptor = {
  id: string;
  name: string;
  version: string;
  atsCompatible: boolean;
  layout: {
    columns: number;
    spacing: "compact" | "comfortable";
  };
  allowedSections: string[]; // e.g., ["summary","experience","skill"]
  previewImage?: string; // optional path to thumbnail
};
