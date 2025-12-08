import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-approval-workflow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './approval-workflow.component.html'
})
export class ApprovalWorkflowComponent {
  approvalForm: FormGroup;

  pendingApprovals = [
    {
      id: '1',
      consignorName: 'Jane Smith',
      email: 'jane@email.com',
      signupDate: new Date('2023-12-01'),
      itemsSubmitted: 12,
      status: 'pending'
    },
    {
      id: '2',
      consignorName: 'Mike Johnson',
      email: 'mike@email.com',
      signupDate: new Date('2023-12-02'),
      itemsSubmitted: 8,
      status: 'pending'
    }
  ];

  constructor(private fb: FormBuilder) {
    this.approvalForm = this.fb.group({
      autoApprove: [false],
      requireManualReview: [true],
      approvalCriteria: [''],
      notifyOnNewSignup: [true]
    });
  }

  approveConsignor(consignorId: string): void {
    // TODO: Implement consignor approval
    console.log('Approving consignor:', consignorId);
  }

  rejectConsignor(consignorId: string): void {
    // TODO: Implement consignor rejection
    console.log('Rejecting consignor:', consignorId);
  }

  onSave(): void {
    if (this.approvalForm.valid) {
      // TODO: Save approval workflow settings
      console.log('Saving approval settings:', this.approvalForm.value);
    }
  }

  trackByConsignorId(index: number, consignor: any): string {
    return consignor.id;
  }
}