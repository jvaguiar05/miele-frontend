import { create } from "zustand";
import api from "@/lib/api";

export type DashboardFilter = "today" | "week" | "month";
export type NotificationPreference = "all" | "important" | "none";

interface SettingsState {
  // Dashboard settings (localStorage only)
  getDashboardFilter: () => DashboardFilter;
  setDashboardFilter: (filter: DashboardFilter) => void;

  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationPreference: NotificationPreference;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setNotificationPreference: (preference: NotificationPreference) => void;

  // System status
  systemStatus: {
    database: "online" | "offline" | "checking";
    api: "online" | "offline" | "checking";
    lastChecked: Date | null;
  };
  checkSystemStatus: () => Promise<void>;

  // User preferences from API (dashboard_filter is local only)
  fetchUserPreferences: () => Promise<void>;
  updateUserPreferences: (
    preferences: Partial<{
      email_notifications: boolean;
      push_notifications: boolean;
      notification_preference: NotificationPreference;
    }>
  ) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Dashboard settings (simple localStorage)
  getDashboardFilter: () => {
    return (
      (localStorage.getItem("dashboard-filter") as DashboardFilter) || "today"
    );
  },
  setDashboardFilter: (filter) => {
    localStorage.setItem("dashboard-filter", filter);
    set({ systemStatus: { ...get().systemStatus } }); // só pra forçar rerender
  },

  // Notification settings
  emailNotifications: true,
  pushNotifications: false,
  notificationPreference: "important",
  setEmailNotifications: (enabled) => {
    set({ emailNotifications: enabled });
  },
  setPushNotifications: (enabled) => {
    set({ pushNotifications: enabled });
  },
  setNotificationPreference: (preference) => {
    set({ notificationPreference: preference });
  },

  // System status
  systemStatus: {
    database: "checking",
    api: "checking",
    lastChecked: null,
  },

  checkSystemStatus: async () => {
    set({
      systemStatus: {
        database: "checking",
        api: "checking",
        lastChecked: null,
      },
    });

    try {
      // Check API health using Django health endpoints
      const healthUrl =
        import.meta.env.VITE_HEALTH_READY_URL ||
        import.meta.env.VITE_API_BASE_URL?.replace(
          "/api/v1",
          "/health/ready"
        ) ||
        "/health/ready";

      const apiResponse = await fetch(healthUrl, {
        method: "GET",
      }).catch(() => null);

      const apiStatus = apiResponse?.ok ? "online" : "offline";
      let dbStatus: "online" | "offline" = "offline";

      // If API is online, database is likely online too
      if (apiStatus === "online") {
        try {
          const healthData = await apiResponse.json();
          dbStatus = healthData.status === "ready" ? "online" : "offline";
        } catch {
          dbStatus = "online"; // Assume DB is online if API responds
        }
      }

      set({
        systemStatus: {
          database: dbStatus,
          api: apiStatus,
          lastChecked: new Date(),
        },
      });
    } catch (error) {
      set({
        systemStatus: {
          database: "offline",
          api: "offline",
          lastChecked: new Date(),
        },
      });
    }
  },

  fetchUserPreferences: async () => {
    try {
      const response = await api.get("/auth/preferences/");
      const preferences = response.data;

      console.log("Fetched user preferences:", preferences);

      set({
        emailNotifications: preferences.email_notifications ?? true,
        pushNotifications: preferences.push_notifications ?? false,
        notificationPreference:
          preferences.notification_preference ?? "important",
        // dashboardFilter is NOT updated from API - it's local only
      });
    } catch (error) {
      console.error("Failed to fetch user preferences:", error);
      // Keep current settings if API call fails
    }
  },

  updateUserPreferences: async (preferences) => {
    try {
      await api.patch("/auth/preferences/", preferences);
    } catch (error) {
      console.error("Failed to update user preferences:", error);
    }
  },
}));
