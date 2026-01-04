import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [CommonModule, OwnerLayoutComponent],
  templateUrl: './inventory-detail.component.html',
  styleUrls: ['./inventory-detail.component.scss']
})
export class InventoryDetailComponent {
  itemId: string;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.itemId = this.route.snapshot.params['id'] || 'N/A';
  }

  goBack() {
    this.router.navigate(['/owner/inventory']);
  }
}