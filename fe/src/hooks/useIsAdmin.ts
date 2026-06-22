import { useEffect, useState } from "react";
import useAuthStore from "@/store/useAuthStore";

interface UseIsAdminResult {
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

export function useIsAdmin(): UseIsAdminResult {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Read from Zustand store — single source of truth for authenticated user
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    // Wait for Zustand persist hydration before checking role
    if (!hasHydrated) {
      setLoading(true);
      return;
    }

    try {
      const role = user?.role;
      setIsAdmin(role === "admin");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user, hasHydrated]);

  return { isAdmin, loading, error };
}