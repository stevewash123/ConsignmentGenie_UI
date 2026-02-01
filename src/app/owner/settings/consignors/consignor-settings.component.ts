import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OwnerService, ConsignorDefaults } from '../../../services/owner.service';
import { ConsignorPermissions } from '../../../models/consignor.models';
import { environment } from '../../../../environments/environment';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface ConsignorSettings {
  storeCode: string;
  autoApprove: boolean;
  signupUrl: string;
  inventoryPermissions: ConsignorInventoryPermissions;
  defaults: ConsignorDefaults;
  agreements: ConsignorAgreements;
  notifications: ConsignorNotifications;
}

interface ConsignorInventoryPermissions {
  canAddItems: boolean;
  canEditItems: boolean;
  canRemoveItems: boolean;
  canViewDetailedAnalytics: boolean;
}


interface ConsignorAgreements {
  autoSendOnRegistration: boolean;
  requireBeforeItems: boolean;
  templateCustomized: boolean; // Read-only status
}

interface ConsignorNotifications {
  newConsignorRegistration: boolean;
  itemSubmissions: boolean;
  payoutRequests: boolean;
}

interface PendingInvitation {
  id: string;
  email: string;
  sentAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

@Component({
  selector: 'app-consignor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consignor-settings.component.html',
  styleUrls: ['./consignor-settings.component.scss']
})
export class ConsignorSettingsComponent implements OnInit, OnDestroy {
  settings = signal<ConsignorSettings | null>(null);
  pendingInvitations = signal<PendingInvitation[]>([]);
  inviteEmailsText = '';
  customMessage = '';
  isSaving = signal(false);
  isSending = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  private settingsSubscription = new Subscription();
  private autoSaveSubject = new Subject<void>();

  constructor(private ownerService: OwnerService) {
    // Set up auto-save with debounce
    this.settingsSubscription.add(
      this.autoSaveSubject.pipe(
        debounceTime(500)
      ).subscribe(() => {
        this.autoSaveDefaults();
      })
    );
  }

  ngOnInit() {
    this.loadSettings();
    this.loadPendingInvitations();
  }

  ngOnDestroy() {
    this.settingsSubscription.unsubscribe();
  }

  async loadSettings() {
    try {
      // Load consignor defaults from the API
      const defaults = await this.ownerService.getConsignorDefaults().toPromise();

      // Mock data for other settings - replace with actual API calls later
      const mockSettings: ConsignorSettings = {
        storeCode: 'VINT-2024-7X9K',
        autoApprove: true,
        signupUrl: 'consignmentgenie.com/join/VINT-2024-7X9K',
        inventoryPermissions: {
          canAddItems: true,
          canEditItems: true,
          canRemoveItems: false,
          canViewDetailedAnalytics: false
        },
        defaults: defaults || {
          shopCommissionPercent: 50,
          consignmentPeriodDays: 90,
          retrievalPeriodDays: 14,
          unsoldItemPolicy: 'return-to-consignor'
        },
        agreements: {
          autoSendOnRegistration: false,
          requireBeforeItems: false,
          templateCustomized: true // Template has been customized, enabling toggle
        },
        notifications: {
          newConsignorRegistration: true,
          itemSubmissions: false,
          payoutRequests: true
        }
      };

      this.settings.set(mockSettings);
    } catch (error) {
      this.showError('Failed to load consignor settings');
    }
  }

  async loadPendingInvitations() {
    try {
      const response = await this.ownerService.getConsignorInvitations().toPromise();

      if (response) {
        // Transform API response to our interface format
        const invitations: PendingInvitation[] = response.map(inv => ({
          id: inv.id,
          email: inv.email,
          sentAt: new Date(inv.createdAt),
          expiresAt: new Date(inv.expiresAt),
          status: inv.status.toLowerCase()
        }));

        this.pendingInvitations.set(invitations);
      }
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      this.showError('Failed to load pending invitations');
    }
  }

  onDefaultsChange() {
    this.autoSaveSubject.next();
  }

  async autoSaveDefaults() {
    if (!this.settings() || this.isSaving()) return;

    this.isSaving.set(true);
    try {
      const currentSettings = this.settings();
      if (currentSettings?.defaults) {
        const response = await this.ownerService.updateConsignorDefaults(currentSettings.defaults).toPromise();

        if (response?.success) {
          this.showSuccess('Default terms saved automatically');
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error for auto-save failures to avoid annoying the user
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveSettings() {
    if (!this.settings()) return;

    this.isSaving.set(true);
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      this.showSuccess('Consignor settings saved successfully');
    } catch (error) {
      this.showError('Failed to save consignor settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  copyStoreCode() {
    if (this.settings()?.storeCode) {
      navigator.clipboard.writeText(this.settings()!.storeCode);
      this.showSuccess('Store code copied to clipboard');
    }
  }

  copySignupLink() {
    if (this.settings()?.signupUrl) {
      navigator.clipboard.writeText(this.settings()!.signupUrl);
      this.showSuccess('Signup link copied to clipboard');
    }
  }

  async regenerateStoreCode() {
    if (!confirm('Are you sure you want to regenerate the store code? The old code will no longer work.')) {
      return;
    }

    try {
      const response = await this.ownerService.regenerateStoreCode().toPromise();

      if (response) {
        const settings = this.settings();
        if (settings) {
          settings.storeCode = response.newStoreCode;
          settings.signupUrl = `${window.location.origin}/register/consignor/invitation?token=${response.newStoreCode}`;
          this.settings.set({ ...settings });
        }
        this.showSuccess('Store code regenerated successfully');
      }
    } catch (error) {
      console.error('Error regenerating store code:', error);
      this.showError('Failed to regenerate store code');
    }
  }

  async sendInvitations() {
    const emails = this.inviteEmailsText
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && this.isValidEmail(email));

    if (emails.length === 0) {
      this.showError('Please enter at least one valid email address');
      return;
    }

    this.isSending.set(true);
    try {
      // Send invitations one by one
      let successCount = 0;
      for (const email of emails) {
        try {
          const inviteRequest = {
            email: email,
            name: email.split('@')[0], // Use email prefix as default name
            message: this.customMessage
          };

          await this.ownerService.createConsignorInvitation(inviteRequest).toPromise();
          successCount++;
        } catch (error) {
          console.error(`Failed to send invitation to ${email}:`, error);
        }
      }

      // Reload invitations to show updated list
      await this.loadPendingInvitations();

      this.inviteEmailsText = '';
      this.customMessage = '';

      if (successCount === emails.length) {
        this.showSuccess(`${emails.length} invitation(s) sent successfully`);
      } else if (successCount > 0) {
        this.showSuccess(`${successCount} of ${emails.length} invitation(s) sent successfully`);
      } else {
        this.showError('Failed to send invitations');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      this.showError('Failed to send invitations');
    } finally {
      this.isSending.set(false);
    }
  }

  async resendInvitation(invitationId: string) {
    try {
      await this.ownerService.resendConsignorInvitation(invitationId).toPromise();

      // Reload invitations to show updated data
      await this.loadPendingInvitations();

      this.showSuccess('Invitation resent successfully');
    } catch (error) {
      this.showError('Failed to resend invitation');
    }
  }

  async cancelInvitation(invitationId: string) {
    if (!confirm('Are you sure you want to remove this invitation?')) {
      return;
    }

    try {
      await this.ownerService.deleteConsignorInvitation(invitationId).toPromise();

      // Reload invitations to show updated list
      await this.loadPendingInvitations();

      this.showSuccess('Invitation removed successfully');
    } catch (error) {
      this.showError('Failed to remove invitation');
    }
  }

  getInvitationStatusText(invitation: PendingInvitation): string {
    switch (invitation.status) {
      case 'pending':
        const daysLeft = Math.ceil((invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Expires soon';
      case 'accepted':
        return 'Accepted';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }

  private generateStoreCode(): string {
    const prefix = 'VINT';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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