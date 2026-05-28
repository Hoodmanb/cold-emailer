import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../axios";

export type RecipientProp = {
  name: string;
  email: string;
  category: string;
  _id: string;
};

export const recipientsQueryKeys = {
  all: ["recipients"] as const,
  single: (email?: string) => ["recipients", email || ""] as const,
};

export const useGetRecipients = () => {
  const query = useQuery({
    queryKey: recipientsQueryKeys.all,
    queryFn: async () => {
      const response = await axiosInstance("/api/recipient");
      if (response.data?.message === "retrieved successfully") {
        return (response.data.data || []).map((item: any) => ({
          ...item,
          _id: item.id || item._id,
        })) as RecipientProp[];
      }
      return [] as RecipientProp[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  return {
    recipient: query.data,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};

export const useGetSingleRecipient = (email?: string) => {
  const query = useQuery({
    queryKey: recipientsQueryKeys.single(email),
    queryFn: async () => {
      if (!email) return undefined;
      const response = await axiosInstance(`/api/recipient/${email}`);
      if (response.data?.message === "retrieved successfully") {
        return response.data.data as RecipientProp;
      }
      return undefined;
    },
    enabled: !!email,
    retry: 2,
    staleTime: 30_000,
  });

  return {
    singleRecipient: query.data,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};
