import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-consignor-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  templateUrl: './consignor-notifications.component.html',
  styleUrls: ['./consignor-notifications.component.scss']
})
export class ConsignorNotificationsComponent {}