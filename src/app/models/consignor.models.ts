export interface ConsignorPermissions {
  canAddItems: boolean;
  canEditOwnItems: boolean;
  canRemoveOwnItems: boolean;
  canEditPrices: boolean;
  isActive: boolean;
}

export interface ConsignorOnboardingSettings {
  agreementRequirement: 'none' | 'acknowledge' | 'upload';
  acknowledgeTermsText: string | null;
  approvalMode: 'auto' | 'manual';
}

export interface ConsignorPageSettings {
  agreementRequirement: string;
  agreementTemplateId: string | null;
  requireSignedAgreement: boolean;
  approvalMode: string;
  acknowledgeTermsText: string | null;
  autoSendAgreementOnRegister: boolean;
  emailOnNewConsignor: boolean;
  defaultPermissions: ConsignorPermissions;
  lastUpdated: Date;
}