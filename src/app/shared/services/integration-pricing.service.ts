import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { OwnerService, SubscriptionInfo } from '../../services/owner.service';
import { ConfirmationDialogService } from './confirmation-dialog.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export type IntegrationType = 'square' | 'quickbooks' | 'plaid';

export interface IntegrationPricing {
  regular: number;
  founder: number;
  name: string;
  productName: string;
}

export interface PricingImpactData {
  action: 'enable' | 'disable';
  productName: string;
  currentMonthlyTotal: number;
  changeAmount: number;
  newMonthlyTotal: number;
  isFounder: boolean;
  isProductFounderPriced: boolean;
  isTrial: boolean;
  trialEndsAt: Date | null;
  billedNowAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class IntegrationPricingService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(
    private ownerService: OwnerService,
    private confirmationService: ConfirmationDialogService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  private readonly integrationPricing: Record<IntegrationType, IntegrationPricing> = {
    square: {
      regular: 20,
      founder: 10,
      name: 'Square Integration',
      productName: 'Square Integration'
    },
    quickbooks: {
      regular: 20,
      founder: 10,
      name: 'QuickBooks Integration',
      productName: 'QuickBooks Integration'
    },
    plaid: {
      regular: 10,
      founder: 5,
      name: 'Bank Account Integration',
      productName: 'Bank Account Integration'
    }
  };

  /**
   * Shows a pricing impact confirmation modal for enabling/disabling an integration.
   * Returns true if user confirms, false if they cancel.
   */
  async showPricingConfirmation(
    integration: IntegrationType,
    isEnabling: boolean,
    customTitle?: string,
    customButtonText?: string
  ): Promise<boolean> {
    try {
      const pricingData = await this.calculatePricingImpact(integration, isEnabling ? 'enable' : 'disable');

      const actionText = isEnabling ? 'enable' : 'disable';
      const actionLabel = customButtonText || (isEnabling ? 'Enable Integration' : 'Disable Integration');
      const title = customTitle || '⚠️ Pricing Impact';

      const pricingMessage = this.buildPricingMessage(actionText, pricingData);

      const result = await firstValueFrom(this.confirmationService.confirmAction(
        title,
        pricingMessage,
        actionLabel
      ));

      return result?.confirmed || false;
    } catch (error) {
      console.error(`Error showing pricing confirmation for ${integration}:`, error);
      // Fall back to basic confirmation if pricing fails
      const result = await firstValueFrom(this.confirmationService.confirmAction(
        'Confirm Action',
        `Are you sure you want to ${isEnabling ? 'enable' : 'disable'} this integration?`,
        customButtonText || (isEnabling ? 'Enable' : 'Disable')
      ));
      return result?.confirmed || false;
    }
  }

  /**
   * Gets pricing information for an integration without showing confirmation modal.
   */
  async getPricingImpact(integration: IntegrationType, action: 'enable' | 'disable'): Promise<PricingImpactData> {
    return this.calculatePricingImpact(integration, action);
  }

  /**
   * Gets the display name for an integration.
   */
  getIntegrationName(integration: IntegrationType): string {
    return this.integrationPricing[integration].name;
  }

  private async calculatePricingImpact(integration: IntegrationType, action: 'enable' | 'disable'): Promise<PricingImpactData> {
    // Get current subscription info (only need this for base pricing and trial status)
    const subscription = await firstValueFrom(this.ownerService.getSubscriptionInfo());

    const integrationConfig = this.integrationPricing[integration];
    const currentMonthlyTotal = (subscription.amount || 0) / 100; // Convert from cents

    // Get founder status from organization founder status endpoint
    const isFounder = await this.getFounderStatus();

    // Get integration price based on founder status
    const integrationMonthlyAmount = isFounder ? integrationConfig.founder : integrationConfig.regular;

    const changeAmount = action === 'enable' ? integrationMonthlyAmount : -integrationMonthlyAmount;
    const newMonthlyTotal = currentMonthlyTotal + changeAmount;
    const isTrial = subscription.status === 'trialing';

    return {
      action,
      productName: integrationConfig.productName,
      currentMonthlyTotal,
      changeAmount,
      newMonthlyTotal,
      isFounder,
      isProductFounderPriced: isFounder,
      isTrial,
      trialEndsAt: isTrial ? new Date(subscription.currentPeriodEnd) : null,
      billedNowAmount: isTrial ? 0 : currentMonthlyTotal
    };
  }

  private async getFounderStatus(): Promise<boolean> {
    try {
      // Use the existing founder status endpoint
      const founderResult = await firstValueFrom(
        this.http.get<{success: boolean, data: {isEligible: boolean}}>(`${this.apiUrl}/subscription/founder-status`)
          .pipe(map(response => response.data))
      );
      return founderResult.isEligible;
    } catch (error) {
      console.warn('Failed to get founder status, defaulting to false:', error);
      return false;
    }
  }

  private buildPricingMessage(actionText: string, pricingData: PricingImpactData): string {
    let pricingMessage = `You're about to ${actionText} ${pricingData.productName}.\n\n`;

    // Build pricing box content
    pricingMessage += `Current price:        $${pricingData.currentMonthlyTotal.toFixed(2)}/month`;
    if (pricingData.isFounder) {
      pricingMessage += `          Founder`;
    }
    pricingMessage += `\n`;

    const changePrefix = pricingData.changeAmount >= 0 ? '+' : '';
    pricingMessage += `${pricingData.productName}:              ${changePrefix}$${pricingData.changeAmount.toFixed(2)}/month`;
    if (pricingData.isProductFounderPriced) {
      pricingMessage += `          Founder`;
    }
    pricingMessage += `\n`;
    pricingMessage += `                       ────────────\n`;
    pricingMessage += `New price:            $${pricingData.newMonthlyTotal.toFixed(2)}/month\n\n`;

    pricingMessage += `Billed now:            $${pricingData.billedNowAmount.toFixed(2)}/month`;
    if (pricingData.isTrial) {
      pricingMessage += `          Trial`;
      pricingMessage += `\nTrial ends:           ${pricingData.trialEndsAt?.toLocaleDateString() || 'Unknown'}`;
    }

    pricingMessage += '\n\nDo you want to continue with this change?';

    return pricingMessage;
  }
}