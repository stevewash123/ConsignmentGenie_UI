import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BookkeepingSettings {
  id: string;
  organizationId: string;
  useQuickBooks: boolean;
  quickBooksConnected: boolean;
  quickBooksCompanyId?: string;
  quickBooksCompanyName?: string;
  quickBooksLastSync?: Date;
  salesSyncEnabled: boolean;
  consignorSyncEnabled: boolean;
  payoutRecordingMethod: 'bill-payment' | 'direct-expense';
  lineItemDetail: 'lump-sum' | 'itemized';
  syncFrequency: 'manual' | 'daily' | 'real-time';
  accountMappings: string;
  autoCreateVendors: boolean;
  syncItemsAsProducts: boolean;
  trackInventoryQuantities: boolean;
  continueOnSyncErrors: boolean;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
  lastSyncError?: string;
  enableCsvExport: boolean;
  enableExcelExport: boolean;
  exportFilePrefix?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookkeepingSettingsRequest {
  useQuickBooks?: boolean;
  quickBooksConnected?: boolean;
  quickBooksCompanyId?: string;
  quickBooksCompanyName?: string;
  salesSyncEnabled?: boolean;
  consignorSyncEnabled?: boolean;
  payoutRecordingMethod?: string;
  lineItemDetail?: string;
  syncFrequency?: string;
  accountMappings?: string;
  autoCreateVendors?: boolean;
  syncItemsAsProducts?: boolean;
  trackInventoryQuantities?: boolean;
  continueOnSyncErrors?: boolean;
  enableCsvExport?: boolean;
  enableExcelExport?: boolean;
  exportFilePrefix?: string;
}

export interface UpdateBookkeepingSettingsRequest {
  useQuickBooks?: boolean | null;
  quickBooksConnected?: boolean | null;
  quickBooksCompanyId?: string | null;
  quickBooksCompanyName?: string | null;
  salesSyncEnabled?: boolean | null;
  consignorSyncEnabled?: boolean | null;
  payoutRecordingMethod?: string | null;
  lineItemDetail?: string | null;
  syncFrequency?: string | null;
  accountMappings?: string | null;
  autoCreateVendors?: boolean | null;
  syncItemsAsProducts?: boolean | null;
  trackInventoryQuantities?: boolean | null;
  continueOnSyncErrors?: boolean | null;
  lastSyncError?: string | null;
  enableCsvExport?: boolean | null;
  enableExcelExport?: boolean | null;
  exportFilePrefix?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class BookkeepingSettingsService {
  private readonly apiUrl = `${environment.apiUrl}/api/bookkeeping-settings`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<BookkeepingSettings> {
    return this.http.get<BookkeepingSettings>(this.apiUrl)
      .pipe(map(response => {
        return {
          ...response,
          quickBooksLastSync: response.quickBooksLastSync ? new Date(response.quickBooksLastSync) : undefined,
          lastSyncAttempt: response.lastSyncAttempt ? new Date(response.lastSyncAttempt) : undefined,
          lastSuccessfulSync: response.lastSuccessfulSync ? new Date(response.lastSuccessfulSync) : undefined,
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt)
        };
      }));
  }

  createSettings(request: CreateBookkeepingSettingsRequest): Observable<BookkeepingSettings> {
    return this.http.post<BookkeepingSettings>(this.apiUrl, request)
      .pipe(map(response => {
        return {
          ...response,
          quickBooksLastSync: response.quickBooksLastSync ? new Date(response.quickBooksLastSync) : undefined,
          lastSyncAttempt: response.lastSyncAttempt ? new Date(response.lastSyncAttempt) : undefined,
          lastSuccessfulSync: response.lastSuccessfulSync ? new Date(response.lastSuccessfulSync) : undefined,
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt)
        };
      }));
  }

  updateSettings(request: UpdateBookkeepingSettingsRequest): Observable<BookkeepingSettings> {
    return this.http.put<BookkeepingSettings>(this.apiUrl, request)
      .pipe(map(response => {
        return {
          ...response,
          quickBooksLastSync: response.quickBooksLastSync ? new Date(response.quickBooksLastSync) : undefined,
          lastSyncAttempt: response.lastSyncAttempt ? new Date(response.lastSyncAttempt) : undefined,
          lastSuccessfulSync: response.lastSuccessfulSync ? new Date(response.lastSuccessfulSync) : undefined,
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt)
        };
      }));
  }

  patchSettings(updates: any): Observable<BookkeepingSettings> {
    return this.http.patch<BookkeepingSettings>(this.apiUrl, updates)
      .pipe(map(response => {
        return {
          ...response,
          quickBooksLastSync: response.quickBooksLastSync ? new Date(response.quickBooksLastSync) : undefined,
          lastSyncAttempt: response.lastSyncAttempt ? new Date(response.lastSyncAttempt) : undefined,
          lastSuccessfulSync: response.lastSuccessfulSync ? new Date(response.lastSuccessfulSync) : undefined,
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt)
        };
      }));
  }

  deleteSettings(): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(this.apiUrl)
      .pipe(map(response => {
        if (!response.success) {
          throw new Error('Failed to delete bookkeeping settings');
        }
      }));
  }
}