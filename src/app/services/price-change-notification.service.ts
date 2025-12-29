import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, delay, map } from 'rxjs';
import { PriceChangeNotification, PriceChangeResponse, EmailActionRequest } from '../models/price-change-notification.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PriceChangeNotificationService {
  private readonly apiUrl = `${environment.apiUrl}/api/price-change-notifications`;

  // Mock data storage for demo
  private mockNotifications: PriceChangeNotification[] = [
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
      ownerNote: 'This has been listed for 60 days. Similar items have sold recently at lower prices. A reduction should help it move. Let me know what you\'d like to do!',
      daysListed: 60,
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      emailToken: 'token-pcn-1-secure'
    },
    {
      id: 'pcn-2',
      itemId: '6',
      itemName: 'Leather Boots',
      itemImageUrl: 'https://picsum.photos/400x400?text=Leather+Boots',
      consignorId: '2',
      consignorName: 'Bob Smith',
      consignorEmail: 'bob.smith@example.com',
      currentPrice: 120.00,
      proposedPrice: 95.00,
      consignorCurrentEarnings: 66.00,
      consignorProposedEarnings: 52.25,
      commissionRate: 55,
      ownerNote: 'These have been slow to move. I\'ve seen similar boots sell for around $90-100 recently.',
      daysListed: 45,
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      emailToken: 'token-pcn-2-secure'
    }
  ];

  private notificationsSubject = new BehaviorSubject<PriceChangeNotification[]>(this.mockNotifications);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get pending notifications for a consignor
  getPendingNotifications(consignorId: string): Observable<PriceChangeNotification[]> {
    // In a real app, this would be an HTTP call
    return this.notifications$.pipe(
      map(notifications =>
        notifications.filter(n =>
          n.consignorId === consignorId && n.status === 'pending'
        )
      )
    );
  }

  // Get notification count for badge
  getPendingCount(consignorId: string): Observable<number> {
    return this.getPendingNotifications(consignorId).pipe(
      map(notifications => notifications.length)
    );
  }

  // Get specific notification by ID
  getNotification(id: string): Observable<PriceChangeNotification | null> {
    return this.notifications$.pipe(
      map(notifications =>
        notifications.find(n => n.id === id) || null
      )
    );
  }

  // Submit response via in-app modal
  submitResponse(response: PriceChangeResponse): Observable<{success: boolean; message: string}> {
    return this.processResponse(response.notificationId, response.action, response.consignorNote).pipe(
      delay(1000) // Simulate network delay
    );
  }

  // Submit response via email token
  submitEmailResponse(request: EmailActionRequest): Observable<{success: boolean; message: string; notification?: PriceChangeNotification}> {
    // Find notification by token
    const notification = this.mockNotifications.find(n => n.emailToken === request.token);

    if (!notification) {
      return of({
        success: false,
        message: 'Invalid or expired link. Please try responding from your account.'
      }).pipe(delay(500));
    }

    if (notification.status !== 'pending') {
      return of({
        success: false,
        message: 'This price change proposal has already been responded to.',
        notification
      }).pipe(delay(500));
    }

    return this.processResponse(notification.id, request.action, request.consignorNote).pipe(
      map(result => ({
        ...result,
        notification
      })),
      delay(1000)
    );
  }

  // Send email notification (would be called by the owner's price change service)
  sendEmailNotification(notification: PriceChangeNotification): Observable<{success: boolean; emailSent: boolean}> {
    // In a real app, this would trigger an email send
    console.log('Email notification sent for price change:', notification);

    // Add to mock storage
    this.mockNotifications.push(notification);
    this.notificationsSubject.next([...this.mockNotifications]);

    return of({
      success: true,
      emailSent: true
    }).pipe(delay(500));
  }

  // Generate email content with action URLs
  generateEmailContent(notification: PriceChangeNotification, baseUrl: string): string {
    const acceptUrl = `${baseUrl}/price-change/respond?token=${notification.emailToken}&action=accept`;
    const keepCurrentUrl = `${baseUrl}/price-change/respond?token=${notification.emailToken}&action=keep_current`;
    const declineUrl = `${baseUrl}/price-change/respond?token=${notification.emailToken}&action=decline_and_retrieve`;

    // In a real app, you'd use a proper templating engine
    let template = this.getEmailTemplate();

    // Replace template variables
    template = template.replace(/\{\{itemName\}\}/g, notification.itemName);
    template = template.replace(/\{\{itemImageUrl\}\}/g, notification.itemImageUrl || '');
    template = template.replace(/\{\{daysListed\}\}/g, notification.daysListed.toString());
    template = template.replace(/\{\{commissionRate\}\}/g, notification.commissionRate.toString());
    template = template.replace(/\{\{currentPrice\}\}/g, notification.currentPrice.toFixed(2));
    template = template.replace(/\{\{consignorCurrentEarnings\}\}/g, notification.consignorCurrentEarnings.toFixed(2));
    template = template.replace(/\{\{proposedPrice\}\}/g, notification.proposedPrice.toFixed(2));
    template = template.replace(/\{\{consignorProposedEarnings\}\}/g, notification.consignorProposedEarnings.toFixed(2));
    template = template.replace(/\{\{updatedMarketPrice\}\}/g, notification.updatedMarketPrice?.toFixed(2) || '');
    template = template.replace(/\{\{ownerNote\}\}/g, notification.ownerNote || '');
    template = template.replace(/\{\{acceptUrl\}\}/g, acceptUrl);
    template = template.replace(/\{\{keepCurrentUrl\}\}/g, keepCurrentUrl);
    template = template.replace(/\{\{declineUrl\}\}/g, declineUrl);
    template = template.replace(/\{\{shopName\}\}/g, 'Your Consignment Shop');

    return template;
  }

  private processResponse(notificationId: string, action: string, consignorNote?: string): Observable<{success: boolean; message: string}> {
    const notification = this.mockNotifications.find(n => n.id === notificationId);

    if (!notification) {
      return of({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.status !== 'pending') {
      return of({
        success: false,
        message: 'This price change has already been responded to'
      });
    }

    // Update notification status
    notification.status = action as any;
    notification.respondedAt = new Date();
    notification.consignorNote = consignorNote;

    // Update the subject to notify subscribers
    this.notificationsSubject.next([...this.mockNotifications]);

    let message = '';
    switch (action) {
      case 'accept':
        message = `Price updated to ${notification.proposedPrice.toFixed(2)}. Your new earnings: ${notification.consignorProposedEarnings.toFixed(2)}`;
        break;
      case 'keep_current':
        message = `Item will continue at current price of ${notification.currentPrice.toFixed(2)}`;
        break;
      case 'decline_and_retrieve':
        message = 'Item has been marked for pickup. Please contact the shop to arrange collection.';
        break;
    }

    return of({
      success: true,
      message
    });
  }

  private getEmailTemplate(): string {
    // In a real app, this would load from a file or template service
    return `
    <html>
    <body>
      <h2>Price Change Proposal: \{\{itemName\}\}</h2>
      <p>Current Price: $\{\{currentPrice\}\} → Proposed Price: $\{\{proposedPrice\}\}</p>
      <p>Your Earnings: $\{\{consignorCurrentEarnings\}\} → $\{\{consignorProposedEarnings\}\}</p>
      \{\{#if ownerNote\}\}<p>Note: \{\{ownerNote\}\}</p>\{\{/if\}\}

      <a href="\{\{acceptUrl\}\}">Accept $\{\{proposedPrice\}\}</a> |
      <a href="\{\{keepCurrentUrl\}\}">Keep Current $\{\{currentPrice\}\}</a> |
      <a href="\{\{declineUrl\}\}">Decline & Retrieve</a>
    </body>
    </html>`;
  }
}