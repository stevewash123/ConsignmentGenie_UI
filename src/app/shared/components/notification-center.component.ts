import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
import { NOTIFICATION_TYPES, getNotificationTypeLabel } from '../constants/notification-types';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
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
    { value: NOTIFICATION_TYPES.ITEM_SOLD, label: getNotificationTypeLabel(NOTIFICATION_TYPES.ITEM_SOLD) },
    { value: NOTIFICATION_TYPES.PAYOUT_PROCESSED, label: getNotificationTypeLabel(NOTIFICATION_TYPES.PAYOUT_PROCESSED) },
    { value: NOTIFICATION_TYPES.PAYOUT_READY, label: getNotificationTypeLabel(NOTIFICATION_TYPES.PAYOUT_READY) },
    { value: NOTIFICATION_TYPES.NEW_PROVIDER_REQUEST, label: getNotificationTypeLabel(NOTIFICATION_TYPES.NEW_PROVIDER_REQUEST) },
    { value: NOTIFICATION_TYPES.DROPOFF_MANIFEST, label: getNotificationTypeLabel(NOTIFICATION_TYPES.DROPOFF_MANIFEST) },
    { value: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING, label: getNotificationTypeLabel(NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING) },
    { value: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT, label: getNotificationTypeLabel(NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT) }
  ];

  constructor(
    private notificationService: NotificationService,
    public loadingService: LoadingService,
    private router: Router
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

  handleNotificationClick(notification: NotificationDto, event?: Event) {
    // Don't handle clicks on buttons or other interactive elements
    if (event && event.target) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        console.log('🚫 Ignoring notification click - target is button');
        return;
      }
    }

    console.log('🔔 NotificationCenter: handleNotificationClick called!', {
      notification,
      actionUrl: notification.actionUrl,
      type: notification.type,
      target: event?.target
    });

    if (!notification.isRead) {
      this.markAsRead(notification, new Event('click'));
    }

    // Navigate to related entity if actionUrl exists
    if (notification.actionUrl) {
      // Navigation handled by Router in the template via routerLink
      console.log('🧭 Navigate to actionUrl:', notification.actionUrl);
      this.router.navigate([notification.actionUrl]);
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

  testButtonClick() {
    console.log('🧪 TEST: Button click handler works!');
  }

  openBulkImportWithManifest(notification: NotificationDto, event: Event) {
    console.log('🚀 NotificationCenter: openBulkImportWithManifest called!', {
      notification,
      referenceId: notification.referenceId,
      relatedEntityId: notification.relatedEntityId, // Check legacy too
      type: notification.type,
      event,
      eventType: event.type,
      target: event.target
    });

    event.stopPropagation();
    event.preventDefault(); // Also prevent default behavior

    // Mark notification as read if not already
    if (!notification.isRead) {
      this.markAsRead(notification, event);
    }

    // Check both modern and legacy properties
    const manifestId = notification.referenceId || notification.relatedEntityId;

    // Navigate to inventory list with manifest ID parameter to trigger bulk import modal
    if (manifestId) {
      console.log('🧭 NotificationCenter: Navigating to inventory with params:', {
        manifestId: manifestId,
        openBulkImport: 'true'
      });

      this.router.navigate(['/owner/inventory'], {
        queryParams: {
          manifestId: manifestId,
          openBulkImport: 'true'
        }
      }).then(
        success => console.log('✅ Navigation successful:', success),
        error => console.error('❌ Navigation failed:', error)
      );
    } else {
      console.warn('⚠️ NotificationCenter: No manifestId found in notification', {
        referenceId: notification.referenceId,
        relatedEntityId: notification.relatedEntityId
      });
    }
  }
}