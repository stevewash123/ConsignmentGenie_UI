import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ConsignorService, PendingInvitation } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';
import { InviteConsignorModalComponent } from '../../shared/components/invite-consignor-modal.component';
import { ENTITY_LABELS } from '../../shared/constants/labels';
import { ConsignorStatus } from '../../models/consignor.model';
import { OwnerLayoutComponent } from './owner-layout.component';
import { LoadingService } from '../../shared/services/loading.service';
import { AgreementService } from '../../services/agreement.service';

@Component({
  selector: 'app-consignor-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, InviteConsignorModalComponent, OwnerLayoutComponent],
  templateUrl: './consignor-list.component.html',
  styles: [`
    .consignor-list-container {
      padding: 2rem;
      margin: 1rem 2rem;
      min-height: calc(100vh - 200px);
    }

    .content-sections {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .section {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      backdrop-filter: blur(10px);
    }

    .section-header {
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    .section-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #047857;
      letter-spacing: 0.05em;
    }

    .empty-section {
      text-align: center;
      color: #6b7280;
      font-style: italic;
      padding: 2rem;
    }

    .invitations-table {
      width: 100%;
      border-collapse: collapse;
    }

    .invitations-table th,
    .invitations-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .invitations-table th {
      background: rgba(4, 120, 87, 0.05);
      font-weight: 600;
      color: #047857;
    }

    .sent-cell {
      color: #6b7280;
      font-size: 0.875rem;
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

    .consignor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 2rem;
    }

    .consignor-card {
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

    .consignor-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981);
    }

    .consignor-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: rgba(4, 120, 87, 0.2);
    }

    .consignor-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .consignor-header h3 {
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

    .consignor-details {
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

    .consignor-actions {
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

    .btn-email {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border: none;
      border-radius: 6px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn-email:hover {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .loading, .no-consignors {
      text-align: center;
      padding: 4rem;
      color: #64748b;
      font-size: 1.125rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin: 2rem 0;
    }

    .no-consignors a {
      color: #047857;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 2px solid transparent;
      transition: border-color 0.2s ease;
    }

    .no-consignors a:hover {
      border-bottom-color: #047857;
    }

    @media (max-width: 768px) {
      .consignor-list-container {
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

      .consignor-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ConsignorListComponent implements OnInit {
  consignors = signal<Consignor[]>([]);
  filteredconsignors = signal<Consignor[]>([]);
  pendingInvitations = signal<PendingInvitation[]>([]);
  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  statusFilter: 'all' | 'active' | 'invited' | 'inactive' = 'all';
  isInviteModalVisible = signal(false);
  labels = ENTITY_LABELS;
  private consignorsLoaded = false;
  private invitationsLoaded = false;

  isconsignorsLoading(): boolean {
    return this.loadingService.isLoading('consignors-list');
  }

  constructor(
    private ConsignorService: ConsignorService,
    private loadingService: LoadingService,
    private agreementService: AgreementService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadconsignors(): void {
    this.loadingService.start('consignors-list');
    this.ConsignorService.getConsignors().subscribe({
      next: (consignors) => {
        console.log('consignors API response:', consignors);

        // Handle API response - might be wrapped in response object
        let consignorsArray = consignors;
        if (consignors && typeof consignors === 'object' && !Array.isArray(consignors)) {
          const response = consignors as any;
          consignorsArray = response.items || response.data || response.consignors || [];
          console.log('Extracted consignors array:', consignorsArray);
        }

        // Ensure we have an array and transform to match frontend model
        let finalconsignors = Array.isArray(consignorsArray) ? consignorsArray : [];

        // Transform API response to match frontend consignor model
        finalconsignors = finalconsignors.map((apiProvider: any) => ({
          id: apiProvider.providerId || apiProvider.id,
          name: apiProvider.fullName || apiProvider.name || 'Unknown consignor',
          email: apiProvider.email,
          phone: apiProvider.phone,
          address: apiProvider.address || apiProvider.addressLine1,
          commissionRate: (apiProvider.commissionRate * 100) || 0, // Convert decimal to percentage
          preferredPaymentMethod: apiProvider.preferredPaymentMethod,
          paymentDetails: apiProvider.paymentDetails,
          notes: apiProvider.notes,
          isActive: apiProvider.status === 'Active' || apiProvider.isActive === true,
          status: this.mapApiStatusToConsignorStatus(apiProvider.status || (apiProvider.isActive ? 'Active' : 'Inactive')),
          organizationId: apiProvider.organizationId,
          consignorNumber: apiProvider.consignorNumber,
          createdAt: new Date(apiProvider.createdAt),
          updatedAt: new Date(apiProvider.updatedAt || apiProvider.createdAt),
          invitedAt: apiProvider.invitedAt ? new Date(apiProvider.invitedAt) : undefined,
          activatedAt: apiProvider.activatedAt ? new Date(apiProvider.activatedAt) : undefined
        }));

        console.log('Transformed consignors:', finalconsignors);
        this.consignors.set(finalconsignors);
        this.applyFilters();
        this.consignorsLoaded = true;

        // Check if we should show the invite modal
        this.checkAndShowInviteModal();
      },
      error: (error) => {
        console.error('Error loading consignors:', error);
        this.consignorsLoaded = true;
        this.checkAndShowInviteModal();
      },
      complete: () => {
        // Loading stop will be handled in checkAndShowInviteModal
      }
    });
  }

  loadData(): void {
    this.loadingService.start('consignors-list');
    this.consignorsLoaded = false;
    this.invitationsLoaded = false;
    this.loadconsignors();
    this.loadPendingInvitations();
  }

  loadPendingInvitations(): void {
    this.ConsignorService.getPendingInvitations().subscribe({
      next: (invitations) => {
        console.log('Pending invitations response:', invitations);
        const validInvitations = Array.isArray(invitations) ? invitations : [];
        this.pendingInvitations.set(validInvitations);
        this.invitationsLoaded = true;

        // Check if we should show the invite modal
        this.checkAndShowInviteModal();
      },
      error: (error) => {
        console.error('Error loading pending invitations:', error);
        this.pendingInvitations.set([]);
        this.invitationsLoaded = true;
        this.checkAndShowInviteModal();
      }
    });
  }

  resendInvitation(invitationId: number): void {
    this.ConsignorService.resendInvitation(invitationId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Invitation resent successfully');
          // Optionally refresh the invitations list to update the sent date
          this.loadPendingInvitations();
        } else {
          console.error('Failed to resend invitation:', response.message);
        }
      },
      error: (error) => {
        console.error('Error resending invitation:', error);
      }
    });
  }

  cancelInvitation(invitationId: number): void {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      this.ConsignorService.cancelInvitation(invitationId).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Invitation cancelled successfully');
            // Remove the cancelled invitation from the list
            this.loadPendingInvitations();
          } else {
            console.error('Failed to cancel invitation:', response.message);
          }
        },
        error: (error) => {
          console.error('Error cancelling invitation:', error);
        }
      });
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.consignors();

    // Ensure filtered is an array before applying filters
    if (!Array.isArray(filtered)) {
      filtered = [];
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => this.getConsignorStatus(p) === this.statusFilter);
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
    filtered = this.sortconsignors(filtered);

    this.filteredconsignors.set(filtered);
  }

  sortconsignors(consignors: Consignor[]): Consignor[] {
    return [...consignors].sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Consignor];
      let bValue: any = b[this.sortBy as keyof Consignor];

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

  getConsignorStatus(consignor: Consignor): ConsignorStatus {
    return consignor.status || (consignor.isActive ? 'active' : 'inactive');
  }

  mapApiStatusToConsignorStatus(apiStatus: string): ConsignorStatus {
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

  resendInvite(consignor: Consignor): void {
    // TODO: Implement resend invitation API call
    console.log('Resending invitation to:', consignor.email);
  }

  cancelInvite(consignor: Consignor): void {
    // TODO: Implement cancel invitation API call
    console.log('Cancelling invitation for:', consignor.email);
  }

  reactivateProvider(consignor: Consignor): void {
    // TODO: Implement reactivate consignor API call
    console.log('Reactivating consignor:', consignor.name);
  }

  trackByProvider(index: number, consignor: Consignor): number {
    return consignor.id;
  }

  getProviderItemCount(consignor: Consignor): number {
    // TODO: Implement item count logic when items feature is available
    return 0;
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  }

  showInviteModal(): void {
    this.isInviteModalVisible.set(true);
  }

  hideInviteModal(): void {
    this.isInviteModalVisible.set(false);
  }

  onConsignorAdded(consignor: Consignor): void {
    console.log('Consignor added successfully:', consignor);
    this.loadData(); // Refresh both lists
  }

  emailAgreement(consignor: Consignor): void {
    if (!consignor.email) {
      alert('Consignor does not have an email address on file.');
      return;
    }

    if (confirm(`Send consignment agreement to ${consignor.name} at ${consignor.email}?`)) {
      this.agreementService.emailAgreement({
        providerId: consignor.id.toString(),
        emailAddress: consignor.email
      }).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Agreement sent successfully to ${consignor.email}`);
          } else {
            alert(`Failed to send agreement: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('Error sending agreement:', error);
          alert('Failed to send agreement. Please try again.');
        }
      });
    }
  }

  private checkAndShowInviteModal(): void {
    // Only check if both consignors and invitations have finished loading
    if (this.consignorsLoaded && this.invitationsLoaded) {
      // Stop the loading service once both calls are complete
      this.loadingService.stop('consignors-list');

      // Show modal if no consignors AND no pending invitations
      if (this.consignors().length === 0 && this.pendingInvitations().length === 0) {
        this.showInviteModal();
      }
    }
  }
}