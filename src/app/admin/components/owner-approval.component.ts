import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdminLayoutComponent } from './admin-layout.component';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';
import { InviteOwnerModalComponent } from './invite-owner-modal.component';
import { OwnerInvitationsListComponent } from './owner-invitations-list.component';
import { LoadingService } from '../../shared/services/loading.service';

interface PendingOwner {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  shopName: string;
  requestedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

@Component({
  selector: 'app-owner-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayoutComponent, InviteOwnerModalComponent, OwnerInvitationsListComponent],
  templateUrl: './owner-approval.component.html',
  styles: [`
    .owner-approval {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
      text-align: center;
      position: relative;
    }

    .page-header h1 {
      font-size: 2.5rem;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #6b7280;
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
    }

    .header-actions {
      display: flex;
      justify-content: center;
      margin-top: 1rem;
    }

    .invite-owner-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.875rem 1.75rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.3);
    }

    .invite-owner-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px -4px rgba(59, 130, 246, 0.4);
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    /* Tabs */
    .tabs {
      display: flex;
      background: #f9fafb;
      border-radius: 12px;
      padding: 0.25rem;
      margin-bottom: 2rem;
      border: 1px solid #e5e7eb;
    }

    .tab-button {
      flex: 1;
      background: none;
      border: none;
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      position: relative;
    }

    .tab-button:hover {
      color: #374151;
      background: #f3f4f6;
    }

    .tab-button.active {
      background: white;
      color: #1f2937;
      box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .tab-icon {
      font-size: 1rem;
    }

    .tab-badge {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .tab-content {
      min-height: 400px;
    }

    .tab-panel {
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 3rem;
      height: 3rem;
      border: 4px solid #e5e7eb;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .spinner-sm {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .error-icon {
      font-size: 2rem;
    }

    .retry-btn, .refresh-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .retry-btn:hover, .refresh-btn:hover {
      background: #2563eb;
    }

    .empty-state {
      color: #6b7280;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .approvals-container {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .approvals-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 1rem;
    }

    .approvals-header h2 {
      font-size: 1.5rem;
      color: #1f2937;
      margin: 0;
    }

    .approvals-grid {
      display: grid;
      gap: 1.5rem;
    }

    .approval-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .approval-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
    }

    .approval-card.processing {
      opacity: 0.7;
      pointer-events: none;
    }

    .card-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .owner-info h3 {
      font-size: 1.25rem;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .owner-info .email {
      color: #6b7280;
      margin: 0 0 0.25rem 0;
      font-family: monospace;
    }

    .owner-info .phone {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
    }

    .shop-info {
      text-align: right;
    }

    .shop-info h4 {
      font-size: 1.125rem;
      color: #059669;
      margin: 0 0 0.5rem 0;
      font-weight: 600;
    }

    .requested-date {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .card-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .approve-btn, .reject-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .approve-btn {
      background: #059669;
      color: white;
    }

    .approve-btn:hover:not(:disabled) {
      background: #047857;
    }

    .reject-btn {
      background: #dc2626;
      color: white;
    }

    .reject-btn:hover:not(:disabled) {
      background: #b91c1c;
    }

    .approve-btn:disabled, .reject-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }


    /* Success Toast */
    .success-toast {
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      z-index: 1001;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-close {
      background: none;
      border: none;
      color: #166534;
      cursor: pointer;
      padding: 0.25rem;
      margin-left: 0.5rem;
    }

    @media (max-width: 768px) {
      .owner-approval {
        padding: 1rem;
      }

      .page-header h1 {
        font-size: 2rem;
      }

      .header-actions {
        margin-top: 1.5rem;
      }

      .tabs {
        flex-direction: column;
        gap: 0.25rem;
      }

      .tab-button {
        border-radius: 6px;
        padding: 1rem;
      }

      .card-header {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .shop-info {
        text-align: left;
      }

      .card-actions {
        justify-content: center;
      }

      .approvals-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .success-toast {
        top: 1rem;
        right: 1rem;
        left: 1rem;
      }
    }
  `]
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
    private http: HttpClient,
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
      const response = await this.http.get<ApiResponse<PendingOwner[]>>(
        `${environment.apiUrl}/api/admin/pending-owners`
      ).toPromise();

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
      await this.http.post(
        `${environment.apiUrl}/api/admin/${userId}/approve`,
        {}
      ).toPromise();

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
        await this.http.post(
          `${environment.apiUrl}/api/admin/${userId}/reject`,
          { reason: result.inputValue || undefined }
        ).toPromise();

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