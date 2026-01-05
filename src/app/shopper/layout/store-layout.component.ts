import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { StoreHeaderComponent } from './store-header.component';
import { ShopperStoreService, StoreInfoDto } from '../services/shopper-store.service';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, StoreHeaderComponent],
  templateUrl: './store-layout.component.html',
  styleUrls: ['./store-layout.component.scss']
})
export class StoreLayoutComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug: string = '';
  currentYear = new Date().getFullYear();

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storeService: ShopperStoreService
  ) {}

  ngOnInit(): void {
    // Get store slug from route parameters and load store info
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.storeSlug = params.get('storeSlug') || '';
        if (!this.storeSlug) {
          throw new Error('No store slug provided');
        }
        return this.storeService.getStoreInfo(this.storeSlug);
      })
    ).subscribe({
      next: (storeInfo) => {
        this.storeInfo = storeInfo;
        this.updatePageTitle(storeInfo.name);
      },
      error: (error) => {
        console.error('Failed to load store information:', error);
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.storeService.clearCurrentStore();
  }

  private updatePageTitle(storeName: string): void {
    // Update page title to include store name
    const currentTitle = document.title;
    if (!currentTitle.includes(storeName)) {
      document.title = `${storeName} - ${currentTitle}`;
    }
  }
}