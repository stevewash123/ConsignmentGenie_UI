import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHeaderComponent } from './admin-header.component';
import { AdminFooterComponent } from './admin-footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, AdminHeaderComponent, AdminFooterComponent],
  templateUrl: './admin-layout.component.html',
  styles: [`
    .admin-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .main-content {
      flex: 1;
      background: #f8fafc;
    }
  `]
})
export class AdminLayoutComponent {
}