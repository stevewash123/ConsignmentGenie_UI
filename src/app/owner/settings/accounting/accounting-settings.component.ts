import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingSettingsService } from '../../../services/accounting-settings.service';
import { AccountingSettings } from '../../../models/business.models';

@Component({
  selector: 'app-accounting-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting-settings.component.html',
  styleUrls: ['./accounting-settings.component.scss']
})
export class AccountingSettingsComponent implements OnInit {
  settings = signal<AccountingSettings | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  recipientsText = '';

  constructor(private accountingSettingsService: AccountingSettingsService) {}

  ngOnInit() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      await this.accountingSettingsService.loadAccountingSettings();
      const settings = this.accountingSettingsService.getCurrentAccountingSettings();
      if (settings) {
        this.settings.set(settings);
        this.updateRecipientsText();
      } else {
        // Use defaults if no settings exist
        const defaultSettings: AccountingSettings = {
          quickBooks: {
            isConnected: false,
            autoSync: false,
            syncFrequency: 'weekly'
          },
          reports: {
            emailReports: false,
            reportFrequency: 'monthly',
            recipients: []
          },
          exports: {
            format: 'csv',
            includeConsignorDetails: true,
            includeTaxBreakdown: true
          }
        };
        this.settings.set(defaultSettings);
        this.updateRecipientsText();
      }
    } catch (error) {
      console.error('Error loading accounting settings:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  saveSettings() {
    this.isSaving.set(true);
    try {
      this.accountingSettingsService.updateAccountingSettings(this.settings()!);
      console.log('Saving accounting settings:', this.settings());
    } catch (error) {
      console.error('Error saving accounting settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  connectQuickBooks() {
    // Mock connection - in real app, initiate OAuth flow
    const currentSettings = this.settings()!;
    currentSettings.quickBooks.isConnected = true;
    currentSettings.quickBooks.companyId = 'QB-12345';
    currentSettings.quickBooks.companyName = 'My Consignment Shop';
    this.settings.set({ ...currentSettings });
  }

  disconnectQuickBooks() {
    const currentSettings = this.settings()!;
    currentSettings.quickBooks.isConnected = false;
    currentSettings.quickBooks.companyId = undefined;
    currentSettings.quickBooks.companyName = undefined;
    this.settings.set({ ...currentSettings });
  }

  updateRecipients(text: string) {
    this.recipientsText = text;
    const currentSettings = this.settings()!;
    currentSettings.reports.recipients = text.split('\n').filter(email => email.trim());
    this.settings.set({ ...currentSettings });
  }

  private updateRecipientsText() {
    if (this.settings()?.reports.recipients) {
      this.recipientsText = this.settings()!.reports.recipients.join('\n');
    }
  }

  exportFinancialData() {
    // Mock export - in real app, trigger export download
    console.log('Exporting financial data with format:', this.settings()?.exports.format);
    // Export would trigger download here
  }
}