import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/hooks/axios";
import type { TemplateLayout, TemplateBlock, TemplateStyle } from "../types/template.types";
import { templateQueryKeys } from "./queryKeys";

export type SystemTemplateSupport = {
  ats: boolean;
  multiPage: boolean;
  coverLetter: boolean;
};

export type SystemTemplate = {
  id: string;
  slug: string;
  name: string;
  category: string;
  theme: string;
  preview: string;
  description: string;
  version: number;
  engine: string;
  tags: string[];
  supportedDocuments: string[];
  premium: boolean;
  supports: SystemTemplateSupport;
  layout?: TemplateLayout;
  blocks?: Record<string, TemplateBlock>;
  style?: TemplateStyle;
};

export const useGetSystemTemplates = () => {
  const query = useQuery({
    queryKey: templateQueryKeys.system,
    queryFn: async () => {
      const response = await axiosInstance("/api/system-templates");
      return (response.data?.data || []) as SystemTemplate[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  return {
    templates: query.data || [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};

export const useGetSystemTemplate = (id: string | null) => {
  const query = useQuery({
    queryKey: templateQueryKeys.systemDetail(id || ""),
    queryFn: async () => {
      if (!id) return null;
      const response = await axiosInstance(`/api/system-templates/${id}`);
      return response.data?.data as SystemTemplate;
    },
    enabled: Boolean(id),
    retry: 1,
  });

  return {
    template: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};
