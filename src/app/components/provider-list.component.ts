import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProviderService } from '../services/provider.service';
import { Provider } from '../models/provider.model';
import { ProviderInvitationModalComponent } from './provider-invitation-modal.component';
import { OwnerLayoutComponent } from '../owner/components/owner-layout.component';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProviderInvitationModalComponent, OwnerLayoutComponent],
  template: `
    <app-owner-layout>
      <div class="provider-list-container">
        <div class="header">
          <h2>Providers</h2>
          <div class="header-actions">
            <button class="btn-secondary" (click)="showInviteModal()">
              Invite Provider
            </button>
            <button class="btn-primary" routerLink="/providers/new">
              Add New Provider
            </button>
          </div>
        </div>

        <!-- Stats Dashboard -->
        <div class="stats-dashboard" *ngIf="!isLoading()">
          <div class="stat-card">
            <div class="stat-number">{{ getStats().total }}</div>
            <div class="stat-label">Total Providers</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getStats().active }}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getStats().inactive }}</div>
            <div class="stat-label">Inactive</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ getStats().avgCommission }}%</div>
            <div class="stat-label">Avg Commission</div>
          </div>
        </div>

        <div class="filters">
          <div class="filter-group">
            <label>
              <input
                type="checkbox"
                [checked]="showActiveOnly()"
                (change)="toggleActiveFilter()"
              >
              Show Active Only
            </label>
          </div>
          <div class="sort-group">
            <label for="sortBy">Sort by:</label>
            <select
              id="sortBy"
              [(ngModel)]="sortBy"
              (change)="onSortChange()"
              class="sort-select"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="commissionRate">Commission Rate</option>
              <option value="createdAt">Date Added</option>
            </select>
            <button
              class="sort-direction-btn"
              (click)="toggleSortDirection()"
              [title]="sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'"
            >
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
          <div class="search-group">
            <input
              type="text"
              placeholder="Search providers..."
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              class="search-input"
            >
          </div>
        </div>

        <div class="provider-grid" *ngIf="!isLoading(); else loading">
          <div class="provider-card" *ngFor="let provider of filteredProviders(); trackBy: trackByProvider">
            <div class="provider-header">
              <h3>{{ provider.name }}</h3>
              <div class="status" [class.active]="provider.isActive" [class.inactive]="!provider.isActive">
                {{ provider.isActive ? 'Active' : 'Inactive' }}
              </div>
            </div>

            <div class="provider-details">
              <div class="detail" *ngIf="provider.email">
                <strong>Email:</strong> {{ provider.email }}
              </div>
              <div class="detail" *ngIf="provider.phone">
                <strong>Phone:</strong> {{ provider.phone }}
              </div>
              <div class="detail">
                <strong>Commission:</strong> {{ provider.commissionRate }}%
              </div>
            </div>

            <div class="provider-actions">
              <button class="btn-secondary" [routerLink]="['/providers', provider.id]">
                View Details
              </button>
              <button class="btn-secondary" [routerLink]="['/providers', provider.id, 'edit']">
                Edit
              </button>
              <button
                class="btn-secondary"
                *ngIf="provider.isActive"
                (click)="deactivateProvider(provider)"
              >
                Deactivate
              </button>
              <button
                class="btn-success"
                *ngIf="!provider.isActive"
                (click)="activateProvider(provider)"
              >
                Activate
              </button>
            </div>
          </div>
        </div>

        <ng-template #loading>
          <div class="loading">Loading providers...</div>
        </ng-template>

        <div class="no-providers" *ngIf="!isLoading() && filteredProviders().length === 0">
          <p>No providers found. <a routerLink="/providers/new">Add your first provider</a></p>
        </div>
      </div>

      <!-- Provider Invitation Modal -->
      <app-provider-invitation-modal
        [isVisible]="isInviteModalVisible"
        (close)="hideInviteModal()"
        (invitationSent)="onInvitationSent()">
      </app-provider-invitation-modal>
    </app-owner-layout>
  `,
  styles: [`
    .provider-list-container {
      padding: 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: calc(100vh - 140px);
      border-radius: 20px;
      margin: 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3rem;
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.8);
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
      background: linear-gradient(135deg, white 0%, #f8fafc 100%);
      border: 1px solid rgba(6, 182, 212, 0.1);
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      position: relative;
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
      background: linear-gradient(135deg, white 0%, #f8fafc 100%);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
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
      transform: translateY(-8px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
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
  isLoading = signal(true);
  showActiveOnly = signal(true);
  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  isInviteModalVisible = signal(false);

  constructor(private providerService: ProviderService) {}

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.isLoading.set(true);
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
          organizationId: apiProvider.organizationId,
          providerNumber: apiProvider.providerNumber,
          createdAt: new Date(apiProvider.createdAt),
          updatedAt: new Date(apiProvider.updatedAt || apiProvider.createdAt)
        }));

        console.log('Transformed providers:', finalProviders);
        this.providers.set(finalProviders);
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading providers:', error);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update(value => !value);
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

    if (this.showActiveOnly()) {
      filtered = filtered.filter(p => p.isActive);
    }

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

  getStats() {
    const providers = this.providers();
    const total = providers.length;
    const active = providers.filter(p => p.isActive).length;
    const inactive = total - active;

    const avgCommission = total > 0
      ? Math.round(providers.reduce((sum, p) => sum + p.commissionRate, 0) / total * 10) / 10
      : 0;

    return {
      total,
      active,
      inactive,
      avgCommission
    };
  }

  deactivateProvider(provider: Provider): void {
    this.providerService.deactivateProvider(provider.id).subscribe({
      next: (updated) => {
        const providers = this.providers();
        const index = providers.findIndex(p => p.id === updated.id);
        if (index >= 0) {
          providers[index] = updated;
          this.providers.set([...providers]);
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error deactivating provider:', error);
      }
    });
  }

  activateProvider(provider: Provider): void {
    this.providerService.activateProvider(provider.id).subscribe({
      next: (updated) => {
        const providers = this.providers();
        const index = providers.findIndex(p => p.id === updated.id);
        if (index >= 0) {
          providers[index] = updated;
          this.providers.set([...providers]);
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error activating provider:', error);
      }
    });
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

  onInvitationSent(): void {
    // Optionally reload providers to refresh the list
    // For now, we'll just hide the modal and show a success message
    console.log('Provider invitation sent successfully');
  }
}