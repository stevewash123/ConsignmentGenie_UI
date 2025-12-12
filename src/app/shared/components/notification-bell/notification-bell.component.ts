import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import { NotificationService, NotificationDto, NotificationCount } from '../../../services/notification.service';
import { RespondPriceChangeComponent } from '../../../consignor/components/modals/respond-price-change/respond-price-change.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RespondPriceChangeComponent],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current user (mock - would come from auth service in real app)
  private currentConsignorId = '1';

  // Notification state
  notifications = signal<NotificationDto[]>([]);
  notificationCount = signal<NotificationCount>({ total: 0, urgent: 0, priceChanges: 0 });
  isDropdownOpen = signal(false);

  // Modal state for price change responses
  selectedNotification = signal<NotificationDto | null>(null);
  showPriceChangeModal = signal(false);

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();

    // Poll for notifications every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadNotifications());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Computed properties for bell display
  bellIcon = computed(() => {
    const count = this.notificationCount();
    if (count.urgent > 0) return '🚨';
    if (count.total > 0) return '🔔';
    return '🔔';
  });

  bellClass = computed(() => {
    const count = this.notificationCount();
    if (count.urgent > 0) return 'bell-urgent pulsing';
    if (count.total > 0) return 'bell-active';
    return 'bell-default';
  });

  badgeText = computed(() => {
    const total = this.notificationCount().total;
    if (total === 0) return '';
    if (total > 99) return '99+';
    return total.toString();
  });

  hasNotifications = computed(() => this.notificationCount().total > 0);

  hasUrgentNotifications = computed(() => this.notificationCount().urgent > 0);

  // Load notifications from service
  private loadNotifications() {
    this.notificationService.getNotifications(this.currentConsignorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications.set(notifications);
      });

    this.notificationService.getNotificationCount(this.currentConsignorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.notificationCount.set(count);
      });
  }

  // Toggle dropdown visibility
  toggleDropdown() {
    this.isDropdownOpen.set(!this.isDropdownOpen());
  }

  // Close dropdown
  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  // Handle notification click
  onNotificationClick(notification: NotificationDto) {
    // Mark as read
    this.markAsRead(notification.id);

    // Handle different notification types
    if (notification.quickActionType === 'price_change_response') {
      this.selectedNotification.set(notification);
      this.showPriceChangeModal.set(true);
      this.closeDropdown();
    } else {
      // For other notifications, just mark as read or navigate
      console.log('Clicked notification:', notification.title);
    }
  }

  // Open email for notification
  openEmail(notification: NotificationDto, event: Event) {
    event.stopPropagation();
    // In a real app, this would open the email or navigate to email view
    window.open('mailto:?subject=' + encodeURIComponent(notification.title), '_blank');
  }

  // View full details for notification
  viewFullDetails(notification: NotificationDto, event: Event) {
    event.stopPropagation();
    // In a real app, this would navigate to the full detail page
    console.log('View full details for:', notification.title);
  }

  // Mark single notification as read
  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadNotifications(); // Refresh
      });
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notificationService.markAllAsRead(this.currentConsignorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadNotifications(); // Refresh
        this.closeDropdown();
      });
  }

  // Format time ago
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return '1d ago';
    } else {
      return `${diffInDays}d ago`;
    }
  }

  // Get category icon for notification
  getCategoryIcon(category: string): string {
    return this.notificationService.getCategoryIcon(category);
  }

  // Get category color for notification
  getCategoryColor(category: string): string {
    return this.notificationService.getCategoryColor(category);
  }

  // Handle price change modal events
  onPriceChangeModalClose() {
    this.showPriceChangeModal.set(false);
    this.selectedNotification.set(null);
  }

  onPriceChangeResponseSubmitted() {
    this.loadNotifications(); // Refresh notifications after response
    this.onPriceChangeModalClose();
  }

  // Check if notification is overdue
  isOverdue(notification: NotificationDto): boolean {
    return this.notificationService.isOverdue(notification);
  }

  // Handle click outside dropdown to close it
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell-container')) {
      this.closeDropdown();
    }
  }

  // Keyboard navigation support
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeDropdown();
    } else if (event.key === 'Enter' && this.isDropdownOpen()) {
      // Handle enter key for accessibility
      const notifications = this.notifications();
      if (notifications.length > 0) {
        this.onNotificationClick(notifications[0]);
      }
    }
  }

  // Get notification that needs modal display
  getPriceChangeNotification(): any {
    const notification = this.selectedNotification();
    if (!notification || !notification.relatedItemId) return null;

    // Convert NotificationDto to format expected by price change modal
    // In a real app, this would fetch the full price change notification
    return {
      id: `pcn-${notification.id}`,
      itemId: notification.relatedItemId,
      itemName: notification.relatedItemName || 'Unknown Item',
      itemImageUrl: 'https://picsum.photos/400x400?text=Item+Image',
      consignorId: notification.consignorId,
      consignorName: 'Current User',
      consignorEmail: 'user@example.com',
      currentPrice: 85.00, // Mock data - would come from API
      proposedPrice: 65.00,
      consignorCurrentEarnings: 51.00,
      consignorProposedEarnings: 39.00,
      commissionRate: 60,
      updatedMarketPrice: 60.00,
      ownerNote: 'Price adjustment based on market conditions.',
      daysListed: 60,
      status: 'pending',
      createdAt: notification.createdAt,
      emailToken: `token-${notification.id}-secure`
    };
  }

  // Track by function for ngFor optimization
  trackByNotificationId(index: number, notification: NotificationDto): string {
    return notification.id;
  }
}