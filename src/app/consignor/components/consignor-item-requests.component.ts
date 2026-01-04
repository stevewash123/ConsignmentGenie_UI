import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ItemRequest, ItemRequestQuery, PagedResult } from '../models/consignor.models';

@Component({
  selector: 'app-consignor-item-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consignor-item-requests.component.html',
  styleUrls: ['./consignor-item-requests.component.scss']
})
export class ConsignorItemRequestsComponent implements OnInit {
  requests: PagedResult<ItemRequest> = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  };

  query: ItemRequestQuery = {
    page: 1,
    pageSize: 10
  };

  isLoading = true;
  error: string | null = null;
  openActionMenu: string | null = null;

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  constructor(private consignorService: ConsignorPortalService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.error = null;

    this.consignorService.getMyItemRequests(this.query).subscribe({
      next: (data) => {
        this.requests = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load item requests. Please try again.';
        this.isLoading = false;
        console.error('Load requests error:', err);
      }
    });
  }

  onFilterChange() {
    this.query.page = 1;
    this.loadRequests();
  }

  clearFilters() {
    this.query = {
      page: 1,
      pageSize: 10
    };
    this.loadRequests();
  }

  goToPage(page: number) {
    this.query.page = page;
    this.loadRequests();
  }

  toggleActionMenu(requestId: string) {
    this.openActionMenu = this.openActionMenu === requestId ? null : requestId;
  }

  closeActionMenu() {
    this.openActionMenu = null;
  }

  withdrawRequest(requestId: string) {
    if (confirm('Are you sure you want to withdraw this request?')) {
      this.consignorService.withdrawItemRequest(requestId).subscribe({
        next: () => {
          this.loadRequests();
          this.closeActionMenu();
        },
        error: (err) => {
          this.error = 'Failed to withdraw request. Please try again.';
          console.error('Withdraw error:', err);
        }
      });
    }
  }

  deleteRequest(requestId: string) {
    if (confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      this.consignorService.deleteItemRequest(requestId).subscribe({
        next: () => {
          this.loadRequests();
          this.closeActionMenu();
        },
        error: (err) => {
          this.error = 'Failed to delete request. Please try again.';
          console.error('Delete error:', err);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'withdrawn': return 'status-withdrawn';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getPrimaryImageUrl(request: ItemRequest): string | null {
    const primaryImage = request.images?.find(img => img.isPrimary);
    return primaryImage?.thumbnailUrl || primaryImage?.imageUrl || null;
  }
}