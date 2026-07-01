export type DocumentTemplateType = "resume" | "cv" | "cover_letter" | "email";
export type TemplateKind = "ai" | "placeholder" | "hybrid" | "community";
export type TemplateLifecycle =
  | "draft"
  | "submitted"
  | "approved"
  | "published"
  | "archived"
  | "rejected"
  | "pending_approval";

/** @deprecated Use TemplateLifecycle — kept for backward compatibility */
export type ApprovalStatus = TemplateLifecycle;

export type TemplateSource = "user" | "official" | "community" | "system" | "legacy";

export interface TemplateLayout {
  type: "single-column" | "two-column";
  blocks?: string[];
  columns?: Array<{ width: string; blocks: string[] }>;
}

export interface TemplateBlock {
  type: string;
  title: string;
}

export interface TemplateStyle {
  fontFamily?: string;
  primaryColor?: string;
  fontSize?: number | string;
  spacing?: number | string;
  theme?: string;
  [key: string]: unknown;
}

export interface TemplateContent {
  description?: string;
  type?: DocumentTemplateType;
  layout?: TemplateLayout;
  blocks?: Record<string, TemplateBlock>;
  style?: TemplateStyle;
  status?: ApprovalStatus;
  approvalStatus?: ApprovalStatus;
  lifecycle?: TemplateLifecycle;
  isPublic?: boolean;
  is_public?: boolean;
  featured?: boolean;
  category?: string;
  version?: number;
  preview?: string;
  aiRules?: string;
  promptRules?: string;
  subject?: string;
  body?: string;
  [key: string]: unknown;
}

/** Unified template domain model */
export interface Template {
  id: string;
  name: string;
  ownerId?: string | null;
  status?: TemplateLifecycle;
  lifecycle?: TemplateLifecycle;
  source?: TemplateSource;
  templateType?: DocumentTemplateType | "email";
  content?: TemplateContent | string;
  preview?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DocumentTemplate extends Template {
  description?: string | null;
  type: DocumentTemplateType;
  templateKind?: TemplateKind;
  structure?: string[];
  layout?: TemplateLayout;
  blocks?: Record<string, TemplateBlock>;
  style?: TemplateStyle;
  content?: TemplateContent | string;
  aiRules?: string;
  placeholders?: string[];
  category?: string;
  version?: number;
  previewPages?: string[];
  isPublic: boolean;
  isApproved?: boolean;
  isAdminTemplate?: boolean;
  approvalStatus?: ApprovalStatus;
  featured?: boolean;
  createdBy?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

export interface EmailTemplate {
  id?: string;
  _id: string;
  name: string;
  subject: string;
  body: string;
  isPublic: boolean;
  approvalStatus?: ApprovalStatus;
  usageCount?: number;
  lastUsedAt?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentTemplateListResponse {
  templates: DocumentTemplate[];
  starredIds: string[];
  total?: number;
  page?: number;
}

export type PerDocTemplateIds = Partial<
  Record<"resume" | "professional-cv" | "cover-letter" | "email", string | null>
>;

export type BuilderMode = "create" | "edit" | "fork";

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

export function isTemplateUsableInGeneration(template: DocumentTemplate): boolean {
  const status = template.lifecycle || template.approvalStatus || template.status || "draft";
  if (status === "approved" || status === "published") return true;
  if (template.isAdminTemplate) return true;
  if (!template.isPublic && (status === "draft" || !status)) return true;
  return false;
}

export function isEmailTemplateVisible(template: EmailTemplate): boolean {
  const status = template.approvalStatus;
  if (!status) return true;
  if (status === "approved" || status === "published" || status === "draft") return true;
  if (status === "pending_approval" || status === "submitted") return false;
  return status !== "rejected" && status !== "archived";
}

export const TEMPLATE_TYPE_LABELS: Record<DocumentTemplateType, string> = {
  resume: "Resume",
  cv: "Professional CV",
  cover_letter: "Cover Letter",
  email: "Email",
};

export const DEFAULT_BLOCK_ORDER = [
  "profile",
  "experience",
  "education",
  "skills",
  "projects",
  "certificates",
] as const;

export function buildDefaultBlocks(
  blockIds: readonly string[] = DEFAULT_BLOCK_ORDER,
): Record<string, TemplateBlock> {
  const blocks: Record<string, TemplateBlock> = {};
  for (const id of blockIds) {
    blocks[id] = {
      type: id,
      title: id.charAt(0).toUpperCase() + id.slice(1),
    };
  }
  return blocks;
}

export function buildDefaultLayout(
  blockIds: readonly string[] = DEFAULT_BLOCK_ORDER,
): TemplateLayout {
  return { type: "single-column", blocks: [...blockIds] };
}

export function deriveStructureFromLayout(
  layout?: TemplateLayout,
  blocks?: Record<string, TemplateBlock>,
): string[] {
  if (!layout) return [];
  const ids =
    layout.type === "two-column" && layout.columns
      ? layout.columns.flatMap((c) => c.blocks || [])
      : layout.blocks || [];
  return ids.map((id) => {
    const title = blocks?.[id]?.title;
    if (title) return title;
    return id.charAt(0).toUpperCase() + id.slice(1);
  });
}
