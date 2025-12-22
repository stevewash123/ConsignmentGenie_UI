import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MockConsignorItemService, ItemReturnRequestDto } from '../../consignor/services/mock-consignor-item.service';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-return-requests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './return-requests-list.component.html',
  styles: [`
    .return-requests {
      min-height: 100vh;
      background: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nav-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .badge {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      min-width: 1.25rem;
      text-align: center;
    }

    .badge.no-pending {
      background: #6b7280;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
    }

    .nav-links a:hover,
    .nav-links a.active {
      color: #3b82f6;
      background: #f3f4f6;
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      color: #111827;
      font-size: 0.875rem;
    }

    .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .request-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .request-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .item-thumbnail {
      width: 80px;
      height: 80px;
      border-radius: 0.375rem;
      object-fit: cover;
      background: #f3f4f6;
    }

    .request-info h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .request-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .request-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-ready {
      background: #dcfce7;
      color: #166534;
    }

    .status-completed {
      background: #e0e7ff;
      color: #3730a3;
    }

    .status-declined {
      background: #fef2f2;
      color: #991b1b;
    }

    .request-details {
      margin: 1rem 0;
    }

    .request-details p {
      margin: 0.5rem 0;
      font-size: 0.875rem;
      color: #374151;
    }

    .request-details strong {
      color: #111827;
      font-weight: 600;
    }

    .request-reason {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 0.75rem;
      margin: 0.5rem 0;
    }

    .request-notes {
      font-style: italic;
      color: #6b7280;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .nav-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .content {
        padding: 1rem;
      }

      .request-header {
        flex-direction: column;
      }

      .request-meta {
        flex-direction: column;
        gap: 0.5rem;
      }

      .actions {
        flex-direction: column;
      }

      .btn {
        justify-content: center;
      }
    }
  `]
})
export class ReturnRequestsListComponent implements OnInit {
  requests: ItemReturnRequestDto[] = [];
  filteredRequests: ItemReturnRequestDto[] = [];
  selectedFilter = 'all';
  isLoading = false;
  showReadyModal = false;
  showDeclineModal = false;
  selectedRequest: ItemReturnRequestDto | null = null;

  filterOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'ready', label: 'Ready for Pickup' },
    { value: 'completed', label: 'Completed' },
    { value: 'declined', label: 'Declined' }
  ];

  constructor(
    private mockService: MockConsignorItemService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.mockService.getReturnRequests(this.selectedFilter === 'all' ? undefined : this.selectedFilter as any).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading return requests:', error);
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    this.applyFilter();
  }

  private applyFilter() {
    if (this.selectedFilter === 'all') {
      this.filteredRequests = [...this.requests];
    } else {
      this.filteredRequests = this.requests.filter(req => req.status === this.selectedFilter);
    }
  }

  getPendingCount(): number {
    return this.requests.filter(req => req.status === 'pending').length;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getReasonLabel(reason: string): string {
    switch (reason) {
      case 'no_longer_selling': return 'No longer want to sell';
      case 'need_it_back': return 'Need it back';
      case 'other': return 'Other';
      default: return reason;
    }
  }

  getDaysAgo(date: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  markAsReady(request: ItemReturnRequestDto) {
    const instructions = 'Come to the front counter during store hours (10am-6pm). Ask for your item by name. Bring ID.';

    this.mockService.markReturnRequestReady(request.id, instructions).subscribe({
      next: () => {
        request.status = 'ready';
        request.readyDate = new Date();
        request.pickupInstructions = instructions;
        alert('Consignor has been notified that their item is ready for pickup.');
      },
      error: (error) => {
        console.error('Error marking request as ready:', error);
        alert('Failed to update request. Please try again.');
      }
    });
  }

  markAsComplete(request: ItemReturnRequestDto) {
    if (confirm('Mark this item as picked up? This action cannot be undone.')) {
      this.mockService.markReturnRequestComplete(request.id).subscribe({
        next: () => {
          request.status = 'completed';
          request.completedDate = new Date();
          alert('Return request marked as complete.');
        },
        error: (error) => {
          console.error('Error marking request as complete:', error);
          alert('Failed to update request. Please try again.');
        }
      });
    }
  }

  decline(request: ItemReturnRequestDto) {
    const reason = prompt('Please provide a reason for declining this return request:');
    if (reason) {
      this.mockService.declineReturnRequest(request.id, reason).subscribe({
        next: () => {
          request.status = 'declined';
          request.declinedDate = new Date();
          request.declineReason = reason;
          alert('Return request declined. Consignor has been notified.');
        },
        error: (error) => {
          console.error('Error declining request:', error);
          alert('Failed to decline request. Please try again.');
        }
      });
    }
  }
}