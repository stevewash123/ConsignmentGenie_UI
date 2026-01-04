import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss']
})
export class AutomationComponent implements OnInit {
  automationForm!: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadSettings();
  }

  private initForm() {
    this.automationForm = this.fb.group({
      automation: this.fb.group({
        autoGeneratePayouts: [false],
        autoApproveThreshold: [100.00, [Validators.min(0)]],
        requireManualReview: [true],
        manualReviewThreshold: [500.00, [Validators.min(0)]]
      })
    });
  }

  async loadSettings() {
    try {
      // TODO: Load from API
      // const response = await this.http.get<any>(`${environment.apiUrl}/api/organizations/automation-settings`).toPromise();
      // if (response) {
      //   this.automationForm.patchValue(response);
      // }
    } catch (error) {
      console.error('Failed to load automation settings:', error);
    }
  }

  async onSave() {
    if (this.automationForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      this.successMessage.set('Automation settings saved successfully');
    } catch (error) {
      console.error('Failed to save automation settings:', error);
      this.errorMessage.set('Failed to save automation settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}