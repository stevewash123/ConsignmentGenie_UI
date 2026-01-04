import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  ownerEmail: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  verticalType: string;
  userCount: number;
  itemCount: number;
  monthlyRevenue: number;
  createdAt: Date;
  lastActivity: Date;
}

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-list.component.html',
  styleUrls: ['./organization-list.component.scss']
})
export class OrganizationListComponent implements OnInit {
  allOrganizations = signal<Organization[]>([]);
  filteredOrganizations = signal<Organization[]>([]);

  searchTerm = '';
  statusFilter = '';
  tierFilter = '';

  ngOnInit() {
    this.loadOrganizations();
  }

  private loadOrganizations() {
    // Mock data - replace with actual API call
    const mockOrgs: Organization[] = [
      {
        id: '1',
        name: 'Demo Consignment Shop',
        subdomain: 'demo-shop',
        ownerEmail: 'admin@demoshop.com',
        subscriptionTier: 'Pro',
        subscriptionStatus: 'Active',
        verticalType: 'Consignment',
        userCount: 4,
        itemCount: 150,
        monthlyRevenue: 1250,
        createdAt: new Date('2024-01-15'),
        lastActivity: new Date()
      },
      {
        id: '2',
        name: 'Vintage Treasures',
        subdomain: 'vintage-treasures',
        ownerEmail: 'sarah@vintagetreasures.com',
        subscriptionTier: 'Basic',
        subscriptionStatus: 'Active',
        verticalType: 'Consignment',
        userCount: 2,
        itemCount: 89,
        monthlyRevenue: 750,
        createdAt: new Date('2024-02-01'),
        lastActivity: new Date(Date.now() - 86400000)
      },
      {
        id: '3',
        name: 'Artisan Marketplace',
        subdomain: 'artisan-market',
        ownerEmail: 'mike@artisanmarket.com',
        subscriptionTier: 'Enterprise',
        subscriptionStatus: 'Trial',
        verticalType: 'Marketplace',
        userCount: 8,
        itemCount: 300,
        monthlyRevenue: 2800,
        createdAt: new Date('2024-11-01'),
        lastActivity: new Date(Date.now() - 3600000)
      },
      {
        id: '4',
        name: 'Community Thrift Store',
        subdomain: 'community-thrift',
        ownerEmail: 'jane@communitythrift.org',
        subscriptionTier: 'Basic',
        subscriptionStatus: 'Suspended',
        verticalType: 'Thrift',
        userCount: 1,
        itemCount: 45,
        monthlyRevenue: 120,
        createdAt: new Date('2024-03-10'),
        lastActivity: new Date(Date.now() - 86400000 * 7)
      }
    ];

    this.allOrganizations.set(mockOrgs);
    this.filteredOrganizations.set(mockOrgs);
  }

  applyFilters() {
    const search = this.searchTerm.toLowerCase();
    const status = this.statusFilter;
    const tier = this.tierFilter;

    const filtered = this.allOrganizations().filter(org => {
      const matchesSearch = !search ||
        org.name.toLowerCase().includes(search) ||
        org.subdomain.toLowerCase().includes(search) ||
        org.ownerEmail.toLowerCase().includes(search);

      const matchesStatus = !status || org.subscriptionStatus === status;
      const matchesTier = !tier || org.subscriptionTier === tier;

      return matchesSearch && matchesStatus && matchesTier;
    });

    this.filteredOrganizations.set(filtered);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }

  visitStore(subdomain: string) {
    // Open store in new tab
    window.open(`/store/${subdomain}`, '_blank');
  }

  viewDetails(orgId: string) {
    console.log('View details for org:', orgId);
    // Navigate to org details page
  }

  loginAsOwner(orgId: string) {
    console.log('Login as owner for org:', orgId);
    // Implement admin impersonation
  }

  editSubscription(orgId: string) {
    console.log('Edit subscription for org:', orgId);
    // Navigate to subscription management
  }

  suspendOrg(orgId: string) {
    if (confirm('Are you sure you want to suspend this organization?')) {
      console.log('Suspend org:', orgId);
      // Implement org suspension
    }
  }
}