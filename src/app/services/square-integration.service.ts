import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SquareStatus } from '../owner/settings/integrations/sales/sales.component';

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
  getStatus(): Observable<SquareStatus> {
    return this.http.get<any>(`${this.apiUrl}/status`).pipe(
      map(response => {
        return {
          isConnected: response.connected || response.isConnected || false,
          merchantId: response.merchantId,
          merchantName: response.merchantName,
          connectedAt: response.connectedAt ? new Date(response.connectedAt) : undefined,
          lastSync: response.lastSyncAt ? new Date(response.lastSyncAt) : (response.lastSync ? new Date(response.lastSync) : undefined),
          itemCount: response.itemCount || 0
        };
      })
    );
  }

  /**
   * Initiate Square OAuth connection
   */
  initiateConnection(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth-url`);
  }

  /**
   * Disconnect from Square
   */
  disconnect(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/disconnect`, {});
  }

  /**
   * Sync Square inventory to ConsignmentGenie (import from Square)
   */
  syncFromSquare(): Observable<any> {
    return this.http.post(`${this.apiUrl}/inventory/sync`, {});
  }

  /**
   * Full sync - this is the main sync operation
   */
  performFullSync(): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync`, {});
  }

  /**
   * @deprecated Use syncFromSquare() or performFullSync() instead
   */
  syncNow(): Observable<any> {
    return this.syncFromSquare();
  }

  /**
   * Update Square integration settings
   */
  updateSettings(settings: any): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/api/integrations/square/settings`, settings);
  }

  /**
   * Refresh catalog from Square
   */
  refreshCatalog(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/integrations/square/catalog/refresh`, {});
  }

  /**
   * Import sales from Square
   */
  importSales(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/integrations/square/sales/import`, {});
  }

  /**
   * Handle OAuth callback (called by backend)
   */
  handleCallback(code: string, state: string): Observable<SquareStatus> {
    return this.http.post<any>(`${this.apiUrl}/callback`, {
      code: code,
      state: state
    }).pipe(
      map(response => {
        return {
          isConnected: response.connected || true,
          merchantId: response.merchantId,
          merchantName: response.merchantName,
          connectedAt: new Date(),
          lastSync: response.lastSyncAt ? new Date(response.lastSyncAt) : undefined,
          itemCount: 0
        };
      }),
      catchError(error => {
        console.error('Square callback error:', error);
        throw error;
      })
    );
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

  /**
   * Clear all Square-related localStorage settings
   */
  clearSquareLocalStorage(): void {
    localStorage.removeItem('squareUsageSettings');
    localStorage.removeItem('pendingSalesShopChoice');
    console.log('🔧 [SquareService] Cleared Square localStorage settings');
  }

}