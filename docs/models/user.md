# User Models Documentation

## Overview
This document contains all user-related models from the `identity` app. These models handle user authentication, authorization, and sensitive data change requests.

---

## User Model

**Source:** `apps.identity.models.User`
**Table Name:** `auth_user` (Django default)
**Inherits from:** `AbstractUser`, `AuditableMixin`

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `username` | `CharField` | `max_length=150`, `unique=True` | Username (inherited from AbstractUser) |
| `first_name` | `CharField` | `max_length=150`, `blank=True` | First name (inherited) |
| `last_name` | `CharField` | `max_length=150`, `blank=True` | Last name (inherited) |
| `email` | `EmailField` | `unique=True`, `blank=False`, `null=False` | Email address (overridden to be unique and required) |
| `is_staff` | `BooleanField` | `default=False` | Staff status (inherited) |
| `is_active` | `BooleanField` | `default=True` | Active status (inherited) |
| `date_joined` | `DateTimeField` | `auto_now_add=True` | Date joined (inherited) |
| `last_login` | `DateTimeField` | `null=True`, `blank=True` | Last login (inherited) |
| `approval_status` | `CharField` | `max_length=10`, `choices=ApprovalStatus.choices`, `default=ApprovalStatus.PENDING` | User approval status |
| `role` | `CharField` | `max_length=20`, `choices=UserRole.choices`, `default=UserRole.EMPLOYEE` | User role for RBAC |
| `deleted_at` | `DateTimeField` | `null=True`, `blank=True` | Soft deletion timestamp |
| `suspended_at` | `DateTimeField` | `null=True`, `blank=True` | Suspension timestamp |

### Choices

#### ApprovalStatus
```python
PENDING = "pending", "Pending"
APPROVED = "approved", "Approved"
DECLINED = "declined", "Declined"
```

#### UserRole
```python
EMPLOYEE = "employee", "Employee"
GUEST = "guest", "Guest"
ADMIN = "admin", "Admin"
```

### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `soft_delete()` | `None` | Sets `deleted_at` to current timestamp and saves |
| `restore()` | `None` | Sets `deleted_at` to `None` and saves |

### Properties

- Inherits all properties from Django's `AbstractUser`
- Has audit capabilities from `AuditableMixin`

### Meta Configuration

```python
verbose_name = "user"
verbose_name_plural = "users"
```

### Relationships

- **One-to-Many:** `totp_devices` → `TOTPDevice.user`
- **One-to-Many:** `change_requests` → `SensibleDataChangeRequest.user`
- **One-to-Many:** `reviewed_requests` → `SensibleDataChangeRequest.reviewed_by`
- **One-to-Many:** `approval_requests_made` → `ApprovalRequest.requested_by`
- **One-to-Many:** `approval_requests_approved` → `ApprovalRequest.approved_by`

---

## TOTPDevice Model

**Source:** `apps.identity.models.TOTPDevice`
**Table Name:** `identity_totpdevice`
**Inherits from:** `Device` (from `django_otp.models`)

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `key` | `CharField` | `max_length=80`, `unique=True` | TOTP secret key |
| `step` | `PositiveSmallIntegerField` | `default=30` | Time step for TOTP (seconds) |
| `t0` | `BigIntegerField` | `default=0` | Initial time for TOTP |
| `digits` | `PositiveSmallIntegerField` | `default=6` | Number of digits in TOTP |
| `tolerance` | `PositiveSmallIntegerField` | `default=1` | Tolerance for time drift |
| `drift` | `IntegerField` | `default=0` | Time drift compensation |
| `user` | `ForeignKey` | `on_delete=models.CASCADE`, `related_name="totp_devices"` | Associated user |

### Relationships

- **Many-to-One:** `user` → `User`

---

## SensibleDataChangeRequest Model

**Source:** `apps.identity.models.SensibleDataChangeRequest`
**Table Name:** `identity_sensibledatachangerequest`

### Fields

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | `BigAutoField` | Primary Key | Auto-generated primary key |
| `public_id` | `UUIDField` | `unique=True`, `editable=False`, `default=uuid.uuid4` | Public-facing UUID identifier |
| `user` | `ForeignKey` | `on_delete=models.CASCADE`, `related_name="change_requests"` | User requesting the change |
| `request_type` | `CharField` | `max_length=30`, `choices=RequestType.choices` | Type of change requested |
| `status` | `CharField` | `max_length=10`, `choices=RequestStatus.choices`, `default=RequestStatus.PENDING` | Current status |
| `requested_changes` | `JSONField` | | JSON containing the requested changes |
| `justification` | `TextField` | | Reason for the change request |
| `reviewed_by` | `ForeignKey` | `on_delete=models.SET_NULL`, `null=True`, `blank=True`, `related_name="reviewed_requests"`, `limit_choices_to={"role": User.UserRole.ADMIN}` | Admin who reviewed |
| `review_notes` | `TextField` | `blank=True` | Admin notes about the review |
| `created_at` | `DateTimeField` | `auto_now_add=True` | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | Last update timestamp |
| `reviewed_at` | `DateTimeField` | `null=True`, `blank=True` | Review timestamp |

### Choices

#### RequestType
```python
EMAIL_CHANGE = "email_change", "Email Change"
ROLE_CHANGE = "role_change", "Role Change"
SENSITIVE_PROFILE_CHANGE = "sensitive_profile_change", "Sensitive Profile Change"
```

#### RequestStatus
```python
PENDING = "pending", "Pending"
APPROVED = "approved", "Approved"
REJECTED = "rejected", "Rejected"
```

### Meta Configuration

```python
ordering = ["-created_at"]
verbose_name = "Sensible Data Change Request"
verbose_name_plural = "Sensible Data Change Requests"
```

### Indexes

```python
indexes = [
    models.Index(fields=["public_id"]),
    models.Index(fields=["user"]),
    models.Index(fields=["status"]),
    models.Index(fields=["created_at"]),
]
```

### Relationships

- **Many-to-One:** `user` → `User`
- **Many-to-One:** `reviewed_by` → `User` (nullable)

### Special Attributes

- `__audit__ = False` - Disables automatic audit logging as this model serves as its own audit trail

---

## Model Relationships Summary

### User → Other Models
- **User** can have multiple **TOTPDevice** records (2FA devices)
- **User** can create multiple **SensibleDataChangeRequest** records
- **User** (admin) can review multiple **SensibleDataChangeRequest** records
- **User** can create **ApprovalRequest** records (in other apps)
- **User** (admin) can approve **ApprovalRequest** records (in other apps)

### Database Design Notes

1. **Primary Keys:** All models use `BigAutoField` for performance with large datasets
2. **Public IDs:** UUIDs are used for external API exposure to hide internal IDs
3. **Soft Deletion:** User model supports soft deletion with `deleted_at` field
4. **Audit Trail:** User changes are automatically audited via `AuditableMixin`
5. **RBAC:** Role-based access control implemented through the `role` field
6. **Approval System:** Sensitive data changes go through approval workflow