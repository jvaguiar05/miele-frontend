# User Profile Integration Documentation

## Overview

User profile management handles user data viewing and updates, with integration to the approval system for sensitive data changes. This module works closely with the identity system and approval workflows.

## Profile Management Endpoints

### Get User Profile

- **URL:** `/api/v1/users/me`
- **Method:** GET
- **Source:** [`UserProfileView`](backend/apps/identity/views.py)
- **Context:** Returns authenticated user's profile information

#### Request Schema

No body required. Uses JWT token from Authorization header.

#### Response Schema

```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "admin|employee|guest",
  "approval_status": "pending|approved|rejected",
  "is_active": true,
  "date_joined": "datetime",
  "last_login": "datetime"
}
```

### Update User Profile

- **URL:** `/api/v1/users/me`
- **Method:** PATCH
- **Source:** [`UserProfileView`](backend/apps/identity/views.py)
- **Context:** Updates non-sensitive user profile fields directly

#### Request Schema

```json
{
  "first_name": "string",
  "last_name": "string"
}
```

#### Response Schema

```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "first_name": "updated_first_name",
  "last_name": "updated_last_name",
  "role": "admin|employee|guest",
  "approval_status": "approved",
  "is_active": true,
  "date_joined": "datetime",
  "last_login": "datetime"
}
```

### Change Password

- **URL:** `/api/v1/users/password`
- **Method:** POST
- **Source:** [`ChangePasswordView`](backend/apps/identity/views.py)
- **Context:** Secure password change with current password verification

#### Request Schema

```json
{
  "current_password": "string",
  "new_password": "string",
  "confirm_password": "string"
}
```

#### Response Schema

```json
{
  "message": "Senha alterada com sucesso"
}
```

## Sensitive Data Change Endpoints (Approval Integration)

### Request Email Change

- **URL:** `/api/v1/users/change-email`
- **Method:** POST
- **Source:** [`EmailChangeRequestView`](backend/apps/identity/views.py)
- **Context:** Creates approval request for email changes via [`common.approvals`](backend/common/approvals/)

#### Request Schema

```json
{
  "new_email": "newemail@example.com",
  "approval_reason": "Required for business operations"
}
```

#### Response Schema

```json
{
  "message": "Solicitação de alteração de email criada. Aguardando aprovação.",
  "request_id": "uuid",
  "requires_approval": true,
  "current_email": "current@example.com",
  "requested_email": "newemail@example.com"
}
```

### List My Approval Requests

- **URL:** `/api/v1/users/my-requests`
- **Method:** GET
- **Source:** [`MyChangeRequestsView`](backend/apps/identity/views.py)
- **Context:** Lists user's approval requests from [`ApprovalRequest`](backend/common/approvals/models.py)

#### Request Schema

No body required. Query parameters:

- `status`: Filter by status (pending, approved, rejected)
- `action`: Filter by action type
- `ordering`: Order results (-created_at, created_at)

#### Response Schema

```json
{
  "count": 10,
  "next": "string|null",
  "previous": "string|null",
  "results": [
    {
      "id": "uuid",
      "subject": "Email change request",
      "action": "update",
      "resource_type": "identity.User",
      "resource_id": "uuid",
      "status": "pending",
      "reason": "Business email change required",
      "requested_at": "datetime",
      "reviewed_at": "datetime|null",
      "reviewed_by": "username|null",
      "payload_diff": {
        "email": {
          "old": "old@example.com",
          "new": "new@example.com"
        }
      },
      "metadata": {
        "api_endpoint": "/api/v1/users/change-email",
        "http_method": "POST",
        "original_action": "update_email"
      }
    }
  ]
}
```

## Account Lifecycle Endpoints

### Deactivate Account

- **URL:** `/api/v1/users/deactivate`
- **Method:** POST
- **Source:** [`UserDeactivateView`](backend/apps/identity/views.py)
- **Context:** Soft-deletes user account with optional reason

#### Request Schema

```json
{
  "reason": "No longer needed",
  "confirm": true
}
```

#### Response Schema

```json
{
  "message": "Conta desativada com sucesso",
  "deactivated_at": "datetime"
}
```

## Security and Permissions

### Authentication Required

All user profile endpoints require valid JWT token in Authorization header:

```
Authorization: Bearer <jwt_access_token>
```

### Permission Levels

- **Own Profile Access:** Users can view and update their own profiles
- **Admin Access:** Admins can view/edit any user profile via admin endpoints
- **Sensitive Changes:** Email and other critical data require approval workflow

### Rate Limiting

- Profile updates: Limited by [`SensitiveActionThrottle`](backend/apps/identity/throttling.py)
- Password changes: Enhanced rate limiting for security
- Email change requests: Limited to prevent abuse

## Integration with Common Apps

### Approval System Integration

User profile changes that affect sensitive data integrate with [`common.approvals`](backend/common/approvals/):

1. **Request Creation:** Sensitive changes create [`ApprovalRequest`](backend/common/approvals/models.py) records
2. **Approval Process:** Admins review via [`ApprovalService`](backend/common/approvals/services.py)
3. **Execution:** Approved requests are automatically applied
4. **Audit Trail:** All actions are logged via [`AuditService`](backend/common/audit/services.py)

### Audit System Integration

Profile changes are automatically audited via [`common.audit`](backend/common/audit/):

- Profile updates create audit log entries
- Password changes are logged (without sensitive data)
- Account deactivation is tracked
- All actions include correlation IDs for tracing

## Error Responses

### Standard Error Format

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field_name": ["List of field-specific errors"]
  }
}
```

### Common Error Codes

- **401 Unauthorized:** Invalid or expired JWT token
- **403 Forbidden:** Insufficient permissions
- **400 Bad Request:** Validation errors
- **429 Too Many Requests:** Rate limit exceeded
- **404 Not Found:** User not found (admin operations)

## Frontend Implementation Notes

### JWT Token Management

- Store access token securely (memory/secure storage)
- Implement automatic refresh logic before expiration
- Handle token expiration gracefully with re-authentication

### Approval Workflow UX

- Display pending approval status to users
- Provide clear messaging about approval requirements
- Allow users to track request status via my-requests endpoint

### Validation

- Client-side validation should match backend serializer validation
- Password strength indicators for password changes
- Email format validation for email change requests
