import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ConsignorPermissions } from '../models/consignor.models';
import { NotificationSettings } from '../models/notifications.models';
import { BusinessSettings } from '../models/business.models';
import { StorefrontSettings } from '../models/storefront.models';

// Export types for use in components
export type SalesChannel = 'square' | 'shopify' | 'cg_storefront' | 'in_store_only';

export interface TaxSettings {
  taxEnabled: boolean;
  defaultTaxRate: number;
  taxLabel: string;
  taxCalculationMethod: 'inclusive' | 'exclusive';
  exemptCategories: string[];
  rates?: {
    state?: number;
    local?: number;
    special?: number;
    effectiveDate?: string;
    defaultRate?: number;
    isInclusive?: boolean;
  };
  business?: {
    taxId?: string;
    stateTaxId?: string;
    taxIdVerified?: boolean;
  };
  display?: {
    showTaxIdOnReceipt?: boolean;
    showBreakdownOnReceipt?: boolean;
    lineItemTax?: boolean;
  };
  calculation?: {
    applyToCommission?: boolean;
    exemptCategories?: string[];
  };
  reporting?: {
    period?: string;
    autoGenerate?: boolean;
    exportFormat?: string;
  };
  collection?: any;
  lastUpdated?: Date;
}

export interface PayoutSettings {
  defaultCommissionRate: number;
  minimumPayoutAmount: number;
  payoutSchedule: 'weekly' | 'monthly' | 'manual';
  paymentMethod: 'check' | 'bank_transfer' | 'paypal';
  processingDelay: number;
  automaticPayout: boolean;
}


export interface ConsignorDefaults {
  shopCommissionPercent: number;
  consignmentPeriodDays: number;
  retrievalPeriodDays: number;
  unsoldItemPolicy: 'donate' | 'dispose' | 'return-to-consignor' | 'become-shop-property';
  lastUpdated?: Date;
}

export interface OwnerContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface SubscriptionInfo {
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  nextBillingDate: string;
  amount: number;
  features: string[];
}

export interface IntegrationPricingInfo {
  success: boolean;
  errorMessage?: string;
  integration: string;
  lookupKey: string;
  priceId: string;
  monthlyAmount: number; // Amount in cents
  currency: string;
  productName: string;
  description?: string;
  isFounderPricing: boolean;
}

export interface PricingImpactData {
  action: 'enable' | 'disable';
  productName: string;
  currentMonthlyTotal: number;
  changeAmount: number;           // negative for disable, positive for enable
  newMonthlyTotal: number;
  isFounder: boolean;
  isProductFounderPriced: boolean;
  isTrial: boolean;
  trialEndsAt: Date | null;
  billedNowAmount: number;        // $0 if trial, otherwise same as current
}

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  // === Storefront Settings ===
  getStorefrontSettings(): Observable<StorefrontSettings> {
    return this.http.get<StorefrontSettings>(`${this.apiUrl}/organization/storefront-settings`);
  }

  updateStorefrontSettings(settings: StorefrontSettings): Observable<StorefrontSettings> {
    return this.http.put<StorefrontSettings>(`${this.apiUrl}/organization/storefront-settings`, settings);
  }

  // === Tax Settings ===
  getTaxSettings(): Observable<TaxSettings> {
    return this.http.get<TaxSettings>(`${this.apiUrl}/organization/tax-settings`);
  }

  updateTaxSettings(settings: TaxSettings): Observable<any> {
    return this.http.put(`${this.apiUrl}/organization/tax-settings`, settings);
  }

  // === Notification Settings ===
  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/user/notification-settings`);
  }

  updateNotificationSettings(settings: NotificationSettings): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/notification-settings`, settings);
  }


  // === Consignor Management ===
  getConsignorInvitations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consignors/invitations`);
  }

  createConsignorInvitation(invitation: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/consignors/invitations`, invitation);
  }

  resendConsignorInvitation(invitationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/consignors/invitations/${invitationId}/resend`, {});
  }

  deleteConsignorInvitation(invitationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/consignors/invitations/${invitationId}`);
  }

  // === Consignor Permissions ===
  getDefaultConsignorPermissions(): Observable<ConsignorPermissions> {
    return this.http.get<ConsignorPermissions>(`${this.apiUrl}/organization/default-consignor-permissions`);
  }

  updateDefaultConsignorPermissions(permissions: ConsignorPermissions): Observable<any> {
    return this.http.put(`${this.apiUrl}/organization/default-consignor-permissions`, permissions);
  }

  // === Consignor Defaults ===
  getConsignorDefaults(): Observable<ConsignorDefaults> {
    return this.http.get<ConsignorDefaults>(`${this.apiUrl}/settings/consignor/default-terms`);
  }

  updateConsignorDefaults(defaults: ConsignorDefaults): Observable<{success: boolean, data: ConsignorDefaults, message: string}> {
    return this.http.put<{success: boolean, data: ConsignorDefaults, message: string}>(`${this.apiUrl}/settings/consignor/default-terms`, defaults);
  }

  // === Business Settings ===
  getBusinessSettings(): Observable<BusinessSettings> {
    return this.http.get<BusinessSettings>(`${this.apiUrl}/organization/business-settings`);
  }

  updateBusinessSettings(settings: BusinessSettings): Observable<any> {
    return this.http.put(`${this.apiUrl}/organization/business-settings`, settings);
  }

  // === Account/Profile Settings ===
  getOwnerContactInfo(): Observable<OwnerContactInfo> {
    return this.http.get<OwnerContactInfo>(`${this.apiUrl}/owner/contact-info`);
  }

  updateOwnerContactInfo(contactInfo: OwnerContactInfo): Observable<OwnerContactInfo> {
    return this.http.put<OwnerContactInfo>(`${this.apiUrl}/owner/contact-info`, contactInfo);
  }

  // === Subscription Management ===
  getSubscriptionInfo(): Observable<SubscriptionInfo> {
    return this.http.get<SubscriptionInfo>(`${this.apiUrl}/subscription`);
  }

  openBillingPortal(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/subscription/portal`, {});
  }

  getIntegrationPricing(integration: string): Observable<IntegrationPricingInfo> {
    return this.http.get<{success: boolean, data: IntegrationPricingInfo}>(`${this.apiUrl}/subscription/integration-pricing/${integration}`)
      .pipe(map(response => response.data));
  }

  async calculatePricingImpact(action: 'enable' | 'disable', integration: string): Promise<PricingImpactData> {
    const [subscription, integrationPricing] = await Promise.all([
      firstValueFrom(this.getSubscriptionInfo()),
      firstValueFrom(this.getIntegrationPricing(integration))
    ]);

    const currentMonthlyTotal = (subscription.amount || 0) / 100; // Convert from cents with fallback
    const integrationMonthlyAmount = (integrationPricing.monthlyAmount || 0) / 100; // Convert from cents with fallback
    const changeAmount = action === 'enable' ? integrationMonthlyAmount : -integrationMonthlyAmount;
    const newMonthlyTotal = currentMonthlyTotal + changeAmount;
    const isTrial = subscription.status === 'trialing';

    return {
      action,
      productName: integrationPricing.productName,
      currentMonthlyTotal,
      changeAmount,
      newMonthlyTotal,
      isFounder: integrationPricing.isFounderPricing, // This represents if the user has founder status
      isProductFounderPriced: integrationPricing.isFounderPricing,
      isTrial,
      trialEndsAt: isTrial ? new Date(subscription.currentPeriodEnd) : null,
      billedNowAmount: isTrial ? 0 : currentMonthlyTotal
    };
  }

  // === Integration Settings ===
  getSquareSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/integrations/square/settings`);
  }

  updateSquareSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/integrations/square/settings`, settings);
  }

  // === Payment Settings (for future use) ===
  getPaymentSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/organizations/payment-settings`);
  }

  updatePaymentSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/organizations/payment-settings`, settings);
  }

  // === Report Settings (for future use) ===
  getReportSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/organizations/report-settings`);
  }

  updateReportSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/organizations/report-settings`, settings);
  }

  // === Sales Settings (for future use) ===
  getSalesSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sales/settings`);
  }

  updateSalesSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sales/settings`, settings);
  }

  // === Store Code Management ===
  regenerateStoreCode(): Observable<{newStoreCode: string, generatedAt: string}> {
    return this.http.post<{newStoreCode: string, generatedAt: string}>(`${this.apiUrl}/organization/store-code/regenerate`, {});
  }

  // === Dropoff Request Management ===
  getDropoffRequests(status?: string): Observable<any[]> {
    let params = status ? `?status=${status}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/owner/dropoff-requests${params}`);
  }

  getDropoffRequestDetail(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/owner/dropoff-requests/${id}`);
  }

  markDropoffAsReceived(id: string, data: { status: string; ownerNotes?: string }): Observable<any> {
    // Import the manifest to pending imports, which also marks it as received
    return this.http.post(`${this.apiUrl}/pending-imports/from-manifest/${id}`, {
      autoAssignConsignor: true
    });
  }

  importDropoffToInventory(id: string, data: { ownerNotes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/owner/dropoff-requests/${id}/import`, data);
  }

  rejectDropoffRequest(id: string, data: { rejectionReason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/owner/dropoff-requests/${id}/reject`, data);
  }

  reopenDropoffRequest(id: string, data: { ownerNotes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/owner/dropoff-requests/${id}/reopen`, data);
  }
}