import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AgreementTemplate } from '../models/agreements.models';

export interface AgreementSettings {
  autoSendAgreementOnRegister: boolean;
}

export interface EmailAgreementRequest {
  consignorId: string;
  emailAddress?: string; // Optional override, otherwise uses consignor's email
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
  private agreementSettings$ = new BehaviorSubject<AgreementSettings | null>(null);

  // Observable for components to subscribe to
  readonly agreementSettings = this.agreementSettings$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Send generated consignment agreement via email to a consignor
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
   * Generate agreement content for a specific consignor
   */
  generateAgreementForConsignor(consignorId: string): Observable<{ htmlContent: string; pdfUrl?: string }> {
    return this.http.get<{ htmlContent: string; pdfUrl?: string }>(`${this.baseUrl}/api/agreements/generate/${consignorId}`);
  }

  // === AGREEMENT TEMPLATE MANAGEMENT ===
  // (Moved from SettingsService for better organization)

  /**
   * Upload agreement template file
   */
  async uploadAgreementTemplate(file: File): Promise<AgreementTemplate> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await firstValueFrom(
      this.http.post<AgreementTemplate>(`${this.baseUrl}/api/organizations/agreements/templates`, formData)
    );

    return response;
  }

  /**
   * Download agreement template file
   */
  async downloadAgreementTemplate(templateId: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/organizations/agreements/templates/${templateId}`,
        { responseType: 'blob' })
    );

    return response;
  }

  /**
   * Get agreement template content as text
   */
  async getAgreementTemplateAsText(templateId: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/organizations/agreements/templates/${templateId}/text`,
        { responseType: 'text' })
    );

    return response;
  }

  /**
   * Delete agreement template file
   */
  async deleteAgreementTemplate(templateId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.baseUrl}/api/organizations/agreements/templates/${templateId}`)
    );
  }

  /**
   * Generate PDF from text content
   */
  async generatePdfFromText(textContent: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.http.post(`${this.baseUrl}/api/organizations/agreements/generate-pdf`,
        { content: textContent, contentType: 'text' },
        { responseType: 'blob' })
    );

    return response;
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePdfFromHtml(htmlContent: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.http.post(`${this.baseUrl}/api/organizations/agreements/generate-pdf`,
        { content: htmlContent, contentType: 'html' },
        { responseType: 'blob' })
    );

    return response;
  }

  /**
   * Send sample agreement as notification to owner
   */
  async sendSampleAgreement(templateContent: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/api/organizations/agreements/send-sample`,
        { templateContent })
    );
  }

  // === AGREEMENT SETTINGS MANAGEMENT ===

  /**
   * Load agreement settings from API
   */
  async loadAgreementSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<AgreementSettings>(`${this.baseUrl}/api/owner/settings/consignor/consignor-onboarding`)
      );
      this.agreementSettings$.next(settings);
    } catch (error) {
      console.error('Failed to load agreement settings:', error);
      // Set default settings on error
      this.agreementSettings$.next({
        autoSendAgreementOnRegister: false
      });
    }
  }

  /**
   * Update agreement settings
   */
  async updateAgreementSettings(settings: Partial<AgreementSettings>): Promise<void> {
    const current = this.agreementSettings$.value || {
      autoSendAgreementOnRegister: false
    };

    const updated = { ...current, ...settings };

    // Optimistic update
    this.agreementSettings$.next(updated);

    try {
      const response = await firstValueFrom(
        this.http.put<AgreementSettings>(`${this.baseUrl}/api/owner/settings/consignor/consignor-onboarding`, updated)
      );
      this.agreementSettings$.next(response);
    } catch (error) {
      // Revert on error
      this.agreementSettings$.next(current);
      throw error;
    }
  }

  /**
   * Get current agreement settings
   */
  getCurrentAgreementSettings(): AgreementSettings | null {
    return this.agreementSettings$.value;
  }

  /**
   * Get organization's agreement template ID from Organization table
   */
  async getOrganizationAgreementTemplateId(): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<{agreementTemplateId: string | null}>(`${this.baseUrl}/api/organizations/agreement-template-id`)
      );
      return response.agreementTemplateId;
    } catch (error) {
      console.error('Failed to get organization agreement template ID:', error);
      return null;
    }
  }

  /**
   * Update a single agreement setting
   */
  updateAgreementSetting<K extends keyof AgreementSettings>(
    key: K,
    value: AgreementSettings[K]
  ): void {
    this.updateAgreementSettings({ [key]: value } as Partial<AgreementSettings>);
  }
}