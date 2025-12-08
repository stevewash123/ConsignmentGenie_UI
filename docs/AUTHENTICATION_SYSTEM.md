# ConsignmentGenie Authentication System Documentation

## Overview

The ConsignmentGenie UI implements a comprehensive JWT-based authentication system with role-based access control (RBAC). The system supports multiple user types and provides secure access to different areas of the application based on user roles.

## Architecture

### Core Components

#### 1. AuthService (`src/app/services/auth.service.ts`)
The central authentication service that handles all authentication-related operations:

- **Login/Logout**: Manages user authentication and session termination
- **Registration**: Handles owner and consignor registration flows
- **Token Management**: Stores, retrieves, and validates JWT tokens
- **Session Persistence**: Maintains authentication state across browser sessions
- **Social Authentication**: Supports Google and Facebook OAuth (with mock implementations)
- **Password Reset**: Complete forgot/reset password flow

**Key Methods:**
- `login(request: LoginRequest): Observable<LoginResponse>`
- `register(request: RegisterRequest): Observable<AuthResponse>`
- `registerOwner()`: Owner-specific registration with shop setup
- `logout(): void`
- `refreshToken(): Observable<AuthResponse>`
- `getToken(): string | null`
- `isTokenExpired(): boolean`
- `forgotPassword()` / `resetPassword()`: Password recovery

#### 2. Authentication Models (`src/app/models/auth.model.ts`)

**Core Interfaces:**
- `LoginRequest`: Email/password login credentials
- `AuthResponse`: Server response containing JWT token and user data
- `User`: User profile information
- `TokenInfo`: Token metadata including expiration
- `ForgotPasswordRequest/Response`: Password reset flow
- `ResetPasswordRequest/Response`: Password reset completion

#### 3. Guards System

**AuthGuard (`src/app/guards/auth.guard.ts`)**
- Base authentication guard ensuring users are logged in
- Validates token existence and user data integrity
- Role-based access control using route data
- Automatic cleanup of corrupted localStorage data

**Role-Specific Guards:**
- `OwnerGuard`: Restricts access to owner/admin users
- `AdminGuard`: Admin-only access
- `ConsignorGuard`: Consignor area access
- `CustomerGuard`: Customer area access

#### 4. HTTP Interceptor (`src/app/interceptors/auth.interceptor.ts`)
Functional interceptor that:
- Automatically attaches JWT tokens to API requests
- Handles token refresh on 401 errors
- Manages automatic logout on authentication failures
- Provides comprehensive logging for debugging

### User Roles

The system supports four distinct user roles with different access levels:

```typescript
enum UserRole {
  Admin = 0,      // Full system access
  Owner = 1,      // Shop management and settings
  Consignor = 2,  // Inventory and payout access
  Customer = 3    // Shopping and order access
}
```

## Authentication Flow

### 1. Login Process
```
User → LoginComponent → AuthService.login() → API
                                           ↓
                    localStorage ← AuthService ← JWT Response
                                           ↓
                    Route Guard ← User Navigation → Protected Route
```

1. User enters credentials in login form
2. `AuthService.login()` sends credentials to API
3. Server validates and returns JWT token + user data
4. Token stored in localStorage, user data in BehaviorSubject
5. Route guards validate access on navigation
6. HTTP interceptor attaches token to subsequent requests

### 2. Registration Process
```
Registration Form → AuthService.register*() → API Registration
                                          ↓
                 Auto-login ← Success Response ← User Creation
```

**Owner Registration:**
- Enhanced flow with shop setup (domain selection, business details)
- Real-time subdomain validation
- Automatic login after successful registration

**Consignor Registration:**
- Store code validation
- Organization association
- Email verification flow

### 3. Token Management
```
API Request → Interceptor → Check Token Validity
                         ↓
              Valid? → Attach Bearer Header
                         ↓
              Expired? → Refresh Token → Retry Request
                         ↓
              Refresh Failed? → Logout → Redirect to Login
```

### 4. Route Protection
```
Navigation → Route Guard → Check Authentication
                        ↓
           Authenticated? → Check Role Permissions
                        ↓
           Authorized? → Allow Access
                        ↓
           Denied? → Redirect to Appropriate Dashboard
```

## Storage Strategy

### LocalStorage Items
- `auth_token`: JWT access token
- `user_data`: JSON-serialized user profile
- `tokenExpiry`: Token expiration timestamp
- `refreshToken`: Token refresh credential (if applicable)

### Data Validation
- Comprehensive validation of stored user data
- Automatic cleanup of corrupted data
- Type checking for required user properties
- Graceful handling of parsing errors

## Security Features

### 1. Token Security
- JWT tokens with configurable expiration (24 hours default)
- Automatic token refresh on near-expiration
- Secure storage in localStorage (with cleanup on errors)
- Bearer token authentication headers

### 2. Role-Based Access Control (RBAC)
- Hierarchical role system with clear permissions
- Route-level protection with role validation
- Component-level role checks where needed
- Automatic redirection to appropriate dashboards

### 3. Input Validation
- Email validation on login/registration
- Password strength requirements (8+ characters)
- Domain name validation for shop registration
- Real-time validation with user feedback

### 4. Error Handling
- Graceful degradation on authentication failures
- Comprehensive error logging and user feedback
- Automatic session cleanup on token corruption
- Protected against invalid user data injection

## API Integration

### Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - Standard registration
- `POST /api/auth/register/owner` - Owner registration
- `POST /api/auth/register/consignor` - Consignor registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset completion
- `GET /api/auth/validate-subdomain/{subdomain}` - Domain validation
- `GET /api/auth/validate-store-code/{code}` - Store code validation

### Response Formats
The API supports both direct and wrapped response formats:

**Direct Format:**
```typescript
{
  token: string,
  userId: string,
  email: string,
  role: number,
  organizationId: string,
  organizationName: string,
  expiresAt: string
}
```

**Wrapped Format:**
```typescript
{
  success: boolean,
  data: AuthResponse,
  message?: string,
  errors?: string[]
}
```

## Multi-tenancy Support

### Organization Scoping
- Each user belongs to an organization (shop)
- Organization ID included in user data
- API requests automatically scoped by organization
- Cross-organization data isolation

### Store Code System
- Unique codes for consignor registration
- Store code validation for organization association
- Regeneratable codes for security

## Social Authentication

### Supported Providers
- **Google OAuth**: Full implementation with profile completion flow
- **Facebook OAuth**: Full implementation with profile completion flow
- **Mock Implementations**: Development-time testing support

### Features
- Account linking for existing users
- New user registration via social providers
- Profile completion flow for incomplete social accounts
- Secure token exchange with backend

## Development Guidelines

### Adding New Authentication Features

1. **Update Models**: Add new interfaces to `auth.model.ts`
2. **Extend AuthService**: Add new methods with proper error handling
3. **Update Guards**: Modify role checks if needed
4. **Test Integration**: Ensure interceptor compatibility
5. **Document Changes**: Update this documentation

### Best Practices

1. **Always use AuthService**: Never directly manipulate localStorage
2. **Handle Errors Gracefully**: Provide user-friendly error messages
3. **Validate Input**: Client-side validation with server verification
4. **Log Security Events**: Comprehensive logging for debugging
5. **Test Role Access**: Verify guard behavior for all user types

### Testing Authentication

1. **Unit Tests**: Test AuthService methods in isolation
2. **Guard Tests**: Verify role-based access control
3. **Integration Tests**: Test full authentication flows
4. **E2E Tests**: Test user journeys across role types

## Troubleshooting

### Common Issues

1. **Token Expiration**: Check token refresh logic and expiration handling
2. **Role Access Denied**: Verify user role assignment and guard configuration
3. **LocalStorage Corruption**: Check data validation and cleanup logic
4. **API Integration**: Verify response format handling (wrapped vs direct)

### Debug Tools

1. **Console Logging**: Interceptor provides detailed request logging
2. **localStorage Inspection**: Check token and user data directly
3. **Network Tab**: Monitor authentication API calls
4. **Role Testing**: Use browser developer tools to modify user roles

## Future Enhancements

### Planned Features
- Two-factor authentication (2FA)
- Session management and concurrent login limits
- Advanced password policies
- Audit logging for authentication events
- Single sign-on (SSO) integration

### Security Improvements
- Token rotation strategies
- Rate limiting on authentication endpoints
- Advanced session monitoring
- Suspicious activity detection

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintainer**: Development Team