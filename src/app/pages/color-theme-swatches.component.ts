import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  description: string;
}

@Component({
  selector: 'app-color-theme-swatches',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-theme-swatches.component.html',
  styleUrls: ['./color-theme-swatches.component.scss']
})
export class ColorThemeSwatchesComponent {

  ownerThemes: ColorTheme[] = [
    {
      name: 'Professional Blue',
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      text: '#1e293b',
      background: '#ffffff',
      description: 'Clean, professional look with blue tones for business credibility'
    },
    {
      name: 'Elegant Purple',
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#f59e0b',
      text: '#374151',
      background: '#f8fafc',
      description: 'Sophisticated purple palette with warm accents for upscale shops'
    },
    {
      name: 'Modern Green',
      primary: '#059669',
      secondary: '#10b981',
      accent: '#84cc16',
      text: '#064e3b',
      background: '#f0fdf4',
      description: 'Fresh green theme conveying growth and eco-friendly values'
    },
    {
      name: 'Vintage Brown',
      primary: '#a16207',
      secondary: '#d97706',
      accent: '#dc2626',
      text: '#451a03',
      background: '#fef7ed',
      description: 'Warm earthy tones perfect for vintage and antique shops'
    },
    {
      name: 'Minimal Gray',
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#3b82f6',
      text: '#111827',
      background: '#ffffff',
      description: 'Clean, minimal design focusing on content over decoration'
    }
  ];

  consignorThemes: ColorTheme[] = [
    {
      name: 'Consignor Blue',
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#06b6d4',
      text: '#1e293b',
      background: '#f8fafc',
      description: 'Trustworthy blue palette for consignor confidence and clarity'
    },
    {
      name: 'Consignor Green',
      primary: '#047857',
      secondary: '#059669',
      accent: '#10b981',
      text: '#064e3b',
      background: '#f0fdf4',
      description: 'Growth-oriented green theme symbolizing earnings and success'
    },
    {
      name: 'Consignor Purple',
      primary: '#6b21a8',
      secondary: '#7c3aed',
      accent: '#a855f7',
      text: '#374151',
      background: '#faf5ff',
      description: 'Premium purple theme for high-end consignment experiences'
    },
    {
      name: 'Consignor Orange',
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
      text: '#9a3412',
      background: '#fff7ed',
      description: 'Energetic orange palette encouraging active participation'
    },
    {
      name: 'Consignor Teal',
      primary: '#0f766e',
      secondary: '#14b8a6',
      accent: '#5eead4',
      text: '#134e4a',
      background: '#f0fdfa',
      description: 'Modern teal theme balancing professionalism with approachability'
    }
  ];

  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '0, 0, 0';
  }

  getContrastColor(hex: string): string {
    // Simple contrast calculation
    const rgb = this.hexToRgb(hex);
    const [r, g, b] = rgb.split(', ').map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  copyToClipboard(value: string, label: string): void {
    navigator.clipboard.writeText(value).then(() => {
      alert(`${label} copied to clipboard: ${value}`);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }
}