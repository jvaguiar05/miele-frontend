# Base Integration Documentation

## Overview

The **Miele System** provides a comprehensive REST API built with Django REST Framework (DRF) and JWT authentication. This document covers the foundational setup required before making specific API calls.

**Key Characteristics:**

- **API-First Architecture:** All functionality exposed via REST endpoints
- **JWT Authentication:** Access/refresh token pattern with automatic rotation
- **Structured Error Handling:** Consistent error envelopes with correlation IDs
- **Rate Limiting:** Built-in throttling for security and stability
- **OpenAPI Documentation:** Available at `/api/docs/`

---

## 1. Environment Setup

### Base URL Pattern

```
Production: https://miele-api.domain.com/api/v1/
Development: http://localhost:8000/api/v1/
```

**API Versioning:**

- Current version: `v1`
- All endpoints are prefixed with `/api/v1/`
- Health checks available at: `/health/live` and `/health/ready` (no prefix)

### Required Frontend Environment Variables

```bash
# Base API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional: Health Check URLs
VITE_HEALTH_LIVE_URL=http://localhost:8000/health/live
VITE_HEALTH_READY_URL=http://localhost:8000/health/ready

# Optional: Documentation URL
VITE_API_DOCS_URL=http://localhost:8000/api/docs
```

### CORS Configuration

**Development:**

- All origins allowed by default (`CORS_ALLOW_ALL_ORIGINS = True`)
- No special configuration required for local development

**Production:**

- Restricted to specific allowed origins
- Configure `CORS_ALLOWED_ORIGINS` environment variable on backend
- Credentials are supported for JWT cookie handling

---

## 2. Authentication & Headers

### Auth Scheme: JWT Bearer

The API uses **JWT (JSON Web Tokens)** with the following characteristics:

- **Access Token:** Short-lived (15 minutes default)
- **Refresh Token:** Longer-lived (14 days default)
- **Automatic Rotation:** Refresh tokens are rotated on use
- **Blacklisting:** Old refresh tokens are automatically blacklisted

### Header Format

#### Required Authentication Header

```http
Authorization: Bearer <access_token>
```

**Example:**

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### Common Required Headers

```http
Content-Type: application/json
Accept: application/json
X-Request-Id: <optional-correlation-id>
```

#### Optional Headers

```http
Accept-Language: pt-BR,pt;q=0.9,en;q=0.8
User-Agent: YourApp/1.0 (Platform/Version)
```

### Authentication Flow Example

```javascript
// Login to get tokens
const loginResponse = await fetch("/api/v1/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "user@example.com",
    password: "password",
  }),
});

const { access, refresh } = await loginResponse.json();

// Use access token for API calls
const apiResponse = await fetch("/api/v1/clients/", {
  headers: {
    Authorization: `Bearer ${access}`,
    "Content-Type": "application/json",
  },
});

// Refresh tokens when access expires
const refreshResponse = await fetch("/api/v1/auth/refresh", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    refresh: refresh,
  }),
});
```

---

## 3. Global Request Standards

### Date/Time Format

**ISO 8601 with UTC Timezone:**

```
2024-01-15T10:30:00Z
```

**Examples:**

- **Created timestamps:** `"2024-01-15T10:30:00Z"`
- **Date-only fields:** `"2024-01-15"`
- **Date input format:** `"2024-01-15"` or `"2024-01-15T10:30:00Z"`

### JSON Case Convention

**snake_case** (Django REST Framework standard):

```json
{
  "razao_social": "Empresa Exemplo LTDA",
  "nome_fantasia": "Exemplo Tech",
  "created_at": "2024-01-15T10:30:00Z",
  "is_active": true
}
```

**NOT camelCase** (unless explicitly noted):

```json
// ❌ WRONG
{
  "razaoSocial": "...",
  "createdAt": "..."
}
```

### Trailing Slashes

**Required** for collection endpoints:

```
✅ GET /api/v1/clients/
❌ GET /api/v1/clients
```

**Optional** for detail endpoints:

```
✅ GET /api/v1/clients/uuid-here/
✅ GET /api/v1/clients/uuid-here
```

### URL Parameters

**Lookup Field:** Most resources use `public_id` (UUID) instead of integer IDs:

```
/api/v1/clients/{public_id}/
/api/v1/perdcomps/{public_id}/
```

---

## 4. Response Envelopes

### Pagination Structure

**PageNumberPagination** (DRF standard):

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/clients/?page=3",
  "previous": "http://localhost:8000/api/v1/clients/?page=1",
  "results": [
    {
      "id": "uuid-client-1",
      "razao_social": "Empresa A LTDA",
      "cnpj": "12.345.678/0001-90",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Pagination Parameters:**

- `page`: Page number (1-based indexing)
- `page_size`: Items per page (default: 20, max: 100)

**Example:**

```
GET /api/v1/clients/?page=2&page_size=50
```

### Success Response Structure

**Single Resource:**

```json
{
  "id": "uuid-resource",
  "field_name": "value",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Action Responses:**

```json
{
  "message": "Operação realizada com sucesso",
  "requires_approval": false
}
```

### Error Response Structure

**Validation Errors (400):**

```json
{
  "error": {
    "code": "validation_error",
    "message": "Dados de entrada inválidos",
    "details": {
      "cnpj": ["Este campo é obrigatório"],
      "email": ["Digite um endereço de email válido"]
    },
    "correlation_id": "uuid-correlation-id"
  }
}
```

**Authentication Errors (401):**

```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

**Authorization Errors (403):**

```json
{
  "detail": "Você não tem permissão para executar essa ação."
}
```

**Resource Not Found (404):**

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Recurso não encontrado",
    "details": {},
    "correlation_id": "uuid-correlation-id"
  }
}
```

**Rate Limiting (429):**

```json
{
  "error": {
    "code": "throttled",
    "message": "Taxa de requisições excedida. Tente novamente em alguns minutos.",
    "details": {
      "available_in": "60 seconds"
    },
    "correlation_id": "uuid-correlation-id"
  }
}
```

**Internal Server Error (500):**

```json
{
  "error": {
    "code": "internal_error",
    "message": "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    "details": {},
    "correlation_id": "uuid-correlation-id"
  }
}
```

---

## 5. Rate Limiting & Throttling

### Default Limits

**Anonymous users:**

- 10 requests per minute

**Authenticated users:**

- 100 requests per minute

**Authentication endpoints:**

- Login: 5 requests per minute
- Register: 3 requests per hour
- Refresh: 30 requests per hour
- Password reset: 2 requests per hour

**Sensitive actions:**

- 10 requests per hour

### Rate Limit Headers

When approaching limits, the API includes headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642234567
```

---

## 6. Content Negotiation

### Supported Content Types

**Request Content-Type:**

```http
Content-Type: application/json
```

**Response Accept:**

```http
Accept: application/json
```

**File Uploads:**

```http
Content-Type: multipart/form-data
```

---

## 7. Request ID & Correlation

### Correlation ID

**Optional Header:**

```http
X-Request-Id: uuid-generated-by-client
```

**If not provided:** Server generates automatically and returns in response:

```http
X-Request-Id: auto-generated-uuid
```

**Usage in Errors:** All error responses include `correlation_id` for debugging.

---

## 8. API Documentation

### OpenAPI Documentation

**Interactive Documentation:**

```
http://localhost:8000/api/docs/
```

**Schema Download:**

```
http://localhost:8000/api/schema/
```

### Authentication Testing

Use the "Authorize" button in `/api/docs/` with format:

```
Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

---

## 9. Health Checks

### Liveness Check

```http
GET /health/live
```

**Response:**

```json
{ "status": "live" }
```

### Readiness Check

```http
GET /health/ready
```

**Response:**

```json
{ "status": "ready" }
```

**Usage:** Monitor API availability before making business logic calls.

---

## 10. Common Filtering & Ordering

### Query Parameters

**Filtering:**

```
?is_active=true
?status=active
?client_id=uuid-here
```

**Search:**

```
?search=empresa
```

**Ordering:**

```
?ordering=created_at          # Ascending
?ordering=-created_at         # Descending
?ordering=razao_social,-created_at  # Multiple fields
```

**Combining:**

```
?is_active=true&search=tech&ordering=-created_at&page=2
```

---

## 11. Example HTTP Client Setup

### JavaScript/TypeScript

```typescript
class MieleAPIClient {
  private baseURL = process.env.VITE_API_BASE_URL!;
  private accessToken: string | null = null;

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error, response.status);
    }

    return response.json();
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }
}

class APIError extends Error {
  constructor(public errorData: any, public status: number) {
    super(errorData.error?.message || errorData.detail || "API Error");
  }
}
```

### Python Requests

```python
import requests
from typing import Dict, Any

class MieleAPIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.access_token = None
        self.session = requests.Session()

    def set_access_token(self, token: str):
        self.access_token = token
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })

    def request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        url = f"{self.base_url}{endpoint}"

        headers = kwargs.pop('headers', {})
        headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

        response = self.session.request(
            method=method,
            url=url,
            headers=headers,
            **kwargs
        )

        response.raise_for_status()
        return response.json()
```

---

**Next Steps:**

1. Review specific endpoint documentation: `identity-integration.md`, `clients-integration.md`, `perdcomps-integration.md`
2. Test authentication flow with `/api/v1/auth/login`
3. Verify API connectivity with health checks
4. Explore interactive documentation at `/api/docs/`
