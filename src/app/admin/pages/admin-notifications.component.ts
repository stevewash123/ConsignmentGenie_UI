import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  template: `
    <app-notification-center role="admin"></app-notification-center>
  `,
  styles: []
})
export class AdminNotificationsComponent {}