import { Component, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
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
  styles: [`
    .account-security {
      max-width: 800px;
    }

    .security-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .security-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    /* Sign-in Methods */
    .signin-methods {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .signin-method {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }

    .signin-method:last-child {
      border-bottom: none;
    }

    .method-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .method-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
    }

    .icon-google { background: #db4437; }
    .icon-facebook { background: #1877f2; }
    .icon-email { background: #6b7280; }

    .method-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .method-name {
      font-weight: 500;
      color: #111827;
    }

    .method-email {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .method-status {
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .method-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-connected {
      color: #059669;
      font-weight: 500;
      font-size: 0.875rem;
    }

    /* Two-Factor Authentication */
    .twofa-container {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .twofa-disabled {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .twofa-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .twofa-content h4 {
      margin: 0 0 0.5rem 0;
      color: #111827;
    }

    .twofa-content p {
      margin: 0 0 1rem 0;
      color: #6b7280;
      line-height: 1.5;
    }

    .twofa-enabled {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .twofa-status {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status-enabled {
      color: #059669;
      font-weight: 500;
    }

    .setup-date {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .twofa-actions {
      display: flex;
      gap: 0.75rem;
    }

    .backup-codes {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .backup-info {
      color: #6b7280;
    }

    .btn-link {
      color: #3b82f6;
      text-decoration: underline;
      background: none;
      border: none;
      cursor: pointer;
      font-size: inherit;
    }

    /* Active Sessions */
    .sessions-container {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .session-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }

    .session-item:last-child {
      border-bottom: none;
    }

    .session-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .session-device {
      font-weight: 500;
      color: #111827;
    }

    .session-details {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .session-separator {
      color: #d1d5db;
    }

    .current-session {
      color: #059669;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .bulk-actions {
      padding: 1rem 1.25rem;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-danger, .btn-danger-outline,
    .btn-connect, .btn-disconnect, .btn-change-password, .btn-revoke {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
      border-color: #dc2626;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-danger-outline {
      background: white;
      color: #dc2626;
      border-color: #dc2626;
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: #fef2f2;
    }

    .btn-connect {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-disconnect, .btn-revoke {
      background: white;
      color: #dc2626;
      border-color: #dc2626;
    }

    .btn-change-password {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Messages */
    .messages {
      margin-top: 1rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .message.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .message.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .signin-method, .session-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .method-actions, .session-actions {
        align-self: stretch;
      }

      .twofa-disabled {
        flex-direction: column;
        text-align: center;
      }

      .twofa-actions {
        flex-direction: column;
      }
    }
  `]
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

  constructor(private http: HttpClient) {}

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