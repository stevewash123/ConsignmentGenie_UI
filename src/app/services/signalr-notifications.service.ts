import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { NotificationUpdate, ToastNotification } from '../models/notifications.models';
import { environment } from '../../environments/environment';

// TODO: Install @microsoft/signalr package when dependencies can be updated
// For now, this service provides the interface for SignalR notifications

@Injectable({
  providedIn: 'root'
})
export class SignalRNotificationsService {
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private jobProgressSubject = new Subject<NotificationUpdate>();
  private toastNotificationSubject = new Subject<ToastNotification>();

  // TODO: Uncomment when @microsoft/signalr is available
  // private hubConnection?: HubConnection;

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public jobProgress$ = this.jobProgressSubject.asObservable();
  public toastNotifications$ = this.toastNotificationSubject.asObservable();

  constructor() {
    // TODO: Uncomment when @microsoft/signalr is available
    // this.createConnection();

    // Mock connection for now
    setTimeout(() => {
      this.connectionStatusSubject.next(true);
    }, 1000);
  }

  /* TODO: Uncomment when @microsoft/signalr is available
  private createConnection(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/notificationHub`)
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR notification connection started');
        this.connectionStatusSubject.next(true);
        this.registerSignalREvents();
      })
      .catch(err => {
        console.error('Error starting SignalR notification connection:', err);
        this.connectionStatusSubject.next(false);
        // Retry connection after 5 seconds
        setTimeout(() => this.createConnection(), 5000);
      });

    this.hubConnection.onclose(() => {
      console.log('SignalR notification connection closed');
      this.connectionStatusSubject.next(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.createConnection(), 3000);
    });
  }

  private registerSignalREvents(): void {
    if (this.hubConnection) {
      this.hubConnection.on('JobProgressUpdate', (update: NotificationUpdate) => {
        console.log('Received job progress update:', update);
        this.jobProgressSubject.next(update);
        this.createToastFromJobUpdate(update);
      });

      this.hubConnection.on('ToastNotification', (notification: ToastNotification) => {
        console.log('Received toast notification:', notification);
        this.toastNotificationSubject.next(notification);
      });
    }
  }
  */

  // Mock methods for testing until SignalR is available
  public simulatePayoutJobProgress(): void {
    const updates: NotificationUpdate[] = [
      {
        jobId: 'payout-job-123',
        jobType: 'payout-generation',
        progress: 0,
        status: 'queued',
        message: 'Payout generation queued',
        organizationId: 'org-123',
        consignorCount: 15,
        processedConsignors: 0
      },
      {
        jobId: 'payout-job-123',
        jobType: 'payout-generation',
        progress: 25,
        status: 'running',
        message: 'Processing consignor payouts...',
        organizationId: 'org-123',
        consignorCount: 15,
        processedConsignors: 4
      },
      {
        jobId: 'payout-job-123',
        jobType: 'payout-generation',
        progress: 75,
        status: 'running',
        message: 'Generating payout reports...',
        organizationId: 'org-123',
        consignorCount: 15,
        processedConsignors: 11
      },
      {
        jobId: 'payout-job-123',
        jobType: 'payout-generation',
        progress: 100,
        status: 'completed',
        message: 'Payout generation completed successfully',
        organizationId: 'org-123',
        consignorCount: 15,
        processedConsignors: 15
      }
    ];

    updates.forEach((update, index) => {
      setTimeout(() => {
        this.jobProgressSubject.next(update);
        this.createToastFromJobUpdate(update);
      }, index * 2000);
    });
  }

  private createToastFromJobUpdate(update: NotificationUpdate): void {
    let title = '';
    let message = update.message || '';
    let type: ToastNotification['type'] = 'info';
    let duration = 5000;

    switch (update.jobType) {
      case 'payout-generation':
        title = 'Payout Generation';
        if (update.status === 'completed') {
          type = 'success';
          message = `Successfully processed payouts for ${(update as any).consignorCount} consignors`;
          duration = 10000;
        } else if (update.status === 'failed') {
          type = 'error';
          duration = undefined; // permanent
        }
        break;

      case 'bank-sync':
        title = 'Bank Synchronization';
        if (update.status === 'completed') {
          type = 'success';
          duration = 8000;
        } else if (update.status === 'failed') {
          type = 'error';
          duration = undefined;
        }
        break;

      case 'quickbooks-sync':
        title = 'QuickBooks Sync';
        if (update.status === 'completed') {
          type = 'success';
          duration = 8000;
        } else if (update.status === 'failed') {
          type = 'error';
          duration = undefined;
        }
        break;

      case 'plaid-connection':
        title = 'Bank Connection';
        if (update.status === 'completed') {
          type = 'success';
          message = `Successfully connected to ${(update as any).institutionName}`;
          duration = 8000;
        } else if (update.status === 'failed') {
          type = 'error';
          duration = undefined;
        }
        break;
    }

    const notification: ToastNotification = {
      id: `${update.jobId}-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      duration,
      jobId: update.jobId
    };

    this.toastNotificationSubject.next(notification);
  }

  public isConnected(): boolean {
    // TODO: Uncomment when @microsoft/signalr is available
    // return this.hubConnection?.state === 'Connected';
    return this.connectionStatusSubject.value;
  }

  public async stop(): Promise<void> {
    // TODO: Uncomment when @microsoft/signalr is available
    // if (this.hubConnection) {
    //   await this.hubConnection.stop();
    //   this.connectionStatusSubject.next(false);
    // }
    this.connectionStatusSubject.next(false);
  }
}