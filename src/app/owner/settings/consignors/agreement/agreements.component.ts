import { Component, OnInit, signal, computed, effect, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AgreementService, AgreementSettings } from '../../../../services/agreement.service';
import { ConsignorService } from '../../../../services/consignor.service';
import { ConsignorOnboardingSettings } from '../../../../models/consignor.models';
import { AgreementTemplate } from '../../../../models/agreements.models';
import { toSignal } from '@angular/core/rxjs-interop';

interface LocalAgreementTemplate {
  id: string;
  content: string;
  isCustomized: boolean;
  lastModified: Date;
  metaTags: string[];
}


@Component({
  selector: 'app-agreements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agreements.component.html',
  styleUrls: ['./agreements.component.scss']
})
export class AgreementsComponent implements OnInit {
  template = signal<LocalAgreementTemplate | null>(null);
  templateContent = signal('');
  isEditing = signal(false);

  subtitleText = 'Set up your agreement template using placeholders like <strong>{{consignorName}}</strong> and <strong>{{commissionRate}}</strong> that automatically populate with each consignor\'s details. We\'ll help you generate, distribute, and track signed agreements.';
  isSaving = signal(false);
  isUploading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  viewMode = signal<'sample' | 'agreement' | 'keywords'>('sample');
  hasCustomTemplate = computed(() => {
    const template = this.template();
    return template?.isCustomized === true;
  });
  onboardingSettings = signal<ConsignorOnboardingSettings | null>(null);
  isTemplateEditingEnabled = computed(() => {
    const settings = this.onboardingSettings();
    return settings?.agreementRequirement !== 'none';
  });

  shouldShowTemplateRequiredError = computed(() => {
    const onboardingSettings = this.onboardingSettings();

    // Show error if agreements are required but no template is uploaded
    return onboardingSettings?.agreementRequirement !== 'none' &&
           onboardingSettings?.agreementRequirement !== undefined &&
           !this.hasCustomTemplate();
  });


  // Use the agreement service - initialized in constructor
  settings!: Signal<AgreementSettings | null>;

  metaTagsHelp = [
    { tag: '{{SHOP_NAME}}', description: 'Your shop\'s business name' },
    { tag: '{{SHOP_ADDRESS}}', description: 'Your shop\'s physical address' },
    { tag: '{{CONSIGNOR_NAME}}', description: 'The consignor\'s full name' },
    { tag: '{{CONSIGNOR_EMAIL}}', description: 'The consignor\'s email address' },
    { tag: '{{COMMISSION_PERCENT}}', description: 'Shop commission percentage' },
    { tag: '{{CONSIGNOR_PERCENT}}', description: 'Consignor\'s percentage' },
    { tag: '{{CONSIGNMENT_PERIOD}}', description: 'How long items stay on sale (days)' },
    { tag: '{{RETRIEVAL_PERIOD}}', description: 'How long to pick up unsold items (days)' },
    { tag: '{{UNSOLD_POLICY}}', description: 'What happens to unclaimed items' },
    { tag: '{{CURRENT_DATE}}', description: 'Today\'s date' },
    { tag: '{{AGREEMENT_DATE}}', description: 'Date the agreement was generated' }
  ];

  keyWords = [
    { word: 'CONSIGNMENT', description: 'Items placed for sale on behalf of owner' },
    { word: 'COMMISSION', description: 'Shop percentage of sales price' },
    { word: 'SPLIT', description: 'Division of proceeds between shop and consignor' },
    { word: 'RETRIEVAL', description: 'Collection of unsold items' },
    { word: 'AGREEMENT', description: 'Contract between shop and consignor' },
    { word: 'CONSIGNOR', description: 'Person bringing items to sell' },
    { word: 'TERMS', description: 'Conditions and rules of consignment' },
    { word: 'LIABILITY', description: 'Legal responsibility for items' },
    { word: 'PERIOD', description: 'Length of time items remain for sale' },
    { word: 'PAYMENT', description: 'How and when consignor is paid' },
    { word: 'PRICING', description: 'Setting sale prices for items' },
    { word: 'MARKDOWN', description: 'Reducing prices over time' },
    { word: 'DONATION', description: 'Items given to charity if unclaimed' },
    { word: 'INVENTORY', description: 'List of items being consigned' },
    { word: 'RECEIPT', description: 'Documentation of items received' },
    { word: 'SIGNATURE', description: 'Legal confirmation of agreement' }
  ];

  // Computed properties for splitting keywords into two columns
  firstHalfKeywords = computed(() => {
    const midpoint = Math.ceil(this.metaTagsHelp.length / 2);
    return this.metaTagsHelp.slice(0, midpoint);
  });

  secondHalfKeywords = computed(() => {
    const midpoint = Math.ceil(this.metaTagsHelp.length / 2);
    return this.metaTagsHelp.slice(midpoint);
  });

  sampleTemplate = `CONSIGNMENT AGREEMENT - SAMPLE TEMPLATE
**IMPORTANT: CUSTOMIZE THIS TEMPLATE BEFORE USE**

This agreement is between {{SHOP_NAME}} ("Shop") located at {{SHOP_ADDRESS}} and {{CONSIGNOR_NAME}} ("Consignor") with email {{CONSIGNOR_EMAIL}}.

TERMS:
1. Commission Split: Shop retains {{COMMISSION_PERCENT}}%, Consignor receives {{CONSIGNOR_PERCENT}}%
2. Consignment Period: Items remain for sale for {{CONSIGNMENT_PERIOD}} days
3. Retrieval Period: Unsold items must be collected within {{RETRIEVAL_PERIOD}} days
4. Unclaimed Items: {{UNSOLD_POLICY}}

**SAMPLE CONTENT - REPLACE WITH YOUR LEGAL TERMS**

Agreement Date: {{AGREEMENT_DATE}}

Consignor Signature: _________________________ Date: _________

Shop Representative: _________________________ Date: _________

---
DISCLAIMER: This is sample content only and does not constitute legal advice.
Consult with an attorney to ensure your agreement meets local legal requirements.`;

  constructor(
    private agreementService: AgreementService,
    private consignorService: ConsignorService
  ) {
    this.settings = toSignal(this.agreementService.agreementSettings);

    // Ensure view mode consistency with hasCustomTemplate
    effect(() => {
      const hasCustom = this.hasCustomTemplate();
      const currentMode = this.viewMode();

      // If no custom template but view mode is 'agreement', switch to 'sample'
      if (!hasCustom && currentMode === 'agreement') {
        this.viewMode.set('sample');
      }
    });
  }

  ngOnInit() {
    this.loadOnboardingSettings();
    this.loadAgreementData();
  }

  async loadAgreementData() {
    await this.agreementService.loadAgreementSettings();
    await this.loadTemplate();
  }

  async loadOnboardingSettings() {
    try {
      const settings = await this.consignorService.getConsignorOnboardingSettings();
      this.onboardingSettings.set(settings);
    } catch (error) {
      console.error('Failed to load onboarding settings:', error);
    }
  }

  async loadTemplate() {
    try {
      // Get organization's agreement template ID from the Organization table
      const organizationTemplateId = await this.agreementService.getOrganizationAgreementTemplateId();
      const hasUploadedTemplate = organizationTemplateId != null;

      let content = this.sampleTemplate;

      // If there's an uploaded template, try to get its content
      if (hasUploadedTemplate) {
        try {
          content = await this.getAgreementTemplateContent(organizationTemplateId!);
        } catch (error) {
          console.warn('Could not load agreement template content:', error);
          // If we can't get the text content, try to download and extract it
          try {
            const blob = await this.agreementService.downloadAgreementTemplate(organizationTemplateId!);
            if (blob.type === 'text/plain' || blob.type.includes('text')) {
              content = await blob.text();
            } else {
              // For non-text files, use the sample template
              console.warn('Uploaded file is not a text file, showing sample template');
              content = this.sampleTemplate;
            }
          } catch (downloadError) {
            console.error('Could not download agreement template:', downloadError);
            // Last fallback to sample
            content = this.sampleTemplate;
          }
        }
      }

      // Create local template based on whether there's an uploaded file
      const localTemplate: LocalAgreementTemplate = {
        id: hasUploadedTemplate ? organizationTemplateId! : '1',
        content: content,
        isCustomized: hasUploadedTemplate,
        lastModified: new Date(),
        metaTags: this.metaTagsHelp.map(tag => tag.tag)
      };

      this.template.set(localTemplate);
      this.templateContent.set(localTemplate.content);

      // Set view mode based on whether custom template exists
      if (localTemplate.isCustomized) {
        this.viewMode.set('agreement');
      } else {
        this.viewMode.set('sample');
      }
    } catch (error) {
      this.showError('Failed to load agreement');
    }
  }

  startEditing() {
    this.isEditing.set(true);
    this.templateContent.set(this.template()?.content || '');
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.templateContent.set(this.template()?.content || '');
    this.clearMessages();
  }

  async saveTemplate() {
    if (!this.templateContent().trim()) {
      this.showError('Template content cannot be empty');
      return;
    }

    this.isSaving.set(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedTemplate = {
        ...this.template()!,
        content: this.templateContent(),
        isCustomized: true,
        lastModified: new Date()
      };

      this.template.set(updatedTemplate);
      this.isEditing.set(false);
    } catch (error) {
      this.showError('Failed to save agreement');
    } finally {
      this.isSaving.set(false);
    }
  }

  downloadSample() {
    const blob = new Blob([this.sampleTemplate], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-consignment-agreement.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  }

  downloadTemplate() {
    const content = this.template()?.content || '';
    if (!content.trim()) {
      this.showError('No agreement content to download');
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'consignment-agreement-template.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validate file type (PDF, TXT, RTF, HTML)
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/rtf',
      'application/rtf',
      'text/html',
      'text/htm'
    ];

    if (!allowedTypes.includes(file.type) && !this.isValidFileExtension(file.name)) {
      this.showError('Please select a PDF, TXT, RTF, or HTML file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showError('File size cannot exceed 5MB');
      return;
    }

    this.isUploading.set(true);

    try {
      // Upload the file using the agreement service
      const uploadedTemplate = await this.agreementService.uploadAgreementTemplate(file);

      // Update the onboarding settings to reference the new template
      // Note: This will need to be updated to use consignorService when the endpoint is available
      // await this.consignorService.updateConsignorOnboardingSettings({ agreementTemplateId: uploadedTemplate.id });

      // Update local state
      this.viewMode.set('agreement');

      // Reload both agreement settings and template to update the display
      await this.loadAgreementData();

      this.showSuccess('Agreement template uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      this.showError(error?.error || 'Failed to upload agreement template');
    } finally {
      this.isUploading.set(false);
      input.value = ''; // Clear the input
    }
  }

  insertMetaTag(tag: string) {
    const content = this.templateContent();
    this.templateContent.set(content + tag);
  }

  async resetToSample() {
    if (!confirm('Are you sure you want to reset to the sample template? This will overwrite your current template.')) {
      return;
    }

    this.templateContent.set(this.sampleTemplate);
  }

  setViewMode(mode: 'sample' | 'agreement' | 'keywords') {
    this.viewMode.set(mode);
  }

  getDisplayedContent(): string {
    if (this.viewMode() === 'sample') {
      return this.sampleTemplate;
    } else {
      // For uploaded agreements, show the actual template content
      return this.template()?.content || '';
    }
  }

  async downloadCurrentView() {
    if (this.viewMode() === 'sample' || this.viewMode() === 'keywords') {
      // For both sample view and keywords view, download the sample agreement
      this.downloadSample();
    } else {
      // Check if we have an uploaded PDF template
      const organizationTemplateId = await this.agreementService.getOrganizationAgreementTemplateId();
      if (organizationTemplateId) {
        await this.downloadPdfTemplate(organizationTemplateId);
      } else {
        this.downloadTemplate();
      }
    }
  }

  async downloadPdfTemplate(templateId: string) {
    try {
      const blob = await this.agreementService.downloadAgreementTemplate(templateId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agreement-template-${templateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      this.showError('Failed to download agreement template');
    }
  }

  async generatePdfFromTemplate() {
    if (!this.templateContent().trim()) {
      this.showError('Template content cannot be empty');
      return;
    }

    this.isSaving.set(true);
    try {
      // Generate PDF from text content on the server
      const pdfBlob = await this.agreementService.generatePdfFromText(this.templateContent());

      // Create a File object from the blob to upload
      const pdfFile = new File([pdfBlob], 'agreement-template.pdf', { type: 'application/pdf' });

      // Upload the generated PDF
      const uploadedTemplate = await this.agreementService.uploadAgreementTemplate(pdfFile);

      // Update the onboarding settings to reference the new template
      // Note: This will need to be updated to use consignorService when the endpoint is available
      // await this.consignorService.updateConsignorOnboardingSettings({ agreementTemplateId: uploadedTemplate.id });

      // Update local state
      this.viewMode.set('agreement');
      this.isEditing.set(false);

      // Reload both agreement settings and template to update the display
      await this.loadAgreementData();


    } catch (error: any) {
      console.error('PDF generation error:', error);
      this.showError(error?.error || 'Failed to generate PDF from template');
    } finally {
      this.isSaving.set(false);
    }
  }


  async deleteTemplate() {
    if (!confirm('Are you sure you want to delete the uploaded agreement template? This action cannot be undone.')) {
      return;
    }

    this.isSaving.set(true);
    try {
      const templateId = await this.agreementService.getOrganizationAgreementTemplateId();

      if (!templateId) {
        this.showError('No agreement template to delete');
        return;
      }

      // Delete the template file
      await this.agreementService.deleteAgreementTemplate(templateId);

      // The delete API call should automatically clear the Organization.AgreementTemplateId field

      // Reset local state
      this.viewMode.set('sample');

      // Reload both agreement settings and template to update the display
      await this.loadAgreementData();


    } catch (error: any) {
      console.error('Delete error:', error);
      this.showError(error?.error || 'Failed to delete agreement template');
    } finally {
      this.isSaving.set(false);
    }
  }

  getDownloadTooltip(): string {
    if (this.viewMode() === 'sample' || this.viewMode() === 'keywords') {
      return 'Download Sample';
    } else {
      return 'Download Agreement';
    }
  }


  private validateTemplate(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required meta tags
    if (!content.includes('{{SHOP_NAME}}')) {
      errors.push('Template should include {{SHOP_NAME}} tag');
    }

    if (!content.includes('{{CONSIGNOR_NAME}}')) {
      errors.push('Template should include {{CONSIGNOR_NAME}} tag');
    }

    // Check if still contains sample markers
    if (content.includes('**IMPORTANT: CUSTOMIZE THIS TEMPLATE BEFORE USE**')) {
      errors.push('Please remove sample template markers');
    }

    if (content.includes('**SAMPLE CONTENT - REPLACE WITH YOUR LEGAL TERMS**')) {
      errors.push('Please replace sample content with your actual terms');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }



  private isValidFileExtension(fileName: string): boolean {
    const allowedExtensions = ['.pdf', '.txt', '.rtf', '.html', '.htm'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return allowedExtensions.includes(fileExtension);
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

  private clearMessages() {
    this.errorMessage.set('');
  }

  // Get agreement template content as text
  private async getAgreementTemplateContent(templateId: string): Promise<string> {
    try {
      // First try to get the template as text if there's an API endpoint for it
      const response = await this.agreementService.getAgreementTemplateAsText(templateId);
      return response;
    } catch (error) {
      // If no text endpoint exists, try to download and extract text from file
      const blob = await this.agreementService.downloadAgreementTemplate(templateId);

      // For text files, we can read them directly
      if (blob.type === 'text/plain' || blob.type === 'text/html' || blob.type.includes('text')) {
        return await blob.text();
      } else {
        // For PDFs and other binary formats, we can't display inline
        // But instead of showing a useless message, throw an error so we fall back to sample
        throw new Error('Binary file cannot be displayed as text');
      }
    }
  }
}