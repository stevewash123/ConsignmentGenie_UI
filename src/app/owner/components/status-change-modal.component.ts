import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemListDto, ItemStatus } from '../../models/inventory.model';
import { ItemStatusService, StatusAction } from '../../services/item-status.service';

@Component({
  selector: 'app-status-change-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ getModalTitle() }}</h3>
          <button type="button" class="close-btn" (click)="close()">✕</button>
        </div>

        <div class="modal-body">
          <p>{{ getConfirmationMessage() }}</p>

          <div *ngIf="statusAction?.requireReason" class="reason-field">
            <label for="reason" class="form-label">Reason (optional):</label>
            <textarea
              id="reason"
              [(ngModel)]="reason"
              class="form-textarea"
              placeholder="Enter reason for status change..."
              rows="3">
            </textarea>
          </div>

          <div class="error-message" *ngIf="error">
            {{ error }}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="close()" [disabled]="isSubmitting">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" (click)="confirm()" [disabled]="isSubmitting">
            <div class="loading-spinner" *ngIf="isSubmitting"></div>
            {{ isSubmitting ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 0.5rem;
      max-width: 500px;
      width: 95%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .reason-field {
      margin-top: 1rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .form-textarea {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      resize: vertical;
      min-height: 80px;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .error-message {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class StatusChangeModalComponent {
  @Input() isOpen = false;
  @Input() item: ItemListDto | null = null;
  @Input() statusAction: StatusAction | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<{ item: ItemListDto; newStatus: string; reason?: string }>();

  reason = '';
  isSubmitting = false;
  error = '';

  constructor(private itemStatusService: ItemStatusService) {}

  getModalTitle(): string {
    if (!this.statusAction || !this.item) return '';
    return `${this.statusAction.label}`;
  }

  getConfirmationMessage(): string {
    if (!this.statusAction || !this.item) return '';
    return `Are you sure you want to mark "${this.item.title}" as ${this.statusAction.action.toLowerCase()}?`;
  }

  close() {
    this.reason = '';
    this.error = '';
    this.isSubmitting = false;
    this.closeModal.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  confirm() {
    if (!this.item || !this.statusAction) return;

    this.isSubmitting = true;
    this.error = '';

    this.itemStatusService.changeStatus(
      this.item.itemId,
      this.statusAction.action,
      this.reason || undefined
    ).subscribe({
      next: (response) => {
        this.statusChanged.emit({
          item: this.item!,
          newStatus: this.statusAction!.action,
          reason: this.reason || undefined
        });
        this.isSubmitting = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update item status';
        this.isSubmitting = false;
      }
    });
  }
}