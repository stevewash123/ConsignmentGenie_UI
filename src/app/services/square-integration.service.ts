import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SquareStatus } from '../owner/settings/integrations/integrations-settings.component';

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
  private readonly apiUrl = `${environment.apiUrl}/api/integrations/square`;
  private http = inject(HttpClient);

  /**
   * Get current Square integration status
   */
  async getStatus(): Promise<SquareStatus> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/status`).toPromise();

      if (response.success) {
        return {
          isConnected: response.data.isConnected,
          merchantId: response.data.merchantId,
          merchantName: response.data.merchantName,
          connectedAt: response.data.connectedAt ? new Date(response.data.connectedAt) : undefined,
          lastSync: response.data.lastSync ? new Date(response.data.lastSync) : undefined,
          itemCount: response.data.itemCount
        };
      } else {
        throw new Error(response.message || 'Failed to get status');
      }
    } catch (error) {
      console.error('Square status error:', error);
      // Return mock data for development
      return this.getMockStatus();
    }
  }

  /**
   * Initiate Square OAuth connection
   */
  async initiateConnection(): Promise<string> {
    try {
      const response = await this.http.post<SquareConnectionResponse>(`${this.apiUrl}/connect`, {}).toPromise();

      if (response?.success && response.oauthUrl) {
        return response.oauthUrl;
      } else {
        throw new Error(response?.error || 'Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Square connection initiation error:', error);
      // Return mock OAuth URL for development
      return this.getMockOAuthUrl();
    }
  }

  /**
   * Disconnect from Square
   */
  async disconnect(): Promise<void> {
    try {
      const response = await this.http.post<SquareDisconnectResponse>(`${this.apiUrl}/disconnect`, {}).toPromise();

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Square disconnect error:', error);
      // For development, just log the error but don't throw
      if (!environment.production) {
        console.log('Mock disconnect successful');
        return;
      }
      throw error;
    }
  }

  /**
   * Manually trigger a sync
   */
  async syncNow(): Promise<void> {
    try {
      const response = await this.http.post<SquareSyncResponse>(`${this.apiUrl}/sync`, {}).toPromise();

      if (!response?.success) {
        throw new Error(response?.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Square sync error:', error);
      // For development, just log the error but don't throw
      if (!environment.production) {
        console.log('Mock sync successful');
        return;
      }
      throw error;
    }
  }

  /**
   * Handle OAuth callback (called by backend)
   */
  async handleCallback(code: string, state: string): Promise<SquareStatus> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/callback?code=${code}&state=${state}`).toPromise();

      if (response.success) {
        return {
          isConnected: true,
          merchantId: response.data.merchantId,
          merchantName: response.data.merchantName,
          connectedAt: new Date(),
          lastSync: undefined,
          itemCount: 0
        };
      } else {
        throw new Error(response.message || 'OAuth callback failed');
      }
    } catch (error) {
      console.error('Square callback error:', error);
      throw error;
    }
  }

  /**
   * Mock status for development
   */
  private getMockStatus(): SquareStatus {
    const isConnected = Math.random() > 0.5; // Random for testing

    if (isConnected) {
      return {
        isConnected: true,
        merchantId: 'MLR8XT6T0KH2N',
        merchantName: "Jane's Vintage Shop",
        connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        itemCount: 47
      };
    } else {
      return {
        isConnected: false
      };
    }
  }

  /**
   * Mock OAuth URL for development
   */
  private getMockOAuthUrl(): string {
    const clientId = environment.squareApplicationId || 'sandbox-sq0idb-XXXXXXXXXXXXXXXXXXXXXXXX';
    const redirectUri = encodeURIComponent(`${window.location.origin}/owner/settings/integrations/square/callback`);
    const state = 'mock-csrf-token-' + Date.now();
    const scopes = 'ITEMS_READ+ORDERS_READ+MERCHANT_PROFILE_READ+INVENTORY_READ';

    return `https://connect.squareupsandbox.com/oauth2/authorize?` +
           `client_id=${clientId}&` +
           `scope=${scopes}&` +
           `redirect_uri=${redirectUri}&` +
           `state=${state}&` +
           `response_type=code`;
  }
}