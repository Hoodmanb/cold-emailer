import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../axios";

export type SystemTemplateSupport = {
  ats: boolean;
  multiPage: boolean;
  coverLetter: boolean;
};

export type TemplateLayout = {
  type: "single-column" | "two-column";
  blocks?: string[];
  columns?: { width: string; blocks: string[] }[];
};

export type TemplateBlock = {
  type: string;
  title?: string;
};

export type TemplateStyle = {
  fontFamily?: string;
  primaryColor?: string;
  fontSize?: number;
  spacing?: number;
  theme?: string;
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
  // Full template data for document builder
  layout?: TemplateLayout;
  blocks?: Record<string, TemplateBlock>;
  style?: TemplateStyle;
};

export const systemTemplatesQueryKeys = {
  all: ["system-templates"] as const,
  detail: (id: string) => [...systemTemplatesQueryKeys.all, id] as const,
};

export const useGetSystemTemplates = () => {
  const query = useQuery({
    queryKey: systemTemplatesQueryKeys.all,
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
    queryKey: systemTemplatesQueryKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) return null;
      const response = await axiosInstance(`/api/system-templates/${id}`);
      return response.data?.data as SystemTemplate;
    },
    enabled: Boolean(id),
    retry: 2,
    staleTime: 30_000,
  });

  return {
    template: query.data,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};
