import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { SupportTicketService } from '../../services/support-ticket.service';
import { LoadingService } from '../../shared/services/loading.service';
import { SupportTicket, TICKET_STATUSES, TICKET_PRIORITIES, TicketStatus } from '../../models/support-ticket.model';

@Component({
  selector: 'app-admin-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-ticket-list.component.html',
  styleUrls: ['./admin-ticket-list.component.scss']
})
export class AdminTicketListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  isLoading = false;

  // Filter options
  selectedStatus: TicketStatus | 'all' = 'all';
  selectedAssignment: 'all' | 'owner' | 'admin' = 'all';

  // Make constants available to template
  TICKET_STATUSES = TICKET_STATUSES;
  TICKET_PRIORITIES = TICKET_PRIORITIES;

  statuses = [
    { value: 'all' as const, label: 'All Statuses', color: 'text-gray-600' },
    ...TICKET_STATUSES
  ];

  assignments = [
    { value: 'all' as const, label: 'All Assignments' },
    { value: 'admin' as const, label: 'Assigned to Admin' },
    { value: 'owner' as const, label: 'Assigned to Owner' }
  ];

  constructor(
    private supportTicketService: SupportTicketService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.loadingService.start('support-tickets');

    this.supportTicketService.getAllTickets()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.stop('support-tickets');
        })
      )
      .subscribe({
        next: (tickets) => {
          this.tickets = tickets;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading tickets:', error);
        }
      });
  }

  applyFilters(): void {
    this.filteredTickets = this.tickets.filter(ticket => {
      const statusMatch = this.selectedStatus === 'all' || ticket.status === this.selectedStatus;
      const assignmentMatch = this.selectedAssignment === 'all' || ticket.assignedTo === this.selectedAssignment;
      return statusMatch && assignmentMatch;
    });
  }

  onStatusFilterChange(status: TicketStatus | 'all'): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onAssignmentFilterChange(assignment: 'all' | 'owner' | 'admin'): void {
    this.selectedAssignment = assignment;
    this.applyFilters();
  }

  getStatusClass(status: TicketStatus): string {
    return TICKET_STATUSES.find(s => s.value === status)?.color || 'text-gray-600';
  }

  getPriorityClass(priority: string): string {
    return TICKET_PRIORITIES.find(p => p.value === priority)?.color || 'text-gray-600';
  }

  reassignTicket(ticket: SupportTicket): void {
    const newAssignment = ticket.assignedTo === 'admin' ? 'owner' : 'admin';

    this.supportTicketService.reassignTicket(ticket.id, newAssignment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTicket) => {
          // Update the ticket in our local array
          const index = this.tickets.findIndex(t => t.id === ticket.id);
          if (index !== -1) {
            this.tickets[index] = updatedTicket;
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Error reassigning ticket:', error);
        }
      });
  }

  updateTicketStatus(ticket: SupportTicket, newStatus: TicketStatus): void {
    this.supportTicketService.updateTicket(ticket.id, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTicket) => {
          // Update the ticket in our local array
          const index = this.tickets.findIndex(t => t.id === ticket.id);
          if (index !== -1) {
            this.tickets[index] = updatedTicket;
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Error updating ticket status:', error);
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}