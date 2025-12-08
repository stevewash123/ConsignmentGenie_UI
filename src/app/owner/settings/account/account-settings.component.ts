import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AccountSecurityComponent } from '../../../shared/auth/components/account-security/account-security.component';
import { AuthService } from '../../../services/auth.service';

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface OwnerPinSettings {
  hasPin: boolean;
  lastChanged?: Date;
  usedFor: string[];
}

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AccountSecurityComponent],
  templateUrl: './account-settings.component.html',
  styles: [`
    .account-settings {
      padding: 2rem;
      max-width: 800px;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .settings-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .settings-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .settings-section {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .settings-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .settings-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    /* Profile Form */
    .profile-form {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-of-type {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      max-width: 400px;
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

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    /* PIN Settings */
    .pin-settings {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .pin-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .pin-label {
      font-weight: 500;
      color: #374151;
    }

    .pin-display {
      font-family: monospace;
      background: #e5e7eb;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      color: #374151;
    }

    .pin-usage {
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .usage-label {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .usage-list {
      margin: 0;
      padding-left: 1rem;
      color: #6b7280;
    }

    .usage-list li {
      margin-bottom: 0.25rem;
    }

    /* Danger Zone */
    .danger-zone {
      border: 2px solid #fee2e2;
      border-radius: 8px;
      padding: 1.5rem;
      background: #fef2f2;
    }

    .danger-zone h3 {
      color: #dc2626;
    }

    .danger-content {
      margin-top: 1rem;
    }

    .danger-action {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .danger-info h4 {
      color: #dc2626;
      margin: 0 0 0.5rem 0;
    }

    .danger-info p {
      color: #991b1b;
      margin: 0;
      line-height: 1.5;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-danger {
      padding: 0.75rem 1.5rem;
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

    .btn-primary:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
      border-color: #dc2626;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    /* Messages */
    .messages {
      margin-top: 2rem;
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
      .account-settings {
        padding: 1rem;
      }

      .danger-action {
        flex-direction: column;
      }

      .pin-status {
        flex-direction: column;
        align-items: flex-start;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AccountSettingsComponent implements OnInit {
  userProfile = signal<UserProfile | null>(null);
  pinSettings = signal<OwnerPinSettings | null>(null);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadPinSettings();
  }

  getCurrentUserId(): string {
    const user = this.authService.getCurrentUser();
    return user?.userId || '';
  }

  async loadUserProfile() {
    try {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.userProfile.set({
          id: user.userId,
          name: 'Sarah Johnson', // Mock data
          email: user.email
        });
      }
    } catch (error) {
      this.showError('Failed to load user profile');
    }
  }

  async saveProfile() {
    if (!this.userProfile()) return;

    this.isSaving.set(true);
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      this.showSuccess('Profile updated successfully');
    } catch (error) {
      this.showError('Failed to update profile');
    } finally {
      this.isSaving.set(false);
    }
  }

  async loadPinSettings() {
    try {
      // Mock data - replace with actual API call
      this.pinSettings.set({
        hasPin: true,
        lastChanged: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        usedFor: [
          'Voids and refunds',
          'Price overrides',
          'Cash drawer access',
          'Discount approvals'
        ]
      });
    } catch (error) {
      this.showError('Failed to load PIN settings');
    }
  }

  async changePin() {
    try {
      // TODO: Implement PIN change modal/flow
      this.showSuccess('PIN change functionality not yet implemented');
    } catch (error) {
      this.showError('Failed to change PIN');
    }
  }

  async deleteAccount() {
    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE MY ACCOUNT" to confirm:'
    );

    if (confirmation === 'DELETE MY ACCOUNT') {
      try {
        // TODO: Implement account deletion
        this.showError('Account deletion not yet implemented');
      } catch (error) {
        this.showError('Failed to delete account');
      }
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