import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-admin-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  templateUrl: './admin-notification-preferences.component.html',
  styleUrls: ['./admin-notification-preferences.component.scss']
})
export class AdminNotificationPreferencesComponent {}