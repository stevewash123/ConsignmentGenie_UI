import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StoreBranding, ColorPreset } from '../../../../models/store-branding.interface';
import { BrandingService } from '../../../../services/branding.service';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.css']
})
export class BrandingComponent implements OnInit, OnDestroy {
  brandingForm!: FormGroup;
  currentLogo = signal<string>('');
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  selectedPreset = signal('');

  // Auto-save functionality
  private subscriptions = new Subscription();
  private pendingChanges: Partial<StoreBranding> = {};
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSaving = false;
  private readonly DEBOUNCE_MS = 800;

  // Auto-save status computed from form state
  autoSaveStatus = computed(() => {
    return this.saving() ? 'Saving...' : 'Saved automatically';
  });

  colorPresets: ColorPreset[] = [
    {
      name: 'Professional Blue',
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      text: '#1e293b',
      background: '#ffffff'
    },
    {
      name: 'Elegant Purple',
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#f59e0b',
      text: '#374151',
      background: '#f8fafc'
    },
    {
      name: 'Modern Green',
      primary: '#059669',
      secondary: '#10b981',
      accent: '#84cc16',
      text: '#064e3b',
      background: '#f0fdf4'
    },
    {
      name: 'Vintage Brown',
      primary: '#a16207',
      secondary: '#d97706',
      accent: '#dc2626',
      text: '#451a03',
      background: '#fef7ed'
    },
    {
      name: 'Minimal Gray',
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#3b82f6',
      text: '#111827',
      background: '#ffffff'
    }
  ];

  fontOptions = [
    { value: 'Inter', label: 'Inter (Modern Sans-Serif)' },
    { value: 'Playfair Display', label: 'Playfair Display (Elegant Serif)' },
    { value: 'Roboto', label: 'Roboto (Clean Sans-Serif)' },
    { value: 'Merriweather', label: 'Merriweather (Readable Serif)' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' }
  ];

  constructor(
    private fb: FormBuilder,
    private brandingService: BrandingService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadBrandingSettings();
    this.setupFormChangeListeners();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  private initializeForm() {
    this.brandingForm = this.fb.group({
      logo: this.fb.group({
        url: [''],
        fileName: [''],
        uploadedAt: [null],
        dimensions: this.fb.group({
          width: [0],
          height: [0]
        })
      }),
      colors: this.fb.group({
        primary: ['#3b82f6', Validators.required],
        secondary: ['#64748b', Validators.required],
        accent: ['#06b6d4', Validators.required],
        text: ['#1e293b', Validators.required],
        background: ['#ffffff', Validators.required]
      }),
      typography: this.fb.group({
        headingFont: ['Inter', Validators.required],
        bodyFont: ['Inter', Validators.required],
        fontSizeScale: ['medium', Validators.required]
      }),
      style: this.fb.group({
        theme: ['professional', Validators.required],
        customCss: ['']
      })
    });
  }

  private loadBrandingSettings() {
    this.brandingService.getBranding().subscribe({
      next: (branding) => {
        if (branding) {
          this.brandingForm.patchValue(branding);
          if (branding.logo.url) {
            this.currentLogo.set(branding.logo.url);
          }
        }
      },
      error: (error) => {
        this.showError('Failed to load branding settings');
      }
    });
  }

  private setupFormChangeListeners(): void {
    // Subscribe to form value changes for auto-save
    // Exclude logo changes from auto-save since logo uploads are handled separately
    this.subscriptions.add(
      this.brandingForm.valueChanges.subscribe((values) => {
        // Don't auto-save logo changes - those are handled by uploadLogo()
        const { logo, ...otherValues } = values;
        if (Object.keys(otherValues).length > 0) {
          this.pendingChanges = otherValues;
          this.scheduleSave();
        }
      })
    );
  }

  private scheduleSave(): void {
    // Clear existing timer
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timer
    this.saveTimeout = setTimeout(() => this.autoSave(), this.DEBOUNCE_MS);
  }

  private autoSave(): void {
    if (this.isSaving || Object.keys(this.pendingChanges).length === 0 || !this.brandingForm.valid) {
      return;
    }

    this.isSaving = true;
    this.saving.set(true);
    const changesToSave = { ...this.pendingChanges };
    this.pendingChanges = {};

    const brandingData: StoreBranding = {
      // Provide sensible defaults for required fields
      colors: changesToSave.colors || {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#06b6d4',
        text: '#1e293b',
        background: '#ffffff'
      },
      typography: changesToSave.typography || {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSizeScale: 'medium' as const
      },
      // Optional fields - only include if present
      ...(changesToSave.logo && { logo: changesToSave.logo }),
      ...(changesToSave.style && { style: changesToSave.style }),
      lastUpdated: new Date()
    };

    this.brandingService.saveBranding(brandingData).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.isSaving = false;

        // If more changes came in while saving, save again
        if (Object.keys(this.pendingChanges).length > 0) {
          this.scheduleSave();
        }
      },
      error: (error) => {
        this.showError('Failed to save branding settings');
        this.saving.set(false);
        this.isSaving = false;

        // Retry by putting changes back
        Object.assign(this.pendingChanges, changesToSave);
        this.scheduleSave();
      }
    });
  }

  // Keep onSave method for form submit (no-op now, but prevents errors)
  onSave() {
    // Auto-save handles all saving now
  }

  onLogoSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File) {
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      this.showError('Logo file must be less than 2MB');
      return;
    }

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      this.showError('Logo must be PNG, JPG, or SVG format');
      return;
    }

    this.uploadLogo(file);
  }

  private uploadLogo(file: File) {
    this.saving.set(true);
    this.brandingService.uploadLogo(file).subscribe({
      next: (uploadResult) => {
        // Update form with new logo data
        this.brandingForm.get('logo')?.patchValue({
          url: uploadResult.url,
          fileName: file.name,
          uploadedAt: new Date(),
          dimensions: uploadResult.dimensions
        });

        this.currentLogo.set(uploadResult.url);
        this.showSuccess('Logo uploaded successfully');
        this.saving.set(false);
      },
      error: (error) => {
        this.showError('Failed to upload logo');
        this.saving.set(false);
      }
    });
  }

  removeLogo() {
    if (confirm('Are you sure you want to remove the logo?')) {
      this.saving.set(true);
      this.brandingService.removeLogo().subscribe({
        next: () => {
          // Clear logo data in form
          this.brandingForm.get('logo')?.patchValue({
            url: '',
            fileName: '',
            uploadedAt: null,
            dimensions: { width: 0, height: 0 }
          });

          this.currentLogo.set('');
          this.saving.set(false);
        },
        error: (error) => {
          this.showError('Failed to remove logo');
          this.saving.set(false);
        }
      });
    }
  }

  applyColorPreset(preset: ColorPreset) {
    this.selectedPreset.set(preset.name);
    this.brandingForm.get('colors')?.patchValue({
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent,
      text: preset.text,
      background: preset.background
    });
  }

  previewStorefront() {
    // TODO: Implement storefront preview functionality
    console.log('Preview storefront with current branding settings');
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}