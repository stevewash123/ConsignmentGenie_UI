import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventory-add',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-add.component.html',
  styleUrls: ['./inventory-add.component.scss']
})
export class InventoryAddComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/owner/inventory']);
  }
}