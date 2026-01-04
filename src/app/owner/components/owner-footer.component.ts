import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuggestionBoxModalComponent, SuggestionFormData } from './suggestion-box-modal.component';

interface UserData {
  userId: string;
  email: string;
  role: number;
  organizationId: string;
  organizationName: string;
}

@Component({
  selector: 'app-owner-footer',
  standalone: true,
  imports: [CommonModule, SuggestionBoxModalComponent],
  templateUrl: './owner-footer.component.html',
})
export class OwnerFooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  currentUser = signal<UserData | null>(null);
  showSuggestionModal = signal<boolean>(false);

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        this.currentUser.set(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data from localStorage', error);
        this.currentUser.set(null);
      }
    }
  }

  openSuggestionBox() {
    this.showSuggestionModal.set(true);
  }

  closeSuggestionBox() {
    this.showSuggestionModal.set(false);
  }

  onSuggestionSubmit(suggestionData: SuggestionFormData) {
    console.log('Suggestion submitted:', suggestionData);

    // For now, just log to console and show a simple alert
    // TODO: Integrate with backend API when notification service is ready
    alert(`Thank you for your ${suggestionData.type.toLowerCase()} suggestion! We'll review it and get back to you.`);

    this.closeSuggestionBox();
  }
}