export type AdminHelpEntry = {
  title: string;
  description: string;
  details?: string;
};

export const ADMIN_HELP = {
  // Pages
  "page.overview": {
    title: "Admin Overview",
    description: "High-level platform health and billing performance.",
    details: "Use this dashboard to monitor AI spend, revenue, user activity, and recent payments without changing any settings.",
  },
  "page.billing": {
    title: "Billing Configuration",
    description: "Control how credits are priced, consumed, and sold.",
    details: "Changes here affect AI usage charges, checkout pricing, and profit margins across the entire platform.",
  },
  "page.models": {
    title: "AI Model Catalog",
    description: "Manage which provider/model pairs are available app-wide.",
    details: "Models added here appear in AI Settings and billing markup dropdowns. Each model must be verified with the provider before it is added.",
  },
  "page.usage": {
    title: "Usage Logs",
    description: "Audit trail of AI requests and credit charges.",
    details: "Use this to investigate high usage, debug billing issues, or review which models users consume most.",
  },
  "page.users": {
    title: "User Management",
    description: "View accounts and manually adjust credits.",
    details: "Grant credits for support cases, promotions, or testing. Full user administration tools will expand here over time.",
  },
  "admin.moderation": {
    title: "Template Moderation",
    description: "Approve or reject user‑submitted templates.",
    details: "Admins can manage pending templates, view submitter info, and control approval workflow."
  },
  "admin.previewData": {
    title: "Template Preview Data",
    description: "Edit system-wide resume/CV preview dataset.",
    details: "This JSON data is merged with logged-in user profile details to generate templates previews consistently."
  },
  "nav.moderation": {
    title: "Moderation Queue",
    description: "Moderate user templates before they go public.",
  },
  "nav.previewData": {
    title: "Preview Data",
    description: "Manage default profile data for templates.",
  },

  // Overview stats
  "stat.aiCostToday": {
    title: "AI Cost (Today / Month)",
    description: "Actual provider API spend in USD.",
    details: "This is what you pay OpenAI, Claude, Gemini, or OpenRouter — before your markup is applied to users.",
  },
  "stat.creditsConsumed": {
    title: "Credits Consumed",
    description: "Credits deducted from user wallets for AI and features.",
    details: "Higher consumption means more platform usage. Compare with revenue to gauge unit economics.",
  },
  "stat.revenue": {
    title: "Total Revenue",
    description: "Lifetime payments received via Paystack.",
    details: "Includes gateway access purchases and credit pack sales.",
  },
  "stat.profit": {
    title: "Estimated Profit",
    description: "Revenue minus lifetime provider AI cost.",
    details: "A rough margin indicator. Does not include infrastructure, payment fees, or refunds.",
  },
  "stat.activeUsers": {
    title: "Active Users",
    description: "Total registered user accounts.",
    details: "Counts all users in the system, not daily active users.",
  },
  "stat.topModel": {
    title: "Most Used AI Model",
    description: "The model with the highest request count.",
    details: "Helps you decide which models need pricing tuning or catalog priority.",
  },
  "stat.topModelsList": {
    title: "Top Models",
    description: "Ranked list of models by request volume.",
    details: "Use this to spot trends and validate that billing markups align with actual usage.",
  },
  "stat.transactions": {
    title: "Recent Transactions",
    description: "Latest Paystack payment events.",
    details: "Read-only log of gateway and credit pack purchases. Useful for reconciling revenue.",
  },

  // Billing sections
  "billing.globalSettings": {
    title: "Global Billing Settings",
    description: "Core credit economics and default AI markup.",
    details: "These values apply platform-wide unless overridden by per-model or per-feature rules below.",
  },
  "billing.providerMarkup": {
    title: "Provider / Model Markup",
    description: "Override markup multipliers for specific AI models.",
    details: "Select from the verified model catalog. Markup is applied on top of raw provider cost when charging user credits.",
  },
  "billing.featurePricing": {
    title: "Feature Pricing",
    description: "Flat credit cost for non-token features.",
    details: "Examples: scheduling, ATS analysis, resume generation. Charged per use regardless of tokens consumed.",
  },
  "billing.snapshots": {
    title: "Config Version & Advanced JSON",
    description: "View version metadata or edit raw billing config.",
    details: "Advanced JSON mode is for power users. Prefer the form fields above to avoid syntax errors.",
  },
  "billing.gateway": {
    title: "Gateway Configuration",
    description: "Paystack pricing for full platform access.",
    details: "Users on the gateway plan use their own API keys. Set price in kobo, duration in months, and enable/disable checkout.",
  },
  "billing.creditPacks": {
    title: "Credit Packs",
    description: "Bundled credit packages users can purchase.",
    details: "Define name, credit amount, and Paystack price (kobo). Toggle active to show or hide packs on the pricing page.",
  },

  // Models
  "models.add": {
    title: "Add Model",
    description: "Verify and register a new provider/model pair.",
    details: "Verification calls the provider API to confirm the model exists. Add only succeeds after a successful verify.",
  },
  "models.catalog": {
    title: "App-wide Model Catalog",
    description: "All models available to AI features and billing.",
    details: "Built-in models ship with the app. Custom models can be removed; built-in entries are locked.",
  },

  // Users
  "users.grantCredits": {
    title: "Grant Credits",
    description: "Manually add credits to a user wallet.",
    details: "Use for refunds, beta access, or support compensation. Changes apply immediately.",
  },
  "users.directory": {
    title: "All Users",
    description: "Directory of registered accounts.",
    details: "Shows billing type, credit balance, and role. Click Grant Credits above to top up a specific user.",
  },

  // Usage
  "usage.recentActivity": {
    title: "Recent Activity",
    description: "Last AI usage events with cost breakdown.",
    details: "Each row shows provider cost (USD), credits charged, and timestamp for one AI request.",
  },

  // Nav
  "nav.overview": {
    title: "Overview",
    description: "Analytics dashboard with key metrics and recent transactions.",
  },
  "nav.billing": {
    title: "Billing",
    description: "Configure pricing, markups, gateway, and credit packs.",
  },
  "nav.models": {
    title: "Models",
    description: "Manage the app-wide AI model catalog.",
  },
  "nav.usage": {
    title: "Usage Logs",
    description: "Browse AI usage and credit charge history.",
  },
  "nav.users": {
    title: "Users",
    description: "View users and grant credits manually.",
  },
  "nav.communication": {
    title: "Communication",
    description: "Manage support social links and global SMTP profiles.",
  },
  "nav.feedback": {
    title: "Feedback & Cases",
    description: "Review and manage user feedback and support tickets.",
  },
} as const satisfies Record<string, AdminHelpEntry>;

export type AdminHelpId = keyof typeof ADMIN_HELP;

export function getAdminHelp(id: AdminHelpId): AdminHelpEntry {
  return ADMIN_HELP[id];
}
