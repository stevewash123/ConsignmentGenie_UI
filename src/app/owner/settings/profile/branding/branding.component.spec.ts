import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { BrandingComponent } from './branding.component';
import { BrandingService } from '../../../../services/branding.service';
import { StoreBranding, ColorPreset } from '../../../../models/store-branding.interface';

describe('BrandingComponent', () => {
  let component: BrandingComponent;
  let fixture: ComponentFixture<BrandingComponent>;
  let mockBrandingService: jasmine.SpyObj<BrandingService>;

  const mockStoreBranding: StoreBranding = {
    logo: {
      url: 'https://example.com/logo.png',
      fileName: 'logo.png',
      uploadedAt: new Date('2023-12-01'),
      dimensions: { width: 300, height: 100 }
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      text: '#1e293b',
      background: '#ffffff'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSizeScale: 'medium'
    },
    style: {
      theme: 'professional',
      customCss: ''
    },
    lastUpdated: new Date('2023-12-01')
  };

  beforeEach(async () => {
    const brandingServiceSpy = jasmine.createSpyObj('BrandingService', [
      'getBranding',
      'saveBranding',
      'uploadLogo',
      'removeLogo',
      'previewStorefront'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        BrandingComponent,
        ReactiveFormsModule,
        BrowserTestingModule
      ],
      providers: [
        { provide: BrandingService, useValue: brandingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandingComponent);
    component = fixture.componentInstance;
    mockBrandingService = TestBed.inject(BrandingService) as jasmine.SpyObj<BrandingService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    mockBrandingService.getBranding.and.returnValue(Promise.resolve(null));
    fixture.detectChanges();

    expect(component.brandingForm).toBeDefined();
    expect(component.brandingForm.get('colors.primary')?.value).toBe('#3b82f6');
    expect(component.brandingForm.get('typography.headingFont')?.value).toBe('Inter');
    expect(component.brandingForm.get('style.theme')?.value).toBe('professional');
  });

  it('should load existing branding settings on init', async () => {
    mockBrandingService.getBranding.and.returnValue(Promise.resolve(mockStoreBranding));

    component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockBrandingService.getBranding).toHaveBeenCalled();
    expect(component.currentLogo()).toBe(mockStoreBranding.logo.url);
    expect(component.brandingForm.get('colors.primary')?.value).toBe(mockStoreBranding.colors.primary);
  });

  it('should handle loading error', async () => {
    mockBrandingService.getBranding.and.returnValue(Promise.reject('Error loading'));
    spyOn(component, 'showError' as any);

    component.ngOnInit();
    await fixture.whenStable();

    expect(component['showError']).toHaveBeenCalledWith('Failed to load branding settings');
  });

  it('should save branding settings successfully', async () => {
    mockBrandingService.saveBranding.and.returnValue(Promise.resolve(mockStoreBranding));
    component.brandingForm.patchValue(mockStoreBranding);
    spyOn(component, 'showSuccess' as any);

    await component.onSave();

    expect(mockBrandingService.saveBranding).toHaveBeenCalled();
    expect(component['showSuccess']).toHaveBeenCalledWith('Branding settings saved successfully');
    expect(component.saving()).toBe(false);
  });

  it('should handle save error', async () => {
    mockBrandingService.saveBranding.and.returnValue(Promise.reject('Save error'));
    spyOn(component, 'showError' as any);

    await component.onSave();

    expect(component['showError']).toHaveBeenCalledWith('Failed to save branding settings');
    expect(component.saving()).toBe(false);
  });

  it('should validate logo file size on upload', () => {
    const largeMockFile = new File([''], 'large-logo.png', {
      type: 'image/png',
      lastModified: Date.now()
    });
    // Mock file size to be over 2MB
    Object.defineProperty(largeMockFile, 'size', { value: 3 * 1024 * 1024 });

    const mockEvent = { target: { files: [largeMockFile] } } as any;
    spyOn(component, 'showError' as any);

    component.onLogoSelect(mockEvent);

    expect(component['showError']).toHaveBeenCalledWith('Logo file must be less than 2MB');
  });

  it('should validate logo file type on upload', () => {
    const invalidMockFile = new File([''], 'logo.txt', {
      type: 'text/plain',
      lastModified: Date.now()
    });
    Object.defineProperty(invalidMockFile, 'size', { value: 1024 });

    const mockEvent = { target: { files: [invalidMockFile] } } as any;
    spyOn(component, 'showError' as any);

    component.onLogoSelect(mockEvent);

    expect(component['showError']).toHaveBeenCalledWith('Logo must be PNG, JPG, or SVG format');
  });

  it('should upload logo successfully', async () => {
    const mockFile = new File([''], 'logo.png', { type: 'image/png' });
    Object.defineProperty(mockFile, 'size', { value: 1024 });

    const uploadResult = { url: 'https://example.com/new-logo.png', dimensions: { width: 200, height: 50 } };
    mockBrandingService.uploadLogo.and.returnValue(Promise.resolve(uploadResult));
    spyOn(component, 'showSuccess' as any);

    await component['uploadLogo'](mockFile);

    expect(mockBrandingService.uploadLogo).toHaveBeenCalledWith(mockFile);
    expect(component.currentLogo()).toBe(uploadResult.url);
    expect(component['showSuccess']).toHaveBeenCalledWith('Logo uploaded successfully');
  });

  it('should remove logo with confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockBrandingService.removeLogo.and.returnValue(Promise.resolve());
    spyOn(component, 'showSuccess' as any);
    component.currentLogo.set('https://example.com/logo.png');

    await component.removeLogo();

    expect(mockBrandingService.removeLogo).toHaveBeenCalled();
    expect(component.currentLogo()).toBe('');
    expect(component['showSuccess']).toHaveBeenCalledWith('Logo removed successfully');
  });

  it('should not remove logo if user cancels confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.currentLogo.set('https://example.com/logo.png');

    await component.removeLogo();

    expect(mockBrandingService.removeLogo).not.toHaveBeenCalled();
    expect(component.currentLogo()).toBe('https://example.com/logo.png');
  });

  it('should apply color preset correctly', () => {
    const preset: ColorPreset = {
      name: 'Test Preset',
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      text: '#000000',
      background: '#ffffff'
    };

    component.applyColorPreset(preset);

    expect(component.selectedPreset()).toBe(preset.name);
    expect(component.brandingForm.get('colors.primary')?.value).toBe(preset.primary);
    expect(component.brandingForm.get('colors.secondary')?.value).toBe(preset.secondary);
    expect(component.brandingForm.get('colors.accent')?.value).toBe(preset.accent);
  });

  it('should have color presets available', () => {
    expect(component.colorPresets).toBeDefined();
    expect(component.colorPresets.length).toBeGreaterThan(0);
    expect(component.colorPresets[0].name).toBeDefined();
    expect(component.colorPresets[0].primary).toBeDefined();
  });

  it('should have font options available', () => {
    expect(component.fontOptions).toBeDefined();
    expect(component.fontOptions.length).toBeGreaterThan(0);
    expect(component.fontOptions[0].value).toBeDefined();
    expect(component.fontOptions[0].label).toBeDefined();
  });

  it('should call preview storefront function', () => {
    spyOn(console, 'log');

    component.previewStorefront();

    expect(console.log).toHaveBeenCalledWith('Preview storefront with current branding settings');
  });

  it('should show success message and clear after timeout', (done) => {
    component['showSuccess']('Test success');

    expect(component.successMessage()).toBe('Test success');
    expect(component.errorMessage()).toBe('');

    setTimeout(() => {
      expect(component.successMessage()).toBe('');
      done();
    }, 5100);
  });

  it('should show error message and clear after timeout', (done) => {
    component['showError']('Test error');

    expect(component.errorMessage()).toBe('Test error');
    expect(component.successMessage()).toBe('');

    setTimeout(() => {
      expect(component.errorMessage()).toBe('');
      done();
    }, 5100);
  });

  it('should disable save button when form is invalid', () => {
    component.brandingForm.get('colors.primary')?.setValue('invalid-color');
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(saveButton.disabled).toBe(true);
  });

  it('should disable save button when saving', () => {
    component.saving.set(true);
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(saveButton.disabled).toBe(true);
  });

  it('should display current logo when available', () => {
    component.currentLogo.set('https://example.com/logo.png');
    fixture.detectChanges();

    const logoImg = fixture.nativeElement.querySelector('.current-logo img');
    expect(logoImg).toBeTruthy();
    expect(logoImg.src).toBe('https://example.com/logo.png');
  });

  it('should display upload zone when no logo', () => {
    component.currentLogo.set('');
    fixture.detectChanges();

    const uploadZone = fixture.nativeElement.querySelector('.upload-zone');
    const currentLogo = fixture.nativeElement.querySelector('.current-logo');

    expect(uploadZone).toBeTruthy();
    expect(currentLogo).toBeFalsy();
  });

  it('should display success message', () => {
    component.successMessage.set('Test success message');
    fixture.detectChanges();

    const successMsg = fixture.nativeElement.querySelector('.message.success');
    expect(successMsg).toBeTruthy();
    expect(successMsg.textContent).toContain('Test success message');
  });

  it('should display error message', () => {
    component.errorMessage.set('Test error message');
    fixture.detectChanges();

    const errorMsg = fixture.nativeElement.querySelector('.message.error');
    expect(errorMsg).toBeTruthy();
    expect(errorMsg.textContent).toContain('Test error message');
  });
});