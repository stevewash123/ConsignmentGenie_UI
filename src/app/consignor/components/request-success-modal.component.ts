import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayoutRequest } from '../models/consignor.models';

@Component({
  selector: 'app-request-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="show && payoutRequest" (click)="onBackdropClick($event)">
      <div class="modal-container">
        <!-- Success Content -->
        <div class="success-content">
          <div class="success-icon">✓</div>
          <h2 class="success-title">Request Submitted</h2>
          <p class="success-message">
            Your payout request for <strong>\${{ payoutRequest.amount.toFixed(2) }}</strong> has been
            sent to the shop. You'll be notified when it's processed.
          </p>
          <button class="done-button" (click)="onDone()">
            Done
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

    .modal-container {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 400px;
      width: 100%;
    }

    .success-content {
      padding: 3rem 2rem;
      text-align: center;
    }

    .success-icon {
      width: 4rem;
      height: 4rem;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: white;
      font-weight: bold;
      margin: 0 auto 1.5rem;
    }

    .success-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 1rem;
    }

    .success-message {
      color: #6b7280;
      line-height: 1.6;
      margin: 0 0 2rem;
    }

    .success-message strong {
      color: #059669;
      font-weight: 600;
    }

    .done-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 2rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .done-button:hover {
      background: #2563eb;
    }

    @media (max-width: 768px) {
      .modal-overlay {
        padding: 0.5rem;
      }

      .success-content {
        padding: 2rem 1.5rem;
      }

      .done-button {
        width: 100%;
      }
    }
  `]
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