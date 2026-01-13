import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { DropoffRequestList, DropoffRequestQuery } from '../models/consignor.models';

@Component({
  selector: 'app-dropoff-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dropoff-requests.component.html',
  styleUrls: ['./dropoff-requests.component.scss']
})
export class DropoffRequestsComponent implements OnInit {
  requests: DropoffRequestList[] = [];
  query: DropoffRequestQuery = {};

  isLoading = true;
  error: string | null = null;
  openActionMenu: string | null = null;

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'received', label: 'Received' },
    { value: 'imported', label: 'Imported' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(private consignorService: ConsignorPortalService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.error = null;

    this.consignorService.getMyDropoffRequests(this.query).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dropoff requests:', error);
        this.error = 'Failed to load dropoff requests. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onStatusChange() {
    this.query = { ...this.query, status: this.query.status || undefined };
    this.loadRequests();
  }

  toggleActionMenu(requestId: string) {
    this.openActionMenu = this.openActionMenu === requestId ? null : requestId;
  }

  cancelRequest(request: DropoffRequestList) {
    if (request.status !== 'pending') {
      return;
    }

    if (confirm('Are you sure you want to cancel this dropoff request?')) {
      this.consignorService.cancelDropoffRequest(request.id).subscribe({
        next: () => {
          this.loadRequests(); // Reload the list
          this.openActionMenu = null;
        },
        error: (error) => {
          console.error('Error cancelling request:', error);
          alert('Failed to cancel request. Please try again.');
        }
      });
    }
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

  canCancel(status: string): boolean {
    return status === 'pending';
  }
}