import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminLayoutComponent } from './admin-layout.component';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';
import { InviteOwnerModalComponent } from './invite-owner-modal.component';
import { OwnerInvitationsListComponent } from './owner-invitations-list.component';
import { LoadingService } from '../../shared/services/loading.service';
import { AdminService, PendingOwner, ApiResponse } from '../../services/admin.service';


@Component({
  selector: 'app-owner-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayoutComponent, InviteOwnerModalComponent, OwnerInvitationsListComponent],
  templateUrl: './owner-approval.component.html',
  styleUrls: ['./owner-approval.component.scss']
})
export class OwnerApprovalComponent implements OnInit {
  pendingOwners = signal<PendingOwner[]>([]);
  errorMessage = signal('');
  successMessage = signal('');

  // Tab management
  activeTab = signal<'approvals' | 'invitations'>('approvals');

  // Modal state
  isInviteModalOpen = signal(false);

  // Processing state
  processingUsers = signal(new Set<string>());
  processingActions = signal(new Map<string, 'approve' | 'reject'>());

  constructor(
    private adminService: AdminService,
    private confirmationService: ConfirmationDialogService,
    private loadingService: LoadingService
  ) {}

  isComponentLoading(): boolean {
    return this.loadingService.isLoading('owner-approval');
  }

  ngOnInit() {
    this.loadPendingOwners();
  }

  async loadPendingOwners() {
    this.loadingService.start('owner-approval');
    this.errorMessage.set('');

    try {
      const response = await this.adminService.getPendingOwners().toPromise();

      console.log('API response:', response);
      console.log('Is array?', Array.isArray(response));
      console.log('Response data:', response?.data);
      console.log('Is data array?', Array.isArray(response?.data));

      this.pendingOwners.set(response?.data || []);
    } catch (error: any) {
      console.error('Failed to load pending owners:', error);
      this.errorMessage.set('Failed to load pending approvals. Please try again.');
    } finally {
      this.loadingService.stop('owner-approval');
    }
  }

  async approveOwner(userId: string, fullName: string) {
    this.addProcessingUser(userId, 'approve');

    try {
      await this.adminService.approveOwner(userId).toPromise();

      // Remove from pending list
      this.pendingOwners.update(owners =>
        owners.filter(owner => owner.userId !== userId)
      );

      this.successMessage.set(`${fullName} has been approved successfully!`);

      // Auto-hide success message after 5 seconds
      setTimeout(() => this.successMessage.set(''), 5000);

    } catch (error: any) {
      console.error('Failed to approve owner:', error);
      this.errorMessage.set('Failed to approve owner. Please try again.');
    } finally {
      this.removeProcessingUser(userId);
    }
  }

  async rejectOwner(userId: string, fullName: string) {
    const result = await this.confirmationService.rejectWithReason(`${fullName}'s application`).toPromise();

    if (result?.confirmed) {
      this.addProcessingUser(userId, 'reject');

      try {
        await this.adminService.rejectOwner(userId, result.inputValue).toPromise();

        // Remove from pending list
        this.pendingOwners.update(owners =>
          owners.filter(owner => owner.userId !== userId)
        );

        this.successMessage.set(`${fullName}'s application has been rejected.`);

        // Auto-hide success message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);

      } catch (error: any) {
        console.error('Failed to reject owner:', error);
        this.errorMessage.set('Failed to reject owner. Please try again.');
      } finally {
        this.removeProcessingUser(userId);
      }
    }
  }

  private addProcessingUser(userId: string, action: 'approve' | 'reject') {
    this.processingUsers.update(users => new Set([...users, userId]));
    this.processingActions.update(actions => new Map([...actions, [userId, action]]));
  }

  private removeProcessingUser(userId: string) {
    this.processingUsers.update(users => {
      const newUsers = new Set(users);
      newUsers.delete(userId);
      return newUsers;
    });
    this.processingActions.update(actions => {
      const newActions = new Map(actions);
      newActions.delete(userId);
      return newActions;
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Tab management
  setActiveTab(tab: 'approvals' | 'invitations') {
    this.activeTab.set(tab);
  }

  // Modal management
  openInviteModal() {
    this.isInviteModalOpen.set(true);
  }

  onModalClosed() {
    this.isInviteModalOpen.set(false);
  }

  onInvitationSent() {
    this.isInviteModalOpen.set(false);
    // If we're on the invitations tab, we might want to refresh the list
    // The OwnerInvitationsListComponent will handle its own refresh
  }
}