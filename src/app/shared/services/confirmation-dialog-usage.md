# Confirmation Dialog Service Usage Guide

The `ConfirmationDialogService` provides a reusable, consistent way to show confirmation dialogs throughout the application. It replaces individual modal implementations with a centralized service.

## Setup

The confirmation dialog component is already included in the main app component, so you only need to inject the service in your components.

```typescript
import { ConfirmationDialogService } from '../shared/services/confirmation-dialog.service';

constructor(private confirmationService: ConfirmationDialogService) {}
```

## Basic Usage Examples

### 1. Simple Confirmation (Yes/No)

```typescript
async confirmSimpleAction() {
  const result = await this.confirmationService.confirmAction(
    'Save Changes',
    'Are you sure you want to save these changes?',
    'Save'
  ).toPromise();

  if (result?.confirmed) {
    // User clicked "Save"
    this.saveData();
  }
}
```

### 2. Delete Confirmation (Destructive Action)

```typescript
async deleteItem(itemName: string, itemId: string) {
  const result = await this.confirmationService.confirmDelete(itemName).toPromise();

  if (result?.confirmed) {
    // User clicked "Delete"
    this.itemService.delete(itemId).subscribe({
      next: () => this.loadItems(),
      error: (error) => console.error('Delete failed:', error)
    });
  }
}
```

### 3. Rejection with Optional Reason

```typescript
async rejectApplication(applicationName: string, userId: string) {
  const result = await this.confirmationService.rejectWithReason(applicationName).toPromise();

  if (result?.confirmed) {
    const reason = result.inputValue; // Optional text from user

    this.userService.reject(userId, reason).subscribe({
      next: () => this.loadApplications(),
      error: (error) => console.error('Rejection failed:', error)
    });
  }
}
```

### 4. Custom Input Dialog

```typescript
async addComment() {
  const result = await this.confirmationService.confirmWithInput(
    'Add Comment',
    'Please enter your comment:',
    'Comment',
    'Type your comment here...',
    'Add Comment'
  ).toPromise();

  if (result?.confirmed && result.inputValue) {
    this.addCommentToItem(result.inputValue);
  }
}
```

### 5. Fully Custom Dialog

```typescript
async customConfirmation() {
  const result = await this.confirmationService.confirm({
    title: 'Custom Action',
    message: 'This is a custom confirmation dialog with specific options.',
    confirmButtonText: 'Proceed',
    cancelButtonText: 'Go Back',
    isDestructive: false,
    showInput: false
  }).toPromise();

  if (result?.confirmed) {
    this.doCustomAction();
  }
}
```

## Migration from Existing Modals

### Before (Old Modal Pattern)
```typescript
// Old approach with manual modal state
showDeleteModal = false;
selectedItem: Item | null = null;

openDeleteModal(item: Item) {
  this.selectedItem = item;
  this.showDeleteModal = true;
}

closeDeleteModal() {
  this.showDeleteModal = false;
  this.selectedItem = null;
}

confirmDelete() {
  if (this.selectedItem) {
    this.itemService.delete(this.selectedItem.id);
    this.closeDeleteModal();
  }
}
```

### After (New Service Pattern)
```typescript
// New approach with service
async deleteItem(item: Item) {
  const result = await this.confirmationService.confirmDelete(item.name).toPromise();

  if (result?.confirmed) {
    this.itemService.delete(item.id);
  }
}
```

## Available Methods

| Method | Purpose | Shows Input | Is Destructive |
|--------|---------|-------------|----------------|
| `confirm(data)` | Fully customizable | Optional | Configurable |
| `confirmAction(title, message, actionName)` | Basic confirmation | No | No |
| `confirmDelete(itemName, customMessage?)` | Delete confirmations | No | Yes |
| `confirmWithInput(title, message, inputLabel, placeholder?, actionName?)` | Input required | Yes | No |
| `rejectWithReason(itemName)` | Rejection with optional reason | Yes | Yes |

## Dialog Features

- **Consistent Design**: Matches application theme
- **Animations**: Smooth fade and slide animations
- **Keyboard Support**: ESC to cancel, Enter to confirm (when appropriate)
- **Mobile Responsive**: Adapts to different screen sizes
- **Loading States**: Shows loading spinner on confirm button
- **Focus Management**: Proper focus handling for accessibility

## Styling

The dialog automatically applies appropriate styling:
- **Destructive actions**: Red confirm button with warning icon
- **Normal actions**: Blue confirm button with question icon
- **Input fields**: Proper form styling with focus states
- **Mobile**: Stack buttons vertically on small screens

## Best Practices

1. **Use specific method names**: Use `confirmDelete()` for deletions, `rejectWithReason()` for rejections
2. **Provide clear messages**: Write descriptive confirmation text
3. **Handle errors**: Always wrap service calls in try-catch or subscribe error handlers
4. **Don't block UI**: Use async/await for clean promise handling
5. **Remove old modal code**: Clean up manual modal state management when migrating

## Complete Migration Example

Here's how the admin owner approval component was migrated:

**Before:**
- 80+ lines of modal template HTML
- 50+ lines of modal-related CSS
- Manual state management (showModal, selectedOwner, rejectReason)
- Custom modal methods (showRejectModal, closeRejectModal, confirmRejectOwner)

**After:**
- 0 lines of modal template (removed)
- 0 lines of modal CSS (removed)
- Single method call: `this.confirmationService.rejectWithReason()`
- Cleaner, more maintainable code