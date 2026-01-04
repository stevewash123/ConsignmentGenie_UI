import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  ConfirmationDialogService,
  ConfirmationDialogData,
  ConfirmationResult
} from '../services/confirmation-dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmation-dialog.component.html',
  animations: []
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  showDialog = signal(false);
  dialogData = signal<ConfirmationDialogData | null>(null);
  isConfirming = signal(false);
  inputValue = '';

  private destroy$ = new Subject<void>();

  constructor(private confirmationService: ConfirmationDialogService) {}

  ngOnInit(): void {
    this.confirmationService.dialog$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.dialogData.set(data);
      this.inputValue = data.inputValue || '';
      this.showDialog.set(true);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onOverlayClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    this.showDialog.set(false);
    this.confirmationService.sendResult({ confirmed: false });
  }

  onConfirm(): void {
    this.isConfirming.set(true);

    // Small delay to show the loading state
    setTimeout(() => {
      const result: ConfirmationResult = {
        confirmed: true,
        inputValue: this.dialogData()?.showInput ? this.inputValue : undefined
      };

      this.showDialog.set(false);
      this.isConfirming.set(false);
      this.confirmationService.sendResult(result);
    }, 300);
  }
}