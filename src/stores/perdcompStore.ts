import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

// PerdComp interface aligned with Django model
export type PerDcompStatus = 
  | 'RASCUNHO' 
  | 'TRANSMITIDO' 
  | 'EM_PROCESSAMENTO' 
  | 'DEFERIDO' 
  | 'INDEFERIDO' 
  | 'PARCIALMENTE_DEFERIDO' 
  | 'CANCELADO' 
  | 'VENCIDO';

export interface PerdComp {
  id: string;
  created_by_id?: string;
  client_id: string;
  
  // Dados do cliente (desnormalizado)
  cnpj?: string;
  
  // Identificação do processo
  numero: string;
  numero_perdcomp?: string;
  processo_protocolo?: string;
  
  // Datas importantes
  data_transmissao?: string;
  data_vencimento?: string;
  data_competencia?: string;
  
  // Dados fiscais
  tributo_pedido: string;
  competencia: string;
  
  // Valores monetários (string para precisão exata)
  valor_pedido: string;
  valor_compensado?: string;
  valor_recebido?: string;
  valor_saldo?: string;
  valor_selic?: string;
  
  // Status
  status: PerDcompStatus;
  
  // Anotações
  anotacoes?: string;
  
  // Controles
  is_active?: boolean;
  
  // Auditoria
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// Interface do banco Supabase atual
interface SupabasePerdComp {
  id: string;
  client_id: string;
  cnpj?: string;
  numero: string;
  numero_perdcomp?: string;
  processo_protocolo?: number;
  imposto: string;
  competencia: string;
  valor_solicitado: number;
  valor_recebido?: number;
  valor_compensado?: number;
  valor_saldo?: number;
  valor_selic?: number;
  status: string;
  data_transmissao?: string;
  data_vencimento?: string;
  data_competencia?: string;
  observacoes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// Função para converter do Supabase para a interface Django
function fromSupabase(supabaseData: any): PerdComp {
  return {
    id: supabaseData.id,
    client_id: supabaseData.client_id,
    numero: supabaseData.numero,
    cnpj: supabaseData.cnpj,
    numero_perdcomp: supabaseData.numero_perdcomp,
    processo_protocolo: supabaseData.processo_protocolo?.toString(),
    tributo_pedido: supabaseData.imposto,
    competencia: supabaseData.competencia,
    valor_pedido: supabaseData.valor_solicitado?.toString() || '0',
    valor_recebido: supabaseData.valor_recebido?.toString() || '0',
    valor_compensado: supabaseData.valor_compensado?.toString() || '0',
    valor_saldo: supabaseData.valor_saldo?.toString() || '0',
    valor_selic: supabaseData.valor_selic?.toString() || '0',
    status: supabaseData.status as PerDcompStatus,
    data_transmissao: supabaseData.data_transmissao,
    data_vencimento: supabaseData.data_vencimento,
    data_competencia: supabaseData.data_competencia,
    anotacoes: supabaseData.observacoes,
    created_at: supabaseData.created_at,
    updated_at: supabaseData.updated_at,
  };
}

// Função para converter da interface Django para o Supabase
function toSupabase(perdcomp: Partial<PerdComp>): Partial<SupabasePerdComp> {
  const supabaseData: any = {
    ...perdcomp,
  };
  
  // Mapear campos da nova interface para os antigos do Supabase
  if (perdcomp.tributo_pedido !== undefined) {
    supabaseData.imposto = perdcomp.tributo_pedido;
    delete supabaseData.tributo_pedido;
  }
  if (perdcomp.valor_pedido !== undefined) {
    supabaseData.valor_solicitado = parseFloat(perdcomp.valor_pedido);
    delete supabaseData.valor_pedido;
  }
  if (perdcomp.valor_recebido !== undefined) {
    supabaseData.valor_recebido = parseFloat(perdcomp.valor_recebido);
  }
  
  // Mapear anotacoes para observacoes
  if (perdcomp.anotacoes !== undefined) {
    supabaseData.observacoes = perdcomp.anotacoes;
    delete supabaseData.anotacoes;
  }
  
  // Remover apenas campos que realmente não existem no Supabase
  delete supabaseData.valor_compensado;
  delete supabaseData.valor_saldo;
  delete supabaseData.valor_selic;
  delete supabaseData.is_active;
  delete supabaseData.created_by_id;
  delete supabaseData.deleted_at;
  
  return supabaseData;
}

interface PerdCompState {
  perdcomps: PerdComp[];
  clientPerdComps: PerdComp[];
  selectedPerdComp: PerdComp | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  
  // Actions
  fetchPerdComps: (page?: number) => Promise<void>;
  fetchPerdCompById: (id: string) => Promise<PerdComp>;
  fetchPerdCompsByClient: (clientId: string) => Promise<void>;
  createPerdComp: (perdcompData: Partial<PerdComp>) => Promise<PerdComp>;
  updatePerdComp: (id: string, perdcompData: Partial<PerdComp>) => Promise<PerdComp>;
  deletePerdComp: (id: string) => Promise<void>;
  setSelectedPerdComp: (perdcomp: PerdComp | null) => void;
  searchPerdComps: (query: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
}

export const usePerdCompStore = create<PerdCompState>((set, get) => ({
  perdcomps: [],
  clientPerdComps: [],
  selectedPerdComp: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  totalCount: 0,

  fetchPerdComps: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const pageSize = get().pageSize;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('perdcomps')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      set({ 
        perdcomps: (data || []).map(fromSupabase), 
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Falha ao buscar PER/DCOMPs', isLoading: false });
    }
  },

  fetchPerdCompById: async (id: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('perdcomps')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      const perdcomp = fromSupabase(data);
      set({ selectedPerdComp: perdcomp, isLoading: false });
      return perdcomp;
    } catch (error) {
      set({ error: 'Falha ao buscar PER/DCOMP', isLoading: false });
      throw error;
    }
  },

  fetchPerdCompsByClient: async (clientId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('perdcomps')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ clientPerdComps: (data || []).map(fromSupabase), isLoading: false });
    } catch (error) {
      set({ error: 'Falha ao buscar PER/DCOMPs do cliente', isLoading: false });
    }
  },

  createPerdComp: async (perdcompData) => {
    set({ isLoading: true });
    try {
      const supabaseData = toSupabase(perdcompData);
      const { data, error } = await supabase
        .from('perdcomps')
        .insert([supabaseData] as any)
        .select()
        .single();
      
      if (error) throw error;
      
      const newPerdComp = fromSupabase(data);
      set(state => ({ 
        perdcomps: [newPerdComp, ...state.perdcomps],
        clientPerdComps: perdcompData.client_id ? [newPerdComp, ...state.clientPerdComps] : state.clientPerdComps,
        isLoading: false 
      }));
      return newPerdComp;
    } catch (error) {
      set({ error: 'Falha ao criar PER/DCOMP', isLoading: false });
      throw error;
    }
  },

  updatePerdComp: async (id, perdcompData) => {
    set({ isLoading: true });
    try {
      const supabaseData = toSupabase(perdcompData);
      const { data, error } = await supabase
        .from('perdcomps')
        .update(supabaseData as any)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('PER/DCOMP não encontrado ou você não tem permissão para atualizá-lo');
      }
      
      const updatedPerdComp = fromSupabase(data);
      set(state => ({
        perdcomps: state.perdcomps.map(pc => 
          pc.id === id ? updatedPerdComp : pc
        ),
        clientPerdComps: state.clientPerdComps.map(pc =>
          pc.id === id ? updatedPerdComp : pc
        ),
        selectedPerdComp: state.selectedPerdComp?.id === id ? updatedPerdComp : state.selectedPerdComp,
        isLoading: false
      }));
      return updatedPerdComp;
    } catch (error) {
      set({ error: 'Falha ao atualizar PER/DCOMP', isLoading: false });
      throw error;
    }
  },

  deletePerdComp: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('perdcomps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        perdcomps: state.perdcomps.filter(pc => pc.id !== id),
        clientPerdComps: state.clientPerdComps.filter(pc => pc.id !== id),
        selectedPerdComp: state.selectedPerdComp?.id === id ? null : state.selectedPerdComp,
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Falha ao deletar PER/DCOMP', isLoading: false });
      throw error;
    }
  },

  setSelectedPerdComp: (perdcomp) => set({ selectedPerdComp: perdcomp }),

  searchPerdComps: async (query) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('perdcomps')
        .select('*')
        .or(`numero.ilike.%${query}%,imposto.ilike.%${query}%,competencia.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ perdcomps: (data || []).map(fromSupabase), isLoading: false });
    } catch (error) {
      set({ error: 'Falha na busca', isLoading: false });
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),
}));