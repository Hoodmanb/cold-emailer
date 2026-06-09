import { logger } from "@/utils/logger";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axios";
import { Schedule } from "@/types";
import { IS_QSTASH_ENABLED, getSchedulerEndpoint } from "@/config/qstash";

export const useGetSchedule = () => {
  const [schedule, setSchedule] = useState<Schedule[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchSchedule = useCallback(async (type?: "add" | "update", payload?: any, scheduleID?: string) => {
    if (!IS_QSTASH_ENABLED) {
      // Scheduler UI remains functional; return empty list
      setSchedule([]);
      return;
    }
    setLoading(true);
    try {
      const response =
        type === "add"
          ? await axiosInstance.post(getSchedulerEndpoint(), payload)
          : scheduleID
            ? await axiosInstance.put(`${getSchedulerEndpoint()}/${scheduleID}`, payload)
            : await axiosInstance.get(getSchedulerEndpoint());
      if (response.data?.message === "retrieved successfully") {
        setSchedule(response.data.data);
      }
    } catch (err) {
      logger.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  return { schedule, loading, error, refetch: fetchSchedule };
};
