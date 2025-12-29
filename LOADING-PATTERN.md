# Loading State Management Pattern

## ⚠️ CRITICAL: Always Use finalize() with LoadingService

### The Problem
Components often forget to clean up loading states when API calls fail, leaving spinners stuck forever.

### The Solution
**ALWAYS use the `finalize` operator** to ensure loading cleanup happens regardless of success/error.

## ✅ CORRECT Pattern

```typescript
import { finalize } from 'rxjs/operators';

loadData() {
  this.loadingService.start('data-loading');

  this.dataService.getData()
    .pipe(
      finalize(() => this.loadingService.stop('data-loading')) // ALWAYS called
    )
    .subscribe({
      next: (data) => {
        // Handle success
        this.data = data;
      },
      error: (error) => {
        // Handle error
        console.error('Failed to load data:', error);
        this.showError('Failed to load data');
      }
    });
}
```

## ❌ WRONG Pattern (Causes Stuck Spinners)

```typescript
// DON'T DO THIS - loading stops only on success
loadData() {
  this.loadingService.start('data-loading');

  this.dataService.getData().subscribe({
    next: (data) => {
      this.data = data;
      this.loadingService.stop('data-loading'); // Only called on success!
    },
    error: (error) => {
      console.error('Failed to load data:', error);
      // Loading state is STUCK - never cleaned up!
    }
  });
}
```

## Emergency Cleanup
If loading states get stuck during development:

```typescript
// Clear all loading states (debugging only)
this.loadingService.clear();

// Check what's currently loading
console.log('Active loading keys:', this.loadingService.activeKeys);
```

## Multiple Operations
For components with multiple API calls, use unique keys:

```typescript
loadTransactions() {
  this.loadingService.start('transactions');
  // ... with finalize(() => this.loadingService.stop('transactions'))
}

loadMetrics() {
  this.loadingService.start('metrics');
  // ... with finalize(() => this.loadingService.stop('metrics'))
}

isTransactionsLoading(): boolean {
  return this.loadingService.isLoading('transactions');
}

isMetricsLoading(): boolean {
  return this.loadingService.isLoading('metrics');
}
```

## Rule: Never Forget finalize()
Every `this.loadingService.start()` MUST have a corresponding `finalize(() => this.loadingService.stop())` in the pipe.