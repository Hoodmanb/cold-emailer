import { logger } from "@/utils/logger";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axios";
type TemplateProp = {
  name: string;
  _id: string;
  subject: string;
  body: string;
  url?: string;
  isPublic: boolean;
};
export const useGetTemplates = () => {
  const [template, setTemplate] = useState<TemplateProp[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/template");
      if (response.data?.message === "retrieved successfully") {
        setTemplate(
          (response.data.data || []).map((item: any) => ({
            ...item,
            _id: item.id || item._id,
          }))
        );
      }
    } catch (err) {
      logger.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplate();
  }, [fetchTemplate]);

  return { template, loading, error, refetch: fetchTemplate };
};
