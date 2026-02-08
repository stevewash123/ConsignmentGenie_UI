import { Injectable, signal, computed } from '@angular/core';
import { UserRole } from '../guards/auth.guard';

export interface ClerkPermissions {
  showConsignorNames: boolean;
  canAddItems: boolean;
  canAddItemsToActive: boolean;
  canOpenCashDrawer: boolean;
  canProcessReturns: boolean;
  returnLimit?: number;
  canCountDrawer: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private currentUserRole = signal<UserRole | null>(null);
  private clerkPermissions = signal<ClerkPermissions>({
    showConsignorNames: false,
    canAddItems: false,
    canAddItemsToActive: false,
    canOpenCashDrawer: false,
    canProcessReturns: false,
    canCountDrawer: false
  });

  // Computed permissions
  isOwner = computed(() => this.currentUserRole() === UserRole.Owner);
  isClerk = computed(() => this.currentUserRole() === UserRole.Clerk);
  isAdmin = computed(() => this.currentUserRole() === UserRole.Admin);

  // POS permissions
  canApplyDiscountWithoutPin = computed(() => this.isOwner());
  canVoidTransactionWithoutPin = computed(() => this.isOwner());
  canViewConsignorInfo = computed(() => this.isOwner() || this.clerkPermissions().showConsignorNames);
  canViewCostInfo = computed(() => this.isOwner());
  canUseQuickSell = computed(() => this.isOwner());

  // Inventory permissions
  canEditItems = computed(() => this.isOwner());
  canRemoveItems = computed(() => this.isOwner());
  canAddItems = computed(() => this.isOwner() || this.clerkPermissions().canAddItems);
  canAddItemsToActive = computed(() => this.isOwner() || this.clerkPermissions().canAddItemsToActive);
  canManageCategories = computed(() => this.isOwner());
  canBulkUpload = computed(() => this.isOwner());
  canAccessPendingImports = computed(() => this.isOwner());

  // General permissions
  canAccessInventory = computed(() => this.isOwner() || this.isClerk());
  canAccessReports = computed(() => this.isOwner());
  canAccessSettings = computed(() => this.isOwner());
  canAccessConsignors = computed(() => this.isOwner());
  canAccessPayouts = computed(() => this.isOwner());

  constructor() {
    this.loadUserRole();
    this.loadClerkPermissions();
  }

  private loadUserRole() {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        this.currentUserRole.set(userData.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }

  private loadClerkPermissions() {
    // In a real implementation, this would load from the backend
    // For now, using default permissions
    const defaultPermissions: ClerkPermissions = {
      showConsignorNames: false,
      canAddItems: false,
      canAddItemsToActive: false,
      canOpenCashDrawer: false,
      canProcessReturns: false,
      canCountDrawer: false
    };
    this.clerkPermissions.set(defaultPermissions);
  }

  updateClerkPermissions(permissions: ClerkPermissions) {
    this.clerkPermissions.set(permissions);
  }

  hasPermission(permission: string): boolean {
    switch (permission) {
      case 'view.consignor':
        return this.canViewConsignorInfo();
      case 'view.cost':
        return this.canViewCostInfo();
      case 'edit.items':
        return this.canEditItems();
      case 'remove.items':
        return this.canRemoveItems();
      case 'add.items':
        return this.canAddItems();
      case 'manage.categories':
        return this.canManageCategories();
      case 'access.inventory':
        return this.canAccessInventory();
      case 'access.reports':
        return this.canAccessReports();
      case 'access.settings':
        return this.canAccessSettings();
      case 'quick.sell':
        return this.canUseQuickSell();
      default:
        return false;
    }
  }

  canPerformWithoutPin(action: string): boolean {
    switch (action) {
      case 'discount':
        return this.canApplyDiscountWithoutPin();
      case 'void':
        return this.canVoidTransactionWithoutPin();
      case 'openDrawer':
        return this.isOwner() || this.clerkPermissions().canOpenCashDrawer;
      case 'processReturn':
        return this.isOwner() || this.clerkPermissions().canProcessReturns;
      case 'countDrawer':
        return this.isOwner() || this.clerkPermissions().canCountDrawer;
      default:
        return false;
    }
  }

  getClerkPermissions(): ClerkPermissions {
    return this.clerkPermissions();
  }
}