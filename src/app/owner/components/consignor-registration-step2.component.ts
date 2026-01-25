import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConsignorService, ConsignorRegistrationRequest } from '../../services/consignor.service';
import { PhoneFormatter } from '../../shared/utils/phone-formatter.util';

interface RegistrationData {
  invitationToken: string;
  authMethod: string;
  credentials: {
    email: string;
    password: string;
    passwordConfirm: string;
  };
  invitationDetails: {
    invitedFirstName?: string;
    invitedLastName?: string;
    invitedEmail?: string;
    shopName?: string;
  };
}

interface ProviderDetails {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

@Component({
  selector: 'app-consignor-registration-step2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consignor-registration-step2.component.html',
  styleUrls: ['./consignor-registration-step2.component.scss']
})
export class ConsignorRegistrationStep2Component implements OnInit {
  registrationData = signal<RegistrationData | null>(null);
  details: ProviderDetails = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  };

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  isInvalidRegistration = signal(false);
  errorMessage = signal('');
  shopName = signal('');

  constructor(
    private consignorService: ConsignorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if we have registration data from step 1
    const storedData = sessionStorage.getItem('consignor_registration_data');

    if (!storedData) {
      this.isInvalidRegistration.set(true);
      return;
    }

    try {
      const parsedData: RegistrationData = JSON.parse(storedData);
      this.registrationData.set(parsedData);
      this.shopName.set(parsedData.invitationDetails.shopName || '');

      // Pre-fill names if available from invitation
      if (parsedData.invitationDetails.invitedFirstName) {
        this.details.firstName = parsedData.invitationDetails.invitedFirstName;
      }
      if (parsedData.invitationDetails.invitedLastName) {
        this.details.lastName = parsedData.invitationDetails.invitedLastName;
      }
    } catch (error) {
      console.error('Error parsing registration data:', error);
      this.isInvalidRegistration.set(true);
    }
  }

  goBack(): void {
    this.router.navigate(['/register/consignor/invitation'], {
      queryParams: { token: this.registrationData()?.invitationToken }
    });
  }

  onSubmit(): void {
    if (this.isSubmitting() || !this.registrationData()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const regData = this.registrationData()!;

    const request: ConsignorRegistrationRequest = {
      invitationToken: regData.invitationToken,
      firstName: this.details.firstName,
      lastName: this.details.lastName,
      email: regData.credentials.email,
      password: regData.credentials.password,
      phone: this.details.phone,
      address: this.details.address,
      city: this.details.city,
      state: this.details.state,
      zipCode: this.details.zipCode
    };

    this.consignorService.registerFromInvitation(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.isSubmitted.set(true);
          // Clear session storage
          sessionStorage.removeItem('consignor_registration_data');
        } else {
          this.errorMessage.set(response.message || 'Registration failed');
        }
      },
      error: (error) => {
        console.error('Error during registration:', error);
        const errorMsg = error.error?.message || 'Registration failed. Please try again.';
        this.errorMessage.set(errorMsg);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  onPhoneChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = PhoneFormatter.formatPhoneInput(input);
    this.details.phone = formatted.value;
  }
}