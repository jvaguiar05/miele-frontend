import { create } from "zustand";
import api from "@/lib/api";

export type DashboardFilter = "today" | "week" | "month";
export type NotificationPreference = "all" | "important" | "none";

interface SettingsState {
  // Dashboard settings (localStorage + Zustand for reactivity)
  period: DashboardFilter;
  getDashboardFilter: () => DashboardFilter;
  setDashboardFilter: (filter: DashboardFilter) => void;

  // Notification settings (synced with Configuration page)
  notifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  setNotifications: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;

  // System status with real health check
  systemStatus: {
    database: {
      status: "online" | "offline" | "checking";
      responseTime: string;
      uptime: string;
    };
    api: {
      status: "online" | "offline" | "checking";
      responseTime: string;
      uptime: string;
    };
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

  // Save all settings
  saveAllSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Dashboard settings (localStorage + Zustand for reactivity)
  period:
    (localStorage.getItem("dashboard-filter") as DashboardFilter) || "today",

  getDashboardFilter: () => {
    return get().period;
  },

  setDashboardFilter: (filter) => {
    localStorage.setItem("dashboard-filter", filter);
    set({ period: filter });
  },

  // Notification settings (synced with Configuration page)
  notifications: JSON.parse(localStorage.getItem("notifications") || "true"),
  emailNotifications: JSON.parse(
    localStorage.getItem("emailNotifications") || "true"
  ),
  soundEnabled: JSON.parse(localStorage.getItem("soundEnabled") || "false"),

  setNotifications: (enabled) => {
    localStorage.setItem("notifications", JSON.stringify(enabled));
    set({ notifications: enabled });
  },

  setEmailNotifications: (enabled) => {
    localStorage.setItem("emailNotifications", JSON.stringify(enabled));
    set({ emailNotifications: enabled });
  },

  setSoundEnabled: (enabled) => {
    localStorage.setItem("soundEnabled", JSON.stringify(enabled));
    set({ soundEnabled: enabled });
  },

  // System status with detailed info
  systemStatus: {
    database: {
      status: "checking",
      responseTime: "--",
      uptime: "--",
    },
    api: {
      status: "checking",
      responseTime: "--",
      uptime: "--",
    },
    lastChecked: null,
  },

  checkSystemStatus: async () => {
    const currentStatus = get().systemStatus;
    set({
      systemStatus: {
        database: {
          status: "checking",
          responseTime: "--",
          uptime: "--",
        },
        api: {
          status: "checking",
          responseTime: "--",
          uptime: "--",
        },
        lastChecked: null,
      },
    });

    try {
      // Check API live endpoint
      const liveStartTime = Date.now();
      const liveResponse = await fetch("http://127.0.0.1:8000/health/live", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const liveEndTime = Date.now();
      const liveResponseTime = `${liveEndTime - liveStartTime}ms`;

      // Check API ready endpoint
      const readyStartTime = Date.now();
      const readyResponse = await fetch("http://127.0.0.1:8000/health/ready", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const readyEndTime = Date.now();
      const readyResponseTime = `${readyEndTime - readyStartTime}ms`;

      const liveData = await liveResponse.json();
      const readyData = await readyResponse.json();

      const apiStatus =
        liveResponse.ok && liveData.status === "live" ? "online" : "offline";
      const dbStatus =
        readyResponse.ok && readyData.status === "ready" ? "online" : "offline";

      // Calculate uptime (mock for now, could be from API)
      const uptime = "99.9%";

      set({
        systemStatus: {
          database: {
            status: dbStatus,
            responseTime: readyResponseTime,
            uptime: uptime,
          },
          api: {
            status: apiStatus,
            responseTime: liveResponseTime,
            uptime: uptime,
          },
          lastChecked: new Date(),
        },
      });
    } catch (error) {
      console.error("Health check failed:", error);
      set({
        systemStatus: {
          database: {
            status: "offline",
            responseTime: "timeout",
            uptime: "--",
          },
          api: {
            status: "offline",
            responseTime: "timeout",
            uptime: "--",
          },
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
        // pushNotifications and notificationPreference removed from interface
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

  saveAllSettings: async () => {
    const state = get();
    try {
      // Save API-backed preferences
      await get().updateUserPreferences({
        email_notifications: state.emailNotifications,
      });

      // Local settings are already saved via setters
      console.log("All settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  },
}));
