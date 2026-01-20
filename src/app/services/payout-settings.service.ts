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
}