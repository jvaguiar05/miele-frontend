import { create } from "zustand";
import { api } from "@/lib/api";

// Annotation interface matching Django API structure
export interface PerdCompAnnotation {
  id: string;
  entity_name: string;
  user_name: string;
  content: {
    tags?: string[];
    text: string;
    metadata?: {
      category?: string;
      created_by?: string;
      [key: string]: any;
    };
    priority?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// PerdComp status enum aligned with Django model
export type PerDcompStatus =
  | "RASCUNHO"
  | "TRANSMITIDO"
  | "EM_PROCESSAMENTO"
  | "DEFERIDO"
  | "INDEFERIDO"
  | "PARCIALMENTE_DEFERIDO"
  | "CANCELADO"
  | "VENCIDO";

// API Response interfaces for paginated endpoint
interface PerdCompApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PerdComp[];
  statistics: {
    total: number;
    pendentes: number;
    deferidos: number;
    valor_total: string;
  };
}

// PerdComp interface matching new API structure
export interface PerdComp {
  id: string;
  client_name: string;
  created_by_name: string;
  cnpj: string;
  numero: string;
  numero_perdcomp: string;
  processo_protocolo: string | null;
  data_transmissao: string;
  data_vencimento: string;
  data_competencia: string;
  tributo_pedido: string;
  competencia: string;
  valor_pedido: string;
  valor_compensado: string;
  valor_recebido: string;
  valor_saldo: string;
  valor_selic: string;
  status: PerDcompStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  esta_vencido: boolean;
  pode_ser_editado: boolean;
  pode_ser_cancelado: boolean;

  // Keep for compatibility
  annotations?: PerdCompAnnotation[];
  anotacoes?: string;
}

interface PerdCompFilters {
  search?: string;
  status?: PerDcompStatus | "all";
  is_active?: boolean;
  client_id?: string;
}

interface PerdCompStatistics {
  total: number;
  pendentes: number;
  deferidos: number;
  valor_total: string;
}

interface PerdCompState {
  perdcomps: PerdComp[];
  selectedPerdComp: PerdComp | null;
  statistics: PerdCompStatistics;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  filters: PerdCompFilters;

  // Actions
  fetchPerdComps: (
    page?: number,
    searchQuery?: string,
    filters?: PerdCompFilters
  ) => Promise<void>;
  fetchPerdCompById: (id: string | number) => Promise<PerdComp>;
  createPerdComp: (perdcompData: Partial<PerdComp>) => Promise<PerdComp>;
  updatePerdComp: (
    id: string | number,
    perdcompData: Partial<PerdComp>
  ) => Promise<PerdComp>;
  deletePerdComp: (id: string | number) => Promise<void>;
  setSelectedPerdComp: (perdcomp: PerdComp | null) => void;
  searchPerdComps: (query: string, filters?: PerdCompFilters) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: PerdCompFilters) => void;
  clearFilters: () => void;

  // Annotation actions
  fetchPerdCompAnnotations: (
    perdcompId: string
  ) => Promise<PerdCompAnnotation[]>;
  createAnnotation: (
    perdcompId: string,
    annotationData: any
  ) => Promise<PerdCompAnnotation>;
  updateAnnotation: (
    annotationId: string,
    annotationData: any
  ) => Promise<PerdCompAnnotation>;
  deleteAnnotation: (annotationId: string) => Promise<void>;

  // Status actions
  transmitirPerdComp: (id: string | number) => Promise<PerdComp>;
  cancelarPerdComp: (id: string | number, reason?: string) => Promise<PerdComp>;
  atualizarStatus: (
    id: string | number,
    status: PerDcompStatus
  ) => Promise<PerdComp>;
}

export const usePerdCompStore = create<PerdCompState>((set, get) => ({
  perdcomps: [],
  selectedPerdComp: null,
  statistics: {
    total: 0,
    pendentes: 0,
    deferidos: 0,
    valor_total: "0.00",
  },
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  pageSize: 20,
  totalCount: 0,
  filters: { is_active: true },

  fetchPerdComps: async (page = 1, searchQuery = "", filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const pageSize = get().pageSize;

      // Build query parameters for Django API
      const params = new URLSearchParams();

      if (page > 1) params.append("page", page.toString());

      // Add search query
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "all"
        ) {
          params.append(key, value.toString());
        }
      });

      // Default ordering by creation date (newest first)
      params.append("ordering", "-created_at");

      const queryString = params.toString();
      const url = queryString ? `/perdcomps/?${queryString}` : "/perdcomps/";

      console.log("Fetching PerdComps from:", url);
      const response = await api.get(url);
      const data = response.data;

      console.log("PerdComps API response:", data);

      set({
        perdcomps: data.results || [],
        statistics: data.statistics || {
          total: 0,
          pendentes: 0,
          deferidos: 0,
          valor_total: "0.00",
        },
        totalCount: data.count || 0,
        totalPages: Math.ceil((data.count || 0) / pageSize),
        currentPage: page,
        isLoading: false,
        filters: { ...get().filters, ...filters },
      });
    } catch (error: any) {
      console.error("Error fetching PerdComps:", error);
      set({
        error: error.message || "Erro ao buscar PER/DCOMPs",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchPerdCompById: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/perdcomps/${id}/`
          : `/perdcomps/${id}/`;

      const response = await api.get(endpoint);
      const perdcomp = response.data;

      // Fetch perdcomp annotations
      try {
        const annotationsResponse = await api.get(
          `/perdcomps/annotations/by-perdcomp/${perdcomp.id}/`
        );
        perdcomp.annotations = annotationsResponse.data.results || [];
      } catch (annotationError) {
        console.warn("Failed to fetch perdcomp annotations:", annotationError);
        perdcomp.annotations = [];
      }

      set({
        selectedPerdComp: perdcomp,
        isLoading: false,
      });

      return perdcomp;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar PER/DCOMP",
        isLoading: false,
      });
      throw error;
    }
  },

  createPerdComp: async (perdcompData: Partial<PerdComp>) => {
    set({ isLoading: true, error: null });
    try {
      // Format data for Django API
      const formattedData = {
        ...perdcompData,
        created_at: undefined, // Let the API set this
        updated_at: undefined, // Let the API set this
        id: undefined, // Let the API set this
      };

      const response = await api.post("/perdcomps/", formattedData);
      const perdcomp = response.data;

      // Add to local state
      set((state) => ({
        perdcomps: [perdcomp, ...state.perdcomps],
        totalCount: state.totalCount + 1,
        isLoading: false,
      }));

      return perdcomp;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao criar PER/DCOMP",
        isLoading: false,
      });
      throw error;
    }
  },

  updatePerdComp: async (
    id: string | number,
    perdcompData: Partial<PerdComp>
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/perdcomps/${id}/`
          : `/perdcomps/${id}/`;

      const response = await api.patch(endpoint, perdcompData);
      const updatedPerdComp = response.data;

      // Update local state
      set((state) => ({
        perdcomps: state.perdcomps.map((perdcomp) =>
          perdcomp.id === id ? updatedPerdComp : perdcomp
        ),
        selectedPerdComp:
          state.selectedPerdComp?.id === id
            ? updatedPerdComp
            : state.selectedPerdComp,
        isLoading: false,
      }));

      return updatedPerdComp;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar PER/DCOMP",
        isLoading: false,
      });
      throw error;
    }
  },

  deletePerdComp: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/perdcomps/${id}/`
          : `/perdcomps/${id}/`;

      await api.delete(endpoint);

      // Remove from local state
      set((state) => ({
        perdcomps: state.perdcomps.filter((perdcomp) => perdcomp.id !== id),
        totalCount: state.totalCount - 1,
        selectedPerdComp:
          state.selectedPerdComp?.id === id ? null : state.selectedPerdComp,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || "Erro ao deletar PER/DCOMP",
        isLoading: false,
      });
      throw error;
    }
  },

  setSelectedPerdComp: (perdcomp: PerdComp | null) => {
    set({ selectedPerdComp: perdcomp });
  },

  searchPerdComps: async (query: string, filters = {}) => {
    await get().fetchPerdComps(1, query, filters);
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().fetchPerdComps(page, "", get().filters);
  },

  setFilters: (filters: PerdCompFilters) => {
    const newFilters = { ...get().filters, ...filters };
    set({ filters: newFilters });
    get().fetchPerdComps(1, "", newFilters);
  },

  clearFilters: () => {
    const defaultFilters = { is_active: true };
    set({ filters: defaultFilters });
    get().fetchPerdComps(1, "", defaultFilters);
  },

  // Status actions
  transmitirPerdComp: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/perdcomps/${id}/transmitir/`);
      const updatedPerdComp = response.data;

      // Update local state
      set((state) => ({
        perdcomps: state.perdcomps.map((perdcomp) =>
          perdcomp.id === id.toString() ? updatedPerdComp : perdcomp
        ),
        selectedPerdComp:
          state.selectedPerdComp?.id === id.toString()
            ? updatedPerdComp
            : state.selectedPerdComp,
        isLoading: false,
      }));

      return updatedPerdComp;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao transmitir PER/DCOMP",
        isLoading: false,
      });
      throw error;
    }
  },

  cancelarPerdComp: async (id: string | number, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/perdcomps/${id}/cancelar/`, {
        reason: reason || "Cancelado pelo usuário",
      });

      const updatedPerdComp = response.data;

      // Update local state
      set((state) => ({
        perdcomps: state.perdcomps.map((perdcomp) =>
          perdcomp.id === id.toString() ? updatedPerdComp : perdcomp
        ),
        selectedPerdComp:
          state.selectedPerdComp?.id === id.toString()
            ? updatedPerdComp
            : state.selectedPerdComp,
        isLoading: false,
      }));

      return updatedPerdComp;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao cancelar PER/DCOMP",
        isLoading: false,
      });
      throw error;
    }
  },

  atualizarStatus: async (id: string | number, status: PerDcompStatus) => {
    return await get().updatePerdComp(id, { status });
  },

  // Annotation functions
  fetchPerdCompAnnotations: async (perdcompId: string) => {
    try {
      const response = await api.get(
        `/perdcomps/annotations/by-perdcomp/${perdcompId}/`
      );
      return response.data.results || [];
    } catch (error: any) {
      console.error("Error fetching perdcomp annotations:", error);
      throw error;
    }
  },

  createAnnotation: async (perdcompId: string, annotationData: any) => {
    try {
      console.log("Creating annotation for perdcomp:", perdcompId);
      console.log("Annotation data:", annotationData);

      const requestData = {
        ...annotationData,
        entity_type: "perdcomp",
        entity_id: perdcompId,
      };

      console.log("Request data:", requestData);
      const endpoint = `/perdcomps/annotations/by-perdcomp/${perdcompId}/`;
      console.log("API endpoint:", endpoint);

      const response = await api.post(endpoint, requestData);
      console.log("Annotation created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating annotation:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      throw error;
    }
  },

  updateAnnotation: async (annotationId: string, annotationData: any) => {
    try {
      const response = await api.put(
        `/perdcomps/annotations/${annotationId}/`,
        annotationData
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating annotation:", error);
      throw error;
    }
  },

  deleteAnnotation: async (annotationId: string) => {
    try {
      await api.delete(`/perdcomps/annotations/${annotationId}/`);
    } catch (error: any) {
      console.error("Error deleting annotation:", error);
      throw error;
    }
  },
}));
