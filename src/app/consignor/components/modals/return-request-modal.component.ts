import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockConsignorItemService, ConsignorItemDetailDto } from '../../services/mock-consignor-item.service';

export interface CreateReturnRequestDto {
  itemId: string;
  reason: 'no_longer_selling' | 'need_it_back' | 'other';
  notes?: string;
  preferredPickup: string;
}

export interface ItemReturnRequestDto {
  id: string;
  itemId: string;
  itemName: string;
  itemThumbnailUrl: string;

  consignorId: string;
  consignorName: string;
  consignorPhone?: string;
  consignorEmail: string;

  reason: 'no_longer_selling' | 'need_it_back' | 'other';
  notes?: string;
  preferredPickup: string;

  status: 'pending' | 'ready' | 'completed' | 'declined';
  submittedDate: Date;
  readyDate?: Date;
  completedDate?: Date;
  declinedDate?: Date;
  declineReason?: string;

  pickupInstructions?: string;
}

@Component({
  selector: 'app-return-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './return-request-modal.component.html',
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

    .modal {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1.5rem 1.5rem 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
    }

    .close-button:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .item-preview {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .item-thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 0.375rem;
      object-fit: cover;
      background: #e5e7eb;
    }

    .item-info h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .item-price {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-label.required::after {
      content: ' *';
      color: #ef4444;
    }

    .form-select,
    .form-textarea {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: #111827;
      background: white;
    }

    .form-select:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      min-height: 80px;
      resize: vertical;
    }

    .info-note {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      color: #1e40af;
      margin-bottom: 1.5rem;
    }

    .info-icon {
      font-size: 1rem;
      margin-top: 0.1rem;
    }

    .modal-footer {
      padding: 0 1.5rem 1.5rem 1.5rem;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .loading-text {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 480px) {
      .modal {
        margin: 0;
        border-radius: 0;
        max-height: 100vh;
      }

      .modal-footer {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ReturnRequestModalComponent implements OnInit {
  @Input() item: ConsignorItemDetailDto | null = null;
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<ItemReturnRequestDto | null>();

  isSubmitting = false;

  requestForm = {
    reason: 'no_longer_selling' as 'no_longer_selling' | 'need_it_back' | 'other',
    notes: '',
    preferredPickup: 'weekday_afternoons'
  };

  reasonOptions = [
    { value: 'no_longer_selling', label: 'No longer want to sell' },
    { value: 'need_it_back', label: 'Need it back' },
    { value: 'other', label: 'Other' }
  ];

  pickupOptions = [
    { value: 'weekday_mornings', label: 'Weekday mornings (10am-12pm)' },
    { value: 'weekday_afternoons', label: 'Weekday afternoons (2pm-6pm)' },
    { value: 'weekend_mornings', label: 'Weekend mornings (10am-1pm)' },
    { value: 'weekend_afternoons', label: 'Weekend afternoons (2pm-5pm)' },
    { value: 'contact_me', label: 'Contact me to arrange' }
  ];

  constructor(private mockService: MockConsignorItemService) {}

  ngOnInit() {}

  close() {
    this.closed.emit(null);
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  canSubmit(): boolean {
    return !this.isSubmitting &&
           this.requestForm.reason !== null &&
           this.requestForm.preferredPickup !== '';
  }

  onSubmit() {
    if (!this.canSubmit() || !this.item) {
      return;
    }

    this.isSubmitting = true;

    const request: CreateReturnRequestDto = {
      itemId: this.item.id,
      reason: this.requestForm.reason,
      notes: this.requestForm.notes || undefined,
      preferredPickup: this.getPickupLabel(this.requestForm.preferredPickup)
    };

    this.mockService.requestItemReturn(this.item.id, request).subscribe({
      next: (returnRequest) => {
        this.isSubmitting = false;
        this.closed.emit(returnRequest);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting return request:', error);
        alert('Failed to submit return request. Please try again.');
      }
    });
  }

  private getPickupLabel(value: string): string {
    const option = this.pickupOptions.find(opt => opt.value === value);
    return option?.label || value;
  }

  private getReasonLabel(reason: string): string {
    const option = this.reasonOptions.find(opt => opt.value === reason);
    return option?.label || reason;
  }
}