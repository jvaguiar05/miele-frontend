// API Response types
export interface ApiResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

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

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  phone?: string;
  avatar?: string;
  two_factor_enabled?: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

// Client types (updated for Django)
export interface Client {
  id: number;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo_empresa: string;
  quadro_societario: string;
  cargo: string;
  telefone_contato: string;
  email_contato: string;
  responsavel_financeiro: string;
  telefone_comercial: string;
  email_comercial: string;
  site: string;
  cnae: string;
  regime_tributario: string;
  recuperacao_judicial: boolean;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  atividades: string;
  anotacoes_anteriores: string;
  nova_anotacao: string;
  created_at: string;
  updated_at: string;
}

// PER/DCOMP types (updated for Django)
export interface PerdComp {
  id: number;
  client: number; // Foreign key to Client
  numero: string;
  nome: string;
  nr_perdcomp: string;
  data_transmissao: string;
  data_vencimento: string;
  tributo_pedido: string;
  competencia: string;
  valor_pedido: number;
  valor_compensado: number;
  valor_recebido: number;
  valor_saldo: number;
  valor_selic: number;
  recebido: boolean;
  data_recebimento: string | null;
  anotacoes: string | null;
  created_at: string;
  updated_at: string;
}

// File attachment types
export interface AttachedFile {
  id: number;
  name: string;
  file: string; // URL to file
  file_type: 'cnpj' | 'contrato';
  contrato_data_assinatura?: string;
  uploaded_at: string;
  client?: number;
  perdcomp?: number;
}