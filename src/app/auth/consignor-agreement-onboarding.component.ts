import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  uploadNotes = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private consignorService: ConsignorPortalService
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
    try {
      const status = await this.consignorService.getAgreementStatus().toPromise();

      this.agreementStatus.set(status || { required: false, type: 'none', status: 'completed' });

      if (!status?.required) {
        // No agreement required, proceed to dashboard
        this.proceedToDashboard();
        return;
      }

      if (status.status === 'completed') {
        // Agreement already completed, proceed to dashboard
        this.proceedToDashboard();
        return;
      }

      if (status.type === 'acknowledge') {
        await this.loadTermsText();
      }
    } catch (error: any) {
      console.error('Error loading agreement status:', error);
      this.errorMessage.set('Failed to load agreement requirements');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadTermsText(): Promise<void> {
    try {
      // Get organization settings to fetch acknowledge terms text
      // This would need to be implemented - for now using placeholder
      const termsText = `By joining our consignment program, you agree to the following terms:

1. Commission Rate: Items will be sold at the agreed commission rate
2. Consignment Period: Items will remain on sale for the agreed period
3. Retrieval Policy: Unsold items must be retrieved within the specified timeframe
4. Item Condition: All items must meet our quality standards
5. Payment Terms: Payments will be processed according to our payout schedule

Please review these terms carefully and click to acknowledge your agreement.`;

      this.acknowledgeTermsText.set(termsText);
    } catch (error) {
      console.error('Error loading terms text:', error);
      this.acknowledgeTermsText.set('Error loading terms. Please try again.');
    }
  }

  async submitAgreement(): Promise<void> {
    if (!this.isTermsAccepted()) {
      this.errorMessage.set('Please accept the terms to continue');
      return;
    }

    const agreementType = this.agreementStatus()?.type;

    if (agreementType === 'acknowledge') {
      await this.acknowledgeTerms();
    } else if (agreementType === 'upload') {
      await this.uploadAgreement();
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
  }

  private async uploadAgreement(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please select a file to upload');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set('');
    this.uploadProgress.set(0);

    try {
      await this.consignorService.uploadAgreement(file, this.uploadNotes).toPromise();

      this.uploadProgress.set(100);
      this.successMessage.set('Agreement uploaded successfully');

      // Wait a moment to show success message, then proceed
      setTimeout(() => {
        this.proceedToDashboard();
      }, 1500);
    } catch (error: any) {
      console.error('Error uploading agreement:', error);
      this.errorMessage.set(error.error?.message || 'Failed to upload agreement. Please try again.');
    } finally {
      this.isProcessing.set(false);
      this.uploadProgress.set(0);
    }
  }

  async downloadTemplate(): Promise<void> {
    try {
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
      this.errorMessage.set('Template download not available');
    }
  }

  skipForNow(): void {
    // Mark as skipped and proceed to dashboard with pending state
    this.proceedToDashboard();
  }

  private proceedToDashboard(): void {
    this.router.navigate(['/consignor/dashboard']);
  }
}