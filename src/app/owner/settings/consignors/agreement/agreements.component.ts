import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, OrganizationSettings } from '../../../../services/settings.service';
import { toSignal } from '@angular/core/rxjs-interop';

interface AgreementTemplate {
  id: string;
  content: string;
  isCustomized: boolean;
  lastModified: Date;
  metaTags: string[];
}


@Component({
  selector: 'app-agreements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agreements.component.html',
  styleUrls: ['./agreements.component.scss']
})
export class AgreementsComponent implements OnInit {
  template = signal<AgreementTemplate | null>(null);
  templateContent = signal('');
  isEditing = signal(false);
  isSaving = signal(false);
  isUploading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  viewMode = signal<'sample' | 'agreement'>('sample');
  hasCustomTemplate = signal(false);

  // Use the settings service
  settings = toSignal(this.settingsService.settings);

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

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this.loadTemplate();
    this.loadSettings();
  }

  async loadSettings() {
    await this.settingsService.loadSettings();
  }

  async loadTemplate() {
    try {
      // TODO: Replace with actual API call
      const mockTemplate: AgreementTemplate = {
        id: '1',
        content: this.sampleTemplate,
        isCustomized: false,
        lastModified: new Date(),
        metaTags: this.metaTagsHelp.map(tag => tag.tag)
      };

      this.template.set(mockTemplate);
      this.templateContent.set(mockTemplate.content);
      this.hasCustomTemplate.set(mockTemplate.isCustomized);

      // Set view mode based on whether custom template exists
      if (mockTemplate.isCustomized) {
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      this.showError('Please select a text file (.txt)');
      return;
    }

    this.isUploading.set(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (content) {
          this.templateContent.set(content);

          // Update template object
          const updatedTemplate = {
            ...this.template()!,
            content: content,
            isCustomized: true,
            lastModified: new Date()
          };
          this.template.set(updatedTemplate);

          // Enable agreement view and switch to it
          this.hasCustomTemplate.set(true);
          this.viewMode.set('agreement');

          this.showSuccess('Agreement file loaded successfully');
        }
      } catch (error) {
        this.showError('Failed to read agreement file');
      } finally {
        this.isUploading.set(false);
        input.value = ''; // Clear the input
      }
    };

    reader.onerror = () => {
      this.showError('Failed to read agreement file');
      this.isUploading.set(false);
      input.value = '';
    };

    reader.readAsText(file);
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
      return this.template()?.content || '';
    }
  }

  downloadCurrentView() {
    if (this.viewMode() === 'sample') {
      this.downloadSample();
    } else {
      this.downloadTemplate();
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

  // Settings change handlers
  onAutoSendChange(checked: boolean): void {
    this.settingsService.updateSetting('autoSendAgreementOnRegister', checked);
  }

  onRequireSignedChange(checked: boolean): void {
    this.settingsService.updateSetting('requireSignedAgreement', checked);
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