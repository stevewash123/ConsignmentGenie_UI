import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';
import { OwnerLayoutComponent } from '../components/owner-layout.component';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [NotificationCenterComponent, OwnerLayoutComponent],
  templateUrl: './owner-notifications.component.html',
  styleUrls: ['./owner-notifications.component.scss']
})
export class OwnerNotificationsComponent {}