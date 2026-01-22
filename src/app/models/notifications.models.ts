export interface JobProgressUpdate {
  jobId: string;
  jobType: 'payout-generation' | 'bank-sync' | 'quickbooks-sync' | 'plaid-connection';
  progress: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message?: string;
  startTime?: string;
  endTime?: string;
  organizationId: string;
}

export interface PayoutJobUpdate extends JobProgressUpdate {
  jobType: 'payout-generation';
  payoutId?: string;
  consignorCount?: number;
  processedConsignors?: number;
}

export interface BankSyncJobUpdate extends JobProgressUpdate {
  jobType: 'bank-sync';
  accountId?: string;
  transactionCount?: number;
  processedTransactions?: number;
}

export interface QuickBooksSyncJobUpdate extends JobProgressUpdate {
  jobType: 'quickbooks-sync';
  companyId?: string;
  syncType?: 'sales' | 'consignors' | 'payouts';
  recordCount?: number;
  processedRecords?: number;
}

export interface PlaidConnectionJobUpdate extends JobProgressUpdate {
  jobType: 'plaid-connection';
  linkToken?: string;
  institutionName?: string;
  accountsConnected?: number;
}

export type NotificationUpdate = PayoutJobUpdate | BankSyncJobUpdate | QuickBooksSyncJobUpdate | PlaidConnectionJobUpdate;

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // milliseconds, undefined = permanent
  jobId?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'success' | 'danger';
}