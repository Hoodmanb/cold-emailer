import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../axios";

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
};

export const systemTemplatesQueryKeys = {
  all: ["system-templates"] as const,
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
