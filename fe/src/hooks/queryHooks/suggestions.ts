import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../axios";

export type SuggestionRecipient = {
  id: string;
  email: string;
  name: string;
  usageCount?: number;
  lastUsedAt?: string | null;
};

export type SuggestionTemplate = {
  id: string;
  name: string;
  subject: string;
  bodySnippet: string;
  usageCount?: number;
  lastUsedAt?: string | null;
};

export type SuggestionSmtp = {
  id: string;
  email: string;
  status?: string;
  isDefault?: boolean;
  lastUsedAt?: string | null;
};

export function useSuggestions(limit = 10) {
  const [suggestedRecipients, setSuggestedRecipients] = useState<SuggestionRecipient[]>([]);
  const [suggestedTemplates, setSuggestedTemplates] = useState<SuggestionTemplate[]>([]);
  const [suggestedSmtp, setSuggestedSmtp] = useState<SuggestionSmtp[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t, s] = await Promise.all([
        axiosInstance.get(`/api/suggestions/recipients?limit=${limit}`),
        axiosInstance.get(`/api/suggestions/templates?limit=${limit}`),
        axiosInstance.get(`/api/suggestions/smtp?limit=${limit}`),
      ]);
      if (r.data?.success) setSuggestedRecipients(r.data.data || []);
      if (t.data?.success) setSuggestedTemplates(t.data.data || []);
      if (s.data?.success) setSuggestedSmtp(s.data.data || []);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    suggestedRecipients,
    suggestedTemplates,
    suggestedSmtp,
    loading,
    refresh,
  };
}

export function trackSuggestionUsage(body: {
  type: "recipient" | "template" | "smtp";
  id?: string;
  email?: string;
}) {
  return axiosInstance.post("/api/suggestions/track", body);
}
