import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LookupItem } from '../../models/inventory.model';

@Component({
  selector: 'app-lookup-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lookup-management">
      <div class="header">
        <div class="title-section">
          <h2>{{ title }}</h2>
          <p *ngIf="description" class="description">{{ description }}</p>
        </div>
        <button
          type="button"
          class="add-button"
          (click)="showAddForm = true"
          [disabled]="showAddForm"
        >
          <span class="icon">+</span>
          Add {{ title.slice(0, -1) }}
        </button>
      </div>

      <!-- Add new item form -->
      <div *ngIf="showAddForm" class="add-form-card">
        <div class="form-group">
          <label for="newItemName">{{ title.slice(0, -1) }} Name</label>
          <input
            #newItemInput
            id="newItemName"
            type="text"
            class="form-input"
            [(ngModel)]="newItemName"
            placeholder="Enter name..."
            maxlength="100"
            (keyup.enter)="handleAdd()"
            (keyup.escape)="cancelAdd()"
          />
        </div>
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="cancelAdd()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="handleAdd()"
            [disabled]="!newItemName?.trim()"
          >
            Add {{ title.slice(0, -1) }}
          </button>
        </div>
      </div>

      <!-- Items list -->
      <div class="items-container">
        <div *ngIf="items.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No {{ title.toLowerCase() }} yet</h3>
          <p>Get started by adding your first {{ title.slice(0, -1).toLowerCase() }}.</p>
        </div>

        <div *ngIf="items.length > 0" class="items-list">
          <div
            *ngFor="let item of items; trackBy: trackByItemId"
            class="item-row"
            [class.editing]="editingItemId === item.id"
          >
            <div *ngIf="allowReorder" class="drag-handle">
              ⋮⋮
            </div>

            <!-- Display mode -->
            <div *ngIf="editingItemId !== item.id" class="item-display">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span *ngIf="showCount && item.count !== undefined" class="item-count">
                  {{ item.count }} {{ itemLabel }}
                </span>
              </div>

              <div class="item-actions">
                <button
                  type="button"
                  class="action-btn edit-btn"
                  (click)="startEdit(item)"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  class="action-btn delete-btn"
                  (click)="handleDelete(item)"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- Edit mode -->
            <div *ngIf="editingItemId === item.id" class="item-edit">
              <input
                #editInput
                type="text"
                class="edit-input"
                [(ngModel)]="editingItemName"
                maxlength="100"
                (keyup.enter)="handleRename()"
                (keyup.escape)="cancelEdit()"
              />
              <div class="edit-actions">
                <button
                  type="button"
                  class="action-btn cancel-btn"
                  (click)="cancelEdit()"
                >
                  ✕
                </button>
                <button
                  type="button"
                  class="action-btn save-btn"
                  (click)="handleRename()"
                  [disabled]="!editingItemName?.trim()"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lookup-management {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      padding: 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .title-section h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .description {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .add-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      white-space: nowrap;
    }

    .add-button:hover:not(:disabled) {
      background: #2563eb;
    }

    .add-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .add-button .icon {
      font-size: 1rem;
      line-height: 1;
    }

    .add-form-card {
      padding: 1.5rem;
      background: #f0f7ff;
      border-bottom: 1px solid #e9ecef;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      max-width: 400px;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .items-container {
      padding: 1.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #ffffff;
      transition: all 0.2s;
    }

    .item-row:hover:not(.editing) {
      border-color: #d1d5db;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .item-row.editing {
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }

    .drag-handle {
      color: #9ca3af;
      cursor: grab;
      user-select: none;
      font-family: monospace;
      font-size: 0.75rem;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .item-display {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.875rem;
    }

    .item-count {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .item-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 4px;
      background: #f3f4f6;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .action-btn:hover {
      background: #e5e7eb;
      transform: scale(1.1);
    }

    .edit-btn:hover {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .delete-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .item-edit {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .edit-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .edit-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .edit-actions {
      display: flex;
      gap: 0.5rem;
    }

    .cancel-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .save-btn:hover:not(:disabled) {
      background: #dcfce7;
      color: #166534;
    }

    .save-btn:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .add-button {
        align-self: stretch;
        justify-content: center;
      }

      .item-row {
        padding: 0.5rem;
      }

      .item-display {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .item-actions {
        align-self: stretch;
        justify-content: flex-end;
      }

      .edit-actions {
        flex-shrink: 0;
      }
    }
  `]
})
export class LookupManagementComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() items: LookupItem[] = [];
  @Input() itemLabel: string = 'items';
  @Input() allowReorder: boolean = true;
  @Input() showCount: boolean = true;

  @Output() add = new EventEmitter<string>();
  @Output() rename = new EventEmitter<{id: string, name: string}>();
  @Output() delete = new EventEmitter<string>();
  @Output() reorder = new EventEmitter<string[]>();

  showAddForm = false;
  newItemName = '';
  editingItemId = '';
  editingItemName = '';

  startEdit(item: LookupItem) {
    this.editingItemId = item.id;
    this.editingItemName = item.name;
  }

  cancelEdit() {
    this.editingItemId = '';
    this.editingItemName = '';
  }

  handleRename() {
    if (!this.editingItemName?.trim()) return;

    this.rename.emit({
      id: this.editingItemId,
      name: this.editingItemName.trim()
    });

    this.cancelEdit();
  }

  handleAdd() {
    if (!this.newItemName?.trim()) return;

    this.add.emit(this.newItemName.trim());
    this.cancelAdd();
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newItemName = '';
  }

  handleDelete(item: LookupItem) {
    const itemCount = this.showCount && item.count !== undefined ? item.count : 0;
    const message = itemCount > 0
      ? `Delete "${item.name}"? This will affect ${itemCount} ${itemCount === 1 ? this.itemLabel.slice(0, -1) : this.itemLabel}.`
      : `Delete "${item.name}"?`;

    if (confirm(message)) {
      this.delete.emit(item.id);
    }
  }

  trackByItemId(index: number, item: LookupItem): string {
    return item.id;
  }
}