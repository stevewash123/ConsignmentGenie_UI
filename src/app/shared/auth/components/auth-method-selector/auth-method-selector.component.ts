import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthProvider, getEnabledProviders, getProviderById } from '../../config/auth-providers.config';

export interface ProviderAuthEvent {
  provider: string;
}

export interface CredentialsEvent {
  email: string;
  password: string;
}

@Component({
  selector: 'app-auth-method-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-method-selector">
      <!-- OAuth Providers -->
      <div class="oauth-providers" *ngIf="availableProviders().length > 0">
        <button
          *ngFor="let provider of availableProviders()"
          type="button"
          class="provider-button"
          [class]="'provider-' + provider.id"
          (click)="handleProviderAuth(provider.id)"
          [disabled]="isLoading()">
          <span class="provider-icon">{{ provider.icon }}</span>
          <span class="provider-text">Continue with {{ provider.name }}</span>
        </button>
      </div>

      <!-- Divider (only shown if both OAuth and email/password are available) -->
      <div class="auth-divider" *ngIf="availableProviders().length > 0 && showEmailPassword">
        <hr class="divider-line">
        <span class="divider-text">or</span>
        <hr class="divider-line">
      </div>

      <!-- Email/Password Section -->
      <div class="email-password-section" *ngIf="showEmailPassword">
        <div class="form-group">
          <label for="auth-email">Email</label>
          <input
            type="email"
            id="auth-email"
            class="form-input"
            placeholder="Enter your email"
            [(ngModel)]="email"
            (input)="onCredentialsChange()"
            [disabled]="isLoading()">
        </div>

        <div class="form-group">
          <label for="auth-password">Password</label>
          <input
            type="password"
            id="auth-password"
            class="form-input"
            placeholder="Enter your password"
            [(ngModel)]="password"
            (input)="onCredentialsChange()"
            [disabled]="isLoading()">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-method-selector {
      width: 100%;
      max-width: 400px;
    }

    .oauth-providers {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .provider-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.875rem 1.5rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #374151;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 48px;
    }

    .provider-button:hover:not(:disabled) {
      border-color: #9ca3af;
      background-color: #f9fafb;
    }

    .provider-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .provider-icon {
      font-weight: 700;
      font-size: 1.1rem;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
    }

    .provider-google .provider-icon {
      background: #db4437;
    }

    .provider-facebook .provider-icon {
      background: #1877f2;
    }

    .provider-text {
      flex: 1;
      text-align: center;
    }

    .auth-divider {
      display: flex;
      align-items: center;
      margin: 1.5rem 0;
      gap: 1rem;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      border: none;
      background: #e5e7eb;
    }

    .divider-text {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0 0.5rem;
    }

    .email-password-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input:disabled {
      background-color: #f9fafb;
      cursor: not-allowed;
    }

    .form-input::placeholder {
      color: #9ca3af;
    }

    @media (max-width: 480px) {
      .provider-button {
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }

      .provider-text {
        font-size: 0.875rem;
      }
    }
  `]
})
export class AuthMethodSelectorComponent {
  @Input() enabledProviders: string[] = ['google', 'facebook'];
  @Input() showEmailPassword: boolean = true;
  @Input() isLoading = signal(false);

  @Output() onProviderAuth = new EventEmitter<ProviderAuthEvent>();
  @Output() onCredentials = new EventEmitter<CredentialsEvent>();

  email = '';
  password = '';

  availableProviders = signal<AuthProvider[]>([]);

  ngOnInit() {
    this.updateAvailableProviders();
  }

  ngOnChanges() {
    this.updateAvailableProviders();
  }

  private updateAvailableProviders() {
    const enabledProviders = getEnabledProviders();
    const filteredProviders = enabledProviders.filter(provider =>
      this.enabledProviders.includes(provider.id)
    );
    this.availableProviders.set(filteredProviders);
  }

  handleProviderAuth(providerId: string) {
    if (this.isLoading()) return;

    this.onProviderAuth.emit({ provider: providerId });
  }

  onCredentialsChange() {
    if (this.email && this.password) {
      this.onCredentials.emit({
        email: this.email,
        password: this.password
      });
    }
  }
}