import { Component } from '@angular/core';
import { NotificationPreferencesComponent } from '../../shared/components/notification-preferences.component';

@Component({
  selector: 'app-consignor-notification-preferences',
  standalone: true,
  imports: [NotificationPreferencesComponent],
  templateUrl: './consignor-notification-preferences.component.html',
  styles: []
})
export class ConsignorNotificationPreferencesComponent {}