export type ConsignorStatus = 'active' | 'invited' | 'inactive';

export interface Consignor {
  id: number;
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