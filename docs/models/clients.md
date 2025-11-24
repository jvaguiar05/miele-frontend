# Client Models Documentation

## Overview
This document contains all client-related models from the `clients` app, including shared models from `common.shared` that are used with client entities (annotations and attached files).

---

## Client Model

**Source:** `apps.clients.models.Client`
**Table Name:** `clients`

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `razao_social` | `CharField` | `max_length=255` | Company legal name |
| `nome_fantasia` | `CharField` | `max_length=255`, `blank=True` | Company trade name |
| `cnpj` | `CharField` | `max_length=18`, `unique=True` | CNPJ number |
| `inscricao_estadual` | `TextField` | `blank=True` | State registration |
| `inscricao_municipal` | `TextField` | `blank=True` | Municipal registration |
| `tipo_empresa` | `TextField` | `blank=True` | Company type |
| `recuperacao_judicial` | `BooleanField` | `default=False` | Under judicial recovery |
| `telefone_comercial` | `TextField` | `blank=True` | Commercial phone |
| `email_comercial` | `CharField` | `max_length=255`, `blank=True` | Commercial email |
| `website` | `TextField` | `blank=True` | Company website |
| `telefone_contato` | `TextField` | `blank=True` | Contact phone |
| `email_contato` | `TextField` | `blank=True` | Contact email |
| `quadro_societario` | `JSONField` | `default=list`, `blank=True` | Shareholder list |
| `cargos` | `JSONField` | `default=dict`, `blank=True` | Positions and responsibilities |
| `responsavel_financeiro` | `TextField` | `blank=True` | Financial manager |
| `contador_responsavel` | `TextField` | `blank=True` | Responsible accountant |
| `cnaes` | `JSONField` | `default=list`, `blank=True` | CNAE codes |
| `regime_tributacao` | `CharField` | `max_length=20`, `choices=RegimeTributacao.choices`, `blank=True` | Tax regime |
| `contrato_social` | `TextField` | `blank=True` | Corporate contract data |
| `ultima_alteracao_contratual` | `DateTimeField` | `null=True`, `blank=True` | Last contract amendment date |
| `rg_cpf_socios` | `TextField` | `blank=True` | Partners' RG/CPF |
| `certificado_digital` | `TextField` | `blank=True` | Digital certificate info |
| `autorizado_para_envio` | `BooleanField` | `default=False` | Authorized for sending |
| `atividades` | `JSONField` | `default=dict`, `blank=True` | Company activities |
| `client_status` | `CharField` | `max_length=20`, `choices=ClientStatus.choices`, `default=ClientStatus.PENDING`, `null=True`, `blank=True` | Client status |
| `is_active` | `BooleanField` | `default=True`, `null=True`, `blank=True` | Active in system |
| `address_id` | `BigIntegerField` | `null=True`, `blank=True` | Related address ID |
| `created_at` | `DateTimeField` | `default=timezone.now` | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | Last update timestamp |
| `deleted_at` | `DateTimeField` | `null=True`, `blank=True` | Soft deletion timestamp |

### Choices

#### ClientStatus
```python
PENDING = "pending", "Pendente"
ACTIVE = "active", "Ativo"
SUSPENDED = "suspended", "Suspenso"
ARCHIVED = "archived", "Arquivado"
```

#### RegimeTributacao
```python
LUCRO_REAL = "lucro_real", "Lucro Real"
LUCRO_PRESUMIDO = "lucro_presumido", "Lucro Presumido"
```

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `soft_delete()` | `None` | Sets `deleted_at` and deactivates client |
| `restore()` | `None` | Restores client and reactivates |
| `__str__()` | `str` | Returns "{razao_social} ({cnpj})" |

### Properties

| Property | Return Type | Description |
|----------|-------------|-------------|
| `address` | `Address` or `None` | Lazy-loaded related address |

### Meta Configuration

```python
db_table = "clients"
ordering = ["-created_at"]
```

### Indexes

```python
indexes = [
    models.Index(fields=["public_id"]),
    models.Index(fields=["cnpj"]),
    models.Index(fields=["client_status"]),
    models.Index(fields=["is_active"]),
    models.Index(fields=["created_at"]),
    models.Index(fields=["address_id"]),
]
```

### Relationships

- **One-to-One:** `address` → `Address` (via `address_id`)
- **Generic Relations:** Multiple `Annotation` records via ContentType
- **Generic Relations:** Multiple `AttachedFile` records via ContentType

### Special Attributes

- `__audit__ = True` - Enables automatic audit logging

---

## Address Model

**Source:** `apps.clients.models.Address`
**Table Name:** `addresses`

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `logradouro` | `CharField` | `max_length=255` | Street name |
| `numero` | `CharField` | `max_length=20` | Street number |
| `complemento` | `CharField` | `max_length=255`, `blank=True` | Address complement |
| `bairro` | `CharField` | `max_length=100` | Neighborhood |
| `municipio` | `CharField` | `max_length=100` | City |
| `uf` | `CharField` | `max_length=2` | State code |
| `cep` | `CharField` | `max_length=10` | ZIP code |
| `created_at` | `DateTimeField` | `default=timezone.now` | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | Last update timestamp |
| `deleted_at` | `DateTimeField` | `null=True`, `blank=True` | Soft deletion timestamp |

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `__str__()` | `str` | Returns formatted address string |

### Meta Configuration

```python
db_table = "addresses"
ordering = ["-created_at"]
```

### Indexes

```python
indexes = [
    models.Index(fields=["public_id"]),
    models.Index(fields=["cep"]),
    models.Index(fields=["municipio"]),
    models.Index(fields=["uf"]),
]
```

### Relationships

- **One-to-One:** Linked to `Client` via `Client.address_id`

### Special Attributes

- `__audit__ = True` - Enables automatic audit logging

---

## Shared Models Used with Clients

### Annotation Model (for Client Annotations)

**Source:** `common.shared.models.Annotation`
**Table Name:** `common_annotations`
**Usage:** Client annotations via Generic Foreign Key

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

#### Client Usage

When used with clients:
- `content_type`: Points to Client ContentType
- `object_id`: Contains Client's internal ID
- Used for storing notes and comments about specific clients

---

### AttachedFile Model (for Client Files)

**Source:** `common.shared.models.AttachedFile`
**Table Name:** `common_attached_files`
**Usage:** Client file attachments via Generic Foreign Key

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `content_type` | `ForeignKey` | `on_delete=models.CASCADE` | ContentType for generic relation |
| `object_id` | `PositiveBigIntegerField` | | ID of related object |
| `content_object` | `GenericForeignKey` | | Generic relation to any model |
| `file_type` | `CharField` | `max_length=50` | File type (client-specific) |
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

#### Client File Types

**Source:** `common.shared.models.CLIENT_FILE_TYPES`

```python
CLIENT_FILE_TYPES = [
    ("contrato", "Contrato"),
    ("cartao_cnpj", "Cartão CNPJ"),
]
```

#### Client Usage

When used with clients:
- `content_type`: Points to Client ContentType
- `object_id`: Contains Client's internal ID
- `file_type`: Must be one of CLIENT_FILE_TYPES
- Used for storing contracts, CNPJ cards, and other client documents

---

## Model Relationships Summary

### Client → Other Models
- **Client** has one **Address** (via `address_id`)
- **Client** can have multiple **Annotation** records (generic relation)
- **Client** can have multiple **AttachedFile** records (generic relation)
- **Client** can be referenced in **ApprovalRequest** records (for sensitive changes)
- **Client** can be referenced in **AuditLog** records (for change tracking)

### Address → Other Models
- **Address** belongs to one **Client** (one-to-one)

### Database Design Notes

1. **Primary Keys:** All models use `BigAutoField` for performance
2. **Public IDs:** UUIDs used for external API exposure
3. **Soft Deletion:** Both Client and Address support soft deletion
4. **Audit Trail:** Both models have automatic audit logging enabled
5. **Generic Relations:** Annotation and AttachedFile use ContentType for flexibility
6. **JSON Fields:** Used for complex data like shareholder lists and CNAE codes
7. **Denormalization:** Address stored separately but linked via foreign key for flexibility