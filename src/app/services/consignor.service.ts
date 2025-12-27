import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Consignor, ConsignorListDto, CreateConsignorRequest, UpdateConsignorRequest } from '../models/consignor.model';
import { BalanceAdjustment, CreateBalanceAdjustmentRequest, BalanceAdjustmentResponse, ConsignorBalance } from '../models/balance-adjustment.model';
import { PagedResult } from '../models/inventory.model';
import { environment } from '../../environments/environment';

export interface ConsignorInvitationRequest {
  name: string;
  email: string;
}

export interface ConsignorInvitationResponse {
  success: boolean;
  message: string;
  invitation?: any;
}

export interface InvitationValidationResponse {
  isValid: boolean;
  message?: string;
  shopName?: string;
  invitedName?: string;
  invitedEmail?: string;
  expirationDate?: string;
}

export interface ConsignorRegistrationRequest {
  invitationToken: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export interface PendingInvitation {
  id: number;
  email: string;
  name?: string;
  sentAt: string;
  expiresAt: string;
  status: 'pending' | 'expired' | 'cancelled';
}

export interface BulkInvitationRequest {
  invitations: ConsignorInvitationRequest[];
  personalMessage?: string;
}

export interface BulkInvitationResponse {
  success: boolean;
  message: string;
  results: {
    successful: number;
    failed: number;
    details: {
      email: string;
      success: boolean;
      message: string;
    }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConsignorService {
  private readonly apiUrl = `${environment.apiUrl}/api/consignors`;
  private readonly authUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  getConsignors(): Observable<Consignor[]> {
    return this.http.get<PagedResult<ConsignorListDto>>(this.apiUrl).pipe(
      map(response => response.items.map(dto => this.transformToConsignor(dto)))
    );
  }

  private transformToConsignor(dto: ConsignorListDto): Consignor {
    return {
      id: dto.consignorId,
      name: dto.fullName,
      email: dto.email || '',
      phone: dto.phone,
      address: undefined, // Not provided in DTO
      commissionRate: dto.commissionRate,
      preferredPaymentMethod: undefined, // Not provided in DTO
      paymentDetails: undefined, // Not provided in DTO
      notes: undefined, // Not provided in DTO
      isActive: dto.status === 'active',
      status: dto.status as 'active' | 'invited' | 'inactive',
      organizationId: 0, // Not provided in DTO
      consignorNumber: dto.consignorNumber,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.createdAt), // Use same as created since updated not provided
      invitedAt: undefined, // Not provided in DTO
      activatedAt: undefined // Not provided in DTO
    };
  }

  getConsignor(id: number): Observable<Consignor> {
    return this.http.get<Consignor>(`${this.apiUrl}/${id}`);
  }

  createConsignor(request: CreateConsignorRequest): Observable<Consignor> {
    return this.http.post<Consignor>(this.apiUrl, request);
  }

  updateConsignor(id: number, request: UpdateConsignorRequest): Observable<Consignor> {
    return this.http.put<Consignor>(`${this.apiUrl}/${id}`, request);
  }

  deleteConsignor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deactivateConsignor(id: number): Observable<Consignor> {
    return this.http.patch<Consignor>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateConsignor(id: number): Observable<Consignor> {
    return this.http.patch<Consignor>(`${this.apiUrl}/${id}/activate`, {});
  }

  inviteConsignor(invitation: ConsignorInvitationRequest): Observable<ConsignorInvitationResponse> {
    return this.http.post<ConsignorInvitationResponse>(`${this.apiUrl}/invitations`, invitation);
  }

  bulkInviteConsignors(bulkRequest: BulkInvitationRequest): Observable<BulkInvitationResponse> {
    return this.http.post<BulkInvitationResponse>(`${this.apiUrl}/invitations/bulk`, bulkRequest);
  }

  getPendingInvitations(): Observable<PendingInvitation[]> {
    return this.http.get<PendingInvitation[]>(`${this.apiUrl}/invitations`);
  }

  resendInvitation(invitationId: number): Observable<ConsignorInvitationResponse> {
    return this.http.post<ConsignorInvitationResponse>(`${this.apiUrl}/invitations/${invitationId}/resend`, {});
  }

  cancelInvitation(invitationId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/invitations/${invitationId}`);
  }

  validateInvitation(token: string): Observable<InvitationValidationResponse> {
    return this.http.get<InvitationValidationResponse>(`${environment.apiUrl}/api/invitations/validate/${token}`);
  }

  registerFromInvitation(request: ConsignorRegistrationRequest): Observable<RegistrationResult> {
    return this.http.post<RegistrationResult>(`${environment.apiUrl}/api/invitations/register`, request);
  }

  createBalanceAdjustment(consignorId: string, request: CreateBalanceAdjustmentRequest): Observable<BalanceAdjustmentResponse> {
    return this.http.post<BalanceAdjustmentResponse>(`${this.apiUrl}/${consignorId}/adjustments`, request);
  }

  getConsignorAdjustments(consignorId: string): Observable<BalanceAdjustment[]> {
    return this.http.get<BalanceAdjustment[]>(`${this.apiUrl}/${consignorId}/adjustments`);
  }

  getConsignorBalance(consignorId: string): Observable<ConsignorBalance> {
    return this.http.get<ConsignorBalance>(`${this.apiUrl}/${consignorId}/balance`);
  }
}