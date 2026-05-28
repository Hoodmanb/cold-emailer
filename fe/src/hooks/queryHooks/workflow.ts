import { useState } from "react";
import axiosInstance from "../axios";
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

// ── Full auto-workflow (legacy — keep for backward compat) ───────────────────
export const useRunWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (jobId: string, recipientData?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/api/workflow/run", { jobId, recipientData });
      if (res.data?.data) {
        setResult(res.data.data);
        return res.data.data as WorkflowResult;
      }
      throw new Error(res.data?.message || "Workflow failed");
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      setError(msg);
      throw new Error(msg);
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
      const res = await axiosInstance.post("/api/workflow/run-ats", { jobId });
      if (res.data?.success && res.data?.data?.ats) {
        setAts(res.data.data.ats);
        return res.data.data.ats as AtsResult;
      }
      throw new Error(res.data?.message || "ATS analysis failed");
    } catch (err: any) {
      const msg = err.message || "ATS analysis failed";
      setError(msg);
      throw new Error(msg);
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
      });
      if (res.data?.success) {
        setResult(res.data.data);
        return res.data.data as GenerateSelectedResult;
      }
      throw new Error(res.data?.message || "Generation failed");
    } catch (err: any) {
      const msg = err.message || "Generation failed";
      setError(msg);
      throw new Error(msg);
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
      const res = await axiosInstance.post("/api/workflow/regenerate", { jobId, type });
      return res.data.data;
    } catch (err: any) {
      const msg = err.message || "Regeneration failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { regenerate, loading, error };
};
