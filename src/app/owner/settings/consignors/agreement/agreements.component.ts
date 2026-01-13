import { Component, OnInit, signal, computed, effect, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SettingsService, OrganizationSettings, AgreementTemplate, ConsignorOnboardingSettings } from '../../../../services/settings.service';
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
  isSaving = signal(false);
  isUploading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  viewMode = signal<'sample' | 'agreement'>('sample');
  hasCustomTemplate = signal(false);
  onboardingSettings = signal<ConsignorOnboardingSettings | null>(null);
  isTemplateEditingEnabled = computed(() => {
    const settings = this.onboardingSettings();
    return settings?.agreementRequirement !== 'none';
  });

  showAgreementRequiredError = computed(() => {
    const settings = this.settings();
    return settings?.requireSignedAgreement === true && !this.hasAgreementUploaded();
  });

  // Use the settings service - initialized in constructor
  settings!: Signal<OrganizationSettings | null>;

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

  constructor(private settingsService: SettingsService) {
    this.settings = toSignal(this.settingsService.settings);
  }

  ngOnInit() {
    this.loadTemplate();
    this.loadSettings();
    this.loadOnboardingSettings();
  }

  async loadSettings() {
    await this.settingsService.loadSettings();
    // Reload template after settings are loaded to update hasCustomTemplate state
    await this.loadTemplate();
  }

  async loadOnboardingSettings() {
    try {
      const settings = await this.settingsService.getConsignorOnboardingSettings();
      this.onboardingSettings.set(settings);
    } catch (error) {
      console.error('Failed to load onboarding settings:', error);
    }
  }

  async loadTemplate() {
    try {
      // Check if there's an uploaded template from settings
      const settings = this.settings();
      const hasUploadedTemplate = settings?.agreementTemplateId != null;

      // Create local template based on whether there's an uploaded file
      const localTemplate: LocalAgreementTemplate = {
        id: hasUploadedTemplate ? settings!.agreementTemplateId! : '1',
        content: this.sampleTemplate,
        isCustomized: hasUploadedTemplate,
        lastModified: new Date(),
        metaTags: this.metaTagsHelp.map(tag => tag.tag)
      };

      this.template.set(localTemplate);
      this.templateContent.set(localTemplate.content);
      this.hasCustomTemplate.set(localTemplate.isCustomized);

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
      this.showSuccess('Agreement saved successfully');
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

    this.showSuccess('Sample agreement downloaded');
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

    this.showSuccess('Agreement downloaded');
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
      // Upload the file using the settings service
      const uploadedTemplate = await this.settingsService.uploadAgreementTemplate(file);

      // Update the settings to reference the new template
      this.settingsService.updateSetting('agreementTemplateId', uploadedTemplate.id);

      // Update local state
      this.hasCustomTemplate.set(true);
      this.viewMode.set('agreement');

      // Reload the template to update the display
      await this.loadTemplate();

      this.showSuccess(`Agreement template "${uploadedTemplate.fileName}" uploaded successfully`);

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
    this.showSuccess('Agreement reset to sample');
  }

  setViewMode(mode: 'sample' | 'agreement') {
    this.viewMode.set(mode);
  }

  getDisplayedContent(): string {
    if (this.viewMode() === 'sample') {
      return this.sampleTemplate;
    } else {
      // If we have an uploaded PDF template, show a message instead of content
      const settings = this.settings();
      if (settings?.agreementTemplateId) {
        return `PDF Agreement Template Uploaded

Your custom consignment agreement PDF template has been uploaded successfully.

Template ID: ${settings.agreementTemplateId}

To view or edit the agreement template, download the PDF file using the download button above.

This PDF template will be used when generating agreements for new consignors.`;
      }
      return this.template()?.content || '';
    }
  }

  async downloadCurrentView() {
    if (this.viewMode() === 'sample') {
      this.downloadSample();
    } else {
      // Check if we have an uploaded PDF template
      const settings = this.settings();
      if (settings?.agreementTemplateId) {
        await this.downloadPdfTemplate(settings.agreementTemplateId);
      } else {
        this.downloadTemplate();
      }
    }
  }

  async downloadPdfTemplate(templateId: string) {
    try {
      const blob = await this.settingsService.downloadAgreementTemplate(templateId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agreement-template-${templateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.showSuccess('Agreement template downloaded');
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
      const pdfBlob = await this.settingsService.generatePdfFromText(this.templateContent());

      // Create a File object from the blob to upload
      const pdfFile = new File([pdfBlob], 'agreement-template.pdf', { type: 'application/pdf' });

      // Upload the generated PDF
      const uploadedTemplate = await this.settingsService.uploadAgreementTemplate(pdfFile);

      // Update the settings to reference the new template
      this.settingsService.updateSetting('agreementTemplateId', uploadedTemplate.id);

      // Update local state
      this.hasCustomTemplate.set(true);
      this.viewMode.set('agreement');
      this.isEditing.set(false);

      // Reload the template to update the display
      await this.loadTemplate();

      this.showSuccess('Agreement PDF generated and uploaded successfully');

    } catch (error: any) {
      console.error('PDF generation error:', error);
      this.showError(error?.error || 'Failed to generate PDF from template');
    } finally {
      this.isSaving.set(false);
    }
  }

  async sendSampleAgreement() {
    this.isSaving.set(true);
    try {
      // Get the current template content (either from editor or current template)
      const contentToSend = this.isEditing()
        ? this.templateContent()
        : this.template()?.content || this.sampleTemplate;

      if (!contentToSend.trim()) {
        this.showError('No agreement content to send');
        return;
      }

      // Send sample agreement notification
      await this.settingsService.sendSampleAgreement(contentToSend);

      this.showSuccess('Sample agreement sent to your notifications! Check your notifications panel to view it.');

    } catch (error: any) {
      console.error('Sample agreement error:', error);
      this.showError(error?.error || 'Failed to send sample agreement');
    } finally {
      this.isSaving.set(false);
    }
  }

  getDownloadTooltip(): string {
    if (this.viewMode() === 'sample') {
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

  // Check if agreement is uploaded
  hasAgreementUploaded(): boolean {
    const settings = this.settings();
    return settings?.agreementTemplateId != null;
  }

  // Settings change handlers
  onRequireSignedChange(checked: boolean): void {
    this.settingsService.updateSetting('requireSignedAgreement', checked);
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
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}