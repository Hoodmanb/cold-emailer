import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axios";

export interface SmtpConfig {
  id: string;
  email: string;
  host: string;
  port: number;
  secure: boolean;
  status: "pending" | "verified" | "failed";
  lastVerifiedAt: string | null;
  lastVerificationMode?: "quick" | "deep" | null;
  isDefault: boolean;
  createdAt: string;
}

export type VerificationMode = "quick" | "deep";

export const useFetchSmtps = () => {
  const [smtps, setSmtps] = useState<SmtpConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchSmtp = useCallback((id: string, partial: Partial<SmtpConfig>) => {
    setSmtps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...partial } : s))
    );
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const fetchSmtps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/smtp");
      if (res.data?.success || res.status === 200) {
        setSmtps(res.data.data || []);
      } else {
        setError(res.data?.message || "Failed to fetch SMTP configs");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch SMTP configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSmtps();
  }, [fetchSmtps]);

  return { smtps, loading, error, refetch: fetchSmtps, patchSmtp, clearError };
};
