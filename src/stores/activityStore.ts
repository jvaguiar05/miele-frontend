import { create } from "zustand";
import api, { apiHelpers } from "@/lib/api";

export interface ActivityLog {
  id: number;
  public_id?: string;
  user_id: number | null;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string | null;
  user_agent: string | null;
  details: any | null;
  created_at: string;

  // Related user information
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };

  // Aliases for compatibility with components
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  metadata?: any;
}

interface ActivityFilters {
  user_id?: number;
  action?: string;
  resource_type?: string;
  created_at_after?: string;
  created_at_before?: string;
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

  fetchActivities: (page?: number, filters?: ActivityFilters) => Promise<void>;
  fetchActivityById: (id: string | number) => Promise<ActivityLog>;
  logActivity: (activityData: Partial<ActivityLog>) => Promise<ActivityLog>;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: ActivityFilters) => void;
  clearFilters: () => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  totalPages: 1,
  filters: {},

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

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().fetchActivities(page, get().filters);
  },

  setFilters: (filters: ActivityFilters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchActivities(1, { ...get().filters, ...filters });
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchActivities(1, {});
  },
}));
