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
  styles: [`
    .accounting-settings {
      padding: 2rem;
      max-width: 900px;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .settings-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .settings-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .form-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 0.5rem;
    }

    .integration-status {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .integration-status.connected {
      background: #f0fdf4;
      border-color: #16a34a;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #dc2626;
    }

    .status-dot.active {
      background: #16a34a;
    }

    .status-text {
      font-weight: 500;
      color: #374151;
    }

    .connection-info p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-select, .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }

    .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-help {
      color: #6b7280;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
      margin: 0;
      width: 16px;
      height: 16px;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .sync-settings, .report-config {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }
  `]
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