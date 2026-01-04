import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemListDto, ItemStatus } from '../../models/inventory.model';
import { ItemStatusService, StatusAction } from '../../services/item-status.service';

@Component({
  selector: 'app-status-change-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './status-change-modal.component.html',
  styleUrls: ['./status-change-modal.component.scss']
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