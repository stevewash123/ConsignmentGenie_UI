import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { OwnerInvitationService } from './owner-invitation.service';

describe('OwnerInvitationService', () => {
  let service: OwnerInvitationService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        OwnerInvitationService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(OwnerInvitationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create invitation successfully', () => {
    const createRequest = {
      email: 'owner@test.com',
      name: 'Test Owner'
    };
    const mockResponse = {
      success: true,
      data: {
        id: 'invitation-1',
        email: 'owner@test.com',
        name: 'Test Owner',
        token: 'abc123',
        status: 'Pending',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-02-01T00:00:00Z'
      },
      message: 'Invitation created successfully'
    };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.createInvitation(createRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data?.email).toBe('owner@test.com');
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/admin/invitations/owner', createRequest);
  });

  it('should get invitations successfully', () => {
    const mockResponse = {
      success: true,
      data: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        organizationId: 'org-1'
      },
      message: 'Invitations retrieved successfully'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    const queryParams = {
      page: 1,
      pageSize: 10,
      search: '',
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    service.getInvitations(queryParams).subscribe(response => {
      expect(response.success).toBe(true);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/admin/invitations/owner', { params: jasmine.any(Object) });
  });

  it('should validate token successfully', () => {
    const mockResponse = {
      success: true,
      data: {
        isValid: true,
        email: 'owner@test.com',
        name: 'Test Owner',
        expiresAt: '2024-02-01T00:00:00Z'
      },
      message: 'Token validated successfully'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.validateToken('valid-token').subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data?.isValid).toBe(true);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/owner-registration/validate', { params: jasmine.any(Object) });
  });

  it('should register owner successfully', () => {
    const registrationRequest = {
      token: 'valid-token',
      name: 'Test Owner',
      email: 'owner@test.com',
      password: 'securePassword123',
      shopName: 'My Shop',
      subdomain: 'myshop'
    };
    const mockResponse = {
      success: true,
      data: {
        success: true,
        organizationId: 'org-123',
        userId: 'user-123'
      },
      message: 'Owner registered successfully'
    };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.registerOwner(registrationRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data?.organizationId).toBe('org-123');
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/owner-registration/register', registrationRequest);
  });
});