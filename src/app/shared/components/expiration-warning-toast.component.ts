import { Component, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { ItemReservationService } from '../../services/item-reservation.service';

export interface WarningToastData {
  item: {
    id: string;
    name: string;
  };
  timeRemaining: number;
}

@Component({
  selector: 'app-expiration-warning-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expiration-warning-toast.component.html',
  styleUrls: ['./expiration-warning-toast.component.scss']
})
export class ExpirationWarningToastComponent implements OnInit, OnDestroy {
  private timerSubscription?: Subscription;
  private autoDismissTimer?: number;

  // Inputs
  warningData = input.required<WarningToastData>();

  // Outputs
  dismissed = output<void>();

  // State
  isVisible = signal(false);
  currentTimeRemaining = signal(0);

  ngOnInit(): void {
    // Initialize with the provided time
    this.currentTimeRemaining.set(this.warningData().timeRemaining);

    // Show the toast
    setTimeout(() => this.isVisible.set(true), 100);

    // Start countdown timer
    this.timerSubscription = interval(1000).subscribe(() => {
      const remaining = this.currentTimeRemaining();
      if (remaining > 0) {
        this.currentTimeRemaining.set(remaining - 1000);
      } else {
        this.dismiss();
      }
    });

    // Auto-dismiss after 10 seconds
    this.autoDismissTimer = window.setTimeout(() => {
      this.dismiss();
    }, 10000);
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    if (this.autoDismissTimer) {
      window.clearTimeout(this.autoDismissTimer);
    }
  }

  formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  dismiss(): void {
    this.isVisible.set(false);
    setTimeout(() => {
      this.dismissed.emit();
    }, 300); // Wait for animation to complete
  }
}