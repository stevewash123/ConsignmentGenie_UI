import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConsignorService } from '../../services/consignor.service';
import { SettingsService } from '../../services/settings.service';
import { Consignor } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';
import { OwnerLayoutComponent } from './owner-layout.component';
import { environment } from '../../../environments/environment';

interface ConsignorAgreementStatus {
  status: string; // "none" | "pending" | "on_file" | "uploaded"
  method?: string; // "consignor_upload" | "consignor_acknowledge" | "owner_marked" | "owner_upload" | null
  receivedAt?: string;
  documentUrl?: string;
  markedBy?: {
    id: string;
    name: string;
  };
  notes?: string;
}

@Component({
  selector: 'app-consignor-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, OwnerLayoutComponent],
  templateUrl: './consignor-detail.component.html',
  styleUrls: ['./consignor-detail.component.scss']
})
export class ConsignorDetailComponent implements OnInit {
  consignor = signal<Consignor | null>(null);
  providerId = signal<string>('');
  isSubmitting = signal(false);
  errorMessage = signal('');

  stats = signal({
    totalItems: 0,
    activeItems: 0,
    soldItems: 0,
    totalEarnings: 0,
    pendingPayout: 0
  });

  recentActivity = signal<any[]>([]);

  // Agreement-related signals
  agreementStatus = signal<ConsignorAgreementStatus | null>(null);
  onboardingSettings = signal<any>(null);
  showMarkOnFileModal = signal(false);
  showUploadModal = signal(false);
  showRemoveConfirmModal = signal(false);
  isProcessingAgreement = signal(false);
  showSuccessToast = signal(false);
  successMessage = signal('');
  uploadProgress = signal(0);

  // Form data
  onFileNotes = '';
  uploadNotes = '';
  selectedFile = signal<File | null>(null);

  isProviderLoading(): boolean {
    return this.loadingService.isLoading('consignor-detail');
  }

  constructor(
    private ConsignorService: ConsignorService,
    private route: ActivatedRoute,
    private router: Router,
    private loadingService: LoadingService,
    private settingsService: SettingsService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.providerId.set(id);
      this.loadProvider();
      this.loadStats();
      this.loadRecentActivity();
      this.loadOnboardingSettings();
      this.loadAgreementStatus();
    }
  }

  loadProvider(): void {
    this.loadingService.start('consignor-detail');
    this.ConsignorService.getConsignor(this.providerId()).subscribe({
      next: (consignor) => {
        this.consignor.set(consignor);
      },
      error: (error) => {
        console.error('Error loading consignor:', error);
        this.errorMessage.set('Failed to load consignor details');
      },
      complete: () => {
        this.loadingService.stop('consignor-detail');
      }
    });
  }

  loadStats(): void {
    this.ConsignorService.getConsignorStats(this.providerId()).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading consignor stats:', error);
        // Fall back to zeros if API fails
        this.stats.set({
          totalItems: 0,
          activeItems: 0,
          soldItems: 0,
          totalEarnings: 0,
          pendingPayout: 0
        });
      }
    });
  }

  loadRecentActivity(): void {
    // This would call an API to get recent activity
    // For now, using mock data
    this.recentActivity.set([
      {
        type: 'sale',
        description: 'Item "Vintage Vase" sold',
        date: new Date('2024-11-20'),
        amount: 35.00
      },
      {
        type: 'item',
        description: 'Added new item "Handmade Jewelry"',
        date: new Date('2024-11-18'),
        amount: null
      },
      {
        type: 'payout',
        description: 'Payout processed',
        date: new Date('2024-11-15'),
        amount: 250.00
      }
    ]);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'sale': return '💰';
      case 'item': return '📦';
      case 'payout': return '💳';
      default: return '📋';
    }
  }

  deactivateProvider(): void {
    if (!this.consignor()) return;

    this.isSubmitting.set(true);
    this.ConsignorService.deactivateConsignor(this.consignor()!.id).subscribe({
      next: (updated) => {
        this.consignor.set(updated);
      },
      error: (error) => {
        console.error('Error deactivating consignor:', error);
        this.errorMessage.set('Failed to deactivate consignor');
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  activateProvider(): void {
    if (!this.consignor()) return;

    this.isSubmitting.set(true);
    this.ConsignorService.activateConsignor(this.consignor()!.id).subscribe({
      next: (updated) => {
        this.consignor.set(updated);
      },
      error: (error) => {
        console.error('Error activating consignor:', error);
        this.errorMessage.set('Failed to activate consignor');
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  // Agreement-related methods
  async loadOnboardingSettings(): Promise<void> {
    try {
      const settings = await this.settingsService.getConsignorOnboardingSettings();
      this.onboardingSettings.set(settings);
    } catch (error) {
      console.error('Error loading onboarding settings:', error);
      // Default to not showing agreement section if we can't load settings
      this.onboardingSettings.set({ agreementRequirement: 'none' });
    }
  }

  async loadAgreementStatus(): Promise<void> {
    const consignorId = this.providerId();
    if (!consignorId) return;

    try {
      const status = await this.http.get<ConsignorAgreementStatus>(
        `${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement`
      ).toPromise();

      this.agreementStatus.set(status || { status: 'none' });
    } catch (error: any) {
      console.error('Error loading agreement status:', error);
      // If 404, it means no agreement exists yet, which is pending if required
      if (error.status === 404 && this.requiresAgreement()) {
        this.agreementStatus.set({ status: 'pending' });
      } else {
        this.agreementStatus.set({ status: 'none' });
      }
    }
  }

  showAgreementSection(): boolean {
    const settings = this.onboardingSettings();
    return settings && settings.agreementRequirement !== 'none';
  }

  requiresAgreement(): boolean {
    const settings = this.onboardingSettings();
    return settings && ['acknowledge', 'upload'].includes(settings.agreementRequirement);
  }

  agreementNotes(): string {
    const status = this.agreementStatus();
    return status?.notes || '';
  }

  isConsignorCompleted(): boolean {
    const status = this.agreementStatus();
    return status?.method === 'consignor_acknowledge' || status?.method === 'consignor_upload';
  }

  getDocumentName(): string {
    const status = this.agreementStatus();
    if (!status?.documentUrl) return '';

    // Extract filename from URL
    const parts = status.documentUrl.split('/');
    return parts[parts.length - 1] || 'agreement-document.pdf';
  }

  // Modal management
  openMarkOnFileModal(): void {
    this.onFileNotes = '';
    this.showMarkOnFileModal.set(true);
  }

  closeMarkOnFileModal(): void {
    this.showMarkOnFileModal.set(false);
  }

  openUploadModal(): void {
    this.uploadNotes = '';
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
    this.showUploadModal.set(true);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
  }

  confirmRemoveAgreement(): void {
    this.showRemoveConfirmModal.set(true);
  }

  closeRemoveConfirmModal(): void {
    this.showRemoveConfirmModal.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF, PNG, or JPG file');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      this.selectedFile.set(file);
    }
  }

  async markAgreementOnFile(): Promise<void> {
    const consignorId = this.providerId();
    if (!consignorId) return;

    this.isProcessingAgreement.set(true);

    try {
      const response = await this.http.post(
        `${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement/mark-on-file`,
        { notes: this.onFileNotes }
      ).toPromise();

      this.closeMarkOnFileModal();
      await this.loadAgreementStatus();
      this.showToast('Agreement marked as on file');
    } catch (error) {
      console.error('Error marking agreement on file:', error);
      this.errorMessage.set('Failed to mark agreement on file');
    } finally {
      this.isProcessingAgreement.set(false);
    }
  }

  async uploadAgreement(): Promise<void> {
    const consignorId = this.providerId();
    const file = this.selectedFile();
    if (!consignorId || !file) return;

    this.isProcessingAgreement.set(true);
    this.uploadProgress.set(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (this.uploadNotes) {
        formData.append('notes', this.uploadNotes);
      }

      // Simple upload without progress tracking for now
      const response = await this.http.post(
        `${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement/upload`,
        formData
      ).toPromise();

      this.uploadProgress.set(100);
      this.closeUploadModal();
      await this.loadAgreementStatus();
      this.showToast('Agreement document uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading agreement:', error);
      if (error.error?.error) {
        this.errorMessage.set(error.error.error);
      } else {
        this.errorMessage.set('Failed to upload agreement document');
      }
    } finally {
      this.isProcessingAgreement.set(false);
      this.uploadProgress.set(0);
    }
  }

  async removeAgreement(): Promise<void> {
    const consignorId = this.providerId();
    if (!consignorId) return;

    this.isProcessingAgreement.set(true);

    try {
      await this.http.delete(
        `${environment.apiUrl}/api/owner/consignors/${consignorId}/agreement`
      ).toPromise();

      this.closeRemoveConfirmModal();
      await this.loadAgreementStatus();
      this.showToast('Agreement removed');
    } catch (error) {
      console.error('Error removing agreement:', error);
      this.errorMessage.set('Failed to remove agreement');
    } finally {
      this.isProcessingAgreement.set(false);
    }
  }

  viewDocument(): void {
    const status = this.agreementStatus();
    if (status?.documentUrl) {
      window.open(status.documentUrl, '_blank');
    }
  }

  viewAcknowledgedTerms(): void {
    // TODO: Show modal with the terms that were acknowledged
    alert('Terms acknowledgment viewing feature coming soon');
  }

  showToast(message: string): void {
    this.successMessage.set(message);
    this.showSuccessToast.set(true);

    // Hide toast after 3 seconds
    setTimeout(() => {
      this.showSuccessToast.set(false);
    }, 3000);
  }
}