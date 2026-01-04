import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConsignorService } from '../../services/consignor.service';
import { PendingConsignorApproval, ConsignorApprovalRequest } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.scss']
})
export class PendingApprovalsComponent implements OnInit {
  pendingApprovals = signal<PendingConsignorApproval[]>([]);
  selectedApproval = signal<PendingConsignorApproval | null>(null);
  approvalAction = signal<'approve' | 'reject' | 'request_info'>('approve');
  approvalMessage = '';

  isModalOpen = signal(false);
  isProcessing = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private consignorService: ConsignorService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  isLoading(): boolean {
    return this.loadingService.isLoading('pending-approvals');
  }

  loadPendingApprovals(): void {
    this.loadingService.start('pending-approvals');
    this.consignorService.getPendingApprovals().subscribe({
      next: (approvals) => {
        this.pendingApprovals.set(approvals || []);
      },
      error: (error) => {
        console.error('Error loading pending approvals:', error);
        this.errorMessage.set('Failed to load pending approvals. Please try again.');
        // For now, show mock data when API fails so you can see the design
        this.pendingApprovals.set([
          {
            id: 1,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '(555) 123-4567',
            registrationDate: new Date('2024-12-20'),
            storeCode: 'VINTAGE2024',
            registrationInfo: 'I have a large collection of vintage clothing and accessories from the 1960s-1980s that I would like to consign.'
          },
          {
            id: 2,
            name: 'Mike Chen',
            email: 'mike.chen@email.com',
            registrationDate: new Date('2024-12-18'),
            storeCode: 'VINTAGE2024',
            registrationInfo: 'Local artist looking to consign handmade jewelry and crafts.'
          }
        ]);
      },
      complete: () => {
        this.loadingService.stop('pending-approvals');
      }
    });
  }

  trackByApproval(index: number, approval: PendingConsignorApproval): number {
    return approval.id;
  }

  formatDate(date: Date): string {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 'day');
  }

  showApprovalModal(approval: PendingConsignorApproval, action: 'approve' | 'reject' | 'request_info'): void {
    this.selectedApproval.set(approval);
    this.approvalAction.set(action);
    this.approvalMessage = '';
    this.errorMessage.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.selectedApproval.set(null);
    this.approvalMessage = '';
    this.errorMessage.set('');
    this.isModalOpen.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onSubmitApproval(): void {
    const approval = this.selectedApproval();
    if (!approval || this.isProcessing()) return;

    this.isProcessing.set(true);
    this.errorMessage.set('');

    const request: ConsignorApprovalRequest = {
      action: this.approvalAction(),
      message: this.approvalMessage.trim() || undefined
    };

    this.consignorService.processApproval(approval.id, request).subscribe({
      next: (response) => {
        const actionMessages = {
          approve: `${approval.name} has been approved and will receive a welcome email.`,
          reject: `${approval.name} has been rejected and will be notified.`,
          request_info: `Information request sent to ${approval.name}.`
        };

        this.successMessage.set(actionMessages[this.approvalAction()]);

        // Remove from pending list if approved or rejected
        if (this.approvalAction() === 'approve' || this.approvalAction() === 'reject') {
          this.pendingApprovals.update(approvals =>
            approvals.filter(a => a.id !== approval.id)
          );
        }

        this.closeModal();

        // Clear success message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (error) => {
        console.error('Error processing approval:', error);
        this.errorMessage.set('Failed to process approval. Please try again.');
      },
      complete: () => {
        this.isProcessing.set(false);
      }
    });
  }

  getModalTitle(): string {
    const actions = {
      approve: 'Approve Consignor',
      reject: 'Reject Consignor',
      request_info: 'Request More Information'
    };
    return actions[this.approvalAction()];
  }

  getMessageLabel(): string {
    const labels = {
      reject: 'Rejection Reason',
      request_info: 'Information Request'
    };
    return labels[this.approvalAction() as 'reject' | 'request_info'];
  }

  getMessagePlaceholder(): string {
    const placeholders = {
      reject: 'Enter the reason for rejecting this application...',
      request_info: 'What additional information do you need from this consignor?'
    };
    return placeholders[this.approvalAction() as 'reject' | 'request_info'];
  }

  getSubmitButtonText(): string {
    const texts = {
      approve: 'Approve & Send Welcome Email',
      reject: 'Reject Application',
      request_info: 'Send Information Request'
    };
    return texts[this.approvalAction()];
  }
}