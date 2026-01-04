import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  reportsForm!: FormGroup;
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
    this.reportsForm = this.fb.group({
      reports: this.fb.group({
        autoGenerateStatements: [true],
        includeItemDetails: [true],
        includeBranding: [true],
        pdfFormat: [true],
        emailStatements: [true]
      })
    });
  }

  async loadSettings() {
    try {
      // TODO: Load from API
      // const response = await this.http.get<any>(`${environment.apiUrl}/api/organizations/report-settings`).toPromise();
      // if (response) {
      //   this.reportsForm.patchValue(response);
      // }
    } catch (error) {
      console.error('Failed to load report settings:', error);
    }
  }

  async onSave() {
    if (this.reportsForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      this.successMessage.set('Report settings saved successfully');
    } catch (error) {
      console.error('Failed to save report settings:', error);
      this.errorMessage.set('Failed to save report settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}