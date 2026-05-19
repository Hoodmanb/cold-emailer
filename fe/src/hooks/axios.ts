import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import { showToast } from "../context/SnackbarContext";
import { parseApiError, ApiError } from "../utils/parseApiError";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor: Sync Auth State & Handle 401s
axiosInstance.interceptors.response.use(
  (response) => {
    const { auth, data: payloadData } = response.data || {};
    const { clearAuth, setAuth, user: currentUser } = useAuthStore.getState();

    // Skip sync for auth routes to avoid redundant updates during login/signup
    const isAuthRoute = response.config.url?.includes("/api/auth/");

    if (!isAuthRoute && auth && auth.isAuthenticated) {
      // If backend reports a newer version, or we have no user but backend says we're authenticated
      if (!currentUser || (auth.userVersion && auth.userVersion > (currentUser.userVersion || 0))) {
        console.log("[AXIOS] Auth sync triggered by userVersion change");
        // We might not have the full user object here if we only returned metadata
        // For now, we can trigger a silent fetch of /me or just trust the data if provided
        if (payloadData?.user) {
          setAuth(payloadData.user, useAuthStore.getState().token || "");
        }
      }
    }

    return response;
  },
  (error) => {
    const cleanMsg = parseApiError(error);
    const isAuthCheck = error.config?.url?.includes("/api/auth/me") || 
                        error.config?.url?.includes("/api/auth/login") || 
                        error.config?.url?.includes("/api/auth/signup");
    const isSilent = isAuthCheck || error.config?.headers?.["X-Bypass-Global-Toast"] === "true";

    if (!isSilent) {
      showToast(cleanMsg, "error");
    }

    if (error.response) {
      const { clearAuth } = useAuthStore.getState();
      
      if (error.response.status === 401 && typeof window !== "undefined") {
        console.warn("[AXIOS] 401 Unauthorized - Clearing session");
        clearAuth();
        document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
        
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
  console.log(`[AXIOS] Request: ${config.method?.toUpperCase()} ${config.url}`);
  const { token } = useAuthStore.getState();
  
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default axiosInstance;
