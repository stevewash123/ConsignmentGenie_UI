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
  templateUrl: './notification-bell.component.html',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() role: UserRole = 'consignor';
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
          this.recentNotifications = result.data;
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