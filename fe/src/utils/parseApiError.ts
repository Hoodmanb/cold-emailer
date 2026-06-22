import { AxiosError } from "axios";

export class ApiError extends Error {
  public originalError: any;
  public statusCode?: number;
  public errorCode?: string;
  public errorType?: string;

  constructor(cleanMessage: string, originalError: any) {
    super(cleanMessage);
    this.name = "ApiError";
    this.originalError = originalError;
    if (originalError && typeof originalError === "object") {
      const axiosErr = originalError as AxiosError;
      this.statusCode = axiosErr.response?.status;
      const data = axiosErr.response?.data as Record<string, unknown> | undefined;
      if (data && typeof data === "object") {
        this.errorCode = typeof data.errorCode === "string" ? data.errorCode : undefined;
        this.errorType = typeof data.type === "string" ? data.type : undefined;
      }
    }
  }
}

const AI_CONFIG_ERROR_CODES = new Set([
  "AI_NOT_CONFIGURED",
  "API_KEY_MISSING",
  "PROVIDER_NOT_SET",
  "MODEL_NOT_SET",
  "PROVIDER_REQUIRED",
  "FEATURE_CONFIG_ERROR",
]);

export function isAiConfigurationError(error: any): boolean {
  if (!error) return false;
  const data = error?.response?.data ?? error?.originalError?.response?.data;
  if (data?.type === "ai_configuration_error") return true;
  if (data?.errorCode && AI_CONFIG_ERROR_CODES.has(String(data.errorCode))) return true;
  if (error instanceof ApiError && error.errorCode && AI_CONFIG_ERROR_CODES.has(error.errorCode)) return true;
  const msg = String(data?.message || data?.error || error?.message || "").toLowerCase();
  return msg.includes("api key") || msg.includes("settings → ai") || msg.includes("go to settings");
}

export function parseApiError(error: any): string {
  if (!error) {
    return "Something went wrong. Please try again";
  }

  // 1. Check if it's already an ApiError
  if (error instanceof ApiError) {
    return error.message;
  }

  // 2. Handle Axios/Network errors
  if (error.isAxiosError || error.response || error.request) {
    const axiosErr = error as AxiosError<any>;

    // Timeout checks
    if (axiosErr.code === "ECONNABORTED" || axiosErr.message?.toLowerCase().includes("timeout")) {
      const url = String(axiosErr.config?.url || "");
      if (url.includes("generate-advanced") || url.includes("generate-professional-cv") || url.includes("/workflow/")) {
        return "Document generation timed out. This can happen when AI is slow or not configured — check Settings → AI Workflows.";
      }
      return "Request timed out. Please try again";
    }

    // AI configuration errors
    if (axiosErr.response?.data) {
      const data = axiosErr.response.data as Record<string, unknown>;
      if (data.type === "ai_configuration_error" || (typeof data.errorCode === "string" && AI_CONFIG_ERROR_CODES.has(data.errorCode))) {
        return String(data.message || data.error || "AI is not configured. Go to Settings → AI Workflows.");
      }
    }

    // Network failures
    if (axiosErr.code === "ERR_NETWORK" || (!axiosErr.response && axiosErr.request)) {
      return "Network error. Please check your connection";
    }

    // Response errors
    if (axiosErr.response) {
      const status = axiosErr.response.status;
      const data = axiosErr.response.data;

      let backendMsg = "";
      if (data && typeof data === "object") {
        backendMsg = data.message || data.error || "";
      }

      if (data?.type === "external_api_error") {
        return data.error || data.message || "External service temporarily unavailable";
      }

      if (data?.type === "database_error") {
        return "Something went wrong. Please try again";
      }

      if (typeof backendMsg === "string" && backendMsg.trim()) {
        const normalized = backendMsg.trim().toLowerCase();

        // Sanitize explicit messages
        if (
          normalized.includes("invalid credentials") || 
          normalized.includes("user not found") || 
          normalized.includes("wrong password") ||
          normalized.includes("incorrect email or password")
        ) {
          return "Incorrect email or password";
        }

        // Exclude leak vulnerabilities like database exceptions, stacks, or path references
        if (
          normalized.includes("stack") ||
          normalized.includes("database") ||
          normalized.includes("query") ||
          normalized.includes("sql") ||
          normalized.includes("mongodb") ||
          normalized.includes("uid") ||
          normalized.includes("path") ||
          normalized.includes("referenceerror") ||
          normalized.includes("typeerror") ||
          normalized.includes("internal server error")
        ) {
          return "Something went wrong. Please try again";
        }

        return data.message || backendMsg;
      }

      // Fail-safe for server-side internal exceptions (500+) if no safe backend message is found
      if (status >= 500) {
        return "Something went wrong. Please try again";
      }
    }
  }

  // 3. Fallback for standard error objects
  if (error instanceof Error) {
    const msg = error.message || "";
    const normalized = msg.toLowerCase();
    if (normalized.includes("invalid credentials") || normalized.includes("wrong password")) {
      return "Incorrect email or password";
    }
    return msg || "Something went wrong. Please try again";
  }

  // 4. Fallback for raw string rejections
  if (typeof error === "string") {
    const normalized = error.toLowerCase();
    if (normalized.includes("invalid credentials") || normalized.includes("wrong password")) {
      return "Incorrect email or password";
    }
    return error;
  }

  return "Something went wrong. Please try again";
}
