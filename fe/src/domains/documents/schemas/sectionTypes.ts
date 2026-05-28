// src/domains/documents/schemas/sectionTypes.ts
export type SummarySection = {
  id: string;
  type: "summary";
  visible: boolean;
  order: number;
  content: { text: string };
  sourceBlockId?: string;
  linked?: boolean;
};

export type ExperienceSection = {
  id: string;
  type: "experience";
  visible: boolean;
  order: number;
  content: {
    company: string;
    role: string;
    bullets: string[];
    startDate?: string;
    endDate?: string;
  };
  sourceBlockId?: string;
  linked?: boolean;
};

// Additional section types can be added here

export type DocumentSection = SummarySection | ExperienceSection; // | ... other types
