import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AgreementStatusDto {
  consignorId: string;
  agreementMethod: string;
  status: string;
  requiredForItemSubmission: boolean;
  latestUpload: ConsignorAgreementUploadDto | null;
}

export interface ConsignorAgreementUploadDto {
  id: string;
  consignorId: string;
  uploadedAt: string;
  fileUrl: string;
  recommendation: string | null;
  status: string | null;
  reviewedAt: string | null;
  reviewDecision: string | null;
  reviewNote: string | null;
}

export interface UploadAgreementRequest {
  consignorId: string;
  agreementFile: File;
}

export interface ReviewAgreementRequest {
  decision: string; // 'approved' or 'rejected'
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgreementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/agreements`;

  /**
   * Upload a signed agreement document for a consignor
   */
  uploadAgreement(request: UploadAgreementRequest): Observable<ConsignorAgreementUploadDto> {
    const formData = new FormData();
    formData.append('consignorId', request.consignorId);
    formData.append('agreementFile', request.agreementFile);

    return this.http.post<ConsignorAgreementUploadDto>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Get agreement status for a consignor
   */
  getAgreementStatus(consignorId: string): Observable<AgreementStatusDto> {
    return this.http.get<AgreementStatusDto>(`${this.baseUrl}/status/${consignorId}`);
  }

  /**
   * Get all agreement uploads for a consignor (Owner only)
   */
  getAgreementUploads(consignorId: string): Observable<ConsignorAgreementUploadDto[]> {
    return this.http.get<ConsignorAgreementUploadDto[]>(`${this.baseUrl}/uploads/${consignorId}`);
  }

  /**
   * Review an agreement upload (Owner only)
   */
  reviewAgreement(uploadId: string, request: ReviewAgreementRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/review/${uploadId}`, request);
  }
}