import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmailAgreementRequest {
  providerId: string;
  emailAddress?: string; // Optional override, otherwise uses provider's email
  includeInstructions?: boolean;
  customMessage?: string;
}

export interface EmailAgreementResponse {
  success: boolean;
  message: string;
  emailId?: string;
  sentAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgreementService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Send generated consignment agreement via email to a provider
   */
  emailAgreement(request: EmailAgreementRequest): Observable<EmailAgreementResponse> {
    return this.http.post<EmailAgreementResponse>(`${this.baseUrl}/api/agreements/email`, request);
  }

  /**
   * Get the current agreement template for the organization
   */
  getAgreementTemplate(): Observable<string> {
    return this.http.get<string>(`${this.baseUrl}/api/agreements/template`);
  }

  /**
   * Generate agreement content for a specific provider
   */
  generateAgreementForProvider(providerId: string): Observable<{ htmlContent: string; pdfUrl?: string }> {
    return this.http.get<{ htmlContent: string; pdfUrl?: string }>(`${this.baseUrl}/api/agreements/generate/${providerId}`);
  }
}