import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AccountingSettings {
  quickBooks: {
    isConnected: boolean;
    companyId?: string;
    companyName?: string;
    autoSync: boolean;
    syncFrequency: 'daily' | 'weekly' | 'manual';
  };
  reports: {
    emailReports: boolean;
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  exports: {
    format: 'csv' | 'xlsx' | 'pdf';
    includeConsignorDetails: boolean;
    includeTaxBreakdown: boolean;
  };
}

@Component({
  selector: 'app-accounting-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting-settings.component.html',
})
export class AccountingSettingsComponent implements OnInit {
  settings = signal<AccountingSettings | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  recipientsText = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSettings();
  }

  private loadSettings() {
    // Mock data for now - in real app, load from API
    setTimeout(() => {
      const mockSettings: AccountingSettings = {
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
      this.settings.set(mockSettings);
      this.updateRecipientsText();
      this.isLoading.set(false);
    }, 500);
  }

  saveSettings() {
    this.isSaving.set(true);

    // Mock save - in real app, send to API
    setTimeout(() => {
      console.log('Saving accounting settings:', this.settings());
      this.isSaving.set(false);
    }, 1000);
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
    alert('Financial data export would be downloaded here');
  }
}