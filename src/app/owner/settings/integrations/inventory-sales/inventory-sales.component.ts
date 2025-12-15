import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-inventory-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory-sales.component.html',
  styles: [`
    .section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #111827;
    }
    .section-description {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .choice-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .choice-title {
      font-weight: 600;
      margin-bottom: 1rem;
      color: #374151;
    }
    .radio-group {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .radio-option:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .radio-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #1d4ed8;
    }
    .square-options {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1.5rem;
      margin-top: 1rem;
    }
    .square-options.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .placeholder {
      background: #f9fafb;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      padding: 2rem;
      text-align: center;
      color: #6b7280;
      margin-top: 1rem;
    }
  `]
})
export class InventorySalesComponent {
  configForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      provider: ['consignment-genie'] // Default to ConsignmentGenie
    });
  }

  get isSquareSelected(): boolean {
    return this.configForm.get('provider')?.value === 'square';
  }

  onProviderChange(provider: string): void {
    this.configForm.patchValue({ provider });
  }
}
