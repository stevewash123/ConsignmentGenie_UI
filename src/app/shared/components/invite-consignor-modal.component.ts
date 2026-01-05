import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Consignor } from '../../models/consignor.model';
import { ConsignorService } from '../../services/consignor.service';
import { ENTITY_LABELS } from '../constants/labels';

@Component({
  selector: 'app-invite-consignor-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invite-consignor-modal.component.html',
  styleUrls: ['./invite-consignor-modal.component.scss']
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

  constructor(
    private ConsignorService: ConsignorService,
    private toastr: ToastrService
  ) {}

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
            // Show success toast with invited person's details
            const invitedName = inviteData.name !== inviteData.email ? inviteData.name : inviteData.email;
            this.toastr.success(`Invitation sent to ${invitedName}`, 'Consignor Invited', {
              timeOut: 5000
            });

            // Reset form but keep modal open for additional invites
            this.inviteForm.reset();

            // Trigger refresh of consignor list
            this.consignorAdded.emit(null);
          } else {
            this.toastr.error(response.message || 'Failed to send invitation', 'Invitation Failed');
          }
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const errorMessage = error.error?.message || 'An unexpected error occurred while sending the invitation';
          this.toastr.error(errorMessage, 'Invitation Failed');
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
        commissionRate: (formData.commissionRate! / 100) // Convert percentage to decimal
      };

      // Create consignor via API call
      this.ConsignorService.createConsignor(manualData).subscribe({
        next: (createdConsignor) => {
          this.isSubmitting.set(false);

          // Show success toast with created consignor's details
          this.toastr.success(`${manualData.name} has been added successfully`, 'Consignor Created', {
            timeOut: 5000
          });

          // Reset form but keep modal open for additional consignors
          this.manualForm.reset({ useShopDefault: true, commissionRate: 60 });

          // Trigger refresh of consignor list
          this.consignorAdded.emit(createdConsignor);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const errorMessage = error.error?.message || 'An unexpected error occurred while creating the consignor';
          this.toastr.error(errorMessage, 'Creation Failed');
        }
      });
    }
  }
}