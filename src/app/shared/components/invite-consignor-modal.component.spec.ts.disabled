import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { InviteConsignorModalComponent } from './invite-consignor-modal.component';
import { ConsignorService } from '../../services/consignor.service';

describe('InviteConsignorModalComponent', () => {
  let component: InviteConsignorModalComponent;
  let fixture: ComponentFixture<InviteConsignorModalComponent>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;

  beforeEach(async () => {
    mockConsignorService = jasmine.createSpyObj('ConsignorService', ['inviteProvider', 'createProvider']);
    mockConsignorService.inviteProvider.and.returnValue(of({ success: true, message: 'Invitation sent successfully' }));
    mockConsignorService.createProvider.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [InviteConsignorModalComponent, ReactiveFormsModule],
      providers: [
        { provide: ConsignorService, useValue: mockConsignorService }
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

    expect(mockConsignorService.inviteProvider).toHaveBeenCalledWith({
      email: 'test@test.com',
      name: 'John Doe'
    });
    expect(component.isSubmitting()).toBe(false);
    expect(component.closed.emit).toHaveBeenCalled();
    expect(component.consignorAdded.emit).toHaveBeenCalledWith(null);
  });

  it('should submit manual when form valid', () => {
    component.manualForm.patchValue({
      firstName: 'Test',
      lastName: 'consignor',
      email: 'test@test.com',
      commissionRate: 50
    });
    component.submitManual();
    // TODO: Manual consignor creation not yet implemented
    // Once implemented, should verify createProvider was called
    expect(component.isSubmitting()).toBe(true);
  });
});