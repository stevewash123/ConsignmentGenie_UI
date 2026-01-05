import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShopperAuthService } from '../../services/shopper-auth.service';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  quantity: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug = '';
  isAuthenticated = false;
  currentStep = 1;
  isSubmitting = false;

  contactForm: FormGroup;
  shippingForm: FormGroup;

  // Sample cart data for Phase 1 MVP
  cartItems: CartItem[] = [
    {
      id: '1',
      name: 'Vintage Leather Jacket',
      description: 'Classic brown leather jacket',
      price: 125.00,
      category: 'Clothing',
      quantity: 1
    },
    {
      id: '2',
      name: 'Antique Wooden Table',
      description: 'Beautiful oak dining table',
      price: 450.00,
      category: 'Furniture',
      quantity: 1
    }
  ];

  private taxRate = 0.08; // 8% tax rate
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: ShopperAuthService,
    private storeService: ShopperStoreService
  ) {
    this.contactForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      createAccount: [false],
      password: ['']
    });

    this.shippingForm = this.fb.group({
      address: ['', [Validators.required]],
      apartment: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
      this.isAuthenticated = this.authService.isAuthenticated(this.storeSlug);
    });

    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });

    this.loadCartFromStorage();
    this.prefillFormsIfAuthenticated();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nextStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getShipping(): number {
    return this.getSubtotal() > 100 ? 0 : 15.00; // Free shipping over $100
  }

  getTax(): number {
    return this.getSubtotal() * this.taxRate;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getShipping() + this.getTax();
  }

  onCreateAccountChange(event: any): void {
    const createAccount = event.target.checked;
    const passwordControl = this.contactForm.get('password');

    if (createAccount) {
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      passwordControl?.clearValidators();
      passwordControl?.setValue('');
    }
    passwordControl?.updateValueAndValidity();
  }

  submitOrder(): void {
    if (!this.contactForm.valid || !this.shippingForm.valid) {
      return;
    }

    this.isSubmitting = true;

    // Prepare order data
    const orderData = {
      contact: this.contactForm.value,
      shipping: this.shippingForm.value,
      items: this.cartItems,
      totals: {
        subtotal: this.getSubtotal(),
        shipping: this.getShipping(),
        tax: this.getTax(),
        total: this.getTotal()
      },
      createAccount: this.contactForm.get('createAccount')?.value || false
    };

    // Simulate order submission
    setTimeout(() => {
      this.isSubmitting = false;

      // If user chose to create account, create it
      if (orderData.createAccount && orderData.contact.password) {
        this.createCustomerAccount(orderData.contact);
      }

      // Clear cart and redirect to success page
      this.clearCart();
      alert('Order submitted successfully! You will receive a confirmation email shortly.' +
            (orderData.createAccount ? ' Your account has been created for faster future checkouts.' : ''));
      this.router.navigate(['/shop', this.storeSlug, 'account', 'orders']);
    }, 2000);
  }

  private createCustomerAccount(contactData: any): void {
    // TODO: Implement customer account creation API call
    // This would call the backend to create a customer account with the provided data
    const customerData = {
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      password: contactData.password,
      storeSlug: this.storeSlug
    };

    console.log('Creating customer account:', customerData);
    // Future implementation would call shopper auth service to create account
  }

  private loadCartFromStorage(): void {
    try {
      const cartData = localStorage.getItem(`cart_${this.storeSlug}`);
      if (cartData) {
        this.cartItems = JSON.parse(cartData);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }

  private clearCart(): void {
    try {
      localStorage.removeItem(`cart_${this.storeSlug}`);
      this.cartItems = [];
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }

  private prefillFormsIfAuthenticated(): void {
    if (this.isAuthenticated) {
      // TODO: Load user profile data from API and prefill forms
      // For now, we'll just leave forms empty for guest checkout
    }
  }
}