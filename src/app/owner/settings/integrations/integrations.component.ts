import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SquareConnectionComponent } from './square-connection.component';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, SquareConnectionComponent],
  template: `
    <div class="integrations-settings">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Integrations</h2>
        <p class="mt-2 text-gray-600">Connect your ConsignmentGenie shop with external services and platforms.</p>
      </div>

      <div class="space-y-8">
        <!-- Square Integration Section -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <app-square-connection></app-square-connection>
        </div>

        <!-- Future integrations can be added here -->
        <!-- QuickBooks, Shopify, etc. -->
      </div>
    </div>
  `,
  styles: []
})
export class IntegrationsComponent {
  constructor() {}
}