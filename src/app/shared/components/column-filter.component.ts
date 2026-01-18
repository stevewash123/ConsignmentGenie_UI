import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterType = 'text' | 'select' | 'date' | 'dateRange' | 'number';

@Component({
  selector: 'app-column-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Filter trigger button -->
    <button
      class="filter-trigger"
      [class.active]="hasActiveFilter()"
      [class.open]="isOpen()"
      (click)="toggle($event)"
      [title]="hasActiveFilter() ? 'Filter active - click to modify' : 'Click to filter'">
      <span class="filter-icon">▼</span>
      <span class="active-dot" *ngIf="hasActiveFilter()"></span>
    </button>

    <!-- Filter popover -->
    <div class="filter-popover" *ngIf="isOpen()" (click)="$event.stopPropagation()">
      <div class="filter-header">
        <span class="filter-title">Filter: {{ label }}</span>
        <button class="filter-close" (click)="close()">×</button>
      </div>

      <div class="filter-body">
        <!-- Text filter -->
        @if (filterType === 'text') {
          <input
            type="text"
            class="filter-control"
            [(ngModel)]="tempValue"
            [placeholder]="placeholder"
            (keyup.enter)="apply()"
            #inputRef>
        }

        <!-- Number filter -->
        @if (filterType === 'number') {
          <input
            type="number"
            class="filter-control"
            [(ngModel)]="tempValue"
            [placeholder]="placeholder"
            (keyup.enter)="apply()">
        }

        <!-- Select filter -->
        @if (filterType === 'select') {
          <select class="filter-control" [(ngModel)]="tempValue">
            <option value="">{{ placeholder || 'All' }}</option>
            @for (option of options; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        }

        <!-- Date filter -->
        @if (filterType === 'date') {
          <input
            type="date"
            class="filter-control"
            [(ngModel)]="tempValue">
        }

        <!-- Date range filter -->
        @if (filterType === 'dateRange') {
          <div class="date-range">
            <label>
              <span>From:</span>
              <input type="date" class="filter-control" [(ngModel)]="tempDateFrom">
            </label>
            <label>
              <span>To:</span>
              <input type="date" class="filter-control" [(ngModel)]="tempDateTo">
            </label>
          </div>
        }
      </div>

      <div class="filter-actions">
        <button class="btn-filter-clear" (click)="clear()" [disabled]="!hasActiveFilter() && !hasTempValue()">
          Clear
        </button>
        <button class="btn-filter-apply" (click)="apply()">
          Apply
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: relative;
      display: inline-flex;
      margin-left: 0.25rem;
    }

    .filter-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: var(--border-radius-sm, 4px);
      transition: all 0.15s ease;
      position: relative;

      &:hover {
        background: rgba(0, 0, 0, 0.08);
      }

      &.open {
        background: rgba(5, 150, 105, 0.15);
      }

      &.active {
        color: var(--color-med, #059669);
      }

      .filter-icon {
        font-size: 0.625rem;
        opacity: 0.6;
        transition: opacity 0.15s;
      }

      &:hover .filter-icon,
      &.active .filter-icon,
      &.open .filter-icon {
        opacity: 1;
      }

      .active-dot {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 6px;
        height: 6px;
        background: var(--color-med, #059669);
        border-radius: 50%;
      }
    }

    .filter-popover {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 100;
      min-width: 200px;
      background: white;
      border: 1px solid var(--color-med-dark, #047857);
      border-radius: var(--border-radius-md, 6px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: var(--color-light-med, hsl(130, 25%, 92%));
      border-bottom: 1px solid var(--color-neutral-light, #e5e7eb);

      .filter-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-primary, #1f2937);
      }

      .filter-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1rem;
        color: var(--color-text-muted, #6b7280);
        border-radius: var(--border-radius-sm, 4px);

        &:hover {
          background: rgba(0, 0, 0, 0.08);
          color: var(--color-text-primary, #1f2937);
        }
      }
    }

    .filter-body {
      padding: 0.75rem;
    }

    .filter-control {
      width: 100%;
      padding: 0.5rem 0.625rem;
      border: 1.5px solid var(--color-neutral-dark, #6b7280);
      border-radius: var(--border-radius-md, 6px);
      font-size: 0.8125rem;
      color: var(--color-text-primary, #1f2937);
      background: white;

      &:focus {
        outline: none;
        border-color: var(--color-med, #059669);
        box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1);
      }

      &::placeholder {
        color: var(--color-text-muted, #6b7280);
      }
    }

    select.filter-control {
      cursor: pointer;
    }

    .date-range {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        span {
          font-size: 0.75rem;
          color: var(--color-text-muted, #6b7280);
        }
      }
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--color-neutral-light, #f3f4f6);
      border-top: 1px solid var(--color-neutral-light, #e5e7eb);
    }

    .btn-filter-clear,
    .btn-filter-apply {
      padding: 0.375rem 0.75rem;
      border-radius: var(--border-radius-md, 6px);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-filter-clear {
      background: transparent;
      border: 1px solid var(--color-neutral-med, #9ca3af);
      color: var(--color-text-secondary, #374151);

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-filter-apply {
      background: var(--color-med, #059669);
      border: 1px solid var(--color-med, #059669);
      color: white;

      &:hover {
        background: var(--color-med-dark, #047857);
        border-color: var(--color-med-dark, #047857);
      }
    }
  `]
})
export class ColumnFilterComponent {
  @Input() filterType: FilterType = 'text';
  @Input() options: FilterOption[] = [];
  @Input() value: any = null;
  @Input() placeholder = 'Filter...';
  @Input() label = '';

  @Output() filterChange = new EventEmitter<any>();
  @Output() filterClear = new EventEmitter<void>();

  isOpen = signal(false);

  // Temp values for editing before apply
  tempValue: any = '';
  tempDateFrom: string = '';
  tempDateTo: string = '';

  constructor(private elementRef: ElementRef) {}

  // Click outside to close
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  // Escape to close
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.close();
    }
  }

  hasActiveFilter = computed(() => {
    if (this.filterType === 'dateRange') {
      return !!(this.value?.from || this.value?.to);
    }
    return this.value !== null && this.value !== undefined && this.value !== '';
  });

  hasTempValue(): boolean {
    if (this.filterType === 'dateRange') {
      return !!(this.tempDateFrom || this.tempDateTo);
    }
    return this.tempValue !== null && this.tempValue !== undefined && this.tempValue !== '';
  }

  toggle(event: MouseEvent) {
    event.stopPropagation();
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    // Initialize temp values from current value
    if (this.filterType === 'dateRange') {
      this.tempDateFrom = this.value?.from || '';
      this.tempDateTo = this.value?.to || '';
    } else {
      this.tempValue = this.value ?? '';
    }
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  apply() {
    if (this.filterType === 'dateRange') {
      const rangeValue = {
        from: this.tempDateFrom || null,
        to: this.tempDateTo || null
      };
      this.filterChange.emit(rangeValue);
    } else {
      this.filterChange.emit(this.tempValue || null);
    }
    this.close();
  }

  clear() {
    this.tempValue = '';
    this.tempDateFrom = '';
    this.tempDateTo = '';
    this.filterClear.emit();
    this.close();
  }
}