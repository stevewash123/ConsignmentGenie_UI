import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminService, AdminMetrics, InviteOwnerRequest, OwnerInvitation, PendingApproval } from '../../services/admin.service';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminLayoutComponent],
  template: `
    <app-admin-layout>
      <div class="admin-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-text">
            <h1>System Administrator Dashboard</h1>
            <p class="subtitle">ConsignmentGenie Platform Overview</p>
          </div>
          <button class="invite-btn" (click)="showInviteModal = true">
            + Invite Owner
          </button>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Active Organizations</h3>
          <div class="stat-value">{{ metrics().activeOrganizations }}</div>
        </div>
        <div class="stat-card">
          <h3>Pending Approvals</h3>
          <div class="stat-value">{{ metrics().pendingApprovals }}</div>
        </div>
        <div class="stat-card">
          <h3>Pending Invitations</h3>
          <div class="stat-value">{{ metrics().pendingInvitations }}</div>
        </div>
      </div>

      <!-- Pending Invitations Section -->
      <div class="dashboard-section">
        <h2>Pending Invitations</h2>

        @if (pendingInvitations().length === 0) {
          <div class="empty-state">
            <p>No pending invitations</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Sent</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (invitation of pendingInvitations(); track invitation.id) {
                  <tr>
                    <td class="font-medium">{{ invitation.name }}</td>
                    <td>{{ invitation.email }}</td>
                    <td>{{ invitation.sentAt | date:'short' }}</td>
                    <td>{{ invitation.expiresAt | date:'short' }}</td>
                    <td class="actions">
                      <button
                        class="btn-action resend"
                        (click)="resendInvitation(invitation.id)"
                        [disabled]="isResending === invitation.id"
                        title="Resend invitation">
                        {{ isResending === invitation.id ? '⏳' : '📧' }}
                      </button>
                      <button
                        class="btn-action cancel"
                        (click)="cancelInvitation(invitation.id)"
                        [disabled]="isCancelling === invitation.id"
                        title="Cancel invitation">
                        {{ isCancelling === invitation.id ? '⏳' : '❌' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Pending Approvals Section -->
      <div class="dashboard-section">
        <h2>Pending Approvals</h2>

        @if (pendingApprovals().length === 0) {
          <div class="empty-state">
            <p>No pending approvals</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (approval of pendingApprovals(); track approval.id) {
                  <tr>
                    <td class="font-medium">{{ approval.organization }}</td>
                    <td>{{ approval.owner }}</td>
                    <td>{{ approval.email }}</td>
                    <td>{{ approval.submittedAt | date:'short' }}</td>
                    <td class="actions">
                      <button
                        class="btn-action approve"
                        (click)="approveOrganization(approval.id)"
                        [disabled]="isApproving === approval.id"
                        title="Approve organization">
                        {{ isApproving === approval.id ? '⏳' : '✅' }}
                      </button>
                      <button
                        class="btn-action reject"
                        (click)="rejectOrganization(approval.id)"
                        [disabled]="isRejecting === approval.id"
                        title="Reject organization">
                        {{ isRejecting === approval.id ? '⏳' : '❌' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      </div>

      <!-- Invite Owner Modal -->
      @if (showInviteModal) {
        <div class="modal-overlay" (click)="closeInviteModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Invite Owner</h2>
              <button class="modal-close" (click)="closeInviteModal()">&times;</button>
            </div>

            <form (ngSubmit)="inviteOwner()" #inviteForm="ngForm" class="modal-form">
              <div class="form-group">
                <label for="ownerName">Name *</label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  [(ngModel)]="inviteRequest.name"
                  required
                  [disabled]="isInviting"
                  placeholder="Enter owner's full name"
                >
              </div>

              <div class="form-group">
                <label for="ownerEmail">Email *</label>
                <input
                  type="email"
                  id="ownerEmail"
                  name="ownerEmail"
                  [(ngModel)]="inviteRequest.email"
                  required
                  [disabled]="isInviting"
                  placeholder="Enter owner's email address"
                >
              </div>

              @if (inviteError) {
                <div class="error-message">{{ inviteError }}</div>
              }

              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="closeInviteModal()" [disabled]="isInviting">
                  Cancel
                </button>
                <button type="submit" class="btn-primary" [disabled]="inviteForm.invalid || isInviting">
                  {{ isInviting ? 'Sending...' : 'Send Invitation' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </app-admin-layout>
  `,
  styles: [`
    .admin-dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 3rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-text {
      text-align: center;
      flex: 1;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .invite-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      white-space: nowrap;
    }

    .invite-btn:hover {
      background: #2563eb;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .stat-card h3 {
      font-size: 1rem;
      color: #6b7280;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .stat-value {
      font-size: 3rem;
      font-weight: bold;
      color: #1f2937;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 400px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #1f2937;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
    }

    .modal-close:hover {
      color: #374151;
    }

    .modal-form {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input:disabled {
      background: #f9fafb;
      color: #6b7280;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #6b7280;
      border: 1px solid #d1d5db;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Dashboard Sections */
    .dashboard-section {
      margin-top: 3rem;
    }

    .dashboard-section h2 {
      font-size: 1.5rem;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .empty-state {
      background: white;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .empty-state p {
      color: #6b7280;
      font-size: 1.1rem;
      margin: 0;
    }

    /* Data Tables */
    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead {
      background: #f9fafb;
    }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-table tbody tr:hover {
      background: #f9fafb;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .font-medium {
      font-weight: 500;
      color: #1f2937;
    }

    .actions {
      text-align: center;
      white-space: nowrap;
    }

    .btn-action {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      margin: 0 0.25rem;
      padding: 0.5rem;
      border-radius: 6px;
      transition: all 0.2s;
      min-width: 2.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-action:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .btn-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-action.resend:hover:not(:disabled) {
      background: #dbeafe;
    }

    .btn-action.cancel:hover:not(:disabled) {
      background: #fee2e2;
    }

    .btn-action.approve:hover:not(:disabled) {
      background: #dcfce7;
    }

    .btn-action.reject:hover:not(:disabled) {
      background: #fee2e2;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: center;
      }

      .header-text {
        text-align: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .data-table {
        font-size: 0.875rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.75rem 0.5rem;
      }

      .btn-action {
        font-size: 1rem;
        padding: 0.375rem;
        margin: 0 0.125rem;
        min-width: 2rem;
      }
    }

  `]
})
export class AdminDashboardComponent implements OnInit {
  metrics = signal<AdminMetrics>({
    activeOrganizations: 0,
    pendingApprovals: 0,
    pendingInvitations: 0
  });

  // Data
  pendingInvitations = signal<OwnerInvitation[]>([]);
  pendingApprovals = signal<PendingApproval[]>([]);

  // Invite Modal State
  showInviteModal = false;
  isInviting = false;
  inviteError = '';
  inviteRequest: InviteOwnerRequest = {
    name: '',
    email: ''
  };

  // Action States
  isResending: string | null = null;
  isCancelling: string | null = null;
  isApproving: string | null = null;
  isRejecting: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load metrics from API
    this.adminService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
      },
      error: (error) => {
        console.error('Error loading admin metrics:', error);
        // Fall back to mock data for development
        this.metrics.set({
          activeOrganizations: 3,
          pendingApprovals: 0,
          pendingInvitations: 0
        });
      }
    });

    // Load pending invitations and approvals
    this.loadPendingInvitations();
    this.loadPendingApprovals();
  }

  private loadPendingInvitations() {
    this.adminService.getOwnerInvitations().subscribe({
      next: (invitations) => {
        this.pendingInvitations.set(invitations);
      },
      error: (error) => {
        console.error('Error loading pending invitations:', error);
        // Fall back to empty array for development
        this.pendingInvitations.set([]);
      }
    });
  }

  private loadPendingApprovals() {
    this.adminService.getPendingApprovals().subscribe({
      next: (approvals) => {
        this.pendingApprovals.set(approvals);
      },
      error: (error) => {
        console.error('Error loading pending approvals:', error);
        // Fall back to empty array for development
        this.pendingApprovals.set([]);
      }
    });
  }

  closeInviteModal() {
    this.showInviteModal = false;
    this.inviteError = '';
    this.inviteRequest = { name: '', email: '' };
  }

  inviteOwner() {
    if (!this.inviteRequest.name.trim() || !this.inviteRequest.email.trim()) {
      this.inviteError = 'Please fill in all required fields.';
      return;
    }

    this.isInviting = true;
    this.inviteError = '';

    this.adminService.inviteOwner(this.inviteRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeInviteModal();
          // Refresh data to update pending invitations
          this.loadDashboardData();
          // TODO: Show success toast
          console.log('Invitation sent successfully!');
        } else {
          this.inviteError = response.message || 'Failed to send invitation.';
        }
        this.isInviting = false;
      },
      error: (error) => {
        console.error('Error sending invitation:', error);
        this.inviteError = error.error?.message || 'Failed to send invitation. Please try again.';
        this.isInviting = false;
      }
    });
  }

  resendInvitation(id: string) {
    this.isResending = id;

    this.adminService.resendOwnerInvitation(id).subscribe({
      next: (response) => {
        if (response.success) {
          // Refresh data
          this.loadPendingInvitations();
          // TODO: Show success toast
          console.log('Invitation resent successfully!');
        } else {
          // TODO: Show error toast
          console.error('Failed to resend invitation:', response.message);
        }
        this.isResending = null;
      },
      error: (error) => {
        console.error('Error resending invitation:', error);
        // TODO: Show error toast
        this.isResending = null;
      }
    });
  }

  cancelInvitation(id: string) {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    this.isCancelling = id;

    this.adminService.cancelOwnerInvitation(id).subscribe({
      next: (response) => {
        if (response.success) {
          // Refresh data
          this.loadDashboardData();
          // TODO: Show success toast
          console.log('Invitation cancelled successfully!');
        } else {
          // TODO: Show error toast
          console.error('Failed to cancel invitation:', response.message);
        }
        this.isCancelling = null;
      },
      error: (error) => {
        console.error('Error cancelling invitation:', error);
        // TODO: Show error toast
        this.isCancelling = null;
      }
    });
  }

  approveOrganization(id: string) {
    if (!confirm('Are you sure you want to approve this organization?')) {
      return;
    }

    this.isApproving = id;

    this.adminService.approveOrganization(id).subscribe({
      next: (response) => {
        if (response.success) {
          // Refresh data
          this.loadDashboardData();
          // TODO: Show success toast
          console.log('Organization approved successfully!');
        } else {
          // TODO: Show error toast
          console.error('Failed to approve organization:', response.message);
        }
        this.isApproving = null;
      },
      error: (error) => {
        console.error('Error approving organization:', error);
        // TODO: Show error toast
        this.isApproving = null;
      }
    });
  }

  rejectOrganization(id: string) {
    if (!confirm('Are you sure you want to reject this organization? This action cannot be undone.')) {
      return;
    }

    this.isRejecting = id;

    this.adminService.rejectOrganization(id).subscribe({
      next: (response) => {
        if (response.success) {
          // Refresh data
          this.loadDashboardData();
          // TODO: Show success toast
          console.log('Organization rejected successfully!');
        } else {
          // TODO: Show error toast
          console.error('Failed to reject organization:', response.message);
        }
        this.isRejecting = null;
      },
      error: (error) => {
        console.error('Error rejecting organization:', error);
        // TODO: Show error toast
        this.isRejecting = null;
      }
    });
  }
}