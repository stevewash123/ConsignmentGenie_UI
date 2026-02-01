// PayoutSettings interface based on actual UI component usage patterns
// This represents the real UX requirements, not over-engineered abstractions

export interface PayoutSettings {
  // Payment Method Toggles
  payoutMethodCheck: boolean;
  payoutMethodCash: boolean;
  payoutMethodStoreCredit: boolean;
  payoutMethodPayPal: boolean;
  payoutMethodVenmo: boolean;
  payoutMethodACH: boolean;

  // Bank/Plaid Integration
  bankAccountConnected: boolean;
  plaidAccountId?: string;
  plaidAccessToken?: string;
  bankName?: string;
  bankAccountLast4?: string;

  // Payout Rules & Thresholds
  holdPeriodDays: number;
  minimumPayoutThreshold: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;

  // Additional properties that may be used by other components
  [key: string]: any;
}

// Supporting types that components expect
export interface PayoutMethodOption {
  method: string;
  enabled: boolean;
  displayName: string;
  description?: string;
}

// Default settings for initialization
export const DEFAULT_PAYOUT_SETTINGS: Partial<PayoutSettings> = {
  payoutMethodCheck: true,
  payoutMethodCash: false,
  payoutMethodStoreCredit: false,
  payoutMethodPayPal: false,
  payoutMethodVenmo: false,
  payoutMethodACH: false,
  bankAccountConnected: false,
  holdPeriodDays: 7,
  minimumPayoutThreshold: 25.00
};

// Simple validation function
export function validatePayoutSettings(settings: PayoutSettings): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (settings.holdPeriodDays < 0) {
    errors.push('Hold period must be positive');
  }

  if (settings.minimumPayoutThreshold < 0) {
    errors.push('Minimum payout amount must be positive');
  }

  // At least one payment method should be enabled
  const methodsEnabled = settings.payoutMethodCheck || settings.payoutMethodCash ||
                        settings.payoutMethodStoreCredit || settings.payoutMethodPayPal ||
                        settings.payoutMethodVenmo || settings.payoutMethodACH;

  if (!methodsEnabled) {
    errors.push('At least one payment method must be enabled');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Additional interfaces expected by components
export interface ScheduleThresholdSettings {
  holdPeriodDays: number;
  minimumPayoutThreshold: number;
  automaticPayout: boolean;
  payoutSchedule: 'weekly' | 'monthly' | 'manual';
}

export interface UpdatePayoutSettingsRequest {
  payoutMethodCheck?: boolean;
  payoutMethodCash?: boolean;
  payoutMethodStoreCredit?: boolean;
  payoutMethodPayPal?: boolean;
  payoutMethodVenmo?: boolean;
  payoutMethodACH?: boolean;
  holdPeriodDays?: number;
  minimumPayoutThreshold?: number;
  automaticPayout?: boolean;
  payoutSchedule?: 'weekly' | 'monthly' | 'manual';
}