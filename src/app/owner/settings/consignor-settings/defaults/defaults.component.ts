import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-defaults',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './defaults.component.html',
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
    .placeholder {
      background: #f9fafb;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }
  `]
})
export class DefaultsComponent {

}
