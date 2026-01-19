import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// Import your layout component - adjust path as needed
// For Owner: import { OwnerLayoutComponent as LayoutComponent } from './owner-layout.component';
// For Consignor: import { ConsignorLayoutComponent as LayoutComponent } from './consignor-layout.component';

// Notification model interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    itemCount?: number;
    totalValue?: number;
    consignorName?: string;
    manifestId?: string;
    payoutId?: string;
    [key: string]: any;
  };
}

export type NotificationType = 
  | 'manifest' 
  | 'payout' 
  | 'sale' 
  | 'expiring' 
  | 'agreement' 
  | 'system';

export interface NotificationQueryParams {
  page: number;
  pageSize: number;
  type?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  unreadOnly?: boolean;
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    // LayoutComponent - uncomment and use appropriate layout
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  // private notificationService = inject(NotificationService); // Inject your notification service

  // State signals
  notifications = signal<Notification[]>([]);
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

    const params: NotificationQueryParams = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };

    if (this.selectedType) params.type = this.selectedType;
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.fromDate) params.fromDate = this.fromDate;
    if (this.toDate) params.toDate = this.toDate;
    if (this.showUnreadOnly) params.unreadOnly = true;

    // TODO: Replace with actual service call
    // this.notificationService.getNotifications(params)
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe({
    //     next: (result) => {
    //       this.notifications.set(result.items);
    //       this.totalCount.set(result.totalCount);
    //     },
    //     error: (err) => {
    //       this.error.set('Failed to load notifications');
    //       console.error('Error loading notifications:', err);
    //     },
    //     complete: () => {
    //       this.isLoading.set(false);
    //     }
    //   });

    // Mock data for demonstration
    setTimeout(() => {
      this.notifications.set(this.getMockNotifications());
      this.totalCount.set(25);
      this.isLoading.set(false);
    }, 500);
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
    // TODO: Call service to mark all as read
    // this.notificationService.markAllAsRead().subscribe(() => {
    //   this.loadNotifications();
    // });

    // Optimistic update
    const updated = this.notifications().map(n => ({ ...n, isRead: true }));
    this.notifications.set(updated);
  }

  toggleReadStatus(notification: Notification): void {
    const newStatus = !notification.isRead;
    
    // TODO: Call service to update read status
    // this.notificationService.updateReadStatus(notification.id, newStatus).subscribe();

    // Optimistic update
    const updated = this.notifications().map(n => 
      n.id === notification.id ? { ...n, isRead: newStatus } : n
    );
    this.notifications.set(updated);
  }

  deleteNotification(notification: Notification): void {
    // TODO: Add confirmation dialog if needed
    // TODO: Call service to delete
    // this.notificationService.delete(notification.id).subscribe(() => {
    //   this.loadNotifications();
    // });

    // Optimistic update
    const updated = this.notifications().filter(n => n.id !== notification.id);
    this.notifications.set(updated);
  }

  handleAction(notification: Notification): void {
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

  getActionIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      manifest: '👁️',
      payout: '💳',
      sale: '📊',
      expiring: '📋',
      agreement: '✍️',
      system: '➡️'
    };
    return icons[type] || '👁️';
  }

  trackById(index: number, notification: Notification): string {
    return notification.id;
  }

  // ============================================================================
  // Mock Data (remove in production)
  // ============================================================================

  private getMockNotifications(): Notification[] {
    return [
      {
        id: '1',
        type: 'manifest',
        title: 'New Item Manifest Submitted',
        message: 'provider1@microsaasbuilders.com submitted a manifest with 2 items ($110.00 total value)',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        isRead: false,
        actionUrl: '/owner/inventory?view=pending&manifestId=abc123',
        metadata: {
          itemCount: 2,
          totalValue: 110.00,
          manifestId: 'abc123'
        }
      },
      {
        id: '2',
        type: 'sale',
        title: 'Item Sold',
        message: 'Vintage Ceramic Vase sold for $45.00',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isRead: true,
        actionUrl: '/owner/sales/sale456',
        metadata: {
          totalValue: 45.00
        }
      },
      {
        id: '3',
        type: 'payout',
        title: 'Payout Ready',
        message: 'A payout of $325.50 is ready for Jane Smith',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isRead: false,
        actionUrl: '/owner/payouts/payout789',
        metadata: {
          totalValue: 325.50,
          consignorName: 'Jane Smith'
        }
      },
      {
        id: '4',
        type: 'expiring',
        title: 'Items Expiring Soon',
        message: '5 items are expiring within the next 7 days',
        createdAt: new Date(), // Today
        isRead: false,
        actionUrl: '/owner/inventory?filter=expiring-soon',
        metadata: {
          itemCount: 5
        }
      },
      {
        id: '5',
        type: 'agreement',
        title: 'Agreement Signed',
        message: 'John Doe has signed their consignment agreement',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        isRead: true,
        actionUrl: '/owner/consignors/consignor123',
        metadata: {
          consignorName: 'John Doe'
        }
      },
      {
        id: '6',
        type: 'system',
        title: 'System Update',
        message: 'New features are now available. Check out the updated inventory management tools.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        isRead: true
      }
    ];
  }
}
