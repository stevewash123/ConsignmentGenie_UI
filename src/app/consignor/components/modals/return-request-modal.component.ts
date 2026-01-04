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