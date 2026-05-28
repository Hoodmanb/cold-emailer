import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../axios";
import useAuthStore from "@/store/useAuthStore";
import type { BillingConfig, BillingSummary, BillingTransaction, CostEstimate } from "@/types/billing";
import { ApiError } from "@/utils/parseApiError";

export const billingQueryKeys = {
  config: ["billing", "config"] as const,
  status: ["billing", "status"] as const,
  transactions: ["billing", "transactions"] as const,
};

function normalizeBillingState(data: any): BillingSummary {
  return {
    credits: data?.credits ?? 0,
    gatewayAccess: data?.gatewayAccess ?? {
      isActive: false,
      expiresAt: null,
      activatedAt: null,
      paid: false,
    },
    activeSubscription: data?.activeSubscription ?? null,
    transactions: data?.transactions ?? [],
    creditExpiryBuckets: data?.creditExpiryBuckets ?? [],
    schemaVersion: data?.schemaVersion ?? 1,
    metadata: data?.metadata ?? {},
    // Preserve any other fields
    ...data,
  };
}

export function useBillingConfig() {
  return useQuery({
    queryKey: billingQueryKeys.config,
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/billing/config", {
        headers: { "X-Bypass-Global-Toast": "true" },
      });
      return data.data as BillingConfig;
    },
    staleTime: 60_000,
  });
}

export function useBillingStatus() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  return useQuery({
    queryKey: billingQueryKeys.status,
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/billing/status", {
        headers: { "X-Bypass-Global-Toast": "true" },
      });
      return normalizeBillingState(data.data);
    },
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status = error instanceof ApiError ? error.statusCode : undefined;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    enabled: typeof window !== "undefined" && hasHydrated && isAuthenticated,
  });
}

export function useBillingSummary() {
  const { data, ...rest } = useBillingStatus();
  return { summary: data, ...rest };
}

export function useBillingTransactions() {
  return useQuery({
    queryKey: billingQueryKeys.transactions,
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/billing/transactions", {
        headers: { "X-Bypass-Global-Toast": "true" },
      });
      return data.data as BillingTransaction[];
    },
  });
}

export function useEstimateCost() {
  return useMutation({
    mutationFn: async (payload: { featureId: string; tailoringLevel?: string }) => {
      const { data } = await axiosInstance.post("/api/billing/estimate", payload, {
        headers: { "X-Bypass-Global-Toast": "true" },
      });
      return data.data as CostEstimate;
    },
  });
}

export function useCheckoutGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post("/api/billing/checkout/gateway");
      return data.data as { authorizationUrl: string; reference: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingQueryKeys.status });
    },
  });
}

export function useCheckoutCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (packId: string) => {
      const { data } = await axiosInstance.post("/api/billing/checkout/credits", { packId });
      return data.data as { authorizationUrl: string; reference: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingQueryKeys.status });
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reference: string) => {
      const { data } = await axiosInstance.post("/api/billing/verify", { reference });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingQueryKeys.status });
      qc.invalidateQueries({ queryKey: billingQueryKeys.transactions });
    },
  });
}

export function formatMoney(amount: number, currency = "NGN") {
  const major = amount / 100;
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
}
