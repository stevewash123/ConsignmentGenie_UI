import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LookupItem } from '../../models/inventory.model';

@Component({
  selector: 'app-lookup-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lookup-management.component.html',
  styleUrls: ['./lookup-management.component.scss']
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