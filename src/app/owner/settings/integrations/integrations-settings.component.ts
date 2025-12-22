import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SquareIntegrationService } from '../../../services/square-integration.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface QuickBooksStatus {
  isConnected: boolean;
  companyId?: string;
  companyName?: string;
  lastSync?: Date;
  syncFrequency: 'manual' | 'daily' | 'real-time';
  accountMappings: {
    salesAccount?: string;
    expenseAccount?: string;
    payoutAccount?: string;
  };
  error?: string;
}

export interface SquareStatus {
  isConnected: boolean;
  merchantId?: string;
  merchantName?: string;
  connectedAt?: Date;
  lastSync?: Date;
  itemCount?: number;
  error?: string;
}

export interface PaymentIntegrations {
  stripe: { enabled: boolean; configuredAt?: Date; };
  paypal: { enabled: boolean; configuredAt?: Date; };
  square: { enabled: boolean; configuredAt?: Date; };
}

export interface BankingIntegrations {
  plaid: { enabled: boolean; linkedAccounts: number; };
  dwolla: { enabled: boolean; status: string; };
}

@Component({
  selector: 'app-integrations-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './integrations-settings.component.html',
  styleUrls: ['./integrations-settings.component.css']
})
export class IntegrationsSettingsComponent implements OnInit {
  private squareService = inject(SquareIntegrationService);
  private http = inject(HttpClient);

  quickBooksStatus = signal<QuickBooksStatus>({
    isConnected: false,
    syncFrequency: 'manual',
    accountMappings: {}
  });

  squareStatus = signal<SquareStatus>({
    isConnected: false
  });

  paymentIntegrations = signal<PaymentIntegrations>({
    stripe: { enabled: false },
    paypal: { enabled: false },
    square: { enabled: false }
  });

  bankingIntegrations = signal<BankingIntegrations>({
    plaid: { enabled: false, linkedAccounts: 0 },
    dwolla: { enabled: false, status: 'not-connected' }
  });

  isLoading = signal(false);
  isSaving = signal(false);

  ngOnInit() {
    this.loadAllIntegrations();
  }

  private async loadAllIntegrations() {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.loadQuickBooksStatus(),
        this.loadSquareStatus()
      ]);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadQuickBooksStatus() {
    try {
      // Mock QuickBooks status - replace with actual API call
      const mockQBStatus: QuickBooksStatus = {
        isConnected: false, // Change to true to test connected state
        companyName: 'Demo Company LLC',
        companyId: 'qb_123456789',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        syncFrequency: 'daily',
        accountMappings: {
          salesAccount: 'Sales Revenue',
          expenseAccount: 'Consignor Expenses',
          payoutAccount: 'Consignor Payouts'
        }
      };

      this.quickBooksStatus.set(mockQBStatus);
    } catch (error) {
      console.error('Failed to load QuickBooks status:', error);
      this.quickBooksStatus.update(status => ({
        ...status,
        error: 'Failed to load status'
      }));
    }
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

  // QuickBooks Integration Methods
  async connectQuickBooks() {
    if (this.quickBooksStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    try {
      // Mock QuickBooks OAuth flow - replace with actual API call
      const oauthUrl = `${environment.apiUrl}/api/integrations/quickbooks/connect`;
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Failed to initiate QuickBooks connection:', error);
      this.quickBooksStatus.update(status => ({
        ...status,
        error: 'Failed to start connection'
      }));
      this.isLoading.set(false);
    }
  }

  async disconnectQuickBooks() {
    if (!this.quickBooksStatus().isConnected) {
      return;
    }

    if (!confirm('Are you sure you want to disconnect from QuickBooks? This will stop syncing financial data.')) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.http.post(`${environment.apiUrl}/api/integrations/quickbooks/disconnect`, {}).toPromise();
      this.quickBooksStatus.set({
        isConnected: false,
        syncFrequency: 'manual',
        accountMappings: {}
      });
    } catch (error) {
      console.error('Failed to disconnect from QuickBooks:', error);
      this.quickBooksStatus.update(status => ({
        ...status,
        error: 'Failed to disconnect'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  async syncQuickBooksNow() {
    if (!this.quickBooksStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.http.post(`${environment.apiUrl}/api/integrations/quickbooks/sync`, {}).toPromise();
      // Refresh status to get updated sync time
      await this.loadQuickBooksStatus();
    } catch (error) {
      console.error('Failed to sync QuickBooks data:', error);
      this.quickBooksStatus.update(status => ({
        ...status,
        error: 'Sync failed'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  updateSyncFrequency(frequency: 'manual' | 'daily' | 'real-time') {
    this.quickBooksStatus.update(status => ({
      ...status,
      syncFrequency: frequency
    }));
  }

  configureAccountMapping() {
    // TODO: Implement account mapping configuration modal
    alert('Account mapping configuration will be implemented in a future update');
  }

  async saveIntegrationSettings() {
    this.isSaving.set(true);
    try {
      // Save QuickBooks settings
      const qbSettings = {
        syncFrequency: this.quickBooksStatus().syncFrequency,
        accountMappings: this.quickBooksStatus().accountMappings
      };

      await this.http.put(`${environment.apiUrl}/api/integrations/quickbooks/settings`, qbSettings).toPromise();
    } catch (error) {
      console.error('Failed to save integration settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }
}