import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsignorStatus, ConsignorStatusChangeRequest } from '../../models/consignor.model';

@Component({
  selector: 'app-status-change-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="modal-container" role="dialog" aria-labelledby="modal-title">
        <div class="modal-header">
          <h3 id="modal-title">Change Consignor Status</h3>
          <button type="button" class="close-button" (click)="onCancel()" aria-label="Close">
            ×
          </button>
        </div>

        <div class="modal-content">
          <div class="consignor-info">
            <p><strong>{{ consignorName }}</strong></p>
            <p class="current-status">Current status:
              <span [class]="'status-' + currentStatus">{{ getStatusLabel(currentStatus) }}</span>
            </p>
          </div>

          <form (ngSubmit)="onSubmit()" #statusForm="ngForm">
            <div class="form-group">
              <label for="newStatus">New Status *</label>
              <select
                id="newStatus"
                name="newStatus"
                [(ngModel)]="selectedStatus"
                required
                class="form-control"
                #statusField="ngModel"
              >
                <option value="">Select new status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="closed">Closed</option>
              </select>
              <div class="error-message" *ngIf="statusField.invalid && statusField.touched">
                Please select a status
              </div>
            </div>

            <div class="status-description" *ngIf="selectedStatus">
              <p class="description">{{ getStatusDescription(selectedStatus) }}</p>
            </div>

            <div class="form-group" *ngIf="requiresReason(selectedStatus)">
              <label for="reason">Reason for {{ selectedStatus }} status</label>
              <textarea
                id="reason"
                name="reason"
                [(ngModel)]="changeReason"
                class="form-control"
                rows="3"
                [placeholder]="getReasonPlaceholder(selectedStatus)"
              ></textarea>
              <small class="form-text">This reason will be logged internally</small>
            </div>

            <div class="warning-message" *ngIf="getWarningMessage(selectedStatus)">
              <div class="warning-icon">⚠️</div>
              <div class="warning-text">{{ getWarningMessage(selectedStatus) }}</div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="onCancel()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary"
                [class.btn-danger]="selectedStatus === 'closed'"
                [disabled]="statusForm.invalid || isSubmitting()"
              >
                {{ isSubmitting() ? 'Changing...' : getSubmitButtonText(selectedStatus) }}
              </button>
            </div>
          </form>

          <div class="error-message" *ngIf="error()">
            {{ error() }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      font-weight: 600;
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

    .consignor-info {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .consignor-info p {
      margin: 0;
    }

    .current-status {
      margin-top: 0.5rem !important;
    }

    .status-active { color: #28a745; font-weight: 600; }
    .status-inactive { color: #6c757d; font-weight: 600; }
    .status-suspended { color: #ffc107; font-weight: 600; }
    .status-closed { color: #dc3545; font-weight: 600; }
    .status-invited { color: #007bff; font-weight: 600; }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-control:focus {
      border-color: #007bff;
      outline: none;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .status-description {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background-color: #e9ecef;
      border-radius: 4px;
      font-style: italic;
    }

    .status-description .description {
      margin: 0;
      color: #495057;
    }

    .warning-message {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .warning-icon {
      font-size: 1.25rem;
    }

    .warning-text {
      color: #856404;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn-secondary, .btn-primary, .btn-danger {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-text {
      color: #6c757d;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #212529;
    }
  `]
})
export class StatusChangeModalComponent {
  @Input() isOpen = false;
  @Input() consignorName = '';
  @Input() currentStatus: ConsignorStatus = 'active';
  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<ConsignorStatusChangeRequest>();

  selectedStatus: ConsignorStatus = 'active';
  changeReason = '';
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onCancel(): void {
    this.selectedStatus = 'active';
    this.changeReason = '';
    this.error.set(null);
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.selectedStatus || this.isSubmitting()) return;

    this.error.set(null);
    this.isSubmitting.set(true);

    const request: ConsignorStatusChangeRequest = {
      newStatus: this.selectedStatus,
      reason: this.changeReason.trim() || undefined
    };

    this.statusChange.emit(request);
  }

  // Called by parent component after successful status change
  onStatusChangeComplete(): void {
    this.isSubmitting.set(false);
    this.onCancel();
  }

  // Called by parent component if status change fails
  onStatusChangeFailed(errorMessage: string): void {
    this.isSubmitting.set(false);
    this.error.set(errorMessage);
  }

  getStatusLabel(status: ConsignorStatus): string {
    const labels = {
      active: 'Active',
      invited: 'Invited',
      inactive: 'Inactive',
      suspended: 'Suspended',
      closed: 'Closed'
    };
    return labels[status] || status;
  }

  getStatusDescription(status: ConsignorStatus): string {
    const descriptions = {
      active: 'Can consign new items and receive payouts',
      inactive: 'No new items allowed, but still receives payouts for existing items',
      suspended: 'No new items allowed, payouts are held pending resolution',
      closed: 'Relationship ended, account is read-only'
    };
    return descriptions[status] || '';
  }

  requiresReason(status: ConsignorStatus): boolean {
    return status === 'suspended' || status === 'closed';
  }

  getReasonPlaceholder(status: ConsignorStatus): string {
    const placeholders = {
      suspended: 'Enter reason for suspension (e.g., dispute resolution, contract violation)',
      closed: 'Enter reason for closure (e.g., consignor request, contract completion)'
    };
    return placeholders[status] || '';
  }

  getWarningMessage(status: ConsignorStatus): string {
    const warnings = {
      suspended: 'Suspended consignors will not receive payouts until status is resolved.',
      closed: 'This action cannot be undone. Ensure all items are returned and final payout processed.'
    };
    return warnings[status] || '';
  }

  getSubmitButtonText(status: ConsignorStatus): string {
    const texts = {
      active: 'Activate Consignor',
      inactive: 'Set Inactive',
      suspended: 'Suspend Consignor',
      closed: 'Close Account'
    };
    return texts[status] || 'Change Status';
  }
}