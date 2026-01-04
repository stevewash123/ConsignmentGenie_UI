import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OwnerHeaderComponent } from './owner-header.component';
import { OwnerFooterComponent } from './owner-footer.component';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, OwnerHeaderComponent, OwnerFooterComponent],
  templateUrl: './owner-layout.component.html',
})
export class OwnerLayoutComponent {
}