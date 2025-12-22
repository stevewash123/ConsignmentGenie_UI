import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MockConsignorItemService,
  ConsignorItemDetailDto
} from '../../../services/mock-consignor-item.service';

export interface CreateReturnRequestDto {
  reason?: string;
}

@Component({
  selector: 'app-request-return',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './request-return.component.html',
  styleUrls: ['./request-return.component.scss']
})
export class RequestReturnComponent {
  @Input() item!: ConsignorItemDetailDto;
  @Input() show: boolean = false;
  @Output() closed = new EventEmitter<any>();

  reason: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private itemService: MockConsignorItemService
  ) {}

  get characterCount(): number {
    return this.reason.length;
  }

  get maxCharacters(): number {
    return 300;
  }

  get isSubmitDisabled(): boolean {
    return this.loading;
  }

  onCancel(): void {
    this.closed.emit(null);
  }

  onSubmit(): void {
    if (this.isSubmitDisabled) return;

    this.loading = true;
    this.error = null;

    const request: CreateReturnRequestDto = {
      reason: this.reason.trim() || undefined
    };

    // Mock service call - simulate network delay and success
    setTimeout(() => {
      this.loading = false;
      // Simulate successful return request
      const mockResponse = {
        id: 'return-request-' + Date.now(),
        itemId: this.item.id,
        reason: request.reason || '',
        requestDate: new Date(),
        status: 'pending'
      };
      this.closed.emit(mockResponse);
    }, 800);
  }
}