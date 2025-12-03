import { create } from "zustand";
import api, { apiHelpers } from "@/lib/api";

export interface ActivityLog {
  id: number;
  correlation_id?: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_data?: any | null;
  new_data?: any | null;
  metadata?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  timestamp: string;

  // Aliases for compatibility with existing components
  created_at?: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  details?: any | null;
  resource_display_name?: string;
}

export type ActivityPeriod = "today" | "week" | "month";

interface ActivityFilters {
  user_public_id?: string;
  action?: string;
  resource_type?: string;
  since?: string;
  start_date?: string;
  end_date?: string;
  client_public_id?: string;
  perdcomp_public_id?: string;
  correlation_id?: string;
}

interface ActivityStore {
  activities: ActivityLog[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  filters: ActivityFilters;
  period: ActivityPeriod;

  fetchRecentActivities: (
    period?: ActivityPeriod,
    filters?: ActivityFilters
  ) => Promise<void>;
  fetchActivities: (page?: number, filters?: ActivityFilters) => Promise<void>;
  fetchActivityById: (id: string | number) => Promise<ActivityLog>;
  logActivity: (activityData: Partial<ActivityLog>) => Promise<ActivityLog>;
  setCurrentPage: (page: number) => void;
  setPeriod: (period: ActivityPeriod) => void;
  setFilters: (filters: ActivityFilters) => void;
  clearFilters: () => void;
  getSinceDate: (period: ActivityPeriod) => string;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 100,
  totalPages: 1,
  filters: {},
  period: "today",

  getSinceDate: (period: ActivityPeriod) => {
    const now = new Date();

    switch (period) {
      case "today":
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        return today.toISOString();
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString();
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return monthStart.toISOString();
      default:
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ).toISOString();
    }
  },

  fetchRecentActivities: async (period = "today", filters = {}) => {
    set({ loading: true, error: null });
    try {
      const sinceDate = get().getSinceDate(period);
      const limit = get().pageSize;

      // Build query parameters for recent-logs endpoint
      const params: Record<string, any> = {
        since: sinceDate,
        limit,
      };

      // Add additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });

      const queryString = apiHelpers.buildQueryParams(params);
      const response = await api.get(`/activities/recent-logs/?${queryString}`);

      const data = response.data;

      // Transform data to match existing component expectations
      const transformedActivities = data.results.map((activity: any) => ({
        ...activity,
        created_at: activity.timestamp,
        entity_type:
          activity.resource_type.split(".")[1] || activity.resource_type,
        entity_id: activity.resource_id,
        entity_name:
          activity.new_data?.name ||
          activity.old_data?.name ||
          activity.new_data?.client_name ||
          activity.old_data?.client_name ||
          `${activity.resource_type} ${activity.resource_id}`,
        details: activity.metadata,
      }));

      set({
        activities: transformedActivities,
        totalCount: data.count || transformedActivities.length,
        period,
        loading: false,
        filters: { ...get().filters, ...filters },
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar atividades recentes",
        loading: false,
      });
      throw error;
    }
  },

  fetchActivities: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const pageSize = get().pageSize;

      // Build query parameters for Django API
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });

      // Default ordering by creation date (newest first)
      if (!params.ordering) {
        params.ordering = "-created_at";
      }

      const queryString = apiHelpers.buildQueryParams(params);
      const response = await api.get(`/activities/?${queryString}`);
      const data = apiHelpers.handlePaginatedResponse(response);

      set({
        activities: data.results,
        totalCount: data.count,
        totalPages: Math.ceil(data.count / pageSize),
        currentPage: page,
        loading: false,
        filters: { ...get().filters, ...filters },
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar atividades",
        loading: false,
      });
      throw error;
    }
  },

  fetchActivityById: async (id: string | number) => {
    set({ loading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/activities/${id}/`
          : `/activities/${id}/`;

      const response = await api.get(endpoint);
      const activity = response.data;

      set({ loading: false });
      return activity;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar atividade",
        loading: false,
      });
      throw error;
    }
  },

  logActivity: async (activityData: Partial<ActivityLog>) => {
    set({ loading: true, error: null });
    try {
      // Format data for Django API
      const formattedData = {
        ...activityData,
        created_at: undefined, // Let the API set this
        id: undefined, // Let the API set this
      };

      const response = await api.post("/activities/", formattedData);
      const activity = response.data;

      // Add to local state (at the beginning since it's newest)
      set((state) => ({
        activities: [activity, ...state.activities],
        totalCount: state.totalCount + 1,
        loading: false,
      }));

      return activity;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao registrar atividade",
        loading: false,
      });
      throw error;
    }
  },

  setPeriod: (period: ActivityPeriod) => {
    set({ period });
    get().fetchRecentActivities(period, get().filters);
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    // For recent activities, we don't use pagination, so we refetch instead
    get().fetchRecentActivities(get().period, get().filters);
  },

  setFilters: (filters: ActivityFilters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchRecentActivities(get().period, { ...get().filters, ...filters });
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchRecentActivities(get().period, {});
  },
}));
