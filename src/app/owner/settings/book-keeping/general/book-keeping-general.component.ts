import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookkeepingSettingsService } from '../../../../services/bookkeeping-settings.service';
import { IntegrationPricingService } from '../../../../shared/services/integration-pricing.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-book-keeping-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-keeping-general.component.html',
  styleUrls: ['./book-keeping-general.component.scss']
})
export class BookKeepingGeneralComponent implements OnInit {
  isLoading = signal(false);
  isSaving = signal(false);

  useQuickBooks = signal(false);
  quickBooksConnected = signal(false);

  private integrationPricingService = inject(IntegrationPricingService);

  constructor(
    private bookkeepingService: BookkeepingSettingsService
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.isLoading.set(true);
    try {
      const settings = await firstValueFrom(this.bookkeepingService.getSettings());
      this.useQuickBooks.set(settings.useQuickBooks);
      this.quickBooksConnected.set(settings.quickBooksConnected);
    } catch (error) {
      console.error('Failed to load bookkeeping settings:', error);
      // Set defaults on error
      this.useQuickBooks.set(false);
      this.quickBooksConnected.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onQuickBooksToggle(): Promise<void> {
    const newValue = !this.useQuickBooks();

    // Don't show confirmation if no change is being made
    if (newValue === this.useQuickBooks()) {
      return;
    }

    // Show confirmation with pricing impact warning
    try {
      const confirmed = await this.integrationPricingService.showPricingConfirmation(
        'quickbooks',
        newValue,
        '⚠️ Pricing Impact',
        newValue ? 'Enable Integration' : 'Disable Integration'
      );
      if (!confirmed) {
        console.log('🔧 [BookKeeping] onQuickBooksToggle - User cancelled the integration change');
        return;
      }
    } catch (error) {
      console.error('🔧 [BookKeeping] onQuickBooksToggle - Error showing pricing confirmation:', error);
      return;
    }

    // Proceed with the change
    this.useQuickBooks.set(newValue);

    // If disabling, also mark as not connected
    if (!newValue) {
      this.quickBooksConnected.set(false);
    }

    await this.autoSave();

    // Update subscription with new integration status
    await this.updateSubscriptionWithQuickBooksIntegration(newValue);
  }

  private async autoSave() {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    try {
      const updates = {
        useQuickBooks: this.useQuickBooks(),
        quickBooksConnected: this.quickBooksConnected()
      };

      await firstValueFrom(this.bookkeepingService.patchSettings(updates));
      console.log('Bookkeeping settings saved successfully');
    } catch (error) {
      console.error('Failed to save bookkeeping settings:', error);
      // TODO: Show error message to user
    } finally {
      this.isSaving.set(false);
    }
  }


  private async updateSubscriptionWithQuickBooksIntegration(isEnabled: boolean): Promise<void> {
    try {
      console.log('🔧 [BookKeeping] updateSubscriptionWithQuickBooksIntegration - Updating subscription for QuickBooks enabled:', isEnabled);

      // For now, we're just logging the integration change
      // In the future, this could call a specific API endpoint to update the Stripe subscription
      // based on the integration choices (add/remove QuickBooks add-on)

      const integrationStatus = {
        quickBooksEnabled: isEnabled,
        timestamp: new Date().toISOString(),
        source: 'bookkeeping-settings'
      };

      console.log('🔧 [BookKeeping] updateSubscriptionWithQuickBooksIntegration - Integration status:', integrationStatus);

      // TODO: Call backend API to update Stripe subscription with integration status
      // This could be implemented as:
      // await this.ownerService.updateSubscriptionIntegrations(integrationStatus).toPromise();

    } catch (error) {
      console.error('🔧 [BookKeeping] updateSubscriptionWithQuickBooksIntegration - Error updating subscription:', error);
      // Don't throw error to avoid blocking the UI flow
    }
  }
}