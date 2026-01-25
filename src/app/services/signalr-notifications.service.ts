import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { NotificationUpdate, ToastNotification } from '../models/notifications.models';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalRNotificationsService {
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private jobProgressSubject = new Subject<NotificationUpdate>();
  private toastNotificationSubject = new Subject<ToastNotification>();
  private unreadCountSubject = new Subject<number>();

  private hubConnection?: HubConnection;

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public jobProgress$ = this.jobProgressSubject.asObservable();
  public toastNotifications$ = this.toastNotificationSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private authService: AuthService) {
    // Only connect if user is authenticated
    if (this.authService.getToken() && !this.authService.isTokenExpired()) {
      this.createConnection();
    }
  }

  private createConnection(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/hubs/notifications`, {
        accessTokenFactory: () => {
          const token = this.authService.getToken();
          console.log('SignalR accessTokenFactory called, token:', token ? 'exists' : 'null');
          return token || '';
        }
      })
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

      // New event for unread count updates
      this.hubConnection.on('UnreadCountUpdated', (count: number) => {
        console.log('Received unread count update:', count);
        this.unreadCountSubject.next(count);
      });

      // Generic INFO messages for Hangfire jobs and system events
      this.hubConnection.on('InfoMessage', (message: { title: string; message: string; type?: string; duration?: number }) => {
        console.log('Received INFO message:', message);
        this.createInfoToast(message.title, message.message, message.type || 'info', message.duration);
      });
    }
  }

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

  private createInfoToast(title: string, message: string, type: string = 'info', duration?: number): void {
    const notification: ToastNotification = {
      id: `info-${Date.now()}`,
      type: type as ToastNotification['type'],
      title,
      message,
      timestamp: new Date(),
      duration: duration || 5000
    };

    this.toastNotificationSubject.next(notification);
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
    return this.hubConnection?.state === 'Connected';
  }

  public start(): void {
    if (!this.hubConnection && this.authService.getToken() && !this.authService.isTokenExpired()) {
      this.createConnection();
    }
  }

  public async stop(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.connectionStatusSubject.next(false);
      this.hubConnection = undefined;
    }
  }

  // Public method to send INFO messages (for testing or manual triggers)
  public sendInfoMessage(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration?: number): void {
    this.createInfoToast(title, message, type, duration);
  }
}