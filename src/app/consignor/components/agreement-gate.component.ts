import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgreementService, AgreementStatusDto, ConsignorAgreementUploadDto } from '../../shared/services/agreement.service';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ConsignorProfile } from '../models/consignor.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-agreement-gate',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agreement-gate.component.html',
  styleUrls: ['./agreement-gate.component.scss']
})
export class AgreementGateComponent implements OnInit {
  private readonly agreementService = inject(AgreementService);
  private readonly consignorService = inject(ConsignorPortalService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  agreementStatus: any = null;
  consignorProfile: ConsignorProfile | null = null;
  selectedFile: File | null = null;
  isUploading = false;
  uploadError: string | null = null;
  uploadSuccess: string | null = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadAgreementStatus();
  }

  private async loadAgreementStatus() {
    try {
      console.log('=== AGREEMENT GATE DEBUG ===');
      console.log('Loading agreement status...');

      // Get the agreement status using the consignor portal service
      const agreementStatus = await this.consignorService.getAgreementStatus().toPromise();

      console.log('Raw API response:', agreementStatus);
      console.log('Agreement properties check:');
      console.log('- requiresAgreement:', agreementStatus?.requiresAgreement);
      console.log('- agreementStatus:', agreementStatus?.agreementStatus);
      console.log('- hasAgreement:', agreementStatus?.hasAgreement);
      console.log('- agreementMethod:', agreementStatus?.agreementMethod);

      // Fix property name mapping - our API returns different property names
      const isRequired = agreementStatus?.requiresAgreement;
      const status = agreementStatus?.agreementStatus;
      const hasAgreement = agreementStatus?.hasAgreement;

      console.log('Processed values:');
      console.log('- isRequired:', isRequired);
      console.log('- status:', status);
      console.log('- hasAgreement:', hasAgreement);

      // Check for completed agreement status
      const completedStatuses = ['uploaded', 'approved', 'completed'];
      const isCompleted = completedStatuses.includes(status);

      console.log('Completion check:');
      console.log('- completedStatuses:', completedStatuses);
      console.log('- isCompleted:', isCompleted);
      console.log('- shouldRedirect:', !isRequired || isCompleted);

      // If agreement is not required or already completed, redirect to dashboard
      if (!isRequired || isCompleted) {
        console.log('🚀 REDIRECTING TO DASHBOARD');
        console.log('Reason: Agreement not required or already completed');
        console.log('- Not required:', !isRequired);
        console.log('- Is completed:', isCompleted);
        this.router.navigate(['/consignor/dashboard']);
        return;
      }

      console.log('✋ STAYING ON AGREEMENT PAGE - Agreement required and not completed');

      // Store the status (even though it's a different type than AgreementStatusDto)
      this.agreementStatus = agreementStatus;

      // Also get consignor profile for display purposes
      this.consignorProfile = await this.consignorService.getProfile().toPromise();
      console.log('Consignor profile loaded:', this.consignorProfile);
    } catch (err: any) {
      this.error = 'Failed to load agreement status';
      console.error('Agreement status error:', err);
    } finally {
      this.isLoading = false;
      console.log('=== AGREEMENT GATE DEBUG END ===');
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.uploadError = 'File size cannot exceed 10MB';
        this.selectedFile = null;
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type.toLowerCase())) {
        this.uploadError = 'File type not supported. Please upload PDF, image, text, or Word document';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.uploadError = null;
    }
  }

  async uploadAgreement() {
    if (!this.selectedFile || !this.consignorProfile?.consignorId || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.uploadError = null;
    this.uploadSuccess = null;

    try {
      const uploadResult = await this.agreementService.uploadAgreement({
        consignorId: this.consignorProfile.consignorId,
        agreementFile: this.selectedFile
      }).toPromise();

      if (uploadResult) {
        this.uploadSuccess = 'Agreement uploaded successfully! AI verification in progress...';
        this.selectedFile = null;

        // Clear file input
        const fileInput = document.getElementById('agreement-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Reload agreement status after successful upload
        setTimeout(() => {
          this.loadAgreementStatus();
          this.uploadSuccess = null;
        }, 3000);
      }
    } catch (err: any) {
      this.uploadError = err.error?.message || 'Failed to upload agreement. Please try again.';
      console.error('Upload error:', err);
    } finally {
      this.isUploading = false;
    }
  }

  getStatusMessage(): string {
    if (!this.agreementStatus) return '';

    switch (this.agreementStatus.status) {
      case 'approved':
        return 'Your agreement has been approved! You can now submit items for consignment.';
      case 'pending_review':
        return 'Your agreement is under review. We\'ll notify you once it\'s approved.';
      case 'rejected':
        return 'Your agreement was rejected. Please upload a new signed agreement.';
      case 'not_required':
        return 'No agreement required for this shop.';
      default:
        return 'Please upload a signed consignment agreement to begin submitting items.';
    }
  }

  getStatusClass(): string {
    if (!this.agreementStatus) return '';

    switch (this.agreementStatus.status) {
      case 'approved':
        return 'status-approved';
      case 'pending_review':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-required';
    }
  }

  canUploadAgreement(): boolean {
    return this.agreementStatus?.agreementMethod === 'signed' &&
           ['', 'required', 'rejected'].includes(this.agreementStatus?.status || '');
  }

  showUploadForm(): boolean {
    return this.canUploadAgreement() && !this.isAgreementApproved();
  }

  isAgreementApproved(): boolean {
    return this.agreementStatus?.status === 'approved';
  }

  isAgreementRequired(): boolean {
    return this.agreementStatus?.requiredForItemSubmission === true;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  goToDashboard(): void {
    this.router.navigate(['/consignor/dashboard']);
  }
}