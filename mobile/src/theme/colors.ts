// Fixed per-type identity colors used across the whole app.
// Each content type keeps its own primary so lists, filters, and forms stay distinguishable.
export const colors = {
  note: {
    primary: '#22409A', // navy blue
    light: '#3B5BCC',
    dark: '#1A327A',
    muted: 'rgba(34, 64, 154, 0.12)',
    background: '#EEF2FA',
    soft: '#DCE5F7',
    onPrimary: '#FFFFFF',
  },
  blog: {
    primary: '#0284C7', // sky / cerulean — clearly different from navy notes & green links
    light: '#38BDF8',
    dark: '#0369A1',
    muted: 'rgba(2, 132, 199, 0.12)',
    background: '#E8F6FD',
    soft: '#CDEBFA',
    onPrimary: '#FFFFFF',
  },
  link: {
    primary: '#15803D', // forest green
    light: '#22C55E',
    dark: '#166534',
    muted: 'rgba(21, 128, 61, 0.12)',
    background: '#EAF8EF',
    soft: '#CDEAD7',
    onPrimary: '#FFFFFF',
  },
  pdf: {
    primary: '#BE123C', // rose / crimson
    light: '#E11D48',
    dark: '#9F1239',
    muted: 'rgba(190, 18, 60, 0.12)',
    background: '#FCECEF',
    soft: '#F8D4DC',
    onPrimary: '#FFFFFF',
  },
  reminder: {
    primary: '#EA580C', // bright orange
    light: '#F97316',
    dark: '#C2410C',
    muted: 'rgba(234, 88, 12, 0.12)',
    background: '#FFF3EB',
    soft: '#FEDFC8',
    onPrimary: '#FFFFFF',
  },
  alarm: {
    primary: '#A16207', // amber / gold-brown — distinct from reminder orange
    light: '#CA8A04',
    dark: '#854D0E',
    muted: 'rgba(161, 98, 7, 0.12)',
    background: '#FFF8E8',
    soft: '#F5E2B8',
    onPrimary: '#FFFFFF',
  },

  // App chrome / brand (defaults to note blue)
  primary: '#22409A',
  primaryLight: '#3B5BCC',
  primaryDark: '#1A327A',
  primaryMuted: 'rgba(34, 64, 154, 0.1)',
  secondary: '#EA580C',
  secondaryLight: '#F97316',
  secondaryDark: '#C2410C',
  secondaryMuted: 'rgba(234, 88, 12, 0.1)',

  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceLight: '#F8FAFC',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#64748B',

  blur: 'rgba(255, 255, 255, 0.7)',
  blurDark: 'rgba(15, 23, 42, 0.8)',
  blurOverlay: 'rgba(255, 255, 255, 0.4)',

  success: '#10B981',
  successLight: '#34D399',
  error: '#EF4444',
  errorLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  info: '#3B82F6',
  infoLight: '#60A5FA',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#22409A',

  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowLight: 'rgba(15, 23, 42, 0.04)',
  shadowPrimary: 'rgba(34, 64, 154, 0.15)',
  shadowSecondary: 'rgba(234, 88, 12, 0.15)',

  gradientStart: '#22409A',
  gradientEnd: '#EA580C',
  gradientBlue: ['#22409A', '#3B5BCC'],
  gradientOrange: ['#EA580C', '#F97316'],
  gradientMixed: ['#22409A', '#EA580C'],
};

export function getTypeColor(type: 'note' | 'blog' | 'link' | 'pdf' | 'reminder' | 'alarm') {
  return colors[type];
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  primary: {
    shadowColor: colors.shadowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  secondary: {
    shadowColor: colors.shadowSecondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const typography = {
  heading: {
    h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.5 },
    h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.3 },
    h3: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.2 },
    h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.1 },
  },
  body: {
    large: { fontSize: 18, fontWeight: '500' as const, lineHeight: 26 },
    medium: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    small: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    tiny: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  },
  label: {
    large: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
    medium: { fontSize: 12, fontWeight: '600' as const, lineHeight: 18 },
    small: { fontSize: 11, fontWeight: '700' as const, lineHeight: 16, letterSpacing: 0.5 },
  },
};

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
};

export const easing = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'spring(1, 80, 0.84, 0.44)',
};
