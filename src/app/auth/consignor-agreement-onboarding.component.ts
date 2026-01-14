import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ConsignorPortalService } from '../consignor/services/consignor-portal.service';

interface AgreementStatus {
  required: boolean;
  type: 'none' | 'acknowledge' | 'upload';
  status: 'pending' | 'completed';
  completedAt?: string;
}

@Component({
  selector: 'app-consignor-agreement-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consignor-agreement-onboarding.component.html',
  styleUrls: ['./consignor-agreement-onboarding.component.scss']
})
export class ConsignorAgreementOnboardingComponent implements OnInit {
  agreementStatus = signal<AgreementStatus | null>(null);
  acknowledgeTermsText = signal<string>('');
  isLoading = signal(false);
  isProcessing = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isTermsAccepted = signal(false);
  shopName = signal('');

  // For file upload mode
  selectedFile = signal<File | null>(null);
  uploadProgress = signal(0);
  isAgreementUploaded = signal(false);
  isDragOver = signal(false);
  isDownloading = signal(false);

  private hasRedirected = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private consignorService: ConsignorPortalService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Get shop name from query params if available
    this.route.queryParams.subscribe(params => {
      if (params['shopName']) {
        this.shopName.set(params['shopName']);
      }
    });

    this.loadAgreementStatus();
  }

  private async loadAgreementStatus(): Promise<void> {
    this.isLoading.set(true);
    console.log('=== CONSIGNOR AGREEMENT ONBOARDING DEBUG ===');

    try {
      const status = await this.consignorService.getAgreementStatus().toPromise();
      console.log('Raw agreement status API response:', status);

      // Map our API response format to the expected interface format
      const apiStatus = status?.agreementStatus?.toLowerCase();
      const mappedStatusValue: 'pending' | 'completed' = (['uploaded', 'approved'].includes(apiStatus) ? 'completed' :
                                apiStatus === 'not_required' ? 'completed' : 'pending');

      const mappedStatus: AgreementStatus = {
        required: status?.requiresAgreement || false,
        type: (status?.agreementMethod as 'none' | 'acknowledge' | 'upload') || 'none',
        status: mappedStatusValue,
        completedAt: status?.completedAt
      };

      console.log('Mapped status object:', mappedStatus);
      this.agreementStatus.set(mappedStatus);

      // Check if we should redirect back to dashboard
      // Only redirect if agreement is not required OR already completed
      const returnTo = this.route.snapshot.queryParams['returnTo'];
      console.log('Return to query param:', returnTo);

      const shouldRedirect = !mappedStatus.required || mappedStatus.status === 'completed';
      console.log('Should redirect check:', {
        notRequired: !mappedStatus.required,
        isCompleted: mappedStatus.status === 'completed',
        shouldRedirect,
        hasRedirected: this.hasRedirected
      });

      // Remove the returnTo requirement - always redirect if agreement is complete or not required
      if (shouldRedirect && !this.hasRedirected) {
        console.log('🚀 REDIRECTING TO DASHBOARD');
        console.log('Reason: Agreement not required or completed');
        this.hasRedirected = true;
        this.proceedToDashboard();
        return;
      }

      // If agreement is not required, show appropriate message
      if (!mappedStatus.required) {
        console.log('⚠️ Agreement not required - staying on page');
        this.errorMessage.set('No agreement is currently required for your account.');
        await this.loadTermsText();
        return;
      }

      console.log('✋ Agreement required and not completed - loading terms');
      // Always load terms text regardless of agreement type
      await this.loadTermsText();
    } catch (error: any) {
      console.error('Error loading agreement status:', error);
      this.errorMessage.set('Failed to load agreement requirements');
      // Still try to load terms text even if status call fails
      await this.loadTermsText();
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadTermsText(): Promise<void> {
    console.log('Loading terms text...');
    try {
      const response = await this.consignorService.getAgreementText().toPromise();
      console.log('Terms text response:', response);

      if (response?.text) {
        console.log('Setting agreement text from API');
        this.acknowledgeTermsText.set(response.text);
      } else {
        console.log('No agreement text from API');
        this.toastr.error('No agreement text configured for this organization', 'Agreement Not Available');
        this.acknowledgeTermsText.set('Agreement text not available. Please contact support.');
      }
    } catch (error) {
      console.error('Error loading terms text:', error);
      this.toastr.error('Failed to load agreement text. Please try refreshing the page.', 'Connection Error');
      this.acknowledgeTermsText.set('Failed to load agreement text. Please refresh the page or contact support.');
    }
  }

  async continueToApp(): Promise<void> {
    if (!this.isTermsAccepted()) {
      this.errorMessage.set('Please accept the terms to continue');
      return;
    }

    const agreementType = this.agreementStatus()?.type;

    if (agreementType === 'acknowledge') {
      await this.acknowledgeTerms();
    } else if (agreementType === 'upload') {
      if (!this.isAgreementUploaded()) {
        this.errorMessage.set('Please upload your signed agreement first');
        return;
      }
      this.proceedToDashboard();
    }
  }

  private async acknowledgeTerms(): Promise<void> {
    this.isProcessing.set(true);
    this.errorMessage.set('');

    try {
      await this.consignorService.acknowledgeAgreement().toPromise();

      this.successMessage.set('Terms acknowledged successfully');

      // Wait a moment to show success message, then proceed
      setTimeout(() => {
        this.proceedToDashboard();
      }, 1500);
    } catch (error: any) {
      console.error('Error acknowledging terms:', error);
      this.errorMessage.set(error.error?.message || 'Failed to acknowledge terms. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage.set('Please select a PDF, PNG, or JPG file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('File size must be less than 10MB');
      return;
    }

    this.selectedFile.set(file);
    this.errorMessage.set('');
  }

  async uploadAgreement(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please select a file to upload');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set('');
    this.uploadProgress.set(0);

    try {
      await this.consignorService.uploadAgreement(file).toPromise();

      this.uploadProgress.set(100);
      this.isAgreementUploaded.set(true);
      this.successMessage.set('Agreement uploaded successfully! Redirecting to dashboard...');

      // Clear processing state and redirect to dashboard
      setTimeout(() => {
        this.isProcessing.set(false);
        this.uploadProgress.set(0);
        this.proceedToDashboard();
      }, 1500);
    } catch (error: any) {
      console.error('Error uploading agreement:', error);
      this.errorMessage.set(error.error?.message || 'Failed to upload agreement. Please try again.');
      this.isProcessing.set(false);
      this.uploadProgress.set(0);
    }
  }

  async downloadTemplate(): Promise<void> {
    this.isDownloading.set(true);
    try {
      // First try to download the PDF template from the API
      const response = await this.consignorService.downloadAgreementTemplate().toPromise();

      if (response) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'consignment-agreement.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Error downloading template:', error);

      // Fallback: Generate a simple text document with the agreement text
      try {
        const agreementText = this.acknowledgeTermsText();
        if (agreementText) {
          const blob = new Blob([agreementText], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'consignment-agreement.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          this.errorMessage.set('Agreement template not available');
        }
      } catch (fallbackError) {
        console.error('Error creating fallback download:', fallbackError);
        this.errorMessage.set('Template download not available');
      }
    } finally {
      this.isDownloading.set(false);
    }
  }


  private proceedToDashboard(): void {
    this.router.navigate(['/consignor/dashboard']);
  }
}