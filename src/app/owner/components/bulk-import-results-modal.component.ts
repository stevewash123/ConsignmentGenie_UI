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
  templateUrl: './bulk-import-results-modal.component.html',
  styleUrls: ['./bulk-import-results-modal.component.scss']
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