import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      {{ status }}
    </span>
  `,
  styles: [`
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-available {
      background-color: #10b981;
      color: white;
    }

    .status-sold {
      background-color: #3b82f6;
      color: white;
    }

    .status-withdrawn {
      background-color: #f59e0b;
      color: white;
    }

    .status-damaged {
      background-color: #ef4444;
      color: white;
    }

    .status-lost {
      background-color: #6b7280;
      color: white;
    }

    .requires-response {
      animation: pulse 2s infinite;
      border: 2px solid #f59e0b;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() requiresResponse: boolean = false;

  get badgeClasses(): string {
    const baseClasses = 'status-badge';
    const statusClass = `status-${this.status.toLowerCase()}`;
    const responseClass = this.requiresResponse ? 'requires-response' : '';
    return `${baseClasses} ${statusClass} ${responseClass}`.trim();
  }
}