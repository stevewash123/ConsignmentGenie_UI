import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ApprovalWorkflowSettings {
  autoApproveNewConsignors: boolean;
}

@Component({
  selector: 'app-approval-workflow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './approval-workflow.component.html',
  styles: [`
    .approval-workflow-section {
      padding: 2rem;
      max-width: 1200px;
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .section-description {
      color: #6b7280;
    }

    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input, .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checkbox-item {
      display: flex;
      align-items: start;
      gap: 0.5rem;
    }

    .checkbox-item input[type="checkbox"] {
      margin-top: 0.125rem;
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .checkbox-label {
      color: #374151;
      font-size: 0.875rem;
    }

    .checkbox-description {
      color: #6b7280;
      font-size: 0.75rem;
      margin-left: 1.5rem;
      margin-top: 0.25rem;
    }

    .btn-primary, .btn-secondary, .btn-success, .btn-danger {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
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

    .btn-success {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-small {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .approval-list {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .approval-header {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
    }

    .approval-item {
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 1rem;
      align-items: center;
    }

    .approval-item:last-child {
      border-bottom: none;
    }

    .consignor-info h4 {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .consignor-email {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
      text-align: center;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-approved {
      background: #d1fae5;
      color: #065f46;
    }

    .status-rejected {
      background: #fecaca;
      color: #991b1b;
    }

    .progress-bar {
      width: 100%;
      height: 0.5rem;
      background: #e5e7eb;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      transition: width 0.3s ease;
    }

    .approval-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-weight: 500;
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

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: end;
    }

    .form-row .form-group {
      flex: 1;
    }

    @media (max-width: 768px) {
      .approval-workflow-section {
        padding: 1rem;
      }

      .approval-header, .approval-item {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .form-row {
        flex-direction: column;
      }

      .approval-actions {
        justify-content: stretch;
      }

      .approval-actions button {
        flex: 1;
      }
    }
  `]
})
export class ApprovalWorkflowComponent implements OnInit {
  approvalForm!: FormGroup;
  workflowSettings = signal<ApprovalWorkflowSettings | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadWorkflowSettings();
  }

  private initializeForm(): void {
    this.approvalForm = this.fb.group({
      autoApproveNewConsignors: [false]
    });
  }

  async loadWorkflowSettings(): Promise<void> {
    try {
      this.isLoading.set(true);
      const settings = await this.http.get<ApprovalWorkflowSettings>(`${environment.apiUrl}/api/organization/approval-workflow`).toPromise();
      if (settings) {
        this.workflowSettings.set(settings);
        this.approvalForm.patchValue(settings);
      }
    } catch (error) {
      this.showError('Failed to load workflow settings');
    } finally {
      this.isLoading.set(false);
    }
  }


  async saveWorkflowSettings(): Promise<void> {
    if (!this.approvalForm.valid) {
      return;
    }

    this.isSaving.set(true);
    try {
      const formData = { ...this.approvalForm.value };

      await this.http.put(`${environment.apiUrl}/api/organization/approval-workflow`, formData).toPromise();
      this.workflowSettings.set(formData);
      this.showSuccess('Workflow settings saved successfully');
    } catch (error) {
      this.showError('Failed to save workflow settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.approvalForm.controls).forEach(key => {
      const control = this.approvalForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}