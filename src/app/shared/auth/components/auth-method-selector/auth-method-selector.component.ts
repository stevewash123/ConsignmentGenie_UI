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
  passwordConfirm: string;
}

@Component({
  selector: 'app-auth-method-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-method-selector.component.html',
  styleUrls: ['./auth-method-selector.component.scss']
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

  availableProviders = signal<AuthProvider[]>([]);

  ngOnInit() {
    this.updateAvailableProviders();
    if (this.prefilledEmail) {
      this.email = this.prefilledEmail;
      this.onCredentialsChange();
    }
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