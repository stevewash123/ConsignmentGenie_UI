export enum ItemSubmissionMode {
  OwnerOnly = 'owner_only',           // Owner adds all inventory
  ApprovalRequired = 'approval_required',   // Consignors submit for approval (DEFAULT)
  DirectAdd = 'direct_add'           // Consignors add directly
}

export interface ConsignorPermissions {
  itemSubmissionMode: ItemSubmissionMode;
}

export interface BusinessSettings {
  Commission: {
    DefaultSplit: string;
    AllowCustomSplitsPerConsignor: boolean;
    AllowCustomSplitsPerItem: boolean;
  };
  Tax: {
    SalesTaxRate: number;
    TaxIncludedInPrices: boolean;
    ChargeTaxOnShipping: boolean;
    TaxIdEin?: string;
  };
  Payouts: {
    Schedule: string;
    MinimumAmount: number;
    HoldPeriodDays: number;
    RefundPolicy: 'NoRefunds' | 'WithinDays' | 'UntilPayout';
    RefundWindowDays?: number;
    DefaultPayoutMethod: 'Check' | 'Cash' | 'DirectDeposit' | 'PayPal' | 'Venmo' | 'StoreCredit';
  };
  Items: {
    DefaultConsignmentPeriodDays: number;
    EnableAutoMarkdowns: boolean;
    MarkdownSchedule: {
      After30Days: number;
      After60Days: number;
      After90DaysAction: 'donate' | 'return';
    };
  };
  ConsignorPermissions: {
    ItemSubmissionMode: ItemSubmissionMode;
  };
}