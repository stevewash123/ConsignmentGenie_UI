export interface NotificationEvent {
  eventName: string;
  email: boolean;
  sms: boolean;
  system: boolean;
}

export interface NotificationCategory {
  categoryName: string;
  events: NotificationEvent[];
}

export interface NotificationContactInfo {
  primaryEmailAddress?: string;
  phoneNumber?: string;
}

export interface NotificationThresholds {
  highValueSaleThreshold?: number;
  lowInventoryAlertThreshold?: number;
}

export interface NotificationMatrixSettings {
  contactInfo: NotificationContactInfo;
  notificationPreferences: NotificationCategory[];
  thresholds: NotificationThresholds;
}

// Update request format
export interface UpdateNotificationMatrixRequest {
  contactInfo?: NotificationContactInfo;
  notificationPreferences?: NotificationCategory[];
  thresholds?: NotificationThresholds;
}