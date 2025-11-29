import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-admin-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  template: `
    <app-notification-preferences role="admin"></app-notification-preferences>
  `,
  styles: []
})
export class AdminNotificationPreferencesComponent {}