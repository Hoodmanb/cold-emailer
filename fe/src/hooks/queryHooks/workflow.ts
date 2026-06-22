import { useState } from "react";
import axiosInstance from "../axios";
import { parseApiError, isAiConfigurationError } from "@/utils/parseApiError";
import type { WorkflowResult, DocumentFormat, TailoringLevel } from "@/types";
import type { PerDocTemplateIds } from "@/types/documentTemplate";

export type DocumentType = "resume" | "professional-cv" | "cover-letter" | "email";
export type { DocumentFormat, TailoringLevel };

export interface AtsResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  breakdown: Record<string, unknown>;
  scoredAt: string;
}

export interface GeneratedDocSummary {
  id: string;
  type: string;
  format: string;
  title: string;
  editableContent?: string;
  content?: string;
}

export interface GenerateSelectedResult {
  success: boolean;
  jobId: string;
  tailoringLevel?: TailoringLevel;
  formats?: Partial<Record<DocumentType, DocumentFormat>>;
  format?: DocumentFormat;
  generatedTypes: DocumentType[];
  durationMs: number;
  resume?: GeneratedDocSummary;
  professionalCv?: GeneratedDocSummary;
  coverLetter?: GeneratedDocSummary;
  email?: { id: string };
  emailDocument?: GeneratedDocSummary;
  type?: string;
  error?: string;
}

export type PerDocFormats = Partial<Record<DocumentType, DocumentFormat>>;
export type { PerDocTemplateIds };

const WORKFLOW_AI_TIMEOUT_MS = 180_000;

const DOC_TYPE_TO_FEATURE: Record<DocumentType, string> = {
  resume: "resume_generation",
  "professional-cv": "professional_cv_generation",
  "cover-letter": "cover_letter_generation",
  email: "email_generation",
};

export async function validateAiFeaturesForTypes(types: DocumentType[]): Promise<string | null> {
  for (const type of types) {
    const featureId = DOC_TYPE_TO_FEATURE[type];
    if (!featureId) continue;
    try {
      await axiosInstance.get(`/api/settings/ai/validate-feature/${encodeURIComponent(featureId)}`, {
        timeout: 15_000,
        headers: { "X-Bypass-Global-Toast": "true" },
      });
    } catch (err: any) {
      return parseApiError(err);
    }
  }
  return null;
}

function workflowRequestConfig() {
  return {
    timeout: WORKFLOW_AI_TIMEOUT_MS,
    headers: { "X-Bypass-Global-Toast": "true" },
  };
}

// ── Full auto-workflow (legacy — keep for backward compat) ───────────────────
export const useRunWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (jobId: string, recipientData?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/api/workflow/run", { jobId, recipientData }, workflowRequestConfig());
      if (res.data?.data) {
        setResult(res.data.data);
        return res.data.data as WorkflowResult;
      }
      throw new Error(res.data?.message || "Workflow failed");
    } catch (err: any) {
      const msg = parseApiError(err);
      setError(msg);
      throw Object.assign(new Error(msg), { isAiConfig: isAiConfigurationError(err) });
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, result, error };
};

// ── ATS-only analysis ────────────────────────────────────────────────────────
export const useRunATS = () => {
  const [loading, setLoading] = useState(false);
  const [ats, setAts] = useState<AtsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAts = async (jobId: string): Promise<AtsResult> => {
    setLoading(true);
    setError(null);
    setAts(null);
    try {
      const res = await axiosInstance.post("/api/workflow/run-ats", { jobId }, workflowRequestConfig());
      // Support both { data: { ats } } and { ats } structures
      const atsData = res?.data?.data?.ats || res?.data?.ats;
      if (atsData) {
        setAts(atsData as AtsResult);
        return atsData as AtsResult;
      }
      throw new Error(res?.data?.message || "ATS analysis failed");
    } catch (err: any) {
      const msg = parseApiError(err);
      setError(msg);
      throw Object.assign(new Error(msg), { isAiConfig: isAiConfigurationError(err) });
    } finally {
      setLoading(false);
    }
  };

  return { runAts, loading, ats, error };
};

// ── Selective document generation ───────────────────────────────────────────
export const useGenerateSelected = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateSelectedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    jobId: string,
    types: DocumentType[],
    formats: PerDocFormats = {},
    tailoringLevel: TailoringLevel = "balanced",
    recipientData?: object,
    templateIds: PerDocTemplateIds = {}
  ): Promise<GenerateSelectedResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/api/workflow/generate-selected", {
        jobId,
        types,
        formats,
        tailoringLevel,
        recipientData,
        templateIds,
      }, workflowRequestConfig());
      if (res.data?.success) {
        setResult(res.data.data);
        return res.data.data as GenerateSelectedResult;
      }
      throw new Error(res.data?.message || "Generation failed");
    } catch (err: any) {
      const msg = parseApiError(err);
      setError(msg);
      throw Object.assign(new Error(msg), { isAiConfig: isAiConfigurationError(err) });
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, result, error };
};

// ── Regenerate single document ───────────────────────────────────────────────
export const useRegenerate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = async (jobId: string, type: DocumentType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/api/workflow/regenerate", { jobId, type }, workflowRequestConfig());
      return res.data.data;
    } catch (err: any) {
      const msg = parseApiError(err);
      setError(msg);
      throw Object.assign(new Error(msg), { isAiConfig: isAiConfigurationError(err) });
    } finally {
      setLoading(false);
    }
  };

  return { regenerate, loading, error };
};
