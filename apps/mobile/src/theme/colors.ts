const dark = {
  background: '#111119',
  card: '#1A1A2E',
  surface: '#252540',
  accent: '#8B6FFF',
  accentSecondary: '#FF6B9D',
  success: '#00D4AA',
  warning: '#FFB347',
  error: '#FF4757',
  text: '#FFFFFF',
  textSecondary: '#B3B3D1',
  border: '#2E2E4A',
  // DataVis colors — strong, colorblind-friendly
  chart1: '#8B6FFF',
  chart2: '#E85D8A',
  chart3: '#00D4AA',
  chart4: '#FFB347',
  chart5: '#4EADFC',
  chart6: '#FF8A65',
  // Gradient pairs
  gradientStart: '#8B6FFF',
  gradientEnd: '#FF6B9D',
  // Button text on accent background
  accentForeground: '#FFFFFF',
  accentMuted: '#8B6FFF1A',
} as const;

const light = {
  background: '#F5F3FF',
  card: '#FFFFFF',
  surface: '#EDE9FE',
  accent: '#6D4AE8',
  accentSecondary: '#E85D8A',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  text: '#1A1A2E',
  textSecondary: '#6B6B8A',
  border: '#DDD6FE',
  // DataVis colors — same strong colors for both themes
  chart1: '#7C5CFC',
  chart2: '#E85D8A',
  chart3: '#00D4AA',
  chart4: '#FFB347',
  chart5: '#4EADFC',
  chart6: '#FF8A65',
  // Gradient pairs — slightly deeper for contrast on light backgrounds
  gradientStart: '#6D4AE8',
  gradientEnd: '#E85D8A',
  // Button text — white on accent works in light theme
  accentForeground: '#FFFFFF',
  accentMuted: '#6D4AE81A',
} as const;

export type ThemeColors = { [K in keyof typeof dark]: string };
export const themes = { dark, light } as const;

// Backwards compat — default to dark for any remaining static imports
export const colors = dark;
