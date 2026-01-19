import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { OwnerHeaderComponent } from './owner-header.component';
import { OwnerFooterComponent } from './owner-footer.component';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, OwnerHeaderComponent, OwnerFooterComponent],
  templateUrl: './owner-layout.component.html',
  styleUrls: ['./owner-layout.component.scss']
})
export class OwnerLayoutComponent {
}