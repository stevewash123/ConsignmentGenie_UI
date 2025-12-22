export interface PayoutSchedule {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'manual';
  dayOfWeek?: number; // 0-6 for weekly (0=Sunday, 1=Monday, etc.)
  dayOfMonth?: number; // 1-31 for monthly
  biweeklyDays?: number[]; // [1, 15] for bi-weekly on 1st and 15th
  cutoffTime: string; // "17:00" format
  processingDays: number; // days after cutoff to process
}

export interface PayoutThresholds {
  minimumAmount: number; // e.g., $25.00
  holdPeriodDays: number; // e.g., 14 days
  carryoverEnabled: boolean; // carry over small amounts
  earlyPayoutForTrusted: boolean; // early payout option for trusted consignors
}

export interface PayoutMethodConfiguration {
  defaultMethod: 'check' | 'ach' | 'cash' | 'store_credit';
  availableMethods: PayoutMethodOption[];
  checkMailingEnabled: boolean;
  achIntegrationEnabled: boolean;
  cashPickupEnabled: boolean;
  storeCreditEnabled: boolean;
}

export interface PayoutMethodOption {
  method: 'check' | 'ach' | 'cash' | 'store_credit';
  enabled: boolean;
  displayName: string;
  description?: string;
}

export interface PayoutFeeStructure {
  processingFeePaidBy: 'shop' | 'consignor';
  feesByMethod: {
    check: number;
    ach: number;
    cash: number;
    store_credit: number;
  };
  feeDisclosureEnabled: boolean;
}

export interface PayoutAutomation {
  autoGeneratePayouts: boolean;
  autoApproveThreshold: number; // auto-approve under $X
  requireManualReview: boolean; // for large payouts
  manualReviewThreshold: number; // require manual review over $X
}

export interface PayoutNotifications {
  notifyConsignorOnCalculation: boolean;
  notifyConsignorOnPayment: boolean;
  notifyOwnerOnFailure: boolean;
  emailStatementsEnabled: boolean;
  printStatementsEnabled: boolean;
  statementRetentionDays: number;
}

export interface PayoutReportConfiguration {
  autoGenerateStatements: boolean;
  includeItemDetails: boolean; // vs summary only
  includeBranding: boolean;
  pdfFormat: boolean;
  emailStatements: boolean;
}

export interface PayoutSettings {
  schedule: PayoutSchedule;
  thresholds: PayoutThresholds;
  paymentMethods: PayoutMethodConfiguration;
  fees: PayoutFeeStructure;
  automation: PayoutAutomation;
  notifications: PayoutNotifications;
  reports: PayoutReportConfiguration;
  lastUpdated: Date;
  organizationId: string;
}

// Default settings for new organizations
export const DEFAULT_PAYOUT_SETTINGS: Partial<PayoutSettings> = {
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 5, // Friday
    cutoffTime: '17:00',
    processingDays: 2
  },
  thresholds: {
    minimumAmount: 25.00,
    holdPeriodDays: 14,
    carryoverEnabled: true,
    earlyPayoutForTrusted: false
  },
  paymentMethods: {
    defaultMethod: 'check',
    availableMethods: [
      { method: 'check', enabled: true, displayName: 'Check (by mail)' },
      { method: 'cash', enabled: true, displayName: 'Cash (pickup)' },
      { method: 'store_credit', enabled: true, displayName: 'Store Credit' },
      { method: 'ach', enabled: false, displayName: 'Bank Transfer (ACH)', description: 'Requires banking integration' }
    ],
    checkMailingEnabled: true,
    achIntegrationEnabled: false,
    cashPickupEnabled: true,
    storeCreditEnabled: true
  },
  fees: {
    processingFeePaidBy: 'shop',
    feesByMethod: {
      check: 0.00,
      ach: 0.50,
      cash: 0.00,
      store_credit: 0.00
    },
    feeDisclosureEnabled: true
  },
  automation: {
    autoGeneratePayouts: false,
    autoApproveThreshold: 100.00,
    requireManualReview: true,
    manualReviewThreshold: 500.00
  },
  notifications: {
    notifyConsignorOnCalculation: true,
    notifyConsignorOnPayment: true,
    notifyOwnerOnFailure: true,
    emailStatementsEnabled: true,
    printStatementsEnabled: false,
    statementRetentionDays: 730 // 2 years
  },
  reports: {
    autoGenerateStatements: true,
    includeItemDetails: true,
    includeBranding: true,
    pdfFormat: true,
    emailStatements: true
  }
};

// Validation helpers
export interface PayoutSettingsValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePayoutSettings(settings: PayoutSettings): PayoutSettingsValidationResult {
  const errors: string[] = [];

  // Validate minimum amount
  if (settings.thresholds.minimumAmount < 0) {
    errors.push('Minimum payout amount must be positive');
  }
  if (settings.thresholds.minimumAmount > 10000) {
    errors.push('Minimum payout amount cannot exceed $10,000');
  }

  // Validate hold period
  if (settings.thresholds.holdPeriodDays < 0) {
    errors.push('Hold period cannot be negative');
  }
  if (settings.thresholds.holdPeriodDays > 90) {
    errors.push('Hold period cannot exceed 90 days');
  }

  // Validate processing days
  if (settings.schedule.processingDays < 0) {
    errors.push('Processing days cannot be negative');
  }
  if (settings.schedule.processingDays > 30) {
    errors.push('Processing days cannot exceed 30 days');
  }

  // Validate weekly schedule
  if (settings.schedule.frequency === 'weekly') {
    if (!settings.schedule.dayOfWeek || settings.schedule.dayOfWeek < 0 || settings.schedule.dayOfWeek > 6) {
      errors.push('Weekly schedule requires valid day of week (0-6)');
    }
  }

  // Validate monthly schedule
  if (settings.schedule.frequency === 'monthly') {
    if (!settings.schedule.dayOfMonth || settings.schedule.dayOfMonth < 1 || settings.schedule.dayOfMonth > 31) {
      errors.push('Monthly schedule requires valid day of month (1-31)');
    }
  }

  // Validate automation thresholds
  if (settings.automation.autoApproveThreshold < 0) {
    errors.push('Auto-approve threshold must be positive');
  }
  if (settings.automation.manualReviewThreshold < settings.automation.autoApproveThreshold) {
    errors.push('Manual review threshold must be greater than auto-approve threshold');
  }

  // At least one payment method must be enabled
  const enabledMethods = settings.paymentMethods.availableMethods.filter(m => m.enabled);
  if (enabledMethods.length === 0) {
    errors.push('At least one payment method must be enabled');
  }

  // Default method must be enabled
  const defaultMethodEnabled = settings.paymentMethods.availableMethods.find(
    m => m.method === settings.paymentMethods.defaultMethod
  )?.enabled;
  if (!defaultMethodEnabled) {
    errors.push('Default payment method must be enabled in available methods');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}