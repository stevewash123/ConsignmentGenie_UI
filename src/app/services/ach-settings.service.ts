import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: Date;
}

export interface PlaidExchangeTokenRequest {
  publicToken: string;
  accountId: string;
  accountName?: string;
  institutionName?: string;
  accountType?: string;
  accountMask?: string;
}

export interface BankAccountLinkedResponse {
  success: boolean;
  fundingSource: FundingSourceDto;
  message: string;
}

export interface FundingSourceDto {
  id: string;
  bankName: string;
  accountType: string;
  accountNumberMask: string;
  status: string;
  isDefault: boolean;
  connectedAt: Date;
}

export interface DisconnectFundingSourceRequest {
  fundingSourceId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AchSettingsService {
  private baseUrl = `${environment.apiUrl}/api/owner/settings/payouts`;

  constructor(private http: HttpClient) { }

  createPlaidLinkToken(): Observable<PlaidLinkTokenResponse> {
    return this.http.post<PlaidLinkTokenResponse>(`${this.baseUrl}/direct-deposit/plaid/link-token`, {});
  }

  exchangePlaidToken(request: PlaidExchangeTokenRequest): Observable<BankAccountLinkedResponse> {
    return this.http.post<BankAccountLinkedResponse>(`${this.baseUrl}/direct-deposit/plaid/exchange-token`, request);
  }

  disconnectFundingSource(request: DisconnectFundingSourceRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/direct-deposit/bank/disconnect`, {});
  }
}