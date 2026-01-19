import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inventory-edit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-edit.component.html',
  styleUrls: ['./inventory-edit.component.scss']
})
export class InventoryEditComponent {
  itemId: string;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.itemId = this.route.snapshot.params['id'] || 'N/A';
  }

  goBack() {
    this.router.navigate(['/owner/inventory']);
  }
}