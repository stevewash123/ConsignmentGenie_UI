import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

declare global {
  interface Window {
    google: any;
    gapi: any;
    AppleID: any;
  }
}

export interface SocialAuthResult {
  provider: 'google' | 'apple' | 'twitter';
  token: string;
  email: string;
  name: string;
  providerId: string;
  additionalData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SocialAuthService {
  private googleClientId = ''; // Configure in environment
  private isGoogleSDKLoaded = false;
  private isAppleSDKLoaded = false;

  constructor() {
    this.loadGoogleSDK();
    this.loadAppleSDK();
  }

  private loadGoogleSDK(): void {
    if (typeof window !== 'undefined' && !this.isGoogleSDKLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.isGoogleSDKLoaded = true;
        this.initializeGoogle();
      };
      document.head.appendChild(script);
    }
  }

  private loadAppleSDK(): void {
    if (typeof window !== 'undefined' && !this.isAppleSDKLoaded) {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.onload = () => {
        this.isAppleSDKLoaded = true;
        this.initializeApple();
      };
      document.head.appendChild(script);
    }
  }

  private initializeGoogle(): void {
    if (window.google && this.googleClientId) {
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: this.handleGoogleResponse.bind(this)
      });
    }
  }

  private initializeApple(): void {
    if (window.AppleID) {
      window.AppleID.auth.init({
        clientId: 'your.apple.service.id', // Configure in environment
        scope: 'name email',
        redirectURI: window.location.origin + '/auth/apple/callback',
        state: 'signup'
      });
    }
  }

  // Google OAuth implementation using Google Identity Services
  signInWithGoogle(): Observable<SocialAuthResult> {
    return new Observable(observer => {
      if (!this.isGoogleSDKLoaded || !window.google) {
        observer.error('Google SDK not loaded');
        return;
      }

      // Use Google One Tap or popup
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to popup
          this.googlePopupSignIn().subscribe({
            next: result => observer.next(result),
            error: err => observer.error(err)
          });
        }
      });

      // Set timeout for user response
      setTimeout(() => {
        observer.error('Google sign-in timeout');
      }, 60000);
    });
  }

  private googlePopupSignIn(): Observable<SocialAuthResult> {
    return new Observable(observer => {
      if (!window.google) {
        observer.error('Google SDK not available');
        return;
      }

      // Create a temporary callback for popup
      const callback = (response: any) => {
        try {
          const result = this.parseGoogleCredential(response.credential);
          observer.next(result);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      };

      // Show Google account selection popup
      window.google.accounts.id.renderButton(
        document.createElement('div'),
        {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          width: 250
        }
      );

      // Alternative: Use direct popup
      this.showGooglePopup().then(result => {
        observer.next(result);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  private async showGooglePopup(): Promise<SocialAuthResult> {
    return new Promise((resolve, reject) => {
      // Mock implementation for development
      // In production, you'd implement the actual Google popup flow
      console.log('Google popup sign-in initiated');

      // Simulate successful Google auth for development
      setTimeout(() => {
        const mockResult: SocialAuthResult = {
          provider: 'google',
          token: 'mock-google-token-' + Date.now(),
          email: 'user@gmail.com',
          name: 'Google User',
          providerId: 'google-' + Date.now(),
          additionalData: {
            picture: 'https://via.placeholder.com/100',
            given_name: 'Google',
            family_name: 'User'
          }
        };
        resolve(mockResult);
      }, 1500);
    });
  }

  private handleGoogleResponse(response: any): void {
    // This is called by Google's callback
    console.log('Google response received:', response);
  }

  private parseGoogleCredential(credential: string): SocialAuthResult {
    // Parse the JWT token from Google
    const payload = JSON.parse(atob(credential.split('.')[1]));

    return {
      provider: 'google',
      token: credential,
      email: payload.email,
      name: payload.name,
      providerId: payload.sub,
      additionalData: {
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name
      }
    };
  }

  // Apple OAuth implementation
  signInWithApple(): Observable<SocialAuthResult> {
    return new Observable(observer => {
      if (!this.isAppleSDKLoaded || !window.AppleID) {
        observer.error('Apple SDK not loaded');
        return;
      }

      // Mock implementation for development
      console.log('Apple sign-in initiated');

      // Simulate Apple auth flow
      setTimeout(() => {
        const mockResult: SocialAuthResult = {
          provider: 'apple',
          token: 'mock-apple-token-' + Date.now(),
          email: 'user@privaterelay.appleid.com',
          name: 'Apple User',
          providerId: 'apple-' + Date.now(),
          additionalData: {
            authorizationCode: 'mock-auth-code'
          }
        };
        observer.next(mockResult);
        observer.complete();
      }, 1500);

      // In production, use:
      // window.AppleID.auth.signIn().then(result => {
      //   const authResult = this.parseAppleResponse(result);
      //   observer.next(authResult);
      //   observer.complete();
      // }).catch(error => {
      //   observer.error(error);
      // });
    });
  }

  private parseAppleResponse(response: any): SocialAuthResult {
    return {
      provider: 'apple',
      token: response.authorization.id_token,
      email: response.user?.email || '',
      name: response.user?.name ? `${response.user.name.firstName} ${response.user.name.lastName}` : '',
      providerId: response.authorization.code,
      additionalData: {
        authorizationCode: response.authorization.code
      }
    };
  }

  // Twitter OAuth implementation (requires backend OAuth flow)
  signInWithTwitter(): Observable<SocialAuthResult> {
    return new Observable(observer => {
      console.log('Twitter sign-in initiated');

      // Twitter requires OAuth 1.0a or 2.0 flow that must be handled by the backend
      // For development, provide a mock implementation
      setTimeout(() => {
        const mockResult: SocialAuthResult = {
          provider: 'twitter',
          token: 'mock-twitter-token-' + Date.now(),
          email: 'user@twitter.com',
          name: 'Twitter User',
          providerId: 'twitter-' + Date.now(),
          additionalData: {
            username: 'twitteruser',
            accessTokenSecret: 'mock-secret'
          }
        };
        observer.next(mockResult);
        observer.complete();
      }, 1500);

      // In production, you'd redirect to backend OAuth endpoint:
      // window.location.href = '/api/auth/twitter?mode=signup';
    });
  }

  // Helper method to check if a provider is available
  isProviderAvailable(provider: 'google' | 'apple' | 'twitter'): boolean {
    switch (provider) {
      case 'google':
        return this.isGoogleSDKLoaded && !!window.google;
      case 'apple':
        return this.isAppleSDKLoaded && !!window.AppleID;
      case 'twitter':
        return true; // Twitter auth is handled by backend redirect
      default:
        return false;
    }
  }

  // Configure client IDs (should be called from environment config)
  configureProviders(config: {
    googleClientId?: string;
    appleClientId?: string;
  }): void {
    if (config.googleClientId) {
      this.googleClientId = config.googleClientId;
      if (this.isGoogleSDKLoaded) {
        this.initializeGoogle();
      }
    }
  }
}