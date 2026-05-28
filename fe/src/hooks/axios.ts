import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import { showToast } from "../context/SnackbarContext";
import { parseApiError, ApiError } from "../utils/parseApiError";
import { logLogoutTrigger } from "../utils/authSession";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000",
  headers: {
    "Content-Type": "application/json",
  },
});

function shouldForceLogout(status: number, requestUrl: string, errorType?: string) {
  if (status !== 401) return false;

  const isLoginAttempt = requestUrl.includes("/api/auth/login");
  const isSignupAttempt = requestUrl.includes("/api/auth/signup");
  if (isLoginAttempt || isSignupAttempt) return false;

  if (errorType === "external_api_error") return false;

  const isAuthMeCheck = requestUrl.includes("/api/auth/me");
  if (errorType === "auth_error") return true;
  if (isAuthMeCheck) return true;

  return false;
}

axiosInstance.interceptors.response.use(
  (response) => {
    const { auth, data: payloadData } = response.data || {};
    const { setAuth, user: currentUser } = useAuthStore.getState();
    const isAuthRoute = response.config.url?.includes("/api/auth/");

    if (!isAuthRoute && auth?.isAuthenticated) {
      if (!currentUser || (auth.userVersion && auth.userVersion > (currentUser.userVersion || 0))) {
        console.log("[AXIOS] Auth sync triggered by userVersion change");
        if (payloadData?.user) {
          setAuth(payloadData.user, useAuthStore.getState().token || "");
        }
      }
    }

    return response;
  },
  (error) => {
    const cleanMsg = parseApiError(error);
    const requestUrl = error.config?.url || "";
    const isAuthCheck =
      requestUrl.includes("/api/auth/me") ||
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/signup");
    const isSilent = isAuthCheck || error.config?.headers?.["X-Bypass-Global-Toast"] === "true";

    if (!isSilent) {
      showToast(cleanMsg, "error");
    }

    if (error.response && typeof window !== "undefined") {
      const responseData = error.response.data || {};
      const errorType = responseData.type;
      const status = error.response.status;

      if (shouldForceLogout(status, requestUrl, errorType)) {
        logLogoutTrigger(
          requestUrl.includes("/api/auth/me") ? "auth_me_invalid" : "auth_error_response",
          requestUrl
        );
        const { clearAuth } = useAuthStore.getState();
        clearAuth("axios_interceptor");

        const path = window.location.pathname;
        if (!path.startsWith("/login") && !path.startsWith("/signup")) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(new ApiError(cleanMsg, error));
  }
);

axiosInstance.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;
