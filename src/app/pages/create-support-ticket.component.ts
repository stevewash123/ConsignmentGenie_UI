import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { SupportTicketService } from '../services/support-ticket.service';
import { NotificationService } from '../shared/services/notification.service';
import { LoadingService } from '../shared/services/loading.service';
import { SupportTicketFormComponent } from '../shared/components/support-ticket-form.component';
import { CreateTicketRequest } from '../models/support-ticket.model';

@Component({
  selector: 'app-create-support-ticket',
  standalone: true,
  imports: [CommonModule, SupportTicketFormComponent],
  templateUrl: './create-support-ticket.component.html',
  styles: []
})
export class CreateSupportTicketComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;

  constructor(
    private router: Router,
    private supportTicketService: SupportTicketService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmitTicket(request: CreateTicketRequest): void {
    this.isLoading = true;
    this.loadingService.start('create-ticket');

    this.supportTicketService.createTicket(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.stop('create-ticket');
        })
      )
      .subscribe({
        next: (ticket) => {
          // Navigate to the ticket view or back to the tickets list
          this.router.navigate(['/support-tickets', ticket.id]);
        },
        error: (error) => {
          console.error('Error creating ticket:', error);
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/support-tickets']);
  }
}