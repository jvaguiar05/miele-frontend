import { create } from "zustand";
import api, { apiHelpers } from "@/lib/api";

// Client interface matching Django API structure
interface Client {
  id: number;
  public_id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  tipo_empresa: string;
  recuperacao_judicial?: boolean | null;
  telefone_comercial?: string | null;
  email_comercial?: string | null;
  website?: string | null;
  telefone_contato?: string | null;
  email_contato?: string | null;
  quadro_societario?: any;
  cargos?: any;
  responsavel_financeiro?: string | null;
  contador_responsavel?: string | null;
  cnaes?: any;
  regime_tributacao?: any;
  contrato_social?: string | null;
  ultima_alteracao_contratual?: string | null;
  rg_cpf_socios?: string | null;
  certificado_digital?: string | null;
  autorizado_para_envio?: boolean | null;
  atividades?: any;
  client_status?: any;
  is_active?: boolean | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  anotacoes_anteriores?: string | null;
  nova_anotacao?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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
        page,
        page_size: pageSize,
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

      // Add ordering (default by razao_social)
      if (!params.ordering) {
        params.ordering = "razao_social";
      }

      const queryString = apiHelpers.buildQueryParams(params);
      const response = await api.get(`/clients/?${queryString}`);
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
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/clients/${id}/`
          : `/clients/${id}/`;

      const response = await api.get(endpoint);
      const client = response.data;

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

      const response = await api.post("/clients/", formattedData);
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
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/clients/${id}/`
          : `/clients/${id}/`;

      const response = await api.patch(endpoint, clientData);
      const updatedClient = response.data;

      // Update local state
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id || client.public_id === id ? updatedClient : client
        ),
        selectedClient:
          state.selectedClient?.id === id ||
          state.selectedClient?.public_id === id
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
      // Use public_id if it's a string (UUID), otherwise use the numeric ID
      const endpoint =
        typeof id === "string" && id.length > 10
          ? `/clients/${id}/`
          : `/clients/${id}/`;

      await api.delete(endpoint);

      // Remove from local state
      set((state) => ({
        clients: state.clients.filter(
          (client) => client.id !== id && client.public_id !== id
        ),
        totalCount: Math.max(0, state.totalCount - 1),
        selectedClient:
          state.selectedClient?.id === id ||
          state.selectedClient?.public_id === id
            ? null
            : state.selectedClient,
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
