import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  template: `
    <app-notification-center role="owner"></app-notification-center>
  `,
  styles: []
})
export class OwnerNotificationsComponent {}