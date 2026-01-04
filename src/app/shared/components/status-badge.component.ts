import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsignorStatus } from '../../models/consignor.model';
import { ENTITY_LABELS } from '../constants/labels';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() status: ConsignorStatus = 'active';

  get badgeClass(): string {
    const classes = {
      active: 'bg-green-100 text-green-800 border-green-200',
      invited: 'bg-blue-100 text-blue-800 border-blue-200',
      inactive: 'bg-gray-100 text-gray-600 border-gray-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      closed: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return `px-2 py-1 rounded-full text-sm font-medium border ${classes[this.status] || classes.inactive}`;
  }

  get label(): string {
    const key = `ConsignorStatus${this.status.charAt(0).toUpperCase() + this.status.slice(1)}` as keyof typeof ENTITY_LABELS;
    return ENTITY_LABELS[key];
  }
}