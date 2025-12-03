# API de Logs de Auditoria - Documentação

## Visão Geral

A API de logs de auditoria do Miele System fornece endpoints para consulta e monitoramento de todas as atividades realizadas no sistema. Todos os endpoints estão agrupados na categoria **"Activities - Logs"** do Swagger e requerem autenticação JWT.

**Base URL:** `/api/v1/activities/`

---

## Endpoints Disponíveis

### 1. GET `/api/v1/activities/logs/` - Listar Logs de Auditoria

**Propósito:** Lista todos os logs de auditoria do sistema com suporte completo a filtros e paginação. Este é o endpoint principal para consultas administrativas e análises detalhadas.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | integer | Não | Número da página (padrão: 1) |
| `page_size` | integer | Não | Itens por página (padrão: 20, máximo: 100) |
| `start_date` | datetime | Não | Data inicial para filtrar logs (ISO 8601) |
| `end_date` | datetime | Não | Data final para filtrar logs (ISO 8601) |
| `action` | string | Não | Tipo de ação (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, etc.) |
| `resource_type` | string | Não | Tipo de recurso (ex: `clients.client`, `perdcomps.perdcomp`) |
| `resource_id` | string | Não | ID específico do recurso afetado |
| `user_public_id` | UUID | Não | Public ID (UUID) do usuário que executou a ação |
| `client_public_id` | UUID | Não | Public ID (UUID) do cliente relacionado |
| `perdcomp_public_id` | UUID | Não | Public ID (UUID) do PER/DCOMP relacionado |
| `correlation_id` | UUID | Não | ID de correlação para rastrear ações relacionadas |

#### Exemplos de Requisição

```bash
# Listar todos os logs (paginado)
GET /api/v1/activities/logs/

# Filtrar logs de login dos últimos 7 dias
GET /api/v1/activities/logs/?action=LOGIN&start_date=2024-11-23T00:00:00Z

# Logs de um cliente específico usando public_id
GET /api/v1/activities/logs/?client_public_id=550e8400-e29b-41d4-a716-446655440000

# Logs de um usuário específico usando public_id
GET /api/v1/activities/logs/?user_public_id=550e8400-e29b-41d4-a716-446655440001&page=2&page_size=50

# Logs de um PER/DCOMP específico usando public_id
GET /api/v1/activities/logs/?perdcomp_public_id=550e8400-e29b-41d4-a716-446655440002

# Filtrar por período e ação
GET /api/v1/activities/logs/?start_date=2024-11-01T00:00:00Z&end_date=2024-11-30T23:59:59Z&action=UPDATE
```

#### Resposta de Sucesso (200 OK)

```json
{
    "count": 1250,
    "next": "http://api.miele.com/api/v1/activities/logs/?page=3",
    "previous": "http://api.miele.com/api/v1/activities/logs/?page=1",
    "results": [
        {
            "id": 12345,
            "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": "789",
            "user_email": "joao.silva@empresa.com",
            "user_name": "João Silva",
            "action": "UPDATE",
            "resource_type": "clients.client",
            "resource_id": "123",
            "old_data": {
                "name": "Empresa ABC",
                "email": "contato@abc.com"
            },
            "new_data": {
                "name": "Empresa ABC LTDA",
                "email": "contato@abc.com"
            },
            "metadata": {
                "changed_fields": ["name"],
                "approval_required": true
            },
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0...",
            "timestamp": "2024-11-30T14:30:25.123Z"
        }
    ]
}
```

---

### 2. GET `/api/v1/activities/recent-logs/` - Logs Recentes

**Propósito:** Retorna logs de auditoria a partir de uma data específica. Ideal para sincronização em tempo real, dashboards e monitoramento contínuo.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `since` | datetime | **Sim** | Data a partir da qual buscar os logs (ISO 8601) |
| `limit` | integer | Não | Número máximo de logs (padrão: 100, máximo: 1000) |

#### Exemplos de Requisição

```bash
# Logs das últimas 2 horas
GET /api/v1/activities/recent-logs/?since=2024-11-30T12:00:00Z

# Logs desde ontem com limite de 500
GET /api/v1/activities/recent-logs/?since=2024-11-29T00:00:00Z&limit=500

# Logs dos últimos 15 minutos
GET /api/v1/activities/recent-logs/?since=2024-11-30T14:15:00Z
```

#### Resposta de Sucesso (200 OK)

```json
{
    "count": 45,
    "since": "2024-11-30T12:00:00Z",
    "results": [
        {
            "id": 12346,
            "correlation_id": "550e8400-e29b-41d4-a716-446655440001",
            "user_id": "789",
            "user_email": "maria.santos@empresa.com",
            "user_name": "Maria Santos",
            "action": "LOGIN",
            "resource_type": "identity.user",
            "resource_id": "789",
            "old_data": null,
            "new_data": null,
            "metadata": {
                "login_method": "password",
                "2fa_enabled": true
            },
            "ip_address": "10.0.1.50",
            "user_agent": "Chrome/119.0.0.0",
            "timestamp": "2024-11-30T14:25:15.456Z"
        }
    ]
}
```

---

### 3. GET `/api/v1/activities/my-logs/` - Meus Logs

**Propósito:** Retorna logs relacionados ao usuário autenticado, incluindo ações executadas pelo usuário e ações que afetaram o usuário. Útil para histórico pessoal e auditoria individual.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | integer | Não | Número da página |
| `page_size` | integer | Não | Itens por página (máximo: 100) |
| `action` | string | Não | Filtrar por tipo de ação |
| `start_date` | datetime | Não | Data inicial |
| `end_date` | datetime | Não | Data final |

#### Exemplos de Requisição

```bash
# Todos os meus logs
GET /api/v1/activities/my-logs/

# Meus logs de login
GET /api/v1/activities/my-logs/?action=LOGIN

# Minhas atividades da última semana
GET /api/v1/activities/my-logs/?start_date=2024-11-23T00:00:00Z

# Meus logs com paginação
GET /api/v1/activities/my-logs/?page=2&page_size=25
```

#### Resposta de Sucesso (200 OK)

```json
{
    "count": 78,
    "next": "http://api.miele.com/api/v1/activities/my-logs/?page=3",
    "previous": "http://api.miele.com/api/v1/activities/my-logs/?page=1",
    "results": [
        {
            "id": 12344,
            "correlation_id": "550e8400-e29b-41d4-a716-446655440002",
            "user_id": "current_user_id",
            "user_email": "usuario@empresa.com",
            "user_name": "Usuário Atual",
            "action": "CREATE",
            "resource_type": "perdcomps.perdcomp",
            "resource_id": "999",
            "old_data": null,
            "new_data": {
                "client_id": "123",
                "document_type": "PER",
                "reference_period": "2024-11"
            },
            "metadata": {
                "auto_generated": false
            },
            "ip_address": "192.168.1.105",
            "user_agent": "Safari/17.0",
            "timestamp": "2024-11-30T13:45:30.789Z"
        }
    ]
}
```

---

## Códigos de Status HTTP

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| `200 OK` | Sucesso | Requisição processada com sucesso |
| `400 Bad Request` | Erro nos parâmetros | Filtros inválidos, datas mal formatadas |
| `401 Unauthorized` | Não autenticado | Token JWT ausente ou inválido |
| `403 Forbidden` | Sem permissão | Usuário sem acesso aos logs |
| `500 Internal Server Error` | Erro interno | Problema no servidor |

---

## Estrutura dos Dados de Resposta

### Objeto AuditLog

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | ID único do log |
| `correlation_id` | UUID | ID para rastrear ações relacionadas |
| `user_id` | integer | ID interno do usuário (para uso interno) |
| `user_public_id` | UUID | Public ID do usuário (para interface) |
| `user_email` | string | Email do usuário |
| `user_name` | string | Nome completo do usuário |
| `action` | string | Tipo da ação realizada |
| `resource_type` | string | Tipo do recurso afetado (app.model) |
| `resource_id` | string | ID do recurso afetado |
| `old_data` | object/null | Estado anterior (UPDATE/DELETE) |
| `new_data` | object/null | Novo estado (CREATE/UPDATE) |
| `metadata` | object | Informações adicionais da ação |
| `ip_address` | string/null | IP do usuário |
| `user_agent` | string/null | User-Agent do navegador/cliente |
| `timestamp` | datetime | Data e hora da ação (ISO 8601) |

### Tipos de Ação Disponíveis

- `CREATE`: Criação de recurso
- `UPDATE`: Atualização de recurso
- `DELETE`: Exclusão de recurso
- `LOGIN`: Login no sistema
- `LOGOUT`: Logout do sistema
- `APPROVAL_REQUESTED`: Solicitação de aprovação
- `APPROVAL_GRANTED`: Aprovação concedida
- `APPROVAL_DENIED`: Aprovação negada
- `CUSTOM`: Ação personalizada

### Tipos de Recurso Comuns

- `identity.user`: Usuários do sistema
- `clients.client`: Clientes
- `perdcomps.perdcomp`: Documentos PER/DCOMP
- `approvals.approvalrequest`: Solicitações de aprovação

---

## Exemplos Avançados de Uso

### 1. Auditoria de Cliente Específico

```bash
# Buscar todas as ações relacionadas ao cliente (usando public_id)
GET /api/v1/activities/logs/?client_public_id=550e8400-e29b-41d4-a716-446655440000

# Incluir também logs de PER/DCOMPs deste cliente
GET /api/v1/activities/logs/?resource_type=clients.client&client_public_id=550e8400-e29b-41d4-a716-446655440000
```

### 2. Monitoramento de Segurança

```bash
# Logs de login nas últimas 24h
GET /api/v1/activities/logs/?action=LOGIN&start_date=2024-11-29T14:30:00Z

# Ações administrativas sensíveis
GET /api/v1/activities/logs/?action=DELETE&start_date=2024-11-30T00:00:00Z
```

### 3. Sincronização de Dados

```bash
# Buscar atualizações desde o último sync
GET /api/v1/activities/recent-logs/?since=2024-11-30T14:00:00Z&limit=1000
```

### 4. Relatório de Atividades

```bash
# Atividade de usuário específico no mês (usando public_id)
GET /api/v1/activities/logs/?user_public_id=550e8400-e29b-41d4-a716-446655440001&start_date=2024-11-01T00:00:00Z&end_date=2024-11-30T23:59:59Z
```

---

## Notas Importantes

### **IDs Internos vs Public IDs**

O sistema utiliza dois tipos de identificadores:

- **IDs Internos (integers):** Usados internamente pelo banco de dados para performance. Expostos nos logs mas **NÃO devem ser usados nos filtros**.
- **Public IDs (UUIDs):** Identificadores seguros expostos para a interface. **USE SEMPRE estes nos filtros**.

**❌ INCORRETO:**
```bash
# Não use user_id nos filtros
GET /api/v1/activities/logs/?user_id=789
```

**✅ CORRETO:**
```bash
# Use user_public_id nos filtros
GET /api/v1/activities/logs/?user_public_id=550e8400-e29b-41d4-a716-446655440001
```

### **Outras Notas**

1. **Autenticação:** Todos os endpoints requerem token JWT válido no header `Authorization: Bearer <token>`

2. **Paginação:** Use os campos `next` e `previous` para navegar entre páginas

3. **Filtros de Data:** Use formato ISO 8601 com timezone (ex: `2024-11-30T14:30:00Z`)

4. **Performance:** Para grandes volumes, use filtros específicos para melhorar a performance

5. **Correlation ID:** Use este campo para rastrear todas as ações relacionadas a uma única operação

6. **Metadata:** Campo flexível que pode conter informações específicas dependendo do tipo de ação

7. **Resource Type:** Formato `app_label.model_name` em lowercase

8. **Limite de Paginação:** Máximo de 100 itens por página nos endpoints paginados