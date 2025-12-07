import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ConsignorSettings {
  storeCode: string;
  autoApprove: boolean;
  signupUrl: string;
  inventoryPermissions: ConsignorInventoryPermissions;
}

interface ConsignorInventoryPermissions {
  canAddItems: boolean;
  canEditItems: boolean;
  canRemoveItems: boolean;
  canViewDetailedAnalytics: boolean;
}

interface PendingInvitation {
  id: string;
  email: string;
  sentAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

@Component({
  selector: 'app-consignor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="consignor-settings">
      <div class="settings-header">
        <h2>Consignor Settings</h2>
        <p>Manage how new consignors join your shop and configure approval settings</p>
      </div>

      <div class="settings-form" *ngIf="settings()">
        <!-- Store Code -->
        <div class="form-section">
          <h3>Store Code</h3>
          <p class="section-description">
            Share this code with consignors to let them join your shop.
          </p>

          <div class="store-code-display">
            <div class="code-box">
              <span class="store-code">{{ settings()?.storeCode }}</span>
            </div>
            <div class="code-actions">
              <button class="btn-secondary" (click)="copyStoreCode()">Copy Code</button>
              <button class="btn-secondary" (click)="regenerateStoreCode()">Regenerate</button>
            </div>
          </div>

          <div class="signup-link">
            <label>Direct signup link:</label>
            <div class="link-display">
              <span class="signup-url">{{ settings()?.signupUrl }}</span>
              <button class="btn-link" (click)="copySignupLink()">Copy Link</button>
            </div>
          </div>
        </div>

        <!-- Consignor Approval -->
        <div class="form-section">
          <h3>Consignor Approval</h3>

          <div class="approval-options">
            <label class="radio-option" [class.selected]="settings()?.autoApprove">
              <input
                type="radio"
                [value]="true"
                [(ngModel)]="settings()!.autoApprove"
                name="approvalType">
              <div class="option-content">
                <span class="option-title">Auto-approve new consignors</span>
                <span class="option-description">New consignors can immediately start adding items</span>
              </div>
            </label>

            <label class="radio-option" [class.selected]="!settings()?.autoApprove">
              <input
                type="radio"
                [value]="false"
                [(ngModel)]="settings()!.autoApprove"
                name="approvalType">
              <div class="option-content">
                <span class="option-title">Require manual approval</span>
                <span class="option-description">Review each consignor before they can add items</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Inventory Permissions -->
        <div class="form-section">
          <h3>Consignor Inventory Permissions</h3>
          <p class="section-description">
            Control what actions consignors can perform with their inventory items.
          </p>

          <div class="permissions-grid">
            <div class="permission-item">
              <label class="permission-toggle">
                <input
                  type="checkbox"
                  [(ngModel)]="settings()!.inventoryPermissions.canAddItems"
                  name="canAddItems">
                <div class="toggle-switch"></div>
                <div class="permission-content">
                  <span class="permission-title">Add new items</span>
                  <span class="permission-description">Allow consignors to submit new items for approval</span>
                </div>
              </label>
            </div>

            <div class="permission-item">
              <label class="permission-toggle">
                <input
                  type="checkbox"
                  [(ngModel)]="settings()!.inventoryPermissions.canEditItems"
                  name="canEditItems">
                <div class="toggle-switch"></div>
                <div class="permission-content">
                  <span class="permission-title">Edit existing items</span>
                  <span class="permission-description">Allow consignors to modify details of their approved items</span>
                </div>
              </label>
            </div>

            <div class="permission-item">
              <label class="permission-toggle">
                <input
                  type="checkbox"
                  [(ngModel)]="settings()!.inventoryPermissions.canRemoveItems"
                  name="canRemoveItems">
                <div class="toggle-switch"></div>
                <div class="permission-content">
                  <span class="permission-title">Remove/withdraw items</span>
                  <span class="permission-description">Allow consignors to withdraw items from the shop</span>
                </div>
              </label>
            </div>

            <div class="permission-item">
              <label class="permission-toggle">
                <input
                  type="checkbox"
                  [(ngModel)]="settings()!.inventoryPermissions.canViewDetailedAnalytics"
                  name="canViewDetailedAnalytics">
                <div class="toggle-switch"></div>
                <div class="permission-content">
                  <span class="permission-title">View detailed analytics</span>
                  <span class="permission-description">Allow consignors to see detailed sales metrics and performance data</span>
                </div>
              </label>
            </div>
          </div>

          <div class="permissions-note">
            <div class="note-icon">💡</div>
            <div class="note-content">
              <strong>Note:</strong> Consignors can always view their basic inventory list and sale notifications.
              These permissions control additional actions and data access.
            </div>
          </div>
        </div>

        <!-- Invite Consignors -->
        <div class="form-section">
          <h3>Invite Consignors</h3>

          <div class="invite-form">
            <div class="form-group">
              <label for="inviteEmails">Email addresses (one per line)</label>
              <textarea
                id="inviteEmails"
                [(ngModel)]="inviteEmailsText"
                name="inviteEmails"
                class="form-textarea invite-emails"
                placeholder="jane@example.com&#10;bob@example.com"
                rows="4"></textarea>
            </div>

            <div class="form-group">
              <label for="inviteMessage">Custom message (optional)</label>
              <textarea
                id="inviteMessage"
                [(ngModel)]="customMessage"
                name="inviteMessage"
                class="form-textarea"
                placeholder="Join our consignment family! We'd love to have your items in our shop..."
                rows="3"></textarea>
            </div>

            <div class="invite-actions">
              <button
                class="btn-primary"
                (click)="sendInvitations()"
                [disabled]="isSending() || !inviteEmailsText.trim()">
                {{ isSending() ? 'Sending...' : 'Send Invitations' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Pending Invitations -->
        <div class="form-section" *ngIf="pendingInvitations().length > 0">
          <h3>Pending Invitations</h3>

          <div class="invitations-list">
            <div
              *ngFor="let invitation of pendingInvitations()"
              class="invitation-item"
              [class]="'status-' + invitation.status">
              <div class="invitation-info">
                <div class="invitation-email">{{ invitation.email }}</div>
                <div class="invitation-details">
                  <span>Sent {{ invitation.sentAt | date:'MMM d' }}</span>
                  <span class="separator">•</span>
                  <span class="status" [class]="'status-' + invitation.status">
                    {{ getInvitationStatusText(invitation) }}
                  </span>
                </div>
              </div>
              <div class="invitation-actions">
                <button
                  *ngIf="invitation.status === 'pending'"
                  class="btn-secondary btn-small"
                  (click)="resendInvitation(invitation.id)">
                  Resend
                </button>
                <button
                  class="btn-danger-outline btn-small"
                  (click)="cancelInvitation(invitation.id)">
                  {{ invitation.status === 'pending' ? 'Cancel' : 'Remove' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Agreement Template -->
        <div class="form-section">
          <h3>Agreement Template</h3>
          <p class="section-description">
            Download a professional consignment agreement template that you can print and use with consignors.
          </p>

          <div class="agreement-template">
            <div class="template-info">
              <h4>Consignment Agreement Template</h4>
              <p>A professional, print-ready PDF template with standard consignment terms, signature lines, and fillable blanks for shop and consignor details.</p>
              <ul class="template-features">
                <li>✓ Standard consignment terms and conditions</li>
                <li>✓ Fillable fields for shop and consignor information</li>
                <li>✓ Commission split and consignment period fields</li>
                <li>✓ Signature lines for both parties</li>
                <li>✓ Print-friendly letter size format</li>
              </ul>
            </div>
            <div class="template-actions">
              <button class="btn-primary" (click)="downloadTemplate()">
                <span class="download-icon">📄</span>
                Download PDF Template
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="loadSettings()">Cancel</button>
          <button type="button" class="btn-primary" (click)="saveSettings()" [disabled]="isSaving()">
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" *ngIf="successMessage() || errorMessage()">
        <div *ngIf="successMessage()" class="message success">{{ successMessage() }}</div>
        <div *ngIf="errorMessage()" class="message error">{{ errorMessage() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .consignor-settings {
      padding: 2rem;
      max-width: 800px;
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
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .form-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .section-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    /* Store Code Display */
    .store-code-display {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .code-box {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .store-code {
      display: inline-block;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      background: white;
      padding: 1rem 2rem;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      letter-spacing: 2px;
    }

    .code-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .signup-link {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1rem;
    }

    .signup-link label {
      display: block;
      font-weight: 500;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }

    .link-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .signup-url {
      font-family: monospace;
      color: #1e40af;
      word-break: break-all;
      flex: 1;
    }

    .btn-link {
      color: #3b82f6;
      background: none;
      border: none;
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    /* Approval Options */
    .approval-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .radio-option {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .radio-option:hover {
      border-color: #3b82f6;
    }

    .radio-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .radio-option input[type="radio"] {
      margin-top: 0.25rem;
    }

    .option-content {
      flex: 1;
    }

    .option-title {
      display: block;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .option-description {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Inventory Permissions */
    .permissions-grid {
      display: grid;
      gap: 1rem;
    }

    .permission-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
    }

    .permission-toggle {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      cursor: pointer;
    }

    .permission-toggle input[type="checkbox"] {
      display: none;
    }

    .toggle-switch {
      width: 44px;
      height: 24px;
      background: #d1d5db;
      border-radius: 12px;
      position: relative;
      transition: background-color 0.2s;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .permission-toggle input[type="checkbox"]:checked + .toggle-switch {
      background: #3b82f6;
    }

    .permission-toggle input[type="checkbox"]:checked + .toggle-switch::after {
      transform: translateX(20px);
    }

    .permission-content {
      flex: 1;
    }

    .permission-title {
      display: block;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .permission-description {
      color: #6b7280;
      font-size: 0.75rem;
      line-height: 1.4;
    }

    .permissions-note {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding: 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
    }

    .note-icon {
      font-size: 1rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .note-content {
      font-size: 0.875rem;
      color: #1e40af;
      line-height: 1.4;
    }

    .note-content strong {
      font-weight: 600;
    }

    /* Invite Form */
    .invite-form {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
      resize: vertical;
      font-family: inherit;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .invite-emails {
      font-family: monospace;
      font-size: 0.875rem;
      min-height: 100px;
    }

    .invite-actions {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Invitations List */
    .invitations-list {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .invitation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }

    .invitation-item:last-child {
      border-bottom: none;
    }

    .invitation-item.status-expired {
      background: #fef2f2;
    }

    .invitation-item.status-accepted {
      background: #ecfdf5;
    }

    .invitation-info {
      flex: 1;
    }

    .invitation-email {
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .invitation-details {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .separator {
      color: #d1d5db;
    }

    .status {
      font-weight: 500;
    }

    .status.status-pending {
      color: #f59e0b;
    }

    .status.status-accepted {
      color: #059669;
    }

    .status.status-expired {
      color: #dc2626;
    }

    .invitation-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-danger-outline {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
    }

    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger-outline {
      background: white;
      color: #dc2626;
      border-color: #dc2626;
    }

    .btn-danger-outline:hover {
      background: #fef2f2;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Messages */
    .messages {
      margin-top: 2rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .message.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .message.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* Agreement Template */
    .agreement-template {
      display: flex;
      gap: 2rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      align-items: flex-start;
    }

    .template-info {
      flex: 1;
    }

    .template-info h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .template-info p {
      color: #6b7280;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .template-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .template-features li {
      color: #374151;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .template-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .download-icon {
      margin-right: 0.5rem;
      font-size: 1.25rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .consignor-settings {
        padding: 1rem;
      }

      .invitation-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .invitation-actions {
        align-self: stretch;
      }

      .link-display {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .code-actions {
        flex-direction: column;
      }

      .form-actions {
        flex-direction: column;
      }

      .approval-options {
        gap: 0.75rem;
      }

      .agreement-template {
        flex-direction: column;
        gap: 1rem;
      }

      .template-actions {
        align-self: stretch;
      }

      .permissions-grid {
        gap: 0.75rem;
      }

      .permission-item {
        padding: 0.75rem;
      }

      .permissions-note {
        padding: 0.75rem;
        gap: 0.5rem;
      }

      .note-content {
        font-size: 0.8rem;
      }
    }
  `]
})
export class ConsignorSettingsComponent implements OnInit {
  settings = signal<ConsignorSettings | null>(null);
  pendingInvitations = signal<PendingInvitation[]>([]);
  inviteEmailsText = '';
  customMessage = '';
  isSaving = signal(false);
  isSending = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSettings();
    this.loadPendingInvitations();
  }

  async loadSettings() {
    try {
      // Mock data - replace with actual API call
      const mockSettings: ConsignorSettings = {
        storeCode: 'VINT-2024-7X9K',
        autoApprove: true,
        signupUrl: 'consignmentgenie.com/join/VINT-2024-7X9K',
        inventoryPermissions: {
          canAddItems: true,
          canEditItems: true,
          canRemoveItems: false,
          canViewDetailedAnalytics: false
        }
      };

      this.settings.set(mockSettings);
    } catch (error) {
      this.showError('Failed to load consignor settings');
    }
  }

  async loadPendingInvitations() {
    try {
      const response = await this.http.get<any[]>(`${environment.apiUrl}/api/consignors/invitations`).toPromise();

      if (response) {
        // Transform API response to our interface format
        const invitations: PendingInvitation[] = response.map(inv => ({
          id: inv.id,
          email: inv.email,
          sentAt: new Date(inv.createdAt),
          expiresAt: new Date(inv.expiresAt),
          status: inv.status.toLowerCase()
        }));

        this.pendingInvitations.set(invitations);
      }
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      this.showError('Failed to load pending invitations');
    }
  }

  async saveSettings() {
    if (!this.settings()) return;

    this.isSaving.set(true);
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      this.showSuccess('Consignor settings saved successfully');
    } catch (error) {
      this.showError('Failed to save consignor settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  copyStoreCode() {
    if (this.settings()?.storeCode) {
      navigator.clipboard.writeText(this.settings()!.storeCode);
      this.showSuccess('Store code copied to clipboard');
    }
  }

  copySignupLink() {
    if (this.settings()?.signupUrl) {
      navigator.clipboard.writeText(this.settings()!.signupUrl);
      this.showSuccess('Signup link copied to clipboard');
    }
  }

  async regenerateStoreCode() {
    if (!confirm('Are you sure you want to regenerate the store code? The old code will no longer work.')) {
      return;
    }

    try {
      const response = await this.http.post<{newStoreCode: string, generatedAt: string}>(`${environment.apiUrl}/organization/store-code/regenerate`, {}).toPromise();

      if (response) {
        const settings = this.settings();
        if (settings) {
          settings.storeCode = response.newStoreCode;
          settings.signupUrl = `${window.location.origin}/register/consignor/invitation?token=${response.newStoreCode}`;
          this.settings.set({ ...settings });
        }
        this.showSuccess('Store code regenerated successfully');
      }
    } catch (error) {
      console.error('Error regenerating store code:', error);
      this.showError('Failed to regenerate store code');
    }
  }

  async sendInvitations() {
    const emails = this.inviteEmailsText
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && this.isValidEmail(email));

    if (emails.length === 0) {
      this.showError('Please enter at least one valid email address');
      return;
    }

    this.isSending.set(true);
    try {
      // Send invitations one by one
      let successCount = 0;
      for (const email of emails) {
        try {
          const inviteRequest = {
            email: email,
            name: email.split('@')[0], // Use email prefix as default name
            message: this.customMessage
          };

          await this.http.post(`${environment.apiUrl}/api/consignors/invitations`, inviteRequest).toPromise();
          successCount++;
        } catch (error) {
          console.error(`Failed to send invitation to ${email}:`, error);
        }
      }

      // Reload invitations to show updated list
      await this.loadPendingInvitations();

      this.inviteEmailsText = '';
      this.customMessage = '';

      if (successCount === emails.length) {
        this.showSuccess(`${emails.length} invitation(s) sent successfully`);
      } else if (successCount > 0) {
        this.showSuccess(`${successCount} of ${emails.length} invitation(s) sent successfully`);
      } else {
        this.showError('Failed to send invitations');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      this.showError('Failed to send invitations');
    } finally {
      this.isSending.set(false);
    }
  }

  async resendInvitation(invitationId: string) {
    try {
      await this.http.post(`${environment.apiUrl}/api/consignors/invitations/${invitationId}/resend`, {}).toPromise();

      // Reload invitations to show updated data
      await this.loadPendingInvitations();

      this.showSuccess('Invitation resent successfully');
    } catch (error) {
      this.showError('Failed to resend invitation');
    }
  }

  async cancelInvitation(invitationId: string) {
    if (!confirm('Are you sure you want to remove this invitation?')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}/api/consignors/invitations/${invitationId}`).toPromise();

      // Reload invitations to show updated list
      await this.loadPendingInvitations();

      this.showSuccess('Invitation removed successfully');
    } catch (error) {
      this.showError('Failed to remove invitation');
    }
  }

  getInvitationStatusText(invitation: PendingInvitation): string {
    switch (invitation.status) {
      case 'pending':
        const daysLeft = Math.ceil((invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Expires soon';
      case 'accepted':
        return 'Accepted';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }

  private generateStoreCode(): string {
    const prefix = 'VINT';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  downloadTemplate() {
    try {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = '/assets/consignment-agreement-template.pdf';
      link.download = 'Consignment-Agreement-Template.pdf';
      link.target = '_blank';

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showSuccess('Template download started');
    } catch (error) {
      console.error('Error downloading template:', error);
      this.showError('Failed to download template');
    }
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}