export enum PayoutMethod {
  Check = 'Check',
  DirectDeposit = 'DirectDeposit',
  StoreCredit = 'StoreCredit'
}

export enum ConsignorStatus {
  Pending = 'Pending',
  Active = 'Active',
  Suspended = 'Suspended'
}

export interface ConsignorShopMembership {
  id: string;
  userId: string; // The consignor
  organizationId: string; // The shop

  // Agreement
  agreementAcceptedAt: Date;
  agreementVersion: string; // Track which version they signed

  // Payout
  payoutMethod: PayoutMethod;
  bankAccountLast4?: string; // Masked, for display
  encryptedBankAccount?: string; // Actual data, encrypted
  encryptedRoutingNumber?: string;

  // Status
  status: ConsignorStatus;
  joinedAt: Date;

  // Shop-set values
  splitPercentage: number; // Default from shop, can customize
}

export interface CreateConsignorShopMembershipRequest {
  storeCode: string;
  agreementAccepted: boolean;
  agreementVersion: string;
  payoutMethod: PayoutMethod;
  bankAccountNumber?: string;
  routingNumber?: string;
  splitPercentage?: number;
}

export interface ConsignmentAgreement {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopOnboardingData {
  shopName: string;
  storeCode: string;
  inventoryMode: 'OwnerOnly' | 'ApprovalRequired' | 'DirectAdd';
  consignmentAgreement?: ConsignmentAgreement;
  defaultSplitPercentage: number;
}

export interface BankAccountValidation {
  accountNumber: string;
  routingNumber: string;
  isValid: boolean;
  errorMessage?: string;
}