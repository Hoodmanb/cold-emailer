import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../axios";
import type { Job } from "@/types";

export const jobsQueryKeys = {
  all: ["jobs"] as const,
  single: (id?: string) => ["jobs", id || ""] as const,
};

export const useGetJobs = () => {
  const query = useQuery({
    queryKey: jobsQueryKeys.all,
    queryFn: async () => {
      const res = await axiosInstance.get("/api/jobs");
      if (res.data?.message === "retrieved successfully") {
        return res.data.data as Job[];
      }
      return [] as Job[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  return {
    jobs: query.data || [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};

export const useGetJob = (id: string) => {
  const query = useQuery({
    queryKey: jobsQueryKeys.single(id),
    queryFn: async () => {
      if (!id) return null;
      const res = await axiosInstance.get(`/api/jobs/${id}`);
      if (res.data?.message === "retrieved successfully") {
        return res.data.data as Job;
      }
      return null;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 30_000,
  });

  return {
    job: query.data || null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};

export const useRerunATS = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.post(`/api/jobs/${id}/ats-rerun`);
      return res.data;
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: jobsQueryKeys.single(id) });
      void queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all });
    },
  });

  return {
    rerun: mutation.mutateAsync,
    busy: mutation.isPending,
  };
};
