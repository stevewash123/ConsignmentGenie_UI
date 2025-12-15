import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  templateUrl: './admin-notifications.component.html',
  styles: []
})
export class AdminNotificationsComponent {}