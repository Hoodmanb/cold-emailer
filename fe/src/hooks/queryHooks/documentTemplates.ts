import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../axios";
import type { DocumentTemplate, DocumentTemplateListResponse, DocumentTemplateType } from "@/types/documentTemplate";

const QUERY_KEY = ["document-templates"];

export function useDocumentTemplates(type?: DocumentTemplateType | string) {
  return useQuery({
    queryKey: [...QUERY_KEY, type || "all"],
    queryFn: async () => {
      const params = type ? { type } : {};
      const res = await axiosInstance.get("/api/document-templates", { params });
      const data = res.data?.data as DocumentTemplateListResponse;
      return {
        templates: data?.templates || [],
        starredIds: data?.starredIds || [],
      };
    },
  });
}

export function usePublicDocumentTemplates(type?: DocumentTemplateType | string) {
  return useQuery({
    queryKey: [...QUERY_KEY, "public", type || "all"],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (type) params.type = type;
      const res = await axiosInstance.get("/api/document-templates/public", { params });
      const data = res.data?.data as DocumentTemplateListResponse;
      return {
        templates: data?.templates || [],
        starredIds: data?.starredIds || [],
      };
    },
  });
}

export function useStarredDocumentTemplates() {
  return useQuery({
    queryKey: [...QUERY_KEY, "starred"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/document-templates/starred");
      const data = res.data?.data as DocumentTemplateListResponse;
      return {
        templates: data?.templates || [],
        starredIds: data?.starredIds || [],
      };
    },
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
