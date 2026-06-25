export type BillingType = "gateway" | "token";

export interface GatewayAccess {
  isActive: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  paid: boolean;
  daysRemaining?: number | null;
  monthlyCredits?: number;
  lastCreditCycle?: string | null;
}

export interface CreditExpiryBucket {
  id: string;
  amount: number;
  remaining: number;
  purchasedAt: string;
  expiresAt: string;
  status: "active" | "expired";
}

export interface BillingSummary {
  billingType: BillingType;
  gatewayAccess: GatewayAccess;
  credits: number;
  walletCredits?: number;
  monthlyCreditAllowance?: number;
  nextMonthlyCreditReset?: string | null;
  creditExpiryBuckets: CreditExpiryBucket[];
  hasAccess: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  amount: number;
  price: number;
  currency: string;
}

export interface BillingConfig {
  gateway: {
    price: number;
    currency: string;
    durationMonths: number;
    active: boolean;
  };
  creditPacks: CreditPack[];
  featureCosts: Array<{
    featureId: string;
    baseCost: number;
    tailoringMultipliers: Record<string, number>;
  }>;
  paystackPublicKey: string;
}

export interface BillingTransaction {
  id: string;
  userId: string;
  type: "gateway" | "credits";
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
  completedAt?: string;
}

export interface CostEstimate {
  featureId: string;
  estimatedCost: number;
  currentBalance: number;
  remainingAfter: number;
}
