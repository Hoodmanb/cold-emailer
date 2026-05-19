import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axios";
import type { Job } from "@/types";

export const useGetJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/jobs");
      if (res.data?.message === "retrieved successfully") setJobs(res.data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
};

export const useGetJob = (id: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/jobs/${id}`);
      if (res.data?.message === "retrieved successfully") setJob(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  return { job, loading, refetch: fetchJob };
};

export const useRerunATS = () => {
  const [busy, setBusy] = useState(false);
  
  const rerun = async (id: string) => {
    setBusy(true);
    try {
      const res = await axiosInstance.post(`/api/jobs/${id}/ats-rerun`);
      return res.data;
    } finally {
      setBusy(false);
    }
  };

  return { rerun, busy };
};
