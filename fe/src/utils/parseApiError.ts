import { AxiosError } from "axios";

export class ApiError extends Error {
  public originalError: any;
  public statusCode?: number;

  constructor(cleanMessage: string, originalError: any) {
    super(cleanMessage);
    this.name = "ApiError";
    this.originalError = originalError;
    if (originalError && typeof originalError === "object") {
      this.statusCode = (originalError as AxiosError).response?.status;
    }
  }
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
      return "Request timed out. Please try again";
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
