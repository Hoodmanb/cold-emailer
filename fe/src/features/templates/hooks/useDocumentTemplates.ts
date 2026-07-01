import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import type {
  DocumentTemplate,
  DocumentTemplateListResponse,
  DocumentTemplateType,
} from "../types/template.types";
import { normalizeTemplateListResponse } from "../utils/normalizeListResponse";
import { templateQueryKeys } from "./queryKeys";

async function fetchDocumentTemplates(
  path: string,
  params?: Record<string, string>,
): Promise<DocumentTemplateListResponse> {
  const res = await axiosInstance.get(path, { params });
  return normalizeTemplateListResponse(res.data?.data);
}

export function useDocumentTemplates(type?: DocumentTemplateType | string) {
  return useQuery({
    queryKey: templateQueryKeys.list(type),
    queryFn: () => {
      const params = type ? { type } : undefined;
      return fetchDocumentTemplates("/api/document-templates", params);
    },
  });
}

export function usePublicDocumentTemplates(type?: DocumentTemplateType | string) {
  return useQuery({
    queryKey: templateQueryKeys.public(type),
    queryFn: () => {
      const params: Record<string, string> = {};
      if (type) params.type = type;
      return fetchDocumentTemplates("/api/document-templates/public", params);
    },
  });
}

export function useStarredDocumentTemplates() {
  return useQuery({
    queryKey: templateQueryKeys.starred(),
    queryFn: () => fetchDocumentTemplates("/api/document-templates/starred"),
  });
}

export function useStarDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await axiosInstance.post(`/api/document-templates/${templateId}/star`);
      return res.data?.data?.starredIds as string[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
    },
  });
}

export function useUnstarDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await axiosInstance.delete(`/api/document-templates/${templateId}/star`);
      return res.data?.data?.starredIds as string[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
    },
  });
}

export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DocumentTemplate>) => {
      const res = await axiosInstance.post("/api/document-templates", payload);
      return res.data?.data as DocumentTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
    },
  });
}

export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<DocumentTemplate> }) => {
      const res = await axiosInstance.put(`/api/document-templates/${id}`, payload);
      return res.data?.data as DocumentTemplate;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.detail(variables.id) });
    },
  });
}

export function useApproveDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await axiosInstance.post(`/api/document-templates/${templateId}/approve`);
      return res.data?.data as DocumentTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
    },
  });
}

export function useRejectDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await axiosInstance.post(`/api/document-templates/${id}/reject`, { reason });
      return res.data?.data as DocumentTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
    },
  });
}

export function usePendingDocumentTemplates() {
  return useQuery({
    queryKey: templateQueryKeys.pending(),
    queryFn: async () => {
      const res = await axiosInstance.get("/api/document-templates/pending");
      const normalized = normalizeTemplateListResponse(res.data?.data);
      return { templates: normalized.templates };
    },
  });
}

export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await axiosInstance.delete(`/api/document-templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await axiosInstance.post(`/api/document-templates/${templateId}/submit-review`);
      return res.data?.data as DocumentTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.all });
    },
  });
}

export function usePreviewDocumentTemplate(templateId: string | null) {
  return useQuery({
    queryKey: templateQueryKeys.preview(templateId),
    queryFn: async () => {
      if (!templateId) return null;
      const res = await axiosInstance.get(`/api/document-templates/${templateId}/preview`);
      return res.data?.data?.html as string;
    },
    enabled: Boolean(templateId),
  });
}

export function useDocumentTemplate(templateId: string | null) {
  return useQuery({
    queryKey: templateQueryKeys.detail(templateId),
    queryFn: async () => {
      if (!templateId) return null;
      try {
        const res = await axiosInstance.get(`/api/document-templates/${templateId}`);
        return res.data?.data as DocumentTemplate;
      } catch {
        const res = await axiosInstance.get(`/api/system-templates/${templateId}`);
        const sys = res.data?.data;
        if (!sys) return null;
        return {
          id: sys.id,
          name: sys.name,
          type: sys.category,
          category: sys.category,
          layout: sys.layout,
          blocks: sys.blocks,
          style: sys.style,
          isAdminTemplate: true,
          isPublic: true,
          status: "approved",
          approvalStatus: "approved",
          lifecycle: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as DocumentTemplate;
      }
    },
    enabled: Boolean(templateId),
    retry: 1,
  });
}

export function useGetPreviewData() {
  return useQuery({
    queryKey: ["admin-preview-data"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/admin/document-templates/preview-data");
      return res.data?.data;
    },
  });
}

export function useUpdatePreviewData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await axiosInstance.put("/api/admin/document-templates/preview-data", payload);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-preview-data"] });
    },
  });
}
