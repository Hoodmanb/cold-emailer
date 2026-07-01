export const TEMPLATE_QUERY_KEY = ["document-templates"] as const;
export const EMAIL_TEMPLATE_QUERY_KEY = ["email-templates"] as const;
export const SYSTEM_TEMPLATE_QUERY_KEY = ["system-templates"] as const;

export const templateQueryKeys = {
  all: TEMPLATE_QUERY_KEY,
  list: (type?: string) => [...TEMPLATE_QUERY_KEY, type || "all"] as const,
  public: (type?: string) => [...TEMPLATE_QUERY_KEY, "public", type || "all"] as const,
  starred: () => [...TEMPLATE_QUERY_KEY, "starred"] as const,
  pending: () => [...TEMPLATE_QUERY_KEY, "pending"] as const,
  detail: (id: string | null) => [...TEMPLATE_QUERY_KEY, "detail", id] as const,
  preview: (id: string | null) => [...TEMPLATE_QUERY_KEY, "preview", id] as const,
  email: EMAIL_TEMPLATE_QUERY_KEY,
  system: SYSTEM_TEMPLATE_QUERY_KEY,
  systemDetail: (id: string) => [...SYSTEM_TEMPLATE_QUERY_KEY, id] as const,
};
