# Utility Models Documentation

## Overview
This document contains utility and system models that don't belong to specific business entities. These include approval requests, audit logs, and other supporting models from the `common` directory.

---

## ApprovalRequest Model

**Source:** `common.approvals.models.ApprovalRequest`
**Table Name:** `approval_requests`

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `subject` | `CharField` | `max_length=255` | Request subject/title |
| `action` | `CharField` | `max_length=20`, `choices=ApprovalAction.choices` | Type of action to execute |
| `status` | `CharField` | `max_length=20`, `choices=status_choices`, `default="pending"` | Current status |
| `resource_type` | `CharField` | `max_length=100` | Type of resource to modify (e.g., 'clients.Client') |
| `resource_id` | `CharField` | `max_length=255` | ID of resource to modify |
| `payload_diff` | `JSONField` | | Before/after data difference |
| `reason` | `TextField` | | Justification for the request |
| `requested_by` | `ForeignKey` | `on_delete=models.CASCADE`, `related_name="approval_requests_made"` | User who made request |
| `approved_by` | `ForeignKey` | `on_delete=models.SET_NULL`, `null=True`, `blank=True`, `related_name="approval_requests_approved"` | User who approved/rejected |
| `created_at` | `DateTimeField` | `default=timezone.now` | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | Last update timestamp |
| `approved_at` | `DateTimeField` | `null=True`, `blank=True` | Approval/rejection timestamp |
| `executed_at` | `DateTimeField` | `null=True`, `blank=True` | Execution timestamp |
| `metadata` | `JSONField` | `default=dict`, `blank=True` | Additional information |
| `approval_notes` | `TextField` | `blank=True` | Approver's notes |

### Choices

#### ApprovalStatus
```python
PENDING = "pending", "Pendente"
APPROVED = "approved", "Aprovado"
REJECTED = "rejected", "Rejeitado"
EXECUTED = "executed", "Executado"
CANCELLED = "cancelled", "Cancelado"
```

#### ApprovalAction
```python
CREATE = "create", "Criar"
UPDATE = "update", "Atualizar"
DELETE = "delete", "Excluir"
ACTIVATE = "activate", "Ativar"
DEACTIVATE = "deactivate", "Desativar"
CUSTOM = "custom", "Ação Personalizada"
```

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `approve(approved_by_user, notes="")` | `None` | Approves the request |
| `reject(approved_by_user, notes="")` | `None` | Rejects the request |
| `mark_executed()` | `None` | Marks as executed |
| `cancel()` | `None` | Cancels if pending |
| `__str__()` | `str` | Returns "{subject} - {status}" |

### Properties

| Property | Return Type | Description |
|----------|-------------|-------------|
| `is_pending` | `bool` | True if status is pending |
| `is_approved` | `bool` | True if approved or executed |
| `can_be_executed` | `bool` | True if approved but not executed |

### Meta Configuration

```python
db_table = "approval_requests"
ordering = ["-created_at"]
```

### Indexes

```python
indexes = [
    models.Index(fields=["public_id"]),
    models.Index(fields=["status"]),
    models.Index(fields=["requested_by"]),
    models.Index(fields=["approved_by"]),
    models.Index(fields=["resource_type", "resource_id"]),
    models.Index(fields=["created_at"]),
]
```

### Relationships

- **Many-to-One:** `requested_by` → `User`
- **Many-to-One:** `approved_by` → `User` (nullable)

### Special Attributes

- `__audit__ = False` - Disables automatic audit logging (serves as its own audit trail)

---

## AuditLog Model

**Source:** `common.audit.models.AuditLog`
**Table Name:** `audit_logs`

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `correlation_id` | `UUIDField` | | Correlation ID for tracking related actions |
| `user` | `ForeignKey` | `on_delete=models.SET_NULL`, `null=True`, `blank=True` | User who performed action |
| `action` | `CharField` | `max_length=100`, `choices=AuditAction.choices` | Type of action performed |
| `content_type` | `ForeignKey` | `on_delete=models.CASCADE` | ContentType for generic relation |
| `object_id` | `CharField` | `max_length=255` | ID of affected object |
| `content_object` | `GenericForeignKey` | | Generic relation to affected object |
| `old_data` | `JSONField` | `null=True`, `blank=True` | Previous state (for UPDATE/DELETE) |
| `new_data` | `JSONField` | `null=True`, `blank=True` | New state (for CREATE/UPDATE) |
| `metadata` | `JSONField` | `default=dict`, `blank=True` | Additional action information |
| `ip_address` | `GenericIPAddressField` | `null=True`, `blank=True` | User's IP address |
| `user_agent` | `TextField` | `null=True`, `blank=True` | User's browser/client info |
| `timestamp` | `DateTimeField` | `default=timezone.now` | When action was performed |

### Choices

#### AuditAction
```python
CREATE = "CREATE", "Criar"
UPDATE = "UPDATE", "Atualizar"
DELETE = "DELETE", "Excluir"
LOGIN = "LOGIN", "Login"
LOGOUT = "LOGOUT", "Logout"
APPROVAL_REQUESTED = "APPROVAL_REQUESTED", "Aprovação Solicitada"
APPROVAL_GRANTED = "APPROVAL_GRANTED", "Aprovação Concedida"
APPROVAL_DENIED = "APPROVAL_DENIED", "Aprovação Negada"
CUSTOM = "CUSTOM", "Ação Personalizada"
```

### Properties

| Property | Return Type | Description |
|----------|-------------|-------------|
| `resource_type` | `str` | Returns "{app_label}.{model}" format |
| `resource_id` | `str` | Returns the object_id |

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `__str__()` | `str` | Returns action description with context |

### Meta Configuration

```python
db_table = "audit_logs"
ordering = ["-timestamp"]
```

### Indexes

```python
indexes = [
    models.Index(fields=["correlation_id"]),
    models.Index(fields=["user"]),
    models.Index(fields=["action"]),
    models.Index(fields=["content_type", "object_id"]),
    models.Index(fields=["timestamp"]),
]
```

### Relationships

- **Many-to-One:** `user` → `User` (nullable)
- **Generic Relations:** Points to any audited model via ContentType

---

## Shared Utility Models

### Annotation Model (Generic)

**Source:** `common.shared.models.Annotation`
**Table Name:** `common_annotations`
**Usage:** Generic annotation system for any entity

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `content_type` | `ForeignKey` | `on_delete=models.CASCADE` | ContentType for generic relation |
| `object_id` | `PositiveBigIntegerField` | | ID of related object |
| `content_object` | `GenericForeignKey` | | Generic relation to any model |
| `user_id` | `BigIntegerField` | | ID of user who created annotation |
| `content` | `TextField` | | Annotation text content |
| `created_at` | `DateTimeField` | `auto_now_add=True` | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | Last update timestamp |
| `deleted_at` | `DateTimeField` | `null=True`, `blank=True` | Soft deletion timestamp |

#### Properties

| Property | Return Type | Description |
|----------|-------------|-------------|
| `user` | `User` or `None` | Lazy-loaded user who created annotation |

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `soft_delete()` | `None` | Sets `deleted_at` timestamp |
| `__str__()` | `str` | Returns annotation description |

#### Meta Configuration

```python
db_table = "common_annotations"
ordering = ["-created_at"]
```

#### Indexes

```python
indexes = [
    models.Index(fields=["content_type", "object_id"]),
    models.Index(fields=["user_id"]),
    models.Index(fields=["created_at"]),
]
```

---

### AttachedFile Model (Generic)

**Source:** `common.shared.models.AttachedFile`
**Table Name:** `common_attached_files`
**Usage:** Generic file attachment system for any entity

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `content_type` | `ForeignKey` | `on_delete=models.CASCADE` | ContentType for generic relation |
| `object_id` | `PositiveBigIntegerField` | | ID of related object |
| `content_object` | `GenericForeignKey` | | Generic relation to any model |
| `file_type` | `CharField` | `max_length=50` | File type (entity-specific) |
| `file_name` | `CharField` | `max_length=255` | Original file name |
| `file_url` | `URLField` | `max_length=500` | File storage URL |
| `file_size` | `PositiveBigIntegerField` | | File size in bytes |
| `mime_type` | `CharField` | `max_length=100`, `blank=True` | MIME type |
| `description` | `TextField` | `blank=True` | File description |
| `uploaded_by_id` | `BigIntegerField` | | ID of user who uploaded |
| `created_at` | `DateTimeField` | `auto_now_add=True` | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | Last update timestamp |
| `deleted_at` | `DateTimeField` | `null=True`, `blank=True` | Soft deletion timestamp |

#### Properties

| Property | Return Type | Description |
|----------|-------------|-------------|
| `uploaded_by` | `User` or `None` | Lazy-loaded user who uploaded file |
| `file_size_human` | `str` | Human-readable file size |

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `soft_delete()` | `None` | Sets `deleted_at` timestamp |
| `__str__()` | `str` | Returns file description |

#### Meta Configuration

```python
db_table = "common_attached_files"
ordering = ["-created_at"]
```

#### Indexes

```python
indexes = [
    models.Index(fields=["content_type", "object_id"]),
    models.Index(fields=["file_type"]),
    models.Index(fields=["uploaded_by_id"]),
    models.Index(fields=["created_at"]),
]
```

### File Type Constants

**Source:** `common.shared.models`

#### Client File Types
```python
CLIENT_FILE_TYPES = [
    ("contrato", "Contrato"),
    ("cartao_cnpj", "Cartão CNPJ"),
]
```

#### PER/DCOMP File Types
```python
PERDCOMP_FILE_TYPES = [
    ("recibo", "Recibo"),
    ("aviso_recebimento", "Aviso Recebimento"),
    ("perdcomp", "PER/DCOMP"),
]
```

#### Helper Function
```python
def get_file_type_choices(content_type_name):
    """Returns file type choices based on entity."""
    choices_map = {
        "client": CLIENT_FILE_TYPES,
        "perdcomp": PERDCOMP_FILE_TYPES,
    }
    return choices_map.get(content_type_name, [])
```

---

## Model Relationships Summary

### Cross-Model Relationships

#### ApprovalRequest → Other Models
- **ApprovalRequest** is created by **User** (`requested_by`)
- **ApprovalRequest** is reviewed by **User** (`approved_by`)
- **ApprovalRequest** references any model via `resource_type` + `resource_id`
- **ApprovalRequest** tracks changes to **User**, **Client**, **PerDcomp** entities

#### AuditLog → Other Models
- **AuditLog** is created by **User** (nullable for system actions)
- **AuditLog** references any audited model via GenericForeignKey
- **AuditLog** tracks all CRUD operations on **User**, **Client**, **PerDcomp**, **Address**

#### Generic Models → Any Entity
- **Annotation** can be attached to any model via ContentType
- **AttachedFile** can be attached to any model via ContentType
- Both use different file types based on the target entity

### System Design Notes

1. **Approval Workflow:** All sensitive data changes go through ApprovalRequest system
2. **Audit Trail:** Comprehensive logging of all system actions with correlation IDs
3. **Generic Relations:** Flexible annotation and file systems work with any entity
4. **Security:** Audit logs are immutable; approval requests serve as their own audit trail
5. **Performance:** Strategic indexing for common query patterns
6. **Data Integrity:** Proper foreign key relationships with cascading behavior
7. **Traceability:** Correlation IDs link related actions across the system

### Usage Patterns

1. **Sensitive Changes:** User → ApprovalRequest → Admin Review → Execution → AuditLog
2. **File Uploads:** User → AttachedFile → Entity Association → AuditLog
3. **Annotations:** User → Annotation → Entity Association
4. **System Monitoring:** All actions → AuditLog → Correlation tracking