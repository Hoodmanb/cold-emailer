import axiosInstance from "@/hooks/axios";

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data;
}

export const adminApi = {
  get: <T>(path: string) =>
    unwrap<T>(
      axiosInstance.get(path, { headers: { "X-Bypass-Global-Toast": "true" } }),
    ),

  put: <T>(path: string, body: unknown) =>
    unwrap<T>(axiosInstance.put(path, body)),

  post: <T>(path: string, body?: unknown) =>
    unwrap<T>(axiosInstance.post(path, body)),

  delete: <T>(path: string, params?: Record<string, string>) =>
    unwrap<T>(
      axiosInstance.delete(path, {
        params,
        headers: { "X-Bypass-Global-Toast": "true" },
      }),
    ),
};

export type BillingConfig = {
  id?: string;
  versionId?: string;
  credit_value_usd: number;
  minimum_credit_charge: number;
  global_ai_markup_multiplier: number;
  providerModelMarkup: Record<string, Record<string, number>>;
  featureCosts: Record<string, number>;
  minimum_ai_charge_credits: number;
  minimum_feature_charge_credits: number;
  percentage_bonus_on_purchase: number;
  updated_at?: string;
};

export type ProviderModelEntry = {
  provider: string;
  model: string;
  markup: number;
  active: boolean;
};

export type ModelCatalogGroup = {
  provider: string;
  models: Array<{ id: string; name: string; source?: "baseline" | "custom" }>;
};

export type ModelCatalog = {
  providers: string[];
  groups: ModelCatalogGroup[];
};

export type ModelVerificationResult = {
  valid: boolean;
  message: string;
  upstreamName?: string;
  provider?: string;
  model?: string;
};

export type FeatureEntry = {
  name: string;
  cost: number;
  custom?: boolean;
};

export type AdminAnalytics = {
  lifetime: {
    totalProviderCost: number;
    totalCreditsConsumed: number;
    revenueGenerated: number;
    estimatedProfit: number;
  };
  today: { providerCost: number; creditsConsumed: number };
  thisMonth: { providerCost: number; creditsConsumed: number };
  mostUsedModels: Array<{ model: string; count: number }>;
  totalRequests: number;
  avgCostPerRequest: number;
};

export type UsageLog = {
  id: string;
  user_id: string;
  provider: string;
  model: string;
  actual_provider_cost: number;
  charged_credits: number;
  created_at: string;
  metadata?: {
    feature_id?: string;
    feature_cost?: number;
    token_cost?: number;
    total_cost?: number;
  };
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  billingType: string;
  credits: number;
  role: string;
};

export type GatewayConfig = {
  price: number;
  currency: string;
  durationMonths: number;
  active: boolean;
};

export type CreditPack = {
  id: string;
  name: string;
  amount: number;
  price: number;
  currency: string;
  active: boolean;
};

export type AdminTransaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  userId: string;
  createdAt: string;
};

export const CORE_FEATURES = [
  "scheduling",
  "ats_analysis",
  "resume_generation",
  "document_analysis",
  "email_generation",
  "chat",
];

export function isKnownProviderModel(
  catalog: ModelCatalog | undefined,
  provider: string,
  model: string,
) {
  if (!catalog || !provider || !model) return false;
  return catalog.groups.some(
    (group) =>
      group.provider === provider && group.models.some((entry) => entry.id === model),
  );
}

export function getModelsForProvider(catalog: ModelCatalog, provider: string) {
  return catalog.groups.find((group) => group.provider === provider)?.models ?? [];
}

export function findNextAvailableProviderModel(
  catalog: ModelCatalog,
  rows: ProviderModelEntry[],
) {
  for (const group of catalog.groups) {
    for (const model of group.models) {
      const taken = rows.some(
        (row) => row.provider === group.provider && row.model === model.id,
      );
      if (!taken) {
        return { provider: group.provider, model: model.id };
      }
    }
  }
  return null;
}

export function configToProviderRows(config: BillingConfig): ProviderModelEntry[] {
  const rows: ProviderModelEntry[] = [];
  Object.entries(config.providerModelMarkup || {}).forEach(([provider, models]) => {
    Object.entries(models).forEach(([model, markup]) => {
      rows.push({ provider, model, markup, active: true });
    });
  });
  return rows;
}

export function configToFeatureRows(config: BillingConfig): FeatureEntry[] {
  // Ensure all core features appear with cost (default 0) and marked as non-custom
  const coreRows: FeatureEntry[] = CORE_FEATURES.map((name) => ({
    name,
    cost: config.featureCosts?.[name] ?? 0,
    custom: false,
  }));

  // Add any custom feature costs that are not core features
  const customRows: FeatureEntry[] = Object.entries(config.featureCosts || {})
    .filter(([name]) => !CORE_FEATURES.includes(name))
    .map(([name, cost]) => ({
      name,
      cost: Number(cost),
      custom: true,
    }));

  return [...coreRows, ...customRows];
}

export function rowsToConfig(
  base: BillingConfig,
  providers: ProviderModelEntry[],
  features: FeatureEntry[],
): BillingConfig {
  const providerModelMarkup: Record<string, Record<string, number>> = {};
  providers.forEach((p) => {
    if (!p.active || !p.provider || !p.model) return;
    if (!providerModelMarkup[p.provider]) providerModelMarkup[p.provider] = {};
    providerModelMarkup[p.provider][p.model] = p.markup;
  });

  const featureCosts: Record<string, number> = {};
  features.forEach((f) => {
    if (f.name) featureCosts[f.name] = f.cost;
  });

  return { ...base, providerModelMarkup, featureCosts };
}
