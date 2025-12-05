import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ProviderService } from './provider.service';

describe('ProviderService', () => {
  let service: ProviderService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete', 'patch']);

    TestBed.configureTestingModule({
      providers: [
        ProviderService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(ProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all providers successfully', () => {
    const mockProviders = [
      {
        id: 1,
        name: 'Provider 1',
        email: 'provider1@test.com',
        isActive: true,
        commissionRate: 50,
        status: 'active' as const,
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockHttpClient.get.and.returnValue(of(mockProviders));

    service.getProviders().subscribe(providers => {
      expect(providers).toEqual(mockProviders);
      expect(providers.length).toBe(1);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/consignors');
  });

  it('should get provider by id successfully', () => {
    const mockProvider = {
      id: 1,
      name: 'Provider 1',
      email: 'provider1@test.com',
      isActive: true,
      commissionRate: 50,
      status: 'active' as const,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.get.and.returnValue(of(mockProvider));

    service.getProvider(1).subscribe(provider => {
      expect(provider).toEqual(mockProvider);
      expect(provider.name).toBe('Provider 1');
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/consignors/1');
  });

  it('should create provider successfully', () => {
    const createRequest = {
      name: 'New Provider',
      email: 'new@test.com',
      commissionRate: 55
    };
    const mockProvider = {
      id: 3,
      name: 'New Provider',
      email: 'new@test.com',
      isActive: true,
      commissionRate: 55,
      status: 'active' as const,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.post.and.returnValue(of(mockProvider));

    service.createProvider(createRequest).subscribe(provider => {
      expect(provider).toEqual(mockProvider);
      expect(provider.name).toBe('New Provider');
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/consignors', createRequest);
  });

  it('should activate provider successfully', () => {
    const mockProvider = {
      id: 1,
      name: 'Provider 1',
      email: 'provider1@test.com',
      isActive: true,
      commissionRate: 50,
      status: 'active' as const,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.patch.and.returnValue(of(mockProvider));

    service.activateProvider(1).subscribe(provider => {
      expect(provider).toEqual(mockProvider);
      expect(provider.isActive).toBe(true);
    });

    expect(mockHttpClient.patch).toHaveBeenCalledWith('http://localhost:5000/api/consignors/1/activate', {});
  });

  it('should send provider invitation successfully', () => {
    const invitation = { name: 'New Provider', email: 'new@test.com' };
    const mockResponse = { success: true, message: 'Invitation sent successfully' };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.inviteProvider(invitation).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.message).toBe('Invitation sent successfully');
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/consignors/invitations', invitation);
  });

  it('should validate invitation successfully', () => {
    const token = 'valid-token';
    const mockResponse = {
      isValid: true,
      shopName: 'Test Shop',
      invitedName: 'Test Provider',
      invitedEmail: 'test@test.com'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.validateInvitation(token).subscribe(response => {
      expect(response.isValid).toBe(true);
      expect(response.shopName).toBe('Test Shop');
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/invitations/validate/valid-token');
  });
});