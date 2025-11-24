# Clients Integration Documentation

## Overview

The Clients module manages client entities with full CRUD operations, automatic address creation, and deep integration with shared common apps for annotations, file attachments, and approval workflows for sensitive data changes.

## Core Client Endpoints

### List Clients

- **URL:** `/api/v1/clients/`
- **Method:** GET
- **Source:** [`ClientViewSet`](backend/apps/clients/views.py)
- **Context:** Paginated list of active clients with filtering and search

#### Request Schema

Query parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20)
- `is_active`: Filter by active status (true/false)
- `search`: Search in CNPJ, razao_social, nome_fantasia
- `ordering`: Order by field (-created_at, razao_social)

#### Response Schema

```json
{
  "count": 150,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "cnpj": "12345678000199",
      "razao_social": "Empresa Exemplo LTDA",
      "nome_fantasia": "Exemplo Corp",
      "inscricao_estadual": "123456789",
      "inscricao_municipal": "987654321",
      "is_active": true,
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

### Get Client Details

- **URL:** `/api/v1/clients/{client_id}/`
- **Method:** GET
- **Source:** [`ClientViewSet`](backend/apps/clients/views.py)
- **Context:** Full client details including address and related data

#### Request Schema

No body required. Uses client UUID in URL path.

#### Response Schema

```json
{
  "id": "uuid",
  "cnpj": "12345678000199",
  "razao_social": "Empresa Exemplo LTDA",
  "nome_fantasia": "Exemplo Corp",
  "inscricao_estadual": "123456789",
  "inscricao_municipal": "987654321",
  "telefone": "+5511999999999",
  "email": "contato@exemplo.com",
  "website": "https://exemplo.com",
  "regime_tributacao": "lucro_presumido",
  "cnaes": ["6201-5/00", "6202-3/00"],
  "is_active": true,
  "created_at": "datetime",
  "updated_at": "datetime",
  "address": {
    "id": "uuid",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "Sala 456",
    "bairro": "Centro",
    "municipio": "São Paulo",
    "uf": "SP",
    "cep": "01234-567"
  },
  "annotations_count": 5,
  "attached_files_count": 3
}
```

### Create Client

- **URL:** `/api/v1/clients/`
- **Method:** POST
- **Source:** [`ClientViewSet`](backend/apps/clients/views.py)
- **Context:** Creates client and associated address atomically

#### Request Schema

```json
{
  "cnpj": "12345678000199",
  "razao_social": "Nova Empresa LTDA",
  "nome_fantasia": "Nova Corp",
  "inscricao_estadual": "123456789",
  "inscricao_municipal": "987654321",
  "telefone": "+5511999999999",
  "email": "contato@novaempresa.com",
  "website": "https://novaempresa.com",
  "regime_tributacao": "simples_nacional",
  "cnaes": ["6201-5/00"],
  "address": {
    "logradouro": "Rua Nova",
    "numero": "456",
    "complemento": "Andar 2",
    "bairro": "Vila Nova",
    "municipio": "São Paulo",
    "uf": "SP",
    "cep": "12345-678"
  }
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "cnpj": "12345678000199",
  "razao_social": "Nova Empresa LTDA",
  "nome_fantasia": "Nova Corp",
  "inscricao_estadual": "123456789",
  "inscricao_municipal": "987654321",
  "telefone": "+5511999999999",
  "email": "contato@novaempresa.com",
  "website": "https://novaempresa.com",
  "regime_tributacao": "simples_nacional",
  "cnaes": ["6201-5/00"],
  "is_active": true,
  "created_at": "datetime",
  "updated_at": "datetime",
  "address": {
    "id": "uuid",
    "logradouro": "Rua Nova",
    "numero": "456",
    "complemento": "Andar 2",
    "bairro": "Vila Nova",
    "municipio": "São Paulo",
    "uf": "SP",
    "cep": "12345-678"
  }
}
```

### Update Client (Non-sensitive)

- **URL:** `/api/v1/clients/{client_id}/`
- **Method:** PATCH
- **Source:** [`ClientViewSet`](backend/apps/clients/views.py)
- **Context:** Updates non-sensitive fields directly without approval

#### Request Schema

```json
{
  "nome_fantasia": "Updated Corp Name",
  "telefone": "+5511888888888",
  "email": "newemail@empresa.com",
  "website": "https://newwebsite.com"
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "cnpj": "12345678000199",
  "razao_social": "Empresa Exemplo LTDA",
  "nome_fantasia": "Updated Corp Name",
  "telefone": "+5511888888888",
  "email": "newemail@empresa.com",
  "website": "https://newwebsite.com",
  "is_active": true,
  "updated_at": "datetime"
}
```

## Sensitive Data Change Endpoints (Approval Integration)

### Request Sensitive Data Update

- **URL:** `/api/v1/clients/{client_id}/sensitive-data`
- **Method:** PATCH
- **Source:** [`ClientViewSet.update_sensitive_data`](backend/apps/clients/views.py) with [`AutoApprovalFieldsMixin`](backend/common/approvals/mixins.py)
- **Context:** Creates approval request for sensitive fields via [`common.approvals`](backend/common/approvals/)

#### Request Schema

```json
{
  "cnpj": "98765432000188",
  "razao_social": "New Company Name LTDA",
  "inscricao_estadual": "987654321",
  "regime_tributacao": "lucro_real",
  "approval_reason": "Company legal restructuring required"
}
```

#### Response Schema

```json
{
  "message": "Solicitação de alteração criada. Aguardando aprovação.",
  "requires_approval": true,
  "request_id": "uuid",
  "subject": "Alteração de dados sensíveis do cliente",
  "fields_changed": [
    "cnpj",
    "razao_social",
    "inscricao_estadual",
    "regime_tributacao"
  ],
  "current_status": "pending"
}
```

### Soft Delete Client

- **URL:** `/api/v1/clients/{client_id}/`
- **Method:** DELETE
- **Source:** [`ClientViewSet.perform_destroy`](backend/apps/clients/views.py)
- **Context:** Admin-only soft delete with audit logging

#### Request Schema

No body required. Admin authentication required.

#### Response Schema

```json
{
  "message": "Cliente excluído com sucesso",
  "deleted_at": "datetime"
}
```

## Client Annotations Integration (common.shared)

### List Client Annotations

- **URL:** `/api/v1/clients/annotations/`
- **Method:** GET
- **Source:** [`ClientAnnotationViewSet`](backend/apps/clients/views.py) using [`AnnotationSerializer`](backend/common/shared/serializers.py)
- **Context:** Lists annotations from [`common.shared.models.Annotation`](backend/common/shared/models.py) filtered by client content_type

#### Request Schema

Query parameters:

- `client_id`: Filter by specific client UUID
- `user_id`: Filter by annotation author
- `search`: Search in annotation content
- `ordering`: Order by created_at, updated_at

#### Response Schema

```json
{
  "count": 25,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "entity_name": "Empresa Exemplo LTDA",
      "user_name": "john_doe",
      "content": "Client meeting notes from 2024-01-15",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

### Create Client Annotation

- **URL:** `/api/v1/clients/annotations/`
- **Method:** POST
- **Source:** [`ClientAnnotationViewSet`](backend/apps/clients/views.py) using [`AnnotationSerializer`](backend/common/shared/serializers.py)
- **Context:** Creates annotation using [`common.shared.models.Annotation`](backend/common/shared/models.py) with GenericForeignKey

#### Request Schema

```json
{
  "entity_type": "client",
  "entity_id": "client_uuid_here",
  "content": "Important note about this client's requirements and recent discussions."
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "entity_type": "client",
  "entity_id": "client_uuid_here",
  "entity_name": "Empresa Exemplo LTDA",
  "user_name": "current_user",
  "content": "Important note about this client's requirements and recent discussions.",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Update Client Annotation

- **URL:** `/api/v1/clients/annotations/{annotation_id}/`
- **Method:** PATCH
- **Source:** [`ClientAnnotationViewSet`](backend/apps/clients/views.py)
- **Context:** Updates annotation (only by author or admin via [`IsOwnerOrAdminForAnnotations`](backend/common/shared/permissions.py))

#### Request Schema

```json
{
  "content": "Updated annotation content with new information."
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "entity_name": "Empresa Exemplo LTDA",
  "user_name": "current_user",
  "content": "Updated annotation content with new information.",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Delete Client Annotation

- **URL:** `/api/v1/clients/annotations/{annotation_id}/`
- **Method:** DELETE
- **Source:** [`ClientAnnotationViewSet`](backend/apps/clients/views.py)
- **Context:** Soft deletes annotation (only by author or admin)

#### Request Schema

No body required.

#### Response Schema

```json
{
  "message": "Anotação removida com sucesso"
}
```

## Client Attached Files Integration (common.shared)

### List Client Attached Files

- **URL:** `/api/v1/clients/attached-files/`
- **Method:** GET
- **Source:** [`ClientAttachedFileViewSet`](backend/apps/clients/views.py) using [`AttachedFileSerializer`](backend/common/shared/serializers.py)
- **Context:** Lists files from [`common.shared.models.AttachedFile`](backend/common/shared/models.py) with client content_type

#### Request Schema

Query parameters:

- `client_id`: Filter by specific client UUID
- `file_type`: Filter by file type (contrato, cartao_cnpj)
- `uploaded_by_id`: Filter by uploader
- `search`: Search in file name, description
- `ordering`: Order by created_at, file_name, file_size

#### Response Schema

```json
{
  "count": 8,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "entity_name": "Empresa Exemplo LTDA",
      "uploaded_by_name": "john_doe",
      "file_type": "contrato",
      "file_name": "contrato_social_2024.pdf",
      "file_url": "https://storage.url/file.pdf",
      "file_size": 2048576,
      "file_size_human": "2.0 MB",
      "mime_type": "application/pdf",
      "description": "Contrato social atualizado",
      "available_file_types": [
        { "value": "contrato", "label": "Contrato" },
        { "value": "cartao_cnpj", "label": "Cartão CNPJ" }
      ],
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

### Upload Client File

- **URL:** `/api/v1/clients/attached-files/`
- **Method:** POST
- **Source:** [`ClientAttachedFileViewSet`](backend/apps/clients/views.py) using [`AttachedFileSerializer`](backend/common/shared/serializers.py)
- **Context:** Creates file record using [`common.shared.models.AttachedFile`](backend/common/shared/models.py) with GenericForeignKey

#### Request Schema

```json
{
  "entity_type": "client",
  "entity_id": "client_uuid_here",
  "file_type": "contrato",
  "file_name": "new_contract.pdf",
  "file_url": "https://storage.url/uploaded_file.pdf",
  "description": "Updated company contract document",
  "mime_type": "application/pdf",
  "file_size": 1024000
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "entity_type": "client",
  "entity_id": "client_uuid_here",
  "entity_name": "Empresa Exemplo LTDA",
  "uploaded_by_name": "current_user",
  "file_type": "contrato",
  "file_name": "new_contract.pdf",
  "file_url": "https://storage.url/uploaded_file.pdf",
  "file_size": 1024000,
  "file_size_human": "1.0 MB",
  "mime_type": "application/pdf",
  "description": "Updated company contract document",
  "available_file_types": [
    { "value": "contrato", "label": "Contrato" },
    { "value": "cartao_cnpj", "label": "Cartão CNPJ" }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Update File Metadata

- **URL:** `/api/v1/clients/attached-files/{file_id}/`
- **Method:** PATCH
- **Source:** [`ClientAttachedFileViewSet`](backend/apps/clients/views.py)
- **Context:** Updates file metadata (only by uploader or admin via [`IsOwnerOrAdminForAttachedFiles`](backend/common/shared/permissions.py))

#### Request Schema

```json
{
  "description": "Updated file description",
  "file_type": "cartao_cnpj"
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "entity_name": "Empresa Exemplo LTDA",
  "uploaded_by_name": "current_user",
  "file_type": "cartao_cnpj",
  "file_name": "new_contract.pdf",
  "description": "Updated file description",
  "updated_at": "datetime"
}
```

### Delete Client File

- **URL:** `/api/v1/clients/attached-files/{file_id}/`
- **Method:** DELETE
- **Source:** [`ClientAttachedFileViewSet`](backend/apps/clients/views.py)
- **Context:** Soft deletes file (only by uploader or admin)

#### Request Schema

No body required.

#### Response Schema

```json
{
  "message": "Arquivo removido com sucesso"
}
```

## Client Approval Requests Integration (common.approvals)

### List Client Approval Requests (Admin)

- **URL:** `/api/v1/admin/requests/`
- **Method:** GET
- **Source:** Admin endpoints via [`common.approvals.models.ApprovalRequest`](backend/common/approvals/models.py)
- **Context:** Lists approval requests filtered by client resource type

#### Request Schema

Query parameters:

- `resource_type`: Filter by "clients.Client"
- `status`: Filter by status (pending, approved, rejected)
- `requested_by`: Filter by requester
- `ordering`: Order by created_at

#### Response Schema

```json
{
  "count": 15,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "subject": "Alteração de dados sensíveis do cliente",
      "action": "update",
      "resource_type": "clients.Client",
      "resource_id": "client_uuid",
      "status": "pending",
      "reason": "Company legal restructuring required",
      "requested_by": "employee_user",
      "requested_at": "datetime",
      "reviewed_by": null,
      "reviewed_at": null,
      "payload_diff": {
        "cnpj": {
          "old": "12345678000199",
          "new": "98765432000188"
        },
        "razao_social": {
          "old": "Old Company Name",
          "new": "New Company Name LTDA"
        }
      },
      "metadata": {
        "api_endpoint": "/api/v1/clients/uuid/sensitive-data",
        "http_method": "PATCH",
        "original_action": "update_sensitive_data",
        "sensitive_fields_changed": ["cnpj", "razao_social"]
      }
    }
  ]
}
```

### Approve Client Change Request (Admin)

- **URL:** `/api/v1/admin/requests/{request_id}/approve`
- **Method:** POST
- **Source:** Admin endpoints via [`ApprovalService`](backend/common/approvals/services.py)
- **Context:** Approves and executes client data changes atomically

#### Request Schema

```json
{
  "reason": "Request approved after legal verification",
  "auto_execute": true
}
```

#### Response Schema

```json
{
  "message": "Solicitação aprovada e executada com sucesso",
  "request_id": "uuid",
  "status": "approved",
  "approved_at": "datetime",
  "approved_by": "admin_user",
  "execution_result": {
    "success": true,
    "changes_applied": ["cnpj", "razao_social"],
    "audit_log_id": "uuid"
  }
}
```

### Reject Client Change Request (Admin)

- **URL:** `/api/v1/admin/requests/{request_id}/reject`
- **Method:** POST
- **Source:** Admin endpoints via [`ApprovalService`](backend/common/approvals/services.py)
- **Context:** Rejects client change request with reason

#### Request Schema

```json
{
  "reason": "Insufficient documentation provided for CNPJ change"
}
```

#### Response Schema

```json
{
  "message": "Solicitação rejeitada",
  "request_id": "uuid",
  "status": "rejected",
  "rejected_at": "datetime",
  "rejected_by": "admin_user",
  "reason": "Insufficient documentation provided for CNPJ change"
}
```

## Address Management

### List Client Addresses

- **URL:** `/api/v1/clients/addresses/`
- **Method:** GET
- **Source:** [`AddressViewSet`](backend/apps/clients/views.py)
- **Context:** Lists addresses with client relationships

#### Request Schema

Query parameters:

- `client_id`: Filter by client UUID
- `municipio`: Filter by city
- `uf`: Filter by state

#### Response Schema

```json
{
  "count": 1,
  "results": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "logradouro": "Rua Exemplo",
      "numero": "123",
      "complemento": "Sala 456",
      "bairro": "Centro",
      "municipio": "São Paulo",
      "uf": "SP",
      "cep": "01234-567",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

### Update Client Address

- **URL:** `/api/v1/clients/addresses/{address_id}/`
- **Method:** PATCH
- **Source:** [`AddressViewSet`](backend/apps/clients/views.py)
- **Context:** Updates address linked to client

#### Request Schema

```json
{
  "numero": "456",
  "complemento": "New suite number",
  "cep": "12345-678"
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "logradouro": "Rua Exemplo",
  "numero": "456",
  "complemento": "New suite number",
  "bairro": "Centro",
  "municipio": "São Paulo",
  "uf": "SP",
  "cep": "12345-678",
  "updated_at": "datetime"
}
```

## Security and Permissions

### Authentication

All client endpoints require JWT authentication via Authorization header.

### Permission Levels

- **Employee/Admin:** Full CRUD access to clients
- **Guest:** Read-only access to basic client data
- **Annotations:** Users can manage own annotations, admins can manage all
- **Files:** Users can manage own uploaded files, admins can manage all
- **Sensitive Changes:** Require approval workflow
- **Deletion:** Admin-only operations

### Rate Limiting

- Standard rate limits apply per [`SensitiveActionThrottle`](backend/apps/identity/throttling.py)
- File uploads have additional size and type restrictions

## Integration Notes

### Automatic Address Creation

When creating a client, include address data in the request. The system automatically creates the associated address record with the client relationship.

### File Type Validation

Client file types are restricted to [`CLIENT_FILE_TYPES`](backend/common/shared/models.py):

- `contrato`: Contract documents
- `cartao_cnpj`: CNPJ registration cards

### Approval Workflow

Sensitive client data changes (CNPJ, legal name, tax regime) automatically trigger approval requests that must be reviewed by admins before execution.

### Audit Integration

All client operations are automatically audited via [`common.audit`](backend/common/audit/) with correlation IDs linking related operations.
