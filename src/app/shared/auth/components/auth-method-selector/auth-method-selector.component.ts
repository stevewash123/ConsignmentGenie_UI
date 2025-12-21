import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthProvider, getEnabledconsignors, getProviderById } from '../../config/auth-providers.config';

export interface ProviderAuthEvent {
  consignor: string;
}

export interface CredentialsEvent {
  email: string;
  password: string;
  passwordConfirm: string;
}

@Component({
  selector: 'app-auth-method-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-method-selector.component.html',
  styles: [`
    .auth-method-selector {
      width: 100%;
      max-width: 400px;
    }

    .oauth-consignors {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .consignor-button {
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

    .consignor-button:hover:not(:disabled) {
      border-color: #9ca3af;
      background-color: #f9fafb;
    }

    .consignor-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .consignor-icon {
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

    .consignor-google .consignor-icon {
      background: #db4437;
    }

    .consignor-facebook .consignor-icon {
      background: #1877f2;
    }

    .consignor-text {
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

    .form-input.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-text {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    @media (max-width: 480px) {
      .consignor-button {
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }

      .consignor-text {
        font-size: 0.875rem;
      }
    }
  `]
})
export class AuthMethodSelectorComponent {
  @Input() enabledProviders: string[] = ['google', 'facebook'];
  @Input() showEmailPassword: boolean = true;
  @Input() isLoading = signal(false);
  @Input() prefilledEmail: string = '';
  @Input() emailReadonly: boolean = false;

  @Output() onProviderAuth = new EventEmitter<ProviderAuthEvent>();
  @Output() onCredentials = new EventEmitter<CredentialsEvent>();

  email = '';
  password = '';
  passwordConfirm = '';

  availableconsignors = signal<AuthProvider[]>([]);

  ngOnInit() {
    this.updateAvailableconsignors();
    if (this.prefilledEmail) {
      this.email = this.prefilledEmail;
      this.onCredentialsChange();
    }
  }

  ngOnChanges() {
    this.updateAvailableconsignors();
  }

  private updateAvailableconsignors() {
    const enabledProviders = getEnabledconsignors();
    const filteredconsignors = enabledProviders.filter(consignor =>
      this.enabledProviders.includes(consignor.id)
    );
    this.availableconsignors.set(filteredconsignors);
  }

  handleProviderAuth(providerId: string) {
    if (this.isLoading()) return;

    this.onProviderAuth.emit({ consignor: providerId });
  }

  onCredentialsChange() {
    if (this.email && this.password && this.passwordConfirm) {
      this.onCredentials.emit({
        email: this.email,
        password: this.password,
        passwordConfirm: this.passwordConfirm
      });
    }
  }

  get passwordsMatch(): boolean {
    return this.password === this.passwordConfirm || !this.passwordConfirm;
  }
}