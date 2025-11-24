# PER/DCOMP Models Documentation

## Overview
This document contains all PER/DCOMP-related models from the `perdcomps` app, including shared models from `common.shared` that are used with PER/DCOMP entities (annotations and attached files).

---

## PerDcomp Model

**Source:** `apps.perdcomps.models.PerDcomp`
**Table Name:** `perdcomps`

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `client_id` | `BigIntegerField` | | ID of related client |
| `created_by_id` | `BigIntegerField` | | ID of user who created |
| `cnpj` | `CharField` | `max_length=18` | Client's CNPJ (denormalized) |
| `numero` | `TextField` | | Document number |
| `numero_perdcomp` | `TextField` | | Specific PER/DCOMP number |
| `processo_protocolo` | `BigIntegerField` | | Process protocol number |
| `data_transmissao` | `DateTimeField` | `null=True`, `blank=True` | Transmission date and time |
| `data_vencimento` | `DateTimeField` | | Due date and time |
| `data_competencia` | `DateTimeField` | | Competency date |
| `tributo_pedido` | `TextField` | | Requested tax type |
| `competencia` | `TextField` | | Tax competency period |
| `valor_pedido` | `CharField` | `max_length=50` | Requested amount (stored as string for precision) |
| `valor_compensado` | `CharField` | `max_length=50` | Compensated amount |
| `valor_recebido` | `CharField` | `max_length=50` | Received amount |
| `valor_saldo` | `CharField` | `max_length=50` | Remaining balance |
| `valor_selic` | `CharField` | `max_length=50` | SELIC interest amount |
| `status` | `CharField` | `max_length=30`, `choices=Status.choices`, `default=Status.RASCUNHO` | Current status |
| `is_active` | `BooleanField` | `default=True` | Active in system |
| `created_at` | `DateTimeField` | `default=timezone.now` | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | Last update timestamp |
| `deleted_at` | `DateTimeField` | `null=True`, `blank=True` | Soft deletion timestamp |

### Choices

#### Status
```python
RASCUNHO = "RASCUNHO", "Rascunho"
TRANSMITIDO = "TRANSMITIDO", "Transmitido"
EM_PROCESSAMENTO = "EM_PROCESSAMENTO", "Em Processamento"
DEFERIDO = "DEFERIDO", "Deferido"
INDEFERIDO = "INDEFERIDO", "Indeferido"
PARCIALMENTE_DEFERIDO = "PARCIALMENTE_DEFERIDO", "Parcialmente Deferido"
CANCELADO = "CANCELADO", "Cancelado"
VENCIDO = "VENCIDO", "Vencido"
```

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `soft_delete()` | `None` | Sets `deleted_at` and deactivates record |
| `restore()` | `None` | Restores record and reactivates |
| `__str__()` | `str` | Returns "PER/DCOMP {numero_perdcomp} - {cnpj}" |

### Properties

| Property | Return Type | Description |
|----------|-------------|-------------|
| `client` | `Client` or `None` | Lazy-loaded related client |
| `created_by` | `User` or `None` | Lazy-loaded user who created |
| `esta_vencido` | `bool` | True if past due date |
| `pode_ser_editado` | `bool` | True if status allows editing (RASCUNHO only) |
| `pode_ser_cancelado` | `bool` | True if status allows cancellation |

### Meta Configuration

```python
db_table = "perdcomps"
verbose_name = "PER/DCOMP"
verbose_name_plural = "PER/DCOMPs"
ordering = ["-created_at"]
```

### Indexes

```python
indexes = [
    models.Index(fields=["public_id"]),
    models.Index(fields=["numero_perdcomp"]),
    models.Index(fields=["processo_protocolo"]),
    models.Index(fields=["cnpj"]),
    models.Index(fields=["client_id"]),
    models.Index(fields=["status"]),
    models.Index(fields=["created_at"]),
    models.Index(fields=["data_vencimento"]),
    models.Index(fields=["data_competencia"]),
]
```

### Relationships

- **Many-to-One:** `client` → `Client` (via `client_id`)
- **Many-to-One:** `created_by` → `User` (via `created_by_id`)
- **Generic Relations:** Multiple `Annotation` records via ContentType
- **Generic Relations:** Multiple `AttachedFile` records via ContentType

### Special Attributes

- `__audit__ = True` - Enables automatic audit logging

---

## Shared Models Used with PER/DCOMPs

### Annotation Model (for PER/DCOMP Annotations)

**Source:** `common.shared.models.Annotation`
**Table Name:** `common_annotations`
**Usage:** PER/DCOMP annotations via Generic Foreign Key

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

#### PER/DCOMP Usage

When used with PER/DCOMPs:
- `content_type`: Points to PerDcomp ContentType
- `object_id`: Contains PerDcomp's internal ID
- Used for storing process notes, status updates, and comments about specific PER/DCOMPs

---

### AttachedFile Model (for PER/DCOMP Files)

**Source:** `common.shared.models.AttachedFile`
**Table Name:** `common_attached_files`
**Usage:** PER/DCOMP file attachments via Generic Foreign Key

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `content_type` | `ForeignKey` | `on_delete=models.CASCADE` | ContentType for generic relation |
| `object_id` | `PositiveBigIntegerField` | | ID of related object |
| `content_object` | `GenericForeignKey` | | Generic relation to any model |
| `file_type` | `CharField` | `max_length=50` | File type (perdcomp-specific) |
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
| `file_size_human` | `str` | Human-readable file size (e.g., "1.2 MB") |

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

#### PER/DCOMP File Types

**Source:** `common.shared.models.PERDCOMP_FILE_TYPES`

```python
PERDCOMP_FILE_TYPES = [
    ("recibo", "Recibo"),
    ("aviso_recebimento", "Aviso Recebimento"),
    ("perdcomp", "PER/DCOMP"),
]
```

#### PER/DCOMP Usage

When used with PER/DCOMPs:
- `content_type`: Points to PerDcomp ContentType
- `object_id`: Contains PerDcomp's internal ID
- `file_type`: Must be one of PERDCOMP_FILE_TYPES
- Used for storing receipts, acknowledgment notices, and official PER/DCOMP documents

---

## Model Relationships Summary

### PerDcomp → Other Models
- **PerDcomp** belongs to one **Client** (via `client_id`)
- **PerDcomp** is created by one **User** (via `created_by_id`)
- **PerDcomp** can have multiple **Annotation** records (generic relation)
- **PerDcomp** can have multiple **AttachedFile** records (generic relation)
- **PerDcomp** can be referenced in **ApprovalRequest** records (for sensitive changes)
- **PerDcomp** can be referenced in **AuditLog** records (for change tracking)

### Business Logic Notes

1. **Status Workflow:** PER/DCOMPs follow a specific status progression from RASCUNHO to final states
2. **Monetary Values:** All monetary fields are stored as strings to maintain exact decimal precision
3. **Denormalization:** Client CNPJ is stored in PerDcomp for performance and historical accuracy
4. **Due Date Checking:** `esta_vencido` property automatically checks if due date has passed
5. **Edit Restrictions:** Only drafts (RASCUNHO) can be edited through `pode_ser_editado`
6. **Cancellation Rules:** `pode_ser_cancelado` defines which statuses allow cancellation

### Database Design Notes

1. **Primary Keys:** Uses `BigAutoField` for performance with large datasets
2. **Public IDs:** UUIDs used for external API exposure to hide internal IDs
3. **Soft Deletion:** Full support with `deleted_at` field and restore functionality
4. **Audit Trail:** Automatic audit logging enabled for all changes
5. **Generic Relations:** Flexible annotation and file attachment system
6. **Performance Indexes:** Strategic indexing on frequently queried fields
7. **Data Integrity:** Foreign key relationships with proper cascading behavior

### File Management

- **File Types:** Restricted to specific document types relevant to tax processes
- **Storage:** Files stored externally with URL references
- **Security:** File access controlled through uploaded_by_id and generic relations
- **Metadata:** Rich metadata including size, MIME type, and descriptions