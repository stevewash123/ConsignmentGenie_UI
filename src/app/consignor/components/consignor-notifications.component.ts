import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-consignor-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  templateUrl: './consignor-notifications.component.html',
  styles: []
})
export class ConsignorNotificationsComponent {}