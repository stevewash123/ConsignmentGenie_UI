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
  styles: [`
    .checkout-container {
      min-height: 80vh;
      padding: 2rem 0;
      background-color: #f8f9fa;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .checkout-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .checkout-header h1 {
      font-size: 2.5rem;
      font-weight: bold;
      color: #343a40;
      margin-bottom: 0.5rem;
    }

    .store-name {
      font-size: 1.1rem;
      color: #007bff;
      margin: 0;
    }

    .checkout-steps {
      display: flex;
      justify-content: center;
      margin-bottom: 3rem;
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .step {
      display: flex;
      align-items: center;
      margin: 0 1rem;
      color: #6c757d;
    }

    .step.active {
      color: #007bff;
    }

    .step.completed {
      color: #28a745;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #e9ecef;
      color: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 0.5rem;
    }

    .step.active .step-number {
      background-color: #007bff;
      color: white;
    }

    .step.completed .step-number {
      background-color: #28a745;
      color: white;
    }

    .checkout-main {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
      align-items: start;
    }

    .checkout-form {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .form-section h2 {
      color: #343a40;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #dee2e6;
    }

    .auth-notice {
      background-color: #e7f3ff;
      border: 1px solid #b3d7ff;
      border-radius: 0.375rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .auth-notice p {
      margin: 0;
      color: #1a5490;
    }

    .auth-notice a {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
    }

    .auth-notice a:hover {
      text-decoration: underline;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #343a40;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #ced4da;
      border-radius: 0.375rem;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .invalid-feedback {
      display: block;
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .account-creation {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 0.375rem;
      padding: 1.5rem;
      margin: 1.5rem 0;
    }

    .account-option {
      margin-bottom: 1rem;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 1rem;
      color: #495057;
      gap: 0.75rem;
    }

    .checkbox-container input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .password-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }

    .password-section .form-group {
      margin-bottom: 0;
    }

    .payment-notice {
      margin-bottom: 2rem;
    }

    .notice-card {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    .notice-card h3 {
      color: #856404;
      margin-bottom: 1rem;
    }

    .notice-card p {
      color: #856404;
      margin-bottom: 1rem;
    }

    .notice-card p:last-child {
      margin-bottom: 0;
    }

    .review-section {
      margin-bottom: 2rem;
    }

    .contact-review, .shipping-review {
      border: 1px solid #dee2e6;
      border-radius: 0.375rem;
      padding: 1rem;
      margin-bottom: 1rem;
      position: relative;
    }

    .contact-review h3, .shipping-review h3 {
      color: #343a40;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .contact-review p, .shipping-review p {
      margin: 0.25rem 0;
      color: #6c757d;
    }

    .btn-link {
      background: none;
      border: none;
      color: #007bff;
      text-decoration: none;
      cursor: pointer;
      font-size: 0.875rem;
      position: absolute;
      top: 1rem;
      right: 1rem;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: 1px solid transparent;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background-color: #007bff;
      border-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
      border-color: #004085;
    }

    .btn-success {
      background-color: #28a745;
      border-color: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #218838;
      border-color: #1e7e34;
    }

    .btn-outline-secondary {
      color: #6c757d;
      border-color: #6c757d;
      background-color: transparent;
    }

    .btn-outline-secondary:hover {
      color: white;
      background-color: #6c757d;
    }

    .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.125rem;
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
      border-width: 0.125em;
    }

    .order-summary {
      position: sticky;
      top: 2rem;
    }

    .summary-card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
    }

    .summary-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #343a40;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .order-items {
      margin-bottom: 1.5rem;
    }

    .order-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #dee2e6;
    }

    .order-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .order-item-img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 0.375rem;
    }

    .order-item-details h4 {
      font-size: 0.9rem;
      color: #343a40;
      margin-bottom: 0.25rem;
    }

    .order-item-details p {
      font-size: 0.8rem;
      color: #6c757d;
      margin: 0.125rem 0;
    }

    .item-total {
      font-weight: bold;
      color: #28a745 !important;
    }

    .summary-totals {
      border-top: 1px solid #dee2e6;
      padding-top: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .summary-row.total {
      font-size: 1.1rem;
      font-weight: bold;
      color: #343a40;
      border-top: 1px solid #dee2e6;
      padding-top: 0.75rem;
      margin-top: 0.75rem;
    }

    .empty-cart {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-cart h2 {
      color: #343a40;
      margin-bottom: 1rem;
    }

    .empty-cart p {
      color: #6c757d;
      margin-bottom: 2rem;
    }

    @media (max-width: 968px) {
      .checkout-main {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .order-summary {
        position: static;
        order: -1;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .checkout-steps {
        flex-direction: column;
        text-align: center;
      }

      .step {
        justify-content: center;
        margin: 0.5rem 0;
      }

      .form-actions {
        flex-direction: column;
      }
    }

    @media (max-width: 480px) {
      .checkout-header h1 {
        font-size: 2rem;
      }

      .checkout-form {
        padding: 1rem;
      }

      .summary-card {
        padding: 1rem;
      }
    }
  `]
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