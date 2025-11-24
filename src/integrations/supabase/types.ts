export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id: string
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      annotations: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          public_id: string | null
          resource_id: string
          resource_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          public_id?: string | null
          resource_id: string
          resource_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          public_id?: string | null
          resource_id?: string
          resource_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attached_files: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          public_id: string | null
          resource_id: string
          resource_type: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          mime_type?: string | null
          public_id?: string | null
          resource_id: string
          resource_type: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          public_id?: string | null
          resource_id?: string
          resource_type?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          anotacoes_anteriores: string | null
          atividades: Json | null
          autorizado_para_envio: boolean | null
          bairro: string | null
          cargos: Json | null
          cep: string | null
          certificado_digital: string | null
          client_status: Database["public"]["Enums"]["client_status"] | null
          cnaes: Json | null
          cnpj: string
          complemento: string | null
          contador_responsavel: string | null
          contrato_social: string | null
          created_at: string
          deleted_at: string | null
          email_comercial: string | null
          email_contato: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          is_active: boolean | null
          logradouro: string | null
          municipio: string | null
          nome_fantasia: string
          nova_anotacao: string | null
          numero: string | null
          quadro_societario: Json | null
          razao_social: string
          recuperacao_judicial: boolean | null
          regime_tributacao:
            | Database["public"]["Enums"]["regime_tributacao"]
            | null
          responsavel_financeiro: string | null
          rg_cpf_socios: string | null
          telefone_comercial: string | null
          telefone_contato: string | null
          tipo_empresa: string
          uf: string | null
          ultima_alteracao_contratual: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          anotacoes_anteriores?: string | null
          atividades?: Json | null
          autorizado_para_envio?: boolean | null
          bairro?: string | null
          cargos?: Json | null
          cep?: string | null
          certificado_digital?: string | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          cnaes?: Json | null
          cnpj: string
          complemento?: string | null
          contador_responsavel?: string | null
          contrato_social?: string | null
          created_at?: string
          deleted_at?: string | null
          email_comercial?: string | null
          email_contato?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_active?: boolean | null
          logradouro?: string | null
          municipio?: string | null
          nome_fantasia: string
          nova_anotacao?: string | null
          numero?: string | null
          quadro_societario?: Json | null
          razao_social: string
          recuperacao_judicial?: boolean | null
          regime_tributacao?:
            | Database["public"]["Enums"]["regime_tributacao"]
            | null
          responsavel_financeiro?: string | null
          rg_cpf_socios?: string | null
          telefone_comercial?: string | null
          telefone_contato?: string | null
          tipo_empresa: string
          uf?: string | null
          ultima_alteracao_contratual?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          anotacoes_anteriores?: string | null
          atividades?: Json | null
          autorizado_para_envio?: boolean | null
          bairro?: string | null
          cargos?: Json | null
          cep?: string | null
          certificado_digital?: string | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          cnaes?: Json | null
          cnpj?: string
          complemento?: string | null
          contador_responsavel?: string | null
          contrato_social?: string | null
          created_at?: string
          deleted_at?: string | null
          email_comercial?: string | null
          email_contato?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_active?: boolean | null
          logradouro?: string | null
          municipio?: string | null
          nome_fantasia?: string
          nova_anotacao?: string | null
          numero?: string | null
          quadro_societario?: Json | null
          razao_social?: string
          recuperacao_judicial?: boolean | null
          regime_tributacao?:
            | Database["public"]["Enums"]["regime_tributacao"]
            | null
          responsavel_financeiro?: string | null
          rg_cpf_socios?: string | null
          telefone_comercial?: string | null
          telefone_contato?: string | null
          tipo_empresa?: string
          uf?: string | null
          ultima_alteracao_contratual?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      perdcomps: {
        Row: {
          client_id: string
          cnpj: string | null
          competencia: string
          created_at: string
          created_by_id: string | null
          data_competencia: string | null
          data_transmissao: string | null
          data_vencimento: string | null
          deleted_at: string | null
          id: string
          imposto: string | null
          is_active: boolean | null
          numero: string
          numero_perdcomp: string | null
          observacoes: string | null
          processo_protocolo: number | null
          status: Database["public"]["Enums"]["perdcomp_status"] | null
          updated_at: string
          valor_compensado: number | null
          valor_recebido: number | null
          valor_saldo: number | null
          valor_selic: number | null
          valor_solicitado: number | null
        }
        Insert: {
          client_id: string
          cnpj?: string | null
          competencia: string
          created_at?: string
          created_by_id?: string | null
          data_competencia?: string | null
          data_transmissao?: string | null
          data_vencimento?: string | null
          deleted_at?: string | null
          id?: string
          imposto?: string | null
          is_active?: boolean | null
          numero: string
          numero_perdcomp?: string | null
          observacoes?: string | null
          processo_protocolo?: number | null
          status?: Database["public"]["Enums"]["perdcomp_status"] | null
          updated_at?: string
          valor_compensado?: number | null
          valor_recebido?: number | null
          valor_saldo?: number | null
          valor_selic?: number | null
          valor_solicitado?: number | null
        }
        Update: {
          client_id?: string
          cnpj?: string | null
          competencia?: string
          created_at?: string
          created_by_id?: string | null
          data_competencia?: string | null
          data_transmissao?: string | null
          data_vencimento?: string | null
          deleted_at?: string | null
          id?: string
          imposto?: string | null
          is_active?: boolean | null
          numero?: string
          numero_perdcomp?: string | null
          observacoes?: string | null
          processo_protocolo?: number | null
          status?: Database["public"]["Enums"]["perdcomp_status"] | null
          updated_at?: string
          valor_compensado?: number | null
          valor_recebido?: number | null
          valor_saldo?: number | null
          valor_selic?: number | null
          valor_solicitado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "perdcomps_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          action: Database["public"]["Enums"]["request_action"]
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          executed_at: string | null
          id: string
          metadata: Json | null
          payload_diff: Json | null
          public_id: string | null
          reason: string
          requested_by: string
          resource_id: string
          resource_type: string
          status: Database["public"]["Enums"]["request_status"] | null
          subject: string
          updated_at: string
        }
        Insert: {
          action: Database["public"]["Enums"]["request_action"]
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          payload_diff?: Json | null
          public_id?: string | null
          reason: string
          requested_by: string
          resource_id: string
          resource_type: string
          status?: Database["public"]["Enums"]["request_status"] | null
          subject: string
          updated_at?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["request_action"]
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          payload_diff?: Json | null
          public_id?: string | null
          reason?: string
          requested_by?: string
          resource_id?: string
          resource_type?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
      client_status: "pending" | "active" | "suspended" | "archived"
      perdcomp_status:
        | "RASCUNHO"
        | "TRANSMITIDO"
        | "EM_PROCESSAMENTO"
        | "DEFERIDO"
        | "INDEFERIDO"
        | "PARCIALMENTE_DEFERIDO"
        | "CANCELADO"
        | "VENCIDO"
      regime_tributacao: "lucro_real" | "lucro_presumido"
      request_action:
        | "create"
        | "update"
        | "delete"
        | "activate"
        | "deactivate"
        | "custom"
      request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "executed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "moderator"],
      client_status: ["pending", "active", "suspended", "archived"],
      perdcomp_status: [
        "RASCUNHO",
        "TRANSMITIDO",
        "EM_PROCESSAMENTO",
        "DEFERIDO",
        "INDEFERIDO",
        "PARCIALMENTE_DEFERIDO",
        "CANCELADO",
        "VENCIDO",
      ],
      regime_tributacao: ["lucro_real", "lucro_presumido"],
      request_action: [
        "create",
        "update",
        "delete",
        "activate",
        "deactivate",
        "custom",
      ],
      request_status: [
        "pending",
        "approved",
        "rejected",
        "executed",
        "cancelled",
      ],
    },
  },
} as const
