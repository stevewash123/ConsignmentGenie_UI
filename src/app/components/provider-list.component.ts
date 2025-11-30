import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProviderService } from '../services/provider.service';
import { Provider } from '../models/provider.model';
import { InviteConsignorModalComponent } from '../shared/components/invite-consignor-modal.component';
import { StatusBadgeComponent } from '../shared/components/status-badge.component';
import { ENTITY_LABELS } from '../shared/constants/labels';
import { ProviderStatus } from '../models/provider.model';
import { OwnerLayoutComponent } from '../owner/components/owner-layout.component';
import { LoadingService } from '../shared/services/loading.service';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, InviteConsignorModalComponent, StatusBadgeComponent, OwnerLayoutComponent],
  template: `
    <app-owner-layout>
      <div class="provider-list-container">
        <!-- Page Header -->
        <div class="header">
          <h1 class="page-title">👥 {{ labels.providerManagement }}</h1>
          <button class="btn-primary" (click)="showInviteModal()">
            {{ labels.inviteProvider }}
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="filters">
          <div class="filter-section">
            <label for="statusFilter">Show:</label>
            <select
              id="statusFilter"
              [(ngModel)]="statusFilter"
              (change)="onFilterChange()"
              class="filter-select"
            >
              <option value="all">{{ labels.filterAllProviders }}</option>
              <option value="active">{{ labels.filterActiveProviders }}</option>
              <option value="invited">{{ labels.filterInvitedProviders }}</option>
              <option value="inactive">{{ labels.filterInactiveProviders }}</option>
            </select>
          </div>

          <div class="sort-section">
            <label for="sortBy">Sort by:</label>
            <select
              id="sortBy"
              [(ngModel)]="sortBy"
              (change)="onSortChange()"
              class="sort-select"
            >
              <option value="name">Name</option>
              <option value="createdAt">Date Added</option>
              <option value="status">Status</option>
              <option value="itemCount">Items Count</option>
            </select>
            <button
              class="sort-direction-btn"
              (click)="toggleSortDirection()"
              [title]="sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'"
            >
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
          </div>

          <div class="search-section">
            <input
              type="text"
              [placeholder]="labels.searchProviders"
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              class="search-input"
            >
          </div>
        </div>

        <!-- Consignor List Table -->
        <div class="table-container" *ngIf="!isProvidersLoading(); else loading">
          <table class="consignor-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let provider of filteredProviders(); trackBy: trackByProvider">
                <td class="name-cell">{{ provider.name }}</td>
                <td class="email-cell">{{ provider.email }}</td>
                <td class="status-cell">
                  <app-status-badge [status]="getProviderStatus(provider)"></app-status-badge>
                </td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <!-- Active provider actions -->
                    <ng-container *ngIf="getProviderStatus(provider) === 'active'">
                      <button class="btn-view" [routerLink]="['/owner/providers', provider.id]">
                        View
                      </button>
                    </ng-container>

                    <!-- Invited provider actions -->
                    <ng-container *ngIf="getProviderStatus(provider) === 'invited'">
                      <button class="btn-resend" (click)="resendInvite(provider)">
                        Resend
                      </button>
                      <button class="btn-cancel" (click)="cancelInvite(provider)">
                        Cancel
                      </button>
                    </ng-container>

                    <!-- Inactive provider actions -->
                    <ng-container *ngIf="getProviderStatus(provider) === 'inactive'">
                      <button class="btn-view" [routerLink]="['/owner/providers', provider.id]">
                        View
                      </button>
                      <button class="btn-reactivate" (click)="reactivateProvider(provider)">
                        Reactivate
                      </button>
                    </ng-container>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #loading>
          <div class="loading">Loading {{ labels.providers.toLowerCase() }}...</div>
        </ng-template>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!isProvidersLoading() && filteredProviders().length === 0">
          <p>{{ labels.noProvidersFound }}</p>
        </div>
      </div>

      <!-- Invite Consignor Modal -->
      <app-invite-consignor-modal
        *ngIf="isInviteModalVisible()"
        (closed)="hideInviteModal()"
        (consignorAdded)="onConsignorAdded($event)">
      </app-invite-consignor-modal>
    </app-owner-layout>
  `,
  styles: [`
    .provider-list-container {
      padding: 2rem;
      margin: 1rem 2rem;
      min-height: calc(100vh - 200px);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.7);
      padding: 1.5rem 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }

    .header h2 {
      color: #047857;
      font-size: 2.25rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header h2::before {
      content: "👥";
      font-size: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .stats-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(6, 182, 212, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      position: relative;
      backdrop-filter: blur(10px);
      overflow: hidden;
    }

    .stat-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #047857, #10b981, #06b6d4);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #047857, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }

    .stat-label {
      color: #64748b;
      font-size: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .filters {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      align-items: center;
      flex-wrap: wrap;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }

    .filter-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
    }

    .filter-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #047857;
    }

    .sort-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sort-group label {
      font-weight: 600;
      color: #374151;
    }

    .sort-select {
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      background: white;
      transition: all 0.2s ease;
    }

    .sort-select:focus {
      outline: none;
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    .sort-direction-btn {
      background: linear-gradient(135deg, #f8fafc, #e2e8f0);
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      transition: all 0.2s ease;
      color: #047857;
    }

    .sort-direction-btn:hover {
      background: linear-gradient(135deg, #047857, #10b981);
      color: white;
      transform: scale(1.05);
    }

    .search-group {
      margin-left: auto;
    }

    .search-input {
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      width: 320px;
      font-size: 0.875rem;
      background: white;
      background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%23047857"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>');
      background-size: 20px;
      background-position: 12px center;
      background-repeat: no-repeat;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #047857;
      box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.1);
    }

    .provider-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 2rem;
    }

    .provider-card {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .provider-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981);
    }

    .provider-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: rgba(4, 120, 87, 0.2);
    }

    .provider-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .provider-header h3 {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
      line-height: 1.3;
    }

    .status {
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .status.active {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #047857;
      border: 1px solid #10b981;
    }

    .status.inactive {
      background: linear-gradient(135deg, #fef2f2, #fecaca);
      color: #dc2626;
      border: 1px solid #f87171;
    }

    .provider-details {
      margin-bottom: 2rem;
      space-y: 0.75rem;
    }

    .detail {
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.5;
    }

    .detail strong {
      color: #1f2937;
      font-weight: 600;
      min-width: 80px;
      margin-right: 0.5rem;
    }

    .provider-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary, .btn-success {
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, #047857, #10b981);
      color: white;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #065f46, #047857);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(4, 120, 87, 0.3);
    }

    .btn-secondary {
      background: linear-gradient(135deg, #6b7280, #9ca3af);
      color: white;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #4b5563, #6b7280);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(107, 114, 128, 0.3);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #047857, #10b981);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    }

    .loading, .no-providers {
      text-align: center;
      padding: 4rem;
      color: #64748b;
      font-size: 1.125rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin: 2rem 0;
    }

    .no-providers a {
      color: #047857;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 2px solid transparent;
      transition: border-color 0.2s ease;
    }

    .no-providers a:hover {
      border-bottom-color: #047857;
    }

    @media (max-width: 768px) {
      .provider-list-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .stats-dashboard {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .search-input {
        width: 100%;
      }

      .provider-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProviderListComponent implements OnInit {
  providers = signal<Provider[]>([]);
  filteredProviders = signal<Provider[]>([]);
  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  statusFilter: 'all' | 'active' | 'invited' | 'inactive' = 'all';
  isInviteModalVisible = signal(false);
  labels = ENTITY_LABELS;

  isProvidersLoading(): boolean {
    return this.loadingService.isLoading('providers-list');
  }

  constructor(private providerService: ProviderService, private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.loadingService.start('providers-list');
    this.providerService.getProviders().subscribe({
      next: (providers) => {
        console.log('Providers API response:', providers);

        // Handle API response - might be wrapped in response object
        let providersArray = providers;
        if (providers && typeof providers === 'object' && !Array.isArray(providers)) {
          const response = providers as any;
          providersArray = response.items || response.data || response.providers || [];
          console.log('Extracted providers array:', providersArray);
        }

        // Ensure we have an array and transform to match frontend model
        let finalProviders = Array.isArray(providersArray) ? providersArray : [];

        // Transform API response to match frontend Provider model
        finalProviders = finalProviders.map((apiProvider: any) => ({
          id: apiProvider.providerId || apiProvider.id,
          name: apiProvider.fullName || apiProvider.name || 'Unknown Provider',
          email: apiProvider.email,
          phone: apiProvider.phone,
          address: apiProvider.address || apiProvider.addressLine1,
          commissionRate: (apiProvider.commissionRate * 100) || 0, // Convert decimal to percentage
          preferredPaymentMethod: apiProvider.preferredPaymentMethod,
          paymentDetails: apiProvider.paymentDetails,
          notes: apiProvider.notes,
          isActive: apiProvider.status === 'Active' || apiProvider.isActive === true,
          status: this.mapApiStatusToProviderStatus(apiProvider.status || (apiProvider.isActive ? 'Active' : 'Inactive')),
          organizationId: apiProvider.organizationId,
          providerNumber: apiProvider.providerNumber,
          createdAt: new Date(apiProvider.createdAt),
          updatedAt: new Date(apiProvider.updatedAt || apiProvider.createdAt),
          invitedAt: apiProvider.invitedAt ? new Date(apiProvider.invitedAt) : undefined,
          activatedAt: apiProvider.activatedAt ? new Date(apiProvider.activatedAt) : undefined
        }));

        console.log('Transformed providers:', finalProviders);
        this.providers.set(finalProviders);
        this.applyFilters();

        // Auto-show invite modal if no providers exist
        if (finalProviders.length === 0) {
          this.showInviteModal();
        }
      },
      error: (error) => {
        console.error('Error loading providers:', error);
      },
      complete: () => {
        this.loadingService.stop('providers-list');
      }
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.providers();

    // Ensure filtered is an array before applying filters
    if (!Array.isArray(filtered)) {
      filtered = [];
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => this.getProviderStatus(p) === this.statusFilter);
    }

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phone?.includes(term)
      );
    }

    // Apply sorting
    filtered = this.sortProviders(filtered);

    this.filteredProviders.set(filtered);
  }

  sortProviders(providers: Provider[]): Provider[] {
    return [...providers].sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Provider];
      let bValue: any = b[this.sortBy as keyof Provider];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      // Convert to strings for comparison
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      let result: number;
      if (aValue < bValue) {
        result = -1;
      } else if (aValue > bValue) {
        result = 1;
      } else {
        result = 0;
      }

      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  getProviderStatus(provider: Provider): ProviderStatus {
    return provider.status || (provider.isActive ? 'active' : 'inactive');
  }

  mapApiStatusToProviderStatus(apiStatus: string): ProviderStatus {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'invited':
      case 'pending':
        return 'invited';
      case 'inactive':
      case 'disabled':
        return 'inactive';
      default:
        return 'active';
    }
  }

  resendInvite(provider: Provider): void {
    // TODO: Implement resend invitation API call
    console.log('Resending invitation to:', provider.email);
  }

  cancelInvite(provider: Provider): void {
    // TODO: Implement cancel invitation API call
    console.log('Cancelling invitation for:', provider.email);
  }

  reactivateProvider(provider: Provider): void {
    // TODO: Implement reactivate provider API call
    console.log('Reactivating provider:', provider.name);
  }

  trackByProvider(index: number, provider: Provider): number {
    return provider.id;
  }

  showInviteModal(): void {
    this.isInviteModalVisible.set(true);
  }

  hideInviteModal(): void {
    this.isInviteModalVisible.set(false);
  }

  onConsignorAdded(provider: Provider): void {
    console.log('Consignor added successfully:', provider);
    this.loadProviders(); // Refresh the list
  }
}