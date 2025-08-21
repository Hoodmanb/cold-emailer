import { useState, useEffect } from "react";
import axiosInstance from "../axios";
type RecipientProp = {
  name: string;
  email: string;
  category: string;
  _id: string;
};
export const useGetRecipients = () => {
  const [recipient, setRecipient] = useState<RecipientProp[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchRecipient = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance("/api/recipient");
      if (response.data?.message === "retrieved successfully") {
        setRecipient(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipient();
  }, []);

  return { recipient, loading, error, refetch: fetchRecipient };
};

export const useGetSingleRecipient = (email?:string) => {
  const [singleRecipient, setSingleRecipient] = useState<RecipientProp>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchSingleRecipient = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance(`/api/recipient/${email}`);
      if (response.data?.message === "retrieved successfully") {
        setSingleRecipient(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSingleRecipient();
  }, []);

  return { singleRecipient, loading, error, refetch: fetchSingleRecipient };
};
