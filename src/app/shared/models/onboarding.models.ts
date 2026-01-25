export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionText: string;
  routerLink: string;
  icon?: string;
}

export interface OnboardingStatus {
  dismissed: boolean;
  welcomeGuideCompleted: boolean;
  showModal: boolean;
  steps: {
    // NEW: Configuration must happen first
    shopConfigured: boolean;          // Commission rates, payout schedules, business rules
    agreementUploaded: boolean;       // Consignment agreement document
    storefrontConfigured: boolean;    // Shopify/Square or built-in shop
    // MOVED: Consignors now come after configuration
    hasConsignors: boolean;           // Renamed from hasconsignors for consistency
    hasInventory: boolean;
    quickBooksConnected: boolean;
    // Legacy field support (for backwards compatibility during migration)
    hasconsignors?: boolean;          // @deprecated - use hasConsignors
  };
}

export interface OnboardingResponse {
  success: boolean;
  data: OnboardingStatus;
  message?: string;
}

export interface DismissOnboardingRequest {
  dismissed: boolean;
}

export interface DismissWelcomeGuideRequest {
  welcomeGuideCompleted: boolean;
}

export interface DismissWelcomeGuideResponse {
  success: boolean;
  welcomeGuideCompleted: boolean;
  message?: string;
}

export interface DismissOnboardingResponse {
  success: boolean;
  message?: string;
}

export interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
}