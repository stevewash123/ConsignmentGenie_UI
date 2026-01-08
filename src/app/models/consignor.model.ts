export type ConsignorStatus = 'active' | 'invited' | 'inactive' | 'suspended' | 'closed' | 'pending';

export interface Consignor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  commissionRate: number;
  preferredPaymentMethod?: string;
  paymentDetails?: string;
  notes?: string;
  isActive: boolean;
  status: ConsignorStatus;
  organizationId: number;
  consignorNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  invitedAt?: Date;
  activatedAt?: Date;
}

export interface CreateConsignorRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  commissionRate: number;
  preferredPaymentMethod?: string;
  paymentDetails?: string;
  notes?: string;
}

export interface UpdateConsignorRequest extends CreateConsignorRequest {
  isActive: boolean;
  status?: ConsignorStatus;
}

export interface ConsignorDetailDto {
  consignorId: string;
  userId?: string;
  consignorNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress?: string;
  commissionRate: number;
  contractStartDate?: string;
  contractEndDate?: string;
  isContractExpired: boolean;
  preferredPaymentMethod?: string;
  paymentDetails?: string;
  notes?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  approvalDate?: string;
  approvedByUserId?: string;
  approvedByUserName?: string;
  totalItems: number;
  activeItems: number;
  soldItems: number;
  pendingBalance: number;
  totalEarnings: number;
  totalPaid: number;
  earningsThisMonth: number;
  earningsLastMonth: number;
  salesThisMonth: number;
  salesLastMonth: number;
  lastSaleDate?: string;
  lastPayoutDate?: string;
  lastPayoutAmount: number;
  averageItemPrice: number;
  averageDaysToSell: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ConsignorListDto {
  consignorId: number;
  consignorNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  commissionRate: number;
  status: string;
  activeItemCount: number;
  totalItemCount: number;
  pendingBalance: number;
  totalEarnings: number;
  hasPortalAccess: boolean;
  contractOnFile: boolean;
  createdAt: string;
}

export interface ConsignorStatusChangeRequest {
  newStatus: ConsignorStatus;
  reason?: string;
}

export interface ConsignorStatusChangeResponse {
  success: boolean;
  message: string;
  updatedConsignor?: Consignor;
}

export interface PendingConsignorApproval {
  id: number;
  name: string;
  email: string;
  phone?: string;
  registrationDate: Date;
  storeCode: string;
  registrationInfo?: string;
}

export interface ConsignorApprovalRequest {
  action: 'approve' | 'reject' | 'request_info';
  message?: string;
}

export interface ConsignorApprovalResponse {
  success: boolean;
  message: string;
  approvedConsignor?: Consignor;
}