import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SignalRNotificationsService } from '../../../services/signalr-notifications.service';
import { ToastNotification } from '../../../models/notifications.models';

@Component({
  selector: 'app-toast-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notifications.component.html',
  styleUrls: ['./toast-notifications.component.scss']
})
export class ToastNotificationsComponent implements OnInit, OnDestroy {
  notifications: ToastNotification[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private signalRService: SignalRNotificationsService) {}

  ngOnInit() {
    const notificationSub = this.signalRService.toastNotifications$.subscribe(
      notification => this.addNotification(notification)
    );
    this.subscriptions.push(notificationSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private addNotification(notification: ToastNotification) {
    this.notifications.unshift(notification);

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }

    // Keep only the latest 5 notifications visible
    if (this.notifications.length > 5) {
      this.notifications = this.notifications.slice(0, 5);
    }
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  getNotificationIcon(type: ToastNotification['type']): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  getNotificationClass(type: ToastNotification['type']): string {
    switch (type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      case 'info': return 'toast-info';
      default: return 'toast-info';
    }
  }

  executeAction(action: any) {
    if (action.action && typeof action.action === 'function') {
      action.action();
    }
  }
}