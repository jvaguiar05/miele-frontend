# PER/DCOMPs Integration Documentation

## Overview

The PER/DCOMPs module manages tax compensation documents with full CRUD operations, automatic approval workflows for sensitive data, and deep integration with shared apps for annotations, file attachments, and approval management.

**Key Features:**

- Full lifecycle management of tax compensation documents
- Automatic approval workflow for sensitive field updates
- Generic annotations and file attachments via `common.shared`
- Audit logging and soft deletion
- Advanced filtering and search capabilities

---

## Core PER/DCOMP Endpoints

### List PER/DCOMPs

- **URL:** `/api/v1/perdcomps/`
- **Method:** GET
- **Source:** [`PerDcompViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

Query parameters for filtering and pagination:

```json
{
  "page": 1,
  "page_size": 20,
  "status": "pending|active|transmitted|approved|cancelled",
  "is_active": "true|false",
  "tributo_pedido": "IRPJ|CSLL|COFINS|PIS",
  "search": "search_term",
  "ordering": "created_at|-created_at|data_vencimento|valor_pedido",
  "client_id": "uuid",
  "cnpj": "12345678000199"
}
```

#### Response Logic

```json
{
  "count": 75,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "numero_perdcomp": "PER2024001",
      "numero": "000001",
      "client_id": "uuid",
      "colaborador_id": "uuid",
      "cnpj": "12345678000199",
      "processo_protocolo": "BR-2024-001-DEF",
      "tributo_pedido": "IRPJ",
      "competencia": "202401",
      "valor_pedido": "15000.00",
      "valor_compensado": "12000.00",
      "valor_recebido": "0.00",
      "valor_saldo": "3000.00",
      "status": "active",
      "data_vencimento": "2024-12-31",
      "data_competencia": "2024-01-31",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:15:00Z"
    }
  ]
}
```

### Get PER/DCOMP Details

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/`
- **Method:** GET
- **Source:** [`PerDcompViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

No body required. Uses PER/DCOMP UUID in URL path.

#### Response Logic

```json
{
  "id": "uuid",
  "numero_perdcomp": "PER2024001",
  "numero": "000001",
  "client_id": "uuid",
  "colaborador_id": "uuid",
  "cnpj": "12345678000199",
  "processo_protocolo": "BR-2024-001-DEF",
  "tributo_pedido": "IRPJ",
  "competencia": "202401",
  "valor_pedido": "15000.00",
  "valor_compensado": "12000.00",
  "valor_recebido": "0.00",
  "valor_saldo": "3000.00",
  "valor_selic": "150.00",
  "status": "active",
  "data_transmissao": "2024-01-15T10:30:00Z",
  "data_vencimento": "2024-12-31",
  "data_competencia": "2024-01-31",
  "observacoes": "Important tax compensation request",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:15:00Z",
  "annotations_count": 8,
  "attached_files_count": 4
}
```

### Create PER/DCOMP

- **URL:** `/api/v1/perdcomps/`
- **Method:** POST
- **Source:** [`PerDcompViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

```json
{
  "client_id": "uuid",
  "colaborador_id": "uuid",
  "cnpj": "12345678000199",
  "processo_protocolo": "BR-2024-002-XYZ",
  "tributo_pedido": "CSLL",
  "competencia": "202402",
  "valor_pedido": "25000.00",
  "data_vencimento": "2024-12-31",
  "data_competencia": "2024-02-28",
  "observacoes": "Quarterly tax compensation request"
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "numero_perdcomp": "PER2024002",
  "numero": "000002",
  "client_id": "uuid",
  "colaborador_id": "uuid",
  "cnpj": "12345678000199",
  "processo_protocolo": "BR-2024-002-XYZ",
  "tributo_pedido": "CSLL",
  "competencia": "202402",
  "valor_pedido": "25000.00",
  "valor_compensado": "0.00",
  "valor_recebido": "0.00",
  "valor_saldo": "25000.00",
  "status": "pending",
  "data_vencimento": "2024-12-31",
  "data_competencia": "2024-02-28",
  "observacoes": "Quarterly tax compensation request",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update PER/DCOMP (Non-sensitive)

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/`
- **Method:** PATCH
- **Source:** [`PerDcompViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

```json
{
  "observacoes": "Updated notes about the compensation",
  "valor_recebido": "5000.00"
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "numero_perdcomp": "PER2024001",
  "observacoes": "Updated notes about the compensation",
  "valor_recebido": "5000.00",
  "valor_saldo": "10000.00",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

---

## Sensitive Data Change Endpoints (Approval Integration)

### Request Sensitive Data Update

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/sensitive-data`
- **Method:** PATCH
- **Source:** [`PerDcompViewSet.update_sensitive_data`](backend/apps/perdcomps/views.py) with [`AutoApprovalFieldsMixin`](backend/common/approvals/mixins.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

_Updates sensitive fields that require administrative approval. Creates approval request automatically._

```json
{
  "processo_protocolo": "BR-2024-001-UPDATED",
  "valor_pedido": "20000.00",
  "valor_compensado": "18000.00",
  "status": "transmitted"
}
```

#### Response Logic

```json
{
  "message": "Solicitação de alteração criada. Aguardando aprovação.",
  "requires_approval": true
}
```

### Soft Delete PER/DCOMP

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/`
- **Method:** DELETE
- **Source:** [`PerDcompViewSet.perform_destroy`](backend/apps/perdcomps/views.py)
- **Auth:** Admin role required (`IsAdminUser`)

#### Request Logic

No body required. Admin authentication required.

#### Response Logic

```json
{
  "message": "PER/DCOMP excluído com sucesso",
  "deleted_at": "2024-01-20T14:15:00Z"
}
```

---

## PER/DCOMP Annotations Integration (common.shared)

### List PER/DCOMP Annotations

- **URL:** `/api/v1/perdcomps/annotations/`
- **Method:** GET
- **Source:** [`PerDcompAnnotationViewSet`](backend/apps/perdcomps/views.py) using [`AnnotationSerializer`](backend/common/shared/serializers.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

_Lists annotations from [`common.shared.models.Annotation`](backend/common/shared/models.py) filtered by perdcomp content_type_

Query parameters:

- `perdcomp_id`: Filter by specific PER/DCOMP UUID
- `user_id`: Filter by annotation author
- `search`: Search in annotation content
- `ordering`: Order by created_at, updated_at

#### Response Logic

```json
{
  "count": 12,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "entity_name": "PER/DCOMP PER2024001",
      "user_name": "tax_analyst",
      "content": "Protocol submission completed. Awaiting tax office confirmation.",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create PER/DCOMP Annotation

- **URL:** `/api/v1/perdcomps/annotations/`
- **Method:** POST
- **Source:** [`PerDcompAnnotationViewSet`](backend/apps/perdcomps/views.py) using [`AnnotationSerializer`](backend/common/shared/serializers.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

_Creates annotation using [`common.shared.models.Annotation`](backend/common/shared/models.py) with GenericForeignKey_

```json
{
  "entity_type": "perdcomp",
  "entity_id": "perdcomp_uuid_here",
  "content": "Tax office requested additional documentation. Preparing supplementary files for submission."
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "entity_type": "perdcomp",
  "entity_id": "perdcomp_uuid_here",
  "entity_name": "PER/DCOMP PER2024001",
  "user_name": "current_user",
  "content": "Tax office requested additional documentation. Preparing supplementary files for submission.",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update PER/DCOMP Annotation

- **URL:** `/api/v1/perdcomps/annotations/{annotation_id}/`
- **Method:** PATCH
- **Source:** [`PerDcompAnnotationViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`) + ownership or admin via [`IsOwnerOrAdminForAnnotations`](backend/common/shared/permissions.py)

#### Request Logic

```json
{
  "content": "Updated: Documentation submitted successfully. Tracking number: TX2024-789."
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "entity_name": "PER/DCOMP PER2024001",
  "user_name": "current_user",
  "content": "Updated: Documentation submitted successfully. Tracking number: TX2024-789.",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

### Delete PER/DCOMP Annotation

- **URL:** `/api/v1/perdcomps/annotations/{annotation_id}/`
- **Method:** DELETE
- **Source:** [`PerDcompAnnotationViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`) + ownership or admin

#### Request Logic

No body required.

#### Response Logic

```json
{
  "message": "Anotação removida com sucesso"
}
```

### Quick Add Annotation (Shortcut)

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/add-annotation`
- **Method:** POST
- **Source:** [`PerDcompViewSet.add_annotation`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

_Convenient endpoint to add annotation directly to a PER/DCOMP_

```json
{
  "content": "Quick note: Client approved the compensation amount today."
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "entity_name": "PER/DCOMP PER2024001",
  "user_name": "current_user",
  "content": "Quick note: Client approved the compensation amount today.",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### List Annotations by PER/DCOMP (Shortcut)

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/annotations`
- **Method:** GET
- **Source:** [`PerDcompViewSet.list_annotations`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

No body required.

#### Response Logic

```json
[
  {
    "id": "uuid",
    "entity_name": "PER/DCOMP PER2024001",
    "user_name": "tax_analyst",
    "content": "Protocol submission completed. Awaiting tax office confirmation.",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## PER/DCOMP Attached Files Integration (common.shared)

### List PER/DCOMP Attached Files

- **URL:** `/api/v1/perdcomps/attached-files/`
- **Method:** GET
- **Source:** [`PerDcompAttachedFileViewSet`](backend/apps/perdcomps/views.py) using [`AttachedFileSerializer`](backend/common/shared/serializers.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

_Lists files from [`common.shared.models.AttachedFile`](backend/common/shared/models.py) with perdcomp content_type_

Query parameters:

- `perdcomp_id`: Filter by specific PER/DCOMP UUID
- `file_type`: Filter by file type (recibo, aviso_recebimento, perdcomp)
- `uploaded_by_id`: Filter by uploader
- `search`: Search in file name, description
- `ordering`: Order by created_at, file_name, file_size

#### Response Logic

```json
{
  "count": 6,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "entity_name": "PER/DCOMP PER2024001",
      "uploaded_by_name": "tax_analyst",
      "file_type": "recibo",
      "file_name": "recibo_compensacao_jan2024.pdf",
      "file_url": "https://storage.url/recibo.pdf",
      "file_size": 1024000,
      "file_size_human": "1.0 MB",
      "mime_type": "application/pdf",
      "description": "Receipt for tax compensation request",
      "available_file_types": [
        { "value": "recibo", "label": "Recibo" },
        { "value": "aviso_recebimento", "label": "Aviso Recebimento" },
        { "value": "perdcomp", "label": "PER/DCOMP" }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Upload PER/DCOMP File

- **URL:** `/api/v1/perdcomps/attached-files/`
- **Method:** POST
- **Source:** [`PerDcompAttachedFileViewSet`](backend/apps/perdcomps/views.py) using [`AttachedFileSerializer`](backend/common/shared/serializers.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

_Creates file record using [`common.shared.models.AttachedFile`](backend/common/shared/models.py) with GenericForeignKey_

```json
{
  "entity_type": "perdcomp",
  "entity_id": "perdcomp_uuid_here",
  "file_type": "aviso_recebimento",
  "file_name": "aviso_recebimento_tx789.pdf",
  "file_url": "https://storage.url/uploaded_aviso.pdf",
  "description": "Tax office acknowledgment receipt",
  "mime_type": "application/pdf",
  "file_size": 512000
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "entity_type": "perdcomp",
  "entity_id": "perdcomp_uuid_here",
  "entity_name": "PER/DCOMP PER2024001",
  "uploaded_by_name": "current_user",
  "file_type": "aviso_recebimento",
  "file_name": "aviso_recebimento_tx789.pdf",
  "file_url": "https://storage.url/uploaded_aviso.pdf",
  "file_size": 512000,
  "file_size_human": "500.0 KB",
  "mime_type": "application/pdf",
  "description": "Tax office acknowledgment receipt",
  "available_file_types": [
    { "value": "recibo", "label": "Recibo" },
    { "value": "aviso_recebimento", "label": "Aviso Recebimento" },
    { "value": "perdcomp", "label": "PER/DCOMP" }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update File Metadata

- **URL:** `/api/v1/perdcomps/attached-files/{file_id}/`
- **Method:** PATCH
- **Source:** [`PerDcompAttachedFileViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`) + ownership or admin via [`IsOwnerOrAdminForAttachedFiles`](backend/common/shared/permissions.py)

#### Request Logic

```json
{
  "description": "Updated: Final acknowledgment from tax office with approval",
  "file_type": "perdcomp"
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "entity_name": "PER/DCOMP PER2024001",
  "uploaded_by_name": "current_user",
  "file_type": "perdcomp",
  "file_name": "aviso_recebimento_tx789.pdf",
  "description": "Updated: Final acknowledgment from tax office with approval",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

### Delete PER/DCOMP File

- **URL:** `/api/v1/perdcomps/attached-files/{file_id}/`
- **Method:** DELETE
- **Source:** [`PerDcompAttachedFileViewSet`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`) + ownership or admin

#### Request Logic

No body required.

#### Response Logic

```json
{
  "message": "Arquivo removido com sucesso"
}
```

### Quick Attach File (Shortcut)

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/attach-file`
- **Method:** POST
- **Source:** [`PerDcompViewSet.attach_file`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

_Convenient endpoint to attach file directly to a PER/DCOMP_

```json
{
  "file_type": "recibo",
  "file_name": "new_receipt.pdf",
  "file_url": "https://storage.url/new_receipt.pdf",
  "description": "Latest payment receipt",
  "mime_type": "application/pdf",
  "file_size": 768000
}
```

#### Response Logic

```json
{
  "id": "uuid",
  "entity_name": "PER/DCOMP PER2024001",
  "uploaded_by_name": "current_user",
  "file_type": "recibo",
  "file_name": "new_receipt.pdf",
  "file_url": "https://storage.url/new_receipt.pdf",
  "description": "Latest payment receipt",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### List Files by PER/DCOMP (Shortcut)

- **URL:** `/api/v1/perdcomps/{perdcomp_id}/attached-files`
- **Method:** GET
- **Source:** [`PerDcompViewSet.list_attached_files`](backend/apps/perdcomps/views.py)
- **Auth:** JWT Token required (`IsAuthenticated`)

#### Request Logic

No body required.

#### Response Logic

```json
[
  {
    "id": "uuid",
    "entity_name": "PER/DCOMP PER2024001",
    "uploaded_by_name": "tax_analyst",
    "file_type": "recibo",
    "file_name": "recibo_compensacao_jan2024.pdf",
    "file_url": "https://storage.url/recibo.pdf",
    "file_size": 1024000,
    "file_size_human": "1.0 MB",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## PER/DCOMP Approval Requests Integration (common.approvals)

### List PER/DCOMP Approval Requests (Admin)

- **URL:** `/api/v1/admin/requests/`
- **Method:** GET
- **Source:** Admin endpoints via [`common.approvals.models.ApprovalRequest`](backend/common/approvals/models.py)
- **Auth:** Admin role required (`IsAdminUser`)

#### Request Logic

Query parameters:

- `resource_type`: Filter by "perdcomps.PerDcomp"
- `status`: Filter by status (pending, approved, rejected)
- `requested_by`: Filter by requester
- `ordering`: Order by created_at

#### Response Logic

```json
{
  "count": 8,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "subject": "Alteração de dados sensíveis do PER/DCOMP",
      "action": "update",
      "resource_type": "perdcomps.PerDcomp",
      "resource_id": "perdcomp_uuid",
      "status": "pending",
      "reason": "Protocol number correction after tax office review",
      "requested_by": "tax_analyst",
      "requested_at": "2024-01-15T10:30:00Z",
      "reviewed_by": null,
      "reviewed_at": null,
      "payload_diff": {
        "processo_protocolo": {
          "old": "BR-2024-001-DEF",
          "new": "BR-2024-001-UPDATED"
        },
        "valor_pedido": {
          "old": "15000.00",
          "new": "20000.00"
        },
        "valor_compensado": {
          "old": "12000.00",
          "new": "18000.00"
        },
        "status": {
          "old": "active",
          "new": "transmitted"
        }
      },
      "metadata": {
        "api_endpoint": "/api/v1/perdcomps/uuid/sensitive-data",
        "http_method": "PATCH",
        "user_agent": "Frontend/1.0",
        "ip_address": "192.168.1.100"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## File Types for PER/DCOMP

**Available file types** (defined in [`common.shared.models.PERDCOMP_FILE_TYPES`](backend/common/shared/models.py)):

- `recibo`: "Recibo" - Receipt documents
- `aviso_recebimento`: "Aviso Recebimento" - Acknowledgment receipts
- `perdcomp`: "PER/DCOMP" - Main compensation documents

---

## Model Relationships

### PER/DCOMP Core Model

- **Source:** [`backend/apps/perdcomps/models.py`](backend/apps/perdcomps/models.py)
- **Key Fields:**
  - Identifiers: `id`, `public_id`, `numero_perdcomp`, `numero`
  - Relations: `client_id`, `colaborador_id`
  - Tax Data: `cnpj`, `tributo_pedido`, `competencia`
  - Financial: `valor_pedido`, `valor_compensado`, `valor_recebido`, `valor_saldo`
  - Status: `status`, `is_active`
  - Dates: `data_transmissao`, `data_vencimento`, `data_competencia`

### Generic Relations

- **Annotations:** Via [`common.shared.models.Annotation`](backend/common/shared/models.py) using `ContentType` + `object_id`
- **Attached Files:** Via [`common.shared.models.AttachedFile`](backend/common/shared/models.py) using `ContentType` + `object_id`
- **Approval Requests:** Via [`common.approvals.models.ApprovalRequest`](backend/common/approvals/models.py) targeting `resource_type="perdcomps.PerDcomp"`

### URL Routing

- **Source:** [`backend/apps/perdcomps/urls.py`](backend/apps/perdcomps/urls.py)
- **Base Path:** `/api/v1/perdcomps/`
- **Nested Resources:**
  - `attached-files/` → File management
  - `annotations/` → Annotation management
  - `{id}/sensitive-data` → Approval workflow
  - `{id}/attach-file` → Quick file upload
  - `{id}/add-annotation` → Quick annotation
