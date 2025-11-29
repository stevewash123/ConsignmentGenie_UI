import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-owner-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  template: `
    <app-notification-preferences role="owner"></app-notification-preferences>
  `,
  styles: []
})
export class OwnerNotificationPreferencesComponent {}