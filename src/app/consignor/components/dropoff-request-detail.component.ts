import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { DropoffRequestDetail } from '../models/consignor.models';

@Component({
  selector: 'app-dropoff-request-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropoff-request-detail.component.html',
  styleUrls: ['./dropoff-request-detail.component.scss']
})
export class DropoffRequestDetailComponent implements OnInit {
  request: DropoffRequestDetail | null = null;
  isLoading = true;
  error: string | null = null;
  isCanceling = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consignorService: ConsignorPortalService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequest(id);
    } else {
      this.error = 'Invalid request ID';
      this.isLoading = false;
    }
  }

  loadRequest(id: string) {
    this.isLoading = true;
    this.error = null;

    this.consignorService.getDropoffRequest(id).subscribe({
      next: (request) => {
        this.request = request;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dropoff request:', error);
        this.error = 'Failed to load dropoff request. Please try again.';
        this.isLoading = false;
      }
    });
  }

  cancelRequest() {
    if (!this.request || this.request.status !== 'pending') {
      return;
    }

    if (confirm('Are you sure you want to cancel this dropoff request?')) {
      this.isCanceling = true;

      this.consignorService.cancelDropoffRequest(this.request.id).subscribe({
        next: () => {
          // Reload the request to show updated status
          this.loadRequest(this.request!.id);
          this.isCanceling = false;
        },
        error: (error) => {
          console.error('Error cancelling request:', error);
          alert('Failed to cancel request. Please try again.');
          this.isCanceling = false;
        }
      });
    }
  }

  back() {
    this.router.navigate(['/consignor/dropoff-requests']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge badge-warning';
      case 'received':
        return 'badge badge-info';
      case 'imported':
        return 'badge badge-success';
      case 'cancelled':
        return 'badge badge-error';
      default:
        return 'badge badge-neutral';
    }
  }

  canCancel(): boolean {
    return this.request?.status === 'pending';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}