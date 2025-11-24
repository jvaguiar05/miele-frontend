// API Response types for Django REST Framework
export interface ApiResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Error response structure from Django API
export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    correlation_id: string;
  };
}

// Validation error structure
export interface ValidationError {
  error: {
    code: "validation_error";
    message: string;
    details: Record<string, string[]>;
    correlation_id: string;
  };
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshRequest {
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

// User types matching Django User model
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string; // computed field
  phone?: string;
  avatar?: string;
  two_factor_enabled?: boolean;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined: string;
  last_login: string | null;
}

// Client types matching Django Client model
export interface Client {
  id: number;
  public_id?: string; // UUID for external references
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
  quadro_societario?: Record<string, unknown>; // JSON field
  cargos?: Record<string, unknown>; // JSON field
  responsavel_financeiro?: string | null;
  contador_responsavel?: string | null;
  cnaes?: Record<string, unknown>[]; // JSON field
  regime_tributacao?: Record<string, unknown>; // JSON field
  contrato_social?: string | null;
  ultima_alteracao_contratual?: string | null;
  rg_cpf_socios?: string | null;
  certificado_digital?: string | null;
  autorizado_para_envio?: boolean | null;
  atividades?: Record<string, unknown>[]; // JSON field
  client_status?: Record<string, unknown>; // JSON field
  is_active?: boolean | null;

  // Address fields (embedded or relation)
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;

  // Audit fields
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Request/Approval types
export interface ApprovalRequest {
  id: number;
  public_id?: string;
  subject: string;
  action: "create" | "update" | "delete" | "activate" | "deactivate" | "custom";
  status: "pending" | "approved" | "rejected" | "executed" | "cancelled";
  resource_type: string;
  resource_id: string;
  payload_diff: Record<string, unknown>; // JSON field
  reason: string;
  requested_by: number;
  approved_by?: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  executed_at?: string;
  metadata?: Record<string, unknown>; // JSON field
  approval_notes?: string;

  // Related objects
  requested_by_user?: User;
  approved_by_user?: User;
}

// Activity log types
export interface ActivityLog {
  id: number;
  public_id?: string;
  user_id: number | null;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null; // JSON field
  created_at: string;

  // Related objects
  user?: User;
}

// Annotation types
export interface Annotation {
  id: number;
  public_id?: string;
  user_id: number;
  entity_type: string;
  entity_id: number;
  content: string;
  created_at: string;
  updated_at: string;

  // Related objects
  user?: User;
}

// PerdComp types
export type PerDcompStatus =
  | "RASCUNHO"
  | "TRANSMITIDO"
  | "EM_PROCESSAMENTO"
  | "DEFERIDO"
  | "INDEFERIDO"
  | "PARCIALMENTE_DEFERIDO"
  | "CANCELADO"
  | "VENCIDO";

export interface PerdComp {
  id: number;
  public_id?: string;
  created_by?: number;
  client_id: number;

  // Identification
  numero: string;
  numero_perdcomp?: string;
  processo_protocolo?: string;

  // Important dates
  data_transmissao?: string;
  data_vencimento?: string;
  data_competencia?: string;

  // Tax data
  tributo_pedido: string;
  competencia: string;

  // Monetary values (strings for precision)
  valor_pedido: string;
  valor_compensado?: string;
  valor_recebido?: string;
  valor_saldo?: string;
  valor_selic?: string;

  // Status
  status: PerDcompStatus;

  // Notes
  anotacoes?: string;

  // Control fields
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;

  // Related objects
  client?: Client;
  created_by_user?: User;
}

// Filter types for common endpoints
export interface BaseFilters {
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
}

export interface ClientFilters extends BaseFilters {
  tipo_empresa?: string;
  recuperacao_judicial?: boolean;
  uf?: string;
  regime_tributacao?: string;
  is_active?: boolean;
}

export interface RequestFilters extends BaseFilters {
  action?: string;
  status?: string;
  resource_type?: string;
  requested_by?: number;
}

export interface PerdCompFilters extends BaseFilters {
  client_id?: number;
  status?: PerDcompStatus;
  tributo_pedido?: string;
  data_transmissao_after?: string;
  data_transmissao_before?: string;
}

export interface ActivityFilters extends BaseFilters {
  user_id?: number;
  action?: string;
  resource_type?: string;
  created_at_after?: string;
  created_at_before?: string;
}
