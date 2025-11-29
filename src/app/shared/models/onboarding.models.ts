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
  steps: {
    hasProviders: boolean;
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

export interface DismissOnboardingResponse {
  success: boolean;
  message?: string;
}

export interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
}