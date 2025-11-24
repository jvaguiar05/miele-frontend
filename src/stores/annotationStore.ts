import { create } from "zustand";
import api, { apiHelpers } from "@/lib/api";

export interface Annotation {
  id: number;
  public_id?: string;
  user_id: number;
  entity_type: "client" | "perdcomp" | "request" | string;
  entity_id: number;
  content: string;
  created_at: string;
  updated_at: string;

  // Related user information
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateAnnotationInput {
  entity_type: "client" | "perdcomp" | "request" | string;
  entity_id: number;
  content: string;
}

interface AnnotationFilters {
  entity_type?: string;
  entity_id?: number;
  user_id?: number;
}

interface AnnotationState {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  filters: AnnotationFilters;

  fetchAnnotations: (
    entityType?: string,
    entityId?: number,
    page?: number
  ) => Promise<void>;
  fetchAnnotationById: (id: string | number) => Promise<Annotation>;
  createAnnotation: (input: CreateAnnotationInput) => Promise<Annotation>;
  updateAnnotation: (
    id: string | number,
    content: string
  ) => Promise<Annotation>;
  deleteAnnotation: (id: string | number) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: AnnotationFilters) => void;
  clearFilters: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  pageSize: 20,
  totalCount: 0,
  filters: {},

  fetchAnnotations: async (
    entityType?: string,
    entityId?: number,
    page = 1
  ) => {
    set({ isLoading: true, error: null });
    try {
      const pageSize = get().pageSize;

      // Build query parameters for Django API
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      // Add entity filters if provided
      if (entityType) {
        params.entity_type = entityType;
      }
      if (entityId !== undefined) {
        params.entity_id = entityId;
      }

      // Add other filters
      Object.entries(get().filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });

      // Default ordering by creation date (newest first)
      if (!params.ordering) {
        params.ordering = "-created_at";
      }

      const queryString = apiHelpers.buildQueryParams(params);
      const response = await api.get(`/annotations/?${queryString}`);
      const data = apiHelpers.handlePaginatedResponse(response);

      set({
        annotations: data.results,
        totalCount: data.count,
        totalPages: Math.ceil(data.count / pageSize),
        currentPage: page,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar anotações",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchAnnotationById: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/annotations/${id}/`
          : `/annotations/${id}/`;

      const response = await api.get(endpoint);
      const annotation = response.data;

      set({ isLoading: false });
      return annotation;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar anotação",
        isLoading: false,
      });
      throw error;
    }
  },

  createAnnotation: async (input: CreateAnnotationInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/annotations/", input);
      const annotation = response.data;

      // Add to local state
      set((state) => ({
        annotations: [annotation, ...state.annotations],
        totalCount: state.totalCount + 1,
        isLoading: false,
      }));

      return annotation;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao criar anotação",
        isLoading: false,
      });
      throw error;
    }
  },

  updateAnnotation: async (id: string | number, content: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/annotations/${id}/`
          : `/annotations/${id}/`;

      const response = await api.patch(endpoint, { content });
      const updatedAnnotation = response.data;

      // Update local state
      set((state) => ({
        annotations: state.annotations.map((annotation) =>
          annotation.id === id || annotation.public_id === id
            ? updatedAnnotation
            : annotation
        ),
        isLoading: false,
      }));

      return updatedAnnotation;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar anotação",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteAnnotation: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/annotations/${id}/`
          : `/annotations/${id}/`;

      await api.delete(endpoint);

      // Remove from local state
      set((state) => ({
        annotations: state.annotations.filter(
          (annotation) => annotation.id !== id && annotation.public_id !== id
        ),
        totalCount: Math.max(0, state.totalCount - 1),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || "Erro ao deletar anotação",
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    // Re-fetch with current filters
    const { filters } = get();
    get().fetchAnnotations(filters.entity_type, filters.entity_id, page);
  },

  setFilters: (filters: AnnotationFilters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchAnnotations(filters.entity_type, filters.entity_id, 1);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchAnnotations(undefined, undefined, 1);
  },
}));
