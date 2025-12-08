import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-footer.component.html',
  styles: [`
    .admin-footer {
      background: #1e293b;
      color: #cbd5e1;
      border-top: 1px solid #334155;
      margin-top: auto;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section h3 {
      color: #f1c40f;
      margin-bottom: 1rem;
      font-size: 1.25rem;
      font-weight: bold;
    }

    .footer-section h4 {
      color: white;
      margin-bottom: 1rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .footer-section p {
      margin-bottom: 0;
      line-height: 1.5;
      color: #94a3b8;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section li {
      margin-bottom: 0.5rem;
    }

    .footer-section a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .footer-section a:hover {
      color: #f1c40f;
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 2rem;
      border-top: 1px solid #334155;
    }

    .copyright p,
    .version p {
      margin: 0;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .version a {
      color: #f1c40f;
      text-decoration: none;
    }

    .version a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .footer-bottom {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .footer-container {
        padding: 1.5rem 1rem;
      }
    }

    @media (max-width: 1024px) {
      .footer-content {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class AdminFooterComponent {
  currentYear = new Date().getFullYear();
}