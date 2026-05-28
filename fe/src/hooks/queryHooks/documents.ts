import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../axios";
import type { Document } from "@/types";

export const documentsQueryKeys = {
  all: (jobId?: string) => ["documents", jobId || "all"] as const,
};

export const useGetDocuments = (jobId?: string) => {
  const query = useQuery({
    queryKey: documentsQueryKeys.all(jobId),
    queryFn: async () => {
      const url = jobId ? `/api/documents?jobId=${jobId}` : "/api/documents";
      const res = await axiosInstance.get(url);
      if (res.data?.message === "retrieved successfully") {
        return res.data.data as Document[];
      }
      return [] as Document[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  return {
    documents: query.data || [],
    loading: query.isLoading,
    refetch: query.refetch,
  };
};

export const useApproveDocument = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.post(`/api/documents/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    approve: mutation.mutateAsync,
    loading: mutation.isPending,
  };
};
