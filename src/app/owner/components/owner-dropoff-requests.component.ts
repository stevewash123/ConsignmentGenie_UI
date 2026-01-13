import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OwnerService } from '../../services/owner.service';

interface OwnerDropoffRequestList {
  id: string;
  itemCount: number;
  suggestedTotal: number;
  plannedDate?: string;
  plannedTimeSlot?: string;
  status: string;
  createdAt: string;
  importedAt?: string;
  consignor: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

@Component({
  selector: 'app-owner-dropoff-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './owner-dropoff-requests.component.html',
  styleUrls: ['./owner-dropoff-requests.component.scss']
})
export class OwnerDropoffRequestsComponent implements OnInit {
  requests: OwnerDropoffRequestList[] = [];
  filteredRequests: OwnerDropoffRequestList[] = [];
  isLoading = true;
  error: string | null = null;
  statusFilter = '';

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'received', label: 'Received' },
    { value: 'imported', label: 'Imported' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(private ownerService: OwnerService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.error = null;

    this.ownerService.getDropoffRequests(this.statusFilter || undefined).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.filterRequests();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dropoff requests:', error);
        this.error = 'Failed to load dropoff requests';
        this.isLoading = false;
      }
    });
  }

  filterRequests() {
    this.filteredRequests = this.requests.filter(request => {
      if (this.statusFilter && request.status !== this.statusFilter) {
        return false;
      }
      return true;
    });
  }

  onStatusFilterChange() {
    this.loadRequests();
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}