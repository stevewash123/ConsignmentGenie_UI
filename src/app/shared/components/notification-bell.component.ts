import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import {
  NotificationDto,
  UserRole
} from '../models/notification.models';
import { getNotificationIcon, getNotificationIconClass, getNotificationConfig } from '../config/notification.config';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-bell" #bellContainer>
      <!-- Bell Icon with Badge -->
      <button
        class="bell-button"
        (click)="toggleDropdown()"
        [class.active]="isDropdownOpen"
        type="button">
        <span class="bell-icon">🔔</span>
        <span
          *ngIf="unreadCount > 0"
          class="notification-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Dropdown -->
      <div
        *ngIf="isDropdownOpen"
        class="notification-dropdown"
        (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <div class="header-actions">
            <button
              *ngIf="unreadCount > 0"
              class="mark-all-read-btn"
              (click)="markAllAsRead()"
              [disabled]="loadingService.isLoading(loadingKey)">
              Mark all read
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loadingService.isLoading(loadingKey)" class="dropdown-loading">
          <div class="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>

        <!-- Notifications List -->
        <div *ngIf="!loadingService.isLoading(loadingKey)" class="notifications-list">
          <div
            *ngFor="let notification of recentNotifications; trackBy: trackByNotificationId"
            class="notification-item"
            [class.unread]="!notification.isRead"
            (click)="handleNotificationClick(notification)">

            <!-- Icon -->
            <div class="notification-icon" [ngClass]="getNotificationIconClass(notification.type)">
              {{ getNotificationIcon(notification.type) }}
            </div>

            <!-- Content -->
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ notification.timeAgo }}</div>
            </div>

            <!-- Mark as read button -->
            <button
              *ngIf="!notification.isRead"
              class="mark-read-btn"
              (click)="markAsRead(notification, $event)"
              title="Mark as read">
              ✓
            </button>
          </div>

          <!-- Empty State -->
          <div *ngIf="recentNotifications.length === 0" class="empty-state">
            <div class="empty-icon">🔔</div>
            <p>No notifications</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="dropdown-footer">
          <a
            [routerLink]="'/' + role + '/notifications'"
            class="view-all-link"
            (click)="closeDropdown()">
            View All Notifications
          </a>
        </div>
      </div>

      <!-- Backdrop -->
      <div
        *ngIf="isDropdownOpen"
        class="dropdown-backdrop"
        (click)="closeDropdown()">
      </div>
    </div>
  `,
  styles: [`
    .notification-bell {
      position: relative;
      display: inline-block;
    }

    .bell-button {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      min-height: 36px;
    }

    .bell-button:hover {
      background-color: rgba(0, 123, 255, 0.1);
    }

    .bell-button.active {
      background-color: rgba(0, 123, 255, 0.15);
    }

    .bell-icon {
      font-size: 20px;
      display: block;
      color: currentColor;
      opacity: 0.8;
    }

    .notification-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background-color: #dc3545;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 12px;
      min-width: 18px;
      text-align: center;
      line-height: 1.2;
    }

    .notification-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 380px;
      max-width: 90vw;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      max-height: 500px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dropdown-header {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f8f9fa;
    }

    .dropdown-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .mark-all-read-btn {
      background: none;
      border: none;
      color: #007bff;
      font-size: 13px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .mark-all-read-btn:hover:not(:disabled) {
      background-color: rgba(0, 123, 255, 0.1);
    }

    .mark-all-read-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .dropdown-loading {
      padding: 40px 20px;
      text-align: center;
      color: #6b7280;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #f8f9fa;
    }

    .notification-item:hover {
      background-color: #f8f9fa;
    }

    .notification-item.unread {
      background-color: #f0f7ff;
      border-left: 3px solid #007bff;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
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

    .notification-title {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .notification-message {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-time {
      font-size: 11px;
      color: #9ca3af;
    }

    .mark-read-btn {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      font-size: 12px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      margin-top: 2px;
    }

    .mark-read-btn:hover {
      background-color: #e5e7eb;
      color: #374151;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 32px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .dropdown-footer {
      padding: 12px 16px;
      border-top: 1px solid #f1f5f9;
      background-color: #f8f9fa;
    }

    .view-all-link {
      display: block;
      text-align: center;
      color: #007bff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .view-all-link:hover {
      background-color: rgba(0, 123, 255, 0.1);
      text-decoration: none;
    }

    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }

    @media (max-width: 480px) {
      .notification-dropdown {
        width: 320px;
        right: -16px;
      }

      .notification-item {
        padding: 10px 12px;
      }

      .dropdown-header {
        padding: 12px;
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() role: UserRole = 'provider';
  @ViewChild('bellContainer', { static: true }) bellContainer!: ElementRef;

  private destroy$ = new Subject<void>();

  isDropdownOpen = false;
  unreadCount = 0;
  recentNotifications: NotificationDto[] = [];
  loadingKey = 'bell-notifications';

  constructor(
    private notificationService: NotificationService,
    public loadingService: LoadingService,
    private router: Router
  ) {}

  private boundHandleDocumentClick = this.handleDocumentClick.bind(this);

  ngOnInit() {
    console.log(`NotificationBell component initialized for role: ${this.role}`);
    this.loadUnreadCount();
    this.loadRecentNotifications();

    // Subscribe to unread count changes
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });

    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadUnreadCount();
        if (this.isDropdownOpen) {
          this.loadRecentNotifications();
        }
      });

    // Close dropdown when clicking outside
    document.addEventListener('click', this.boundHandleDocumentClick, { passive: true });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.boundHandleDocumentClick);
  }

  private handleDocumentClick(event: Event) {
    const target = event.target as Node;
    if (target && !this.bellContainer.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount(this.role)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unreadCount = response.count;
        },
        error: (error) => {
          console.error('Error loading unread count:', error);
          // Set a default count to ensure component is visible
          this.unreadCount = 3;
        }
      });
  }

  loadRecentNotifications() {
    this.loadingService.start(this.loadingKey);

    this.notificationService.getNotifications(this.role, {
      page: 1,
      pageSize: 5,
      unreadOnly: false
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.recentNotifications = result.items;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          // Set some mock notifications for development
          this.recentNotifications = [];
        },
        complete: () => {
          this.loadingService.stop(this.loadingKey);
        }
      });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;

    if (this.isDropdownOpen) {
      this.loadRecentNotifications();
    }
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  markAsRead(notification: NotificationDto, event: Event) {
    event.stopPropagation();

    this.notificationService.markAsRead(this.role, notification.notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
  }

  markAllAsRead() {
    if (this.loadingService.isLoading(this.loadingKey)) {
      return;
    }

    this.notificationService.markAllAsRead(this.role)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.recentNotifications.forEach(n => n.isRead = true);
          this.unreadCount = 0;
        },
        error: (error) => {
          console.error('Error marking all notifications as read:', error);
        }
      });
  }

  handleNotificationClick(notification: NotificationDto) {
    if (!notification.isRead) {
      this.markAsRead(notification, new Event('click'));
    }

    // Close dropdown and navigate
    this.closeDropdown();

    // Navigation will be handled by the action URL if available
    const config = getNotificationConfig(notification.type);
    if (config) {
      const route = config.getRoute(notification, this.role);

      if (route) {
        // Use Angular Router to navigate - prevents page reload
        this.router.navigate([route]).catch(error => {
          console.error('Navigation error:', error);
        });
      }
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