import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  templateUrl: './owner-notifications.component.html',
  styleUrls: ['./owner-notifications.component.scss']
})
export class OwnerNotificationsComponent {}