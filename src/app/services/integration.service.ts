import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SquareConnectionStatus {
  connected: boolean;
  merchantId?: string;
  merchantName?: string;
  lastSyncAt?: string;
  integrationMode?: string;
}

export interface AuthUrlResponse {
  authUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSquareStatus(): Observable<SquareConnectionStatus> {
    return this.http.get<SquareConnectionStatus>(
      `${this.apiUrl}/owner/integrations/square/status`
    );
  }

  getSquareAuthUrl(): Observable<AuthUrlResponse> {
    return this.http.get<AuthUrlResponse>(
      `${this.apiUrl}/owner/integrations/square/auth-url`
    );
  }

  disconnectSquare(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/owner/integrations/square/disconnect`,
      {}
    );
  }

  // Called after OAuth callback redirect
  checkConnectionAfterCallback(): Observable<SquareConnectionStatus> {
    return this.getSquareStatus();
  }
}