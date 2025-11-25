import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminService, AdminMetrics, OwnerInvitation, PendingApproval } from '../../services/admin.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let adminServiceMock: jasmine.SpyObj<AdminService>;

  const mockMetrics: AdminMetrics = {
    activeOrganizations: 5,
    pendingApprovals: 2,
    pendingInvitations: 3
  };

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

  const mockApprovals: PendingApproval[] = [
    {
      id: '1',
      organization: 'Test Shop',
      owner: 'John Owner',
      email: 'owner@testshop.com',
      submittedAt: '2023-11-25T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AdminService', [
      'getMetrics',
      'getOwnerInvitations',
      'inviteOwner',
      'resendOwnerInvitation',
      'cancelOwnerInvitation',
      'getPendingApprovals',
      'approveOrganization',
      'rejectOrganization'
    ]);

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, AdminDashboardComponent, AdminLayoutComponent],
      providers: [
        { provide: AdminService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    adminServiceMock = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
  });

  beforeEach(() => {
    // Set up default mock responses
    adminServiceMock.getMetrics.and.returnValue(of(mockMetrics));
    adminServiceMock.getOwnerInvitations.and.returnValue(of(mockInvitations));
    adminServiceMock.getPendingApprovals.and.returnValue(of(mockApprovals));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.showInviteModal).toBeFalse();
    expect(component.isInviting).toBeFalse();
    expect(component.inviteError).toBe('');
    expect(component.inviteRequest).toEqual({ name: '', email: '' });
    expect(component.isResending).toBeNull();
    expect(component.isCancelling).toBeNull();
    expect(component.isApproving).toBeNull();
    expect(component.isRejecting).toBeNull();
  });

  describe('ngOnInit', () => {
    it('should load dashboard data on init', () => {
      component.ngOnInit();

      expect(adminServiceMock.getMetrics).toHaveBeenCalled();
      expect(adminServiceMock.getOwnerInvitations).toHaveBeenCalled();
      expect(adminServiceMock.getPendingApprovals).toHaveBeenCalled();
    });

    it('should set metrics data on successful load', () => {
      component.ngOnInit();

      expect(component.metrics()).toEqual(mockMetrics);
    });

    it('should set pending invitations on successful load', () => {
      component.ngOnInit();

      expect(component.pendingInvitations()).toEqual(mockInvitations);
    });

    it('should set pending approvals on successful load', () => {
      component.ngOnInit();

      expect(component.pendingApprovals()).toEqual(mockApprovals);
    });

    it('should handle metrics loading error gracefully', () => {
      adminServiceMock.getMetrics.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('Error loading admin metrics:', jasmine.any(Error));
      expect(component.metrics()).toEqual({
        activeOrganizations: 3,
        pendingApprovals: 0,
        pendingInvitations: 0
      });
    });

    it('should handle invitations loading error gracefully', () => {
      adminServiceMock.getOwnerInvitations.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('Error loading pending invitations:', jasmine.any(Error));
      expect(component.pendingInvitations()).toEqual([]);
    });

    it('should handle approvals loading error gracefully', () => {
      adminServiceMock.getPendingApprovals.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('Error loading pending approvals:', jasmine.any(Error));
      expect(component.pendingApprovals()).toEqual([]);
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

      it('should send invitation successfully', (done) => {
        const mockResponse = { success: true, message: 'Invitation sent' };
        adminServiceMock.inviteOwner.and.returnValue(of(mockResponse));
        spyOn(console, 'log');
        component.inviteRequest = { name: 'John Doe', email: 'john@example.com' };

        component.inviteOwner();

        setTimeout(() => {
          expect(adminServiceMock.inviteOwner).toHaveBeenCalledWith({ name: 'John Doe', email: 'john@example.com' });
          expect(component.showInviteModal).toBeFalse();
          expect(console.log).toHaveBeenCalledWith('Invitation sent successfully!');
          expect(component.isInviting).toBeFalse();
          done();
        }, 10);
      });

      it('should handle invitation failure', (done) => {
        const mockResponse = { success: false, message: 'Email already exists' };
        adminServiceMock.inviteOwner.and.returnValue(of(mockResponse));
        component.inviteRequest = { name: 'John Doe', email: 'john@example.com' };
        component.showInviteModal = true;

        component.inviteOwner();

        setTimeout(() => {
          expect(component.inviteError).toBe('Email already exists');
          expect(component.showInviteModal).toBeTrue();
          expect(component.isInviting).toBeFalse();
          done();
        }, 10);
      });

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

  describe('Invitation Management', () => {
    describe('resendInvitation', () => {
      it('should resend invitation successfully', (done) => {
        const mockResponse = { success: true, message: 'Resent successfully' };
        spyOn(console, 'log');
        adminServiceMock.resendOwnerInvitation.and.returnValue(of(mockResponse));

        component.resendInvitation('123');

        expect(adminServiceMock.resendOwnerInvitation).toHaveBeenCalledWith('123');

        setTimeout(() => {
          expect(console.log).toHaveBeenCalledWith('Invitation resent successfully!');
          expect(component.isResending).toBeNull();
          done();
        }, 10);
      });

      it('should handle resend failure', () => {
        const mockResponse = { success: false, message: 'Failed to resend' };
        adminServiceMock.resendOwnerInvitation.and.returnValue(of(mockResponse));
        spyOn(console, 'error');

        component.resendInvitation('123');

        expect(console.error).toHaveBeenCalledWith('Failed to resend invitation:', 'Failed to resend');
        expect(component.isResending).toBeNull();
      });

      it('should handle resend API error', () => {
        const error = new Error('Network error');
        adminServiceMock.resendOwnerInvitation.and.returnValue(throwError(() => error));
        spyOn(console, 'error');

        component.resendInvitation('123');

        expect(console.error).toHaveBeenCalledWith('Error resending invitation:', error);
        expect(component.isResending).toBeNull();
      });
    });

    describe('cancelInvitation', () => {
      it('should cancel invitation after confirmation', (done) => {
        const mockResponse = { success: true, message: 'Cancelled successfully' };
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(console, 'log');
        adminServiceMock.cancelOwnerInvitation.and.returnValue(of(mockResponse));

        component.cancelInvitation('123');

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel this invitation?');
        expect(adminServiceMock.cancelOwnerInvitation).toHaveBeenCalledWith('123');

        setTimeout(() => {
          expect(console.log).toHaveBeenCalledWith('Invitation cancelled successfully!');
          expect(component.isCancelling).toBeNull();
          done();
        }, 10);
      });

      it('should not cancel invitation if not confirmed', () => {
        spyOn(window, 'confirm').and.returnValue(false);

        component.cancelInvitation('123');

        expect(window.confirm).toHaveBeenCalled();
        expect(adminServiceMock.cancelOwnerInvitation).not.toHaveBeenCalled();
      });

      it('should handle cancel failure', () => {
        const mockResponse = { success: false, message: 'Failed to cancel' };
        adminServiceMock.cancelOwnerInvitation.and.returnValue(of(mockResponse));
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(console, 'error');

        component.cancelInvitation('123');

        expect(console.error).toHaveBeenCalledWith('Failed to cancel invitation:', 'Failed to cancel');
        expect(component.isCancelling).toBeNull();
      });
    });
  });

  describe('Organization Approval Management', () => {
    describe('approveOrganization', () => {
      it('should approve organization after confirmation', (done) => {
        const mockResponse = { success: true, message: 'Approved successfully' };
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(console, 'log');
        adminServiceMock.approveOrganization.and.returnValue(of(mockResponse));

        component.approveOrganization('123');

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to approve this organization?');
        expect(adminServiceMock.approveOrganization).toHaveBeenCalledWith('123');

        setTimeout(() => {
          expect(console.log).toHaveBeenCalledWith('Organization approved successfully!');
          expect(component.isApproving).toBeNull();
          done();
        }, 10);
      });

      it('should not approve organization if not confirmed', () => {
        spyOn(window, 'confirm').and.returnValue(false);

        component.approveOrganization('123');

        expect(adminServiceMock.approveOrganization).not.toHaveBeenCalled();
      });
    });

    describe('rejectOrganization', () => {
      it('should reject organization after confirmation', (done) => {
        const mockResponse = { success: true, message: 'Rejected successfully' };
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(console, 'log');
        adminServiceMock.rejectOrganization.and.returnValue(of(mockResponse));

        component.rejectOrganization('123');

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to reject this organization? This action cannot be undone.');
        expect(adminServiceMock.rejectOrganization).toHaveBeenCalledWith('123');

        setTimeout(() => {
          expect(console.log).toHaveBeenCalledWith('Organization rejected successfully!');
          expect(component.isRejecting).toBeNull();
          done();
        }, 10);
      });

      it('should not reject organization if not confirmed', () => {
        spyOn(window, 'confirm').and.returnValue(false);

        component.rejectOrganization('123');

        expect(adminServiceMock.rejectOrganization).not.toHaveBeenCalled();
      });
    });
  });
});