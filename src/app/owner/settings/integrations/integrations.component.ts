import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SquareConnectionComponent } from './square-connection.component';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, SquareConnectionComponent],
  templateUrl: './integrations.component.html',
  styleUrls: ['./integrations.component.scss']
})
export class IntegrationsComponent {
  constructor() {}
}