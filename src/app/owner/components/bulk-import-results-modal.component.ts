import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BulkImportResult {
  success: boolean;
  successfulImports: number;
  failedImports: number;
  totalItems: number;
  errors: string[];
  message?: string;
}

@Component({
  selector: 'app-bulk-import-results-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">
            <i [class]="getHeaderIcon()"></i>
            {{ getHeaderTitle() }}
          </h2>
          <button type="button" class="close-btn" (click)="close()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <div class="results-summary">
            <div class="summary-stats">
              <div class="stat-item success" *ngIf="result.successfulImports > 0">
                <i class="fas fa-check-circle"></i>
                <span class="stat-number">{{ result.successfulImports }}</span>
                <span class="stat-label">Successfully imported</span>
              </div>
              <div class="stat-item error" *ngIf="result.failedImports > 0">
                <i class="fas fa-exclamation-triangle"></i>
                <span class="stat-number">{{ result.failedImports }}</span>
                <span class="stat-label">Failed to import</span>
              </div>
            </div>
          </div>

          <!-- Error Details -->
          <div class="error-section" *ngIf="result.errors && result.errors.length > 0">
            <h3 class="error-title">
              <i class="fas fa-list"></i>
              Error Details
            </h3>
            <div class="error-list">
              <div class="error-item" *ngFor="let error of getDisplayErrors(); let i = index">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{ error }}</span>
              </div>
              <div class="more-errors" *ngIf="result.errors.length > maxDisplayErrors">
                <i class="fas fa-ellipsis-h"></i>
                <span>and {{ result.errors.length - maxDisplayErrors }} more errors</span>
              </div>
            </div>
          </div>

          <!-- Success Message -->
          <div class="success-section" *ngIf="result.success && result.errors.length === 0">
            <i class="fas fa-check-circle"></i>
            <p>All items were imported successfully!</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="sendToNotifications()"
            *ngIf="result.errors && result.errors.length > 0"
          >
            <i class="fas fa-bell"></i>
            Send to Notifications
          </button>
          <button type="button" class="btn btn-primary" (click)="close()">
            <i class="fas fa-check"></i>
            OK
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
      width: 100%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-title i {
      font-size: 1.1rem;
    }

    .close-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6b7280;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .results-summary {
      margin-bottom: 1.5rem;
    }

    .summary-stats {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      border-radius: 8px;
      min-width: 120px;
    }

    .stat-item.success {
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      color: #065f46;
    }

    .stat-item.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .stat-item i {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      margin-top: 0.25rem;
      text-align: center;
    }

    .error-section {
      margin-top: 1.5rem;
    }

    .error-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .error-list {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .error-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: #991b1b;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .error-item:last-child {
      margin-bottom: 0;
    }

    .error-item i {
      margin-top: 0.1rem;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .more-errors {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
      font-style: italic;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f3f4f6;
    }

    .success-section {
      text-align: center;
      color: #065f46;
      background: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 1rem;
    }

    .success-section i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .success-section p {
      margin: 0;
      font-weight: 500;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: #f9fafb;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .success .modal-title i {
      color: #059669;
    }

    .error .modal-title i {
      color: #dc2626;
    }

    .mixed .modal-title i {
      color: #d97706;
    }
  `]
})
export class BulkImportResultsModalComponent {
  @Input() result!: BulkImportResult;
  @Output() closed = new EventEmitter<void>();
  @Output() sendToNotificationsClicked = new EventEmitter<BulkImportResult>();

  maxDisplayErrors = 5;

  getHeaderTitle(): string {
    if (!this.result.success) {
      return 'Import Failed';
    } else if (this.result.failedImports > 0) {
      return 'Import Completed with Errors';
    } else {
      return 'Import Successful';
    }
  }

  getHeaderIcon(): string {
    if (!this.result.success) {
      return 'fas fa-exclamation-triangle error';
    } else if (this.result.failedImports > 0) {
      return 'fas fa-exclamation-triangle mixed';
    } else {
      return 'fas fa-check-circle success';
    }
  }

  getDisplayErrors(): string[] {
    return this.result.errors.slice(0, this.maxDisplayErrors);
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  sendToNotifications(): void {
    this.sendToNotificationsClicked.emit(this.result);
  }
}