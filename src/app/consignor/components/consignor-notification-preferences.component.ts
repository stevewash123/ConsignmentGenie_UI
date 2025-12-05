import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-consignor-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  template: `
    <app-notification-preferences role="consignor"></app-notification-preferences>
  `,
  styles: []
})
export class ConsignorNotificationPreferencesComponent {}