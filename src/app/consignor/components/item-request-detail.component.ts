import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ItemRequest } from '../models/consignor.models';

@Component({
  selector: 'app-item-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-request-detail.component.html',
})
export class ItemRequestDetailComponent implements OnInit {
  request: ItemRequest | null = null;
  isLoading = true;
  error: string | null = null;
  selectedImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consignorService: ConsignorPortalService
  ) {}

  ngOnInit() {
    const requestId = this.route.snapshot.paramMap.get('id');
    if (requestId) {
      this.loadRequest(requestId);
    }
  }

  loadRequest(id: string) {
    this.isLoading = true;
    this.error = null;

    this.consignorService.getItemRequest(id).subscribe({
      next: (data) => {
        this.request = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load item request details. Please try again.';
        this.isLoading = false;
        console.error('Load request error:', err);
      }
    });
  }

  withdrawRequest() {
    if (!this.request || !confirm('Are you sure you want to withdraw this request?')) {
      return;
    }

    this.consignorService.withdrawItemRequest(this.request.id).subscribe({
      next: () => {
        this.router.navigate(['/consignor/item-requests']);
      },
      error: (err) => {
        this.error = 'Failed to withdraw request. Please try again.';
        console.error('Withdraw error:', err);
      }
    });
  }

  deleteRequest() {
    if (!this.request || !confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return;
    }

    this.consignorService.deleteItemRequest(this.request.id).subscribe({
      next: () => {
        this.router.navigate(['/consignor/item-requests']);
      },
      error: (err) => {
        this.error = 'Failed to delete request. Please try again.';
        console.error('Delete error:', err);
      }
    });
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSelectedImage(): string | null {
    if (!this.request?.images?.length) return null;
    return this.request.images[this.selectedImageIndex]?.imageUrl || null;
  }
}