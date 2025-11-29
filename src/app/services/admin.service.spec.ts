import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService, AdminMetrics, OwnerInvitation, InviteOwnerRequest, NewSignup } from './admin.service';
import { environment } from '../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService]
    });
    service = TestBed.inject(AdminService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMetrics', () => {
    it('should return admin metrics', () => {
      const mockMetrics: AdminMetrics = {
        activeOrganizations: 5,
        newSignups: 2,
        monthlyRevenue: 15420
      };

      const mockApiResponse = {
        success: true,
        data: mockMetrics,
        message: 'Metrics retrieved successfully'
      };

      service.getMetrics().subscribe(metrics => {
        expect(metrics).toEqual(mockMetrics);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/metrics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should handle error when getting metrics', () => {
      service.getMetrics().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/metrics`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getOwnerInvitations', () => {
    it('should return owner invitations', () => {
      const mockInvitations: OwnerInvitation[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          sentAt: '2023-11-25T10:00:00Z',
          expiresAt: '2023-12-25T10:00:00Z',
          status: 'pending'
        }
      ];

      service.getOwnerInvitations().subscribe(invitations => {
        expect(invitations).toEqual(mockInvitations);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/invitations/owner`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInvitations);
    });
  });

  describe('inviteOwner', () => {
    it('should send owner invitation', () => {
      const inviteRequest: InviteOwnerRequest = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const mockResponse = { success: true, message: 'Invitation sent successfully' };

      service.inviteOwner(inviteRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/invitations/owner`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(inviteRequest);
      req.flush(mockResponse);
    });

    it('should handle invitation failure', () => {
      const inviteRequest: InviteOwnerRequest = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const mockResponse = { success: false, message: 'Email already exists' };

      service.inviteOwner(inviteRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/invitations/owner`);
      req.flush(mockResponse);
    });
  });

  describe('resendOwnerInvitation', () => {
    it('should resend owner invitation', () => {
      const invitationId = '123';
      const mockResponse = { success: true, message: 'Invitation resent successfully' };

      service.resendOwnerInvitation(invitationId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/invitations/owner/${invitationId}/resend`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('cancelOwnerInvitation', () => {
    it('should cancel owner invitation', () => {
      const invitationId = '123';
      const mockResponse = { success: true, message: 'Invitation cancelled successfully' };

      service.cancelOwnerInvitation(invitationId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/invitations/owner/${invitationId}/cancel`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('getRecentSignups', () => {
    it('should return recent signups', () => {
      const mockSignups: NewSignup[] = [
        {
          id: '1',
          shopName: 'Test Shop', // Mapped from API name
          ownerName: 'Test Shop', // Also mapped from API name
          email: 'owner@testshop.com',
          registeredAt: '2023-11-25T10:00:00Z',
          subdomain: 'testshop'
        }
      ];

      // API returns raw organization data that gets transformed
      const mockApiData = [
        {
          id: '1',
          name: 'Test Shop', // API returns name, gets mapped to both shopName and ownerName
          email: 'owner@testshop.com',
          createdAt: '2023-11-25T10:00:00Z',
          subdomain: 'testshop'
        }
      ];

      const mockApiResponse = {
        success: true,
        data: mockApiData,
        message: 'Recent signups retrieved successfully'
      };

      service.getRecentSignups().subscribe(signups => {
        expect(signups).toEqual(mockSignups);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/api/admin/recent-signups`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });
  });

});