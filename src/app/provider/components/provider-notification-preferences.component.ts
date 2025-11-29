import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-provider-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  template: `
    <app-notification-preferences role="provider"></app-notification-preferences>
  `,
  styles: []
})
export class ProviderNotificationPreferencesComponent {}