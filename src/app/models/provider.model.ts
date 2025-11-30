export type ProviderStatus = 'active' | 'invited' | 'inactive';

export interface Provider {
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
  status: ProviderStatus;
  organizationId: number;
  providerNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  invitedAt?: Date;
  activatedAt?: Date;
}

export interface CreateProviderRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  commissionRate: number;
  preferredPaymentMethod?: string;
  paymentDetails?: string;
  notes?: string;
}

export interface UpdateProviderRequest extends CreateProviderRequest {
  isActive: boolean;
}