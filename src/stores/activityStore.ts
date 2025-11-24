import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string | null;
  user_agent: string | null;
  details: any | null;
  created_at: string;
  
  // Aliases for compatibility with components
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  metadata?: any;
}

interface ActivityStore {
  activities: ActivityLog[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  
  fetchActivities: (page?: number) => Promise<void>;
  setCurrentPage: (page: number) => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 5,
  
  fetchActivities: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const { pageSize } = get();
      
      // Mock data for demonstration
      const mockActivities: ActivityLog[] = [
        {
          id: '1',
          user_id: 'user-123',
          action: 'create',
          resource_type: 'client',
          resource_id: 'client-001',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          details: { company_name: 'Empresa ABC Ltda' },
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
          entity_type: 'client',
          entity_id: 'client-001',
          entity_name: 'Empresa ABC Ltda',
          metadata: { company_name: 'Empresa ABC Ltda' },
        },
        {
          id: '2',
          user_id: 'user-123',
          action: 'update',
          resource_type: 'perdcomp',
          resource_id: 'perdcomp-001',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          details: { numero_processo: '12345.678910/2024-01', valor_pedido: 50000 },
          created_at: new Date(Date.now() - 15 * 60000).toISOString(),
          entity_type: 'perdcomp',
          entity_id: 'perdcomp-001',
          entity_name: 'Processo 12345.678910/2024-01',
          metadata: { numero_processo: '12345.678910/2024-01', valor_pedido: 50000 },
        },
        {
          id: '3',
          user_id: 'user-123',
          action: 'create',
          resource_type: 'request',
          resource_id: 'request-001',
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0',
          details: { subject: 'Nova solicitação de análise', action_type: 'retificacao' },
          created_at: new Date(Date.now() - 30 * 60000).toISOString(),
          entity_type: 'request',
          entity_id: 'request-001',
          entity_name: 'Nova solicitação de análise',
          metadata: { subject: 'Nova solicitação de análise', action_type: 'retificacao' },
        },
        {
          id: '4',
          user_id: 'user-456',
          action: 'delete',
          resource_type: 'client',
          resource_id: 'client-002',
          ip_address: '192.168.1.3',
          user_agent: 'Mozilla/5.0',
          details: { company_name: 'Empresa XYZ S.A.' },
          created_at: new Date(Date.now() - 60 * 60000).toISOString(),
          entity_type: 'client',
          entity_id: 'client-002',
          entity_name: 'Empresa XYZ S.A.',
          metadata: { company_name: 'Empresa XYZ S.A.' },
        },
        {
          id: '5',
          user_id: 'user-123',
          action: 'update',
          resource_type: 'perdcomp',
          resource_id: 'perdcomp-002',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          details: { numero_processo: '98765.432109/2024-02', status: 'em_andamento' },
          created_at: new Date(Date.now() - 90 * 60000).toISOString(),
          entity_type: 'perdcomp',
          entity_id: 'perdcomp-002',
          entity_name: 'Processo 98765.432109/2024-02',
          metadata: { numero_processo: '98765.432109/2024-02', status: 'em_andamento' },
        },
        {
          id: '6',
          user_id: 'user-789',
          action: 'create',
          resource_type: 'client',
          resource_id: 'client-003',
          ip_address: '192.168.1.4',
          user_agent: 'Mozilla/5.0',
          details: { company_name: 'Contabilidade Total Ltda' },
          created_at: new Date(Date.now() - 120 * 60000).toISOString(),
          entity_type: 'client',
          entity_id: 'client-003',
          entity_name: 'Contabilidade Total Ltda',
          metadata: { company_name: 'Contabilidade Total Ltda' },
        },
        {
          id: '7',
          user_id: 'user-123',
          action: 'update',
          resource_type: 'request',
          resource_id: 'request-002',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          details: { subject: 'Atualização de status', status: 'approved' },
          created_at: new Date(Date.now() - 150 * 60000).toISOString(),
          entity_type: 'request',
          entity_id: 'request-002',
          entity_name: 'Atualização de status',
          metadata: { subject: 'Atualização de status', status: 'approved' },
        },
        {
          id: '8',
          user_id: 'user-456',
          action: 'create',
          resource_type: 'perdcomp',
          resource_id: 'perdcomp-003',
          ip_address: '192.168.1.3',
          user_agent: 'Mozilla/5.0',
          details: { numero_processo: '11111.222222/2024-03', valor_pedido: 75000 },
          created_at: new Date(Date.now() - 180 * 60000).toISOString(),
          entity_type: 'perdcomp',
          entity_id: 'perdcomp-003',
          entity_name: 'Processo 11111.222222/2024-03',
          metadata: { numero_processo: '11111.222222/2024-03', valor_pedido: 75000 },
        },
        {
          id: '9',
          user_id: 'user-123',
          action: 'delete',
          resource_type: 'request',
          resource_id: 'request-003',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          details: { subject: 'Solicitação cancelada' },
          created_at: new Date(Date.now() - 210 * 60000).toISOString(),
          entity_type: 'request',
          entity_id: 'request-003',
          entity_name: 'Solicitação cancelada',
          metadata: { subject: 'Solicitação cancelada' },
        },
        {
          id: '10',
          user_id: 'user-789',
          action: 'update',
          resource_type: 'client',
          resource_id: 'client-004',
          ip_address: '192.168.1.4',
          user_agent: 'Mozilla/5.0',
          details: { company_name: 'Serviços Fiscais Brasil Ltda' },
          created_at: new Date(Date.now() - 240 * 60000).toISOString(),
          entity_type: 'client',
          entity_id: 'client-004',
          entity_name: 'Serviços Fiscais Brasil Ltda',
          metadata: { company_name: 'Serviços Fiscais Brasil Ltda' },
        },
      ];
      
      const totalCount = mockActivities.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = mockActivities.slice(from, to);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({ 
        activities: paginatedData, 
        totalCount,
        currentPage: page,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  setCurrentPage: (page: number) => {
    const { fetchActivities } = get();
    fetchActivities(page);
  }
}));