import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

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

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.scss']
})
export class AccountingComponent implements OnInit {
  // TODO: Create QuickBooksService and inject here instead of HttpClient

  quickBooksStatus = signal<QuickBooksStatus>({
    isConnected: false,
    syncFrequency: 'manual',
    accountMappings: {}
  });

  salesSyncEnabled = signal(false);
  consignorSyncEnabled = signal(true);
  payoutRecordingMethod = signal<'bill-payment' | 'direct-expense'>('direct-expense');
  lineItemDetail = signal<'lump-sum' | 'itemized'>('lump-sum');

  isLoading = signal(false);
  isSaving = signal(false);

  ngOnInit() {
    this.loadQuickBooksStatus();
  }

  private async loadQuickBooksStatus() {
    this.isLoading.set(true);
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
    } finally {
      this.isLoading.set(false);
    }
  }

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
      // TODO: Replace with QuickBooksService.disconnect() method
      // await this.http.post(`${environment.apiUrl}/api/integrations/quickbooks/disconnect`, {}).toPromise();
      console.log('TODO: Implement QuickBooksService.disconnect()');
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
      // TODO: Replace with QuickBooksService.syncNow() method
      // await this.http.post(`${environment.apiUrl}/api/integrations/quickbooks/sync`, {}).toPromise();
      console.log('TODO: Implement QuickBooksService.syncNow()');
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

  onSalesSyncToggle() {
    this.salesSyncEnabled.update(value => !value);
    this.autoSave();
  }

  onConsignorSyncToggle() {
    this.consignorSyncEnabled.update(value => !value);
    this.autoSave();
  }

  onPayoutRecordingChange(method: 'bill-payment' | 'direct-expense') {
    this.payoutRecordingMethod.set(method);
    this.autoSave();
  }

  onLineItemDetailChange(detail: 'lump-sum' | 'itemized') {
    this.lineItemDetail.set(detail);
    this.autoSave();
  }

  getSyncFrequencyDisplay(): string {
    const frequency = this.quickBooksStatus().syncFrequency;
    switch (frequency) {
      case 'manual':
        return 'Manual sync only';
      case 'daily':
        return 'Daily automatic sync';
      case 'real-time':
        return 'Real-time sync';
      default:
        return 'Manual sync only';
    }
  }

  updateSyncFrequency(frequency: 'manual' | 'daily' | 'real-time') {
    this.quickBooksStatus.update(status => ({
      ...status,
      syncFrequency: frequency
    }));
    this.autoSave();
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

      // TODO: Replace with QuickBooksService.updateSettings() method
      // await this.http.put(`${environment.apiUrl}/api/integrations/quickbooks/settings`, qbSettings).toPromise();
      console.log('TODO: Implement QuickBooksService.updateSettings()', qbSettings);
    } catch (error) {
      console.error('Failed to save integration settings:', error);
    } finally {
      this.isSaving.set(false);
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

  private async autoSave() {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    try {
      // Include all settings in the save
      const settings = {
        salesSync: this.salesSyncEnabled(),
        consignorSync: this.consignorSyncEnabled(),
        payoutRecordingMethod: this.payoutRecordingMethod(),
        lineItemDetail: this.lineItemDetail(),
        syncFrequency: this.quickBooksStatus().syncFrequency,
        accountMappings: this.quickBooksStatus().accountMappings
      };

      // TODO: Replace with actual API call
      console.log('Auto-saving QuickBooks settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Failed to auto-save settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }
}
