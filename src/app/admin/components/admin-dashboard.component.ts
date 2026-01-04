import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminService, AdminMetrics, InviteOwnerRequest, OwnerInvitation, NewSignup } from '../../services/admin.service';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, AdminLayoutComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  metrics = signal<AdminMetrics>({
    activeOrganizations: 0,
    newSignups: 0,
    monthlyRevenue: 0
  });

  // Data
  recentSignups = signal<NewSignup[]>([]);

  // Invite Modal State
  showInviteModal = false;
  isInviting = false;
  inviteError = '';
  inviteRequest: InviteOwnerRequest = {
    name: '',
    email: ''
  };

  // Action States (for invite functionality)

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load metrics from API
    this.adminService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
      },
      error: (error) => {
        console.error('Error loading admin metrics:', error);
        // Fall back to mock data for development
        this.metrics.set({
          activeOrganizations: 8,
          newSignups: 3,
          monthlyRevenue: 15420
        });
      }
    });

    // Load recent signups
    this.loadRecentSignups();
  }


  private loadRecentSignups() {
    this.adminService.getRecentSignups().subscribe({
      next: (signups) => {
        this.recentSignups.set(signups);
      },
      error: (error) => {
        console.error('Error loading recent signups:', error);
        // Fall back to mock data for development
        this.recentSignups.set([
          {
            id: '1',
            shopName: 'Main Street Consignment',
            ownerName: 'Sarah Johnson',
            email: 'sarah@mainstreetconsignment.com',
            registeredAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            subdomain: 'mainstreet'
          },
          {
            id: '2',
            shopName: 'Vintage Treasures',
            ownerName: 'Mike Chen',
            email: 'mike@vintagetreasures.com',
            registeredAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            subdomain: 'vintage-treasures'
          },
          {
            id: '3',
            shopName: 'Second Chance Fashion',
            ownerName: 'Emma Rodriguez',
            email: 'emma@secondchancefashion.com',
            registeredAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            subdomain: 'secondchance'
          }
        ]);
      }
    });
  }

  closeInviteModal() {
    this.showInviteModal = false;
    this.inviteError = '';
    this.inviteRequest = { name: '', email: '' };
  }

  inviteOwner() {
    if (!this.inviteRequest.name.trim() || !this.inviteRequest.email.trim()) {
      this.inviteError = 'Please fill in all required fields.';
      return;
    }

    this.isInviting = true;
    this.inviteError = '';

    this.adminService.inviteOwner(this.inviteRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeInviteModal();
          // TODO: Show success toast/notification
          console.log('Invitation sent successfully!');
        } else {
          this.inviteError = response.message || 'Failed to send invitation.';
        }
        this.isInviting = false;
      },
      error: (error) => {
        console.error('Error sending invitation:', error);
        this.inviteError = error.error?.message || 'Failed to send invitation. Please try again.';
        this.isInviting = false;
      }
    });
  }


}