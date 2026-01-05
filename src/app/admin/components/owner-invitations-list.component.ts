import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OwnerInvitationService } from '../../services/owner-invitation.service';
import {
  OwnerInvitationListDto,
  OwnerInvitationQueryParams,
  InvitationStatus,
  OwnerInvitationMetricsDto
} from '../../models/owner-invitation.model';
import { PagedResult } from '../../shared/models/api.models';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-owner-invitations-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-invitations-list.component.html',
  styleUrls: ['./owner-invitations-list.component.scss']
})
export class OwnerInvitationsListComponent implements OnInit {
  invitations = signal<OwnerInvitationListDto[]>([]);
  metrics = signal<OwnerInvitationMetricsDto | null>(null);
  errorMessage = signal('');
  processingInvitations = signal(new Set<string>());

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(0);
  totalCount = signal(0);

  // Filters
  searchTerm = '';
  statusFilter = '';
  private searchTimeout?: number;

  constructor(private ownerInvitationService: OwnerInvitationService, private loadingService: LoadingService) {}

  isComponentLoading(): boolean {
    return this.loadingService.isLoading('owner-invitations-list');
  }

  ngOnInit() {
    this.loadInvitations();
    this.loadMetrics();
  }

  loadInvitations() {
    this.loadingService.start('owner-invitations-list');
    this.errorMessage.set('');

    const queryParams: OwnerInvitationQueryParams = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchTerm || undefined,
      status: this.statusFilter || undefined,
      sortBy: 'CreatedAt',
      sortDirection: 'desc'
    };

    this.ownerInvitationService.getInvitations(queryParams).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.invitations.set(response.data.items || []);
          this.totalCount.set(response.data.totalCount);
          this.totalPages.set(response.data.totalPages);
        } else {
          this.errorMessage.set('Failed to load invitations');
        }
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to load invitations');
      },
      complete: () => {
        this.loadingService.stop('owner-invitations-list');
      }
    });
  }

  loadMetrics() {
    this.ownerInvitationService.getMetrics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.metrics.set(response.data);
        }
      },
      error: (error) => {
        console.error('Failed to load metrics:', error);
      }
    });
  }

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadInvitations();
    }, 300);
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadInvitations();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage.set(1);
    this.loadInvitations();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadInvitations();
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  resendInvitation(invitationId: string, ownerName: string) {
    if (confirm(`Resend invitation to ${ownerName}?`)) {
      this.processingInvitations.update(set => new Set(set).add(invitationId));

      this.ownerInvitationService.resendInvitation(invitationId).subscribe({
        next: (response) => {
          this.processingInvitations.update(set => {
            const newSet = new Set(set);
            newSet.delete(invitationId);
            return newSet;
          });

          if (response.success) {
            this.loadInvitations();
          }
        },
        error: (error) => {
          this.processingInvitations.update(set => {
            const newSet = new Set(set);
            newSet.delete(invitationId);
            return newSet;
          });
          alert(`Failed to resend invitation: ${error.error?.message || 'Unknown error'}`);
        }
      });
    }
  }

  cancelInvitation(invitationId: string, ownerName: string) {
    if (confirm(`Cancel invitation for ${ownerName}? This action cannot be undone.`)) {
      this.processingInvitations.update(set => new Set(set).add(invitationId));

      this.ownerInvitationService.cancelInvitation(invitationId).subscribe({
        next: (response) => {
          this.processingInvitations.update(set => {
            const newSet = new Set(set);
            newSet.delete(invitationId);
            return newSet;
          });

          if (response.success) {
            this.loadInvitations();
            this.loadMetrics();
          }
        },
        error: (error) => {
          this.processingInvitations.update(set => {
            const newSet = new Set(set);
            newSet.delete(invitationId);
            return newSet;
          });
          alert(`Failed to cancel invitation: ${error.error?.message || 'Unknown error'}`);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}