import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SignalRNotificationsService } from '../../../services/signalr-notifications.service';
import {
  NotificationUpdate,
  PayoutJobUpdate,
  BankSyncJobUpdate,
  QuickBooksSyncJobUpdate
} from '../../../models/notifications.models';

@Component({
  selector: 'app-job-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-progress.component.html',
  styleUrls: ['./job-progress.component.scss']
})
export class JobProgressComponent implements OnInit, OnDestroy {
  isConnected = false;
  activeJobs: NotificationUpdate[] = [];
  recentCompletedJobs: NotificationUpdate[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private signalRService: SignalRNotificationsService) {}

  ngOnInit() {
    const connectionSub = this.signalRService.connectionStatus$.subscribe(
      isConnected => this.isConnected = isConnected
    );

    const progressSub = this.signalRService.jobProgress$.subscribe(
      update => this.handleJobProgressUpdate(update)
    );

    this.subscriptions.push(connectionSub, progressSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private handleJobProgressUpdate(update: NotificationUpdate) {
    const existingJobIndex = this.activeJobs.findIndex(job => job.jobId === update.jobId);

    if (existingJobIndex >= 0) {
      this.activeJobs[existingJobIndex] = update;
    } else {
      this.activeJobs.push(update);
    }

    // Move completed/failed jobs to recent list
    if (update.status === 'completed' || update.status === 'failed') {
      setTimeout(() => {
        const jobIndex = this.activeJobs.findIndex(job => job.jobId === update.jobId);
        if (jobIndex >= 0) {
          const completedJob = this.activeJobs.splice(jobIndex, 1)[0];
          this.recentCompletedJobs.unshift(completedJob);

          // Keep only last 3 completed jobs
          if (this.recentCompletedJobs.length > 3) {
            this.recentCompletedJobs = this.recentCompletedJobs.slice(0, 3);
          }
        }
      }, 5000);
    }
  }

  getJobTypeDisplay(jobType: NotificationUpdate['jobType']): string {
    switch (jobType) {
      case 'payout-generation': return 'Payout Generation';
      case 'bank-sync': return 'Bank Sync';
      case 'quickbooks-sync': return 'QuickBooks Sync';
      case 'plaid-connection': return 'Bank Connection';
      default: return 'Job';
    }
  }

  getJobIcon(jobType: NotificationUpdate['jobType']): string {
    switch (jobType) {
      case 'payout-generation': return '💰';
      case 'bank-sync': return '🏦';
      case 'quickbooks-sync': return '📊';
      case 'plaid-connection': return '🔗';
      default: return '⚙️';
    }
  }

  getStatusIcon(status: NotificationUpdate['status']): string {
    switch (status) {
      case 'queued': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⚙️';
    }
  }

  getStatusColor(status: NotificationUpdate['status']): string {
    switch (status) {
      case 'queued': return '#6b7280';
      case 'running': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  }

  // Properly typed helper methods for job-specific properties
  getPayoutJobProperty(job: PayoutJobUpdate, property: keyof PayoutJobUpdate): number {
    return job[property] as number || 0;
  }

  getBankSyncJobProperty(job: BankSyncJobUpdate, property: keyof BankSyncJobUpdate): number {
    return job[property] as number || 0;
  }

  getQuickBooksSyncJobProperty(job: QuickBooksSyncJobUpdate, property: keyof QuickBooksSyncJobUpdate): number {
    return job[property] as number || 0;
  }

  // Test method to simulate job progress (remove in production)
  startTestJob() {
    this.signalRService.simulatePayoutJobProgress();
  }
}