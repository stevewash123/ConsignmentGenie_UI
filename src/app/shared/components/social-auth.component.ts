import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthRequest } from '../../models/auth.model';

export interface SocialAuthResult {
  provider: 'google' | 'facebook' | 'apple' | 'microsoft';
  email: string;
  name: string;
  providerId: string;
  isNewUser: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-social-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-auth.component.html',
  styleUrls: ['./social-auth.component.css']
})
export class SocialAuthComponent implements OnInit {
  @Input() mode: 'signup' | 'login' | 'link' = 'login';
  @Output() authSuccess = new EventEmitter<SocialAuthResult>();
  @Output() authError = new EventEmitter<string>();

  private isGoogleLoaded = false;
  private authService = inject(AuthService);

  ngOnInit() {
    this.loadGoogleScript();
  }

  private loadGoogleScript() {
    if (window.google) {
      this.initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => this.initializeGoogle();
    script.onerror = () => this.authError.emit('Failed to load Google authentication');
    document.head.appendChild(script);
  }

  private initializeGoogle() {
    if (!window.google) {
      this.authError.emit('Google authentication not available');
      return;
    }

    const clientId = environment.googleClientId;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => this.handleGoogleResponse(response),
      auto_select: false,
      cancel_on_tap_outside: true
    });

    this.isGoogleLoaded = true;
  }

  private handleGoogleResponse(response: any) {
    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      const authResult: SocialAuthResult = {
        provider: 'google',
        email: payload.email,
        name: payload.name,
        providerId: payload.sub,
        isNewUser: false // This will be determined by the backend
      };

      // Mock backend call for now
      this.mockBackendAuth(authResult);

    } catch (error) {
      this.authError.emit('Failed to process Google authentication');
    }
  }

  private mockBackendAuth(authResult: SocialAuthResult) {
    // Use AuthService for backend integration
    const request: GoogleAuthRequest = {
      idToken: 'mock-id-token', // In real implementation, this would be the JWT from Google
      mode: this.mode,
      email: authResult.email,
      name: authResult.name,
      providerId: authResult.providerId
    };

    // Use mock implementation for development
    this.authService.mockGoogleAuth(request).subscribe({
      next: (response) => {
        const result: SocialAuthResult = {
          ...authResult,
          isNewUser: response.isNewUser
        };
        this.authSuccess.emit(result);
      },
      error: (error) => {
        console.error('Google auth error:', error);
        this.authError.emit('Authentication failed. Please try again.');
      }
    });
  }

  loginWithGoogle() {
    if (!this.isGoogleLoaded) {
      this.authError.emit('Google authentication not loaded');
      return;
    }

    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to popup
        this.showGooglePopup();
      }
    });
  }

  private showGooglePopup() {
    const clientId = environment.googleClientId;

    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile',
      callback: (response: any) => {
        if (response.access_token) {
          this.fetchGoogleProfile(response.access_token);
        } else {
          this.authError.emit('Google authentication cancelled');
        }
      }
    }).requestAccessToken();
  }

  private fetchGoogleProfile(accessToken: string) {
    fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
      .then(response => response.json())
      .then(profile => {
        const authResult: SocialAuthResult = {
          provider: 'google',
          email: profile.email,
          name: profile.name,
          providerId: profile.id,
          isNewUser: false
        };

        this.mockBackendAuth(authResult);
      })
      .catch(() => {
        this.authError.emit('Failed to fetch Google profile');
      });
  }

  loginWithFacebook() {
    // Facebook implementation will be added later
    this.authError.emit('Facebook authentication not yet implemented');
  }

  getModeText(): string {
    switch (this.mode) {
      case 'signup': return 'Sign up';
      case 'login': return 'Sign in';
      case 'link': return 'Link account';
      default: return 'Sign in';
    }
  }
}