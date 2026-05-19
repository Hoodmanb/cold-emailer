import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axios";
import type { Document } from "@/types";

export const useGetDocuments = (jobId?: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const url = jobId ? `/api/documents?jobId=${jobId}` : "/api/documents";
      const res = await axiosInstance.get(url);
      if (res.data?.message === "retrieved successfully") setDocuments(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  return { documents, loading, refetch: fetchDocuments };
};

export const useApproveDocument = () => {
  const [loading, setLoading] = useState(false);

  const approve = async (id: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/documents/${id}/approve`);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading };
};
