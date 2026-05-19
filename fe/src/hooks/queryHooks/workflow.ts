import { useState } from "react";
import axiosInstance from "../axios";
import type { WorkflowResult } from "@/types";

export const useRunWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (jobId: string, recipientData?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/api/workflow/run", {
        jobId,
        recipientData,
      });
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

export const useRegenerate = () => {
  const [loading, setLoading] = useState(false);

  const regenerate = async (
    jobId: string,
    type: "resume" | "cover-letter" | "email"
  ) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/workflow/regenerate", {
        jobId,
        type,
      });
      return res.data.data;
    } finally {
      setLoading(false);
    }
  };

  return { regenerate, loading };
};
