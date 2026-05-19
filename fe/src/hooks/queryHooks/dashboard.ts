import { useState, useEffect } from "react";
import axiosInstance from "../axios";

export const useGetDashboardStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/api/dashboard/stats");
      setStats(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};
