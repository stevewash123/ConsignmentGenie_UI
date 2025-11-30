import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderStatus } from '../../models/provider.model';
import { ENTITY_LABELS } from '../constants/labels';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="badgeClass">
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: ProviderStatus = 'active';

  get badgeClass(): string {
    const classes = {
      active: 'bg-green-100 text-green-800 border-green-200',
      invited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return `px-2 py-1 rounded-full text-sm font-medium border ${classes[this.status]}`;
  }

  get label(): string {
    const key = `providerStatus${this.status.charAt(0).toUpperCase() + this.status.slice(1)}` as keyof typeof ENTITY_LABELS;
    return ENTITY_LABELS[key];
  }
}