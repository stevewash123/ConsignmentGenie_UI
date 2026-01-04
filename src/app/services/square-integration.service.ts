import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SquareStatus } from '../owner/settings/integrations/inventory/inventory.component';

export interface SquareConnectionResponse {
  success: boolean;
  oauthUrl?: string;
  error?: string;
}

export interface SquareDisconnectResponse {
  success: boolean;
  message?: string;
}

export interface SquareSyncResponse {
  success: boolean;
  itemsProcessed?: number;
  lastSync?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SquareIntegrationService {
  private readonly apiUrl = `${environment.apiUrl}/api/owner/integrations/square`;
  private http = inject(HttpClient);

  /**
   * Get current Square integration status
   */
  async getStatus(): Promise<SquareStatus> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/status`).toPromise();

      return {
        isConnected: response.connected || false,
        merchantId: response.merchantId,
        merchantName: response.merchantName,
        connectedAt: response.connectedAt ? new Date(response.connectedAt) : undefined,
        lastSync: response.lastSyncAt ? new Date(response.lastSyncAt) : undefined,
        itemCount: 0 // This will be populated when sync is implemented
      };
    } catch (error) {
      console.error('Square status error:', error);
      return {
        isConnected: false
      };
    }
  }

  /**
   * Initiate Square OAuth connection
   */
  async initiateConnection(): Promise<string> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/auth-url`).toPromise();

      if (response?.authUrl) {
        return response.authUrl;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Square connection initiation error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Square
   */
  async disconnect(): Promise<void> {
    try {
      await this.http.post<any>(`${this.apiUrl}/disconnect`, {}).toPromise();
    } catch (error) {
      console.error('Square disconnect error:', error);
      throw error;
    }
  }

  /**
   * Manually trigger a sync
   */
  async syncNow(): Promise<void> {
    await this.http.post(`${this.apiUrl}/inventory/sync`, {}).toPromise();
  }

  /**
   * Update Square integration settings
   */
  async updateSettings(settings: any): Promise<void> {
    await this.http.put(`${environment.apiUrl}/api/integrations/square/settings`, settings).toPromise();
  }

  /**
   * Refresh catalog from Square
   */
  async refreshCatalog(): Promise<void> {
    await this.http.post(`${environment.apiUrl}/api/integrations/square/catalog/refresh`, {}).toPromise();
  }

  /**
   * Import sales from Square
   */
  async importSales(): Promise<any> {
    return await this.http.post<any>(`${environment.apiUrl}/api/integrations/square/sales/import`, {}).toPromise();
  }

  /**
   * Trigger sales import
   */
  async triggerSalesImport(endpoint: string): Promise<void> {
    await this.http.post(endpoint, {}).toPromise();
  }

  /**
   * Handle OAuth callback (called by backend)
   */
  async handleCallback(code: string, state: string): Promise<SquareStatus> {
    try {
      const response = await this.http.post<any>(`${this.apiUrl}/callback`, {
        code: code,
        state: state
      }).toPromise();

      return {
        isConnected: response.connected || true,
        merchantId: response.merchantId,
        merchantName: response.merchantName,
        connectedAt: new Date(),
        lastSync: response.lastSyncAt ? new Date(response.lastSyncAt) : undefined,
        itemCount: 0
      };
    } catch (error) {
      console.error('Square callback error:', error);
      throw error;
    }
  }

  /**
   * Update Square usage settings across the application
   */
  updateSquareUsageSettings(settings: {
    inventoryChoice?: 'consignment-genie' | 'square';
    onlineChoice?: 'consignmentgenie-storefront' | 'square-online' | 'none';
    posChoice?: 'consignmentgenie-pos' | 'square-pos' | 'manual';
  }): void {
    const currentSettings = this.getSquareUsageSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem('squareUsageSettings', JSON.stringify(updatedSettings));
  }

  /**
   * Get current Square usage settings
   */
  getSquareUsageSettings(): {
    inventoryChoice: 'consignment-genie' | 'square';
    onlineChoice: 'consignmentgenie-storefront' | 'square-online' | 'none';
    posChoice: 'consignmentgenie-pos' | 'square-pos' | 'manual';
  } {
    const stored = localStorage.getItem('squareUsageSettings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored Square usage settings:', error);
      }
    }

    // Default settings
    return {
      inventoryChoice: 'consignment-genie',
      onlineChoice: 'consignmentgenie-storefront',
      posChoice: 'consignmentgenie-pos'
    };
  }

  /**
   * Check if Square is being used in any integration point
   */
  isSquareInUse(): boolean {
    const settings = this.getSquareUsageSettings();
    return settings.inventoryChoice === 'square' ||
           settings.onlineChoice === 'square-online' ||
           settings.posChoice === 'square-pos';
  }

}