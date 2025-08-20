import { useState, useEffect } from "react";
import axiosInstance from "../axios";
import { Schedule } from "../../../types";

export const useGetSchedule = () => {
  const [schedule, setSchedule] = useState<Schedule[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance("/api/schedule");
      if (response.data?.message === "retrieved successfully") {
        setSchedule(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return { schedule, loading, error, refetch: fetchSchedule };
};
