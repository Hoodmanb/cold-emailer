// ─── Job Types ────────────────────────────────────────────────────────────────

export interface ParsedJobData {
  title: string;
  company: string;
  location: string;
  seniority: string;
  jobTypes: string[];
  yearsRequired: number | null;
  salary: { min: string; max: string | null; raw: string } | null;
  technicalSkills: string[];
  softSkills: string[];
  topKeywords: string[];
  wordCount: number;
  parsedAt: string;
}

export interface ATSBreakdown {
  technicalSkills: number;
  keywordMatch: number;
  softSkills: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

export interface Job {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  company: string;
  location: string;
  type: string;
  rawDescription: string;
  parsedData: Partial<ParsedJobData>;
  atsScore: number | null;
  atsBreakdown: Partial<ATSBreakdown>;
  linkedDocuments: string[];
  linkedEmails: string[];
  status: "active" | "archived";
}

// ─── Document Types ───────────────────────────────────────────────────────────

export type DocumentType = "resume" | "cover-letter";
export type DocumentStatus = "draft" | "approved" | "archived";

export interface Document {
  id: string;
  createdAt: string;
  updatedAt: string;
  jobId: string | null;
  type: DocumentType;
  content: string;
  model: string;
  status: DocumentStatus;
  editedManually: boolean;
  approvedAt?: string;
}

// ─── Email Types ──────────────────────────────────────────────────────────────

export type EmailStatus = "draft" | "approved" | "sending" | "sent" | "failed";

export interface EmailScores {
  personalization: number;
  relevance: number;
  tone: number;
  overall?: number;
}

export interface EmailRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  jobId: string | null;
  to: string;
  subject: string;
  body: string;
  model: string;
  status: EmailStatus;
  editedManually: boolean;
  scores: EmailScores;
  sentAt: string | null;
}

// ─── Schedule Types ───────────────────────────────────────────────────────────

export type ScheduleFrequency = "weekly" | "monthly";

export interface ScheduleTemplate {
  subject: string;
  body: string;
  attachment?: string;
}

export interface RecipientStatus {
  scheduleOne?: "sent" | "failed" | "pending" | "void";
  scheduleTwo?: "sent" | "failed" | "pending" | "void";
  scheduleThree?: "sent" | "failed" | "pending" | "void";
  scheduleFour?: "sent" | "failed" | "pending" | "void";
}

export interface ScheduleRecipient {
  email: string;
  statuses: RecipientStatus;
  disabled: boolean;
}

export interface Schedule {
  id: string;
  createdAt: string;
  name: string;
  sender: string;
  frequency: ScheduleFrequency;
  day: number;
  hour: number;
  disabled: boolean;
  recipients: ScheduleRecipient[];
  template: ScheduleTemplate | null;
  templateOne: ScheduleTemplate | null;
  templateTwo: ScheduleTemplate | null;
  templateThree: ScheduleTemplate | null;
}

// ─── AI Model Types ───────────────────────────────────────────────────────────

export type ModelSpeed = "very-fast" | "fast" | "medium" | "slow";
export type ModelCost = "very-low" | "low" | "medium" | "high";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  speed: ModelSpeed;
  cost: ModelCost;
  quality: 1 | 2 | 3 | 4 | 5;
  description: string;
  contextWindow: number;
}

export interface AIProviderModel {
  id: string;
  name: string;
}

export interface AIProviderModelsGroup {
  provider: string;
  models: AIProviderModel[];
}

export interface AIKeyConfig {
  id: string;
  provider: string;
  label: string;
  isActive: boolean;
  maskedPreview: string;
  createdAt: string;
}

export interface AIVariable {
  key: string;
  description: string;
}

export interface AIFeatureMapEntry {
  id?: string;
  name?: string;
  description?: string;
  provider: string;
  model: string;
  useCustomPrompt?: boolean;
  customPrompt?: string;
  defaultPrompt?: string;
  variables?: AIVariable[];
}

export interface AISettingsData {
  apiKeys: AIKeyConfig[];
  featureMap: Record<string, AIFeatureMapEntry>;
  providers?: string[];
}

// ─── Audit Log Types ──────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  module?: string;
  jobId?: string;
  entityId?: string;
  entityType?: string;
  model?: string;
  details?: string;
}

// ─── Profile Types ────────────────────────────────────────────────────────────

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
  companyLinks: { label?: string; url: string }[];
}

export interface Certificate {
  id: string;
  title: string;
  link: string;
  awarder: string;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
  gpa?: string;
}

export interface ProfileProject {
  id: string;
  title: string;
  summary: string;
  description?: string;
  contentMd: string;
  technologies: string[];
  links: { github: string; live: string };
  demoVideos?: string[];
  screenshots?: { type: "upload" | "url"; value: string }[];
  createdAt: string;
}

export interface ProfileSkill {
  id: string;
  name: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  phoneNumber: string;
  githubUrl: string;
  linkedinUrl: string;
  location: string;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: ProfileSkill[];
  certificates: Certificate[];
  certifications: string[];
  links: { github: string; linkedin: string; portfolio: string };
  projects?: ProfileProject[];
}

// ─── Workflow Types ───────────────────────────────────────────────────────────

export interface WorkflowResult {
  success: boolean;
  jobId: string;
  model: string;
  durationMs: number;
  ats: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    breakdown: ATSBreakdown;
  };
  resume: Document;
  coverLetter: Document;
  email: EmailRecord;
  parsedJob: ParsedJobData;
}
