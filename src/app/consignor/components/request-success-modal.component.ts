import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayoutRequest } from '../models/consignor.models';

@Component({
  selector: 'app-request-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-success-modal.component.html',
  styleUrls: ['./request-success-modal.component.scss']
})
export class RequestSuccessModalComponent {
  @Input() show = false;
  @Input() payoutRequest: PayoutRequest | null = null;
  @Output() close = new EventEmitter<void>();

  onDone() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onDone();
    }
  }
}