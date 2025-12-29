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
  templateUrl: './price-change-response.component.html',
  styleUrls: ['./price-change-response.component.scss']
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