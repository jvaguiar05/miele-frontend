import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import Cookies from "js-cookie";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  phone?: string;
  avatar?: string;
  two_factor_enabled?: boolean;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined: string;
  last_login: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{
    message: string;
    username: string;
    email: string;
    approval_status: string;
  }>;
  signIn: (username: string, password: string) => Promise<void>;
  signInAsTestUser: () => void;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  initialize: () => void;
  refreshToken: () => Promise<string>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,

      signUp: async (
        email: string,
        password: string,
        firstName: string,
        lastName: string
      ) => {
        set({ isLoading: true });
        try {
          const response = await api.post("/auth/register/", {
            username: email,
            email,
            password,
            confirm_password: password,
            first_name: firstName,
            last_name: lastName,
          });

          // Registration creates an approval request - user needs admin approval
          set({ isLoading: false });

          // Return the response data for handling in UI
          return {
            message: response.data.message,
            username: response.data.username,
            email: response.data.email,
            approval_status: response.data.approval_status,
          };
        } catch (error: any) {
          set({ isLoading: false });
          // Handle Django validation errors
          const errorData = error.response?.data;
          if (errorData?.error) {
            throw new Error(errorData.error.message || "Erro no registro");
          } else if (errorData) {
            // Handle field validation errors
            const fieldErrors = [];
            for (const [field, messages] of Object.entries(errorData)) {
              if (Array.isArray(messages)) {
                fieldErrors.push(`${field}: ${messages.join(", ")}`);
              }
            }
            throw new Error(fieldErrors.join("; ") || "Erro de validação");
          }
          throw new Error(error.message || "Erro no registro");
        }
      },

      signIn: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post("/auth/login/", {
            username,
            password,
          });

          const { access, refresh } = response.data;

          // Store tokens in cookies
          Cookies.set("access_token", access, { expires: 1 / 96 }); // 15 minutes
          Cookies.set("refresh_token", refresh, { expires: 14 }); // 14 days

          // Fetch user data and RBAC information
          await get().getCurrentUser();

          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          const errorData = error.response?.data;
          if (errorData?.detail) {
            throw new Error(errorData.detail);
          } else if (errorData?.error) {
            throw new Error(errorData.error.message || "Erro no login");
          }
          throw new Error(error.message || "Erro no login");
        }
      },

      signInAsTestUser: () => {
        // Temporary test user for development - bypasses authentication
        const testUser: User = {
          id: 999,
          username: "teste@miele.com",
          email: "teste@miele.com",
          first_name: "Usuário",
          last_name: "Teste",
          name: "Usuário Teste",
          is_active: true,
          is_staff: false,
          is_superuser: false,
          date_joined: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };

        // Set fake tokens for testing
        Cookies.set("access_token", "test-token", { expires: 1 });
        Cookies.set("refresh_token", "test-refresh", { expires: 7 });

        set({
          user: testUser,
          profile: {
            id: testUser.id.toString(),
            full_name: "Usuário Teste",
            avatar_url: null,
            phone: null,
          },
          isAuthenticated: true,
          isAdmin: false,
        });
      },

      signOut: async () => {
        try {
          const refreshToken = Cookies.get("refresh_token");

          // Call API logout endpoint to blacklist refresh token
          if (refreshToken) {
            try {
              await api.post("/auth/logout/", {
                refresh: refreshToken,
              });
            } catch (error) {
              // Ignore logout API errors, just clear local state
              console.warn("Logout API error:", error);
            }
          }

          // Clear tokens
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");

          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
          });
        } catch (error) {
          // Always clear local state even if API call fails
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        try {
          const token = Cookies.get("access_token");
          if (!token) {
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isAdmin: false,
            });
            return;
          }

          // Fetch user RBAC information
          const response = await api.get("/auth/rbac/");
          const userData = response.data;

          // Map RBAC response to user object
          const user: User = {
            id: userData.user_id,
            username: userData.username,
            email: userData.username, // Assuming username is email
            first_name: "", // Will be filled from profile if available
            last_name: "",
            is_active: userData.approval_status === "approved",
            is_staff: userData.role === "admin",
            is_superuser: userData.role === "admin",
            date_joined: new Date().toISOString(),
            last_login: new Date().toISOString(),
          };

          set({
            user: {
              ...user,
              // Store permissions for easy access
              permissions: userData.permissions,
            } as any,
            profile: {
              id: userData.user_id.toString(),
              full_name: userData.username,
              avatar_url: null,
              phone: null,
            },
            isAuthenticated: true,
            isAdmin: userData.role === "admin",
          });
        } catch (error) {
          console.error("Error fetching user:", error);
          // Token might be invalid, clear auth state
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      },

      updateProfile: async (data: Partial<Profile>) => {
        const { user } = get();
        if (!user) throw new Error("No user logged in");

        set({ isLoading: true });
        try {
          const updateData: any = {};

          if (data.full_name) {
            const nameParts = data.full_name.split(" ");
            updateData.first_name = nameParts[0];
            updateData.last_name = nameParts.slice(1).join(" ");
          }

          if (data.phone) updateData.phone = data.phone;
          if (data.avatar_url) updateData.avatar = data.avatar_url;

          await api.patch("/auth/me/", updateData);
          await get().getCurrentUser();
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshToken: async () => {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        try {
          const response = await api.post("/auth/refresh/", {
            refresh: refreshToken,
          });

          const { access, refresh: newRefresh } = response.data;

          // Store new tokens (refresh token rotation)
          Cookies.set("access_token", access, { expires: 1 / 96 }); // 15 minutes
          if (newRefresh) {
            Cookies.set("refresh_token", newRefresh, { expires: 14 }); // 14 days
          }

          return access;
        } catch (error) {
          // Refresh failed, clear tokens and redirect to login
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
          });
          throw error;
        }
      },

      initialize: () => {
        // Check for existing tokens and validate
        const token = Cookies.get("access_token");
        if (token) {
          get()
            .getCurrentUser()
            .catch(() => {
              // Token invalid, will be cleared by getCurrentUser
            });
        } else {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      // Only persist user data, not tokens (they're in cookies)
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
