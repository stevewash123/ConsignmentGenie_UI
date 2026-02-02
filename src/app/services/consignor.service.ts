import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Consignor, ConsignorListDto, ConsignorDetailDto, ApiResponse, CreateConsignorRequest, UpdateConsignorRequest, ConsignorStatusChangeRequest, ConsignorStatusChangeResponse, PendingConsignorApproval, ConsignorApprovalRequest, ConsignorApprovalResponse, ConsignorStatus } from '../models/consignor.model';
import { ConsignorOnboardingSettings } from '../models/consignor.models';
import { BalanceAdjustment, CreateBalanceAdjustmentRequest, BalanceAdjustmentResponse, ConsignorBalance } from '../models/balance-adjustment.model';
import { PagedResult } from '../shared/models/api.models';
import { environment } from '../../environments/environment';

export interface ConsignorNotificationSettings {
  emailOnNewConsignor: boolean;
  emailOnItemSold: boolean;
}

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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export interface PendingInvitation {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
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
  private notificationSettings$ = new BehaviorSubject<ConsignorNotificationSettings | null>(null);

  // Observable for components to subscribe to
  readonly notificationSettings = this.notificationSettings$.asObservable();

  constructor(private http: HttpClient) {}

  getConsignors(): Observable<Consignor[]> {
    return this.http.get<PagedResult<ConsignorListDto>>(this.apiUrl).pipe(
      map(response => response.items.map(dto => this.transformToConsignor(dto)))
    );
  }

  private transformToConsignor(dto: ConsignorListDto): Consignor {
    return {
      id: dto.consignorId.toString(),
      name: dto.fullName,
      email: dto.email || '',
      phone: dto.phone,
      address: undefined, // Not provided in DTO
      commissionRate: dto.commissionRate,
      preferredPaymentMethod: undefined, // Not provided in DTO
      paymentDetails: undefined, // Not provided in DTO
      notes: undefined, // Not provided in DTO
      status: dto.status as 'active' | 'invited' | 'inactive',
      organizationId: 0, // Not provided in DTO
      consignorNumber: dto.consignorNumber,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.createdAt), // Use same as created since updated not provided
      invitedAt: undefined, // Not provided in DTO
      activatedAt: undefined // Not provided in DTO
    };
  }

  getConsignor(id: string): Observable<Consignor> {
    return this.http.get<ApiResponse<ConsignorDetailDto>>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.transformDetailToConsignor(response.data))
    );
  }

  private transformDetailToConsignor(dto: ConsignorDetailDto): Consignor {
    return {
      id: dto.consignorId,
      name: dto.fullName,
      email: dto.email || '',
      phone: dto.phone,
      address: dto.fullAddress,
      commissionRate: dto.commissionRate,
      preferredPaymentMethod: dto.preferredPaymentMethod,
      paymentDetails: dto.paymentDetails,
      notes: dto.notes,
      status: this.mapApiStatusToConsignorStatus(dto.status),
      organizationId: 1, // Will be handled by backend
      consignorNumber: dto.consignorNumber,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      activatedAt: dto.approvalDate ? new Date(dto.approvalDate) : undefined
    };
  }

  getConsignorStats(id: string): Observable<any> {
    return this.http.get<ApiResponse<ConsignorDetailDto>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const dto = response.data;
        return {
          totalItems: dto.totalItems,
          activeItems: dto.activeItems,
          soldItems: dto.soldItems,
          totalEarnings: dto.totalEarnings,
          pendingPayout: dto.pendingBalance
        };
      })
    );
  }

  createConsignor(request: CreateConsignorRequest): Observable<Consignor> {
    return this.http.post<Consignor>(this.apiUrl, request);
  }

  updateConsignor(id: string, request: UpdateConsignorRequest): Observable<Consignor> {
    return this.http.put<Consignor>(`${this.apiUrl}/${id}`, request);
  }

  deleteConsignor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deactivateConsignor(id: string): Observable<Consignor> {
    return this.http.patch<Consignor>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateConsignor(id: string): Observable<Consignor> {
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

  // Status management methods
  changeConsignorStatus(consignorId: number, request: ConsignorStatusChangeRequest): Observable<ConsignorStatusChangeResponse> {
    return this.http.patch<ConsignorStatusChangeResponse>(`${this.apiUrl}/${consignorId}/status`, request);
  }

  // Approval workflow methods - Use getConsignors() and filter for status === 'pending'

  processApproval(approvalId: number, request: ConsignorApprovalRequest): Observable<ConsignorApprovalResponse> {
    return this.http.post<ConsignorApprovalResponse>(`${this.apiUrl}/approvals/${approvalId}`, request);
  }

  // Agreement management methods
  getAgreementStatus(consignorId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement`);
  }

  markAgreementOnFile(consignorId: string, notes: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement/mark-on-file`, { notes });
  }

  uploadAgreement(consignorId: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement/upload`, formData);
  }

  removeAgreement(consignorId: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement`);
  }

  private mapApiStatusToConsignorStatus(apiStatus: string): ConsignorStatus {
    switch (apiStatus?.toLowerCase()) {
      case 'active': return 'active';
      case 'invited': return 'invited';
      case 'inactive': return 'inactive';
      case 'suspended': return 'suspended';
      case 'closed': return 'closed';
      case 'pending': return 'pending';
      default: return 'inactive';
    }
  }

  // === CONSIGNOR NOTIFICATION SETTINGS ===

  /**
   * Load consignor notification settings
   */
  async loadNotificationSettings(): Promise<void> {
    try {
      const settings = await firstValueFrom(
        this.http.get<ConsignorNotificationSettings>(`${environment.apiUrl}/api/owner/settings/consignor/consignor-onboarding`)
      );
      this.notificationSettings$.next(settings);
    } catch (error) {
      console.error('Failed to load consignor notification settings:', error);
      // Set default settings on error
      this.notificationSettings$.next({
        emailOnNewConsignor: true,
        emailOnItemSold: false
      });
    }
  }

  /**
   * Update consignor notification settings
   */
  async updateNotificationSettings(settings: Partial<ConsignorNotificationSettings>): Promise<void> {
    const current = this.notificationSettings$.value || {
      emailOnNewConsignor: true,
      emailOnItemSold: false
    };

    const updated = { ...current, ...settings };

    // Optimistic update
    this.notificationSettings$.next(updated);

    try {
      const response = await firstValueFrom(
        this.http.patch<ConsignorNotificationSettings>(`${environment.apiUrl}/api/owner/settings/consignor/consignor-onboarding`, updated)
      );
      this.notificationSettings$.next(response);
    } catch (error) {
      // Revert on error
      this.notificationSettings$.next(current);
      throw error;
    }
  }

  /**
   * Get current consignor notification settings
   */
  getCurrentNotificationSettings(): ConsignorNotificationSettings | null {
    return this.notificationSettings$.value;
  }

  /**
   * Get consignor onboarding settings
   */
  async getConsignorOnboardingSettings(): Promise<ConsignorOnboardingSettings> {
    return await firstValueFrom(
      this.http.get<ConsignorOnboardingSettings>(`${environment.apiUrl}/api/owner/settings/consignor/consignor-onboarding`)
    );
  }
}