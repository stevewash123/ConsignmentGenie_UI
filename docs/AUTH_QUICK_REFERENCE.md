# Authentication System - Quick Reference

## Core Files to Know

```
src/app/
├── services/auth.service.ts           # Main auth service
├── models/auth.model.ts              # TypeScript interfaces
├── guards/                           # Route protection
│   ├── auth.guard.ts                 # Base authentication
│   ├── owner.guard.ts                # Owner area access
│   ├── admin.guard.ts                # Admin access
│   └── consignor.guard.ts            # Consignor access
├── interceptors/auth.interceptor.ts   # HTTP token handling
└── auth/                             # Auth components
    ├── login-simple.component.ts     # Login form
    ├── register-owner.component.ts   # Owner registration
    ├── forgot-password.component.ts  # Password reset
    └── reset-password.component.ts   # Password reset form
```

## Common Tasks

### Check if User is Logged In
```typescript
// In component
constructor(private authService: AuthService) {}

// Reactive approach
isLoggedIn$ = this.authService.isLoggedIn;

// Direct check
isUserLoggedIn(): boolean {
  return this.authService.isLoggedIn();
}
```

### Get Current User
```typescript
// Observable approach (recommended)
currentUser$ = this.authService.currentUser$;

// Direct access
getCurrentUser(): User | null {
  return this.authService.getCurrentUser();
}
```

### Protect Routes
```typescript
// In routing configuration
{
  path: 'owner',
  canActivate: [OwnerGuard],  // Owner/Admin only
  loadChildren: () => import('./owner/owner.routes')
}

// With specific roles
{
  path: 'admin-panel',
  canActivate: [AuthGuard],
  data: { roles: [UserRole.Admin] },  // Admin only
  component: AdminPanelComponent
}
```

### Login User
```typescript
login() {
  const request: LoginRequest = {
    email: this.email,
    password: this.password
  };

  this.authService.login(request).subscribe({
    next: (response) => {
      // User automatically logged in by service
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      this.errorMessage = error.message;
    }
  });
}
```

### Logout User
```typescript
logout() {
  this.authService.logout();
  this.router.navigate(['/login']);
}
```

### Check User Role
```typescript
// Get user role
getUserRole(): UserRole | null {
  const user = this.authService.getCurrentUser();
  return user ? user.role : null;
}

// Check if user has specific role
isOwner(): boolean {
  const user = this.authService.getCurrentUser();
  return user?.role === UserRole.Owner;
}

// Check if user can access owner features
canAccessOwnerFeatures(): boolean {
  const user = this.authService.getCurrentUser();
  return user?.role === UserRole.Owner || user?.role === UserRole.Admin;
}
```

## User Roles Reference

```typescript
enum UserRole {
  Admin = 0,      // Full system access
  Owner = 1,      // Shop owner/manager
  Consignor = 2,  // Consignor/Provider
  Customer = 3    // Customer/Shopper
}
```

### Role Access Matrix

| Feature Area | Admin | Owner | Consignor | Customer |
|-------------|-------|-------|-----------|----------|
| Admin Panel | ✅ | ❌ | ❌ | ❌ |
| Owner Dashboard | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Consignor Portal | ✅ | ✅ | ✅ | ❌ |
| Customer Store | ✅ | ✅ | ✅ | ✅ |

## LocalStorage Keys

```typescript
// Access tokens
'auth_token'      // JWT access token
'refreshToken'    // Token refresh credential
'tokenExpiry'     // Token expiration timestamp

// User data
'user_data'       // JSON user profile data
```

## API Endpoints

```typescript
// Authentication
POST /api/auth/login                    // User login
POST /api/auth/register                 // Basic registration
POST /api/auth/register/owner           // Owner registration
POST /api/auth/register/consignor       // Consignor registration
POST /api/auth/refresh                  // Token refresh
POST /api/auth/forgot-password          // Password reset request
POST /api/auth/reset-password           // Password reset completion

// Validation
GET /api/auth/validate-subdomain/{subdomain}  // Check domain availability
GET /api/auth/validate-store-code/{code}      // Validate store code
```

## Error Handling Patterns

### Login Errors
```typescript
this.authService.login(request).subscribe({
  next: (response) => {
    // Success - user is automatically logged in
    this.router.navigate([this.getRedirectUrl()]);
  },
  error: (error) => {
    // Handle different error types
    if (error.status === 401) {
      this.errorMessage = 'Invalid email or password';
    } else if (error.status === 423) {
      this.errorMessage = 'Account is locked';
    } else {
      this.errorMessage = 'Login failed. Please try again.';
    }
  }
});
```

### Token Expiration
```typescript
// Handled automatically by HTTP interceptor
// No manual intervention required
// User will be logged out and redirected on refresh failure
```

## Testing Helpers

### Mock User Data
```typescript
const mockOwner: User = {
  userId: 'test-owner-id',
  email: 'owner@test.com',
  role: UserRole.Owner,
  organizationId: 'test-org-id',
  organizationName: 'Test Shop'
};

const mockConsignor: User = {
  userId: 'test-consignor-id',
  email: 'consignor@test.com',
  role: UserRole.Consignor,
  organizationId: 'test-org-id',
  organizationName: 'Test Shop'
};
```

### Testing Guards
```typescript
// Test guard behavior
it('should allow owner access', () => {
  spyOn(localStorage, 'getItem').and.returnValue(
    JSON.stringify(mockOwner)
  );

  const result = guard.canActivate(mockRoute);
  expect(result).toBe(true);
});
```

## Development Tips

1. **Always use AuthService**: Never directly access localStorage
2. **Handle Loading States**: Show spinners during authentication
3. **Provide Clear Feedback**: Display helpful error messages
4. **Test All Roles**: Verify functionality for each user type
5. **Use Guards Consistently**: Protect all sensitive routes
6. **Monitor Network**: Check for authentication API calls
7. **Clear on Logout**: Ensure complete session cleanup

## Debugging

### Check Authentication Status
```javascript
// In browser console
localStorage.getItem('auth_token')     // Check token
localStorage.getItem('user_data')      // Check user data
JSON.parse(localStorage.getItem('user_data')).role  // Check user role
```

### Common Issues
- **403 Forbidden**: Check user role permissions
- **401 Unauthorized**: Token expired or invalid
- **Guard Redirects**: Verify role-based access rules
- **LocalStorage Corruption**: Clear browser storage and re-login