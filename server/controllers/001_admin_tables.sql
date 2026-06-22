-- 1. AI Usage Logs (Usage & Analytics)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens int4 DEFAULT 0,
  output_tokens int4 DEFAULT 0,
  total_tokens int4 DEFAULT 0,
  actual_provider_cost numeric(12, 6) DEFAULT 0,
  charged_credits numeric(12, 4) DEFAULT 0,
  input_price_used numeric(12, 6) DEFAULT 0,
  output_price_used numeric(12, 6) DEFAULT 0,
  markup_used numeric(6, 2) DEFAULT 0,
  credit_value_used numeric(10, 4) DEFAULT 0,
  request_type text, -- e.g., 'resume_generation'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Model Catalog (Custom Models Management)
CREATE TABLE IF NOT EXISTS model_catalog (
  id text PRIMARY KEY DEFAULT 'model-catalog', -- Single record for catalog config
  "customModels" jsonb DEFAULT '{}'::jsonb, -- Map of provider -> array of model objects
  updated_at timestamptz DEFAULT now()
);

-- 3. Billing Settings (Global Pricing Config)
CREATE TABLE IF NOT EXISTS billing_settings (
  id text PRIMARY KEY DEFAULT 'billing-config',
  "versionId" text,
  credit_value_usd numeric(10, 4) DEFAULT 0.01,
  minimum_credit_charge numeric(10, 2) DEFAULT 1.0,
  global_ai_markup_multiplier numeric(6, 2) DEFAULT 4.0,
  "providerModelMarkup" jsonb DEFAULT '{}'::jsonb,
  "featureCosts" jsonb DEFAULT '{}'::jsonb,
  minimum_ai_charge_credits int4 DEFAULT 1,
  minimum_feature_charge_credits int4 DEFAULT 0,
  percentage_bonus_on_purchase numeric(6, 2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- 4. Transactions (Payment Logs)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'gateway' or 'credits'
  status text DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  amount numeric(12, 2) NOT NULL,
  currency text DEFAULT 'NGN',
  reference text UNIQUE,
  "paystackReference" text,
  "paystackData" jsonb DEFAULT '{}'::jsonb,
  "authorizationUrl" text,
  "packId" text,
  credits int4,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- 5. AI Settings (User Preference Feature Mapping)
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}'::jsonb, -- Contains apiKeys and featureMap
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Gateway Settings (Subscription Config)
CREATE TABLE IF NOT EXISTS gateway_settings (
  id text PRIMARY KEY DEFAULT 'gateway-config',
  price numeric(12, 2) DEFAULT 9900,
  currency text DEFAULT 'NGN',
  "durationMonths" int4 DEFAULT 12,
  active boolean DEFAULT true,
  "updatedAt" timestamptz DEFAULT now()
);

-- 7. Credit Packs (Store Items)
CREATE TABLE IF NOT EXISTS credit_packs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  amount int4 NOT NULL,
  price numeric(12, 2) NOT NULL,
  currency text DEFAULT 'NGN',
  active boolean DEFAULT true,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- 8. Model Pricing (Granular Provider Costs)
CREATE TABLE IF NOT EXISTS model_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL,
  model text NOT NULL, -- Can be '*' for wildcards
  input_cost_per_million numeric(12, 6) DEFAULT 0,
  output_cost_per_million numeric(12, 6) DEFAULT 0,
  markup_multiplier numeric(6, 2) DEFAULT 1.0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider, model)
);

-- Enable RLS for Admin Tables (Example: Only authenticated admins can read all)
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_access ON ai_usage_logs FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_full_access ON billing_settings FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY admin_full_access ON model_pricing FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');