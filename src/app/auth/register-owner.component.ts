import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-owner',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register-owner.component.html',
  styleUrls: ['./register-owner.component.scss']
})
export class RegisterOwnerComponent implements OnInit {
  signupForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  isValidatingDomain = signal(false);
  domainValidationMessage = signal('');
  isDomainAvailable = signal<boolean | null>(null);
  invitationToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      shopName: ['', [Validators.required]],
      subdomain: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Check for invitation token in query parameters
    this.route.queryParams.subscribe(params => {
      this.invitationToken = params['token'] || null;
      if (this.invitationToken) {
        // Validate the invitation token and pre-fill form if valid
        this.validateInvitationToken(this.invitationToken);
      }
    });

    // Set up real-time subdomain validation
    this.setupSubdomainValidation();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  private setupSubdomainValidation() {
    const subdomainControl = this.signupForm.get('subdomain');
    if (!subdomainControl) return;

    // Set up real-time validation with debounce
    subdomainControl.valueChanges.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged(), // Only emit when value actually changes
      switchMap(subdomain => {
        // Reset validation state
        this.isDomainAvailable.set(null);
        this.domainValidationMessage.set('');

        if (!subdomain || subdomain.length < 3) {
          this.isValidatingDomain.set(false);
          return [];
        }

        // Check if subdomain matches pattern requirements
        if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
          this.isValidatingDomain.set(false);
          this.domainValidationMessage.set('Only letters, numbers, and dashes allowed');
          this.isDomainAvailable.set(false);
          return [];
        }

        this.isValidatingDomain.set(true);
        this.domainValidationMessage.set('Checking availability...');

        return this.authService.validateSubdomain(subdomain);
      })
    ).subscribe({
      next: (response: any) => {
        this.isValidatingDomain.set(false);
        if (response && response.success) {
          if (response.data.isAvailable) {
            this.isDomainAvailable.set(true);
            this.domainValidationMessage.set('✓ Available');
          } else {
            this.isDomainAvailable.set(false);
            this.domainValidationMessage.set('This URL is already taken');
          }
        }
      },
      error: () => {
        this.isValidatingDomain.set(false);
        this.domainValidationMessage.set('Error checking availability');
        this.isDomainAvailable.set(false);
      }
    });
  }

  private validateInvitationToken(token: string) {
    this.authService.validateOwnerInvitation(token).subscribe({
      next: (response) => {
        if (response.isValid) {
          // Pre-fill the form with invitation data
          this.signupForm.patchValue({
            fullName: response.name,
            email: response.email
          });
          // Make email readonly since it's from the invitation
          this.signupForm.get('email')?.disable();
        } else {
          this.errorMessage.set('Invalid or expired invitation: ' + response.errorMessage);
        }
      },
      error: (error) => {
        this.errorMessage.set('Error validating invitation: ' + error.message);
      }
    });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.markAllFieldsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.signupForm.value;
    const request = {
      fullName: formValue.fullName,
      email: this.signupForm.get('email')?.disabled ? this.signupForm.get('email')?.value : formValue.email,
      phone: formValue.phone || '',
      password: formValue.password,
      shopName: formValue.shopName,
      subdomain: formValue.subdomain,
      address: '',
      token: this.invitationToken // Include invitation token if present
    };

    this.authService.registerOwner(request).subscribe({
      next: (result) => {
        console.log('Owner registration response:', result);
        if (result.success) {
          console.log('User logged in with role:', result.role);
          this.router.navigate(['/register/success'], {
            queryParams: {
              type: 'owner',
              shopName: formValue.shopName,
              email: formValue.email
            }
          });
        } else {
          this.errorMessage.set(result.message || 'Registration failed');
        }
        this.isSubmitting.set(false);
      },
      error: (error: any) => {
        this.errorMessage.set(error.message || 'An unexpected error occurred');
        this.isSubmitting.set(false);
      }
    });
  }

  private markAllFieldsTouched() {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }
}