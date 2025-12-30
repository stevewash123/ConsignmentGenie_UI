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