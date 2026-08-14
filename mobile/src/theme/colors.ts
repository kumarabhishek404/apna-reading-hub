// Modern, professional color palette with blue primary and orange secondary
export const colors = {
  // Primary Blue (main accent)
  primary: '#22409a',
  primaryLight: '#3B5BCC',
  primaryDark: '#1A327A',
  primaryMuted: 'rgba(34, 64, 154, 0.1)',
  
  // Secondary Orange (complementary accent)
  secondary: '#FF6B35',
  secondaryLight: '#FF8A5B',
  secondaryDark: '#E55A2B',
  secondaryMuted: 'rgba(255, 107, 53, 0.1)',
  
  // Neutral tones
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceLight: '#F8FAFC',
  
  // Text colors
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  
  // Blur/Overlay colors
  blur: 'rgba(255, 255, 255, 0.7)',
  blurDark: 'rgba(15, 23, 42, 0.8)',
  blurOverlay: 'rgba(255, 255, 255, 0.4)',
  
  // Semantic colors
  success: '#10B981',
  successLight: '#34D399',
  error: '#EF4444',
  errorLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  // Border colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#22409a',
  
  // Shadow colors
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowLight: 'rgba(15, 23, 42, 0.04)',
  shadowPrimary: 'rgba(34, 64, 154, 0.15)',
  shadowSecondary: 'rgba(255, 107, 53, 0.15)',
  
  // Gradient colors
  gradientStart: '#22409a',
  gradientEnd: '#FF6B35',
  gradientBlue: ['#22409a', '#3B5BCC'],
  gradientOrange: ['#FF6B35', '#FF8A5B'],
  gradientMixed: ['#22409a', '#FF6B35'],
};

// Spacing scale
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

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow presets
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

// Typography
export const typography = {
  heading: {
    h1: { fontSize: 32, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5 },
    h2: { fontSize: 28, fontWeight: '700', lineHeight: 36, letterSpacing: -0.3 },
    h3: { fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.2 },
    h4: { fontSize: 20, fontWeight: '600', lineHeight: 28, letterSpacing: -0.1 },
  },
  body: {
    large: { fontSize: 18, fontWeight: '500', lineHeight: 26 },
    medium: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    small: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    tiny: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  label: {
    large: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    medium: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
    small: { fontSize: 11, fontWeight: '700', lineHeight: 16, letterSpacing: 0.5 },
  },
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
};

// Easing functions
export const easing = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'spring(1, 80, 0.84, 0.44)',
};