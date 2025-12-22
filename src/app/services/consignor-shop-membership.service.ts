import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConsignorShopMembership,
  CreateConsignorShopMembershipRequest,
  ShopOnboardingData,
  BankAccountValidation
} from '../models/consignor-shop-membership.model';
import { environment } from '../../environments/environment';

export interface MembershipCreationResponse {
  success: boolean;
  message: string;
  membership?: ConsignorShopMembership;
}

export interface ShopJoinRequest {
  storeCode: string;
}

export interface ShopJoinResponse {
  success: boolean;
  message: string;
  redirectTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsignorShopMembershipService {
  private readonly apiUrl = `${environment.apiUrl}/api/consignor-memberships`;
  private readonly shopUrl = `${environment.apiUrl}/api/shops`;

  constructor(private http: HttpClient) {}

  /**
   * Get shop onboarding data for a specific store code
   */
  getShopOnboardingData(storeCode: string): Observable<ShopOnboardingData> {
    return this.http.get<ShopOnboardingData>(`${this.shopUrl}/${storeCode}/onboarding-data`);
  }

  /**
   * Create a new consignor shop membership (complete onboarding)
   */
  createMembership(request: CreateConsignorShopMembershipRequest): Observable<MembershipCreationResponse> {
    return this.http.post<MembershipCreationResponse>(this.apiUrl, request);
  }

  /**
   * Join a shop (trigger onboarding flow)
   */
  joinShop(request: ShopJoinRequest): Observable<ShopJoinResponse> {
    return this.http.post<ShopJoinResponse>(`${this.apiUrl}/join-shop`, request);
  }

  /**
   * Get consignor's memberships across all shops
   */
  getMyMemberships(): Observable<ConsignorShopMembership[]> {
    return this.http.get<ConsignorShopMembership[]>(`${this.apiUrl}/my-memberships`);
  }

  /**
   * Get membership details for a specific shop
   */
  getMembershipForShop(organizationId: string): Observable<ConsignorShopMembership> {
    return this.http.get<ConsignorShopMembership>(`${this.apiUrl}/shop/${organizationId}`);
  }

  /**
   * Update payout method for an existing membership
   */
  updatePayoutMethod(membershipId: string, request: Partial<CreateConsignorShopMembershipRequest>): Observable<ConsignorShopMembership> {
    return this.http.patch<ConsignorShopMembership>(`${this.apiUrl}/${membershipId}/payout-method`, request);
  }

  /**
   * Validate bank account information
   */
  validateBankAccount(validation: BankAccountValidation): Observable<BankAccountValidation> {
    return this.http.post<BankAccountValidation>(`${this.apiUrl}/validate-bank-account`, validation);
  }

  /**
   * Check if consignor is already a member of a shop
   */
  checkMembership(storeCode: string): Observable<{ isMember: boolean; membership?: ConsignorShopMembership }> {
    return this.http.get<{ isMember: boolean; membership?: ConsignorShopMembership }>(`${this.apiUrl}/check/${storeCode}`);
  }

  /**
   * Leave a shop (deactivate membership)
   */
  leaveMembership(membershipId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${membershipId}`);
  }
}