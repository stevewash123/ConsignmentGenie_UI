import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-consignor-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  templateUrl: './consignor-notification-preferences.component.html',
  styleUrls: ['./consignor-notification-preferences.component.scss']
})
export class ConsignorNotificationPreferencesComponent {}