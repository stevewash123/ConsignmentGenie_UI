import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SquareIntegrationService } from '../../../../services/square-integration.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { IntegrationPricingService } from '../../../../shared/services/integration-pricing.service';
import { ConfirmationDialogService } from '../../../../shared/services/confirmation-dialog.service';

export interface SquareStatus {
  isConnected: boolean;
  merchantId?: string;
  merchantName?: string;
  connectedAt?: Date;
  lastSync?: Date;
  itemCount?: number;
  lastCatalogSync?: Date;
  lastSalesImport?: Date;
  lastSalesImportCount?: number;
  itemLinkSummary?: {
    total: number;
    linked: number;
    shopOwned: number;
    skipped: number;
    unlinked: number;
  };
  error?: string;
}

export interface SalesSettings {
  shopChoice: 'square' | 'consignmentgenie';
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent implements OnInit {
  private squareService = inject(SquareIntegrationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private integrationPricingService = inject(IntegrationPricingService);
  private confirmationService = inject(ConfirmationDialogService);

  configForm: FormGroup;

  squareStatus = signal<SquareStatus>({
    isConnected: false
  });

  salesSettings = signal<SalesSettings>({
    shopChoice: 'consignmentgenie'
  });

  isLoading = signal(false);
  isSaving = signal(false);
  isConnecting = signal(false);

  shopChoice: 'square' | 'consignmentgenie' = 'consignmentgenie';

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      shopChoice: ['consignmentgenie']
    });
  }

  ngOnInit() {
    console.log('🔧 [Sales] ngOnInit - Loading Sales component page');
    console.log('🔧 [Sales] ngOnInit - Component initialized with shopChoice:', this.shopChoice);

    this.loadSquareStatus();
    this.loadSalesSettings();
    this.handleSquareCallback();

    // Load current choice from shared settings
    const savedSettings = this.squareService.getSquareUsageSettings();
    console.log('🔧 [Sales] ngOnInit - Retrieved Square usage settings:', savedSettings);

    // Determine shop choice based on existing settings
    if (savedSettings.inventoryChoice === 'square' || savedSettings.onlineChoice === 'square-online' || savedSettings.posChoice === 'square-pos') {
      this.shopChoice = 'square';
      console.log('🔧 [Sales] ngOnInit - Set shopChoice to "square" based on saved settings');
    } else {
      this.shopChoice = 'consignmentgenie';
      console.log('🔧 [Sales] ngOnInit - Set shopChoice to "consignmentgenie" based on saved settings');
    }
    this.updateSalesSettings();

    // Restore pending choice if user navigated back without completing OAuth
    const pendingShopChoice = localStorage.getItem('pendingSalesShopChoice');
    const hasOAuthCode = this.route.snapshot.queryParams['code'];
    console.log('🔧 [Sales] ngOnInit - pendingShopChoice:', pendingShopChoice, 'hasOAuthCode:', !!hasOAuthCode);

    if (pendingShopChoice && !hasOAuthCode) {
      console.log('🔧 [Sales] ngOnInit - Restoring choice from localStorage:', pendingShopChoice);
      this.shopChoice = pendingShopChoice as 'square' | 'consignmentgenie';
      this.updateSalesSettings();
    }

    console.log('🔧 [Sales] ngOnInit - Final shopChoice after initialization:', this.shopChoice);
  }

  async selectShopChoice(choice: 'square' | 'consignmentgenie'): Promise<void> {
    console.log('🔧 [Sales] selectShopChoice - User selected:', choice);
    console.log('🔧 [Sales] selectShopChoice - Current Square status:', this.squareStatus());
    console.log('🔧 [Sales] selectShopChoice - Current shopChoice:', this.shopChoice);

    // Don't proceed if user selected the same choice
    if (choice === this.shopChoice) {
      console.log('🔧 [Sales] selectShopChoice - User selected the same choice, no action needed');
      return;
    }

    // Show confirmation with pricing impact warning
    try {
      const confirmed = await this.integrationPricingService.showPricingConfirmation(
        'square',
        choice === 'square',
        '⚠️ Pricing Impact',
        choice === 'square' ? 'Enable Integration' : 'Disable Integration'
      );
      if (!confirmed) {
        console.log('🔧 [Sales] selectShopChoice - User cancelled the integration change');
        return;
      }
    } catch (error) {
      console.error('🔧 [Sales] selectShopChoice - Error showing pricing confirmation:', error);
      return;
    }

    // If user selects Square and isn't connected, just set the choice (don't auto-trigger OAuth)
    if (choice === 'square' && !this.squareStatus().isConnected) {
      console.log('🔧 [Sales] selectShopChoice - Square option selected but not connected, showing Connect button');
      // Note: Don't auto-trigger OAuth - user must click Connect button manually
    }

    // If user selects "I don't use Square" and Square is connected, trigger disconnect
    if (choice === 'consignmentgenie' && this.squareStatus().isConnected) {
      console.log('🔧 [Sales] selectShopChoice - User selected "I don\'t use Square" while connected, triggering disconnect');
      this.initiateDisconnectFlow();
      return;
    }

    this.shopChoice = choice;
    this.configForm.patchValue({ shopChoice: choice });
    this.updateSalesSettings();

    // Update shared Square usage settings based on choice
    if (choice === 'square') {
      console.log('🔧 [Sales] selectShopChoice - Setting Square usage settings');
      this.squareService.updateSquareUsageSettings({
        inventoryChoice: 'square',
        onlineChoice: 'square-online',
        posChoice: 'square-pos'
      });
    } else {
      console.log('🔧 [Sales] selectShopChoice - Setting ConsignmentGenie usage settings');
      this.squareService.updateSquareUsageSettings({
        inventoryChoice: 'consignment-genie',
        onlineChoice: 'consignmentgenie-storefront',
        posChoice: 'consignmentgenie-pos'
      });
    }

    // Save settings to API immediately
    await this.saveSalesSettings();

    // Update subscription with new integration status
    await this.updateSubscriptionWithIntegration(choice);

    // Clear any pending choice since user made a new selection
    localStorage.removeItem('pendingSalesShopChoice');
    console.log('🔧 [Sales] selectShopChoice - Cleared pendingSalesShopChoice from localStorage');
  }

  private updateSalesSettings(): void {
    this.salesSettings.set({
      shopChoice: this.shopChoice
    });
  }

  private async loadSalesSettings() {
    this.isLoading.set(true);
    try {
      const response = await fetch(`${environment.apiUrl}/api/sales/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const settings = await response.json();
        this.shopChoice = settings.shopChoice || 'consignmentgenie';
        this.salesSettings.set({
          shopChoice: this.shopChoice
        });
      } else {
        // Use defaults if API call fails
        this.shopChoice = 'consignmentgenie';
        this.salesSettings.set({
          shopChoice: this.shopChoice
        });
      }
    } catch (error) {
      console.error('Failed to load sales settings:', error);
      // Use defaults on error
      this.shopChoice = 'consignmentgenie';
      this.salesSettings.set({
        shopChoice: this.shopChoice
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveSalesSettings() {
    this.isSaving.set(true);
    try {
      const settings = this.salesSettings();
      console.log('Sales settings to save:', settings);

      const response = await fetch(`${environment.apiUrl}/api/sales/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Sales settings saved successfully:', result);

      // Trigger Square sync if user selected Square and is connected
      if (settings.shopChoice === 'square' && this.squareStatus().isConnected) {
        console.log('🔧 [Sales] saveSalesSettings - Triggering Square full sync after settings save');
        this.squareService.performFullSync().subscribe({
          next: (syncResult) => {
            console.log('🔧 [Sales] Square sync completed:', syncResult);
          },
          error: (syncError) => {
            console.error('🔧 [Sales] Square sync failed:', syncError);
          }
        });
      }
    } catch (error) {
      console.error('Failed to save sales settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async connectToSquare() {
    console.log('🔧 [Sales] connectToSquare - Starting connection, current choice:', this.shopChoice);
    this.isConnecting.set(true);

    // Save Square choice before OAuth redirect (user wants to use Square)
    localStorage.setItem('pendingSalesShopChoice', 'square');
    console.log('🔧 [Sales] connectToSquare - Saved "square" to localStorage for OAuth return');

    // Set a timeout to prevent indefinite loading state
    const timeout = setTimeout(() => {
      this.isConnecting.set(false);
      console.error('Connection timeout - resetting button state');
    }, 10000); // 10 second timeout

    this.squareService.initiateConnection().subscribe({
      next: (response) => {
        console.log('🔧 [Sales] connectToSquare - Got auth URL, redirecting to Square...');
        clearTimeout(timeout);
        // Note: We don't set isConnecting to false here because we're navigating away
        if (response?.authUrl) {
          window.location.href = response.authUrl;
        } else {
          throw new Error('Failed to get OAuth URL');
        }
      },
      error: (error) => {
        clearTimeout(timeout);
        console.error('Failed to initiate Square connection:', error);
        this.isConnecting.set(false);
        // TODO: Show user-friendly error message
      }
    });
  }

  async disconnectFromSquare() {
    console.log('🔧 [Sales] disconnectFromSquare - Manual disconnect button clicked');
    this.initiateDisconnectFlow();
  }

  private async initiateDisconnectFlow() {
    console.log('🔧 [Sales] initiateDisconnectFlow - Starting disconnect flow');
    this.confirmationService.confirmAction(
      'Disconnect from Square?',
      'Are you sure you want to disconnect from Square? This will stop syncing your Square sales data.',
      'Disconnect'
    ).subscribe(async (result) => {
      if (!result.confirmed) {
        console.log('🔧 [Sales] initiateDisconnectFlow - User cancelled disconnect');
        return;
      }

      try {
        console.log('🔧 [Sales] initiateDisconnectFlow - User confirmed disconnect, executing...');
        console.log('🔧 [Sales] initiateDisconnectFlow - Calling squareService.disconnect()...');

        const disconnectResult = await new Promise((resolve, reject) => {
          this.squareService.disconnect().subscribe({
            next: (result) => {
              console.log('🔧 [Sales] initiateDisconnectFlow - Disconnect API result:', result);
              resolve(result);
            },
            error: (error) => {
              console.error('🔧 [Sales] initiateDisconnectFlow - Disconnect API error:', error);
              reject(error);
            }
          });
        });

        // Clear all Square-related localStorage settings
        this.squareService.clearSquareLocalStorage();

        // Set choice to "I don't use Square" after successful disconnect
        this.shopChoice = 'consignmentgenie';
        this.configForm.patchValue({ shopChoice: 'consignmentgenie' });
        this.updateSalesSettings();

        // Update shared Square usage settings to ConsignmentGenie
        this.squareService.updateSquareUsageSettings({
          inventoryChoice: 'consignment-genie',
          onlineChoice: 'consignmentgenie-storefront',
          posChoice: 'consignmentgenie-pos'
        });

        // Save settings to API
        await this.saveSalesSettings();

        await this.loadSquareStatus();
        console.log('🔧 [Sales] initiateDisconnectFlow - Successfully disconnected from Square and set choice to "I don\'t use Square"');
      } catch (error) {
        console.error('🔧 [Sales] initiateDisconnectFlow - Failed to disconnect from Square:', error);
        // TODO: Show user-friendly error message
      }
    });
  }

  private loadSquareStatus() {
    console.log('🔧 [Sales] loadSquareStatus - Starting to load Square status');
    this.isLoading.set(true);
    this.squareService.getStatus().subscribe({
      next: (status) => {
        console.log('🔧 [Sales] loadSquareStatus - Square status loaded:', status);
        this.squareStatus.set(status);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('🔧 [Sales] loadSquareStatus - Failed to load Square status:', error);
        this.squareStatus.set({
          isConnected: false,
          error: 'Failed to load status'
        });
        this.isLoading.set(false);
      }
    });
  }

  private async handleSquareCallback() {
    const code = this.route.snapshot.queryParams['code'];
    const state = this.route.snapshot.queryParams['state'];
    const fromSquare = this.route.snapshot.queryParams['fromSquare'];

    console.log('🔧 [Sales] handleSquareCallback - code:', !!code, 'state:', !!state, 'fromSquare:', fromSquare);
    console.log('🔧 [Sales] handleSquareCallback - Raw code:', code, 'Raw state:', state);

    if (code && state) {
      console.log('🔧 [Sales] handleSquareCallback - Processing OAuth callback...');
      try {
        this.isLoading.set(true);
        console.log('🔧 [Sales] handleSquareCallback - Calling backend handleCallback API...');

        // Call the backend API to process the OAuth callback
        const callbackResult = await new Promise((resolve, reject) => {
          this.squareService.handleCallback(code, state).subscribe({
            next: (result) => {
              console.log('🔧 [Sales] handleSquareCallback - Backend callback result:', result);
              resolve(result);
            },
            error: (error) => {
              console.error('🔧 [Sales] handleSquareCallback - Backend callback error:', error);
              reject(error);
            }
          });
        });

        console.log('🔧 [Sales] handleSquareCallback - Backend callback completed, reloading Square status...');
        await this.loadSquareStatus();
      } catch (error) {
        console.error('Failed to handle Square OAuth callback:', error);
      } finally {
        this.isLoading.set(false);
      }

      // Restore the user's choice from before OAuth redirect
      const pendingShopChoice = localStorage.getItem('pendingSalesShopChoice');
      console.log('🔧 [Sales] handleSquareCallback - pendingShopChoice:', pendingShopChoice);

      if (pendingShopChoice) {
        console.log('🔧 [Sales] handleSquareCallback - Restoring shop choice:', pendingShopChoice);
        this.shopChoice = pendingShopChoice as 'square' | 'consignmentgenie';
        localStorage.removeItem('pendingSalesShopChoice');
      } else {
        // If no pending choice, user successfully connected to Square, so set to Square
        console.log('🔧 [Sales] handleSquareCallback - No pending choice, setting to square after successful connection');
        this.shopChoice = 'square';
      }
      this.configForm.patchValue({ shopChoice: this.shopChoice });
      this.updateSalesSettings();

      // Update Square usage settings to match choice
      if (this.shopChoice === 'square') {
        this.squareService.updateSquareUsageSettings({
          inventoryChoice: 'square',
          onlineChoice: 'square-online',
          posChoice: 'square-pos'
        });
      }

      console.log('🔧 [Sales] handleSquareCallback - Choice restored and localStorage cleared, final choice:', this.shopChoice);

      // Navigate back to the sales page without the callback params
      this.router.navigate(['/owner/settings/sales/general'], { replaceUrl: true });
    } else {
      console.log('🔧 [Sales] handleSquareCallback - No valid OAuth callback detected');

      // Handle direct navigation with fromSquare parameter (e.g., from onboarding)
      if (fromSquare === 'true') {
        console.log('🔧 [Sales] handleSquareCallback - Navigation from Square onboarding detected, cleaning URL');
        // Clean the URL by removing the fromSquare parameter
        this.router.navigate(['/owner/settings/sales/general'], { replaceUrl: true });
      }

      // If we have query params but they're not OAuth, still try to restore the choice
      const pendingShopChoice = localStorage.getItem('pendingSalesShopChoice');
      if (pendingShopChoice) {
        console.log('🔧 [Sales] handleSquareCallback - Restoring choice from localStorage anyway');
        this.shopChoice = pendingShopChoice as 'square' | 'consignmentgenie';
        localStorage.removeItem('pendingSalesShopChoice');
        this.updateSalesSettings();
      }
    }
  }


  get hasSquareOptions(): boolean {
    return this.shopChoice === 'square';
  }


  private async updateSubscriptionWithIntegration(choice: 'square' | 'consignmentgenie'): Promise<void> {
    try {
      console.log('🔧 [Sales] updateSubscriptionWithIntegration - Updating subscription for choice:', choice);

      // For now, we're just logging the integration change
      // In the future, this could call a specific API endpoint to update the Stripe subscription
      // based on the integration choices (add/remove Square add-on)

      const integrationStatus = {
        squareEnabled: choice === 'square',
        timestamp: new Date().toISOString(),
        source: 'sales-settings'
      };

      console.log('🔧 [Sales] updateSubscriptionWithIntegration - Integration status:', integrationStatus);

      // TODO: Call backend API to update Stripe subscription with integration status
      // This could be implemented as:
      // await this.ownerService.updateSubscriptionIntegrations(integrationStatus).toPromise();

    } catch (error) {
      console.error('🔧 [Sales] updateSubscriptionWithIntegration - Error updating subscription:', error);
      // Don't throw error to avoid blocking the UI flow
    }
  }
}