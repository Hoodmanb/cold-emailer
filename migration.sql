/* ==============================================================
   migration.sql – Corrected & Audited Supabase Migration
   Run this once in the Supabase SQL Editor on a fresh database.
   ============================================================== */

/* ==============================================================
   1.  Extensions
   ============================================================== */
create extension if not exists "uuid-ossp";


/* ==============================================================
   2.  Core User / Auth Tables
   ============================================================== */
-- Supabase Auth manages auth.users automatically.
-- profiles extends auth.users with application-level data.
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  data        jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

/* ==============================================================
   3.  Domain Tables
   ============================================================== */

-- ── Projects & Jobs ───────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  meta        jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists jobs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete cascade,
  status      text not null default 'pending',
  payload     jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Email ─────────────────────────────────────────────────────
create table if not exists emails (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  to_email    text not null,
  subject     text,
  body        text,
  sent_at     timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Renamed from email_templates → templates (matches templateRepository.js table 'templates')
create table if not exists templates (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  subject     text,
  body        text,
  type        text,           -- e.g. 'email', 'proposal'
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Documents ─────────────────────────────────────────────────
create table if not exists document_templates (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  content     jsonb,
  is_global   boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists documents (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text,
  metadata     jsonb,
  storage_path text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Uploads / Attachments (Cloudinary metadata) ───────────────
create table if not exists uploads (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  public_id      text not null,
  url            text not null,
  format         text,
  resource_type  text not null default 'image',
  bytes          bigint,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists attachments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  public_id   text not null,
  url         text not null,
  format      text,
  bytes       bigint,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Artifacts (metadata for generated files) ──────────────────
create table if not exists artifacts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  filename     text,
  mime_type    text,
  storage_path text,
  metadata     jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Chats ─────────────────────────────────────────────────────
create table if not exists chats (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  sessions    jsonb not null default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Categories ────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Email Recipients ──────────────────────────────────────────
-- Note: recipientRepository uses table 'recipients'
create table if not exists recipients (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Schedules ─────────────────────────────────────────────────
create table if not exists schedules (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  cron_expr   text not null,
  task_data   jsonb,
  next_run    timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Billing / Credits ─────────────────────────────────────────
-- Transactions table (used by billingRepository)
-- Columns match the camelCase fields written by createTransaction()
create table if not exists transactions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references auth.users(id) on delete cascade,
  type                  text not null,
  amount                numeric,
  status                text not null default 'pending',
  reference             text,
  "paystackReference"   text,
  "authorizationUrl"    text,
  description           text,
  "createdAt"           timestamptz default now(),
  "updatedAt"           timestamptz default now()
);

-- credit_packs: global catalog (no user_id)
-- Columns match billingRepository createCreditPack()
create table if not exists credit_packs (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  amount      integer not null,
  price       integer not null,
  currency    text not null default 'NGN',
  active      boolean not null default true,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- credits_wallets (walletRepository uses 'credits_wallets')
-- Columns: user_id, balance, total_purchased, total_consumed
create table if not exists credits_wallets (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  balance          integer not null default 0,
  total_purchased  integer not null default 0,
  total_consumed   integer not null default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- credit_transactions (walletRepository uses 'credit_transactions')
-- Columns: user_id, wallet_id, type, amount, balance_before, balance_after, reference, description
create table if not exists credit_transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  wallet_id       uuid references credits_wallets(id) on delete cascade,
  type            text,
  amount          numeric,
  balance_before  numeric,
  balance_after   numeric,
  reference       text,
  description     text,
  created_at      timestamptz default now()
);

-- ── Gateway / Billing Settings ────────────────────────────────
-- gateway_settings: global singleton config (no user_id)
create table if not exists gateway_settings (
  id          text primary key,   -- single-row keyed by 'gateway-config'
  price       integer,
  currency    text,
  "durationMonths" integer,
  active      boolean,
  "updatedAt" timestamptz default now(),
  config      jsonb not null default '{}'
);

create table if not exists billing_settings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  config      jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── AI Settings ───────────────────────────────────────────────
-- aiRepository uses table 'ai_settings' with columns: user_id, settings (jsonb)
create table if not exists ai_settings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  settings    jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- model_catalog: global single-row catalog used by modelCatalogRepository
create table if not exists model_catalog (
  id              text primary key,       -- 'model-catalog'
  "customModels"  jsonb not null default '{}',
  updated_at      timestamptz default now()
);

-- model_pricing: used by pricingRepository (table 'model_pricing')
-- Columns: provider, model, input_cost_per_million, output_cost_per_million, markup_multiplier, active
create table if not exists model_pricing (
  id                      uuid primary key default uuid_generate_v4(),
  provider                text not null,
  model                   text not null,
  input_cost_per_million  numeric not null default 0,
  output_cost_per_million numeric not null default 0,
  markup_multiplier       numeric not null default 1.0,
  active                  boolean not null default true,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ai_usage_logs: used by usageLogRepository
-- Columns match createUsageLog() exactly
create table if not exists ai_usage_logs (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  provider              text,
  model                 text,
  input_tokens          integer not null default 0,
  output_tokens         integer not null default 0,
  total_tokens          integer not null default 0,
  actual_provider_cost  numeric not null default 0,
  charged_credits       numeric not null default 0,
  input_price_used      numeric not null default 0,
  output_price_used     numeric not null default 0,
  markup_used           numeric not null default 0,
  credit_value_used     numeric not null default 0,
  request_type          text,
  metadata              jsonb not null default '{}',
  created_at            timestamptz default now()
);

-- ── Communication & SMTP ──────────────────────────────────────
create table if not exists communication_settings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  config      jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- smtp_providers: used by smtpRepository (table 'smtp' in legacy; now 'smtp_providers')
-- NOTE: smtpRepository still uses fileStore; added here for future migration.
-- Columns: email, host, port, secure, appPassword, iv, status, isDefault, lastVerifiedAt
create table if not exists smtp_providers (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade,
  email            text,
  host             text not null,
  port             integer not null default 587,
  secure           boolean not null default false,
  "appPassword"    text,
  iv               text,
  status           text not null default 'pending',
  "isDefault"      boolean not null default false,
  "lastVerifiedAt" timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- admin_smtp: used by adminSmtpRepository
-- Columns: name, username, host, port, secure, password, iv, isActive
create table if not exists admin_smtp (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null default '',
  username    text,
  host        text not null,
  port        integer not null default 587,
  secure      boolean not null default false,
  password    text,
  iv          text,
  "isActive"  boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Settings (user settings) ──────────────────────────────────
-- settingsRepository uses table 'settings' with column 'settings' (jsonb)
create table if not exists settings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  settings    jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Feedback ──────────────────────────────────────────────────
create table if not exists feedback (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      integer check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


/* ==============================================================
   4.  Unique Constraints
   ============================================================== */
-- One wallet per user
create unique index if not exists uq_credits_wallets_user on credits_wallets(user_id);

-- One ai_settings row per user
create unique index if not exists uq_ai_settings_user on ai_settings(user_id);

-- One settings row per user
create unique index if not exists uq_settings_user on settings(user_id);

-- One communication_settings row per user
create unique index if not exists uq_comm_settings_user on communication_settings(user_id);

-- One billing_settings row per user
create unique index if not exists uq_billing_settings_user on billing_settings(user_id);

-- One chats row per user
create unique index if not exists uq_chats_user on chats(user_id);


/* ==============================================================
   5.  Indexes
   ============================================================== */
create index if not exists idx_profiles_id             on profiles(id);
create index if not exists idx_projects_user           on projects(user_id);
create index if not exists idx_jobs_user               on jobs(user_id);
create index if not exists idx_jobs_project            on jobs(project_id);
create index if not exists idx_emails_user             on emails(user_id);
create index if not exists idx_templates_user          on templates(user_id);
create index if not exists idx_documents_user          on documents(user_id);
create index if not exists idx_document_templates_user on document_templates(user_id);
create index if not exists idx_uploads_user            on uploads(user_id);
create index if not exists idx_attachments_user        on attachments(user_id);
create index if not exists idx_artifacts_user          on artifacts(user_id);
create index if not exists idx_chats_user              on chats(user_id);
create index if not exists idx_categories_user         on categories(user_id);
create index if not exists idx_recipients_user         on recipients(user_id);
create index if not exists idx_schedules_user          on schedules(user_id);
create index if not exists idx_credits_wallets_user    on credits_wallets(user_id);
create index if not exists idx_credit_transactions_uid on credit_transactions(user_id);
create index if not exists idx_credit_transactions_wlt on credit_transactions(wallet_id);
create index if not exists idx_transactions_user       on transactions(user_id);
create index if not exists idx_transactions_ref        on transactions(reference);
create index if not exists idx_ai_usage_user           on ai_usage_logs(user_id);
create index if not exists idx_ai_settings_user        on ai_settings(user_id);
create index if not exists idx_settings_user           on settings(user_id);
create index if not exists idx_feedback_user           on feedback(user_id);
create index if not exists idx_comm_settings_user      on communication_settings(user_id);
create index if not exists idx_billing_settings_user   on billing_settings(user_id);
create index if not exists idx_smtp_providers_user     on smtp_providers(user_id);
create index if not exists idx_model_pricing_provider  on model_pricing(provider, model);


/* ==============================================================
   6.  updated_at Trigger Function
   ============================================================== */
create or replace function set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


/* ==============================================================
   7.  Triggers – keep updated_at in sync
       Using CREATE OR REPLACE requires PG >= 14; Supabase supports it.
       Using DROP IF EXISTS + CREATE for broader compatibility.
   ============================================================== */

-- Helper macro: creates trigger only if table has updated_at column.
-- We create triggers individually to be explicit.

do $$ begin
  -- profiles
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_updated') then
    create trigger trg_profiles_updated
      before update on profiles
      for each row execute procedure set_updated_at();
  end if;

  -- projects
  if not exists (select 1 from pg_trigger where tgname = 'trg_projects_updated') then
    create trigger trg_projects_updated
      before update on projects
      for each row execute procedure set_updated_at();
  end if;

  -- jobs
  if not exists (select 1 from pg_trigger where tgname = 'trg_jobs_updated') then
    create trigger trg_jobs_updated
      before update on jobs
      for each row execute procedure set_updated_at();
  end if;

  -- emails
  if not exists (select 1 from pg_trigger where tgname = 'trg_emails_updated') then
    create trigger trg_emails_updated
      before update on emails
      for each row execute procedure set_updated_at();
  end if;

  -- templates
  if not exists (select 1 from pg_trigger where tgname = 'trg_templates_updated') then
    create trigger trg_templates_updated
      before update on templates
      for each row execute procedure set_updated_at();
  end if;

  -- document_templates
  if not exists (select 1 from pg_trigger where tgname = 'trg_doc_templates_updated') then
    create trigger trg_doc_templates_updated
      before update on document_templates
      for each row execute procedure set_updated_at();
  end if;

  -- documents
  if not exists (select 1 from pg_trigger where tgname = 'trg_documents_updated') then
    create trigger trg_documents_updated
      before update on documents
      for each row execute procedure set_updated_at();
  end if;

  -- uploads
  if not exists (select 1 from pg_trigger where tgname = 'trg_uploads_updated') then
    create trigger trg_uploads_updated
      before update on uploads
      for each row execute procedure set_updated_at();
  end if;

  -- attachments
  if not exists (select 1 from pg_trigger where tgname = 'trg_attachments_updated') then
    create trigger trg_attachments_updated
      before update on attachments
      for each row execute procedure set_updated_at();
  end if;

  -- artifacts
  if not exists (select 1 from pg_trigger where tgname = 'trg_artifacts_updated') then
    create trigger trg_artifacts_updated
      before update on artifacts
      for each row execute procedure set_updated_at();
  end if;

  -- chats
  if not exists (select 1 from pg_trigger where tgname = 'trg_chats_updated') then
    create trigger trg_chats_updated
      before update on chats
      for each row execute procedure set_updated_at();
  end if;

  -- categories
  if not exists (select 1 from pg_trigger where tgname = 'trg_categories_updated') then
    create trigger trg_categories_updated
      before update on categories
      for each row execute procedure set_updated_at();
  end if;

  -- recipients
  if not exists (select 1 from pg_trigger where tgname = 'trg_recipients_updated') then
    create trigger trg_recipients_updated
      before update on recipients
      for each row execute procedure set_updated_at();
  end if;

  -- schedules
  if not exists (select 1 from pg_trigger where tgname = 'trg_schedules_updated') then
    create trigger trg_schedules_updated
      before update on schedules
      for each row execute procedure set_updated_at();
  end if;

  -- credit_packs
  if not exists (select 1 from pg_trigger where tgname = 'trg_credit_packs_updated') then
    create trigger trg_credit_packs_updated
      before update on credit_packs
      for each row execute procedure set_updated_at();
  end if;

  -- credits_wallets
  if not exists (select 1 from pg_trigger where tgname = 'trg_credits_wallets_updated') then
    create trigger trg_credits_wallets_updated
      before update on credits_wallets
      for each row execute procedure set_updated_at();
  end if;

  -- ai_settings
  if not exists (select 1 from pg_trigger where tgname = 'trg_ai_settings_updated') then
    create trigger trg_ai_settings_updated
      before update on ai_settings
      for each row execute procedure set_updated_at();
  end if;

  -- model_pricing
  if not exists (select 1 from pg_trigger where tgname = 'trg_model_pricing_updated') then
    create trigger trg_model_pricing_updated
      before update on model_pricing
      for each row execute procedure set_updated_at();
  end if;

  -- feedback
  if not exists (select 1 from pg_trigger where tgname = 'trg_feedback_updated') then
    create trigger trg_feedback_updated
      before update on feedback
      for each row execute procedure set_updated_at();
  end if;

  -- settings
  if not exists (select 1 from pg_trigger where tgname = 'trg_settings_updated') then
    create trigger trg_settings_updated
      before update on settings
      for each row execute procedure set_updated_at();
  end if;

  -- communication_settings
  if not exists (select 1 from pg_trigger where tgname = 'trg_comm_settings_updated') then
    create trigger trg_comm_settings_updated
      before update on communication_settings
      for each row execute procedure set_updated_at();
  end if;

  -- billing_settings
  if not exists (select 1 from pg_trigger where tgname = 'trg_billing_settings_updated') then
    create trigger trg_billing_settings_updated
      before update on billing_settings
      for each row execute procedure set_updated_at();
  end if;

  -- smtp_providers
  if not exists (select 1 from pg_trigger where tgname = 'trg_smtp_providers_updated') then
    create trigger trg_smtp_providers_updated
      before update on smtp_providers
      for each row execute procedure set_updated_at();
  end if;

  -- admin_smtp
  if not exists (select 1 from pg_trigger where tgname = 'trg_admin_smtp_updated') then
    create trigger trg_admin_smtp_updated
      before update on admin_smtp
      for each row execute procedure set_updated_at();
  end if;

  -- document_templates
  -- (already created above)

end $$;


/* ==============================================================
   8.  Row-Level Security (RLS)
   ============================================================== */

-- Enable RLS on all tables
alter table profiles                enable row level security;
alter table projects                enable row level security;
alter table jobs                    enable row level security;
alter table emails                  enable row level security;
alter table templates               enable row level security;
alter table document_templates      enable row level security;
alter table documents               enable row level security;
alter table uploads                 enable row level security;
alter table attachments             enable row level security;
alter table artifacts               enable row level security;
alter table chats                   enable row level security;
alter table categories              enable row level security;
alter table recipients              enable row level security;
alter table schedules               enable row level security;
alter table transactions            enable row level security;
alter table credit_packs            enable row level security;
alter table credits_wallets         enable row level security;
alter table credit_transactions     enable row level security;
alter table gateway_settings        enable row level security;
alter table billing_settings        enable row level security;
alter table ai_settings             enable row level security;
alter table model_catalog           enable row level security;
alter table model_pricing           enable row level security;
alter table ai_usage_logs           enable row level security;
alter table communication_settings  enable row level security;
alter table smtp_providers          enable row level security;
alter table admin_smtp              enable row level security;
alter table settings                enable row level security;
alter table feedback                enable row level security;

-- ── SELECT policies ──────────────────────────────────────────
create policy "profiles_select"               on profiles               for select using (auth.uid() = id);
create policy "projects_select"               on projects               for select using (auth.uid() = user_id);
create policy "jobs_select"                   on jobs                   for select using (auth.uid() = user_id);
create policy "emails_select"                 on emails                 for select using (auth.uid() = user_id);
create policy "templates_select"              on templates              for select using (auth.uid() = user_id);
create policy "document_templates_select"     on document_templates     for select using (auth.uid() = user_id or is_global = true);
create policy "documents_select"              on documents              for select using (auth.uid() = user_id);
create policy "uploads_select"                on uploads                for select using (auth.uid() = user_id);
create policy "attachments_select"            on attachments            for select using (auth.uid() = user_id);
create policy "artifacts_select"              on artifacts              for select using (auth.uid() = user_id);
create policy "chats_select"                  on chats                  for select using (auth.uid() = user_id);
create policy "categories_select"             on categories             for select using (auth.uid() = user_id);
create policy "recipients_select"             on recipients             for select using (auth.uid() = user_id);
create policy "schedules_select"              on schedules              for select using (auth.uid() = user_id);
create policy "transactions_select"           on transactions           for select using (auth.uid() = user_id);
create policy "credit_packs_select"           on credit_packs           for select using (true);           -- public catalog
create policy "credits_wallets_select"        on credits_wallets        for select using (auth.uid() = user_id);
create policy "credit_transactions_select"    on credit_transactions    for select using (auth.uid() = user_id);
create policy "gateway_settings_select"       on gateway_settings       for select using (true);           -- public config
create policy "billing_settings_select"       on billing_settings       for select using (auth.uid() = user_id);
create policy "ai_settings_select"            on ai_settings            for select using (auth.uid() = user_id);
create policy "model_catalog_select"          on model_catalog          for select using (true);           -- public
create policy "model_pricing_select"          on model_pricing          for select using (true);           -- public
create policy "ai_usage_logs_select"          on ai_usage_logs          for select using (auth.uid() = user_id);
create policy "comm_settings_select"          on communication_settings for select using (auth.uid() = user_id);
create policy "smtp_providers_select"         on smtp_providers         for select using (auth.uid() = user_id);
-- admin_smtp is accessed server-side via service_role key; no client-side access
create policy "admin_smtp_no_select"          on admin_smtp             for select using (false);
create policy "settings_select"               on settings               for select using (auth.uid() = user_id);
create policy "feedback_select"               on feedback               for select using (auth.uid() = user_id);

-- ── INSERT policies ──────────────────────────────────────────
create policy "profiles_insert"               on profiles               for insert with check (auth.uid() = id);
create policy "projects_insert"               on projects               for insert with check (auth.uid() = user_id);
create policy "jobs_insert"                   on jobs                   for insert with check (auth.uid() = user_id);
create policy "emails_insert"                 on emails                 for insert with check (auth.uid() = user_id);
create policy "templates_insert"              on templates              for insert with check (auth.uid() = user_id);
create policy "document_templates_insert"     on document_templates     for insert with check (auth.uid() = user_id);
create policy "documents_insert"              on documents              for insert with check (auth.uid() = user_id);
create policy "uploads_insert"                on uploads                for insert with check (auth.uid() = user_id);
create policy "attachments_insert"            on attachments            for insert with check (auth.uid() = user_id);
create policy "artifacts_insert"              on artifacts              for insert with check (auth.uid() = user_id);
create policy "chats_insert"                  on chats                  for insert with check (auth.uid() = user_id);
create policy "categories_insert"             on categories             for insert with check (auth.uid() = user_id);
create policy "recipients_insert"             on recipients             for insert with check (auth.uid() = user_id);
create policy "schedules_insert"              on schedules              for insert with check (auth.uid() = user_id);
create policy "transactions_insert"           on transactions           for insert with check (auth.uid() = user_id);
create policy "credits_wallets_insert"        on credits_wallets        for insert with check (auth.uid() = user_id);
create policy "credit_transactions_insert"    on credit_transactions    for insert with check (auth.uid() = user_id);
create policy "billing_settings_insert"       on billing_settings       for insert with check (auth.uid() = user_id);
create policy "ai_settings_insert"            on ai_settings            for insert with check (auth.uid() = user_id);
create policy "ai_usage_logs_insert"          on ai_usage_logs          for insert with check (auth.uid() = user_id);
create policy "comm_settings_insert"          on communication_settings for insert with check (auth.uid() = user_id);
create policy "smtp_providers_insert"         on smtp_providers         for insert with check (auth.uid() = user_id);
create policy "settings_insert"               on settings               for insert with check (auth.uid() = user_id);
create policy "feedback_insert"               on feedback               for insert with check (auth.uid() = user_id);

-- ── UPDATE policies ──────────────────────────────────────────
create policy "profiles_update"               on profiles               for update using (auth.uid() = id)              with check (auth.uid() = id);
create policy "projects_update"               on projects               for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "jobs_update"                   on jobs                   for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "emails_update"                 on emails                 for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "templates_update"              on templates              for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "document_templates_update"     on document_templates     for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "documents_update"              on documents              for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "uploads_update"                on uploads                for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "attachments_update"            on attachments            for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "artifacts_update"              on artifacts              for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "chats_update"                  on chats                  for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "categories_update"             on categories             for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "recipients_update"             on recipients             for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "schedules_update"              on schedules              for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "credits_wallets_update"        on credits_wallets        for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "billing_settings_update"       on billing_settings       for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "ai_settings_update"            on ai_settings            for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "comm_settings_update"          on communication_settings for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "smtp_providers_update"         on smtp_providers         for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "settings_update"               on settings               for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);
create policy "feedback_update"               on feedback               for update using (auth.uid() = user_id)         with check (auth.uid() = user_id);

-- ── DELETE policies ──────────────────────────────────────────
create policy "profiles_delete"               on profiles               for delete using (auth.uid() = id);
create policy "projects_delete"               on projects               for delete using (auth.uid() = user_id);
create policy "jobs_delete"                   on jobs                   for delete using (auth.uid() = user_id);
create policy "emails_delete"                 on emails                 for delete using (auth.uid() = user_id);
create policy "templates_delete"              on templates              for delete using (auth.uid() = user_id);
create policy "document_templates_delete"     on document_templates     for delete using (auth.uid() = user_id);
create policy "documents_delete"              on documents              for delete using (auth.uid() = user_id);
create policy "uploads_delete"                on uploads                for delete using (auth.uid() = user_id);
create policy "attachments_delete"            on attachments            for delete using (auth.uid() = user_id);
create policy "artifacts_delete"              on artifacts              for delete using (auth.uid() = user_id);
create policy "chats_delete"                  on chats                  for delete using (auth.uid() = user_id);
create policy "categories_delete"             on categories             for delete using (auth.uid() = user_id);
create policy "recipients_delete"             on recipients             for delete using (auth.uid() = user_id);
create policy "schedules_delete"              on schedules              for delete using (auth.uid() = user_id);
create policy "credits_wallets_delete"        on credits_wallets        for delete using (auth.uid() = user_id);
create policy "credit_transactions_delete"    on credit_transactions    for delete using (auth.uid() = user_id);
create policy "billing_settings_delete"       on billing_settings       for delete using (auth.uid() = user_id);
create policy "ai_settings_delete"            on ai_settings            for delete using (auth.uid() = user_id);
create policy "ai_usage_logs_delete"          on ai_usage_logs          for delete using (auth.uid() = user_id);
create policy "comm_settings_delete"          on communication_settings for delete using (auth.uid() = user_id);
create policy "smtp_providers_delete"         on smtp_providers         for delete using (auth.uid() = user_id);
create policy "settings_delete"               on settings               for delete using (auth.uid() = user_id);
create policy "feedback_delete"               on feedback               for delete using (auth.uid() = user_id);

/* ==============================================================
   9.  App Users (application-level user records)
       Auth lives in auth.users; this table holds app metadata.
   ============================================================== */
create table if not exists users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null unique,
  name                  text,
  role                  text not null default 'user',
  "userVersion"         integer not null default 1,
  "starredTemplates"    jsonb not null default '[]',
  "billingType"         text not null default 'token',
  "gatewayAccess"       jsonb not null default '{}',
  credits               integer not null default 0,
  "creditExpiryBuckets" jsonb not null default '[]',
  "schemaVersion"       integer not null default 1,
  metadata              jsonb not null default '{}',
  "createdAt"           timestamptz default now(),
  "updatedAt"           timestamptz default now()
);

create index if not exists idx_users_email on users(email);

alter table users enable row level security;
create policy "users_select" on users for select using (auth.uid() = id);
create policy "users_insert" on users for insert with check (auth.uid() = id);
create policy "users_update" on users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users_delete" on users for delete using (auth.uid() = id);

/* ==============================================================
   10. Scheduler support tables
   ============================================================== */
create table if not exists schedule_executions (
  id           uuid primary key default uuid_generate_v4(),
  schedule_id  uuid not null,
  user_id      uuid references auth.users(id) on delete cascade,
  message_id   text,
  status       text not null default 'started',
  started_at   timestamptz default now(),
  finished_at  timestamptz,
  error        text,
  retry_count  integer not null default 0,
  metadata     jsonb not null default '{}',
  created_at   timestamptz default now()
);

create table if not exists scheduler_idempotency (
  message_id   text primary key,
  created_at   timestamptz default now()
);

create index if not exists idx_schedule_executions_schedule on schedule_executions(schedule_id);
create index if not exists idx_schedule_executions_user on schedule_executions(user_id);

alter table schedule_executions enable row level security;
alter table scheduler_idempotency enable row level security;
create policy "schedule_executions_select" on schedule_executions for select using (auth.uid() = user_id);
create policy "schedule_executions_insert" on schedule_executions for insert with check (auth.uid() = user_id);
create policy "schedule_executions_update" on schedule_executions for update using (auth.uid() = user_id);
create policy "scheduler_idempotency_no_select" on scheduler_idempotency for select using (false);

/* ==============================================================
   11. Audit logs
   ============================================================== */
create table if not exists audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null,
  details     jsonb not null default '{}',
  created_at  timestamptz default now()
);

create index if not exists idx_audit_logs_user on audit_logs(user_id);
create index if not exists idx_audit_logs_action on audit_logs(action);

alter table audit_logs enable row level security;
create policy "audit_logs_select" on audit_logs for select using (auth.uid() = user_id);
create policy "audit_logs_insert" on audit_logs for insert with check (auth.uid() = user_id);

/* ==============================================================
   12. Extra metadata columns for legacy JSON field mapping
   ============================================================== */
alter table emails add column if not exists metadata jsonb not null default '{}';
alter table templates add column if not exists metadata jsonb not null default '{}';
alter table recipients add column if not exists metadata jsonb not null default '{}';
alter table attachments add column if not exists metadata jsonb not null default '{}';

/* ==============================================================
   Done – All tables, indexes, unique constraints, RLS, and
   triggers are ready for use with Supabase Auth.
   ============================================================== */