import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';
import { OwnerLayoutComponent } from '../components/owner-layout.component';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [NotificationCenterComponent, OwnerLayoutComponent],
  templateUrl: './owner-notifications.component.html',
  styles: []
})
export class OwnerNotificationsComponent {}