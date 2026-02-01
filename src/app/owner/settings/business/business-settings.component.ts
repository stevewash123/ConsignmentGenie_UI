import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessSettingsService } from '../../../services/business-settings.service';
import { BusinessSettings } from '../../../models/business.models';
import { ItemSubmissionMode } from '../../../shared/interfaces/business.interfaces';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-business-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-settings.component.html',
  styleUrls: ['./business-settings.component.scss']
})
export class BusinessSettingsComponent implements OnInit, OnDestroy {
  settings = signal<BusinessSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  private subscriptions = new Subscription();

  // Auto-save status computed from settings state
  autoSaveStatus = computed(() => {
    const settings = this.settings();
    return settings ? 'Saved automatically' : 'Loading...';
  });

  ItemSubmissionMode = ItemSubmissionMode;

  submissionModeOptions = [
    {
      value: ItemSubmissionMode.OwnerOnly,
      label: 'Owner adds all inventory',
      description: 'Consignors cannot submit items.'
    },
    {
      value: ItemSubmissionMode.ApprovalRequired,
      label: 'Consignors submit for approval',
      description: 'You review requests before items appear in inventory.'
    },
    {
      value: ItemSubmissionMode.DirectAdd,
      label: 'Consignors add directly',
      description: 'Items go straight to inventory. No approval required.'
    }
  ];

  constructor(private businessSettingsService: BusinessSettingsService) {}

  ngOnInit() {
    this.setupSubscriptions();
    this.loadSettings();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions() {
    // Subscribe to settings changes from the service
    this.subscriptions.add(
      this.businessSettingsService.businessSettings.subscribe(settings => {
        this.settings.set(settings);
      })
    );
  }

  async loadSettings() {
    try {
      await this.businessSettingsService.loadBusinessSettings();
    } catch (error) {
      console.error('Error loading business settings:', error);
      this.showError('Failed to load business settings');
    }
  }

  // Individual field update methods - these trigger debounced saves
  onDefaultSplitChange(value: string) {
    if (this.isValidSplit(value)) {
      this.businessSettingsService.updateBusinessSetting('defaultSplit', value);
    }
  }

  onAllowCustomSplitsPerConsignorChange(value: boolean) {
    this.businessSettingsService.updateBusinessSetting('allowCustomSplitsPerConsignor', value);
  }

  onAllowCustomSplitsPerItemChange(value: boolean) {
    this.businessSettingsService.updateBusinessSetting('allowCustomSplitsPerItem', value);
  }

  onSalesTaxRateChange(value: string) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && this.isValidTaxRate(numValue)) {
      this.businessSettingsService.updateBusinessSetting('salesTaxRate', numValue);
    }
  }

  onTaxIncludedInPricesChange(value: boolean) {
    this.businessSettingsService.updateBusinessSetting('taxIncludedInPrices', value);
  }

  onChargeTaxOnShippingChange(value: boolean) {
    this.businessSettingsService.updateBusinessSetting('chargeTaxOnShipping', value);
  }

  onTaxIdEinChange(value: string) {
    this.businessSettingsService.updateBusinessSetting('taxIdEin', value || null);
  }

  onHoldPeriodDaysChange(value: string) {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && this.isValidHoldPeriod(numValue)) {
      this.businessSettingsService.updateBusinessSetting('holdPeriodDays', numValue);
    }
  }

  onMinimumAmountChange(value: string) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && this.isValidMinimumAmount(numValue)) {
      this.businessSettingsService.updateBusinessSetting('minimumAmount', numValue);
    }
  }

  onPayoutScheduleChange(value: string) {
    this.businessSettingsService.updateBusinessSetting('payoutSchedule', value);
  }

  onPayoutMethodChange(value: string) {
    this.businessSettingsService.updateBusinessSetting('payoutMethod', value);
  }

  onAutoProcessingChange(value: boolean) {
    this.businessSettingsService.updateBusinessSetting('autoProcessing', value);
  }

  onRefundPolicyChange(value: string) {
    this.businessSettingsService.updateBusinessSetting('refundPolicy', value);
  }

  onRefundWindowDaysChange(value: string) {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && this.isValidRefundWindow(numValue)) {
      this.businessSettingsService.updateBusinessSetting('refundWindowDays', numValue);
    }
  }

  onDefaultConsignmentPeriodDaysChange(value: string) {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      this.businessSettingsService.updateBusinessSetting('defaultConsignmentPeriodDays', numValue);
    }
  }

  onEnableAutoMarkdownsChange(value: boolean) {
    this.businessSettingsService.updateBusinessSetting('enableAutoMarkdowns', value);
  }

  onItemSubmissionModeChange(value: string) {
    this.businessSettingsService.updateBusinessSetting('itemSubmissionMode', value);
  }

  onAutoApproveItemsChange(value: boolean) {
    this.businessSettingsService.updateBusinessSetting('autoApproveItems', value);
  }

  // Special handler for markdown schedule (nested structure)
  updateMarkdownSchedule(field: string, value: any) {
    const currentSettings = this.settings();
    if (!currentSettings) return;

    // Create updated markdown schedule
    const updatedSchedule = {
      ...currentSettings.items.markdownSchedule,
      [field]: field.includes('Days') ? Number(value) : value
    };

    // Update the items section with new markdown schedule
    const updatedItems = {
      ...currentSettings.items,
      markdownSchedule: updatedSchedule
    };

    // Update settings optimistically
    this.settings.set({
      ...currentSettings,
      items: updatedItems
    });

    // For nested structures, we'll use a direct update approach
    // Since markdown is part of items settings, we update them together
    const itemsUpdates = {
      [`items.markdownSchedule.${field}`]: field.includes('Days') ? Number(value) : value
    };

    this.businessSettingsService.updateBusinessSettings(itemsUpdates);
  }

  // Validation methods
  private isValidSplit(split: string): boolean {
    const parts = split.split('/');
    if (parts.length !== 2) return false;
    const consignor = parseInt(parts[0]);
    const shop = parseInt(parts[1]);
    return !isNaN(consignor) && !isNaN(shop) && consignor + shop === 100 && consignor >= 0 && shop >= 0;
  }

  private isValidTaxRate(rate: number): boolean {
    return rate >= 0 && rate <= 100;
  }

  private isValidHoldPeriod(days: number): boolean {
    return days >= 0 && days <= 90;
  }

  private isValidMinimumAmount(amount: number): boolean {
    return amount >= 0 && amount <= 10000;
  }

  private isValidRefundWindow(days: number): boolean {
    return days >= 1 && days <= 90;
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}