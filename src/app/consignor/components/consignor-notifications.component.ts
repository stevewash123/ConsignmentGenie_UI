import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-consignor-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  template: `
    <app-notification-center role="consignor"></app-notification-center>
  `,
  styles: []
})
export class ConsignorNotificationsComponent {}