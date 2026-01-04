import { Component, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthProvider, getProviderById } from '../../config/auth-providers.config';

export interface LinkedProvider {
  id: string;
  name: string;
  email?: string;
  connected: boolean;
  connectedAt?: Date;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActivity: Date;
  isCurrent: boolean;
}

export interface TwoFactorStatus {
  enabled: boolean;
  setupAt?: Date;
  backupCodes?: number;
}

export interface SecuritySettings {
  linkedconsignors: LinkedProvider[];
  activeSessions: ActiveSession[];
  twoFactorAuth: TwoFactorStatus;
  hasEmailPassword: boolean;
  email?: string;
}

@Component({
  selector: 'app-account-security',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-security.component.html',
  styleUrls: ['./account-security.component.scss']
})
export class AccountSecurityComponent implements OnInit {
  @Input() userId!: string;
  @Input() enabledProviders: string[] = ['google', 'facebook'];
  @Input() show2FA: boolean = true;
  @Input() showActiveSessions: boolean = true;

  securityData = signal<SecuritySettings | null>(null);
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor() {}

  ngOnInit() {
    this.loadSecuritySettings();
  }

  async loadSecuritySettings() {
    try {
      // Mock data for now - replace with actual API call
      const mockData: SecuritySettings = {
        linkedconsignors: [
          { id: 'google', name: 'Google', email: 'user@gmail.com', connected: true, connectedAt: new Date() },
          { id: 'facebook', name: 'Facebook', connected: false }
        ],
        activeSessions: [
          { id: '1', device: 'Chrome on Windows', location: 'Austin, TX', lastActivity: new Date(), isCurrent: true },
          { id: '2', device: 'iPhone App', location: 'Austin, TX', lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), isCurrent: false },
          { id: '3', device: 'Chrome on Mac', location: 'Dallas, TX', lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), isCurrent: false }
        ],
        twoFactorAuth: { enabled: false },
        hasEmailPassword: true,
        email: 'user@example.com'
      };

      this.securityData.set(mockData);
    } catch (error) {
      this.showError('Failed to load security settings');
    }
  }

  getProviderIcon(providerId: string): string {
    const consignor = getProviderById(providerId);
    return consignor?.icon || '?';
  }

  getSessionTimeText(lastActivity: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours === 0) return 'Now';
    if (diffHours < 24) return `${diffHours} hrs ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  hasOtherSessions(): boolean {
    const sessions = this.securityData()?.activeSessions || [];
    return sessions.some(session => !session.isCurrent);
  }

  async connectProvider(providerId: string) {
    this.isLoading.set(true);
    try {
      // TODO: Implement OAuth flow
      this.showSuccess(`${providerId} connection initiated`);
    } catch (error) {
      this.showError('Failed to connect consignor');
    } finally {
      this.isLoading.set(false);
    }
  }

  async disconnectProvider(providerId: string) {
    if (!confirm('Are you sure you want to disconnect this sign-in method?')) return;

    this.isLoading.set(true);
    try {
      // TODO: Implement disconnect
      this.showSuccess(`${providerId} disconnected`);
      await this.loadSecuritySettings();
    } catch (error) {
      this.showError('Failed to disconnect consignor');
    } finally {
      this.isLoading.set(false);
    }
  }

  async changePassword() {
    // TODO: Open change password modal
    this.showSuccess('Password change functionality not yet implemented');
  }

  async enable2FA() {
    this.isLoading.set(true);
    try {
      // TODO: Implement 2FA setup
      this.showSuccess('2FA setup initiated');
    } catch (error) {
      this.showError('Failed to enable 2FA');
    } finally {
      this.isLoading.set(false);
    }
  }

  async disable2FA() {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;

    this.isLoading.set(true);
    try {
      // TODO: Implement 2FA disable
      this.showSuccess('2FA disabled');
      await this.loadSecuritySettings();
    } catch (error) {
      this.showError('Failed to disable 2FA');
    } finally {
      this.isLoading.set(false);
    }
  }

  async manageTwoFA() {
    // TODO: Open 2FA management modal
    this.showSuccess('2FA management not yet implemented');
  }

  async viewBackupCodes() {
    // TODO: Show backup codes modal
    this.showSuccess('Backup codes view not yet implemented');
  }

  async revokeSession(sessionId: string) {
    if (!confirm('Are you sure you want to revoke this session?')) return;

    this.isLoading.set(true);
    try {
      // TODO: Implement session revocation
      this.showSuccess('Session revoked');
      await this.loadSecuritySettings();
    } catch (error) {
      this.showError('Failed to revoke session');
    } finally {
      this.isLoading.set(false);
    }
  }

  async signOutAllOther() {
    if (!confirm('Are you sure you want to sign out all other sessions?')) return;

    this.isLoading.set(true);
    try {
      // TODO: Implement bulk session revocation
      this.showSuccess('All other sessions signed out');
      await this.loadSecuritySettings();
    } catch (error) {
      this.showError('Failed to sign out other sessions');
    } finally {
      this.isLoading.set(false);
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}