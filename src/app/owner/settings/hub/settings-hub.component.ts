import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SettingsCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  status?: 'completed' | 'incomplete' | 'warning';
  statusText?: string;
}

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="settings-hub">
      <div class="hub-header">
        <h2>Settings Overview</h2>
        <p>Manage your shop configuration from one place</p>
      </div>

      <div class="settings-grid">
        <a
          *ngFor="let card of settingsCards"
          [routerLink]="[card.route]"
          class="settings-card"
          [class.warning]="card.status === 'warning'"
          [class.incomplete]="card.status === 'incomplete'">

          <div class="card-header">
            <span class="card-icon">{{ card.icon }}</span>
            <div class="card-status" *ngIf="card.status">
              <span class="status-indicator" [class]="'status-' + card.status"></span>
              <span class="status-text" *ngIf="card.statusText">{{ card.statusText }}</span>
            </div>
          </div>

          <div class="card-content">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
          </div>

          <div class="card-action">
            <span class="action-text">{{ getActionText(card) }}</span>
            <span class="action-arrow">→</span>
          </div>
        </a>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats" *ngIf="stats()">
        <h3>Quick Overview</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats()?.activeConsignors || 0 }}</div>
            <div class="stat-label">Active Consignors</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats()?.pendingApprovals || 0 }}</div>
            <div class="stat-label">Pending Approvals</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats()?.integrations || 0 }}/3</div>
            <div class="stat-label">Integrations Active</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats()?.completionPercentage || 0 }}%</div>
            <div class="stat-label">Setup Complete</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity" *ngIf="recentActivity().length > 0">
        <h3>Recent Settings Changes</h3>
        <div class="activity-list">
          <div *ngFor="let activity of recentActivity()" class="activity-item">
            <div class="activity-icon">{{ activity.icon }}</div>
            <div class="activity-content">
              <div class="activity-text">{{ activity.description }}</div>
              <div class="activity-time">{{ activity.timestamp | date:'short' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-hub {
      padding: 2rem;
    }

    .hub-header {
      margin-bottom: 2rem;
    }

    .hub-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .hub-header p {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .settings-card {
      display: block;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .settings-card:hover {
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .settings-card.warning {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .settings-card.incomplete {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .card-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .card-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-completed {
      background: #10b981;
    }

    .status-warning {
      background: #f59e0b;
    }

    .status-incomplete {
      background: #ef4444;
    }

    .status-text {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
    }

    .card-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .card-content p {
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .card-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    .action-text {
      font-weight: 500;
      color: #3b82f6;
    }

    .action-arrow {
      font-weight: 600;
      color: #3b82f6;
      transform: translateX(0);
      transition: transform 0.2s ease;
    }

    .settings-card:hover .action-arrow {
      transform: translateX(4px);
    }

    /* Quick Stats */
    .quick-stats {
      margin-bottom: 3rem;
    }

    .quick-stats h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Recent Activity */
    .recent-activity h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .activity-list {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      font-size: 1.25rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      color: #111827;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .activity-time {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .settings-hub {
        padding: 1rem;
      }

      .settings-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .card-header {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SettingsHubComponent implements OnInit {
  stats = signal<{
    activeConsignors: number;
    pendingApprovals: number;
    integrations: number;
    completionPercentage: number;
  } | null>(null);

  recentActivity = signal<Array<{
    id: string;
    icon: string;
    description: string;
    timestamp: Date;
  }>>([]);

  settingsCards: SettingsCard[] = [
    {
      id: 'profile',
      title: 'Shop Profile',
      description: 'Name, logo, contact info, address',
      icon: '🏪',
      route: 'profile',
      status: 'completed'
    },
    {
      id: 'business',
      title: 'Business Settings',
      description: 'Commission, tax, terms, payout schedule',
      icon: '💼',
      route: 'business',
      status: 'warning',
      statusText: 'Review needed'
    },
    {
      id: 'storefront',
      title: 'Storefront',
      description: 'Square, Shopify, or CG-hosted store',
      icon: '🛒',
      route: 'storefront',
      status: 'incomplete',
      statusText: 'Setup required'
    },
    {
      id: 'accounting',
      title: 'Accounting',
      description: 'QuickBooks sync or spreadsheet exports',
      icon: '📊',
      route: 'accounting',
      status: 'incomplete',
      statusText: 'Not connected'
    },
    {
      id: 'consignors',
      title: 'Consignor Settings',
      description: 'Store code, invites, approval settings',
      icon: '👥',
      route: 'consignors',
      status: 'completed'
    },
    {
      id: 'subscription',
      title: 'Subscription',
      description: 'Plan: Pro ($29/mo), Next billing: Jan 15',
      icon: '💳',
      route: 'subscription',
      status: 'completed'
    },
    {
      id: 'account',
      title: 'Account & Security',
      description: 'Profile, password, 2FA, owner PIN',
      icon: '👤',
      route: 'account',
      status: 'warning',
      statusText: 'Enable 2FA'
    }
  ];

  ngOnInit() {
    this.loadStats();
    this.loadRecentActivity();
  }

  getActionText(card: SettingsCard): string {
    switch (card.status) {
      case 'completed':
        return 'Edit';
      case 'warning':
        return 'Review';
      case 'incomplete':
        return 'Setup';
      default:
        return 'Configure';
    }
  }

  private loadStats() {
    // Mock data - replace with actual API calls
    this.stats.set({
      activeConsignors: 23,
      pendingApprovals: 3,
      integrations: 1,
      completionPercentage: 75
    });
  }

  private loadRecentActivity() {
    // Mock data - replace with actual API calls
    this.recentActivity.set([
      {
        id: '1',
        icon: '🏪',
        description: 'Updated shop profile information',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '2',
        icon: '👥',
        description: 'Generated new store code',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        id: '3',
        icon: '💼',
        description: 'Modified commission structure',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ]);
  }
}