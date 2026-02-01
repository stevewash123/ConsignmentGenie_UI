export interface NotificationThresholds {
  highValueSale: number;
  lowInventory: number;
}

export interface NotificationSettings {
  primaryEmail: string;
  phoneNumber?: string;
  emailPreferences: Record<string, boolean>;
  smsPreferences: Record<string, boolean>;
  systemPreferences: Record<string, boolean>;
  thresholds: NotificationThresholds;
  payoutReportFrequency: 'daily' | 'weekly';
  weeklyPayoutDay: string;
}

export interface NotificationUpdate {
  type?: 'info' | 'success' | 'warning' | 'error';
  message?: string;
  timestamp?: Date;
  data?: any;
  jobId?: string;
  status?: 'running' | 'completed' | 'failed' | 'queued';
  jobType?: 'payout' | 'bank_sync' | 'quickbooks_sync' | string;
  progress?: number;
  organizationId?: string;
  consignorCount?: number;
  processedConsignors?: number;
  // Allow any additional properties for flexibility
  [key: string]: any;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: any[];
  timestamp?: Date;
  jobId?: string;
}

export interface PayoutJobUpdate {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  completedAt?: Date;
}

export interface BankSyncJobUpdate {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  itemsSynced?: number;
}

export interface QuickBooksSyncJobUpdate {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  recordsSynced?: number;
}