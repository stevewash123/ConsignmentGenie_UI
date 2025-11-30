import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '../models/provider.model';
import { environment } from '../../environments/environment';

export interface ProviderInvitationRequest {
  name: string;
  email: string;
}

export interface ProviderInvitationResponse {
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

export interface ProviderRegistrationRequest {
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

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private readonly apiUrl = `${environment.apiUrl}/api/providers`;
  private readonly authUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  getProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(this.apiUrl);
  }

  getProvider(id: number): Observable<Provider> {
    return this.http.get<Provider>(`${this.apiUrl}/${id}`);
  }

  createProvider(request: CreateProviderRequest): Observable<Provider> {
    return this.http.post<Provider>(this.apiUrl, request);
  }

  updateProvider(id: number, request: UpdateProviderRequest): Observable<Provider> {
    return this.http.put<Provider>(`${this.apiUrl}/${id}`, request);
  }

  deleteProvider(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deactivateProvider(id: number): Observable<Provider> {
    return this.http.patch<Provider>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateProvider(id: number): Observable<Provider> {
    return this.http.patch<Provider>(`${this.apiUrl}/${id}/activate`, {});
  }

  inviteProvider(invitation: ProviderInvitationRequest): Observable<ProviderInvitationResponse> {
    return this.http.post<ProviderInvitationResponse>(`${this.apiUrl}/invitations`, invitation);
  }

  getPendingInvitations(): Observable<PendingInvitation[]> {
    return this.http.get<PendingInvitation[]>(`${this.apiUrl}/invitations`);
  }

  resendInvitation(invitationId: number): Observable<ProviderInvitationResponse> {
    return this.http.post<ProviderInvitationResponse>(`${this.apiUrl}/invitations/${invitationId}/resend`, {});
  }

  cancelInvitation(invitationId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/invitations/${invitationId}`);
  }

  validateInvitation(token: string): Observable<InvitationValidationResponse> {
    return this.http.get<InvitationValidationResponse>(`${environment.apiUrl}/invitations/validate/${token}`);
  }

  registerFromInvitation(request: ProviderRegistrationRequest): Observable<RegistrationResult> {
    return this.http.post<RegistrationResult>(`${environment.apiUrl}/invitations/register`, request);
  }
}