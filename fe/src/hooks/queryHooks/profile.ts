import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../axios";
import type { UserProfile, AIModel } from "@/types";

export const profileQueryKeys = {
  profile: ["profile"] as const,
  projects: ["profile", "projects"] as const,
  models: ["ai", "models"] as const,
};

const EMPTY_ARRAY: any[] = [];

export const useGetProfile = () => {
  const query = useQuery({
    queryKey: profileQueryKeys.profile,
    queryFn: async () => {
      const res = await axiosInstance.get("/api/profile");
      if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
        throw new Error(res.data?.message || "Could not load profile");
      }
      return (res.data?.data || {}) as Partial<UserProfile>;
    },
  });

  return {
    profile: query.data,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
};

export const useProjects = () => {
  const query = useQuery({
    queryKey: profileQueryKeys.projects,
    queryFn: async () => {
      console.log("[useProjects] queryFn executing...");
      const res = await axiosInstance.get("/api/profile/projects");
      
      console.log("[useProjects] API response received:", {
        status: res.status,
        success: res.data?.success,
        count: res.data?.meta?.count,
      });

      if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
        throw new Error(res.data?.message || "Could not load projects");
      }
      return (res.data?.data || []) as NonNullable<UserProfile["projects"]>;
    },
    // placeholderData: [], // Use placeholder instead of initialData if you want default [] while loading
  });

  console.log(`[useProjects] Hook render | status: ${query.status} | fetchStatus: ${query.fetchStatus} | isFetching: ${query.isFetching}`);

  return {
    data: query.data || EMPTY_ARRAY,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    status: query.status,
  };
}

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await axiosInstance.post("/api/profile/projects", payload);
      if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
        throw new Error(res.data?.message || "Unable to create project");
      }
      return res.data?.data;
    },
    onSuccess: async (created) => {
      queryClient.setQueryData(profileQueryKeys.projects, (prev: any[] = []) => [...prev, created]);
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.projects });
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await axiosInstance.put(`/api/profile/projects/${id}`, payload);
      if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
        throw new Error(res.data?.message || "Unable to update project");
      }
      return res.data?.data;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKeys.projects });
      const previous = queryClient.getQueryData<any[]>(profileQueryKeys.projects) || [];
      queryClient.setQueryData(profileQueryKeys.projects, previous.map((row) => (row.id === id ? { ...row, ...payload } : row)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(profileQueryKeys.projects, context.previous);
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        profileQueryKeys.projects,
        (prev: any[] = []) => prev.map((row) => (row.id === updated.id ? updated : row))
      );
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.projects });
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/api/profile/projects/${id}`);
      if (res.status < 200 || res.status >= 300 || res.data?.success === false) {
        throw new Error(res.data?.message || "Unable to delete project");
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKeys.projects });
      const previous = queryClient.getQueryData<any[]>(profileQueryKeys.projects) || [];
      queryClient.setQueryData(profileQueryKeys.projects, previous.filter((row) => row.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(profileQueryKeys.projects, context.previous);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.projects });
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile });
    },
  });
};

export const useGetModels = () => {
  const query = useQuery({
    queryKey: profileQueryKeys.models,
    queryFn: async () => {
      const res = await axiosInstance.get("/api/ai/models");
      return (res.data?.data || []) as AIModel[];
    },
  });

  return {
    models: query.data || EMPTY_ARRAY,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
