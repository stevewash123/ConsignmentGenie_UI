import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';

@Component({
  selector: 'app-inventory-add',
  standalone: true,
  imports: [CommonModule, OwnerLayoutComponent],
  template: `
    <app-owner-layout>
      <div class="inventory-add-page">
        <div class="page-header">
          <div class="header-content">
            <div class="header-nav">
              <button class="btn-back" (click)="goBack()">
                ← Back to Inventory
              </button>
            </div>
            <h1>Add New Item</h1>
            <p>Add a new inventory item to your collection</p>
          </div>
        </div>

        <div class="form-container">
          <div class="form-placeholder">
            <div class="placeholder-icon">📦</div>
            <h2>Item Form Coming Soon</h2>
            <p>This form will allow you to add new inventory items with:</p>
            <ul>
              <li>Item details (title, description, SKU)</li>
              <li>Category and condition selection</li>
              <li>Pricing information</li>
              <li>Photo uploads</li>
              <li>Consignor assignment</li>
            </ul>
            <p class="note">For now, use the bulk upload feature or contact support for assistance.</p>
          </div>
        </div>
      </div>
    </app-owner-layout>
  `,
  styles: [`
    .inventory-add-page {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .header-nav {
      margin-bottom: 1rem;
    }

    .btn-back {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      color: #374151;
      text-decoration: none;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #e5e7eb;
    }

    .page-header h1 {
      color: #059669;
      margin-bottom: 0.5rem;
      font-size: 2rem;
      margin-top: 1rem;
    }

    .page-header p {
      color: #6b7280;
      margin: 0;
    }

    .form-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 3rem;
    }

    .form-placeholder {
      text-align: center;
      color: #6b7280;
    }

    .placeholder-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .form-placeholder h2 {
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .form-placeholder ul {
      text-align: left;
      max-width: 300px;
      margin: 1.5rem auto;
    }

    .form-placeholder li {
      margin-bottom: 0.5rem;
      color: #374151;
    }

    .note {
      font-style: italic;
      color: #6b7280;
      margin-top: 1.5rem;
    }
  `]
})
export class InventoryAddComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/owner/inventory']);
  }
}