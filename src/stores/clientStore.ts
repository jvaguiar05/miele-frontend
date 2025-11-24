import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

// Client interface matching Supabase table schema
interface Client {
  id: string;
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
  regime_tributario?: string;
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
  
  fetchClients: (page?: number, searchQuery?: string, filters?: ClientFilters) => Promise<void>;
  fetchClientById: (id: string) => Promise<Client>;
  createClient: (clientData: Partial<Client>) => Promise<Client>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
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
  pageSize: 10,
  totalCount: 0,
  filters: {},

  fetchClients: async (page = 1, searchQuery = '', filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const pageSize = get().pageSize;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' });

      if (searchQuery.trim()) {
        query = query.or(`cnpj.ilike.%${searchQuery}%,razao_social.ilike.%${searchQuery}%,nome_fantasia.ilike.%${searchQuery}%`);
      }

      if (filters.tipo_empresa) {
        query = query.eq('tipo_empresa', filters.tipo_empresa);
      }
      if (filters.recuperacao_judicial !== undefined) {
        query = query.eq('recuperacao_judicial', filters.recuperacao_judicial);
      }
      if (filters.uf) {
        query = query.eq('uf', filters.uf);
      }
      if (filters.regime_tributario) {
        query = query.eq('regime_tributacao', filters.regime_tributario as any);
      }

      const { data, error, count } = await query
        .order('razao_social', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      
      set({
        clients: (data || []) as Client[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Falha ao buscar clientes', isLoading: false });
    }
  },

  fetchClientById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({
        selectedClient: data as Client,
        isLoading: false
      });
      
      return data as Client;
    } catch (error: any) {
      set({ error: error.message || 'Falha ao buscar cliente', isLoading: false });
      throw error;
    }
  },

  createClient: async (clientData: Partial<Client>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData as any)
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        clients: [data as Client, ...state.clients],
        isLoading: false
      }));
      
      return data as Client;
    } catch (error: any) {
      set({ error: error.message || 'Falha ao criar cliente', isLoading: false });
      throw error;
    }
  },

  updateClient: async (id: string, clientData: Partial<Client>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData as any)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('Cliente não encontrado ou você não tem permissão para atualizá-lo');
      }
      
      set(state => ({
        clients: state.clients.map(c => c.id === id ? data as Client : c),
        selectedClient: state.selectedClient?.id === id ? data as Client : state.selectedClient,
        isLoading: false
      }));
      
      return data as Client;
    } catch (error: any) {
      set({ error: error.message || 'Falha ao atualizar cliente', isLoading: false });
      throw error;
    }
  },

  deleteClient: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        clients: state.clients.filter(c => c.id !== id),
        selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Falha ao deletar cliente', isLoading: false });
      throw error;
    }
  },

  setSelectedClient: (client) => set({ selectedClient: client }),

  searchClients: async (query, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      let supaQuery = supabase
        .from('clients')
        .select('*', { count: 'exact' });

      if (query.trim()) {
        supaQuery = supaQuery.or(`cnpj.ilike.%${query}%,razao_social.ilike.%${query}%,nome_fantasia.ilike.%${query}%`);
      }

      if (filters.tipo_empresa) {
        supaQuery = supaQuery.eq('tipo_empresa', filters.tipo_empresa);
      }
      if (filters.recuperacao_judicial !== undefined) {
        supaQuery = supaQuery.eq('recuperacao_judicial', filters.recuperacao_judicial);
      }
      if (filters.uf) {
        supaQuery = supaQuery.eq('uf', filters.uf);
      }
      if (filters.regime_tributario) {
        supaQuery = supaQuery.eq('regime_tributacao', filters.regime_tributario as any);
      }

      const { data, error, count } = await supaQuery.order('razao_social', { ascending: true });
      
      if (error) throw error;
      
      set({
        clients: (data || []) as Client[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / get().pageSize),
        currentPage: 1,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Falha na busca', isLoading: false });
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),
}));
