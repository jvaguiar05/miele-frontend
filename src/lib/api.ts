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

          const { access, refresh: newRefresh } = response.data;

          // Store new tokens (refresh token rotation)
          Cookies.set("access_token", access, { expires: 1 / 96 }); // 15 minutes
          if (newRefresh) {
            Cookies.set("refresh_token", newRefresh, { expires: 14 }); // 14 days
          }

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

// File management API functions following Miele Drive Proxy integration
export const fileApi = {
  // Upload file (multipart/form-data)
  uploadFile: async (
    objectId: string,
    fileObject: File,
    fileType: string,
    description?: string
  ) => {
    const formData = new FormData();
    formData.append("object_id", objectId);
    formData.append("file_type", fileType);
    formData.append("file", fileObject);
    if (description) {
      formData.append("description", description);
    }

    const response = await api.post("/shared/files/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // List files for an entity
  listFiles: async (objectId: string) => {
    const response = await api.get(`/shared/files/?object_id=${objectId}`);
    return response.data;
  },

  // Download file (returns blob)
  downloadFile: async (fileId: string) => {
    const response = await api.get(`/shared/files/${fileId}/download/`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Preview file (returns blob for display)
  previewFile: async (fileId: string) => {
    const response = await api.get(`/shared/files/${fileId}/preview/`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Update file metadata or replace file content
  updateFile: async (
    fileId: string,
    updates: {
      file_name?: string;
      description?: string;
      file?: File;
    }
  ) => {
    const formData = new FormData();

    if (updates.file_name) {
      formData.append("file_name", updates.file_name);
    }
    if (updates.description !== undefined) {
      formData.append("description", updates.description);
    }
    if (updates.file) {
      formData.append("file", updates.file);
    }

    const response = await api.patch(`/shared/files/${fileId}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId: string) => {
    await api.delete(`/shared/files/${fileId}/`);
  },

  // Helper function to download file with proper filename and mime type
  downloadFileWithName: async (
    fileId: string,
    fileName: string,
    mimeType?: string
  ) => {
    try {
      const blob = await fileApi.downloadFile(fileId);

      // Create blob URL with correct MIME type
      const typedBlob = new Blob([blob], {
        type: mimeType || blob.type || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(typedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);

      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  },

  // Helper function to get preview URL for display
  getPreviewUrl: async (fileId: string) => {
    try {
      const blob = await fileApi.previewFile(fileId);
      return window.URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error getting preview URL:", error);
      throw error;
    }
  },
};

export default api;
