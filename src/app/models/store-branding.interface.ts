export interface StoreBranding {
  logo?: {
    url?: string;
    fileName?: string;
    uploadedAt?: Date;
    dimensions?: { width: number; height: number; };
  };
  colors: {
    primary: string;    // Hex color code - always have defaults
    secondary: string;  // Hex color code
    accent: string;     // Hex color code
    text: string;       // Hex color code
    background: string; // Hex color code
  };
  typography: {
    headingFont: string;  // Always have defaults for readability
    bodyFont: string;
    fontSizeScale: 'small' | 'medium' | 'large';
  };
  style?: {
    theme: 'professional' | 'modern' | 'vintage' | 'minimal';
    customCss?: string;
  };
  lastUpdated: Date;
}

export interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}