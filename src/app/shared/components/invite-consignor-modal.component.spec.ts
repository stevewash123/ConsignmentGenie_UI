import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { InviteConsignorModalComponent } from './invite-consignor-modal.component';
import { ConsignorService } from '../../services/consignor.service';

describe('InviteConsignorModalComponent', () => {
  let component: InviteConsignorModalComponent;
  let fixture: ComponentFixture<InviteConsignorModalComponent>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;
  let mockToastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    mockConsignorService = jasmine.createSpyObj('ConsignorService', ['inviteConsignor', 'createConsignor']);
    mockConsignorService.inviteConsignor.and.returnValue(of({ success: true, message: 'Invitation sent successfully' }));
    mockConsignorService.createConsignor.and.returnValue(of({} as any));

    mockToastrService = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [InviteConsignorModalComponent, ReactiveFormsModule],
      providers: [
        { provide: ConsignorService, useValue: mockConsignorService },
        { provide: ToastrService, useValue: mockToastrService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InviteConsignorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close modal', () => {
    spyOn(component.closed, 'emit');
    component.close();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should switch to manual mode', () => {
    component.switchToManual();
    expect(component.mode).toBe('manual');
  });

  it('should switch to invite mode', () => {
    component.switchToInvite();
    expect(component.mode).toBe('invite');
  });

  it('should set commission rate to shop default when useShopDefault is checked', () => {
    component.manualForm.patchValue({
      useShopDefault: true,
      commissionRate: 0
    });
    component.onUseShopDefaultChange();
    expect(component.manualForm.get('commissionRate')?.value).toBe(60);
  });

  it('should submit invite when form valid', () => {
    spyOn(component.consignorAdded, 'emit');
    spyOn(component.closed, 'emit');

    component.inviteForm.patchValue({
      email: 'test@test.com',
      firstName: 'John',
      lastName: 'Doe'
    });

    component.submitInvite();

    expect(mockConsignorService.inviteConsignor).toHaveBeenCalledWith({
      email: 'test@test.com',
      name: 'John Doe'
    });
    expect(component.isSubmitting()).toBe(false);
    expect(component.closed.emit).not.toHaveBeenCalled(); // Modal should NOT close
    expect(component.consignorAdded.emit).toHaveBeenCalledWith(null);
    expect(mockToastrService.success).toHaveBeenCalledWith('Invitation sent to John Doe', 'Consignor Invited', { timeOut: 5000 });
    expect(component.inviteForm.value).toEqual({ email: null, firstName: null, lastName: null, personalMessage: null }); // Form should be reset
  });

  it('should show toast with email when no name provided', () => {
    spyOn(component.consignorAdded, 'emit');

    component.inviteForm.patchValue({
      email: 'test@test.com'
    });

    component.submitInvite();

    expect(mockToastrService.success).toHaveBeenCalledWith('Invitation sent to test@test.com', 'Consignor Invited', { timeOut: 5000 });
  });

  it('should allow multiple invitations without closing modal', () => {
    spyOn(component.consignorAdded, 'emit');
    spyOn(component.closed, 'emit');

    // First invitation
    component.inviteForm.patchValue({
      email: 'first@test.com',
      firstName: 'First'
    });
    component.submitInvite();

    expect(component.closed.emit).not.toHaveBeenCalled();
    expect(component.inviteForm.get('email')?.value).toBeNull();

    // Second invitation should work
    component.inviteForm.patchValue({
      email: 'second@test.com',
      firstName: 'Second'
    });
    component.submitInvite();

    expect(mockConsignorService.inviteConsignor).toHaveBeenCalledTimes(2);
    expect(component.closed.emit).not.toHaveBeenCalled();
    expect(mockToastrService.success).toHaveBeenCalledTimes(2);
  });

  it('should submit manual when form valid', () => {
    component.manualForm.patchValue({
      firstName: 'Test',
      lastName: 'consignor',
      email: 'test@test.com',
      commissionRate: 50
    });

    spyOn(component.consignorAdded, 'emit');
    component.submitManual();

    expect(mockConsignorService.createConsignor).toHaveBeenCalledWith({
      name: 'Test consignor',
      email: 'test@test.com',
      phone: undefined,
      commissionRate: 0.5 // 50% converted to decimal
    });
    expect(mockToastrService.success).toHaveBeenCalledWith(
      'Test consignor has been added successfully',
      'Consignor Created',
      { timeOut: 5000 }
    );
    expect(component.consignorAdded.emit).toHaveBeenCalledWith({} as any);
    expect(component.manualForm.get('firstName')?.value).toBeNull();
    expect(component.manualForm.get('lastName')?.value).toBeNull();
    expect(component.manualForm.get('email')?.value).toBeNull();
  });
});