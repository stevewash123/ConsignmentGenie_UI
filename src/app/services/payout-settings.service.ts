import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PayoutSettingsDto {
  id: string;
  organizationId: string;
  clearanceDaysCash: number;
  clearanceDaysDebitCard: number;
  clearanceDaysCreditCard: number;
  clearanceDaysCheck: number;
  clearanceDaysStoreCredit: number;
  clearanceDaysGiftCard: number;
  clearanceDaysSquare: number;
  clearanceDaysVenmo: number;
  clearanceDaysPayPal: number;
  clearanceDaysOther: number;
  minimumPayoutCheck: number;
  minimumPayoutCash: number;
  minimumPayoutVenmo: number;
  minimumPayoutPayPal: number;
  minimumPayoutStoreCredit: number;
  minimumPayoutBankTransfer: number;
  minimumPayoutZelle: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreatePayoutSettingsRequest {
  clearanceDaysCash?: number;
  clearanceDaysDebitCard?: number;
  clearanceDaysCreditCard?: number;
  clearanceDaysCheck?: number;
  clearanceDaysStoreCredit?: number;
  clearanceDaysGiftCard?: number;
  clearanceDaysSquare?: number;
  clearanceDaysVenmo?: number;
  clearanceDaysPayPal?: number;
  clearanceDaysOther?: number;
  minimumPayoutCheck?: number;
  minimumPayoutCash?: number;
  minimumPayoutVenmo?: number;
  minimumPayoutPayPal?: number;
  minimumPayoutStoreCredit?: number;
  minimumPayoutBankTransfer?: number;
  minimumPayoutZelle?: number;
}

export interface UpdatePayoutSettingsRequest {
  clearanceDaysCash?: number | null;
  clearanceDaysDebitCard?: number | null;
  clearanceDaysCreditCard?: number | null;
  clearanceDaysCheck?: number | null;
  clearanceDaysStoreCredit?: number | null;
  clearanceDaysGiftCard?: number | null;
  clearanceDaysSquare?: number | null;
  clearanceDaysVenmo?: number | null;
  clearanceDaysPayPal?: number | null;
  clearanceDaysOther?: number | null;
  minimumPayoutCheck?: number | null;
  minimumPayoutCash?: number | null;
  minimumPayoutVenmo?: number | null;
  minimumPayoutPayPal?: number | null;
  minimumPayoutStoreCredit?: number | null;
  minimumPayoutBankTransfer?: number | null;
  minimumPayoutZelle?: number | null;
}

// New PayoutSettings interfaces per the spec document
export interface NewPayoutSettings {
  id: string;
  organizationId: string;
  // General Settings
  payoutMethodCheck: boolean;
  payoutMethodCash: boolean;
  payoutMethodStoreCredit: boolean;
  payoutMethodPayPal: boolean;
  payoutMethodVenmo: boolean;
  payoutMethodACH: boolean;
  holdPeriodDays: number;
  minimumPayoutThreshold: number;
  // Direct Deposit Settings
  bankAccountConnected: boolean;
  plaidAccessToken?: string;
  plaidAccountId?: string;
  bankName?: string;
  bankAccountLast4?: string;
  minimumBalanceProtection: number;
  autoPayEnabled: boolean;
  autoPayMonday: boolean;
  autoPayTuesday: boolean;
  autoPayWednesday: boolean;
  autoPayThursday: boolean;
  autoPayFriday: boolean;
  autoPaySaturday: boolean;
  autoPaySunday: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateNewPayoutSettingsRequest {
  payoutMethodCheck?: boolean;
  payoutMethodCash?: boolean;
  payoutMethodStoreCredit?: boolean;
  payoutMethodPayPal?: boolean;
  payoutMethodVenmo?: boolean;
  payoutMethodACH?: boolean;
  holdPeriodDays?: number;
  minimumPayoutThreshold?: number;
  minimumBalanceProtection?: number;
  autoPayEnabled?: boolean;
  autoPayMonday?: boolean;
  autoPayTuesday?: boolean;
  autoPayWednesday?: boolean;
  autoPayThursday?: boolean;
  autoPayFriday?: boolean;
  autoPaySaturday?: boolean;
  autoPaySunday?: boolean;
}

export interface UpdateNewPayoutSettingsRequest {
  payoutMethodCheck?: boolean | null;
  payoutMethodCash?: boolean | null;
  payoutMethodStoreCredit?: boolean | null;
  payoutMethodPayPal?: boolean | null;
  payoutMethodVenmo?: boolean | null;
  payoutMethodACH?: boolean | null;
  holdPeriodDays?: number | null;
  minimumPayoutThreshold?: number | null;
  minimumBalanceProtection?: number | null;
  autoPayEnabled?: boolean | null;
  autoPayMonday?: boolean | null;
  autoPayTuesday?: boolean | null;
  autoPayWednesday?: boolean | null;
  autoPayThursday?: boolean | null;
  autoPayFriday?: boolean | null;
  autoPaySaturday?: boolean | null;
  autoPaySunday?: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class PayoutSettingsService {
  private readonly apiUrl = `${environment.apiUrl}/api/payoutsettings`;

  constructor(private http: HttpClient) {}

  getPayoutSettings(): Observable<PayoutSettingsDto> {
    return this.http.get<{ success: boolean; data: PayoutSettingsDto }>(this.apiUrl)
      .pipe(map(response => {
        if (!response.success) {
          throw new Error('Failed to get payout settings');
        }
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined
        };
      }));
  }

  createPayoutSettings(request: CreatePayoutSettingsRequest): Observable<PayoutSettingsDto> {
    return this.http.post<{ success: boolean; data: PayoutSettingsDto }>(this.apiUrl, request)
      .pipe(map(response => {
        if (!response.success) {
          throw new Error('Failed to create payout settings');
        }
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined
        };
      }));
  }

  updatePayoutSettings(request: UpdatePayoutSettingsRequest): Observable<PayoutSettingsDto> {
    return this.http.put<{ success: boolean; data: PayoutSettingsDto }>(this.apiUrl, request)
      .pipe(map(response => {
        if (!response.success) {
          throw new Error('Failed to update payout settings');
        }
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined
        };
      }));
  }

  deletePayoutSettings(): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(this.apiUrl)
      .pipe(map(response => {
        if (!response.success) {
          throw new Error('Failed to delete payout settings');
        }
      }));
  }

  // New API methods for the restructured payout settings
  getNewPayoutSettings(): Observable<NewPayoutSettings> {
    return this.http.get<NewPayoutSettings>(`${this.apiUrl}/new`)
      .pipe(map(response => {
        return {
          ...response,
          createdAt: new Date(response.createdAt),
          updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined
        };
      }));
  }

  createNewPayoutSettings(request: CreateNewPayoutSettingsRequest): Observable<NewPayoutSettings> {
    return this.http.post<NewPayoutSettings>(`${this.apiUrl}/new`, request)
      .pipe(map(response => {
        return {
          ...response,
          createdAt: new Date(response.createdAt),
          updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined
        };
      }));
  }

  updateNewPayoutSettings(request: UpdateNewPayoutSettingsRequest): Observable<NewPayoutSettings> {
    return this.http.put<NewPayoutSettings>(`${this.apiUrl}/new`, request)
      .pipe(map(response => {
        return {
          ...response,
          createdAt: new Date(response.createdAt),
          updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined
        };
      }));
  }
}