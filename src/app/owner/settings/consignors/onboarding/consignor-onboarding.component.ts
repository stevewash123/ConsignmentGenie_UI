import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConsignorOnboardingService } from '../../../../services/consignor-onboarding.service';
import { ConsignorOnboardingSettings } from '../../../../models/consignor.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consignor-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consignor-onboarding.component.html',
  styleUrls: ['./consignor-onboarding.component.scss']
})
export class ConsignorOnboardingComponent implements OnInit, OnDestroy {
  settings = signal<ConsignorOnboardingSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  showConfigureTermsModal = signal(false);
  tempAcknowledgeText = signal('');
  private subscriptions = new Subscription();

  // Auto-save status computed from settings state
  autoSaveStatus = computed(() => {
    const settings = this.settings();
    return settings ? 'Saved automatically' : 'Loading...';
  });

  constructor(private consignorOnboardingService: ConsignorOnboardingService) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions(): void {
    // Subscribe to onboarding settings changes from the service
    this.subscriptions.add(
      this.consignorOnboardingService.consignorOnboarding.subscribe(settings => {
        this.settings.set(settings);
      })
    );
  }

  async loadSettings(): Promise<void> {
    try {
      await this.consignorOnboardingService.loadConsignorOnboarding();
    } catch (error) {
      console.error('Error loading consignor onboarding settings:', error);
      this.showError('Failed to load settings');
    }
  }


  onAgreementRequirementChange(value: 'none' | 'acknowledge' | 'upload'): void {
    // Update the agreement requirement with debounced save
    this.consignorOnboardingService.updateConsignorOnboardingSetting('agreementRequirement', value);

    // Validation Rule 1: If "none", approval mode must be "manual"
    if (value === 'none') {
      this.consignorOnboardingService.updateConsignorOnboardingSetting('approvalMode', 'manual');
    }
  }

  onApprovalModeChange(value: 'auto' | 'manual'): void {
    this.consignorOnboardingService.updateConsignorOnboardingSetting('approvalMode', value);
  }

  isAutoApprovalDisabled(): boolean {
    const current = this.settings();
    return current?.agreementRequirement === 'none';
  }

  showWarningPanel(): boolean {
    const current = this.settings();
    return current?.agreementRequirement === 'none';
  }

  openConfigureTermsModal(): void {
    const current = this.settings();
    this.tempAcknowledgeText.set(current?.acknowledgeTermsText || '');
    this.showConfigureTermsModal.set(true);
  }

  closeConfigureTermsModal(): void {
    this.showConfigureTermsModal.set(false);
    this.tempAcknowledgeText.set('');
  }

  saveConfigureTerms(): void {
    this.consignorOnboardingService.updateConsignorOnboardingSetting('acknowledgeTermsText', this.tempAcknowledgeText());
    this.closeConfigureTermsModal();
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }

}