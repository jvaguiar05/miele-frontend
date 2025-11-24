import { create } from "zustand";
import api, { apiHelpers } from "@/lib/api";

// Request interface following Django ApprovalRequest model
interface Request {
  id: number;
  public_id?: string;
  subject: string; // Assunto da solicitação
  action: "create" | "update" | "delete" | "activate" | "deactivate" | "custom";
  status: "pending" | "approved" | "rejected" | "executed" | "cancelled";
  resource_type: string; // Ex: 'clients.Client', 'perdcomps.PerdComp', 'custom'
  resource_id: string; // ID do recurso a ser modificado
  payload_diff: any; // Diferença dos dados (antes/depois)
  reason: string; // Motivo/justificativa da solicitação
  requested_by: number; // ID do usuário que fez a solicitação
  approved_by?: number; // ID do usuário que aprovou/rejeitou
  created_at: string;
  updated_at: string;
  approved_at?: string;
  executed_at?: string;
  metadata?: any; // Informações adicionais
  approval_notes?: string; // Notas do aprovador

  // Populated fields from API
  requested_by_user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  approved_by_user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface RequestFilters {
  action?:
    | "all"
    | "create"
    | "update"
    | "delete"
    | "activate"
    | "deactivate"
    | "custom";
  status?:
    | "all"
    | "pending"
    | "approved"
    | "rejected"
    | "executed"
    | "cancelled";
  resource_type?: "all" | "clients" | "perdcomps" | "custom";
  search?: string;
  requested_by?: number;
}

interface RequestState {
  requests: Request[];
  filteredRequests: Request[];
  selectedRequest: Request | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  filters: RequestFilters;

  // Actions
  fetchRequests: (page?: number, filters?: RequestFilters) => Promise<void>;
  fetchRequestById: (id: string | number) => Promise<Request>;
  createRequest: (requestData: Partial<Request>) => Promise<Request>;
  updateRequest: (
    id: string | number,
    requestData: Partial<Request>
  ) => Promise<Request>;
  approveRequest: (id: string | number, notes?: string) => Promise<Request>;
  rejectRequest: (id: string | number, notes: string) => Promise<Request>;
  executeRequest: (id: string | number) => Promise<Request>;
  cancelRequest: (id: string | number, reason?: string) => Promise<Request>;
  setSelectedRequest: (request: Request | null) => void;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: RequestFilters) => void;
  clearFilters: () => void;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  filteredRequests: [],
  selectedRequest: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  pageSize: 20,
  totalCount: 0,
  filters: {},

  fetchRequests: async (page = 1, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const pageSize = get().pageSize;

      // Build query parameters for Django API
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "all"
        ) {
          params[key] = value;
        }
      });

      // Default ordering by creation date (newest first)
      if (!params.ordering) {
        params.ordering = "-created_at";
      }

      const queryString = apiHelpers.buildQueryParams(params);
      const response = await api.get(`/requests/?${queryString}`);
      const data = apiHelpers.handlePaginatedResponse(response);

      set({
        requests: data.results,
        filteredRequests: data.results,
        totalCount: data.count,
        totalPages: Math.ceil(data.count / pageSize),
        currentPage: page,
        isLoading: false,
        filters: { ...get().filters, ...filters },
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar solicitações",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchRequestById: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/requests/${id}/`
          : `/requests/${id}/`;

      const response = await api.get(endpoint);
      const request = response.data;

      set({
        selectedRequest: request,
        isLoading: false,
      });

      return request;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar solicitação",
        isLoading: false,
      });
      throw error;
    }
  },

  createRequest: async (requestData: Partial<Request>) => {
    set({ isLoading: true, error: null });
    try {
      // Format data for Django API
      const formattedData = {
        ...requestData,
        created_at: undefined, // Let the API set this
        updated_at: undefined, // Let the API set this
        id: undefined, // Let the API set this
      };

      const response = await api.post("/requests/", formattedData);
      const request = response.data;

      // Add to local state
      set((state) => ({
        requests: [request, ...state.requests],
        filteredRequests: [request, ...state.filteredRequests],
        totalCount: state.totalCount + 1,
        isLoading: false,
      }));

      return request;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao criar solicitação",
        isLoading: false,
      });
      throw error;
    }
  },

  updateRequest: async (id: string | number, requestData: Partial<Request>) => {
    set({ isLoading: true, error: null });
    try {
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/requests/${id}/`
          : `/requests/${id}/`;

      const response = await api.patch(endpoint, requestData);
      const updatedRequest = response.data;

      // Update local state
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        filteredRequests: state.filteredRequests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        selectedRequest:
          state.selectedRequest?.id === id ||
          state.selectedRequest?.public_id === id
            ? updatedRequest
            : state.selectedRequest,
        isLoading: false,
      }));

      return updatedRequest;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar solicitação",
        isLoading: false,
      });
      throw error;
    }
  },

  approveRequest: async (id: string | number, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/requests/${id}/approve/`
          : `/requests/${id}/approve/`;

      const response = await api.post(endpoint, {
        approval_notes: notes || "",
      });

      const updatedRequest = response.data;

      // Update local state
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        filteredRequests: state.filteredRequests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        selectedRequest:
          state.selectedRequest?.id === id ||
          state.selectedRequest?.public_id === id
            ? updatedRequest
            : state.selectedRequest,
        isLoading: false,
      }));

      return updatedRequest;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao aprovar solicitação",
        isLoading: false,
      });
      throw error;
    }
  },

  rejectRequest: async (id: string | number, notes: string) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/requests/${id}/reject/`
          : `/requests/${id}/reject/`;

      const response = await api.post(endpoint, {
        approval_notes: notes,
      });

      const updatedRequest = response.data;

      // Update local state
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        filteredRequests: state.filteredRequests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        selectedRequest:
          state.selectedRequest?.id === id ||
          state.selectedRequest?.public_id === id
            ? updatedRequest
            : state.selectedRequest,
        isLoading: false,
      }));

      return updatedRequest;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao rejeitar solicitação",
        isLoading: false,
      });
      throw error;
    }
  },

  executeRequest: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/requests/${id}/execute/`
          : `/requests/${id}/execute/`;

      const response = await api.post(endpoint);
      const updatedRequest = response.data;

      // Update local state
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        filteredRequests: state.filteredRequests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        selectedRequest:
          state.selectedRequest?.id === id ||
          state.selectedRequest?.public_id === id
            ? updatedRequest
            : state.selectedRequest,
        isLoading: false,
      }));

      return updatedRequest;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao executar solicitação",
        isLoading: false,
      });
      throw error;
    }
  },

  cancelRequest: async (id: string | number, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/requests/${id}/cancel/`
          : `/requests/${id}/cancel/`;

      const response = await api.post(endpoint, {
        reason: reason || "Cancelado pelo usuário",
      });

      const updatedRequest = response.data;

      // Update local state
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        filteredRequests: state.filteredRequests.map((request) =>
          request.id === id || request.public_id === id
            ? updatedRequest
            : request
        ),
        selectedRequest:
          state.selectedRequest?.id === id ||
          state.selectedRequest?.public_id === id
            ? updatedRequest
            : state.selectedRequest,
        isLoading: false,
      }));

      return updatedRequest;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao cancelar solicitação",
        isLoading: false,
      });
      throw error;
    }
  },

  setSelectedRequest: (request: Request | null) => {
    set({ selectedRequest: request });
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().fetchRequests(page, get().filters);
  },

  setFilters: (filters: RequestFilters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchRequests(1, { ...get().filters, ...filters });
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchRequests(1, {});
  },
}));
