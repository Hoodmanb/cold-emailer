import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import type { EmailTemplate } from "../types/template.types";
import { templateQueryKeys } from "./queryKeys";

type LegacyEmailRow = EmailTemplate & { id?: string };

function mapEmailRow(item: LegacyEmailRow): EmailTemplate {
  const id = item.id || item._id || "";
  return {
    ...item,
    id,
    _id: id,
    approvalStatus: item.approvalStatus || "approved",
  };
}

async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const response = await axiosInstance.get("/api/template");
  if (response.data?.message === "retrieved successfully") {
    return (response.data.data || []).map((item: LegacyEmailRow) => mapEmailRow(item));
  }
  const data = response.data?.data;
  if (Array.isArray(data)) return data.map(mapEmailRow);
  if (data?.items) return (data.items as LegacyEmailRow[]).map(mapEmailRow);
  return [];
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: templateQueryKeys.email,
    queryFn: fetchEmailTemplates,
  });
}

/** @deprecated Use useEmailTemplates — backward-compatible alias */
export function useGetTemplates() {
  const query = useEmailTemplates();
  return {
    template: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EmailTemplate>) => {
      const res = await axiosInstance.post("/api/template", payload);
      return mapEmailRow(res.data?.data || res.data?.template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.email });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<EmailTemplate> }) => {
      const res = await axiosInstance.put(`/api/template/${id}`, payload);
      return mapEmailRow(res.data?.data || res.data?.template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.email });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/template/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.email });
    },
  });
}
