import { ReceiptSettings } from '../owner/settings/business/receipt-settings/receipt-settings.component';
import { BusinessPolicies } from '../owner/settings/business/policies/policies.component';

export interface BusinessSettings {
  commission: {
    defaultSplit: string;
    allowCustomSplitsPerConsignor: boolean;
    allowCustomSplitsPerItem: boolean;
  };
  tax: {
    salesTaxRate: number;
    taxIncludedInPrices: boolean;
    chargeTaxOnShipping: boolean;
    taxIdEin: string | null;
  };
  payouts: {
    schedule: string;
    minimumAmount: number;
    holdPeriodDays: number;
    method?: string;
    autoProcessing?: boolean;
    refundPolicy?: string;
    refundWindowDays?: number;
  };
  items: {
    defaultConsignmentPeriodDays: number;
    enableAutoMarkdowns: boolean;
    markdownSchedule: {
      after30Days: number;
      after60Days: number;
      after90DaysAction: string;
    };
    itemSubmissionMode?: string;
    autoApproveItems?: boolean;
  };
  receipts?: ReceiptSettings;
  policies?: BusinessPolicies;
}

export interface PaymentSettings {
  enableCreditCards: boolean;
  enableBuyNow: boolean;
  enableLayaway: boolean;
  layawayDepositPercentage: number;
  layawayTermsInDays: number;
}

export interface AccountingSettings {
  quickBooks: {
    isConnected: boolean;
    companyId?: string;
    companyName?: string;
    autoSync: boolean;
    syncFrequency: 'daily' | 'weekly' | 'manual';
  };
  reports: {
    emailReports: boolean;
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  exports: {
    format: 'csv' | 'xlsx' | 'pdf';
    includeConsignorDetails: boolean;
    includeTaxBreakdown: boolean;
  };
}