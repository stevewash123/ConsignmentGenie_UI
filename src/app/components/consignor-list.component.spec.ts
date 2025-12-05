import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { ProviderListComponent } from './consignor-list.component';
import { ConsignorService, PendingInvitation } from '../services/consignor.service';
import { LoadingService } from '../shared/services/loading.service';
import { consignor } from '../models/consignor.model';
import { ENTITY_LABELS } from '../shared/constants/labels';

describe('ProviderListComponent', () => {
  let component: ProviderListComponent;
  let fixture: ComponentFixture<ProviderListComponent>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockconsignors: consignor[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      commissionRate: 60,
      preferredPaymentMethod: 'Check',
      paymentDetails: '',
      notes: '',
      isActive: true,
      status: 'active',
      organizationId: 1,
      providerNumber: 'P001',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ];

  const mockInvitations: PendingInvitation[] = [
    {
      id: 1,
      email: 'jane@example.com',
      name: 'Jane Smith',
      sentAt: '2023-12-01T10:00:00Z',
      expiresAt: '2023-12-08T10:00:00Z',
      status: 'pending'
    }
  ];

  beforeEach(async () => {
    const ConsignorServiceSpy = jasmine.createSpyObj('ConsignorService', [
      'getconsignors',
      'getPendingInvitations',
      'resendInvitation',
      'cancelInvitation'
    ]);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [
      'start',
      'stop',
      'isLoading'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProviderListComponent],
      providers: [
        { provide: ConsignorService, useValue: ConsignorServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderListComponent);
    component = fixture.componentInstance;
    mockConsignorService = TestBed.inject(ConsignorService) as jasmine.SpyObj<ConsignorService>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default returns
    mockConsignorService.getconsignors.and.returnValue(of(mockconsignors));
    mockConsignorService.getPendingInvitations.and.returnValue(of(mockInvitations));
    mockLoadingService.isLoading.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    component.ngOnInit();

    expect(mockLoadingService.start).toHaveBeenCalledWith('consignors-list');
    expect(mockConsignorService.getconsignors).toHaveBeenCalled();
    expect(mockConsignorService.getPendingInvitations).toHaveBeenCalled();
  });

  it('should set consignors and invitations data', () => {
    component.ngOnInit();

    // Check that consignors data is set (transformed from API)
    const consignors = component.consignors();
    expect(consignors.length).toBe(1);
    expect(consignors[0].name).toBe('John Doe');
    expect(consignors[0].email).toBe('john@example.com');

    expect(component.pendingInvitations()).toEqual(mockInvitations);
    expect(mockLoadingService.stop).toHaveBeenCalledWith('consignors-list');
  });

  it('should handle consignor loading error gracefully', () => {
    mockConsignorService.getconsignors.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith('Error loading consignors:', jasmine.any(Error));
    // Loading is stopped in the complete handler of both the consignors and invitations calls
    expect(mockLoadingService.stop).toHaveBeenCalledWith('consignors-list');
  });

  it('should handle invitations loading error gracefully', () => {
    mockConsignorService.getPendingInvitations.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith('Error loading pending invitations:', jasmine.any(Error));
    expect(component.pendingInvitations()).toEqual([]);
  });

  it('should show invite modal if no consignors and no invitations exist', () => {
    mockConsignorService.getconsignors.and.returnValue(of([]));
    mockConsignorService.getPendingInvitations.and.returnValue(of([]));
    spyOn(component, 'showInviteModal');

    component.ngOnInit();

    // The modal will be shown by whichever call completes last and sees both arrays are empty
    expect(component.showInviteModal).toHaveBeenCalled();
  });

  it('should not show invite modal if consignors exist', () => {
    mockConsignorService.getPendingInvitations.and.returnValue(of([]));
    spyOn(component, 'showInviteModal');

    component.ngOnInit();

    expect(component.showInviteModal).not.toHaveBeenCalled();
  });

  it('should not show invite modal if invitations exist', () => {
    mockConsignorService.getconsignors.and.returnValue(of([]));
    spyOn(component, 'showInviteModal');

    component.ngOnInit();

    // The modal should not be shown because invitations exist in mockInvitations
    expect(component.showInviteModal).not.toHaveBeenCalled();
  });

  describe('Invitation Management', () => {
    it('should resend invitation successfully', () => {
      const mockResponse = { success: true, message: 'Invitation resent' };
      mockConsignorService.resendInvitation.and.returnValue(of(mockResponse));
      spyOn(component, 'loadPendingInvitations');

      component.resendInvitation(1);

      expect(mockConsignorService.resendInvitation).toHaveBeenCalledWith(1);
      expect(component.loadPendingInvitations).toHaveBeenCalled();
    });

    it('should handle resend invitation failure', () => {
      const mockResponse = { success: false, message: 'Failed to resend' };
      mockConsignorService.resendInvitation.and.returnValue(of(mockResponse));
      spyOn(console, 'error');

      component.resendInvitation(1);

      expect(console.error).toHaveBeenCalledWith('Failed to resend invitation:', 'Failed to resend');
    });

    it('should cancel invitation with confirmation', () => {
      const mockResponse = { success: true, message: 'Invitation cancelled' };
      mockConsignorService.cancelInvitation.and.returnValue(of(mockResponse));
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component, 'loadPendingInvitations');

      component.cancelInvitation(1);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel this invitation?');
      expect(mockConsignorService.cancelInvitation).toHaveBeenCalledWith(1);
      expect(component.loadPendingInvitations).toHaveBeenCalled();
    });

    it('should not cancel invitation without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.cancelInvitation(1);

      expect(mockConsignorService.cancelInvitation).not.toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should return consignor item count', () => {
      const consignor = mockconsignors[0];
      const itemCount = component.getProviderItemCount(consignor);

      // Currently returns 0 as per TODO comment
      expect(itemCount).toBe(0);
    });

    it('should format relative time correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

      expect(component.getRelativeTime(oneHourAgo.toISOString())).toBe('1 hour ago');
      expect(component.getRelativeTime(twoDaysAgo.toISOString())).toBe('2 days ago');
    });

    it('should track consignors by id', () => {
      const consignor = mockconsignors[0];
      const trackingId = component.trackByProvider(0, consignor);

      expect(trackingId).toBe(consignor.id);
    });
  });

  describe('Modal Management', () => {
    it('should show invite modal', () => {
      component.showInviteModal();
      expect(component.isInviteModalVisible()).toBe(true);
    });

    it('should hide invite modal', () => {
      component.hideInviteModal();
      expect(component.isInviteModalVisible()).toBe(false);
    });

    it('should refresh data when consignor added', () => {
      spyOn(component, 'loadData');
      const mockProvider = mockconsignors[0];

      component.onConsignorAdded(mockProvider);

      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should return loading state from service', () => {
      mockLoadingService.isLoading.and.returnValue(true);

      expect(component.isconsignorsLoading()).toBe(true);
      expect(mockLoadingService.isLoading).toHaveBeenCalledWith('consignors-list');
    });
  });

  describe('Labels', () => {
    it('should have access to entity labels', () => {
      expect(component.labels).toBe(ENTITY_LABELS);
    });
  });
});