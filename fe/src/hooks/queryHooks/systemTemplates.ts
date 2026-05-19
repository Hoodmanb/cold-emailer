import { logger } from "@/utils/logger";
import { useState, useEffect } from "react";
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

export const useGetSystemTemplates = () => {
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance("/api/system-templates");
      if (response.data?.data) {
        setTemplates(response.data.data);
      }
    } catch (err) {
      logger.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return { templates, loading, error, refetch: fetchTemplates };
};
