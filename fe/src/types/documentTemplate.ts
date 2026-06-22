export type DocumentTemplateType = "resume" | "cv" | "cover_letter" | "email";
export type TemplateKind = "ai" | "placeholder" | "hybrid" | "community";
export type ApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";

// Layout structure for JSON-based templates
export interface TemplateLayout {
  type: "single-column" | "two-column";
  blocks?: string[];
  columns?: Array<{
    width: string;
    blocks: string[];
  }>;
}

// Block definition for template sections
export interface TemplateBlock {
  type: string;
  title: string;
}

// Style configuration
export interface TemplateStyle {
  fontFamily?: string;
  primaryColor?: string;
  fontSize?: number | string;
  spacing?: number | string;
  [key: string]: any;
}

// Content stored in DB (JSONB)
export interface TemplateContent {
  description?: string;
  type?: DocumentTemplateType;
  layout?: TemplateLayout;
  blocks?: Record<string, TemplateBlock>;
  style?: TemplateStyle;
  status?: ApprovalStatus;
  approvalStatus?: ApprovalStatus;
  isPublic?: boolean;
  is_public?: boolean;
  featured?: boolean;
  category?: string;
  version?: number;
  preview?: string;
  aiRules?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  [key: string]: any;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string | null;
  type: DocumentTemplateType;
  templateKind?: TemplateKind;
  structure?: string[];
  
  // JSON-based template structure
  layout?: TemplateLayout;
  blocks?: Record<string, TemplateBlock>;
  style?: TemplateStyle;
  
  // Legacy content field (now stored as JSONB in DB)
  content?: TemplateContent | string;
  
  aiRules?: string;
  placeholders?: string[];
  category?: string;
  version?: number;
  preview?: string | null;
  previewPages?: string[];
  previewPage1?: string;
  previewPage2?: string;
  previewPage3?: string;
  
  // Visibility and approval
  isPublic: boolean;
  isApproved?: boolean;
  isAdminTemplate?: boolean;
  approvalStatus?: ApprovalStatus;
  status?: ApprovalStatus;
  featured?: boolean;
  
  // Metadata
  createdBy?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
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
