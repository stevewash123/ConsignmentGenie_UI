# SocialAuthComponent Usage Guide

The `SocialAuthComponent` is a reusable Angular component that provides Google OAuth authentication for signup, login, and account linking scenarios.

## Component API

```typescript
@Component({
  selector: 'app-social-auth',
  // ...
})
export class SocialAuthComponent {
  @Input() mode: 'signup' | 'login' | 'link' = 'login';
  @Output() authSuccess = new EventEmitter<SocialAuthResult>();
  @Output() authError = new EventEmitter<string>();
}
```

## Usage Examples

### 1. Owner Signup Flow

```html
<!-- owner-signup-step1.component.html -->
<div class="signup-container">
  <h1>Create Your Shop Owner Account</h1>

  <!-- Social Auth Component -->
  <app-social-auth
    mode="signup"
    (authSuccess)="onSocialSignup($event)"
    (authError)="onSocialError($event)">
  </app-social-auth>

  <!-- Regular signup form below -->
  <form [formGroup]="signupForm" (ngSubmit)="onEmailSignup()">
    <!-- Email/password fields -->
  </form>
</div>
```

```typescript
// owner-signup-step1.component.ts
export class OwnerSignupStep1Component {
  onSocialSignup(result: SocialAuthResult) {
    if (result.isNewUser) {
      // New user - redirect to profile completion (Step 2)
      // Pre-fill name from Google profile
      this.router.navigate(['/signup/owner/profile'], {
        state: {
          socialAuth: result,
          prefilledName: result.name
        }
      });
    } else {
      // Existing user - prompt to login instead
      this.showExistingUserMessage(result.email);
    }
  }

  onSocialError(error: string) {
    this.toastr.error(error, 'Authentication Failed');
  }
}
```

### 2. Login Page

```html
<!-- login.component.html -->
<div class="login-container">
  <h1>Welcome Back</h1>

  <!-- Social Auth Component -->
  <app-social-auth
    mode="login"
    (authSuccess)="onSocialLogin($event)"
    (authError)="onSocialError($event)">
  </app-social-auth>

  <!-- Email/password login form -->
  <form [formGroup]="loginForm" (ngSubmit)="onEmailLogin()">
    <!-- Login fields -->
  </form>
</div>
```

```typescript
// login.component.ts
export class LoginComponent {
  onSocialLogin(result: SocialAuthResult) {
    if (result.isNewUser) {
      // New user trying to login - redirect to signup
      this.router.navigate(['/signup'], {
        state: { prefillEmail: result.email }
      });
    } else {
      // Existing user - redirect to appropriate dashboard
      this.redirectToDashboard();
    }
  }

  private redirectToDashboard() {
    const user = this.authService.getCurrentUser();
    switch (user?.role) {
      case 1: // Admin
        this.router.navigate(['/admin']);
        break;
      case 2: // Owner
        this.router.navigate(['/owner/dashboard']);
        break;
      case 3: // Consignor
        this.router.navigate(['/consignor']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}
```

### 3. Settings - Link Account

```html
<!-- account-settings.component.html -->
<div class="settings-section">
  <h2>Linked Accounts</h2>
  <p>Connect your social accounts for easier access.</p>

  <div class="linked-accounts">
    <div *ngIf="!hasGoogleLinked" class="account-link">
      <h3>Google Account</h3>
      <app-social-auth
        mode="link"
        (authSuccess)="onAccountLinked($event)"
        (authError)="onLinkError($event)">
      </app-social-auth>
    </div>

    <div *ngIf="hasGoogleLinked" class="account-linked">
      <h3>Google Account</h3>
      <p>✓ Connected: {{ linkedGoogleEmail }}</p>
      <button (click)="unlinkGoogle()" class="btn btn-outline">
        Unlink Account
      </button>
    </div>
  </div>
</div>
```

```typescript
// account-settings.component.ts
export class AccountSettingsComponent {
  hasGoogleLinked = false;
  linkedGoogleEmail = '';

  onAccountLinked(result: SocialAuthResult) {
    this.hasGoogleLinked = true;
    this.linkedGoogleEmail = result.email;
    this.toastr.success('Google account linked successfully!');
  }

  onLinkError(error: string) {
    this.toastr.error(error, 'Link Failed');
  }

  unlinkGoogle() {
    // Call API to unlink Google account
    this.authService.unlinkGoogleAccount().subscribe(() => {
      this.hasGoogleLinked = false;
      this.linkedGoogleEmail = '';
      this.toastr.success('Google account unlinked');
    });
  }
}
```

### 4. Consignor Signup

```html
<!-- consignor-signup-step1.component.html -->
<div class="consignor-signup">
  <h1>Join as a Consignor</h1>

  <app-social-auth
    mode="signup"
    (authSuccess)="onConsignorSocialSignup($event)"
    (authError)="onSocialError($event)">
  </app-social-auth>

  <!-- Invitation code form -->
  <form [formGroup]="invitationForm">
    <input placeholder="Invitation Code" formControlName="code">
  </form>
</div>
```

```typescript
// consignor-signup-step1.component.ts
export class ConsignorSignupStep1Component {
  onConsignorSocialSignup(result: SocialAuthResult) {
    // For consignors, we still need shop invitation validation
    if (result.isNewUser) {
      this.router.navigate(['/signup/consignor/details'], {
        state: {
          socialAuth: result,
          prefilledName: result.name,
          invitationCode: this.invitationForm.get('code')?.value
        }
      });
    } else {
      // Check if user is already a consignor elsewhere
      this.handleExistingConsignor(result);
    }
  }
}
```

## Event Handling

### SocialAuthResult Interface

```typescript
interface SocialAuthResult {
  provider: 'google' | 'facebook' | 'apple' | 'microsoft';
  email: string;
  name: string;
  providerId: string;  // Google user ID
  isNewUser: boolean;  // Determined by backend
}
```

### Error Handling

Common error scenarios:
- Google SDK failed to load
- User cancelled OAuth flow
- Network/backend errors
- Account already exists with different method

```typescript
onSocialError(error: string) {
  switch (error) {
    case 'Google authentication not loaded':
      this.showRetryOption();
      break;
    case 'Google authentication cancelled':
      // User closed popup - no action needed
      break;
    case 'Authentication failed. Please try again.':
      this.showGenericError();
      break;
    default:
      console.error('Unexpected auth error:', error);
      this.showGenericError();
  }
}
```

## Styling

The component uses Tailwind CSS classes. Key classes:
- `.social-auth-container` - Main container
- `.google-btn` - Google button styling
- `.facebook-btn` - Facebook button (disabled)
- `.divider` - Separator between social and email options

## Configuration

### Environment Setup

```typescript
// environment.ts
export const environment = {
  // ...
  googleClientId: 'your-actual-client-id.googleusercontent.com'
};
```

### Google Cloud Console Setup

1. Create OAuth 2.0 credentials
2. Add authorized origins:
   - `http://localhost:4200` (development)
   - `https://yourdomain.com` (production)
3. Add redirect URIs if needed

## Backend Integration

The component expects these API endpoints:

```typescript
// POST /api/auth/google
interface GoogleAuthRequest {
  idToken: string;      // JWT from Google
  mode: 'signup' | 'login' | 'link';
  email: string;
  name: string;
  providerId: string;   // Google user ID
}

// POST /api/auth/link/google
interface LinkGoogleRequest {
  idToken: string;
  email: string;
  name: string;
  providerId: string;
}
```

## Testing

Run component tests:
```bash
ng test --include="**/social-auth.component.spec.ts"
```

The test suite covers:
- Component initialization
- Mode-specific rendering
- Button interactions
- Event emissions
- Error handling scenarios

## Future Enhancements

1. **Facebook Integration** - Currently shows "Coming Soon"
2. **Apple Sign-In** - For iOS/macOS users
3. **Microsoft Authentication** - For enterprise users
4. **Loading States** - Visual feedback during auth flow
5. **Offline Detection** - Handle network connectivity issues