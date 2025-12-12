import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PriceChangeNotificationService } from '../services/price-change-notification.service';
import { EmailActionRequest } from '../models/price-change-notification.model';

@Component({
  selector: 'app-price-change-response',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="response-page">
      <div class="container">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading()">
          <div class="loading-spinner"></div>
          <h2>Processing your response...</h2>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error() && !isLoading()">
          <div class="error-icon">⚠️</div>
          <h2>Unable to Process Response</h2>
          <p>{{ error() }}</p>
          <div class="actions">
            <a href="/login" class="btn-primary">Log In to Your Account</a>
          </div>
        </div>

        <!-- Confirmation Form -->
        <div class="confirmation-form" *ngIf="!isLoading() && !error() && !isCompleted()">
          <div class="header">
            <h1>Confirm Your Decision</h1>
            <p>You're responding to a price change proposal for:</p>
          </div>

          <div class="item-summary" *ngIf="notification()">
            <div class="item-thumbnail">
              <img
                *ngIf="notification()!.itemImageUrl"
                [src]="notification()!.itemImageUrl"
                [alt]="notification()!.itemName"
                class="thumbnail-image">
              <div class="no-image" *ngIf="!notification()!.itemImageUrl">📷</div>
            </div>
            <div class="item-info">
              <h3>{{ notification()!.itemName }}</h3>
              <p>Listed {{ notification()!.daysListed }} days ago</p>
            </div>
          </div>

          <div class="pricing-summary" *ngIf="notification()">
            <div class="pricing-row">
              <span class="label">Current Price:</span>
              <span class="value">\${{ notification()!.currentPrice | number:'1.2-2' }}</span>
            </div>
            <div class="pricing-row">
              <span class="label">Proposed Price:</span>
              <span class="value decrease">\${{ notification()!.proposedPrice | number:'1.2-2' }}</span>
            </div>
            <div class="pricing-row">
              <span class="label">Your Current Earnings:</span>
              <span class="value">\${{ notification()!.consignorCurrentEarnings | number:'1.2-2' }}</span>
            </div>
            <div class="pricing-row">
              <span class="label">Your New Earnings:</span>
              <span class="value decrease">\${{ notification()!.consignorProposedEarnings | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="action-confirmation">
            <div class="selected-action" [class]="getActionClass()">
              <div class="action-icon">{{ getActionIcon() }}</div>
              <div class="action-text">
                <h3>{{ getActionTitle() }}</h3>
                <p>{{ getActionDescription() }}</p>
              </div>
            </div>

            <div class="note-section">
              <label for="consignorNote">Add a note (optional):</label>
              <textarea
                id="consignorNote"
                [(ngModel)]="consignorNote"
                rows="3"
                placeholder="Let the shop owner know your thoughts..."
                class="form-control">
              </textarea>
            </div>

            <div class="actions">
              <button type="button" class="btn-secondary" (click)="goBack()">
                Change My Mind
              </button>
              <button
                type="button"
                class="btn-primary"
                [class]="getActionClass() + '-btn'"
                (click)="confirmAction()"
                [disabled]="isSubmitting()">
                {{ isSubmitting() ? 'Confirming...' : 'Confirm Decision' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div class="success-state" *ngIf="isCompleted() && !error()">
          <div class="success-icon">✅</div>
          <h2>Response Submitted!</h2>
          <p class="success-message">{{ successMessage() }}</p>
          <div class="actions">
            <a href="/login" class="btn-primary">Access Your Account</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .response-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .loading-state, .error-state, .success-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #059669;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon, .success-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .confirmation-form {
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .header h1 {
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }

    .header p {
      color: #6b7280;
      margin: 0;
    }

    .item-summary {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .item-thumbnail {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .thumbnail-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      color: #6b7280;
      font-size: 2rem;
    }

    .item-info h3 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .item-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .pricing-summary {
      background: #f9fafb;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .pricing-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .pricing-row:last-child {
      border-bottom: none;
    }

    .pricing-row .label {
      color: #6b7280;
      font-weight: 500;
    }

    .pricing-row .value {
      color: #1f2937;
      font-weight: 600;
    }

    .pricing-row .value.decrease {
      color: #dc2626;
    }

    .action-confirmation {
      margin-bottom: 2rem;
    }

    .selected-action {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1.5rem;
      border-radius: 8px;
      border: 2px solid;
      margin-bottom: 1.5rem;
    }

    .selected-action.accept {
      background: #ecfdf5;
      border-color: #10b981;
      color: #065f46;
    }

    .selected-action.keep_current {
      background: #f3f4f6;
      border-color: #6b7280;
      color: #374151;
    }

    .selected-action.decline_and_retrieve {
      background: #fef2f2;
      border-color: #ef4444;
      color: #991b1b;
    }

    .action-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .action-text h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
    }

    .action-text p {
      margin: 0;
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .note-section {
      margin-bottom: 1.5rem;
    }

    .note-section label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #374151;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      resize: vertical;
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: #059669;
      outline: 0;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      transition: all 0.15s ease-in-out;
    }

    .btn-primary {
      background: #059669;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #047857;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .accept-btn {
      background: #10b981;
    }

    .accept-btn:hover:not(:disabled) {
      background: #059669;
    }

    .decline_and_retrieve-btn {
      background: #ef4444;
    }

    .decline_and_retrieve-btn:hover:not(:disabled) {
      background: #dc2626;
    }

    .success-message {
      color: #059669;
      font-size: 1.125rem;
      margin: 1rem 0;
    }

    @media (max-width: 768px) {
      .response-page {
        padding: 1rem;
      }

      .container {
        margin: 0;
      }

      .confirmation-form {
        padding: 1.5rem;
      }

      .item-summary {
        flex-direction: column;
        text-align: center;
      }

      .pricing-row {
        flex-direction: column;
        gap: 0.25rem;
      }

      .selected-action {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
      }

      .actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class PriceChangeResponseComponent implements OnInit {
  notification = signal<any>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  isCompleted = signal(false);
  error = signal<string | null>(null);
  successMessage = signal('');

  token = '';
  action = '';
  consignorNote = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: PriceChangeNotificationService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.action = params['action'];

      if (!this.token || !this.action) {
        this.error.set('Invalid or missing parameters in the link.');
        this.isLoading.set(false);
        return;
      }

      this.loadNotificationByToken();
    });
  }

  private loadNotificationByToken() {
    // In a real app, this would validate the token and load the notification
    // For now, we'll simulate this with our mock service
    const mockNotifications = [
      {
        id: 'pcn-1',
        itemId: '1',
        itemName: 'Vintage Coach Handbag',
        itemImageUrl: 'https://picsum.photos/400x400?text=Coach+Handbag',
        consignorId: '1',
        consignorName: 'Jane Doe',
        consignorEmail: 'jane.doe@example.com',
        currentPrice: 85.00,
        proposedPrice: 65.00,
        consignorCurrentEarnings: 51.00,
        consignorProposedEarnings: 39.00,
        commissionRate: 60,
        updatedMarketPrice: 60.00,
        ownerNote: 'This has been listed for 60 days. Similar items have sold recently at lower prices.',
        daysListed: 60,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        emailToken: 'token-pcn-1-secure'
      }
    ];

    const notification = mockNotifications.find(n => n.emailToken === this.token);

    if (!notification) {
      this.error.set('This link has expired or is invalid. Please try responding from your account.');
      this.isLoading.set(false);
      return;
    }

    if (notification.status !== 'pending') {
      this.error.set('You have already responded to this price change proposal.');
      this.isLoading.set(false);
      return;
    }

    this.notification.set(notification);
    this.isLoading.set(false);
  }

  getActionClass(): string {
    return this.action;
  }

  getActionIcon(): string {
    switch (this.action) {
      case 'accept': return '✅';
      case 'keep_current': return '📍';
      case 'decline_and_retrieve': return '📦';
      default: return '❓';
    }
  }

  getActionTitle(): string {
    const notification = this.notification();
    if (!notification) return '';

    switch (this.action) {
      case 'accept': return `Accept $${notification.proposedPrice.toFixed(2)}`;
      case 'keep_current': return `Keep Current $${notification.currentPrice.toFixed(2)}`;
      case 'decline_and_retrieve': return 'Decline & Retrieve Item';
      default: return 'Unknown Action';
    }
  }

  getActionDescription(): string {
    const notification = this.notification();
    if (!notification) return '';

    switch (this.action) {
      case 'accept':
        return `Your earnings will be $${notification.consignorProposedEarnings.toFixed(2)}`;
      case 'keep_current':
        return 'Item will continue at current price and stay listed';
      case 'decline_and_retrieve':
        return 'Item will be removed and ready for pickup';
      default:
        return '';
    }
  }

  confirmAction() {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const request: EmailActionRequest = {
      token: this.token,
      action: this.action as any,
      consignorNote: this.consignorNote.trim() || undefined
    };

    this.notificationService.submitEmailResponse(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set(response.message);
          this.isCompleted.set(true);
        } else {
          this.error.set(response.message);
        }
      },
      error: (error) => {
        console.error('Error submitting response:', error);
        this.error.set('An error occurred while submitting your response. Please try again.');
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  goBack() {
    window.history.back();
  }
}