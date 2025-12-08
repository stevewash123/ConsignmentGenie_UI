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
  styles: [`
    .notifications-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .notifications-header h1 {
      margin: 0;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .filter-bar label {
      font-weight: 500;
    }

    .form-select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
    }

    .loading-container {
      text-align: center;
      padding: 40px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px;
      color: #333;
    }

    .notifications-list {
      space-y: 1;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 8px;
      background-color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .notification-item:hover {
      border-color: #cbd5e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .notification-item.unread {
      background-color: #f8f9ff;
      border-left: 4px solid #007bff;
    }

    .notification-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 18px;
      flex-shrink: 0;
    }

    .notification-icon.item-sold {
      background-color: #dcfce7;
      color: #16a34a;
    }

    .notification-icon.payout-processed {
      background-color: #fef3c7;
      color: #d97706;
    }

    .notification-icon.payout-pending {
      background-color: #fef2f2;
      color: #dc2626;
    }

    .notification-icon.statement-ready {
      background-color: #e0e7ff;
      color: #4338ca;
    }

    .notification-icon.default {
      background-color: #f1f5f9;
      color: #64748b;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .notification-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .notification-time {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
    }

    .notification-message {
      margin: 0 0 8px;
      font-size: 13px;
      color: #4b5563;
      line-height: 1.4;
    }

    .notification-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .metadata-item {
      font-size: 11px;
      color: #6b7280;
      background-color: #f9fafb;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .btn:hover:not(:disabled) {
      background-color: #f8f9fa;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
      border-color: #6c757d;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .btn-outline {
      background-color: transparent;
      color: #6c757d;
    }

    .btn-outline:hover:not(:disabled) {
      background-color: #6c757d;
      color: white;
    }

    .btn-danger {
      color: #dc3545;
      border-color: #dc3545;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #dc3545;
      color: white;
    }

    .btn-link {
      background: none;
      border: none;
      color: #007bff;
      text-decoration: none;
      padding: 8px 0;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .pagination-container {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
    }

    .page-info {
      font-size: 14px;
      color: #6b7280;
    }

    .settings-link {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    @media (max-width: 768px) {
      .notification-item {
        flex-direction: column;
        gap: 10px;
      }

      .notification-header {
        flex-direction: column;
        gap: 5px;
      }

      .notification-actions {
        flex-direction: row;
        align-self: flex-end;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }
    }
  `]
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
    return this.notifications.some(n => !n.isRead);
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
          this.notifications = result.items;
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