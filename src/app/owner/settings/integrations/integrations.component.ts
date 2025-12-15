import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SquareIntegrationService } from '../../../services/square-integration.service';

export interface SquareStatus {
  isConnected: boolean;
  merchantId?: string;
  merchantName?: string;
  connectedAt?: Date;
  lastSync?: Date;
  itemCount?: number;
  error?: string;
}

export interface QuickBooksStatus {
  isConnected: boolean;
  companyName?: string;
  companyId?: string;
  syncFrequency?: string;
  lastSync?: Date;
  error?: string;
  accountMappings?: {
    salesAccount?: string;
    payoutAccount?: string;
    expenseAccount?: string;
  };
}

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './integrations-settings.component.html',
  styleUrls: ['./integrations-settings.component.css']
})
export class IntegrationsComponent implements OnInit {
  private squareService = inject(SquareIntegrationService);

  squareStatus = signal<SquareStatus>({
    isConnected: false
  });

  quickBooksStatus = signal<QuickBooksStatus>({
    isConnected: false,
    syncFrequency: 'daily'
  });

  isLoading = signal(false);
  isSaving = signal(false);

  ngOnInit() {
    this.loadSquareStatus();
    this.loadQuickBooksStatus();
  }

  private async loadSquareStatus() {
    this.isLoading.set(true);
    try {
      const status = await this.squareService.getStatus();
      this.squareStatus.set(status);
    } catch (error) {
      console.error('Failed to load Square status:', error);
      this.squareStatus.set({
        isConnected: false,
        error: 'Failed to load status'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async connectSquare() {
    if (this.squareStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    try {
      const oauthUrl = await this.squareService.initiateConnection();
      // Redirect to Square OAuth
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Failed to initiate Square connection:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Failed to start connection'
      }));
      this.isLoading.set(false);
    }
  }

  async disconnectSquare() {
    if (!this.squareStatus().isConnected) {
      return;
    }

    if (!confirm('Are you sure you want to disconnect from Square? This will stop syncing inventory and sales data.')) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.squareService.disconnect();
      this.squareStatus.set({
        isConnected: false
      });
    } catch (error) {
      console.error('Failed to disconnect from Square:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Failed to disconnect'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  async syncNow() {
    if (!this.squareStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.squareService.syncNow();
      // Refresh status to get updated sync time
      await this.loadSquareStatus();
    } catch (error) {
      console.error('Failed to sync Square data:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Sync failed'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  getTimeSinceSync(): string {
    const lastSync = this.squareStatus().lastSync;
    if (!lastSync) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  private async loadQuickBooksStatus() {
    // Mock QuickBooks status for now
    // In a real implementation, this would call a QuickBooks service
    this.quickBooksStatus.set({
      isConnected: false,
      syncFrequency: 'daily',
      accountMappings: {
        salesAccount: undefined,
        payoutAccount: undefined,
        expenseAccount: undefined
      }
    });
  }

  async connectQuickBooks() {
    this.isLoading.set(true);
    try {
      // Mock connection for now
      // In a real implementation, this would initiate QuickBooks OAuth
      console.log('Connecting to QuickBooks...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.quickBooksStatus.set({
        isConnected: true,
        companyName: 'Sample Company',
        companyId: 'QB-123456',
        syncFrequency: 'daily',
        accountMappings: {
          salesAccount: 'Sales Income',
          payoutAccount: 'Payouts Payable',
          expenseAccount: 'Commission Expense'
        }
      });
    } catch (error) {
      console.error('Failed to connect to QuickBooks:', error);
      this.quickBooksStatus.update(status => ({
        ...status,
        error: 'Failed to connect'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  async disconnectQuickBooks() {
    if (!this.quickBooksStatus().isConnected) {
      return;
    }

    if (!confirm('Are you sure you want to disconnect from QuickBooks?')) {
      return;
    }

    this.isLoading.set(true);
    try {
      // Mock disconnection
      await new Promise(resolve => setTimeout(resolve, 500));
      this.quickBooksStatus.set({
        isConnected: false,
        syncFrequency: 'daily',
        accountMappings: {
          salesAccount: undefined,
          payoutAccount: undefined,
          expenseAccount: undefined
        }
      });
    } catch (error) {
      console.error('Failed to disconnect from QuickBooks:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveIntegrationSettings() {
    this.isSaving.set(true);
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Integration settings saved');
    } catch (error) {
      console.error('Failed to save integration settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  updateSyncFrequency(frequency: string) {
    this.quickBooksStatus.update(status => ({
      ...status,
      syncFrequency: frequency
    }));
  }

  async syncQuickBooksNow() {
    if (!this.quickBooksStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    try {
      // Mock sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.quickBooksStatus.update(status => ({
        ...status,
        lastSync: new Date()
      }));
      console.log('QuickBooks sync completed');
    } catch (error) {
      console.error('Failed to sync QuickBooks:', error);
      this.quickBooksStatus.update(status => ({
        ...status,
        error: 'Sync failed'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  configureAccountMapping() {
    // Mock account mapping configuration
    console.log('Opening account mapping configuration...');
    // In a real implementation, this would open a modal or navigate to a configuration page
  }
}