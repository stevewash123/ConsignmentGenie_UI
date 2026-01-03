import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SquareIntegrationService } from '../../../../services/square-integration.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
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
  styles: [`
    .section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #111827;
    }
    .section-description {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .choice-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .choice-title {
      font-weight: 600;
      margin-bottom: 1rem;
      color: #374151;
      font-size: 1.125rem;
    }

    /* Card-based choice layout */
    .choice-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .choice-grid {
        grid-template-columns: 1fr;
      }
    }

    .choice-card {
      position: relative;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
      min-height: 200px;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .choice-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .choice-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .choice-radio {
      width: 20px;
      height: 20px;
      margin: 0.25rem 0 0 0;
      flex-shrink: 0;
    }

    .choice-main-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 1rem;
    }

    .choice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .choice-text-section {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .choice-icon {
      font-size: 3rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .choice-label {
      font-weight: 600;
      font-size: 1rem;
      color: #111827;
      line-height: 1.4;
      margin: 0;
    }

    .choice-benefits {
      margin-top: 0.75rem;
      padding-right: 0.5rem;
    }

    .benefit-item {
      color: #374151;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      color: #6b7280;
    }
    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .integration-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .integration-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .integration-icon {
      font-size: 2rem;
    }

    .integration-info h4 {
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .integration-info p {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
    }

    .connect-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background-color 0.2s;
    }

    .connect-button:hover:not(:disabled) {
      background: #2563eb;
    }

    .connect-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .disconnect-button {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .disconnect-button:hover {
      background: #dc2626;
    }
    .status-indicator {
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      margin-top: 0.5rem;
      display: inline-block;
    }
    .status-indicator.connected {
      background: #dcfce7;
      color: #166534;
    }
  `]
})
export class SalesComponent implements OnInit {
  private squareService = inject(SquareIntegrationService);
  private http = inject(HttpClient);
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