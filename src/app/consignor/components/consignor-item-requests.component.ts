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
  styles: [`
    .item-requests-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .submit-button {
      background: #059669;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .submit-button:hover {
      background: #047857;
    }

    .filters {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .filter-row {
      display: grid;
      grid-template-columns: 1fr 200px 200px auto;
      gap: 1rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
    }

    .filter-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .filter-control {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .filter-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .clear-filters {
      background: #f3f4f6;
      color: #374151;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      height: 38px;
    }

    .clear-filters:hover {
      background: #e5e7eb;
    }

    .requests-grid {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .request-card {
      display: grid;
      grid-template-columns: 100px 1fr 120px 120px 120px auto;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      align-items: center;
    }

    .request-card:last-child {
      border-bottom: none;
    }

    .request-card:hover {
      background: #f9fafb;
    }

    .request-image {
      width: 80px;
      height: 80px;
      border-radius: 0.375rem;
      object-fit: cover;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .request-details {
      min-width: 0;
    }

    .request-name {
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .request-info {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0.25rem 0;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
    }

    .status-pending {
      background: #fef3c7;
      color: #d97706;
    }

    .status-approved {
      background: #d1fae5;
      color: #059669;
    }

    .status-rejected {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-withdrawn {
      background: #f3f4f6;
      color: #6b7280;
    }

    .price-display {
      text-align: right;
      font-weight: 600;
      color: #111827;
    }

    .date-display {
      text-align: center;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .actions-menu {
      position: relative;
    }

    .actions-button {
      background: none;
      border: none;
      padding: 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
      color: #6b7280;
    }

    .actions-button:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .actions-dropdown {
      position: absolute;
      right: 0;
      top: 100%;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 10;
      min-width: 150px;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      text-align: left;
      border: none;
      background: none;
      color: #374151;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
    }

    .dropdown-item.danger {
      color: #dc2626;
    }

    .dropdown-item.danger:hover {
      background: #fee2e2;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .empty-message {
      color: #6b7280;
      margin-bottom: 2rem;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .pagination-button {
      background: white;
      border: 1px solid #d1d5db;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .pagination-button:hover:not(:disabled) {
      background: #f9fafb;
    }

    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .loading {
      text-align: center;
      padding: 2rem;
    }

    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      padding: 1rem;
      margin-bottom: 1rem;
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .item-requests-container {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .filter-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .request-card {
        grid-template-columns: 1fr;
        gap: 1rem;
        text-align: left;
      }

      .request-image {
        width: 60px;
        height: 60px;
        margin: 0 auto;
      }

      .price-display,
      .date-display {
        text-align: left;
      }
    }
  `]
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