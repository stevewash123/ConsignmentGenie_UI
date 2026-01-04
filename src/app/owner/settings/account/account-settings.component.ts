import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountSecurityComponent } from '../../../shared/auth/components/account-security/account-security.component';
import { AuthService } from '../../../services/auth.service';
import { OwnerService } from '../../../services/owner.service';

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
  imports: [CommonModule, FormsModule, RouterModule, AccountSecurityComponent],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {
  userProfile = signal<UserProfile | null>(null);
  pinSettings = signal<OwnerPinSettings | null>(null);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private ownerService: OwnerService
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