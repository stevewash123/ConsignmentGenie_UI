import { ConsignorOnboardingSettings } from './consignor.models';

/**
 * Unified settings summary for efficient frontend caching
 * Matches the backend SettingsSummaryDto structure
 */
export interface SettingsSummary {
  consignor?: ConsignorSettings;
  business?: BusinessSettings;
  notifications?: NotificationSettings;
  payment?: PaymentSettings;
  profile?: ProfileSettings;
  sales?: SalesSettings;
  bookkeeping?: BookkeepingSettings;
  account?: AccountSettings;
}

/**
 * Consignor-related settings composite
 */
export interface ConsignorSettings {
  onboarding?: ConsignorOnboardingSettings;
  defaults?: ConsignorDefaults;
}

/**
 * Consignor default terms and conditions
 */
export interface ConsignorDefaults {
  shopCommissionPercent: number;
  consignmentPeriodDays: number;
  retrievalPeriodDays: number;
  unsoldItemPolicy: string;
  lastUpdated: string;
}

/**
 * Placeholder interfaces for other settings areas
 * These will be populated as the respective backend DTOs are implemented
 */

export interface BusinessSettings {
  // Will be populated from OrganizationBusinessSettingsDto
}

export interface NotificationSettings {
  // Will be populated from OrganizationNotificationSettingsDto
}

export interface PaymentSettings {
  // Will be populated from OrganizationPayoutSettingsDto
}

export interface ProfileSettings {
  // Will be populated from OrganizationProfileSettingsDto
}

export interface SalesSettings {
  // Will be populated from OrganizationSalesSettingsDto
}

export interface BookkeepingSettings {
  // Will be populated from OrganizationBookkeepingSettingsDto
}

export interface AccountSettings {
  // Will be populated from OrganizationAccountSettingsDto
}