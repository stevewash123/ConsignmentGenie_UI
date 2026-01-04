import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Export types for use in components
export type SalesChannel = 'square' | 'shopify' | 'cg_storefront' | 'in_store_only';

export interface StorefrontSettings {
  selectedChannel: SalesChannel;
  square?: {
    connected: boolean;
    businessName?: string;
    locationName?: string;
    connectedAt?: Date;
    syncInventory: boolean;
    importSales: boolean;
    syncCustomers: boolean;
    syncFrequency: string;
    categoryMappings: Array<{ cgCategory: string; squareCategory: string }>;
  };
  shopify?: {
    connected: boolean;
    storeName?: string;
    connectedAt?: Date;
    pushInventory: boolean;
    importOrders: boolean;
    syncImages: boolean;
    autoMarkSold: boolean;
    collectionMappings: Array<{ cgCategory: string; shopifyCollection: string }>;
  };
  cgStorefront?: {
    storeSlug: string;
    useCustomDomain?: string;
    customDomain?: string;
    dnsVerified: boolean;
    stripeConnected: boolean;
    stripeAccountName?: string;
    bannerImageUrl?: string;
    primaryColor: string;
    accentColor: string;
    displayStoreHours: boolean;
    storeHours: Array<{ day: string; open: string; close: string; enabled: boolean }>;
    metaTitle: string;
    metaDescription: string;
  };
  inStoreOnly?: {
    defaultPaymentMethod: string;
    requireReceiptNumber: boolean;
    autoGenerateReceipts: boolean;
  };
}

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

export interface NotificationSettings {
  primaryEmail?: string;
  phoneNumber?: string;
  thresholds?: {
    highValueSale?: number;
    lowInventory?: number;
  };
  emailPreferences?: {
    [key: string]: boolean;
  };
  smsPreferences?: {
    [key: string]: boolean;
  };
  emailNotifications: {
    newSales: boolean;
    newConsignors: boolean;
    lowInventory: boolean;
    payoutReady: boolean;
  };
  smsNotifications: {
    newSales: boolean;
    emergencyAlerts: boolean;
  };
  pushNotifications: {
    newSales: boolean;
    consignorActivity: boolean;
  };
}

export interface PayoutSettings {
  defaultCommissionRate: number;
  minimumPayoutAmount: number;
  payoutSchedule: 'weekly' | 'monthly' | 'manual';
  paymentMethod: 'check' | 'bank_transfer' | 'paypal';
  processingDelay: number;
  automaticPayout: boolean;
}

export interface ConsignorPermissions {
  canViewOwnItems: boolean;
  canEditItemDetails: boolean;
  canRequestPayout: boolean;
  canViewSalesHistory: boolean;
  canUpdateContactInfo: boolean;
  maxItemsPerSubmission: number;
  requireApprovalForChanges: boolean;
}

export interface BusinessSettings {
  commission: {
    defaultSplit: string;
    categoryBasedSplits: boolean;
    minimumCommission: number;
    allowCustomSplitsPerConsignor?: boolean;
    allowCustomSplitsPerItem?: boolean;
  };
  tax: {
    enabled: boolean;
    rate: number;
    label: string;
    salesTaxRate?: number;
    taxIncludedInPrice?: boolean;
    taxIncludedInPrices?: boolean;
    chargeTaxOnShipping?: boolean;
    taxIdEin?: string;
  };
  policies: {
    consignmentPeriod: number;
    returnPolicy: string;
    itemSubmissionMode: string;
    autoApproveItems: boolean;
  };
  schedule: {
    businessHours: Array<{
      day: string;
      open: string;
      close: string;
      closed: boolean;
    }>;
    timezone: string;
  };
  consignorPermissions?: {
    itemSubmissionMode: string;
  };
  payouts?: {
    holdPeriodDays?: number;
    minimumAmount?: number;
    method?: string;
    schedule?: string;
    autoProcessing?: boolean;
    refundPolicy?: string;
    refundWindowDays?: number;
    defaultPayoutMethod?: string;
  };
  items?: {
    defaultConsignmentPeriodDays?: number;
    enableAutoMarkdowns?: boolean;
    markdownSchedule?: {
      after30Days?: number;
      after60Days?: number;
      after90Days?: number;
      after90DaysAction?: string;
    };
  };
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
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd: string;
  nextBillingDate: string;
  amount: number;
  features: string[];
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

  // === Payout Settings ===
  getPayoutSettings(): Observable<PayoutSettings> {
    return this.http.get<PayoutSettings>(`${this.apiUrl}/organizations/payout-settings`);
  }

  updatePayoutSettings(settings: PayoutSettings): Observable<any> {
    return this.http.put(`${this.apiUrl}/organizations/payout-settings`, settings);
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
}