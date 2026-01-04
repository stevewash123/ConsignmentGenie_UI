import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-owner-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  templateUrl: './owner-notification-preferences.component.html',
  styleUrls: ['./owner-notification-preferences.component.scss']
})
export class OwnerNotificationPreferencesComponent {}