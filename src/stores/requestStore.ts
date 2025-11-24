import { create } from 'zustand';

// Request interface - seguindo o padrão ApprovalRequest do backend
interface Request {
  id: string;
  public_id?: string;
  subject: string; // Assunto da solicitação
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'custom';
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  resource_type: string; // Ex: 'clients.Client', 'perdcomps.PerdComp', 'custom'
  resource_id: string; // ID do recurso a ser modificado
  payload_diff: any; // Diferença dos dados (antes/depois)
  reason: string; // Motivo/justificativa da solicitação
  requested_by: string; // Usuário que fez a solicitação
  approved_by?: string; // Usuário que aprovou/rejeitou
  created_at: string;
  updated_at: string;
  approved_at?: string;
  executed_at?: string;
  metadata?: any; // Informações adicionais
  approval_notes?: string; // Notas do aprovador
}

interface RequestFilters {
  action: 'all' | 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'custom';
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  resource_type: 'all' | 'clients' | 'perdcomps' | 'custom';
  search: string;
}

interface RequestState {
  requests: Request[];
  filteredRequests: Request[];
  clientRequests: Request[];
  perdcompRequests: Request[];
  selectedRequest: Request | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  allRequests: Request[];
  
  // Actions
  fetchRequests: (page?: number) => Promise<void>;
  fetchClientRequests: () => Promise<void>;
  fetchPerdCompRequests: () => Promise<void>;
  fetchRequestById: (id: string) => Promise<Request>;
  createRequest: (requestData: Partial<Request>) => Promise<Request>;
  updateRequest: (id: string, requestData: Partial<Request>) => Promise<Request>;
  deleteRequest: (id: string) => Promise<void>;
  revokeRequest: (id: string) => Promise<void>;
  setSelectedRequest: (request: Request | null) => void;
  searchRequests: (query: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  applyFilters: (filters: RequestFilters) => void;
}

// Mock data generator - All requests from a single user
const CURRENT_USER_EMAIL = 'joao.silva@empresa.com';

const generateMockRequests = (): Request[] => {
  const actions: Request['action'][] = ['create', 'update', 'delete', 'activate', 'deactivate', 'custom'];
  const statuses: Request['status'][] = ['pending', 'approved', 'rejected', 'executed', 'cancelled'];
  const resourceTypes = ['clients.Client', 'perdcomps.PerdComp', 'custom'];
  
  const mockRequests: Request[] = [];
  
  for (let i = 1; i <= 25; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30));
    
    const approvedDate = status !== 'pending' ? new Date(baseDate.getTime() + Math.random() * 86400000) : undefined;
    const executedDate = status === 'executed' ? new Date((approvedDate?.getTime() || baseDate.getTime()) + Math.random() * 86400000) : undefined;
    
    let subject = '';
    let reason = '';
    let payloadDiff = {};
    
    if (resourceType === 'clients.Client') {
      const actionText = {
        create: 'Criar',
        update: 'Atualizar',
        delete: 'Excluir',
        activate: 'Ativar',
        deactivate: 'Desativar',
        custom: 'Ação personalizada em'
      }[action];
      subject = `${actionText} cliente - CNPJ ${Math.floor(Math.random() * 90000000000000) + 10000000000000}`;
      reason = `Solicitação de ${action === 'create' ? 'cadastro de novo cliente' : action === 'update' ? 'atualização de dados cadastrais' : action === 'delete' ? 'exclusão de cliente inativo' : action === 'activate' ? 'ativação de cliente' : action === 'deactivate' ? 'desativação de cliente' : 'ação personalizada no cliente'}.`;
      payloadDiff = action === 'update' ? {
        before: { razao_social: 'Nome Antigo Ltda', status: 'ativo' },
        after: { razao_social: 'Nome Novo Ltda', status: 'ativo' }
      } : action === 'create' ? {
        after: { razao_social: `Empresa ${i} Ltda`, cnpj: `${Math.floor(Math.random() * 90000000000000) + 10000000000000}` }
      } : {};
    } else if (resourceType === 'perdcomps.PerdComp') {
      const actionText = {
        create: 'Criar',
        update: 'Atualizar',
        delete: 'Excluir',
        activate: 'Ativar',
        deactivate: 'Desativar',
        custom: 'Ação personalizada em'
      }[action];
      const amount = (Math.random() * 100000).toFixed(2);
      subject = `${actionText} PER/DCOMP - Valor R$ ${amount}`;
      reason = `Solicitação de ${action === 'create' ? 'criação de nova compensação tributária' : action === 'update' ? 'atualização de dados da compensação' : action === 'delete' ? 'exclusão de compensação' : action === 'activate' ? 'ativação de compensação' : action === 'deactivate' ? 'desativação de compensação' : 'ação personalizada na compensação'}.`;
      payloadDiff = action === 'update' ? {
        before: { valor: parseFloat(amount), status: 'em_analise' },
        after: { valor: parseFloat(amount) * 1.1, status: 'aprovado' }
      } : action === 'create' ? {
        after: { valor: parseFloat(amount), tipo: 'PER', periodo: '2024-01' }
      } : {};
    } else {
      subject = `Ação personalizada no sistema - ${i}`;
      reason = 'Solicitação de ação customizada que não se enquadra nas operações padrão do sistema.';
      payloadDiff = { custom_data: `Dados customizados da ação ${i}` };
    }
    
    const request: Request = {
      id: `req_${i.toString().padStart(3, '0')}`,
      public_id: `${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`,
      subject,
      action,
      status,
      resource_type: resourceType,
      resource_id: resourceType === 'custom' ? `custom_${i}` : `${resourceType.split('.')[0]}_${i}`,
      payload_diff: payloadDiff,
      reason,
      requested_by: CURRENT_USER_EMAIL,
      approved_by: status !== 'pending' ? `admin_${Math.floor(Math.random() * 3) + 1}@empresa.com` : undefined,
      created_at: baseDate.toISOString(),
      updated_at: new Date(baseDate.getTime() + Math.random() * 86400000).toISOString(),
      approved_at: approvedDate?.toISOString(),
      executed_at: executedDate?.toISOString(),
      metadata: resourceType === 'clients.Client' ? {
        client_name: `Cliente ${i}`,
        cnpj: `${Math.floor(Math.random() * 90000000000000) + 10000000000000}`
      } : resourceType === 'perdcomps.PerdComp' ? {
        perdcomp_name: `PER/DCOMP ${i}`,
        amount: Math.random() * 100000
      } : {},
      approval_notes: status === 'approved' || status === 'executed' ? 'Solicitação aprovada após análise.' : status === 'rejected' ? 'Solicitação rejeitada - documentação incompleta.' : undefined
    };
    
    mockRequests.push(request);
  }
  
  return mockRequests;
};

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  filteredRequests: [],
  clientRequests: [],
  perdcompRequests: [],
  selectedRequest: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  totalCount: 0,
  allRequests: [],

  fetchRequests: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = generateMockRequests();
      const pageSize = get().pageSize;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      
      set({ 
        allRequests: mockData,
        filteredRequests: mockData,
        requests: mockData.slice(from, to), 
        totalCount: mockData.length,
        totalPages: Math.ceil(mockData.length / pageSize),
        currentPage: page,
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Falha ao buscar solicitações', isLoading: false });
    }
  },

  fetchClientRequests: async () => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockData = generateMockRequests().filter(r => r.resource_type.includes('Client'));
      set({ clientRequests: mockData, isLoading: false });
    } catch (error) {
      set({ error: 'Falha ao buscar solicitações de clientes', isLoading: false });
    }
  },

  fetchPerdCompRequests: async () => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockData = generateMockRequests().filter(r => r.resource_type.includes('PerdComp'));
      set({ perdcompRequests: mockData, isLoading: false });
    } catch (error) {
      set({ error: 'Falha ao buscar solicitações de PER/DCOMP', isLoading: false });
    }
  },

  fetchRequestById: async (id: string) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockData = generateMockRequests();
      const request = mockData.find(r => r.id === id);
      
      if (!request) throw new Error('Solicitação não encontrada');
      
      set({ selectedRequest: request, isLoading: false });
      return request;
    } catch (error) {
      set({ error: 'Falha ao buscar solicitação', isLoading: false });
      throw error;
    }
  },

  createRequest: async (requestData) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newRequest: Request = {
        id: `req_${Date.now()}`,
        public_id: `${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`,
        subject: requestData.subject || 'Nova Solicitação Personalizada',
        action: 'custom',
        status: 'pending',
        resource_type: 'custom',
        resource_id: `custom_${Date.now()}`,
        payload_diff: requestData.payload_diff || {},
        reason: requestData.reason || '',
        requested_by: CURRENT_USER_EMAIL,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: requestData.metadata || {},
        ...requestData
      } as Request;
      
      set(state => ({ 
        requests: [newRequest, ...state.requests],
        allRequests: [newRequest, ...state.allRequests],
        filteredRequests: [newRequest, ...state.filteredRequests],
        isLoading: false 
      }));
      
      return newRequest;
    } catch (error) {
      set({ error: 'Falha ao criar solicitação', isLoading: false });
      throw error;
    }
  },

  updateRequest: async (id, requestData) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        requests: state.requests.map(request => 
          request.id === id 
            ? { ...request, ...requestData, updated_at: new Date().toISOString() }
            : request
        ),
        clientRequests: state.clientRequests.map(request => 
          request.id === id 
            ? { ...request, ...requestData, updated_at: new Date().toISOString() }
            : request
        ),
        perdcompRequests: state.perdcompRequests.map(request => 
          request.id === id 
            ? { ...request, ...requestData, updated_at: new Date().toISOString() }
            : request
        ),
        selectedRequest: state.selectedRequest?.id === id 
          ? { ...state.selectedRequest, ...requestData, updated_at: new Date().toISOString() }
          : state.selectedRequest,
        isLoading: false
      }));

      const updatedRequest = get().requests.find(r => r.id === id) || 
                           get().clientRequests.find(r => r.id === id) || 
                           get().perdcompRequests.find(r => r.id === id);
      
      return updatedRequest as Request;
    } catch (error) {
      set({ error: 'Falha ao atualizar solicitação', isLoading: false });
      throw error;
    }
  },

  deleteRequest: async (id) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        requests: state.requests.filter(request => request.id !== id),
        clientRequests: state.clientRequests.filter(request => request.id !== id),
        perdcompRequests: state.perdcompRequests.filter(request => request.id !== id),
        selectedRequest: state.selectedRequest?.id === id ? null : state.selectedRequest,
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Falha ao deletar solicitação', isLoading: false });
      throw error;
    }
  },

  revokeRequest: async (id) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        requests: state.requests.map(request => 
          request.id === id 
            ? { ...request, status: 'rejected' as const, updated_at: new Date().toISOString() }
            : request
        ),
        clientRequests: state.clientRequests.map(request => 
          request.id === id 
            ? { ...request, status: 'rejected' as const, updated_at: new Date().toISOString() }
            : request
        ),
        perdcompRequests: state.perdcompRequests.map(request => 
          request.id === id 
            ? { ...request, status: 'rejected' as const, updated_at: new Date().toISOString() }
            : request
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Falha ao revogar solicitação', isLoading: false });
      throw error;
    }
  },

  setSelectedRequest: (request) => set({ selectedRequest: request }),

  searchRequests: async (query) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockData = generateMockRequests();
      const filteredData = mockData.filter(request => 
        request.subject.toLowerCase().includes(query.toLowerCase()) ||
        request.reason.toLowerCase().includes(query.toLowerCase()) ||
        request.requested_by.toLowerCase().includes(query.toLowerCase())
      );
      
      set({ requests: filteredData, isLoading: false });
    } catch (error) {
      set({ error: 'Falha na busca', isLoading: false });
    }
  },

  setCurrentPage: (page) => {
    const { filteredRequests, pageSize } = get();
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    
    set({ 
      currentPage: page,
      requests: filteredRequests.slice(from, to)
    });
  },

  applyFilters: (filters: RequestFilters) => {
    const { allRequests, pageSize } = get();
    
    let filtered = allRequests.filter(request => {
      // Action filter
      if (filters.action !== 'all' && request.action !== filters.action) return false;
      
      // Status filter
      if (filters.status !== 'all' && request.status !== filters.status) return false;
      
      // Resource type filter
      if (filters.resource_type !== 'all') {
        if (filters.resource_type === 'clients' && !request.resource_type.includes('Client')) return false;
        if (filters.resource_type === 'perdcomps' && !request.resource_type.includes('PerdComp')) return false;
        if (filters.resource_type === 'custom' && request.resource_type !== 'custom') return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          request.subject.toLowerCase().includes(searchTerm) ||
          request.reason.toLowerCase().includes(searchTerm) ||
          request.requested_by.toLowerCase().includes(searchTerm) ||
          request.resource_id.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      
      return true;
    });
    
    const totalPages = Math.ceil(filtered.length / pageSize);
    const currentPage = 1; // Reset to first page when filtering
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize;
    
    set({
      filteredRequests: filtered,
      requests: filtered.slice(from, to),
      totalCount: filtered.length,
      totalPages,
      currentPage
    });
  },
}));