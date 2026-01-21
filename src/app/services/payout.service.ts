import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PayoutDto,
  PayoutListDto,
  PayoutStatus,
  CreatePayoutRequest,
  UpdatePayoutRequest,
  PayoutSearchRequest,
  PayoutSearchResponse,
  PendingPayoutsRequest,
  PendingPayoutData
} from '../models/payout.model';
import { environment } from '../../environments/environment';

export { PayoutStatus };

@Injectable({
  providedIn: 'root'
})
export class PayoutService {
  private readonly apiUrl = `${environment.apiUrl}/api/payouts`;

  constructor(private http: HttpClient) {}

  getPayouts(request?: PayoutSearchRequest): Observable<PayoutSearchResponse> {
    let params = new HttpParams();

    if (request?.consignorId) params = params.set('ConsignorId', request.consignorId);
    if (request?.payoutDateFrom) params = params.set('payoutDateFrom', request.payoutDateFrom.toISOString());
    if (request?.payoutDateTo) params = params.set('payoutDateTo', request.payoutDateTo.toISOString());
    if (request?.status) params = params.set('status', request.status);
    if (request?.periodStart) params = params.set('periodStart', request.periodStart.toISOString());
    if (request?.periodEnd) params = params.set('periodEnd', request.periodEnd.toISOString());
    if (request?.page) params = params.set('page', request.page.toString());
    if (request?.pageSize) params = params.set('pageSize', request.pageSize.toString());
    if (request?.sortBy) params = params.set('sortBy', request.sortBy);
    if (request?.sortDirection) params = params.set('sortDirection', request.sortDirection);

    return this.http.get<PayoutSearchResponse>(this.apiUrl, { params });
  }

  getPayoutById(id: string): Observable<PayoutDto> {
    return this.http.get<{success: boolean, data: PayoutDto}>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  getPendingPayouts(request?: PendingPayoutsRequest): Observable<PendingPayoutData[]> {
    let params = new HttpParams();

    if (request?.consignorId) params = params.set('ConsignorId', request.consignorId);
    if (request?.periodEndBefore) params = params.set('periodEndBefore', request.periodEndBefore.toISOString());
    if (request?.minimumAmount) params = params.set('minimumAmount', request.minimumAmount.toString());

    return this.http.get<{success: boolean, data: PendingPayoutData[]}>(`${this.apiUrl}/pending`, { params })
      .pipe(map(response => response.data));
  }

  createPayout(request: CreatePayoutRequest): Observable<PayoutDto> {
    // Map frontend providerId to backend ConsignorId
    const apiRequest = {
      ConsignorId: request.consignorId,
      payoutDate: request.payoutDate,
      paymentMethod: request.paymentMethod,
      paymentReference: request.paymentReference,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      notes: request.notes,
      transactionIds: request.transactionIds
    };

    return this.http.post<{success: boolean, data: PayoutDto}>(this.apiUrl, apiRequest)
      .pipe(map(response => response.data));
  }

  updatePayoutObservable(id: string, request: UpdatePayoutRequest): Observable<void> {
    return this.http.put<{success: boolean, message: string}>(`${this.apiUrl}/${id}`, request)
      .pipe(map(() => {}));
  }

  deletePayout(id: string): Observable<void> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${id}`)
      .pipe(map(() => {}));
  }

  exportPayoutToCsv(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export`, {
      responseType: 'blob'
    });
  }

  exportPayoutToPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  // Single payout processing method for the new story
  processSinglePayout(request: {
    consignorId: string;
    amount: number;
    method: string;
    checkNumber?: string;
    notes?: string;
  }): Observable<{
    id: string;
    payoutNumber: string;
    amount: number;
    method: string;
    consignorName: string;
    createdAt: Date;
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        id: string;
        payoutNumber: string;
        amount: number;
        method: string;
        consignorName: string;
        createdAt: Date;
      }
    }>(`${this.apiUrl}/process`, request)
      .pipe(map(response => response.data));
  }

  // Batch payout methods for story 04
  getBatchPayoutPreview(request: {
    method: string;
    consignorIds?: string[] | null;
  }): Observable<{
    eligibleConsignors: {
      consignorId: string;
      name: string;
      availableBalance: number;
      preferredPaymentMethod?: string;
    }[];
    totalAmount: number;
    count: number;
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        eligibleConsignors: {
          consignorId: string;
          name: string;
          availableBalance: number;
          preferredPaymentMethod?: string;
        }[];
        totalAmount: number;
        count: number;
      }
    }>(`${this.apiUrl}/batch/preview`, request)
      .pipe(map(response => response.data));
  }

  processBatchPayout(request: {
    method: string;
    consignorIds: string[];
    notes?: string;
  }): Observable<{
    payouts: {
      consignorId: string;
      consignorName: string;
      amount: number;
      method: string;
      payoutNumber: string;
    }[];
    totalAmount: number;
    count: number;
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        payouts: {
          consignorId: string;
          consignorName: string;
          amount: number;
          method: string;
          payoutNumber: string;
        }[];
        totalAmount: number;
        count: number;
      }
    }>(`${this.apiUrl}/batch`, request)
      .pipe(map(response => response.data));
  }

  // Methods for payout history (story 05)
  async getPayoutHistory(filters: {
    consignorId?: string;
    method?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    searchTerm?: string;
    page: number;
    pageSize: number;
  }): Promise<{
    payouts: {
      id: string;
      payoutNumber: string;
      date: Date;
      consignorId: string;
      consignorName: string;
      amount: number;
      method: string;
      status: string;
      notes?: string;
      processedBy: string;
      itemCount: number;
    }[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    const response = await this.http.get<{
      success: boolean;
      data: {
        payouts: {
          id: string;
          payoutNumber: string;
          date: string;
          consignorId: string;
          consignorName: string;
          amount: number;
          method: string;
          status: string;
          notes?: string;
          processedBy: string;
          itemCount: number;
        }[];
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }
    }>(`${this.apiUrl}/history`, { params }).toPromise();

    if (!response?.success) {
      throw new Error('Failed to get payout history');
    }

    // Convert date strings to Date objects
    const payouts = response.data.payouts.map(p => ({
      ...p,
      date: new Date(p.date)
    }));

    return {
      ...response.data,
      payouts
    };
  }

  getConsignorsList(): Observable<{ id: string, name: string }[]> {
    return this.http.get<{
      success: boolean;
      data: { id: string, name: string }[]
    }>(`${environment.apiUrl}/api/consignors/list`).pipe(
      map(response => {
        if (!response?.success) {
          throw new Error('Failed to get consignors list');
        }
        return response.data;
      })
    );
  }

  getPayoutDetail(payoutId: string): Observable<{
    id: string;
    payoutNumber: string;
    date: Date;
    consignorId: string;
    consignorName: string;
    consignorEmail?: string;
    consignorPhone?: string;
    amount: number;
    method: string;
    status: string;
    notes?: string;
    processedBy: string;
    processedDate: Date;
    voidedBy?: string;
    voidedDate?: Date;
    voidReason?: string;
    items: {
      id: string;
      itemId: string;
      title: string;
      category: string;
      saleDate: Date;
      salePrice: number;
      consignorCut: number;
      commission: number;
      transactionId: string;
    }[];
  }> {
    return this.http.get<{
      success: boolean;
      data: {
        id: string;
        payoutNumber: string;
        date: string;
        consignorId: string;
        consignorName: string;
        consignorEmail?: string;
        consignorPhone?: string;
        amount: number;
        method: string;
        status: string;
        notes?: string;
        processedBy: string;
        processedDate: string;
        voidedBy?: string;
        voidedDate?: string;
        voidReason?: string;
        items: {
          id: string;
          itemId: string;
          title: string;
          category: string;
          saleDate: string;
          salePrice: number;
          consignorCut: number;
          commission: number;
          transactionId: string;
        }[];
      }
    }>(`${this.apiUrl}/${payoutId}/detail`).pipe(
      map(response => {
        if (!response?.success) {
          throw new Error('Failed to get payout detail');
        }

        // Convert date strings to Date objects
        const data = response.data;
        return {
          ...data,
          date: new Date(data.date),
          processedDate: new Date(data.processedDate),
          voidedDate: data.voidedDate ? new Date(data.voidedDate) : undefined,
          items: data.items.map(item => ({
            ...item,
            saleDate: new Date(item.saleDate)
          }))
        };
      })
    );
  }

  updatePayout(payoutId: string, updateData: {
    method: string;
    notes: string;
  }): Observable<void> {
    return this.http.put<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${payoutId}/update`, updateData).pipe(
      map(response => {
        if (!response?.success) {
          throw new Error('Failed to update payout');
        }
      })
    );
  }

  voidPayout(payoutId: string, reason: string): Observable<void> {
    return this.http.post<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${payoutId}/void`, { reason }).pipe(
      map(response => {
        if (!response?.success) {
          throw new Error('Failed to void payout');
        }
      })
    );
  }

  downloadPayoutReceipt(payoutId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${payoutId}/receipt`, {
      responseType: 'blob'
    });
  }

  exportPayoutHistoryCSV(filters: {
    consignorId?: string;
    method?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    searchTerm?: string;
  }): Observable<string> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/history/export`, {
      params,
      responseType: 'text'
    });
  }

  updatePayoutStatus(id: string, status: PayoutStatus): Observable<void> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/status`, { Status: status })
      .pipe(map(response => {
        if (!response.success) {
          throw new Error('Failed to update payout status');
        }
      }));
  }

  refreshSummaries(): Observable<void> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/summaries/refresh`, {})
      .pipe(map(response => {
        if (!response.success) {
          throw new Error('Failed to refresh payout summaries');
        }
      }));
  }
}