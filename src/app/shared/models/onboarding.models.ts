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
    hasconsignors: boolean;
    storefrontConfigured: boolean;
    hasInventory: boolean;
    quickBooksConnected: boolean;
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