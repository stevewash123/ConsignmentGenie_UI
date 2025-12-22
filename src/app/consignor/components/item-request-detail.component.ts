import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProviderPortalService } from '../services/consignor-portal.service';
import { ItemRequest } from '../models/consignor.models';

@Component({
  selector: 'app-item-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-request-detail.component.html',
  styles: [`
    .detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 2rem;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .status-pending { background: #fef3c7; color: #d97706; }
    .status-approved { background: #d1fae5; color: #059669; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
    .status-withdrawn { background: #f3f4f6; color: #6b7280; }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: none;
      font-weight: 500;
      cursor: pointer;
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

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .detail-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 2rem;
    }

    .main-content {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .section {
      padding: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .section:last-child {
      border-bottom: none;
    }

    .section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .detail-value {
      color: #111827;
      font-weight: 500;
    }

    .detail-value.price {
      font-size: 1.125rem;
      color: #059669;
    }

    .detail-value.empty {
      color: #9ca3af;
      font-style: italic;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sidebar-section {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
    }

    .sidebar-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem;
    }

    .image-gallery {
      display: grid;
      gap: 1rem;
    }

    .primary-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 0.375rem;
    }

    .thumbnail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: 0.5rem;
    }

    .thumbnail {
      width: 100%;
      height: 60px;
      object-fit: cover;
      border-radius: 0.25rem;
      cursor: pointer;
      border: 2px solid transparent;
    }

    .thumbnail.active {
      border-color: #3b82f6;
    }

    .no-images {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #9ca3af;
      background: #f9fafb;
      border-radius: 0.375rem;
    }

    .rejection-notice {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      padding: 1rem;
    }

    .rejection-title {
      color: #dc2626;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .rejection-reason {
      color: #991b1b;
    }

    .approval-notice {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 0.375rem;
      padding: 1rem;
    }

    .approval-title {
      color: #059669;
      font-weight: 600;
      margin-bottom: 0.5rem;
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
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .detail-container {
        padding: 1rem;
      }

      .detail-header {
        flex-direction: column;
        gap: 1rem;
      }

      .detail-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-wrap: wrap;
        justify-content: stretch;
      }

      .btn {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class ItemRequestDetailComponent implements OnInit {
  request: ItemRequest | null = null;
  isLoading = true;
  error: string | null = null;
  selectedImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consignorService: ProviderPortalService
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