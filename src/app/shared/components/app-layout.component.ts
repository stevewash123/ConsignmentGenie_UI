import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from './app-header.component';
import { AppFooterComponent } from './app-footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, AppFooterComponent],
  templateUrl: './app-layout.component.html',
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      background: #f9fafb;
    }
  `]
})
export class AppLayoutComponent {
}