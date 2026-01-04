import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ProviderProfile, UpdateProviderProfile } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consignor-profile.component.html',
  styleUrls: ['./consignor-profile.component.scss']
})
export class ConsignorProfileComponent implements OnInit {
  profile: ProviderProfile | null = null;
  saving = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  formData: UpdateProviderProfile = {
    fullName: '',
    phone: '',
    preferredPaymentMethod: '',
    paymentDetails: '',
    emailNotifications: true
  };

  payoutNotifications = true;

  constructor(
    private ConsignorService: ConsignorPortalService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loadingService.start(LOADING_KEYS.PROFILE);
    this.error = null;

    this.ConsignorService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.populateForm(profile);
      },
      error: (err) => {
        this.error = 'Failed to load profile. Please try again.';
        console.error('Profile error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.PROFILE);
      }
    });
  }

  populateForm(profile: ProviderProfile) {
    this.formData = {
      fullName: profile.fullName,
      phone: profile.phone || '',
      preferredPaymentMethod: profile.preferredPaymentMethod || '',
      paymentDetails: profile.paymentDetails || '',
      emailNotifications: profile.emailNotifications
    };
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.saving = true;

      this.ConsignorService.updateProfile(this.formData).subscribe({
        next: (updatedProfile) => {
          this.profile = updatedProfile;
          this.saving = false;
          this.showSuccessMessage('Profile updated successfully!');
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Failed to update profile. Please try again.';
          console.error('Update error:', err);
        }
      });
    }
  }

  resetForm() {
    if (this.profile) {
      this.populateForm(this.profile);
    }
    this.error = null;
  }

  showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  formatMemberSince(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}