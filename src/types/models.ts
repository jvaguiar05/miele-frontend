// TypeScript interfaces for current Supabase implementation
// TODO: These will be migrated to match Django models when backend is implemented

// For now, keeping current structure to avoid breaking changes
// The Django models provided show the future structure with:
// - ID as BigInt (internal) and UUID (public_id for API)
// - Address as separate table
// - Annotations and Files as generic relations
// - JSON fields for quadro_societario, cargos, cnaes, atividades
// - Regime_tributacao instead of regime_tributario
// - Website instead of site
// - Numeric values as strings for precision

// When implementing Django backend, refer to uploaded models.py files for exact structure

// ============================================
// Address Model (Future)
// ============================================
export interface Address {
  id?: string | number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Client Model (Current Supabase structure)
// ============================================

export enum ClientStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

export enum RegimeTributacao {
  LUCRO_REAL = "lucro_real",
  LUCRO_PRESUMIDO = "lucro_presumido",
}

export interface Client {
  id: string;
  public_id?: string;

  // Dados principais
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo_empresa: string;
  recuperacao_judicial?: boolean;

  // Contatos comerciais
  telefone_comercial?: string;
  email_comercial?: string;
  site?: string;
  website?: string; // Alias for future compatibility

  // Contatos diretos
  telefone_contato?: string;
  email_contato?: string;

  // Dados societários e estruturais (merged JSONB field)
  quadro_societario?: Array<{
    nome: string;
    cargo: string;
  }>;
  responsavel_financeiro?: string;
  contador_responsavel?: string;

  // Dados fiscais (merged JSONB field)
  atividades?: Array<{
    cnae: string;
    descricao: string;
  }>;
  regime_tributario?: string;
  regime_tributacao?: RegimeTributacao | "";

  // Documentos e contratos
  contrato_social?: string;
  ultima_alteracao_contratual?: string | null;
  rg_cpf_socios?: string;
  certificado_digital?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;

  // Controles
  autorizado_para_envio?: boolean;

  // Legacy fields for backward compatibility (deprecated)
  cargo?: string;
  cargos?: Record<string, any>;
  cnae?: string;
  cnaes?: any[];

  // Status e controle
  client_status?: ClientStatus;
  is_active?: boolean;

  // Endereço (inline for now, nested in future)
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  address_id?: number | null;
  address?: Address;

  // Anotações (legacy)
  anotacoes_anteriores?: string;
  nova_anotacao?: string;

  // Auditoria
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ============================================
// PerDcomp Model (Current Supabase structure)
// ============================================

export enum PerDcompStatus {
  RASCUNHO = "RASCUNHO",
  TRANSMITIDO = "TRANSMITIDO",
  EM_PROCESSAMENTO = "EM_PROCESSAMENTO",
  DEFERIDO = "DEFERIDO",
  INDEFERIDO = "INDEFERIDO",
  PARCIALMENTE_DEFERIDO = "PARCIALMENTE_DEFERIDO",
  CANCELADO = "CANCELADO",
  VENCIDO = "VENCIDO",
}

export interface PerDcomp {
  id: string;
  public_id?: string;

  // Relacionamentos
  client_id: string;
  created_by_id?: number;

  // Dados do cliente (desnormalizado)
  cnpj?: string;

  // Identificação do processo
  numero: string;
  numero_perdcomp?: string;
  processo_protocolo?: number;

  // Datas importantes
  data_transmissao?: string | null;
  data_vencimento?: string;
  data_competencia?: string;

  // Dados fiscais
  imposto?: string; // legacy
  tributo_pedido?: string; // new
  competencia: string;

  // Valores monetários
  valor_solicitado?: number;
  valor_pedido?: string | number;
  valor_compensado?: string | number;
  valor_recebido?: number | string;
  valor_saldo?: string | number;
  valor_selic?: string | number;

  // Status do processo
  status: string;

  // Controles de sistema
  is_active?: boolean;

  // Observações (legacy)
  observacoes?: string;

  // Auditoria
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  // Computed properties
  esta_vencido?: boolean;
  pode_ser_editado?: boolean;
  pode_ser_cancelado?: boolean;
}

// ============================================
// Annotation Model (Future)
// ============================================
export interface Annotation {
  id: number;
  public_id: string;
  content_type: number;
  object_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================
// Attached File Model (Future)
// ============================================
export interface AttachedFile {
  id: number;
  public_id: string;
  content_type: number;
  object_id: number;
  file_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  description: string;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// File type choices
export const CLIENT_FILE_TYPES = {
  CONTRATO: "contrato",
  CARTAO_CNPJ: "cartao_cnpj",
} as const;

export const PERDCOMP_FILE_TYPES = {
  RECIBO: "recibo",
  AVISO_RECEBIMENTO: "aviso_recebimento",
  PERDCOMP: "perdcomp",
} as const;

// ============================================
// Helper Types for API
// ============================================

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Create/Update DTOs
export type ClientCreate = Partial<Client> & {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
};

export type PerDcompCreate = Partial<PerDcomp> & {
  client_id: string;
  numero: string;
  competencia: string;
};

export type ClientUpdate = Partial<Client>;
export type PerDcompUpdate = Partial<PerDcomp>;

// Filter types
export interface ClientFilters {
  tipo_empresa?: string;
  client_status?: ClientStatus;
  recuperacao_judicial?: boolean;
  uf?: string;
  regime_tributario?: string;
  regime_tributacao?: RegimeTributacao;
  is_active?: boolean;
}

export interface PerDcompFilters {
  status?: string;
  client_id?: string | number;
  is_active?: boolean;
  data_vencimento_min?: string;
  data_vencimento_max?: string;
}
