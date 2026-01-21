import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PayoutSettingsService, NewPayoutSettings } from '../../../../services/payout-settings.service';

@Component({
  selector: 'app-general-payout-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './general-payout-settings.component.html',
  styleUrls: ['./general-payout-settings.component.scss']
})
export class GeneralPayoutSettingsComponent implements OnInit, OnDestroy {
  settings = signal<NewPayoutSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  private subscriptions = new Subscription();

  // Auto-save status computed from settings state
  autoSaveStatus = computed(() => {
    const settings = this.settings();
    return settings ? 'Saved automatically' : 'Loading...';
  });

  constructor(private payoutSettingsService: PayoutSettingsService) {}

  ngOnInit() {
    this.loadSettings();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadSettings() {
    try {
      const settings = await this.payoutSettingsService.getNewPayoutSettings().toPromise();
      this.settings.set(settings);
    } catch (error) {
      console.error('Error loading payout settings:', error);
      this.showError('Failed to load payout settings');
    }
  }

  // Individual field update methods - these trigger auto-saves
  onCheckMethodChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('payoutMethodCheck', checked);
  }

  onCashMethodChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('payoutMethodCash', checked);
  }

  onStoreCreditMethodChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('payoutMethodStoreCredit', checked);
  }

  onPayPalMethodChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('payoutMethodPayPal', checked);
  }

  onVenmoMethodChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('payoutMethodVenmo', checked);
  }

  onACHMethodChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('payoutMethodACH', checked);
  }

  onHoldPeriodInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && this.settings()?.holdPeriodDays !== numValue) {
      this.updateSetting('holdPeriodDays', numValue);
    }
  }

  onMinimumThresholdInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && this.settings()?.minimumPayoutThreshold !== numValue) {
      this.updateSetting('minimumPayoutThreshold', numValue);
    }
  }

  private async updateSetting<T extends keyof NewPayoutSettings>(field: T, value: NewPayoutSettings[T]) {
    try {
      const currentSettings = this.settings();
      if (!currentSettings) return;

      const updateRequest = { [field]: value };
      const updatedSettings = await this.payoutSettingsService.updateNewPayoutSettings(updateRequest).toPromise();
      this.settings.set(updatedSettings);

      // Brief success indication
      this.showSuccess('Settings updated');
    } catch (error) {
      console.error(`Error updating ${String(field)}:`, error);
      this.showError(`Failed to update ${String(field)}`);
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 2000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}