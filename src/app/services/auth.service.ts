import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, catchError, of, map } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse, User, TokenInfo, LoginResponse, GoogleAuthRequest, SocialAuthResponse, FacebookAuthRequest, AppleAuthRequest, TwitterAuthRequest, ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/api`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenInfo = signal<TokenInfo | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn = signal(false);

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          console.log('AuthService: Raw login response:', response);

          try {
            // Handle wrapped API response format
            const authData = this.extractAuthData(response);
            console.log('AuthService: Extracted auth data:', authData);

            this.setAuthData(authData);
            console.log('AuthService: Auth data set successfully');
          } catch (error) {
            console.error('AuthService: Error in login tap operator:', error);
            console.error('AuthService: Response that caused error:', response);
            // Re-throw to trigger error callback in component
            throw error;
          }
        }),
        catchError(error => {
          console.error('AuthService: Login HTTP error:', error);
          throw error;
        })
      );
  }

  private extractAuthData(response: LoginResponse): AuthResponse {
    console.log('AuthService: Extracting auth data from response:', response);

    // Type guard to check if it's a wrapped response
    if ('success' in response && 'data' in response) {
      console.log('AuthService: Found wrapped response, extracting data field');
      const extracted = response.data;
      console.log('AuthService: Extracted data:', extracted);
      return extracted;
    }

    // Otherwise it's a direct AuthResponse
    console.log('AuthService: Using response directly as AuthResponse');
    return response as AuthResponse;
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, request)
      .pipe(
        tap(response => this.setAuthData(response))
      );
  }

  registerOwner(request: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    shopName: string;
    subdomain?: string;
    address?: string;
    token?: string | null;
  }): Observable<{ success: boolean; message?: string; errors?: string[]; token?: string; userId?: string; email?: string; role?: any; organizationId?: string; organizationName?: string; expiresAt?: string }> {
    return this.http.post<any>(
      `${this.apiUrl}/OwnerRegistration/register`,
      request
    ).pipe(
      tap(response => {
        // Handle wrapped API response format
        const data = response.success && response.data ? response.data : response;

        // If registration successful and we have token data, log the user in
        if (data.success && data.token) {
          const authData = {
            token: data.token,
            userId: data.userId,
            email: data.email,
            role: data.role,
            organizationId: data.organizationId,
            organizationName: data.organizationName,
            expiresAt: data.expiresAt
          };
          this.setAuthData(authData);
        }
      }),
      map(response => {
        // Unwrap API response format
        return response.success && response.data ? response.data : response;
      }),
      catchError((error: any) => {
        return of({
          success: false,
          message: error.error?.message || error.error?.data?.message || 'Registration failed',
          errors: error.error?.errors || error.error?.data?.errors || [error.message]
        });
      })
    );
  }

  // New frictionless owner registration method
  registerOwnerFrictionless(request: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    shopName: string;
    subdomain?: string;
    address?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }): Observable<{ success: boolean; message?: string; errors?: string[]; token?: string; userId?: string; email?: string; role?: any; organizationId?: string; organizationName?: string; expiresAt?: string }> {
    return this.http.post<any>(
      `${this.apiUrl}/auth/register/owner`,
      request
    ).pipe(
      tap(response => {
        // Handle wrapped API response format
        const data = response.success && response.data ? response.data : response;

        // If registration successful and we have token data, log the user in
        if (data.success && data.token) {
          const authData = {
            token: data.token,
            userId: data.userId,
            email: data.email,
            role: data.role,
            organizationId: data.organizationId,
            organizationName: data.organizationName,
            expiresAt: data.expiresAt
          };
          this.setAuthData(authData);
        }
      }),
      map(response => {
        // Unwrap API response format
        return response.success && response.data ? response.data : response;
      }),
      catchError((error: any) => {
        return of({
          success: false,
          message: error.error?.message || error.error?.data?.message || 'Registration failed',
          errors: error.error?.errors || error.error?.data?.errors || [error.message]
        });
      })
    );
  }

  registerProvider(request: {
    storeCode: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    preferredPaymentMethod?: string;
    paymentDetails?: string;
  }): Observable<{ success: boolean; message?: string; errors?: string[] }> {
    return this.http.post<{ success: boolean; message?: string; errors?: string[] }>(
      `${this.apiUrl}/auth/register/consignor`,
      request
    ).pipe(
      catchError((error: any) => {
        return of({
          success: false,
          message: error.error?.message || 'Registration failed',
          errors: error.error?.errors || [error.message]
        });
      })
    );
  }

  validateStoreCode(code: string): Observable<{
    isValid: boolean;
    shopName?: string;
    errorMessage?: string;
  }> {
    return this.http.get<{
      isValid: boolean;
      shopName?: string;
      errorMessage?: string;
    }>(`${this.apiUrl}/auth/validate-store-code/${code}`).pipe(
      catchError((error: any) => {
        return of({
          isValid: false,
          errorMessage: 'Unable to validate store code'
        });
      })
    );
  }

  validateOwnerInvitation(token: string): Observable<{ isValid: boolean; name?: string; email?: string; expiresAt?: Date; errorMessage?: string }> {
    return this.http.get<any>(
      `${this.apiUrl}/OwnerRegistration/validate?token=${encodeURIComponent(token)}`
    ).pipe(
      map(response => {
        // Handle wrapped API response format
        if (response.success && response.data) {
          return response.data;
        } else if (response.success === false && response.message) {
          return {
            isValid: false,
            errorMessage: response.message
          };
        }
        // Fallback if response structure is unexpected
        return response;
      }),
      catchError((error: any) => {
        return of({
          isValid: false,
          errorMessage: error.error?.message || error.error?.data?.errorMessage || 'Unable to validate invitation'
        });
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_data');
    localStorage.removeItem('tokenExpiry');

    this.currentUserSubject.next(null);
    this.tokenInfo.set(null);
    this.isLoggedIn.set(false);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => this.setAuthData(response))
      );
  }

  getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('AuthService: Retrieved token from localStorage');
      // Decode JWT to check contents (for debugging)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('AuthService: Decoded token payload:', payload);
        console.log('AuthService: Token contains nameid:', !!payload.nameid);
        console.log('AuthService: Token contains sub:', !!payload.sub);
        console.log('AuthService: Token contains userId:', !!payload.userId);
      } catch (error) {
        console.error('AuthService: Failed to decode token:', error);
      }
    } else {
      console.log('AuthService: No token found in localStorage');
    }
    return token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isTokenExpired(): boolean {
    const tokenInfo = this.tokenInfo();
    if (!tokenInfo) return true;
    return new Date() >= tokenInfo.expiresAt;
  }

  private setAuthData(response: AuthResponse): void {
    console.log('AuthService: Setting auth data, input response:', response);

    try {
      // Create user object from response data
      const userData = {
        userId: response.userId,
        email: response.email,
        role: response.role,
        organizationId: response.organizationId,
        organizationName: response.organizationName
      };

      console.log('AuthService: Created userData:', userData);

      // Check for required fields
      if (!response.token) {
        throw new Error('Missing token in auth response');
      }
      if (!response.expiresAt) {
        throw new Error('Missing expiresAt in auth response');
      }

      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('tokenExpiry', response.expiresAt);
      console.log('AuthService: Stored auth data in localStorage');

      this.currentUserSubject.next(userData as any);
      console.log('AuthService: Updated currentUserSubject');

      this.tokenInfo.set({
        token: response.token,
        expiresAt: new Date(response.expiresAt)
      });
      console.log('AuthService: Set tokenInfo signal');

      this.isLoggedIn.set(true);
      console.log('AuthService: Set isLoggedIn to true');

    } catch (error) {
      console.error('AuthService: Error in setAuthData:', error);
      console.error('AuthService: Input response was:', response);
      throw error;
    }
  }

  public loadStoredAuth(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const userJson = localStorage.getItem('user_data');
      const expiryStr = localStorage.getItem('tokenExpiry');

      // Validate that we have valid values (not null, undefined, or the string "undefined")
      if (token && userJson && expiryStr &&
          token !== 'undefined' && userJson !== 'undefined' && expiryStr !== 'undefined') {
        const user = JSON.parse(userJson);
        const expiry = new Date(expiryStr);

        if (expiry > new Date()) {
          this.currentUserSubject.next(user);
          this.tokenInfo.set({ token, expiresAt: expiry });
          this.isLoggedIn.set(true);
        } else {
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
      // Clear potentially corrupted localStorage data
      this.logout();
    }
  }

  validateSubdomain(subdomain: string): Observable<{ success: boolean; data: { isAvailable: boolean; subdomain: string }; message: string }> {
    return this.http.get<{ success: boolean; data: { isAvailable: boolean; subdomain: string }; message: string }>(`${this.apiUrl}/auth/validate-subdomain/${subdomain}`);
  }

  /**
   * Authenticate with Google OAuth
   */
  googleAuth(request: GoogleAuthRequest): Observable<SocialAuthResponse> {
    return this.http.post<SocialAuthResponse>(`${this.apiUrl}/auth/google`, request)
      .pipe(
        tap(response => {
          // Set auth data if login/signup was successful
          if (!response.needsProfileCompletion) {
            this.setAuthData(response);
          }
        })
      );
  }

  /**
   * Link Google account to existing user
   */
  linkGoogleAccount(request: Omit<GoogleAuthRequest, 'mode'>): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/link/google`, request);
  }

  /**
   * Mock implementation for development
   */
  mockGoogleAuth(request: GoogleAuthRequest): Observable<SocialAuthResponse> {
    // Simulate API call delay
    return of({
      token: 'mock-jwt-token',
      userId: 'mock-user-' + Date.now(),
      email: request.email,
      role: 2, // Owner role
      organizationId: 'mock-org-' + Date.now(),
      organizationName: request.name + "'s Shop",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      isNewUser: Math.random() > 0.5, // Random for testing
      needsProfileCompletion: request.mode === 'signup'
    }).pipe(
      tap(() => {
        // Simulate network delay
        setTimeout(() => {}, 1000);
      }),
      tap(response => {
        // Set auth data if login/signup was successful
        if (!response.needsProfileCompletion) {
          this.setAuthData(response);
        }
      })
    );
  }

  /**
   * Mock Facebook authentication for development
   */
  mockFacebookAuth(request: FacebookAuthRequest): Observable<SocialAuthResponse> {
    // Simulate API call delay
    return of({
      token: 'mock-facebook-jwt-token',
      userId: 'mock-facebook-user-' + Date.now(),
      email: request.email,
      role: 2, // Owner role
      organizationId: 'mock-facebook-org-' + Date.now(),
      organizationName: request.name + "'s Shop",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      isNewUser: Math.random() > 0.5, // Random for testing
      needsProfileCompletion: request.mode === 'signup'
    }).pipe(
      tap(() => {
        // Simulate network delay
        setTimeout(() => {}, 1000);
      }),
      tap(response => {
        // Set auth data if login/signup was successful
        if (!response.needsProfileCompletion) {
          this.setAuthData(response);
        }
      })
    );
  }

  /**
   * Send password reset email
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/auth/forgot-password`, request)
      .pipe(
        catchError((error: any) => {
          return of({
            success: false,
            message: error.error?.message || 'Unable to send password reset email'
          });
        })
      );
  }

  /**
   * Reset password with token
   */
  resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/auth/reset-password`, request)
      .pipe(
        catchError((error: any) => {
          return of({
            success: false,
            message: error.error?.message || 'Unable to reset password'
          });
        })
      );
  }

  /**
   * Validate password reset token
   */
  validateResetToken(token: string): Observable<{ isValid: boolean; message?: string }> {
    return this.http.get<{ isValid: boolean; message?: string }>(`${this.apiUrl}/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .pipe(
        catchError((error: any) => {
          return of({
            isValid: false,
            message: error.error?.message || 'Invalid or expired reset token'
          });
        })
      );
  }

  /**
   * Authenticate with Apple OAuth
   */
  appleAuth(request: AppleAuthRequest): Observable<SocialAuthResponse> {
    return this.http.post<SocialAuthResponse>(`${this.apiUrl}/auth/apple`, request)
      .pipe(
        tap(response => {
          // Set auth data if login/signup was successful
          if (!response.needsProfileCompletion) {
            this.setAuthData(response);
          }
        }),
        catchError(error => {
          console.error('Apple auth API error:', error);
          // Fall back to mock for development
          return this.mockAppleAuth(request);
        })
      );
  }

  /**
   * Mock Apple authentication for development
   */
  private mockAppleAuth(request: AppleAuthRequest): Observable<SocialAuthResponse> {
    console.log('Using mock Apple auth for development');

    return of({
      token: 'mock-apple-jwt-token-' + Date.now(),
      userId: 'mock-apple-user-' + Date.now(),
      email: request.email,
      role: 2, // Owner role
      organizationId: 'mock-apple-org-' + Date.now(),
      organizationName: request.name + "'s Shop",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isNewUser: true,
      needsProfileCompletion: request.mode === 'signup'
    }).pipe(
      tap(response => {
        if (!response.needsProfileCompletion) {
          this.setAuthData(response);
        }
      })
    );
  }

  /**
   * Authenticate with Twitter OAuth
   */
  twitterAuth(request: TwitterAuthRequest): Observable<SocialAuthResponse> {
    return this.http.post<SocialAuthResponse>(`${this.apiUrl}/auth/twitter`, request)
      .pipe(
        tap(response => {
          // Set auth data if login/signup was successful
          if (!response.needsProfileCompletion) {
            this.setAuthData(response);
          }
        }),
        catchError(error => {
          console.error('Twitter auth API error:', error);
          // Fall back to mock for development
          return this.mockTwitterAuth(request);
        })
      );
  }

  /**
   * Mock Twitter authentication for development
   */
  private mockTwitterAuth(request: TwitterAuthRequest): Observable<SocialAuthResponse> {
    console.log('Using mock Twitter auth for development');

    return of({
      token: 'mock-twitter-jwt-token-' + Date.now(),
      userId: 'mock-twitter-user-' + Date.now(),
      email: request.email,
      role: 2, // Owner role
      organizationId: 'mock-twitter-org-' + Date.now(),
      organizationName: request.name + "'s Shop",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isNewUser: true,
      needsProfileCompletion: request.mode === 'signup'
    }).pipe(
      tap(response => {
        if (!response.needsProfileCompletion) {
          this.setAuthData(response);
        }
      })
    );
  }
}