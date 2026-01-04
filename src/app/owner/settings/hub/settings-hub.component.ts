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
  templateUrl: './settings-hub.component.html',
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