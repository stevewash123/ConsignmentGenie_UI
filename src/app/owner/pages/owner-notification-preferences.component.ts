import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-owner-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  templateUrl: './owner-notification-preferences.component.html',
  styles: []
})
export class OwnerNotificationPreferencesComponent {}