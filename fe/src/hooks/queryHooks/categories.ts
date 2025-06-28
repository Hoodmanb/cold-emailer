import { useState, useEffect } from "react";
import axiosInstance from "@/hooks/axios";

type CategoryProp = {
  category: string;
  _id: string;
};

export const useFetchCategory = (url: string) => {
  const [categories, setCategories] = useState<CategoryProp[]>([]);
  const [loadingFetch, setLoadingFetch] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const fetchData = async () => {
    setLoadingFetch(true);
    try {
      const response = await axiosInstance.get(url);
      if (response.data?.message === "retrieved successfully") {
        setCategories(response.data.data);
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

  return { categories, loadingFetch, error, refetchCategories: fetchData };
};
