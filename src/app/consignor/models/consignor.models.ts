export interface ProviderDashboard {
  shopName: string;
  providerName: string;
  totalItems: number;
  availableItems: number;
  soldItems: number;
  inventoryValue: number;
  pendingBalance: number;
  totalEarningsAllTime: number;
  earningsThisMonth: number;
  recentSales: consignorsale[];
  lastPayout?: ProviderPayout;
}

export interface ProviderItem {
  itemId: string;
  sku: string;
  title: string;
  primaryImageUrl: string;
  price: number;
  myEarnings: number;
  category: string;
  status: string;
  receivedDate: Date;
  soldDate?: Date;
  salePrice?: number;
}

export interface ProviderItemDetail extends ProviderItem {
  description: string;
  imageUrls: string[];
  notes: string;
}

export interface consignorsale {
  transactionId: string;
  saleDate: Date;
  itemTitle: string;
  itemSku: string;
  salePrice: number;
  myEarnings: number;
  payoutStatus: string;
}

export interface ProviderPayout {
  payoutId: string;
  payoutNumber: string;
  payoutDate: Date;
  amount: number;
  paymentMethod: string;
  itemCount: number;
}

export interface ProviderPayoutDetail extends ProviderPayout {
  paymentReference: string;
  periodStart: Date;
  periodEnd: Date;
  items: consignorsale[];
}

export interface ProviderProfile {
  providerId: string;
  fullName: string;
  email: string;
  phone?: string;
  commissionRate: number;
  preferredPaymentMethod?: string;
  paymentDetails?: string;
  emailNotifications: boolean;
  memberSince: Date;
  organizationName: string;
}

export interface UpdateProviderProfile {
  fullName: string;
  phone?: string;
  preferredPaymentMethod?: string;
  paymentDetails?: string;
  emailNotifications: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProviderItemQuery {
  status?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface consignorsaleQuery {
  dateFrom?: Date;
  dateTo?: Date;
  payoutStatus?: string;
  page?: number;
  pageSize?: number;
}

// Notification Models
export interface NotificationDto {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
  timeAgo: string;
  actionUrl?: string;
  metadata?: NotificationMetadata;
}

export interface NotificationMetadata {
  itemTitle?: string;
  itemSku?: string;
  salePrice?: number;
  earningsAmount?: number;
  payoutAmount?: number;
  payoutMethod?: string;
  payoutNumber?: string;
  statementPeriod?: string;
  statementId?: string;
}

export interface NotificationQueryParams {
  unreadOnly?: boolean;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationPreferencesDto {
  emailEnabled: boolean;
  emailItemSold: boolean;
  emailPayoutProcessed: boolean;
  emailPayoutPending: boolean;
  emailItemExpired: boolean;
  emailStatementReady: boolean;
  emailAccountUpdate: boolean;
  digestMode: string; // 'instant', 'daily', 'weekly'
  digestTime: string; // HH:mm format
  digestDay: number; // 1-7 for weekly digest
  payoutPendingThreshold: number;
}

export interface UpdateNotificationPreferencesRequest {
  emailEnabled: boolean;
  emailItemSold: boolean;
  emailPayoutProcessed: boolean;
  emailPayoutPending?: boolean;
  emailItemExpired?: boolean;
  emailStatementReady?: boolean;
  emailAccountUpdate?: boolean;
  digestMode: string;
  digestTime: string;
  digestDay?: number;
  payoutPendingThreshold?: number;
}

// Statement Models
export interface StatementListDto {
  statementId: string;
  statementNumber: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  itemsSold: number;
  totalEarnings: number;
  closingBalance: number;
  status: string;
  hasPdf: boolean;
  generatedAt: Date;
}

export interface StatementDto {
  id: string;
  statementNumber: string;
  periodStart: string; // DateOnly from backend
  periodEnd: string; // DateOnly from backend
  periodLabel: string;
  providerName: string;
  shopName: string;
  openingBalance: number;
  totalSales: number;
  totalEarnings: number;
  totalPayouts: number;
  closingBalance: number;
  itemsSold: number;
  payoutCount: number;
  sales: StatementSaleLineDto[];
  payouts: StatementPayoutLineDto[];
  status: string;
  hasPdf: boolean;
  pdfUrl?: string;
  viewedAt?: Date;
  generatedAt: Date;
}

export interface StatementSaleLineDto {
  date: Date;
  itemSku: string;
  itemTitle: string;
  salePrice: number;
  commissionRate: number;
  earningsAmount: number;
}

export interface StatementPayoutLineDto {
  date: Date;
  payoutNumber: string;
  paymentMethod: string;
  amount: number;
}

// Balance Overview Models
export interface ConsignorBalance {
  pending: BalanceAmount;
  available: BalanceAmount;
  inTransit: InTransitBalance | null;
  lifetimeEarned: number;
  lifetimeReceived: number;
  nextPayoutDate: Date | null;
  payoutScheduleDescription: string;
  canRequestPayout: boolean;
  minimumPayoutAmount: number;
  pendingRequest?: PayoutRequest | null;
}

export interface BalanceAmount {
  amount: number;
  itemCount: number;
}

export interface InTransitBalance {
  amount: number;
  payoutId: string;
  payoutNumber: number;
  sentDate: Date;
  paymentMethod: string;
  paymentReference?: string;
}

export interface ConsignorPayoutSummary {
  payoutId: string;
  payoutNumber: number;
  paymentDate: Date;
  amount: number;
  itemCount: number;
  paymentMethod: string;
  status: 'sent' | 'received';
}

export interface PayoutListQuery {
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

// Payout Detail Models
export interface ConsignorPayoutDetail {
  payoutId: string;
  payoutNumber: number;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  status: 'sent' | 'received';

  // Summary breakdown fields
  grossSales: number;
  consignorSplitPercent: number;
  consignorShare: number;
  fees: number;
  feeDescription?: string;  // e.g., "ACH fee (0.5%)"
  netPayout: number;

  items: ConsignorPayoutItem[];
}

export interface ConsignorPayoutItem {
  itemId: string;
  itemName: string;
  soldDate: Date;
  salePrice: number;
  consignorEarnings: number;
}

// Payout Request Models
export interface PayoutRequestStatus {
  canRequest: boolean;
  reason?: 'below_minimum' | 'pending_request' | 'not_allowed';
  minimumAmount?: number;
  pendingRequestDate?: Date;
  availableAmount: number;
}

export interface SubmitPayoutRequest {
  note?: string;
}

export interface PayoutRequest {
  requestId: string;
  amount: number;
  itemCount: number;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'declined';
  note?: string;
}

// Earnings Widget Models
export interface EarningsSummary {
  pending: number;
  pendingTooltip: string;        // "Expected payout date 2/2/2025" or "Minimum payout amount is $25.00" or "Payout Date TBD"
  paidThisMonth: number;
  payoutCountThisMonth: number;
  nextPayoutDate: Date | null;
}

// Statement Month Model - for simplified monthly download UX
export interface StatementMonth {
  year: number;
  month: number;
  monthName: string;        // "December 2024"
  salesCount: number;
  totalEarnings: number;
  payoutCount: number;
  isDownloading?: boolean;  // UI state for download button
}

export interface StatementListResponse {
  statements: StatementMonth[];
}