# API Integration Migration - Supabase to Django REST Framework

This document outlines the completed migration from Supabase to Django REST Framework API integration.

## ✅ Migration Completed

### Changes Made

1. **Dependencies Removed**
   - Removed `@supabase/supabase-js` from package.json
   - Deleted `src/integrations/supabase/` directory

2. **API Configuration Updated**
   - Enhanced `src/lib/api.ts` with Django REST patterns
   - Added JWT token management and refresh
   - Added error handling for Django error responses
   - Added helper functions for pagination and query building

3. **Authentication Store Migrated** 
   - Replaced Supabase auth with Django JWT authentication
   - Updated login/register/logout flows
   - Added token refresh mechanism
   - Cookie-based token storage

4. **Data Stores Migrated**
   - `authStore.ts` - JWT authentication with Django API
   - `clientStore.ts` - CRUD operations via Django API  
   - `requestStore.ts` - Approval request management
   - `perdcompStore.ts` - PER/DCOMP operations
   - `activityStore.ts` - Activity logging
   - `annotationStore.ts` - Notes/annotations
   - `settingsStore.ts` - User preferences with health checks

5. **TypeScript Types Updated**
   - `src/types/api.ts` - Aligned with Django model structure
   - Added proper error response types
   - Added filter interfaces for all endpoints

6. **Environment Configuration**
   - Added `.env.local`, `.env.production`, `.env.example`
   - Configured Django API endpoints
   - Added health check URLs

### Environment Variables

Required environment variables (see `.env.example`):

```env
# Django REST API Configuration  
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Health Check URLs (optional)
VITE_HEALTH_LIVE_URL=http://localhost:8000/health/live
VITE_HEALTH_READY_URL=http://localhost:8000/health/ready

# Documentation URL (optional)  
VITE_API_DOCS_URL=http://localhost:8000/api/docs
```

### API Endpoints Expected

The frontend now expects these Django REST API endpoints:

#### Authentication
- `POST /auth/login/` - Login with username/password
- `POST /auth/register/` - User registration  
- `POST /auth/refresh/` - Token refresh
- `POST /auth/logout/` - Logout
- `GET /auth/me/` - Current user profile
- `PATCH /auth/me/` - Update user profile
- `GET /auth/preferences/` - User preferences
- `PATCH /auth/preferences/` - Update preferences

#### Core Resources
- `GET/POST /clients/` - Client list/create
- `GET/PATCH/DELETE /clients/{id}/` - Client detail/update/delete
- `GET/POST /perdcomps/` - PerdComp list/create  
- `GET/PATCH/DELETE /perdcomps/{id}/` - PerdComp detail/update/delete
- `POST /perdcomps/{id}/transmitir/` - Transmit PerdComp
- `POST /perdcomps/{id}/cancelar/` - Cancel PerdComp

#### Approval Workflow
- `GET/POST /requests/` - Request list/create
- `GET/PATCH/DELETE /requests/{id}/` - Request detail/update/delete
- `POST /requests/{id}/approve/` - Approve request
- `POST /requests/{id}/reject/` - Reject request
- `POST /requests/{id}/execute/` - Execute request
- `POST /requests/{id}/cancel/` - Cancel request

#### Audit & Annotations
- `GET/POST /activities/` - Activity log
- `GET /activities/{id}/` - Activity detail
- `GET/POST /annotations/` - Annotations list/create
- `GET/PATCH/DELETE /annotations/{id}/` - Annotation detail/update/delete

#### Health Checks
- `GET /health/live/` - Liveness probe
- `GET /health/ready/` - Readiness probe

### Response Format

All API responses follow Django REST Framework patterns:

**Paginated Lists:**
```json
{
  "count": 150,
  "next": "http://api.domain.com/clients/?page=2",
  "previous": null,
  "results": [...]
}
```

**Error Responses:**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Dados de entrada inválidos",
    "details": {
      "cnpj": ["Este campo é obrigatório"]
    },
    "correlation_id": "uuid-here"
  }
}
```

## 🚀 Getting Started

1. **Clone and install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Django API URL
   ```

3. **Start development server:**
   ```bash
   bun dev
   ```

4. **Connect to Django API:**
   - Ensure Django backend is running on `http://localhost:8000`
   - API should be accessible at `http://localhost:8000/api/v1/`
   - Test connection via health check endpoints

## 🔧 Development Notes

- All API calls use Axios with automatic JWT token management
- Tokens are stored in HTTP-only cookies for security
- Auto-refresh handles expired tokens transparently  
- Error responses include correlation IDs for debugging
- All stores support pagination, filtering, and search
- Types are fully aligned with Django model structure

## 📝 Testing Authentication

For development/testing without full backend:

```typescript
// Use test user (bypasses API calls)
const { signInAsTestUser } = useAuthStore();
signInAsTestUser();
```

This completes the migration from Supabase to Django REST API integration.