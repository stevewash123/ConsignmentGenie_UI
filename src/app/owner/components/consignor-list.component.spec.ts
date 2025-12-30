import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ConsignorListComponent } from './consignor-list.component';
import { ConsignorService, PendingInvitation } from '../../services/consignor.service';
import { LoadingService } from '../../shared/services/loading.service';
import { Consignor } from '../../models/consignor.model';
import { AgreementService } from '../../services/agreement.service';

describe('ConsignorListComponent', () => {
  let component: ConsignorListComponent;
  let fixture: ComponentFixture<ConsignorListComponent>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockAgreementService: jasmine.SpyObj<AgreementService>;

  const mockConsignors: Consignor[] = [
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
      consignorNumber: 'C001',
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
    const consignorServiceSpy = jasmine.createSpyObj('ConsignorService', [
      'getConsignors',
      'getPendingInvitations',
      'resendInvitation',
      'cancelInvitation'
    ]);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [
      'start',
      'stop',
      'isLoading'
    ]);
    const agreementServiceSpy = jasmine.createSpyObj('AgreementService', ['getAgreements']);

    await TestBed.configureTestingModule({
      imports: [ConsignorListComponent],
      providers: [
        { provide: ConsignorService, useValue: consignorServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: AgreementService, useValue: agreementServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorListComponent);
    component = fixture.componentInstance;
    mockConsignorService = TestBed.inject(ConsignorService) as jasmine.SpyObj<ConsignorService>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
    mockAgreementService = TestBed.inject(AgreementService) as jasmine.SpyObj<AgreementService>;

    // Setup default returns
    mockConsignorService.getConsignors.and.returnValue(of(mockConsignors));
    mockConsignorService.getPendingInvitations.and.returnValue(of(mockInvitations));
    mockLoadingService.isLoading.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    component.ngOnInit();

    expect(mockConsignorService.getConsignors).toHaveBeenCalled();
    expect(mockConsignorService.getPendingInvitations).toHaveBeenCalled();
  });

  it('should have initial state', () => {
    expect(component.consignors()).toEqual([]);
    expect(component.pendingInvitations()).toEqual([]);
    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('all');
    expect(component.sortBy).toBe('name');
    expect(component.sortDirection).toBe('asc');
  });

  it('should handle consignor loading error gracefully', () => {
    mockConsignorService.getConsignors.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.loadconsignors();

    expect(console.error).toHaveBeenCalledWith('Error loading consignors:', jasmine.any(Error));
    expect(component.consignors()).toEqual([]);
  });

  it('should handle invitations loading error gracefully', () => {
    mockConsignorService.getPendingInvitations.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith('Error loading pending invitations:', jasmine.any(Error));
    expect(component.pendingInvitations()).toEqual([]);
  });

  it('should resend invitation successfully', () => {
    const mockResponse = { success: true, message: 'Invitation resent' };
    mockConsignorService.resendInvitation.and.returnValue(of(mockResponse));
    spyOn(component, 'loadPendingInvitations');

    component.resendInvitation(1);

    expect(mockConsignorService.resendInvitation).toHaveBeenCalledWith(1);
    expect(component.loadPendingInvitations).toHaveBeenCalled();
  });

  it('should manage loading state correctly', () => {
    mockLoadingService.isLoading.and.returnValue(true);
    expect(component.isconsignorsLoading()).toBe(true);

    mockLoadingService.isLoading.and.returnValue(false);
    expect(component.isconsignorsLoading()).toBe(false);
  });

  it('should manage modal visibility state', () => {
    expect(component.isInviteModalVisible()).toBe(false);

    component.showInviteModal();
    expect(component.isInviteModalVisible()).toBe(true);

    component.hideInviteModal();
    expect(component.isInviteModalVisible()).toBe(false);
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

  it('should track consignors by id correctly', () => {
    const consignor = mockConsignors[0];
    const trackingId = component.trackByProvider(0, consignor);

    expect(trackingId).toBe(consignor.id);
  });

  it('should refresh data when consignor added', () => {
    spyOn(component, 'loadData');
    const mockProvider = mockConsignors[0];

    component.onConsignorAdded(mockProvider);

    expect(component.loadData).toHaveBeenCalled();
  });


});