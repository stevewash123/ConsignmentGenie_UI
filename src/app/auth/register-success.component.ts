import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-success.component.html',
  styleUrls: ['./register-success.component.scss']
})
export class RegisterSuccessComponent implements OnInit {
  registrationType = signal<string>('');
  shopName = signal<string>('');
  userEmail = signal<string>('');
  fullName = signal<string>('');

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.registrationType.set(params['type'] || '');
      this.shopName.set(params['shopName'] || '');
      this.userEmail.set(params['email'] || '');
      this.fullName.set(params['fullName'] || '');
    });
  }

  getFirstName(): string {
    // ✅ Trim and check if fullName is meaningful
    const fullName = this.fullName().trim();
    if (fullName) {
      return fullName.split(' ')[0];
    }

    // ✅ Fall back to email
    const email = this.userEmail();
    if (email) {
      return email.split('@')[0];
    }

    // ✅ Default greeting
    return 'there';
  }
}