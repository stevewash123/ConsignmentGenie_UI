import { Component } from '@angular/core';
import { NotificationCenterComponent } from '../../shared/components/notification-center.component';

@Component({
  selector: 'app-provider-notifications',
  standalone: true,
  imports: [NotificationCenterComponent],
  template: `
    <app-notification-center role="provider"></app-notification-center>
  `,
  styles: []
})
export class ProviderNotificationsComponent {}