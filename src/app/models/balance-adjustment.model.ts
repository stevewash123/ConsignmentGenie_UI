export interface BalanceAdjustment {
  id: string;
  organizationId: string;
  consignorId: string;
  amount: number;
  type: AdjustmentType;
  reason: string;
  createdAt: Date;
  createdByUserId: string;
}

export enum AdjustmentType {
  Correction = 'Correction',
  DamagedItem = 'DamagedItem',
  Bonus = 'Bonus',
  WriteOff = 'WriteOff',
  InitialBalance = 'InitialBalance',
  Other = 'Other'
}

export interface CreateBalanceAdjustmentRequest {
  consignorId: string;
  amount: number;
  type: AdjustmentType;
  reason: string;
}

export interface BalanceAdjustmentResponse {
  success: boolean;
  message: string;
  adjustment?: BalanceAdjustment;
}

export interface ConsignorBalance {
  consignorId: string;
  consignorName: string;
  currentBalance: number;
  totalSales: number;
  totalPayouts: number;
  totalAdjustments: number;
}

export const AdjustmentTypeLabels: Record<AdjustmentType, string> = {
  [AdjustmentType.Correction]: 'Correction - Error Fix',
  [AdjustmentType.DamagedItem]: 'Damaged Item Compensation',
  [AdjustmentType.Bonus]: 'Bonus/Incentive',
  [AdjustmentType.WriteOff]: 'Balance Write-Off',
  [AdjustmentType.InitialBalance]: 'Initial Balance (Migration)',
  [AdjustmentType.Other]: 'Other'
};