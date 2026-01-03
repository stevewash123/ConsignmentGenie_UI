export interface PayoutDto {
  id: string;
  payoutNumber: string;
  payoutDate: Date;
  amount: number;
  status: PayoutStatus;
  paymentMethod: string;
  paymentReference?: string;
  periodStart: Date;
  periodEnd: Date;
  transactionCount: number;
  notes?: string;
  syncedToQuickBooks: boolean;
  quickBooksBillId?: string;
  createdAt: Date;
  consignor: consignorsummary;
  transactions: PayoutTransaction[];
}

export interface PayoutListDto {
  id: string;
  payoutNumber: string;
  payoutDate: Date;
  amount: number;
  status: PayoutStatus;
  paymentMethod: string;
  periodStart: Date;
  periodEnd: Date;
  transactionCount: number;
  consignor: consignorsummary;
}

export interface consignorsummary {
  id: string;
  name: string;
  email?: string;
}

export interface ItemSummary {
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
}

export enum PayoutStatus {
  Pending = 'Pending',
  Paid = 'Paid'
}

export interface PayoutTransaction {
  transactionId: string;
  itemName: string;
  saleDate: Date;
  salePrice: number;
  consignorAmount: number;
  shopAmount: number;
}

export interface CreatePayoutRequest {
  consignorId: string;
  payoutDate: Date;
  paymentMethod: string;
  paymentReference?: string;
  periodStart: Date;
  periodEnd: Date;
  notes?: string;
  transactionIds: string[];
}

export interface UpdatePayoutRequest {
  payoutDate?: Date;
  status?: PayoutStatus;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
}

export interface PayoutSearchRequest {
  consignorId?: string;
  payoutDateFrom?: Date;
  payoutDateTo?: Date;
  status?: PayoutStatus;
  periodStart?: Date;
  periodEnd?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface PendingPayoutsRequest {
  consignorId?: string;
  periodEndBefore?: Date;
  minimumAmount?: number;
}

export interface PendingPayoutData {
  consignorId: string;
  consignorName: string;
  consignorEmail?: string;
  pendingAmount: number;
  transactionCount: number;
  earliestSale: Date;
  latestSale: Date;
  transactions: PayoutTransaction[];
}

export interface PayoutSearchResponse {
  success: boolean;
  data: PayoutListDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}