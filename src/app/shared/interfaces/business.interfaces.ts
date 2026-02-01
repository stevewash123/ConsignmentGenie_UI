export enum ItemSubmissionMode {
  OwnerOnly = 'owner_only',           // Owner adds all inventory
  ApprovalRequired = 'approval_required',   // Consignors submit for approval (DEFAULT)
  DirectAdd = 'direct_add'           // Consignors add directly
}


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
    taxIdEin?: string;
  };
  payouts: {
    schedule: string;
    minimumAmount: number;
    holdPeriodDays: number;
    refundPolicy: 'NoRefunds' | 'WithinDays' | 'UntilPayout';
    refundWindowDays?: number;
    defaultPayoutMethod: 'Check' | 'Cash' | 'DirectDeposit' | 'PayPal' | 'Venmo' | 'StoreCredit';
  };
  items: {
    defaultConsignmentPeriodDays: number;
    enableAutoMarkdowns: boolean;
    markdownSchedule: {
      after30Days: number;
      after60Days: number;
      after90DaysAction: 'donate' | 'return';
    };
  };
  consignorPermissions: {
    itemSubmissionMode: ItemSubmissionMode;
  };
}