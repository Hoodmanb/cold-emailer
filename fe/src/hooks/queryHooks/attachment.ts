import { useState, useEffect } from "react";
import axiosInstance from "@/hooks/axios";

type AttachmentProp = {
  name: string;
  isPublic: boolean;
  url: string;
  _id: string;
};

export const useFetchAttachment = (url: string) => {
  const [attachment, setAttachment] = useState<AttachmentProp[]>([]);
  const [loadingFetch, setLoadingFetch] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const fetchData = async () => {
    setLoadingFetch(true);
    try {
      const response = await axiosInstance.get(url);
      if (response.data?.message === "retrieved successfully") {
        setAttachment(response.data.data);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoadingFetch(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { attachment, loadingFetch, error, refetchAttachment: fetchData };
};
