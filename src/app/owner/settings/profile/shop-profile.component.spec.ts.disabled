import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ShopProfileComponent } from './shop-profile.component';

describe('ShopProfileComponent', () => {
  let component: ShopProfileComponent;
  let fixture: ComponentFixture<ShopProfileComponent>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  const mockShopProfile = {
    ShopName: 'Test Shop',
    ShopDescription: 'A test consignment shop',
    ShopLogoUrl: 'https://example.com/logo.png',
    ShopBannerUrl: 'https://example.com/banner.png',
    ShopPhone: '555-123-4567',
    ShopEmail: 'info@testshop.com',
    ShopWebsite: 'https://testshop.com',
    ShopAddress1: '123 Main St',
    ShopAddress2: 'Suite 100',
    ShopCity: 'Austin',
    ShopState: 'TX',
    ShopZip: '78701',
    ShopCountry: 'US',
    ShopTimezone: 'America/Chicago'
  };

  beforeEach(async () => {
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'put']);

    await TestBed.configureTestingModule({
      imports: [ShopProfileComponent, CommonModule, FormsModule],
      providers: [
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShopProfileComponent);
    component = fixture.componentInstance;
    mockHttpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('Happy Path Tests', () => {
    beforeEach(() => {
      mockHttpClient.get.and.returnValue(of(mockShopProfile));
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load shop profile on init', async () => {
      // Arrange
      mockHttpClient.get.and.returnValue(of(mockShopProfile));

      // Act
      fixture.detectChanges(); // triggers ngOnInit
      await fixture.whenStable(); // wait for async operations

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/organization/profile');
      expect(component.profile()).toEqual(mockShopProfile);
    });

    it('should display shop profile data in template', async () => {
      // Arrange
      component.profile.set(mockShopProfile);

      // Act
      fixture.detectChanges();
      await fixture.whenStable(); // wait for ngModel bindings
      fixture.detectChanges(); // update view with bound values

      // Assert
      const compiled = fixture.nativeElement;
      const shopNameInput = compiled.querySelector('input[name="shopName"]');
      const shopDescriptionTextarea = compiled.querySelector('textarea[name="shopDescription"]');
      const phoneInput = compiled.querySelector('input[name="phone"]');
      const emailInput = compiled.querySelector('input[name="email"]');

      expect(shopNameInput.value).toBe('Test Shop');
      expect(shopDescriptionTextarea.value).toBe('A test consignment shop');
      expect(phoneInput.value).toBe('555-123-4567');
      expect(emailInput.value).toBe('info@testshop.com');
    });

    it('should save shop profile when form is submitted', async () => {
      // Arrange
      component.profile.set(mockShopProfile);
      mockHttpClient.put.and.returnValue(of({ success: true, message: 'Profile updated successfully' }));

      // Act
      await component.saveProfile();

      // Assert
      expect(mockHttpClient.put).toHaveBeenCalledWith('http://localhost:5000/api/organization/profile', mockShopProfile);
      expect(component.successMessage()).toBe('Shop profile saved successfully');
      expect(component.errorMessage()).toBe('');
    });

    it('should show success message after successful save', async () => {
      // Arrange
      component.profile.set(mockShopProfile);
      mockHttpClient.put.and.returnValue(of({ success: true }));

      // Act
      await component.saveProfile();
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const successMessage = compiled.querySelector('.message.success');
      expect(successMessage).toBeTruthy();
      expect(successMessage.textContent).toBe('Shop profile saved successfully');
    });

    it('should handle logo selection and preview', (done) => {
      // Arrange
      component.profile.set(mockShopProfile);
      const mockFile = new File(['mock image'], 'logo.png', { type: 'image/png' });
      const mockEvent = { target: { files: [mockFile] } } as any;

      // Act
      component.onLogoSelect(mockEvent);

      // Assert - wait for FileReader to complete
      setTimeout(() => {
        expect(component.profile()?.ShopLogoUrl).toContain('data:image/png;base64');
        done();
      }, 100);
    });

    it('should remove logo when removeLogo is called', () => {
      // Arrange
      component.profile.set({...mockShopProfile, ShopLogoUrl: 'some-logo-url'});

      // Act
      component.removeLogo();

      // Assert
      expect(component.profile()?.ShopLogoUrl).toBeUndefined();
    });

    it('should show error message on save failure', async () => {
      // Arrange
      component.profile.set(mockShopProfile);
      mockHttpClient.put.and.returnValue(throwError(() => new Error('Network error')));

      // Act
      await component.saveProfile();

      // Assert
      expect(component.errorMessage()).toBe('Failed to save shop profile');
      expect(component.successMessage()).toBe('');
    });

    it('should reload profile data when cancel is clicked', async () => {
      // Arrange
      component.profile.set(mockShopProfile);
      const updatedProfile = {...mockShopProfile, ShopName: 'Updated Shop'};
      mockHttpClient.get.and.returnValue(of(updatedProfile));

      // Act
      await component.loadProfile();

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(component.profile()).toEqual(updatedProfile);
    });

    it('should set saving state during save operation', async () => {
      // Arrange
      component.profile.set(mockShopProfile);
      mockHttpClient.put.and.returnValue(of({ success: true }));

      // Act & Assert
      expect(component.isSaving()).toBeFalsy();

      const savePromise = component.saveProfile();
      expect(component.isSaving()).toBeTruthy();

      await savePromise;
      expect(component.isSaving()).toBeFalsy();
    });

    it('should handle missing profile gracefully in saveProfile', async () => {
      // Arrange
      component.profile.set(null);

      // Act
      await component.saveProfile();

      // Assert
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });

    it('should auto-clear success message after 5 seconds', (done) => {
      // Arrange
      jasmine.clock().install();
      component.profile.set(mockShopProfile);
      mockHttpClient.put.and.returnValue(of({ success: true }));

      // Act
      component.saveProfile().then(() => {
        expect(component.successMessage()).toBe('Shop profile saved successfully');

        // Fast-forward time by 5 seconds
        jasmine.clock().tick(5001);
        expect(component.successMessage()).toBe('');
        jasmine.clock().uninstall();
        done();
      });
    });
  });

  xdescribe('Error Handling', () => {
    it('should show error message when loading profile fails', async () => {
      // Arrange
      mockHttpClient.get.and.returnValue(throwError(() => new Error('API Error')));

      // Act
      fixture.detectChanges(); // triggers ngOnInit
      await fixture.whenStable(); // wait for async error handling

      // Assert
      expect(component.errorMessage()).toBe('Failed to load shop profile');
      expect(component.profile()).toBeNull();
    });

    it('should handle empty response when loading profile', async () => {
      // Arrange
      mockHttpClient.get.and.returnValue(of(null));

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.profile()).toBeNull();
    });
  });
});