import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';
import { AppFooterComponent } from '../../shared/components/app-footer.component';

@Component({
  selector: 'app-consignor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, NotificationBellComponent, AppFooterComponent],
  templateUrl: './consignor-layout.component.html',
  styleUrls: ['./consignor-layout.component.scss']
})
export class ConsignorLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userMenuOpen = false;

  constructor() {}

  ngOnInit() {
    // Close user menu when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }


  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu() {
    this.userMenuOpen = false;
  }

  private onDocumentClick(event: Event) {
    const target = event.target as Element;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }

  logout() {
    // TODO: Implement proper logout logic with auth service
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}