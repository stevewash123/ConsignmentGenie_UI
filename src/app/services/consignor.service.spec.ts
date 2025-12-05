import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ConsignorService } from './consignor.service';

describe('ConsignorService', () => {
  let service: ConsignorService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete', 'patch']);

    TestBed.configureTestingModule({
      providers: [
        ConsignorService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(ConsignorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all consignors successfully', () => {
    const mockconsignors = [
      {
        id: 1,
        name: 'consignor 1',
        email: 'provider1@test.com',
        isActive: true,
        commissionRate: 50,
        status: 'active' as const,
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockHttpClient.get.and.returnValue(of(mockconsignors));

    service.getConsignors().subscribe(consignors => {
      expect(consignors).toEqual(mockconsignors);
      expect(consignors.length).toBe(1);
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/consignors');
  });

  it('should get consignor by id successfully', () => {
    const mockConsignor = {
      id: 1,
      name: 'consignor 1',
      email: 'provider1@test.com',
      isActive: true,
      commissionRate: 50,
      status: 'active' as const,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.get.and.returnValue(of(mockConsignor));

    service.getConsignor(1).subscribe(consignor => {
      expect(consignor).toEqual(mockConsignor);
      expect(consignor.name).toBe('consignor 1');
    });

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/consignors/1');
  });

  it('should create consignor successfully', () => {
    const createRequest = {
      name: 'New consignor',
      email: 'new@test.com',
      commissionRate: 55
    };
    const mockConsignor = {
      id: 3,
      name: 'New consignor',
      email: 'new@test.com',
      isActive: true,
      commissionRate: 55,
      status: 'active' as const,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.post.and.returnValue(of(mockConsignor));

    service.createConsignor(createRequest).subscribe(consignor => {
      expect(consignor).toEqual(mockConsignor);
      expect(consignor.name).toBe('New consignor');
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/consignors', createRequest);
  });

  it('should activate consignor successfully', () => {
    const mockConsignor = {
      id: 1,
      name: 'consignor 1',
      email: 'provider1@test.com',
      isActive: true,
      commissionRate: 50,
      status: 'active' as const,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockHttpClient.patch.and.returnValue(of(mockConsignor));

    service.activateConsignor(1).subscribe(consignor => {
      expect(consignor).toEqual(mockConsignor);
      expect(consignor.isActive).toBe(true);
    });

    expect(mockHttpClient.patch).toHaveBeenCalledWith('http://localhost:5000/api/consignors/1/activate', {});
  });

  it('should send consignor invitation successfully', () => {
    const invitation = { name: 'New consignor', email: 'new@test.com' };
    const mockResponse = { success: true, message: 'Invitation sent successfully' };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.inviteConsignor(invitation).subscribe(response => {
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
      invitedName: 'Test consignor',
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