import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, FormsModule, InviteConsignorModalComponent, BulkInviteConsignorModalComponent, OwnerLayoutComponent],
  templateUrl: './consignor-list.component.html',
  styleUrls: ['./consignor-list.component.scss']
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