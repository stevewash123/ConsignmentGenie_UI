import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-column-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="column-filter">
      <select
        class="filter-select"
        [value]="selectedValue"
        (change)="onSelectionChange($event)"
        [title]="label">
        <option value="">{{ placeholder }}</option>
        <option
          *ngFor="let option of options"
          [value]="option.value">
          {{ option.label }}
        </option>
      </select>
      <button
        *ngIf="selectedValue"
        type="button"
        class="clear-btn"
        (click)="clearFilter()"
        title="Clear filter">
        ×
      </button>
    </div>
  `,
  styles: [`
    .column-filter {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .filter-select {
      width: 100%;
      min-width: 120px;
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--color-neutral-dark);
      border-radius: var(--border-radius-sm);
      font-size: 0.75rem;
      background: white;
      color: var(--color-text-primary);
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--color-med);
      box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1);
    }

    .clear-btn {
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.125rem 0.25rem;
      border-radius: var(--border-radius-sm);
      line-height: 1;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .clear-btn:hover {
      background: var(--color-neutral-light);
      color: var(--color-text-primary);
    }
  `]
})
export class ColumnFilterComponent {
  @Input() filterType: 'select' | 'text' = 'select';
  @Input() label: string = '';
  @Input() placeholder: string = 'All';
  @Input() options: FilterOption[] = [];

  @Output() filterChange = new EventEmitter<string>();
  @Output() filterClear = new EventEmitter<void>();

  selectedValue = '';

  onSelectionChange(event: any): void {
    this.selectedValue = event.target.value;
    this.filterChange.emit(this.selectedValue);
  }

  clearFilter(): void {
    this.selectedValue = '';
    this.filterClear.emit();
  }
}