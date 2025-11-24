# Identity Integration Documentation

## Overview

The Identity module handles authentication, authorization, and user management using JWT tokens with refresh rotation and blacklist functionality. This module integrates with the approval system for sensitive user data changes.

## Authentication Endpoints

### Login

- **URL:** `/api/v1/auth/login`
- **Method:** POST
- **Source:** [`CustomTokenObtainPairView`](backend/apps/identity/views.py)
- **Context:** Custom JWT authentication with enhanced security features

#### Request Schema

```json
{
  "username": "string",
  "password": "string"
}
```

#### Response Schema

```json
{
  "refresh": "jwt_refresh_token",
  "access": "jwt_access_token"
}
```

### Token Refresh

- **URL:** `/api/v1/auth/refresh`
- **Method:** POST
- **Source:** [`CustomTokenRefreshView`](backend/apps/identity/views.py)
- **Context:** Refresh token rotation with automatic blacklisting

#### Request Schema

```json
{
  "refresh": "jwt_refresh_token"
}
```

#### Response Schema

```json
{
  "access": "new_jwt_access_token",
  "refresh": "new_jwt_refresh_token"
}
```

### Logout

- **URL:** `/api/v1/auth/logout`
- **Method:** POST
- **Source:** [`LogoutView`](backend/apps/identity/views.py)
- **Context:** Blacklists refresh token and invalidates session

#### Request Schema

```json
{
  "refresh": "jwt_refresh_token"
}
```

#### Response Schema

- 205 Logout successful, no body returned
- 400 Bad request if token is invalid
- 429 Too many requests if rate limit exceeded
- 500 Internal server error on unexpected failure

### User Registration

- **URL:** `/api/v1/auth/register`
- **Method:** POST
- **Source:** [`UserRegistrationView`](backend/apps/identity/views.py)
- **Context:** Creates user account with pending approval status

#### Request Schema

```json
{
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "password": "string",
  "confirm_password": "string"
}
```

#### Response Schema

```json
{
  "message": "User registered successfully.",
  "username": "string",
  "email": "user@example.com",
  "approval_status": "pending"
}
```

## Authorization Endpoints

### RBAC Information

- **URL:** `/api/v1/users/rbac`
- **Method:** GET
- **Source:** [`RBACView`](backend/apps/identity/views.py)
- **Context:** Returns user permissions and capabilities based on role

#### Request Schema

No body required. Uses JWT token from Authorization header.

#### Response Schema

```json
{
  "user_id": "uuid",
  "username": "string",
  "role": "admin|employee|guest",
  "approval_status": "approved",
  "permissions": {
    "can_view_all_clients": true,
    "can_edit_clients": true,
    "can_view_all_perdcomps": true,
    "can_edit_perdcomps": true,
    "can_view_all_logs": false,
    "can_view_own_logs": true,
    "can_approve_requests": false,
    "can_change_sensible_data": false,
    "is_read_only": false
  }
}
```

## Two-Factor Authentication

### TOTP Enrollment

- **URL:** `/api/v1/users/totp/enroll`
- **Method:** POST
- **Source:** [`TOTPEnrollView`](backend/apps/identity/views.py)
- **Context:** Enrolls user in TOTP-based 2FA

#### Request Schema

```json
{
  "token": "123456"
}
```

#### Response Schema

```json
{
  "qr_code": "base64_qr_code_image",
  "secret": "totp_secret",
  "backup_codes": ["code1", "code2", "..."]
}
```

## Security Features

### Rate Limiting

- Login attempts: Limited by [`AuthLoginThrottle`](backend/apps/identity/throttling.py)
- Registration: Limited by [`AuthRegisterThrottle`](backend/apps/identity/throttling.py)
- Sensitive actions: Limited by [`SensitiveActionThrottle`](backend/apps/identity/throttling.py)

### Failed Login Tracking

- Implemented via [`FailedLoginAttemptThrottle`](backend/apps/identity/throttling.py)
- Tracks failed attempts per IP and username
- Automatic lockout after threshold

### Password Security

- Django's built-in password validation
- Minimum complexity requirements
- Password change endpoint with old password verification

## Integration Notes

### With Approval System

- Email changes require approval and create [`ApprovalRequest`](backend/common/approvals/models.py) records
- Admin users can approve/reject via admin interface or API
- Approval workflow is atomic and audited

### With Audit System

- All authentication events are logged via [`common.audit`](backend/common/audit/)
- User creation, login, logout, and sensitive changes are tracked
- Correlation IDs link related events

### Error Handling

- Standard error responses follow project conventions
- JWT validation errors return 401
- Permission errors return 403
- Rate limit errors return 429
