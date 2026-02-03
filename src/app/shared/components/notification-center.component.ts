import { Component, OnInit, Input, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../services/notification.service';
import {
  NotificationDto,
  NotificationQueryParams as RealNotificationQueryParams,
  PagedResult,
  UserRole as RealUserRole
} from '../models/notification.models';

// Use the local types for component interface consistency
export type UserRole = 'owner' | 'consignor';

export type NotificationType =
  | 'manifest'
  | 'payout'
  | 'sale'
  | 'expiring'
  | 'agreement'
  | 'system';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  host: {
    '[class.theme-owner]': 'role === "owner"',
    '[class.theme-consignor]': 'role === "consignor"'
  }
})
export class NotificationCenterComponent implements OnInit {
  @Input() role: UserRole = 'owner';

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private notificationService = inject(NotificationService);

  // State signals
  notifications = signal<NotificationDto[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = 20;
  totalCount = signal(0);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));

  // Filter state
  selectedType = '';
  searchQuery = '';
  fromDate = '';
  toDate = '';
  showUnreadOnly = false;

  // Computed values
  unreadCount = computed(() => 
    this.notifications().filter(n => !n.isRead).length
  );

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: RealNotificationQueryParams = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };

    if (this.selectedType) params.type = this.selectedType;
    if (this.showUnreadOnly) params.unreadOnly = this.showUnreadOnly;

    this.notificationService.getNotifications(this.role as RealUserRole, params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.notifications.set(result.data || []);
          this.totalCount.set(result.totalCount || 0);
        },
        error: (err) => {
          this.error.set('Failed to load notifications');
          console.error('Error loading notifications:', err);
          this.notifications.set([]);
          this.totalCount.set(0);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadNotifications();
  }

  clearFilters(): void {
    this.selectedType = '';
    this.searchQuery = '';
    this.fromDate = '';
    this.toDate = '';
    this.showUnreadOnly = false;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedType || this.searchQuery || this.fromDate || this.toDate || this.showUnreadOnly);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadNotifications();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    // Ensure we show at least 5 pages if available
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // ============================================================================
  // Notification Actions
  // ============================================================================

  markAllAsRead(): void {
    this.notificationService.markAllAsRead(this.role as RealUserRole)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadNotifications(); // Refresh the list
        },
        error: (err) => {
          console.error('Error marking all notifications as read:', err);
          this.error.set('Failed to mark all notifications as read');
        }
      });
  }

  toggleReadStatus(notification: NotificationDto): void {
    const newStatus = !notification.isRead;

    if (newStatus) {
      // If marking as read, use the mark as read API
      this.notificationService.markAsRead(this.role as RealUserRole, notification.notificationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // Optimistic update
            const updated = this.notifications().map(n =>
              n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
            );
            this.notifications.set(updated);
          },
          error: (err) => {
            console.error('Error marking notification as read:', err);
            this.error.set('Failed to update notification status');
          }
        });
    } else {
      // For marking as unread, we'll just do optimistic update for now
      // (API doesn't have unread endpoint yet)
      const updated = this.notifications().map(n =>
        n.notificationId === notification.notificationId ? { ...n, isRead: false } : n
      );
      this.notifications.set(updated);
    }
  }

  deleteNotification(notification: NotificationDto): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(this.role as RealUserRole, notification.notificationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadNotifications(); // Refresh the list
          },
          error: (err) => {
            console.error('Error deleting notification:', err);
            this.error.set('Failed to delete notification');
          }
        });
    }
  }

  handleAction(notification: NotificationDto): void {
    if (notification.actionUrl) {
      // Mark as read when user takes action
      if (!notification.isRead) {
        this.toggleReadStatus(notification);
      }
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  // ============================================================================
  // Display Helpers
  // ============================================================================

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if same day
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if yesterday
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // Format as "Jan 15, 2025"
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      manifest: '📦',
      payout: '💰',
      sale: '🛒',
      expiring: '⏰',
      agreement: '📝',
      system: 'ℹ️'
    };
    return icons[type] || '🔔';
  }

  getActionItem(type: NotificationType): { icon: string; tooltip: string } {
    const actions: Record<NotificationType, { icon: string; tooltip: string }> = {
      manifest: { icon: '👁️', tooltip: 'View manifest details' },
      payout: { icon: '💳', tooltip: 'Process payout' },
      sale: { icon: '📊', tooltip: 'View sale details' },
      expiring: { icon: '📋', tooltip: 'Review expiring items' },
      agreement: { icon: '✍️', tooltip: 'View agreement' },
      system: { icon: '➡️', tooltip: 'View details' }
    };
    return actions[type] || { icon: '👁️', tooltip: 'View details' };
  }

  getActionButtonText(notification: NotificationDto): string {
    // Use custom text from metadata if available
    if (notification.metadata?.actionButtonText) {
      return notification.metadata.actionButtonText;
    }

    // Fallback to type-specific defaults
    const defaults: Record<string, string> = {
      manifest: 'View Manifest',
      dropoff_manifest: 'Review Import',
      payout: 'Process Payout',
      sale: 'View Sale',
      expiring: 'Review Items',
      agreement: 'View Agreement',
      system: 'View Details'
    };

    return defaults[notification.type] || 'View Details';
  }

  getActionButtonTooltip(notification: NotificationDto): string {
    // Use custom text from metadata if available
    if (notification.metadata?.actionButtonText) {
      return `Click to ${notification.metadata.actionButtonText.toLowerCase()}`;
    }

    return this.getActionItem(notification.type as NotificationType).tooltip;
  }

  hasActionableButton(notification: NotificationDto): boolean {
    // Hide button if no actionUrl
    if (!notification.actionUrl) {
      return false;
    }

    // Hide button if metadata explicitly sets actionButtonText to empty string or null
    if (notification.metadata?.actionButtonText === '' || notification.metadata?.actionButtonText === null) {
      return false;
    }

    // Hide button for system notifications that default to "View Details" with no real action
    if (notification.type === 'system' &&
        !notification.metadata?.actionButtonText &&
        (notification.title?.toLowerCase().includes('welcome') ||
         notification.message?.toLowerCase().includes('welcome'))) {
      return false;
    }

    return true;
  }

  trackById(index: number, notification: NotificationDto): string {
    return notification.notificationId;
  }

}
