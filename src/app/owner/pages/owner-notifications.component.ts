import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  templateUrl: './owner-notifications.component.html',
  styles: []
})
export class OwnerNotificationsComponent {}