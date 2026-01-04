import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OwnerLayoutComponent } from './owner-layout.component';

interface OrganizationSettings {
  id: string;
  name: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  quickBooksConnected: boolean;
  quickBooksLastSync?: string;
  squareIntegration?: {
    connected: boolean;
    merchantId?: string;
    businessName?: string;
    locationId?: string;
    locationName?: string;
    connectedAt?: Date;
    inventorySource: 'cg' | 'square' | 'hybrid';
    posMode: 'cg' | 'square';
    useSquarePayments: boolean;
    salesImportMode: 'none' | 'manual' | 'scheduled' | 'realtime';
    lastCatalogSync?: Date;
    lastSalesImport?: Date;
    lastSalesImportCount?: number;
  };
  // Legacy fields for backward compatibility
  squareConnected: boolean;
  squareLocationId?: string;
}

interface QuickBooksAuthResponse {
  success: boolean;
  authUrl?: string;
  message: string;
}

interface SquareAuthResponse {
  success: boolean;
  authUrl?: string;
  message: string;
}

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent],
  templateUrl: './owner-settings.component.html',
  styleUrls: ['./owner-settings.component.scss']
})
export class OwnerSettingsComponent implements OnInit {
  organization = signal<OrganizationSettings | null>(null);
  saving = signal(false);
  connecting = signal(false);
  syncing = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadOrganizationSettings();
  }

  async loadOrganizationSettings() {
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      if (!userData.organizationId) {
        this.showError('No organization found');
        return;
      }

      const response = await this.http.get<any>(
        `${environment.apiUrl}/api/organizations/${userData.organizationId}/settings`
      ).toPromise();

      if (response?.data) {
        this.organization.set(response.data);
      }
    } catch (error) {
      console.error('Failed to load organization settings:', error);
      // Use mock data for development
      this.organization.set({
        id: '1',
        name: 'Demo Consignment Shop',
        subscriptionTier: 'Pro',
        subscriptionStatus: 'Active',
        quickBooksConnected: false,
        squareIntegration: {
          connected: false,
          inventorySource: 'cg',
          posMode: 'cg',
          useSquarePayments: false,
          salesImportMode: 'none'
        },
        squareConnected: false
      });
    }
  }

  async saveGeneralSettings() {
    if (!this.organization()) return;

    this.saving.set(true);
    try {
      const response = await this.http.put<any>(
        `${environment.apiUrl}/api/organizations/${this.organization()!.id}`,
        {
          name: this.organization()!.name
        }
      ).toPromise();

      if (response?.success) {
        this.showSuccess('Settings saved successfully');
      }
    } catch (error) {
      this.showError('Failed to save settings');
    } finally {
      this.saving.set(false);
    }
  }

  async connectQuickBooks() {
    this.connecting.set(true);
    try {
      const response = await this.http.post<QuickBooksAuthResponse>(
        `${environment.apiUrl}/api/quickbooks/connect`,
        {}
      ).toPromise();

      if (response?.success && response.authUrl) {
        // Open QuickBooks OAuth flow in new window
        const authWindow = window.open(response.authUrl, 'quickbooks-auth', 'width=600,height=700');

        // Listen for the auth completion
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            this.loadOrganizationSettings(); // Reload to get updated status
            this.showSuccess('QuickBooks connection initiated. Please complete the authorization.');
          }
        }, 1000);
      }
    } catch (error) {
      this.showError('Failed to initiate QuickBooks connection');
    } finally {
      this.connecting.set(false);
    }
  }

  async disconnectQuickBooks() {
    if (!confirm('Are you sure you want to disconnect QuickBooks? This will stop all syncing.')) {
      return;
    }

    try {
      const response = await this.http.delete<any>(
        `${environment.apiUrl}/api/quickbooks/disconnect`
      ).toPromise();

      if (response?.success) {
        await this.loadOrganizationSettings();
        this.showSuccess('QuickBooks disconnected successfully');
      }
    } catch (error) {
      this.showError('Failed to disconnect QuickBooks');
    }
  }

  async syncQuickBooks() {
    this.syncing.set(true);
    try {
      const response = await this.http.post<any>(
        `${environment.apiUrl}/api/quickbooks/sync`,
        {}
      ).toPromise();

      if (response?.success) {
        await this.loadOrganizationSettings();
        this.showSuccess('QuickBooks sync completed successfully');
      }
    } catch (error) {
      this.showError('QuickBooks sync failed');
    } finally {
      this.syncing.set(false);
    }
  }

  async connectSquare() {
    this.connecting.set(true);
    try {
      const response = await this.http.post<SquareAuthResponse>(
        `${environment.apiUrl}/api/square/connect`,
        {}
      ).toPromise();

      if (response?.success && response.authUrl) {
        // Open Square OAuth flow in new window
        const authWindow = window.open(response.authUrl, 'square-auth', 'width=600,height=700');

        // Listen for the auth completion
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            this.loadOrganizationSettings(); // Reload to get updated status
            this.showSuccess('Square connection initiated. Please complete the authorization.');
          }
        }, 1000);
      }
    } catch (error) {
      this.showError('Failed to initiate Square connection');
    } finally {
      this.connecting.set(false);
    }
  }

  async disconnectSquare() {
    if (!confirm('Are you sure you want to disconnect Square? This will stop all syncing and reset all integration settings.')) {
      return;
    }

    try {
      const response = await this.http.delete<any>(
        `${environment.apiUrl}/api/square/disconnect`
      ).toPromise();

      if (response?.success) {
        await this.loadOrganizationSettings();
        this.showSuccess('Square disconnected successfully');
      }
    } catch (error) {
      this.showError('Failed to disconnect Square');
    }
  }

  async updateSquareSettings(settings: any) {
    this.saving.set(true);
    try {
      const response = await this.http.put<any>(
        `${environment.apiUrl}/api/square/settings`,
        settings
      ).toPromise();

      if (response?.success) {
        await this.loadOrganizationSettings();
        this.showSuccess('Square settings updated successfully');
      }
    } catch (error) {
      this.showError('Failed to update Square settings');
    } finally {
      this.saving.set(false);
    }
  }

  async syncSquare() {
    this.syncing.set(true);
    try {
      const response = await this.http.post<any>(
        `${environment.apiUrl}/api/square/sync`,
        {}
      ).toPromise();

      if (response?.success) {
        await this.loadOrganizationSettings();
        this.showSuccess('Square sync completed successfully');
      }
    } catch (error) {
      this.showError('Square sync failed');
    } finally {
      this.syncing.set(false);
    }
  }

  // Helper methods for accessing Square integration data
  get isSquareConnected(): boolean {
    return this.organization()?.squareIntegration?.connected ||
           this.organization()?.squareConnected || false;
  }

  get squareBusinessName(): string {
    return this.organization()?.squareIntegration?.businessName || 'Unknown Business';
  }

  get squareLocationName(): string {
    return this.organization()?.squareIntegration?.locationName || 'Unknown Location';
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}