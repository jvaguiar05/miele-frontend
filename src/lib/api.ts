import axios from "axios";
import Cookies from "js-cookie";

// Base API configuration following Django REST Framework patterns
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Create axios instance with Django REST API configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token and correlation ID
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add correlation ID for debugging if not already present
    if (!config.headers["X-Request-Id"]) {
      config.headers["X-Request-Id"] = crypto.randomUUID();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and Django error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          Cookies.set("access_token", access, { expires: 1 / 96 }); // 15 minutes
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    // Handle other errors with improved error structure
    const errorResponse = error.response?.data;
    if (errorResponse?.error) {
      // Django API error format
      const apiError = new Error(errorResponse.error.message || "API Error");
      (apiError as any).code = errorResponse.error.code;
      (apiError as any).details = errorResponse.error.details;
      (apiError as any).correlationId = errorResponse.error.correlation_id;
      return Promise.reject(apiError);
    }

    return Promise.reject(error);
  }
);

// Helper functions for common API patterns
export const apiHelpers = {
  // Handle paginated responses
  handlePaginatedResponse: (response: any) => {
    return {
      results: response.data.results || [],
      count: response.data.count || 0,
      next: response.data.next,
      previous: response.data.previous,
    };
  },

  // Build query params for filtering and pagination
  buildQueryParams: (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  },

  // Format dates for API
  formatDate: (date: Date | string) => {
    if (!date) return null;
    if (typeof date === "string") return date;
    return date.toISOString();
  },
};

export default api;
