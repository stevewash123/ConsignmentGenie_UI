import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-keeping-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-keeping-general.component.html',
  styleUrls: ['./book-keeping-general.component.scss']
})
export class BookKeepingGeneralComponent implements OnInit {
  isLoading = signal(false);
  isSaving = signal(false);

  useQuickBooks = signal(false);
  quickBooksConnected = signal(false);

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.isLoading.set(true);
    try {
      // TODO: Load settings from API
      await this.simulateApiCall();

      // Mock data for demonstration
      this.useQuickBooks.set(false);
      this.quickBooksConnected.set(false);
    } catch (error) {
      console.error('Failed to load bookkeeping settings:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onQuickBooksToggle() {
    const newValue = !this.useQuickBooks();
    this.useQuickBooks.set(newValue);

    // If disabling, also mark as not connected
    if (!newValue) {
      this.quickBooksConnected.set(false);
    }

    this.autoSave();
  }

  private async autoSave() {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    try {
      // TODO: Save to API
      await this.simulateApiCall();
    } catch (error) {
      console.error('Failed to save bookkeeping settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private async simulateApiCall(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}