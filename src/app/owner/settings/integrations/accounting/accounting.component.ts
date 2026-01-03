import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  styles: [`
    .section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #111827;
    }
    .section-description {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .integration-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .integration-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .integration-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .integration-title h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    .integration-logo {
      width: 2.5rem;
      height: 2.5rem;
      background: #3b82f6;
      color: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .status-badge.connected {
      background: #dcfce7;
      color: #166534;
    }
    .status-badge.not-connected {
      background: #fee2e2;
      color: #dc2626;
    }
    .integration-content {
      margin-top: 1rem;
    }
    .integration-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    .company-info, .sync-settings, .account-mappings {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .company-info h4, .sync-settings h4, .account-mappings h4 {
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #374151;
    }
    .company-id {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    .form-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
    }
    .sync-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
    .mapping-list {
      margin-bottom: 1rem;
    }
    .mapping-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .mapping-item:last-child {
      border-bottom: none;
    }
    .mapping-label {
      font-weight: 500;
      color: #374151;
    }
    .mapping-value {
      color: #6b7280;
    }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .btn-primary:hover {
      background: #2563eb;
    }
    .btn-secondary {
      background: #6b7280;
      color: white;
      border-color: #6b7280;
    }
    .btn-secondary:hover {
      background: #4b5563;
    }
    .btn-outline {
      background: white;
      color: #374151;
      border-color: #d1d5db;
    }
    .btn-outline:hover {
      background: #f9fafb;
    }
    .btn-danger {
      color: #dc2626;
      border-color: #dc2626;
    }
    .btn-danger:hover {
      background: #fee2e2;
    }
    .btn-small {
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-message {
      background: #fee2e2;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    .integration-features {
      margin: 1.5rem 0;
    }
    .integration-features h4 {
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #374151;
    }
    .integration-features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .integration-features li {
      padding: 0.25rem 0;
      color: #374151;
    }
    .integration-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding: 1.5rem 0;
    }
    .loading-state {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      color: #6b7280;
    }
    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .connect-button {
      margin-top: 1rem;
    }
  `]
})
export class AccountingComponent implements OnInit {
  private http = inject(HttpClient);

  quickBooksStatus = signal<QuickBooksStatus>({
    isConnected: false,
    syncFrequency: 'manual',
    accountMappings: {}
  });

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
}
