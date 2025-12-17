import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';

@Component({
  selector: 'app-inventory-bulk-upload',
  standalone: true,
  imports: [CommonModule, OwnerLayoutComponent],
  template: `
    <app-owner-layout>
      <div class="bulk-upload-page">
        <div class="page-header">
          <div class="header-content">
            <div class="header-nav">
              <button class="btn-back" (click)="goBack()">
                ← Back to Inventory
              </button>
            </div>
            <h1>Bulk Upload Items</h1>
            <p>Upload multiple inventory items at once using CSV or Excel files</p>
          </div>
        </div>

        <div class="upload-container">
          <div class="upload-steps">
            <h2>How it works</h2>
            <div class="step-list">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h3>Download Template</h3>
                  <p>Get our CSV template with all required columns</p>
                  <button class="btn-secondary" (click)="downloadTemplate()">
                    📄 Download CSV Template
                  </button>
                </div>
              </div>

              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h3>Fill in Your Data</h3>
                  <p>Add your item details: title, price, category, consignor, etc.</p>
                </div>
              </div>

              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h3>Upload File</h3>
                  <p>Upload your completed CSV file to import all items</p>
                  <div class="upload-area" (click)="triggerFileInput()">
                    <div class="upload-icon">📤</div>
                    <p><strong>Click to upload</strong> or drag and drop</p>
                    <p class="upload-help">CSV files only, max 10MB</p>
                  </div>
                  <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv" style="display: none">
                </div>
              </div>
            </div>
          </div>

          <div class="upload-tips">
            <h3>💡 Tips for Success</h3>
            <ul>
              <li><strong>Required fields:</strong> Title, Price, Category, Consignor</li>
              <li><strong>SKU:</strong> Will be auto-generated if not provided</li>
              <li><strong>Photos:</strong> Add image URLs or upload separately</li>
              <li><strong>Validation:</strong> We'll check for errors before importing</li>
              <li><strong>Backup:</strong> Keep a copy of your original file</li>
            </ul>
          </div>
        </div>
      </div>
    </app-owner-layout>
  `,
  styles: [`
    .bulk-upload-page {
      padding: 2rem;
      max-width: 1000px;
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

    .btn-back, .btn-secondary {
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

    .btn-back:hover, .btn-secondary:hover {
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

    .upload-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .upload-steps {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 2rem;
    }

    .upload-steps h2 {
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .step-list {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .step {
      display: flex;
      gap: 1rem;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #059669;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content h3 {
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .step-content p {
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 1rem;
    }

    .upload-area:hover {
      border-color: #059669;
      background: #f0f7ff;
    }

    .upload-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .upload-help {
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .upload-tips {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .upload-tips h3 {
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .upload-tips ul {
      list-style: none;
      padding: 0;
    }

    .upload-tips li {
      color: #374151;
      margin-bottom: 0.75rem;
      padding-left: 1rem;
      position: relative;
    }

    .upload-tips li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #059669;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .bulk-upload-page {
        padding: 1rem;
      }

      .upload-container {
        grid-template-columns: 1fr;
      }

      .step {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class InventoryBulkUploadComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/owner/inventory']);
  }

  downloadTemplate() {
    // Create a simple CSV template
    const csvContent = `title,description,price,category,condition,consignor_email,sku,brand,size,color,notes
"Vintage Leather Jacket","Classic brown leather jacket in excellent condition",125.00,"Clothing","Good","john@example.com","VLJ-001","Wilson's","Large","Brown","Minor scuff on left sleeve"
"Antique Wooden Chair","Beautiful oak dining chair from the 1940s",85.00,"Furniture","Fair","sarah@example.com","AWC-002","Unknown","Standard","Natural","Some wear on seat"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected file:', file.name);

      // Here you would typically:
      // 1. Validate the file
      // 2. Upload to server
      // 3. Parse and validate the CSV
      // 4. Show preview of items to be imported
      // 5. Allow user to confirm import

      alert(`File selected: ${file.name}\\n\\nBulk import functionality coming soon!\\nFor now, this demonstrates the UX flow.`);
    }
  }
}