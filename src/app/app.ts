import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog.component';
import { LoadingService } from './shared/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, ConfirmationDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ConsignmentGenie');
  isLoading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.anyLoading$;
  }
}
