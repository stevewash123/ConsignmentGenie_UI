import { Component, OnInit, signal, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';
import { MockConsignorItemService } from '../../consignor/services/mock-consignor-item.service';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

interface UserData {
  userId: string;
  email: string;
  role: number;
  organizationId: string;
  organizationName: string;
}

@Component({
  selector: 'app-owner-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  templateUrl: './owner-header.component.html',
  styleUrls: ['./owner-header.component.scss']
})
export class OwnerHeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentUser = signal<UserData | null>(null);
  showUserMenu = signal(false);

  constructor(
    private router: Router,
    private mockService: MockConsignorItemService,
    private authService: AuthService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData() {
    // Use AuthService instead of localStorage directly
    const userData = this.authService.getCurrentUser();
    if (userData) {
      this.currentUser.set(userData);
    }
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  getInitials(email?: string): string {
    if (!email) return 'O';
    return email.substring(0, 2).toUpperCase();
  }

  toggleUserMenu() {
    this.showUserMenu.update(show => !show);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.showUserMenu()) {
      this.showUserMenu.set(false);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}