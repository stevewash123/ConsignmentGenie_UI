import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Consignor } from '../../models/consignor.model';
import { ConsignorService } from '../../services/consignor.service';
import { ENTITY_LABELS } from '../constants/labels';

@Component({
  selector: 'app-invite-consignor-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invite-consignor-modal.component.html',
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #047857;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
    }

    .close-btn:hover {
      color: #dc2626;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .description {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .commission-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #047857;
    }

    label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-input, .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #047857;
    }

    .form-input.error {
      border-color: #dc2626;
    }

    .error-text {
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .mode-switch {
      margin: 1.5rem 0;
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .link-btn {
      background: none;
      border: none;
      color: #047857;
      cursor: pointer;
      font-weight: 600;
      text-decoration: underline;
      font-size: 0.875rem;
    }

    .link-btn:hover {
      color: #065f46;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #047857, #10b981);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #065f46, #047857);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f9fafb;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
    }
  `]
})
export class InviteConsignorModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() consignorAdded = new EventEmitter<Consignor>();

  labels = ENTITY_LABELS;
  mode: 'invite' | 'manual' = 'invite';
  isSubmitting = signal(false);

  inviteForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    personalMessage: new FormControl('')
  });

  manualForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl(''),
    commissionRate: new FormControl(60, Validators.required),
    useShopDefault: new FormControl(true)
  });

  constructor(private ConsignorService: ConsignorService) {}

  close(): void {
    this.closed.emit();
  }

  switchToManual(): void {
    this.mode = 'manual';
  }

  switchToInvite(): void {
    this.mode = 'invite';
  }

  onUseShopDefaultChange(): void {
    if (this.manualForm.get('useShopDefault')?.value) {
      // TODO: Get shop default commission rate from organization settings
      this.manualForm.patchValue({ commissionRate: 60 });
    }
  }

  submitInvite(): void {
    if (this.inviteForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formData = this.inviteForm.value;
      const inviteData = {
        email: formData.email!,
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.email!
      };

      // Send invitation via API
      this.ConsignorService.inviteConsignor(inviteData).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          if (response.success) {
            this.close();
            this.consignorAdded.emit(null); // Trigger refresh of consignor list
          } else {
            console.error('Invite failed:', response.message);
            // TODO: Show error message to user
          }
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Invite error:', error);
          // TODO: Show error message to user
        }
      });
    }
  }

  submitManual(): void {
    if (this.manualForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formData = this.manualForm.value;
      const manualData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email!,
        phone: formData.phone || undefined,
        commissionRate: (formData.commissionRate! / 100), // Convert percentage to decimal
        status: 'active' as const
      };

      // TODO: Implement manual add API call
      console.log('Creating manual consignor:', manualData);

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.close();
        // TODO: Show success message and refresh consignor list
      }, 1000);
    }
  }
}