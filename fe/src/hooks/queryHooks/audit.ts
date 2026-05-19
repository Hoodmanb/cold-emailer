import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axios";
import type { AuditEntry } from "@/types";

export const useGetAuditLog = (limit = 50, action?: string) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (action) params.append("action", action);
      const res = await axiosInstance.get(`/api/audit?${params}`);
      if (res.data?.message === "retrieved successfully") setLogs(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [limit, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
};
