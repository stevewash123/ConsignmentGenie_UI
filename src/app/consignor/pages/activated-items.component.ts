import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedItemsModalComponent } from '../components/modals/activated-items-modal.component';

@Component({
  selector: 'app-activated-items',
  standalone: true,
  imports: [CommonModule, ActivatedItemsModalComponent],
  template: `
    <app-activated-items-modal
      [notificationId]="notificationId"
      [isVisible]="isModalVisible"
      (closed)="onModalClosed()">
    </app-activated-items-modal>
  `
})
export class ActivatedItemsComponent implements OnInit {
  notificationId: string | null = null;
  isModalVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get the notification ID from the route
    this.route.paramMap.subscribe(params => {
      this.notificationId = params.get('notificationId');
      this.isModalVisible = !!this.notificationId;
    });
  }

  onModalClosed() {
    // Navigate back to notifications when modal is closed
    this.router.navigate(['/consignor/notifications']);
  }
}