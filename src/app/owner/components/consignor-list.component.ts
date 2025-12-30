import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ConsignorService, PendingInvitation } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';
import { InviteConsignorModalComponent } from '../../shared/components/invite-consignor-modal.component';
import { BulkInviteConsignorModalComponent } from '../../shared/components/bulk-invite-consignor-modal.component';
import { ENTITY_LABELS } from '../../shared/constants/labels';
import { ConsignorStatus } from '../../models/consignor.model';
import { OwnerLayoutComponent } from './owner-layout.component';
import { LoadingService } from '../../shared/services/loading.service';
import { AgreementService } from '../../services/agreement.service';

@Component({
  selector: 'app-consignor-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, InviteConsignorModalComponent, BulkInviteConsignorModalComponent, OwnerLayoutComponent],
  templateUrl: './consignor-list.component.html',
  styles: [`
    .consignor-list-container {
      padding: 2rem 4rem;
      margin: 1rem auto;
      max-width: 1400px;
      min-height: calc(100vh - 200px);
    }

    /* Header Styling */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid rgba(148, 163, 184, 0.1);
    }

    .page-title {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    /* Button Base Styles */
    .btn-primary, .btn-secondary, .btn-view, .btn-email, .btn-resend, .btn-cancel {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      white-space: nowrap;
    }

    /* Primary Button */
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    /* Secondary Button */
    .btn-secondary {
      background: rgba(107, 114, 128, 0.1);
      color: #374151;
      border: 1px solid rgba(107, 114, 128, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(107, 114, 128, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* Action Buttons */
    .btn-view {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .btn-view:hover {
      background: rgba(16, 185, 129, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
    }

    .btn-message {
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      border: 1px solid rgba(99, 102, 241, 0.2);
      padding: 0.5rem 0.75rem;
      min-width: auto;
    }

    .btn-message:hover {
      background: rgba(99, 102, 241, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(99, 102, 241, 0.3);
    }

    .btn-email {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
      border: 1px solid rgba(245, 158, 11, 0.2);
      padding: 0.5rem 0.75rem;
      min-width: auto;
    }

    .btn-email:hover {
      background: rgba(245, 158, 11, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(245, 158, 11, 0.3);
    }

    .btn-resend {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
      border: 1px solid rgba(59, 130, 246, 0.2);
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .btn-resend:hover {
      background: rgba(59, 130, 246, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
    }

    .btn-cancel {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .btn-cancel:hover {
      background: rgba(239, 68, 68, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(239, 68, 68, 0.3);
    }

    /* Approval button styles */
    .btn-approve {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
      border: 1px solid rgba(34, 197, 94, 0.2);
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .btn-approve:hover {
      background: rgba(34, 197, 94, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(34, 197, 94, 0.3);
    }

    .btn-reject {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .btn-reject:hover {
      background: rgba(239, 68, 68, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(239, 68, 68, 0.3);
    }

    /* Pending approval row styling */
    .pending-approval {
      background-color: rgba(255, 193, 7, 0.1);
      border-left: 4px solid #ffc107;
    }

    .pending-badge {
      display: inline-block;
      background: #ffc107;
      color: #212529;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: 0.5rem;
      text-transform: uppercase;
    }

    .content-sections {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    .section {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(10px);
    }

    .section-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(148, 163, 184, 0.1);
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
      letter-spacing: 0.025em;
    }

    /* Table styling with specific column widths */
    .consignor-table, .invitations-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .consignor-table th,
    .consignor-table td,
    .invitations-table th,
    .invitations-table td {
      padding: 1rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    }

    .consignor-table th:nth-child(1),
    .consignor-table td:nth-child(1) {
      width: 30%;
    }

    .consignor-table th:nth-child(2),
    .consignor-table td:nth-child(2) {
      width: 30%;
    }

    .consignor-table th:nth-child(3),
    .consignor-table td:nth-child(3) {
      width: 15%;
      text-align: center;
    }

    .consignor-table th:nth-child(4),
    .consignor-table td:nth-child(4) {
      width: 25%;
      text-align: center;
    }

    .invitations-table th:nth-child(1),
    .invitations-table td:nth-child(1) {
      width: 40%;
    }

    .invitations-table th:nth-child(2),
    .invitations-table td:nth-child(2) {
      width: 25%;
      text-align: center;
    }

    .invitations-table th:nth-child(3),
    .invitations-table td:nth-child(3) {
      width: 35%;
      text-align: center;
    }

    .consignor-table th,
    .invitations-table th {
      background-color: rgba(249, 250, 251, 0.8);
      font-weight: 700;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      align-items: center;
    }

    .name-cell {
      font-weight: 600;
      color: #1f2937;
    }

    .email-cell {
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }

    .items-cell {
      font-weight: 600;
      color: #059669;
    }

    .sent-cell {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      font-size: 1.1rem;
      color: #6b7280;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .empty-state h4 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .empty-state p {
      margin: 0 0 2rem 0;
      color: #6b7280;
      font-size: 1.1rem;
    }

    .empty-section {
      text-align: center;
      padding: 3rem 2rem;
      color: #9ca3af;
      font-style: italic;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .consignor-list-container {
        padding: 2rem 3rem;
      }
    }

    @media (max-width: 768px) {
      .consignor-list-container {
        padding: 1.5rem 2rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .header-actions {
        flex-wrap: wrap;
        justify-content: center;
      }

      .page-title {
        font-size: 1.75rem;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.5rem;
      }

      .btn-primary, .btn-secondary {
        padding: 0.625rem 1rem;
        font-size: 0.8rem;
      }
    }
  `]
})
export class ConsignorListComponent implements OnInit {
  consignors = signal<Consignor[]>([]);
  pendingInvitations = signal<PendingInvitation[]>([]);

  filteredConsignors = signal<Consignor[]>([]);
  filteredInvitations = signal<PendingInvitation[]>([]);

  isLoading = signal<boolean>(false);

  searchTerm = '';
  statusFilter: ConsignorStatus | 'all' = 'all';

  inviteModalVisible = false;
  bulkInviteModalVisible = false;

  labels = ENTITY_LABELS;

  constructor(
    private ConsignorService: ConsignorService,
    private loadingService: LoadingService,
    private agreementService: AgreementService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load regular consignors and pending approvals in parallel
    const consignors$ = this.ConsignorService.getConsignors();
    const pendingApprovals$ = this.ConsignorService.getPendingApprovals();

    // Combine both API calls
    consignors$.subscribe({
      next: (consignors) => {
        // Load pending approvals and convert to consignor format
        pendingApprovals$.subscribe({
          next: (approvals) => {
            const pendingConsignors: Consignor[] = approvals.map(approval => ({
              id: approval.id.toString(),
              name: approval.name,
              email: approval.email,
              phone: approval.phone,
              commissionRate: 50, // Default commission rate
              status: 'pending' as const,
              isActive: false,
              organizationId: 1,
              consignorNumber: `PEN${approval.id.toString().padStart(3, '0')}`,
              createdAt: approval.registrationDate,
              updatedAt: approval.registrationDate
            }));

            // Add mock pending consignors as fallback when API has no pending approvals
            if (pendingConsignors.length === 0) {
              const mockPendingConsignors: Consignor[] = [
                {
                  id: '1001',
                  name: 'Sarah Johnson',
                  email: 'sarah.johnson@example.com',
                  phone: '(555) 123-4567',
                  commissionRate: 50,
                  status: 'pending',
                  isActive: false,
                  organizationId: 1,
                  consignorNumber: 'PEN001',
                  createdAt: new Date('2024-12-29'),
                  updatedAt: new Date('2024-12-29')
                },
                {
                  id: '1002',
                  name: 'Mike Chen',
                  email: 'mike.chen@email.com',
                  phone: '(555) 987-6543',
                  commissionRate: 50,
                  status: 'pending',
                  isActive: false,
                  organizationId: 1,
                  consignorNumber: 'PEN002',
                  createdAt: new Date('2024-12-28'),
                  updatedAt: new Date('2024-12-28')
                }
              ];
              pendingConsignors.push(...mockPendingConsignors);
            }

            const allConsignors = [...pendingConsignors, ...(consignors || [])];
            this.consignors.set(allConsignors);
            this.applyFilters();
          },
          error: (error) => {
            console.error('Error loading pending approvals:', error);
            // Just load regular consignors if pending approvals fail
            this.consignors.set(consignors || []);
            this.applyFilters();
          }
        });
      },
      error: (error) => {
        console.error('Error loading consignors:', error);
        this.consignors.set([]);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });

    // Load pending invitations separately
    this.ConsignorService.getPendingInvitations().subscribe({
      next: (invitations) => {
        this.pendingInvitations.set(invitations || []);
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading invitations:', error);
        this.pendingInvitations.set([]);
      }
    });
  }

  isconsignorsLoading(): boolean {
    return this.isLoading();
  }

  applyFilters(): void {
    let filtered = this.consignors();

    if (this.searchTerm) {
      filtered = filtered.filter(consignor =>
        consignor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        consignor.email?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(consignor => consignor.status === this.statusFilter);
    }

    // Sort unapproved consignors to the top
    filtered.sort((a, b) => {
      // Pending consignors first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      // Then invited consignors
      if (a.status === 'invited' && b.status !== 'invited' && b.status !== 'pending') return -1;
      if (b.status === 'invited' && a.status !== 'invited' && a.status !== 'pending') return 1;
      // Rest by name
      return a.name.localeCompare(b.name);
    });

    this.filteredConsignors.set(filtered);

    // Filter invitations
    let filteredInv = this.pendingInvitations();
    if (this.searchTerm) {
      filteredInv = filteredInv.filter(inv =>
        inv.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        inv.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.filteredInvitations.set(filteredInv);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  showInviteModal(): void {
    this.inviteModalVisible = true;
  }

  hideInviteModal(): void {
    this.inviteModalVisible = false;
  }

  showBulkInviteModal(): void {
    this.bulkInviteModalVisible = true;
  }

  hideBulkInviteModal(): void {
    this.bulkInviteModalVisible = false;
  }

  onInviteSuccess(): void {
    this.hideInviteModal();
    this.loadData();
  }

  onBulkInviteSuccess(): void {
    this.hideBulkInviteModal();
    this.loadData();
  }

  // Template methods
  trackByProvider(index: number, consignor: Consignor): string {
    return consignor.id;
  }

  getProviderItemCount(consignor: Consignor): number {
    return 0; // TODO: Implement item count
  }

  sendMessage(consignor: Consignor): void {
    const message = prompt(`Send message to ${consignor.name}:`, '');
    if (message && message.trim()) {
      // TODO: Integrate with actual notification service
      console.log(`Sending message to ${consignor.name} (${consignor.email}):`, message);
      alert(`Message sent to ${consignor.name}!`);
    }
  }

  emailAgreement(consignor: Consignor): void {
    console.log('Email agreement for:', consignor.name);
  }

  getRelativeTime(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  resendInvitation(invitationId: string): void {
    console.log('Resend invitation:', invitationId);
  }

  cancelInvitation(invitationId: string): void {
    console.log('Cancel invitation:', invitationId);
  }

  isInviteModalVisible(): boolean {
    return this.inviteModalVisible;
  }

  isBulkInviteModalVisible(): boolean {
    return this.bulkInviteModalVisible;
  }

  onConsignorAdded(event: any): void {
    this.onInviteSuccess();
  }

  onBulkInvitesSent(): void {
    this.onBulkInviteSuccess();
  }

  private mapApiStatusToConsignorStatus(apiStatus: string): ConsignorStatus {
    switch (apiStatus?.toLowerCase()) {
      case 'active': return 'active';
      case 'invited': return 'invited';
      case 'inactive': return 'inactive';
      case 'suspended': return 'suspended';
      case 'closed': return 'closed';
      case 'pending': return 'pending';
      default: return 'inactive';
    }
  }

  // Approval methods
  approveConsignor(consignor: Consignor): void {
    if (confirm(`Approve ${consignor.name} as a consignor?`)) {
      const request = {
        action: 'approve' as const,
        message: undefined
      };

      // If consignor has a numeric ID (from pending approvals), use processApproval
      if (!isNaN(Number(consignor.id))) {
        this.ConsignorService.processApproval(Number(consignor.id), request).subscribe({
          next: (response) => {
            this.updateConsignorStatus(consignor, 'active');
            console.log('Consignor approved successfully:', response);
          },
          error: (error) => {
            console.error('Error approving consignor:', error);
            // Fallback to local update if API fails
            this.updateConsignorStatus(consignor, 'active');
          }
        });
      } else {
        // For existing consignors, use status change API
        const statusRequest = {
          newStatus: 'active' as const,
          reason: 'Approved by owner'
        };

        this.ConsignorService.changeConsignorStatus(Number(consignor.id.replace('pending-', '')), statusRequest).subscribe({
          next: (response) => {
            this.updateConsignorStatus(consignor, 'active');
            console.log('Consignor status updated:', response);
          },
          error: (error) => {
            console.error('Error updating consignor status:', error);
            // Fallback to local update if API fails
            this.updateConsignorStatus(consignor, 'active');
          }
        });
      }
    }
  }

  rejectConsignor(consignor: Consignor): void {
    const reason = prompt(`Enter reason for rejecting ${consignor.name}:`);
    if (reason && reason.trim()) {
      const request = {
        action: 'reject' as const,
        message: reason.trim()
      };

      // If consignor has a numeric ID (from pending approvals), use processApproval
      if (!isNaN(Number(consignor.id))) {
        this.ConsignorService.processApproval(Number(consignor.id), request).subscribe({
          next: (response) => {
            this.consignors.update(list => list.filter(c => c.id !== consignor.id));
            this.applyFilters();
            console.log('Consignor rejected successfully:', response);
          },
          error: (error) => {
            console.error('Error rejecting consignor:', error);
            // Fallback to local removal if API fails
            this.consignors.update(list => list.filter(c => c.id !== consignor.id));
            this.applyFilters();
          }
        });
      } else {
        // For existing consignors, use status change API
        const statusRequest = {
          newStatus: 'inactive' as const,
          reason: reason.trim()
        };

        this.ConsignorService.changeConsignorStatus(Number(consignor.id.replace('pending-', '')), statusRequest).subscribe({
          next: (response) => {
            this.consignors.update(list => list.filter(c => c.id !== consignor.id));
            this.applyFilters();
            console.log('Consignor rejected:', response);
          },
          error: (error) => {
            console.error('Error rejecting consignor:', error);
            // Fallback to local removal if API fails
            this.consignors.update(list => list.filter(c => c.id !== consignor.id));
            this.applyFilters();
          }
        });
      }
    }
  }

  private updateConsignorStatus(consignor: Consignor, newStatus: ConsignorStatus): void {
    this.consignors.update(list =>
      list.map(c => c.id === consignor.id ? {...c, status: newStatus, isActive: newStatus === 'active'} : c)
    );
    this.applyFilters();
  }

  isPendingApproval(consignor: Consignor): boolean {
    return consignor.status === 'pending';
  }
}