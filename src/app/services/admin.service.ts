import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface AdminMetrics {
  activeOrganizations: number;
  newSignups: number;
  monthlyRevenue: number;
}

export interface OwnerInvitation {
  id: string;
  name: string;
  email: string;
  sentAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface InviteOwnerRequest {
  name: string;
  email: string;
}

export interface NewSignup {
  id: string;
  ownerName: string;
  shopName: string;
  email: string;
  registeredAt: string;
  subdomain?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<AdminMetrics> {
    return this.http.get<ApiResponse<AdminMetrics>>(`${this.apiUrl}/metrics`)
      .pipe(map(response => response.data));
  }

  // Owner Invitation Management
  getOwnerInvitations(): Observable<OwnerInvitation[]> {
    return this.http.get<OwnerInvitation[]>(`${this.apiUrl}/invitations/owner`);
  }

  inviteOwner(request: InviteOwnerRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/invitations/owner`, request);
  }

  resendOwnerInvitation(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/invitations/owner/${id}/resend`, {});
  }

  cancelOwnerInvitation(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.apiUrl}/invitations/owner/${id}/cancel`, {});
  }

  // Recent Signups
  getRecentSignups(): Observable<NewSignup[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/recent-signups`)
      .pipe(map(response => response.data.map((signup: any) => ({
        id: signup.id,
        ownerName: signup.name,
        shopName: signup.name, // API returns organization name, map to shopName
        email: signup.email,
        registeredAt: signup.createdAt,
        subdomain: signup.subdomain
      }))));
  }
}