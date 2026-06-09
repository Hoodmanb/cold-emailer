export type DocumentTemplateType = "resume" | "cv" | "cover_letter" | "email";
export type TemplateKind = "ai" | "placeholder" | "hybrid" | "community";
export type ApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType;
  templateKind?: TemplateKind;
  structure: string[];
  style: Record<string, unknown>;
  aiRules: string;
  content?: string;
  placeholders?: string[];
  category?: string;
  version?: number;
  preview?: string | null;
  previewPages?: string[];
  previewPage1?: string;
  previewPage2?: string;
  previewPage3?: string;
  isPublic: boolean;
  approvalStatus?: ApprovalStatus;
  featured?: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTemplateListResponse {
  templates: DocumentTemplate[];
  starredIds: string[];
}

export type PerDocTemplateIds = Partial<Record<
  "resume" | "professional-cv" | "cover-letter" | "email",
  string | null
>>;

export function mapDocTypeToTemplateType(docType: string): DocumentTemplateType | null {
  switch (docType) {
    case "resume":
      return "resume";
    case "professional-cv":
      return "cv";
    case "cover-letter":
      return "cover_letter";
    case "email":
      return "email";
    default:
      return null;
  }
}

export const TEMPLATE_TYPE_LABELS: Record<DocumentTemplateType, string> = {
  resume: "Resume",
  cv: "Professional CV",
  cover_letter: "Cover Letter",
  email: "Email",
};
