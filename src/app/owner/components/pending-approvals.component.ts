import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConsignorService } from '../../services/consignor.service';
import { PendingConsignorApproval, ConsignorApprovalRequest } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="approvals-container">
      <div class="header">
        <h1>Pending Consignor Approvals</h1>
        <div class="header-info">
          <span class="pending-count" *ngIf="pendingApprovals().length > 0">
            {{ pendingApprovals().length }} pending approval{{ pendingApprovals().length === 1 ? '' : 's' }}
          </span>
        </div>
      </div>

      <div class="approvals-content" *ngIf="!isLoading(); else loading">
        <div class="empty-state" *ngIf="pendingApprovals().length === 0">
          <div class="empty-icon">✅</div>
          <h3>No Pending Approvals</h3>
          <p>All consignor registrations have been processed.</p>
          <a routerLink="/owner/consignors" class="btn-primary">
            Back to Consignors
          </a>
        </div>

        <div class="approvals-list" *ngIf="pendingApprovals().length > 0">
          <div class="approval-card" *ngFor="let approval of pendingApprovals(); trackBy: trackByApproval">
            <div class="approval-header">
              <div class="consignor-info">
                <h3>{{ approval.name }}</h3>
                <p class="email">{{ approval.email }}</p>
                <p class="phone" *ngIf="approval.phone">{{ approval.phone }}</p>
              </div>
              <div class="approval-meta">
                <app-status-badge status="pending"></app-status-badge>
                <span class="registration-date">
                  Registered {{ formatDate(approval.registrationDate) }}
                </span>
              </div>
            </div>

            <div class="approval-details" *ngIf="approval.registrationInfo">
              <h4>Registration Information</h4>
              <p>{{ approval.registrationInfo }}</p>
            </div>

            <div class="approval-details">
              <h4>Store Code Used</h4>
              <p><code>{{ approval.storeCode }}</code></p>
            </div>

            <div class="approval-actions">
              <button
                class="btn-success"
                (click)="showApprovalModal(approval, 'approve')"
                [disabled]="isProcessing()"
              >
                Approve
              </button>
              <button
                class="btn-secondary"
                (click)="showApprovalModal(approval, 'request_info')"
                [disabled]="isProcessing()"
              >
                Request Info
              </button>
              <button
                class="btn-danger"
                (click)="showApprovalModal(approval, 'reject')"
                [disabled]="isProcessing()"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Approval Modal -->
      <div class="modal-overlay" *ngIf="isModalOpen()" (click)="onBackdropClick($event)">
        <div class="modal-container" role="dialog" aria-labelledby="modal-title">
          <div class="modal-header">
            <h3 id="modal-title">{{ getModalTitle() }}</h3>
            <button type="button" class="close-button" (click)="closeModal()" aria-label="Close">
              ×
            </button>
          </div>

          <div class="modal-content">
            <div class="consignor-info">
              <p><strong>{{ selectedApproval()?.name }}</strong></p>
              <p>{{ selectedApproval()?.email }}</p>
            </div>

            <form (ngSubmit)="onSubmitApproval()" #approvalForm="ngForm">
              <div class="form-group" *ngIf="approvalAction() !== 'approve'">
                <label for="message">{{ getMessageLabel() }} *</label>
                <textarea
                  id="message"
                  name="message"
                  [(ngModel)]="approvalMessage"
                  required
                  class="form-control"
                  rows="4"
                  [placeholder]="getMessagePlaceholder()"
                ></textarea>
              </div>

              <div class="form-group" *ngIf="approvalAction() === 'approve'">
                <label for="welcomeMessage">Welcome Message (Optional)</label>
                <textarea
                  id="welcomeMessage"
                  name="welcomeMessage"
                  [(ngModel)]="approvalMessage"
                  class="form-control"
                  rows="3"
                  placeholder="Add a personal welcome message that will be included in their approval email..."
                ></textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-secondary" (click)="closeModal()">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  [class.btn-success]="approvalAction() === 'approve'"
                  [class.btn-danger]="approvalAction() === 'reject'"
                  [disabled]="isProcessing() || (approvalAction() !== 'approve' && !approvalMessage.trim())"
                >
                  {{ isProcessing() ? 'Processing...' : getSubmitButtonText() }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="loading">Loading pending approvals...</div>
      </ng-template>

      <div class="success-message" *ngIf="successMessage()">
        {{ successMessage() }}
      </div>

      <div class="error-message" *ngIf="errorMessage()">
        {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .approvals-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      margin: 0;
      color: #212529;
    }

    .pending-count {
      background-color: #fd7e14;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 1rem 0;
      color: #28a745;
    }

    .empty-state p {
      margin: 0 0 2rem 0;
      color: #6c757d;
    }

    .approval-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .approval-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .consignor-info h3 {
      margin: 0 0 0.5rem 0;
      color: #212529;
    }

    .email, .phone {
      margin: 0.25rem 0;
      color: #6c757d;
    }

    .approval-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .registration-date {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .approval-details {
      margin-bottom: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .approval-details h4 {
      margin: 0 0 0.5rem 0;
      color: #495057;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .approval-details p {
      margin: 0;
      color: #212529;
    }

    .approval-details code {
      background-color: #e9ecef;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-family: monospace;
      color: #495057;
    }

    .approval-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-danger {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #5a6268;
    }

    .btn-success {
      background-color: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #1e7e34;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #212529;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6c757d;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      color: #212529;
    }

    .modal-content {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      resize: vertical;
    }

    .form-control:focus {
      border-color: #007bff;
      outline: none;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #212529;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }

    .success-message, .error-message {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
    }

    .success-message {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .error-message {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
  `]
})
export class PendingApprovalsComponent implements OnInit {
  pendingApprovals = signal<PendingConsignorApproval[]>([]);
  selectedApproval = signal<PendingConsignorApproval | null>(null);
  approvalAction = signal<'approve' | 'reject' | 'request_info'>('approve');
  approvalMessage = '';

  isModalOpen = signal(false);
  isProcessing = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private consignorService: ConsignorService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  isLoading(): boolean {
    return this.loadingService.isLoading('pending-approvals');
  }

  loadPendingApprovals(): void {
    this.loadingService.start('pending-approvals');
    this.consignorService.getPendingApprovals().subscribe({
      next: (approvals) => {
        this.pendingApprovals.set(approvals || []);
      },
      error: (error) => {
        console.error('Error loading pending approvals:', error);
        this.errorMessage.set('Failed to load pending approvals. Please try again.');
        // For now, show mock data when API fails so you can see the design
        this.pendingApprovals.set([
          {
            id: 1,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '(555) 123-4567',
            registrationDate: new Date('2024-12-20'),
            storeCode: 'VINTAGE2024',
            registrationInfo: 'I have a large collection of vintage clothing and accessories from the 1960s-1980s that I would like to consign.'
          },
          {
            id: 2,
            name: 'Mike Chen',
            email: 'mike.chen@email.com',
            registrationDate: new Date('2024-12-18'),
            storeCode: 'VINTAGE2024',
            registrationInfo: 'Local artist looking to consign handmade jewelry and crafts.'
          }
        ]);
      },
      complete: () => {
        this.loadingService.stop('pending-approvals');
      }
    });
  }

  trackByApproval(index: number, approval: PendingConsignorApproval): number {
    return approval.id;
  }

  formatDate(date: Date): string {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 'day');
  }

  showApprovalModal(approval: PendingConsignorApproval, action: 'approve' | 'reject' | 'request_info'): void {
    this.selectedApproval.set(approval);
    this.approvalAction.set(action);
    this.approvalMessage = '';
    this.errorMessage.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.selectedApproval.set(null);
    this.approvalMessage = '';
    this.errorMessage.set('');
    this.isModalOpen.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onSubmitApproval(): void {
    const approval = this.selectedApproval();
    if (!approval || this.isProcessing()) return;

    this.isProcessing.set(true);
    this.errorMessage.set('');

    const request: ConsignorApprovalRequest = {
      action: this.approvalAction(),
      message: this.approvalMessage.trim() || undefined
    };

    this.consignorService.processApproval(approval.id, request).subscribe({
      next: (response) => {
        const actionMessages = {
          approve: `${approval.name} has been approved and will receive a welcome email.`,
          reject: `${approval.name} has been rejected and will be notified.`,
          request_info: `Information request sent to ${approval.name}.`
        };

        this.successMessage.set(actionMessages[this.approvalAction()]);

        // Remove from pending list if approved or rejected
        if (this.approvalAction() === 'approve' || this.approvalAction() === 'reject') {
          this.pendingApprovals.update(approvals =>
            approvals.filter(a => a.id !== approval.id)
          );
        }

        this.closeModal();

        // Clear success message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (error) => {
        console.error('Error processing approval:', error);
        this.errorMessage.set('Failed to process approval. Please try again.');
      },
      complete: () => {
        this.isProcessing.set(false);
      }
    });
  }

  getModalTitle(): string {
    const actions = {
      approve: 'Approve Consignor',
      reject: 'Reject Consignor',
      request_info: 'Request More Information'
    };
    return actions[this.approvalAction()];
  }

  getMessageLabel(): string {
    const labels = {
      reject: 'Rejection Reason',
      request_info: 'Information Request'
    };
    return labels[this.approvalAction() as 'reject' | 'request_info'];
  }

  getMessagePlaceholder(): string {
    const placeholders = {
      reject: 'Enter the reason for rejecting this application...',
      request_info: 'What additional information do you need from this consignor?'
    };
    return placeholders[this.approvalAction() as 'reject' | 'request_info'];
  }

  getSubmitButtonText(): string {
    const texts = {
      approve: 'Approve & Send Welcome Email',
      reject: 'Reject Application',
      request_info: 'Send Information Request'
    };
    return texts[this.approvalAction()];
  }
}