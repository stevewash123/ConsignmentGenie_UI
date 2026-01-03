import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MockConsignorItemService, ItemReturnRequestDto } from '../../consignor/services/mock-consignor-item.service';
import { LoadingService } from '../../shared/services/loading.service';
import { OwnerLayoutComponent } from './owner-layout.component';

@Component({
  selector: 'app-return-requests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OwnerLayoutComponent],
  templateUrl: './return-requests-list.component.html',
  styleUrls: ['./return-requests-list.component.css']
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