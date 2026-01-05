import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingNumber?: string;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug = '';

  // Sample order data for Phase 1 MVP
  orders: Order[] = [
    {
      id: '1',
      orderNumber: '1001',
      date: new Date('2024-01-15'),
      status: 'delivered',
      items: [
        {
          id: '1',
          name: 'Vintage Leather Jacket',
          price: 125.00,
          quantity: 1,
          imageUrl: ''
        },
        {
          id: '2',
          name: 'Classic Handbag',
          price: 85.00,
          quantity: 1,
          imageUrl: ''
        }
      ],
      subtotal: 210.00,
      tax: 16.80,
      shipping: 0.00,
      total: 226.80,
      shippingAddress: {
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      trackingNumber: 'TRK1234567890'
    },
    {
      id: '2',
      orderNumber: '1002',
      date: new Date('2024-01-10'),
      status: 'shipped',
      items: [
        {
          id: '3',
          name: 'Antique Wooden Table',
          price: 450.00,
          quantity: 1,
          imageUrl: ''
        }
      ],
      subtotal: 450.00,
      tax: 36.00,
      shipping: 0.00,
      total: 486.00,
      shippingAddress: {
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      trackingNumber: 'TRK0987654321'
    },
    {
      id: '3',
      orderNumber: '1003',
      date: new Date('2024-01-05'),
      status: 'processing',
      items: [
        {
          id: '4',
          name: 'Modern Art Print',
          price: 75.00,
          quantity: 2,
          imageUrl: ''
        }
      ],
      subtotal: 150.00,
      tax: 12.00,
      shipping: 15.00,
      total: 177.00,
      shippingAddress: {
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      }
    }
  ];

  paginatedOrders: Order[] = [];
  currentPage = 1;
  ordersPerPage = 5;
  totalPages = 1;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private storeService: ShopperStoreService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
    });

    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });

    this.orders.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.totalPages = Math.ceil(this.orders.length / this.ordersPerPage);
    this.updatePagination();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  canReorder(order: Order): boolean {
    return order.status === 'delivered';
  }

  canCancel(order: Order): boolean {
    return order.status === 'pending' || order.status === 'processing';
  }

  viewOrderDetails(order: Order): void {
    // TODO: Navigate to detailed order view or show modal
    alert(`Viewing details for order #${order.orderNumber}`);
  }

  reorderItems(order: Order): void {
    // TODO: Add order items to cart
    alert(`Adding items from order #${order.orderNumber} to cart`);
  }

  cancelOrder(order: Order): void {
    if (confirm(`Are you sure you want to cancel order #${order.orderNumber}?`)) {
      // TODO: Call API to cancel order
      order.status = 'cancelled';
      alert(`Order #${order.orderNumber} has been cancelled`);
    }
  }

  trackOrder(order: Order, event: Event): void {
    event.preventDefault();
    if (order.trackingNumber) {
      // TODO: Open tracking page or modal
      alert(`Tracking package: ${order.trackingNumber}`);
    }
  }

  contactSupport(): void {
    // TODO: Open contact support modal or redirect to support page
    alert('Support contact functionality will be implemented in a future update.');
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onImageError(event: any): void {
    event.target.src = '/assets/placeholder-item.jpg';
  }

  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.ordersPerPage;
    const endIndex = startIndex + this.ordersPerPage;
    this.paginatedOrders = this.orders.slice(startIndex, endIndex);
  }
}