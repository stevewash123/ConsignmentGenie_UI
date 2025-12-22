import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, combineLatest } from 'rxjs';
import { PriceChangeNotificationService } from './price-change-notification.service';

export interface NotificationCount {
  total: number;
  urgent: number;
  priceChanges: number;
  // Add other notification types here in the future
}

export interface NotificationDto {
  id: string;
  type: 'price_change' | 'sale_completed' | 'payout_processed' | 'item_listed' | 'payment_failed' | 'system_error';
  title: string;
  message: string;
  priority: 'normal' | 'urgent';
  category: 'positive' | 'informational' | 'action_required' | 'urgent';
  quickActionType?: 'price_change_response' | 'approval_required' | null;
  emailSent: boolean;
  emailSentAt?: Date;
  canResendEmail: boolean;
  isRead: boolean;
  createdAt: Date;
  consignorId: string;
  relatedItemId?: string;
  relatedItemName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private mockNotifications: NotificationDto[] = [
    {
      id: 'notif-1',
      type: 'price_change',
      title: 'Price Change Response Needed',
      message: 'Jane Doe proposed to lower your Coach Handbag from $85 to $65',
      priority: 'urgent',
      category: 'action_required',
      quickActionType: 'price_change_response',
      emailSent: true,
      emailSentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      canResendEmail: true,
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      consignorId: '1',
      relatedItemId: '1',
      relatedItemName: 'Vintage Coach Handbag'
    },
    {
      id: 'notif-2',
      type: 'sale_completed',
      title: 'Item Sold!',
      message: 'Your Coach Bag sold for $85',
      priority: 'normal',
      category: 'positive',
      quickActionType: null,
      emailSent: true,
      emailSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      canResendEmail: false,
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      consignorId: '1',
      relatedItemId: '2',
      relatedItemName: 'Coach Bag'
    },
    {
      id: 'notif-3',
      type: 'item_listed',
      title: 'New Consignor Registered',
      message: 'A new consignor has joined your shop',
      priority: 'normal',
      category: 'informational',
      quickActionType: null,
      emailSent: true,
      emailSentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      canResendEmail: false,
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      consignorId: '1'
    },
    {
      id: 'notif-4',
      type: 'payout_processed',
      title: 'Statement Ready',
      message: 'Your monthly statement is ready for download',
      priority: 'normal',
      category: 'informational',
      quickActionType: null,
      emailSent: false,
      emailSentAt: undefined,
      canResendEmail: false,
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      consignorId: '1'
    }
  ];

  constructor(private priceChangeService: PriceChangeNotificationService) {}

  // Get all notifications for a consignor
  getNotifications(consignorId: string): Observable<NotificationDto[]> {
    const userNotifications = this.mockNotifications.filter(n => n.consignorId === consignorId);
    return new BehaviorSubject(userNotifications).asObservable();
  }

  // Get notification count for a consignor
  getNotificationCount(consignorId: string): Observable<NotificationCount> {
    return combineLatest([
      this.priceChangeService.getPendingCount(consignorId),
      this.getNotifications(consignorId)
    ]).pipe(
      map(([priceChanges, allNotifications]) => {
        const unreadNotifications = allNotifications.filter(n => !n.isRead);
        const urgentNotifications = unreadNotifications.filter(n => n.priority === 'urgent');

        return {
          total: unreadNotifications.length,
          urgent: urgentNotifications.length,
          priceChanges
        };
      })
    );
  }

  // Check if user has any pending notifications
  hasPendingNotifications(consignorId: string): Observable<boolean> {
    return this.getNotificationCount(consignorId).pipe(
      map(counts => counts.total > 0)
    );
  }

  // Check if user has urgent notifications
  hasUrgentNotifications(consignorId: string): Observable<boolean> {
    return this.getNotificationCount(consignorId).pipe(
      map(counts => counts.urgent > 0)
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<boolean> {
    const notification = this.mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
    return new BehaviorSubject(true).asObservable();
  }

  // Mark all notifications as read for a consignor
  markAllAsRead(consignorId: string): Observable<boolean> {
    this.mockNotifications
      .filter(n => n.consignorId === consignorId)
      .forEach(n => n.isRead = true);
    return new BehaviorSubject(true).asObservable();
  }

  // Get notification category color
  getCategoryColor(category: string): string {
    switch (category) {
      case 'positive': return 'text-green-600';
      case 'informational': return 'text-blue-600';
      case 'action_required': return 'text-yellow-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  // Get notification category icon
  getCategoryIcon(category: string): string {
    switch (category) {
      case 'positive': return '💚';
      case 'informational': return '💙';
      case 'action_required': return '⚠️';
      case 'urgent': return '🚨';
      default: return '📄';
    }
  }

  // Check if notification is old and needs urgent attention
  isOverdue(notification: NotificationDto): boolean {
    if (notification.priority !== 'urgent') return false;

    const daysSinceCreated = (Date.now() - notification.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated > 3; // Urgent if over 3 days old
  }
}