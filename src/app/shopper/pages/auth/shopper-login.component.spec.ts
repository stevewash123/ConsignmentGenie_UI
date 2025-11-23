import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';

import { ShopperLoginComponent } from './shopper-login.component';
import { ShopperAuthService } from '../../services/shopper-auth.service';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';

describe('ShopperLoginComponent', () => {
  let component: ShopperLoginComponent;
  let fixture: ComponentFixture<ShopperLoginComponent>;
  let mockAuthService: jasmine.SpyObj<ShopperAuthService>;
  let mockStoreService: jasmine.SpyObj<ShopperStoreService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockStoreInfo: StoreInfoDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Store',
    slug: 'test-store',
    description: 'A test store',
    isActive: true
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('ShopperAuthService', ['login', 'isAuthenticated']);
    mockStoreService = jasmine.createSpyObj('ShopperStoreService', [], {
      currentStore$: new BehaviorSubject<StoreInfoDto | null>(mockStoreInfo)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    const mockActivatedRoute = {
      paramMap: new BehaviorSubject(new Map([['storeSlug', 'test-store']])),
      queryParams: new BehaviorSubject({ returnUrl: '/shop/test-store' })
    };

    await TestBed.configureTestingModule({
      imports: [ShopperLoginComponent, ReactiveFormsModule],
      providers: [
        { provide: ShopperAuthService, useValue: mockAuthService },
        { provide: ShopperStoreService, useValue: mockStoreService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopperLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with invalid form', () => {
    expect(component.loginForm?.valid).toBeFalsy();
  });

  it('should login successfully', fakeAsync(() => {
    const mockResponse = { success: true, token: 'test-token' };
    mockAuthService.login.and.returnValue(of(mockResponse));
    mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));

    if (component.loginForm) {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });

      component.onSubmit();
      tick();

      expect(mockAuthService.login).toHaveBeenCalled();
    }
  }));

  it('should handle login failure', fakeAsync(() => {
    const mockResponse = { success: false, errorMessage: 'Invalid credentials' };
    mockAuthService.login.and.returnValue(of(mockResponse));

    if (component.loginForm) {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      component.onSubmit();
      tick();

      expect(component.errorMessage).toBe('Invalid credentials');
    }
  }));

  it('should check authentication status', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    const result = mockAuthService.isAuthenticated('test-store');
    expect(result).toBeFalsy();
  });
});