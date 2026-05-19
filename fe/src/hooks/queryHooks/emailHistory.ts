import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axios";
import type { EmailRecord } from "@/types";

export const useGetEmailHistory = (jobId?: string) => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const url = jobId ? `/api/email/history?jobId=${jobId}` : "/api/email/history";
      const res = await axiosInstance.get(url);
      if (res.data?.message === "retrieved successfully") setEmails(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  return { emails, loading, refetch: fetchEmails };
};

export const useApproveEmail = () => {
  const [loading, setLoading] = useState(false);

  const approve = async (id: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/email/${id}/approve`);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading };
};
