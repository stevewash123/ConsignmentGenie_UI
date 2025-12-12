import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConsignorShopMembershipService } from '../services/consignor-shop-membership.service';
import {
  PayoutMethod,
  CreateConsignorShopMembershipRequest,
  ShopOnboardingData,
  BankAccountValidation
} from '../models/consignor-shop-membership.model';

@Component({
  selector: 'app-consignor-shop-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './consignor-shop-onboarding.component.html',
  styleUrls: ['./consignor-shop-onboarding.component.css']
})
export class ConsignorShopOnboardingComponent implements OnInit {
  onboardingForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  shopData = signal<ShopOnboardingData | null>(null);

  PayoutMethod = PayoutMethod;

  constructor(
    private fb: FormBuilder,
    private membershipService: ConsignorShopMembershipService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.onboardingForm = this.fb.group({
      agreementAccepted: [false, [Validators.requiredTrue]],
      payoutMethod: [PayoutMethod.Check, [Validators.required]],
      accountNumber: [''],
      routingNumber: ['']
    });
  }

  ngOnInit(): void {
    const storeCode = this.route.snapshot.queryParams['storeCode'];

    if (!storeCode) {
      this.router.navigate(['/']);
      return;
    }

    this.loadShopOnboardingData(storeCode);
    this.setupPayoutMethodValidation();
  }

  private loadShopOnboardingData(storeCode: string): void {
    this.membershipService.getShopOnboardingData(storeCode).subscribe({
      next: (data) => {
        this.shopData.set(data);
      },
      error: (error) => {
        console.error('Failed to load shop data:', error);
        this.errorMessage.set('Failed to load shop information. Please try again.');
      }
    });
  }

  private setupPayoutMethodValidation(): void {
    this.onboardingForm.get('payoutMethod')?.valueChanges.subscribe(method => {
      const accountControl = this.onboardingForm.get('accountNumber');
      const routingControl = this.onboardingForm.get('routingNumber');

      if (method === PayoutMethod.DirectDeposit) {
        accountControl?.setValidators([Validators.required, Validators.minLength(4)]);
        routingControl?.setValidators([Validators.required, Validators.pattern(/^\d{9}$/)]);
      } else {
        accountControl?.clearValidators();
        routingControl?.clearValidators();
        accountControl?.setValue('');
        routingControl?.setValue('');
      }

      accountControl?.updateValueAndValidity();
      routingControl?.updateValueAndValidity();
    });
  }

  getInventoryModeMessage(): string {
    const shopData = this.shopData();
    if (!shopData) return '';

    switch (shopData.inventoryMode) {
      case 'OwnerOnly':
        return 'The shop owner manages all inventory. You cannot submit items directly.';
      case 'ApprovalRequired':
        return 'You can submit items for approval. The owner reviews submissions before they go live.';
      case 'DirectAdd':
        return 'You can add items directly to inventory. Items appear immediately without approval.';
      default:
        return '';
    }
  }

  onSubmit(): void {
    if (this.onboardingForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    const shopData = this.shopData();
    if (!shopData) {
      this.errorMessage.set('Shop data not loaded. Please refresh and try again.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.onboardingForm.value;

    const request: CreateConsignorShopMembershipRequest = {
      storeCode: shopData.storeCode,
      agreementAccepted: formValue.agreementAccepted,
      agreementVersion: shopData.consignmentAgreement?.version || '1.0',
      payoutMethod: formValue.payoutMethod,
      bankAccountNumber: formValue.accountNumber || undefined,
      routingNumber: formValue.routingNumber || undefined,
      splitPercentage: shopData.defaultSplitPercentage
    };

    this.membershipService.createMembership(request).subscribe({
      next: (response) => {
        if (response.success) {
          // Redirect to consignor dashboard for this shop
          this.router.navigate(['/consignor/dashboard'], {
            queryParams: { shop: shopData.storeCode }
          });
        } else {
          this.errorMessage.set(response.message || 'Failed to complete onboarding. Please try again.');
          this.isSubmitting.set(false);
        }
      },
      error: (error) => {
        console.error('Onboarding failed:', error);
        this.errorMessage.set('Failed to complete onboarding. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.onboardingForm.controls).forEach(key => {
      this.onboardingForm.get(key)?.markAsTouched();
    });
  }

  private validateBankAccount(): void {
    const accountNumber = this.onboardingForm.get('accountNumber')?.value;
    const routingNumber = this.onboardingForm.get('routingNumber')?.value;

    if (accountNumber && routingNumber) {
      this.membershipService.validateBankAccount({
        accountNumber,
        routingNumber,
        isValid: false
      }).subscribe({
        next: (validation) => {
          if (!validation.isValid && validation.errorMessage) {
            this.errorMessage.set(validation.errorMessage);
          }
        },
        error: (error) => {
          console.error('Bank account validation error:', error);
        }
      });
    }
  }
}