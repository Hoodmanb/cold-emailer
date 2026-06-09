import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../axios";
import type { LibraryDocument } from "@/components/attachments/AttachmentPicker";

export const attachmentQueryKeys = {
  library: ["document-library"] as const,
  byParent: (parentId: string, parentType: string) =>
    ["attachments", parentId, parentType] as const,
};

export function useDocumentLibrary() {
  const query = useQuery({
    queryKey: attachmentQueryKeys.library,
    queryFn: async () => {
      const res = await axiosInstance.get("/api/attachment/library");
      return (res.data?.data || []) as LibraryDocument[];
    },
    staleTime: 30_000,
  });

  return {
    documents: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAttachments(parentId?: string, parentType?: string) {
  const query = useQuery({
    queryKey: attachmentQueryKeys.byParent(parentId || "", parentType || ""),
    enabled: Boolean(parentId && parentType),
    queryFn: async () => {
      const res = await axiosInstance.get("/api/attachment", {
        params: { parentId, parentType },
      });
      return res.data?.data || [];
    },
  });

  return {
    attachments: query.data || [],
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
