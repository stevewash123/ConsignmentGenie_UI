import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import {
  NotificationDto,
  NotificationQueryParams,
  PagedResult,
  UserRole
} from '../models/notification.models';
import { getNotificationIcon, getNotificationIconClass } from '../config/notification.config';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './notification-center.component.html',
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  @Input() role: UserRole = 'consignor';

  private destroy$ = new Subject<void>();

  notifications: NotificationDto[] = [];
  pagedResult: PagedResult<NotificationDto> | null = null;
  showUnreadOnly = false;
  selectedType = '';
  currentPage = 1;
  pageSize = 10;

  loadingKey = 'notifications';

  availableTypes: { value: string; label: string }[] = [
    { value: 'item_sold', label: 'Item Sold' },
    { value: 'payout_processed', label: 'Payout Processed' },
    { value: 'payout_pending', label: 'Payout Pending' },
    { value: 'statement_ready', label: 'Statement Ready' },
    { value: 'new_provider_request', label: 'consignor Request' },
    { value: 'subscription_reminder', label: 'Subscription' },
    { value: 'system_announcement', label: 'Announcements' }
  ];

  constructor(
    private notificationService: NotificationService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadNotifications();

    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadNotifications());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasUnreadNotifications(): boolean {
    return this.notifications?.some(n => !n.isRead) ?? false;
  }

  loadNotifications() {
    this.loadingService.start(this.loadingKey);

    const query: NotificationQueryParams = {
      unreadOnly: this.showUnreadOnly,
      type: this.selectedType || undefined,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.notificationService.getNotifications(this.role, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.pagedResult = result;
          this.notifications = result.data;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
        },
        complete: () => {
          this.loadingService.stop(this.loadingKey);
        }
      });
  }

  toggleUnreadOnly() {
    this.showUnreadOnly = !this.showUnreadOnly;
    this.currentPage = 1;
    this.loadNotifications();
  }

  markAsRead(notification: NotificationDto, event: Event) {
    event.stopPropagation();

    if (this.loadingService.isLoading(this.loadingKey)) {
      return;
    }

    this.loadingService.start(this.loadingKey);

    this.notificationService.markAsRead(this.role, notification.notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.isRead = true;
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        },
        complete: () => {
          this.loadingService.stop(this.loadingKey);
        }
      });
  }

  markAllAsRead() {
    if (this.loadingService.isLoading(this.loadingKey)) {
      return;
    }

    this.loadingService.start(this.loadingKey);

    this.notificationService.markAllAsRead(this.role)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.forEach(n => n.isRead = true);
        },
        error: (error) => {
          console.error('Error marking all notifications as read:', error);
        },
        complete: () => {
          this.loadingService.stop(this.loadingKey);
        }
      });
  }

  deleteNotification(notification: NotificationDto, event: Event) {
    event.stopPropagation();

    if (this.loadingService.isLoading(this.loadingKey)) {
      return;
    }

    if (confirm('Are you sure you want to delete this notification?')) {
      this.loadingService.start(this.loadingKey);

      this.notificationService.deleteNotification(this.role, notification.notificationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notifications = this.notifications.filter(n => n.notificationId !== notification.notificationId);
          },
          error: (error) => {
            console.error('Error deleting notification:', error);
          },
          complete: () => {
            this.loadingService.stop(this.loadingKey);
          }
        });
    }
  }

  handleNotificationClick(notification: NotificationDto) {
    if (!notification.isRead) {
      this.markAsRead(notification, new Event('click'));
    }

    // Navigate to related entity if actionUrl exists
    if (notification.actionUrl) {
      // Navigation handled by Router in the template via routerLink
      console.log('Navigate to:', notification.actionUrl);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && this.pagedResult && page <= this.pagedResult.totalPages) {
      this.currentPage = page;
      this.loadNotifications();
    }
  }

  trackByNotificationId(index: number, notification: NotificationDto): string {
    return notification.notificationId;
  }

  getNotificationIcon(type: string): string {
    return getNotificationIcon(type as any);
  }

  getNotificationIconClass(type: string): string {
    return getNotificationIconClass(type as any);
  }
}