import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobProgressComponent } from '../../../shared/components/job-progress/job-progress.component';
import { SignalRNotificationsService } from '../../../services/signalr-notifications.service';

@Component({
  selector: 'app-notifications-demo',
  standalone: true,
  imports: [CommonModule, JobProgressComponent],
  template: `
    <div class="notifications-demo">
      <div class="demo-header">
        <h1>Background Job Notifications Demo</h1>
        <p class="demo-description">
          This demo shows the SignalR job notification system. In production, these notifications
          will appear automatically when background jobs are running (payout generation,
          QuickBooks sync, bank connections, etc.).
        </p>
      </div>

      <div class="demo-content">
        <div class="demo-section">
          <h2>Job Progress Tracker</h2>
          <p>Shows real-time updates for running background jobs:</p>
          <app-job-progress />
        </div>

        <div class="demo-section">
          <h2>Toast Notifications</h2>
          <p>Toast notifications appear in the top-right corner of the screen automatically when jobs complete.</p>
          <button
            class="demo-button"
            (click)="simulatePayoutJob()">
            Test Payout Job Notifications
          </button>
        </div>

        <div class="demo-section">
          <h2>Production Integration</h2>
          <div class="integration-info">
            <h3>📋 Implementation Status</h3>
            <ul>
              <li>✅ SignalR service structure created</li>
              <li>✅ Toast notification system implemented</li>
              <li>✅ Job progress tracking UI created</li>
              <li>⚠️ Requires @microsoft/signalr package installation</li>
              <li>⚠️ Requires backend SignalR Hub implementation</li>
              <li>⚠️ Requires backend job status updates</li>
            </ul>

            <h3>🔧 Next Steps</h3>
            <ol>
              <li>Install @microsoft/signalr package: <code>npm install @microsoft/signalr</code></li>
              <li>Uncomment SignalR connection code in SignalRNotificationsService</li>
              <li>Implement NotificationHub in backend API</li>
              <li>Update backend services to send job progress updates</li>
              <li>Remove test/mock functionality from components</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-demo {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }

    .demo-header {
      margin-bottom: 2rem;
    }

    .demo-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }

    .demo-description {
      color: #6b7280;
      font-size: 1.125rem;
      line-height: 1.6;
    }

    .demo-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .demo-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    .demo-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .demo-section p {
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .demo-button {
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .demo-button:hover {
      background: #2563eb;
    }

    .integration-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 1.5rem;
    }

    .integration-info h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
      margin-top: 0;
    }

    .integration-info ul,
    .integration-info ol {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
    }

    .integration-info li {
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .integration-info code {
      background: #e5e7eb;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .notifications-demo {
        padding: 1rem;
      }
    }
  `]
})
export class NotificationsDemoComponent {

  constructor(private signalRService: SignalRNotificationsService) {}

  simulatePayoutJob() {
    this.signalRService.simulatePayoutJobProgress();
  }
}