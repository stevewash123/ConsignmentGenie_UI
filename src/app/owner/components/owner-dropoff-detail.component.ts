import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OwnerService } from '../../services/owner.service';

interface OwnerDropoffRequestDetail {
  id: string;
  items: Array<{
    name: string;
    category?: string;
    brand?: string;
    suggestedPrice: number;
    notes?: string;
  }>;
  itemCount: number;
  suggestedTotal: number;
  plannedDate?: string;
  plannedTimeSlot?: string;
  message?: string;
  status: string;
  createdAt: string;
  importedAt?: string;
  receivedAt?: string;
  ownerNotes?: string;
  shop: {
    name: string;
    address?: string;
    phone?: string;
  };
  consignor: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

@Component({
  selector: 'app-owner-dropoff-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-dropoff-detail.component.html',
  styleUrls: ['./owner-dropoff-detail.component.scss']
})
export class OwnerDropoffDetailComponent implements OnInit {
  request: OwnerDropoffRequestDetail | null = null;
  isLoading = true;
  error: string | null = null;
  isUpdating = false;
  ownerNotes = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ownerService: OwnerService
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

    this.ownerService.getDropoffRequestDetail(id).subscribe({
      next: (request) => {
        this.request = request;
        this.ownerNotes = request.ownerNotes || '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dropoff request:', error);
        this.error = 'Failed to load dropoff request details';
        this.isLoading = false;
      }
    });
  }

  markAsReceived() {
    if (!this.request) return;

    this.isUpdating = true;
    this.ownerService.markDropoffAsReceived(this.request.id, {
      status: 'received',
      ownerNotes: this.ownerNotes
    }).subscribe({
      next: () => {
        this.loadRequest(this.request!.id);
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error marking as received:', error);
        alert('Failed to mark as received. Please try again.');
        this.isUpdating = false;
      }
    });
  }

  importToInventory() {
    if (!this.request) return;

    if (confirm('This will import all items to your inventory. Continue?')) {
      this.isUpdating = true;
      this.ownerService.importDropoffToInventory(this.request.id, {
        ownerNotes: this.ownerNotes
      }).subscribe({
        next: () => {
          this.loadRequest(this.request!.id);
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Error importing to inventory:', error);
          alert('Failed to import to inventory. Please try again.');
          this.isUpdating = false;
        }
      });
    }
  }

  back() {
    this.router.navigate(['/owner/dropoff-requests']);
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

  canMarkAsReceived(): boolean {
    return this.request?.status === 'pending';
  }

  canImportToInventory(): boolean {
    return this.request?.status === 'received';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}