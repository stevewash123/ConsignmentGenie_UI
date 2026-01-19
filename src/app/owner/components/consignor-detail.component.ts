import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConsignorService } from '../../services/consignor.service';
import { SettingsService } from '../../services/settings.service';
import { Consignor, ConsignorDetailDto, ConsignorStatus, ApiResponse } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';
import { OwnerLayoutComponent } from './owner-layout.component';
import { environment } from '../../../environments/environment';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';
import { CommunicationService } from '../../services/communication.service';

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
  consignorDetails = signal<ConsignorDetailDto | null>(null);
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

  // Communication-related signals
  isSendingContactInfo = signal(false);

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
    private location: Location,
    private loadingService: LoadingService,
    private settingsService: SettingsService,
    private http: HttpClient,
    private confirmationDialog: ConfirmationDialogService,
    private communicationService: CommunicationService
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

    // Load the detailed consignor data
    this.http.get<ApiResponse<ConsignorDetailDto>>(`${environment.apiUrl}/api/consignors/${this.providerId()}`).subscribe({
      next: (response) => {
        const detailDto = response.data;
        this.consignorDetails.set(detailDto);

        // Transform for backward compatibility with existing UI
        const consignor: Consignor = {
          id: detailDto.consignorId,
          name: detailDto.fullName,
          email: detailDto.email || '',
          phone: detailDto.phone,
          address: detailDto.fullAddress,
          commissionRate: detailDto.commissionRate,
          preferredPaymentMethod: detailDto.preferredPaymentMethod,
          paymentDetails: detailDto.paymentDetails,
          notes: detailDto.notes,
          status: this.mapApiStatusToConsignorStatus(detailDto.status),
          organizationId: 1, // Will be handled by backend
          consignorNumber: detailDto.consignorNumber,
          createdAt: new Date(detailDto.createdAt),
          updatedAt: new Date(detailDto.updatedAt),
          activatedAt: detailDto.approvalDate ? new Date(detailDto.approvalDate) : undefined
        };
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
    const status = this.agreementStatus();

    // If an agreement is already uploaded, show confirmation dialog
    if (status?.status === 'uploaded' || status?.method === 'consignor_upload') {
      this.confirmationDialog.confirmAction(
        'Replace Agreement Document',
        'An agreement document is already on file. Upload a new document to replace it?',
        'Upload New Document'
      ).subscribe(result => {
        if (result.confirmed) {
          this.proceedWithUpload();
        }
      });
    } else {
      this.proceedWithUpload();
    }
  }

  private proceedWithUpload(): void {
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

  formatPhoneNumber(phone: string | undefined): string {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Format as (XXX)XXX-XXXX if we have 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // Return original if not 10 digits
    return phone;
  }

  private mapApiStatusToConsignorStatus(apiStatus: string): ConsignorStatus {
    switch (apiStatus.toLowerCase()) {
      case 'active': return 'active';
      case 'invited': return 'invited';
      case 'inactive': return 'inactive';
      case 'suspended': return 'suspended';
      case 'closed': return 'closed';
      case 'pending': return 'pending';
      default: return 'inactive';
    }
  }

  textContactInfo(): void {
    const consignor = this.consignor();
    const consignorDetails = this.consignorDetails();

    if (!consignor || !consignorDetails) {
      console.error('No consignor data available');
      return;
    }

    this.isSendingContactInfo.set(true);

    // Prepare contact info with detailed address if available
    const contactInfo = {
      consignorId: consignor.id,
      email: consignor.email,
      phone: consignorDetails.phone,
      address: this.formatFullAddress(consignorDetails)
    };

    this.communicationService.sendContactInfoToOwner(consignor.name, contactInfo).subscribe({
      next: (response) => {
        this.showToast('Contact info sent to owner successfully');
      },
      error: (error) => {
        console.error('Error sending contact info:', error);
        this.errorMessage.set('Failed to send contact info. Please try again.');
      },
      complete: () => {
        this.isSendingContactInfo.set(false);
      }
    });
  }

  private formatFullAddress(details: ConsignorDetailDto): string {
    if (details.addressLine1) {
      let address = details.addressLine1;
      if (details.addressLine2) {
        address += `\n${details.addressLine2}`;
      }
      if (details.city || details.state || details.postalCode) {
        address += '\n';
        if (details.city) {
          address += details.city;
        }
        if (details.city && details.state) {
          address += ', ';
        }
        if (details.state) {
          address += details.state;
        }
        if (details.postalCode) {
          address += ` ${details.postalCode}`;
        }
      }
      return address;
    }
    return details.fullAddress || '';
  }

  goBack(): void {
    this.location.back();
  }
}