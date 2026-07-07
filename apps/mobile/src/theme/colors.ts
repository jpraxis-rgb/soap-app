const dark = {
  background: '#14111F',
  card: '#1E1B2E',
  surface: '#2A2542',
  accent: '#8B5CF6',
  accentSecondary: '#F97316',
  success: '#00D4AA',
  warning: '#FFB347',
  error: '#FF4757',
  text: '#F5F3FF',
  textSecondary: '#B3ADC7',
  border: '#332D4D',
  // DataVis colors — strong, colorblind-friendly
  chart1: '#8B6FFF',
  chart2: '#E85D8A',
  chart3: '#00D4AA',
  chart4: '#FFB347',
  chart5: '#4EADFC',
  chart6: '#FF8A65',
  // Gradients are deprecated — solid violet keeps the API compatible
  gradientStart: '#8B5CF6',
  gradientEnd: '#8B5CF6',
  // Button text on accent background
  accentForeground: '#FFFFFF',
  accentMuted: '#8B5CF61A',
} as const;

const light = {
  background: '#FAF8F5',
  card: '#FFFFFF',
  surface: '#EDE9FE',
  accent: '#6D28D9',
  accentSecondary: '#EA580C',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  text: '#1E1B2E',
  textSecondary: '#4B4760',
  border: '#E8E4DC',
  // DataVis colors
  chart1: '#6D28D9',
  chart2: '#EA580C',
  chart3: '#059669',
  chart4: '#D97706',
  chart5: '#4EADFC',
  chart6: '#DB2777',
  // Gradients are deprecated — solid violet keeps the API compatible
  gradientStart: '#6D28D9',
  gradientEnd: '#6D28D9',
  // Button text — white on accent works in light theme
  accentForeground: '#FFFFFF',
  accentMuted: '#6D28D91A',
} as const;

export type ThemeColors = { [K in keyof typeof dark]: string };
export const themes = { dark, light } as const;

// Backwards compat — default to light for any remaining static imports
export const colors = light;
