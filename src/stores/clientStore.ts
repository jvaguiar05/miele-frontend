import { create } from "zustand";
import api, { apiHelpers } from "@/lib/api";

// Annotation interface matching Django API structure
export interface ClientAnnotation {
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

// Client interface matching Django API structure
export interface Client {
  id: string; // UUID
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  tipo_empresa: string;
  recuperacao_judicial?: boolean | null;
  telefone_comercial?: string | null;
  email_comercial?: string | null;
  website?: string | null;
  telefone_contato?: string | null;
  email_contato?: string | null;
  quadro_societario?: Array<{
    nome: string;
    cargo: string;
  }>; // Merged JSONB field with person and role info
  responsavel_financeiro?: string | null;
  contador_responsavel?: string | null;
  regime_tributacao?: string | null;
  contrato_social?: string | null;
  ultima_alteracao_contratual?: string | null;
  rg_cpf_socios?: string | null;
  certificado_digital?: string | null;
  autorizado_para_envio?: boolean | null;
  atividades?: Array<{
    cnae: string;
    descricao: string;
  }>; // Merged JSONB field with CNAE and description
  client_status?: string | null;
  is_active?: boolean | null;
  address?: {
    id: string;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    municipio?: string | null;
    uf?: string | null;
    cep?: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;
  annotations?: ClientAnnotation[]; // Client annotations
  created_at?: string;
  updated_at?: string;
}

interface ClientFilters {
  tipo_empresa?: string;
  recuperacao_judicial?: boolean;
  uf?: string;
  regime_tributacao?: string;
  is_active?: boolean;
}

interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  filters: ClientFilters;

  fetchClients: (
    page?: number,
    searchQuery?: string,
    filters?: ClientFilters
  ) => Promise<void>;
  fetchClientById: (id: string | number) => Promise<Client>;
  fetchClientAnnotations: (clientId: string) => Promise<ClientAnnotation[]>;
  createAnnotation: (
    clientId: string,
    annotationData: any
  ) => Promise<ClientAnnotation>;
  updateAnnotation: (
    annotationId: string,
    annotationData: any
  ) => Promise<ClientAnnotation>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
  createClient: (clientData: Partial<Client>) => Promise<Client>;
  updateClient: (
    id: string | number,
    clientData: Partial<Client>
  ) => Promise<Client>;
  deleteClient: (id: string | number) => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
  searchClients: (query: string, filters?: ClientFilters) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: ClientFilters) => void;
  clearFilters: () => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  pageSize: 20, // Match Django default pagination
  totalCount: 0,
  filters: {},

  fetchClients: async (page = 1, searchQuery = "", filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const pageSize = get().pageSize;

      // Build query parameters for Django API
      const params: Record<string, any> = {
        is_active: true, // Always filter for active clients
        ordering: "razao_social", // Default ordering
        page,
      };

      // Add search query
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
      });

      const queryString = apiHelpers.buildQueryParams(params);
      const response = await api.get(`/clients/clients/?${queryString}`);
      const data = apiHelpers.handlePaginatedResponse(response);

      set({
        clients: data.results,
        totalCount: data.count,
        totalPages: Math.ceil(data.count / pageSize),
        currentPage: page,
        isLoading: false,
        filters: { ...get().filters, ...filters },
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar clientes",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchClientById: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch complete client data
      const response = await api.get(`/clients/clients/${id}/`);
      const client = response.data;

      // Fetch client annotations
      try {
        const annotationsResponse = await api.get(
          `/clients/annotations/by-client/${id}/`
        );
        client.annotations = annotationsResponse.data.results || [];
      } catch (annotationError) {
        console.warn("Failed to fetch client annotations:", annotationError);
        client.annotations = [];
      }

      set({
        selectedClient: client,
        isLoading: false,
      });

      return client;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar cliente",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchClientAnnotations: async (clientId: string) => {
    try {
      const response = await api.get(
        `/clients/annotations/by-client/${clientId}/`
      );
      return response.data.results || [];
    } catch (error: any) {
      console.error("Error fetching client annotations:", error);
      throw error;
    }
  },

  createAnnotation: async (clientId: string, annotationData: any) => {
    try {
      console.log("Creating annotation for client:", clientId);
      console.log("Annotation data:", annotationData);

      const requestData = {
        ...annotationData,
        entity_type: "client",
        entity_id: clientId,
      };

      console.log("Request data:", requestData);
      const endpoint = `/clients/annotations/by-client/${clientId}/`;
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
        `/clients/annotations/${annotationId}/`,
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
      await api.delete(`/clients/annotations/${annotationId}/`);
    } catch (error: any) {
      console.error("Error deleting annotation:", error);
      throw error;
    }
  },

  createClient: async (clientData: Partial<Client>) => {
    set({ isLoading: true, error: null });
    try {
      // Format data for Django API
      const formattedData = {
        ...clientData,
        created_at: undefined, // Let the API set this
        updated_at: undefined, // Let the API set this
        id: undefined, // Let the API set this
      };

      const response = await api.post("/clients/clients/", formattedData);
      const client = response.data;

      // Add to local state
      set((state) => ({
        clients: [client, ...state.clients],
        totalCount: state.totalCount + 1,
        isLoading: false,
      }));

      return client;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao criar cliente",
        isLoading: false,
      });
      throw error;
    }
  },

  updateClient: async (id: string | number, clientData: Partial<Client>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/clients/clients/${id}/`, clientData);
      const updatedClient = response.data;

      // Update local state
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? updatedClient : client
        ),
        selectedClient:
          state.selectedClient?.id === id
            ? updatedClient
            : state.selectedClient,
        isLoading: false,
      }));

      return updatedClient;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar cliente",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteClient: async (id: string | number) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/clients/clients/${id}/`);

      // Remove from local state
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        totalCount: Math.max(0, state.totalCount - 1),
        selectedClient:
          state.selectedClient?.id === id ? null : state.selectedClient,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || "Erro ao deletar cliente",
        isLoading: false,
      });
      throw error;
    }
  },

  setSelectedClient: (client: Client | null) => {
    set({ selectedClient: client });
  },

  searchClients: async (query: string, filters = {}) => {
    await get().fetchClients(1, query, filters);
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().fetchClients(page, "", get().filters);
  },

  setFilters: (filters: ClientFilters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchClients(1, "", { ...get().filters, ...filters });
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchClients(1, "", {});
  },
}));
