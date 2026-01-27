import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookkeepingSettingsService } from '../../../../services/bookkeeping-settings.service';
import { firstValueFrom } from 'rxjs';

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

  constructor(
    private bookkeepingService: BookkeepingSettingsService
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.isLoading.set(true);
    try {
      const settings = await firstValueFrom(this.bookkeepingService.getSettings());
      this.useQuickBooks.set(settings.useQuickBooks);
      this.quickBooksConnected.set(settings.quickBooksConnected);
    } catch (error) {
      console.error('Failed to load bookkeeping settings:', error);
      // Set defaults on error
      this.useQuickBooks.set(false);
      this.quickBooksConnected.set(false);
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
      const updates = {
        useQuickBooks: this.useQuickBooks(),
        quickBooksConnected: this.quickBooksConnected()
      };

      await firstValueFrom(this.bookkeepingService.patchSettings(updates));
      console.log('Bookkeeping settings saved successfully');
    } catch (error) {
      console.error('Failed to save bookkeeping settings:', error);
      // TODO: Show error message to user
    } finally {
      this.isSaving.set(false);
    }
  }
}