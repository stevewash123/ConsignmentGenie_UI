import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SquareIntegrationService } from '../../../../services/square-integration.service';
import { ActivatedRoute, Router } from '@angular/router';

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
  onlineChoice: 'consignmentgenie-storefront' | 'square-online' | 'none';
  posChoice: 'consignmentgenie-pos' | 'square-pos' | 'manual';
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

  configForm: FormGroup;

  squareStatus = signal<SquareStatus>({
    isConnected: false
  });

  salesSettings = signal<SalesSettings>({
    onlineChoice: 'consignmentgenie-storefront',
    posChoice: 'consignmentgenie-pos'
  });

  isLoading = signal(false);
  isSaving = signal(false);
  isConnecting = signal(false);

  onlineChoice: 'consignmentgenie-storefront' | 'square-online' | 'none' = 'consignmentgenie-storefront';
  posChoice: 'consignmentgenie-pos' | 'square-pos' | 'manual' = 'consignmentgenie-pos';

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      onlineChoice: ['consignmentgenie-storefront'],
      posChoice: ['consignmentgenie-pos']
    });
  }

  ngOnInit() {
    console.log('🔧 [Sales] ngOnInit - Loading page');
    this.loadSquareStatus();
    this.loadSalesSettings();
    this.handleSquareCallback();

    // Load current choices from shared settings
    const savedSettings = this.squareService.getSquareUsageSettings();
    this.onlineChoice = savedSettings.onlineChoice;
    this.posChoice = savedSettings.posChoice;
    this.updateSalesSettings();

    // Restore pending choice if user navigated back without completing OAuth
    const pendingOnlineChoice = localStorage.getItem('pendingSalesOnlineChoice');
    const pendingPosChoice = localStorage.getItem('pendingSalesPosChoice');
    const hasOAuthCode = this.route.snapshot.queryParams['code'];
    console.log('🔧 [Sales] ngOnInit - pendingOnlineChoice:', pendingOnlineChoice, 'pendingPosChoice:', pendingPosChoice, 'hasOAuthCode:', !!hasOAuthCode);

    if ((pendingOnlineChoice || pendingPosChoice) && !hasOAuthCode) {
      console.log('🔧 [Sales] ngOnInit - Restoring choices from localStorage');
      if (pendingOnlineChoice) {
        this.onlineChoice = pendingOnlineChoice as 'consignmentgenie-storefront' | 'square-online' | 'none';
      }
      if (pendingPosChoice) {
        this.posChoice = pendingPosChoice as 'consignmentgenie-pos' | 'square-pos' | 'manual';
      }
      this.updateSalesSettings();
    }
  }

  selectOnlineChoice(choice: 'consignmentgenie-storefront' | 'square-online' | 'none'): void {
    console.log('🔧 [Sales] selectOnlineChoice - User selected:', choice);
    this.onlineChoice = choice;
    this.configForm.patchValue({ onlineChoice: choice });
    this.updateSalesSettings();

    // Update shared Square usage settings
    this.squareService.updateSquareUsageSettings({
      onlineChoice: choice
    });

    // Clear any pending choice since user made a new selection
    localStorage.removeItem('pendingSalesOnlineChoice');
    console.log('🔧 [Sales] selectOnlineChoice - Cleared pendingSalesOnlineChoice from localStorage');

    // Check if we need to disconnect when no Square options are selected
    this.checkForDisconnect();
  }

  selectPosChoice(choice: 'consignmentgenie-pos' | 'square-pos' | 'manual'): void {
    console.log('🔧 [Sales] selectPosChoice - User selected:', choice);
    this.posChoice = choice;
    this.configForm.patchValue({ posChoice: choice });
    this.updateSalesSettings();

    // Update shared Square usage settings
    this.squareService.updateSquareUsageSettings({
      posChoice: choice
    });

    // Clear any pending choice since user made a new selection
    localStorage.removeItem('pendingSalesPosChoice');
    console.log('🔧 [Sales] selectPosChoice - Cleared pendingSalesPosChoice from localStorage');

    // Check if we need to disconnect when no Square options are selected
    this.checkForDisconnect();
  }

  private updateSalesSettings(): void {
    this.salesSettings.set({
      onlineChoice: this.onlineChoice,
      posChoice: this.posChoice
    });
  }

  private async loadSalesSettings() {
    this.isLoading.set(true);
    try {
      // In the future, load saved settings from the API
      // For now, use defaults
      const settings: SalesSettings = {
        onlineChoice: 'consignmentgenie-storefront',
        posChoice: 'consignmentgenie-pos'
      };

      this.onlineChoice = settings.onlineChoice;
      this.posChoice = settings.posChoice;
      this.salesSettings.set(settings);
    } catch (error) {
      console.error('Failed to load sales settings:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveSalesSettings() {
    this.isSaving.set(true);
    try {
      const settings = this.salesSettings();
      // In the future, save to API
      console.log('Sales settings to save:', settings);
      // await this.http.put(`${environment.apiUrl}/api/sales/settings`, settings).toPromise();
    } catch (error) {
      console.error('Failed to save sales settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async connectToSquare() {
    console.log('🔧 [Sales] connectToSquare - Starting connection, current choices: online=', this.onlineChoice, 'pos=', this.posChoice);
    this.isConnecting.set(true);

    // Save current selections before OAuth redirect
    localStorage.setItem('pendingSalesOnlineChoice', this.onlineChoice);
    localStorage.setItem('pendingSalesPosChoice', this.posChoice);
    console.log('🔧 [Sales] connectToSquare - Saved to localStorage:', this.onlineChoice, this.posChoice);

    // Set a timeout to prevent indefinite loading state
    const timeout = setTimeout(() => {
      this.isConnecting.set(false);
      console.error('Connection timeout - resetting button state');
    }, 10000); // 10 second timeout

    try {
      const authUrl = await this.squareService.initiateConnection();
      console.log('🔧 [Sales] connectToSquare - Got auth URL, redirecting to Square...');
      clearTimeout(timeout);
      // Note: We don't set isConnecting to false here because we're navigating away
      window.location.href = authUrl;
    } catch (error) {
      clearTimeout(timeout);
      console.error('Failed to initiate Square connection:', error);
      this.isConnecting.set(false);
      // TODO: Show user-friendly error message
    }
  }

  async disconnectFromSquare() {
    const confirmed = confirm('Are you sure you want to disconnect from Square? This will stop syncing your Square sales data.');
    if (!confirmed) return;

    try {
      await this.squareService.disconnect();
      await this.loadSquareStatus();
      console.log('🔧 [Sales] Successfully disconnected from Square');
    } catch (error) {
      console.error('Failed to disconnect from Square:', error);
      // TODO: Show user-friendly error message
    }
  }

  private async loadSquareStatus() {
    this.isLoading.set(true);
    try {
      const status = await this.squareService.getStatus();
      this.squareStatus.set(status);
    } catch (error) {
      console.error('Failed to load Square status:', error);
      this.squareStatus.set({
        isConnected: false,
        error: 'Failed to load status'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async handleSquareCallback() {
    const code = this.route.snapshot.queryParams['code'];
    const state = this.route.snapshot.queryParams['state'];

    console.log('🔧 [Sales] handleSquareCallback - code:', !!code, 'state:', !!state);
    console.log('🔧 [Sales] handleSquareCallback - Raw code:', code, 'Raw state:', state);

    if (code && state) {
      console.log('🔧 [Sales] handleSquareCallback - Processing OAuth callback...');
      try {
        this.isLoading.set(true);
        await this.squareService.handleCallback(code, state);
        await this.loadSquareStatus();
      } catch (error) {
        console.error('Failed to handle Square OAuth callback:', error);
      } finally {
        this.isLoading.set(false);
      }

      // Restore the user's choices from before OAuth redirect
      const pendingOnlineChoice = localStorage.getItem('pendingSalesOnlineChoice');
      const pendingPosChoice = localStorage.getItem('pendingSalesPosChoice');
      console.log('🔧 [Sales] handleSquareCallback - pendingOnlineChoice:', pendingOnlineChoice, 'pendingPosChoice:', pendingPosChoice);

      if (pendingOnlineChoice) {
        console.log('🔧 [Sales] handleSquareCallback - Restoring online choice:', pendingOnlineChoice);
        this.onlineChoice = pendingOnlineChoice as 'consignmentgenie-storefront' | 'square-online' | 'none';
        localStorage.removeItem('pendingSalesOnlineChoice');
      }
      if (pendingPosChoice) {
        console.log('🔧 [Sales] handleSquareCallback - Restoring pos choice:', pendingPosChoice);
        this.posChoice = pendingPosChoice as 'consignmentgenie-pos' | 'square-pos' | 'manual';
        localStorage.removeItem('pendingSalesPosChoice');
      }
      this.updateSalesSettings();
      console.log('🔧 [Sales] handleSquareCallback - Choices restored and localStorage cleared');

      // Navigate back to the sales page without the callback params
      this.router.navigate(['/owner/settings/integrations/sales'], { replaceUrl: true });
    } else {
      console.log('🔧 [Sales] handleSquareCallback - No valid OAuth callback detected');

      // If we have query params but they're not OAuth, still try to restore the choices
      const pendingOnlineChoice = localStorage.getItem('pendingSalesOnlineChoice');
      const pendingPosChoice = localStorage.getItem('pendingSalesPosChoice');
      if (pendingOnlineChoice || pendingPosChoice) {
        console.log('🔧 [Sales] handleSquareCallback - Restoring choices from localStorage anyway');
        if (pendingOnlineChoice) {
          this.onlineChoice = pendingOnlineChoice as 'consignmentgenie-storefront' | 'square-online' | 'none';
          localStorage.removeItem('pendingSalesOnlineChoice');
        }
        if (pendingPosChoice) {
          this.posChoice = pendingPosChoice as 'consignmentgenie-pos' | 'square-pos' | 'manual';
          localStorage.removeItem('pendingSalesPosChoice');
        }
        this.updateSalesSettings();
      }
    }
  }

  private async checkForDisconnect() {
    // If Square is connected but no longer being used anywhere, offer to disconnect
    if (this.squareStatus().isConnected && !this.squareService.isSquareInUse()) {
      const shouldDisconnect = confirm(
        'You\'ve deselected all Square options (inventory, online sales, and POS). Would you like to disconnect from Square entirely? ' +
        '(You can always reconnect later if needed)'
      );

      if (shouldDisconnect) {
        await this.disconnectFromSquare();
      }
    }
  }

  get hasSquareOptions(): boolean {
    return this.onlineChoice === 'square-online' || this.posChoice === 'square-pos';
  }
}