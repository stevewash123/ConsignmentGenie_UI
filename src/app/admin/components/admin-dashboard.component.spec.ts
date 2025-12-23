import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminService, AdminMetrics, OwnerInvitation, NewSignup } from '../../services/admin.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let adminServiceMock: jasmine.SpyObj<AdminService>;

  const mockMetrics: AdminMetrics = {
    activeOrganizations: 5,
    newSignups: 2,
    monthlyRevenue: 15420
  };


  const mockRecentSignups: NewSignup[] = [
    {
      id: '1',
      shopName: 'Test Shop',
      ownerName: 'John Owner',
      email: 'owner@testshop.com',
      registeredAt: '2023-11-25T10:00:00Z',
      subdomain: 'testshop'
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AdminService', [
      'getMetrics',
      'getOwnerInvitations',
      'inviteOwner',
      'getRecentSignups'
    ]);

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: of({})
    });

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, AdminDashboardComponent, AdminLayoutComponent],
      providers: [
        { provide: AdminService, useValue: spy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    adminServiceMock = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
  });

  beforeEach(() => {
    // Set up default mock responses
    adminServiceMock.getMetrics.and.returnValue(of(mockMetrics));
    adminServiceMock.getRecentSignups.and.returnValue(of(mockRecentSignups));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.showInviteModal).toBeFalse();
    expect(component.isInviting).toBeFalse();
    expect(component.inviteError).toBe('');
    expect(component.inviteRequest).toEqual({ name: '', email: '' });
  });

  describe('ngOnInit', () => {
    it('should load dashboard data on init', () => {
      component.ngOnInit();

      expect(adminServiceMock.getMetrics).toHaveBeenCalled();
      expect(adminServiceMock.getRecentSignups).toHaveBeenCalled();
    });

    it('should set metrics data on successful load', () => {
      component.ngOnInit();

      expect(component.metrics()).toEqual(mockMetrics);
    });


    it('should set recent signups on successful load', () => {
      component.ngOnInit();

      expect(component.recentSignups()).toEqual(mockRecentSignups);
    });

    it('should handle metrics loading error gracefully', () => {
      const httpError = { status: 0, message: 'API Error' };
      adminServiceMock.getMetrics.and.returnValue(throwError(httpError));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('Error loading admin metrics:', httpError);
      expect(component.metrics()).toEqual({
        activeOrganizations: 8,
        newSignups: 3,
        monthlyRevenue: 15420
      });
    });


    it('should handle recent signups loading error gracefully', () => {
      const signupsError = { status: 0, message: 'API Error' };
      adminServiceMock.getRecentSignups.and.returnValue(throwError(signupsError));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('Error loading recent signups:', signupsError);
      expect(component.recentSignups().length).toBeGreaterThan(0); // Should have mock fallback data
    });
  });

  describe('Invite Owner Modal', () => {
    it('should open invite modal', () => {
      component.showInviteModal = true;
      fixture.detectChanges();

      expect(component.showInviteModal).toBeTrue();
    });

    it('should close invite modal and reset form', () => {
      component.showInviteModal = true;
      component.inviteError = 'Some error';
      component.inviteRequest = { name: 'John', email: 'john@example.com' };

      component.closeInviteModal();

      expect(component.showInviteModal).toBeFalse();
      expect(component.inviteError).toBe('');
      expect(component.inviteRequest).toEqual({ name: '', email: '' });
    });

    describe('inviteOwner', () => {
      it('should show error for empty fields', () => {
        component.inviteRequest = { name: '', email: '' };

        component.inviteOwner();

        expect(component.inviteError).toBe('Please fill in all required fields.');
        expect(adminServiceMock.inviteOwner).not.toHaveBeenCalled();
      });

      it('should show error for empty name', () => {
        component.inviteRequest = { name: '   ', email: 'test@example.com' };

        component.inviteOwner();

        expect(component.inviteError).toBe('Please fill in all required fields.');
      });

      it('should show error for empty email', () => {
        component.inviteRequest = { name: 'John Doe', email: '   ' };

        component.inviteOwner();

        expect(component.inviteError).toBe('Please fill in all required fields.');
      });

      it('should send invitation successfully', fakeAsync(() => {
        const mockResponse = { success: true, message: 'Invitation sent' };
        adminServiceMock.inviteOwner.and.returnValue(of(mockResponse));
        spyOn(console, 'log');
        component.inviteRequest = { name: 'John Doe', email: 'john@example.com' };

        component.inviteOwner();

        // Advance time to allow observable to complete
        tick();

        expect(adminServiceMock.inviteOwner).toHaveBeenCalledWith({ name: 'John Doe', email: 'john@example.com' });
        expect(component.showInviteModal).toBeFalse();
        expect(console.log).toHaveBeenCalledWith('Invitation sent successfully!');
        expect(component.isInviting).toBeFalse();
      }));

      it('should handle invitation failure', fakeAsync(() => {
        const mockResponse = { success: false, message: 'Email already exists' };
        adminServiceMock.inviteOwner.and.returnValue(of(mockResponse));
        component.inviteRequest = { name: 'John Doe', email: 'john@example.com' };
        component.showInviteModal = true;

        component.inviteOwner();

        // Advance time to allow observable to complete
        tick();

        expect(component.inviteError).toBe('Email already exists');
        expect(component.showInviteModal).toBeTrue();
        expect(component.isInviting).toBeFalse();
      }));

      it('should handle invitation API error', () => {
        const error = { error: { message: 'Server error' } };
        adminServiceMock.inviteOwner.and.returnValue(throwError(() => error));
        spyOn(console, 'error');
        component.inviteRequest = { name: 'John Doe', email: 'john@example.com' };

        component.inviteOwner();

        expect(console.error).toHaveBeenCalledWith('Error sending invitation:', error);
        expect(component.inviteError).toBe('Server error');
        expect(component.isInviting).toBeFalse();
      });
    });
  });


});