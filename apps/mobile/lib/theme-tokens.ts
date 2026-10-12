export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
} as const;

// Exact Stitch shape mapping: cards 20-24, hero mini 16, avatar 12-14, pills full.
export const stitchRadii = {
  card: 20,
  cardLarge: 24,
  heroMini: 16,
  avatar: 12,
  cta: 16,
  pill: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  primary: {
    shadowColor: "#2547E8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  secondary: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  error: {
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  dark: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 5,
    },
  },
  fintech: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  fintechLg: {
    shadowColor: "#2547E8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const typography = {
  displayLg: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: "700" as const,
    letterSpacing: -0.02,
  },
  displayMd: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: "700" as const,
    letterSpacing: -0.02,
  },
  displaySm: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700" as const,
    letterSpacing: -0.01,
  },
  headlineLg: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600" as const,
    letterSpacing: -0.01,
  },
  headlineMd: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600" as const,
    letterSpacing: -0.01,
  },
  headlineSm: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  titleLg: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  titleMd: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  titleSm: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  bodyMd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  bodySm: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
    letterSpacing: 0.01,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.02,
  },
  overline: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
    textTransform: "uppercase" as const,
  },
  displayHero: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "700" as const,
    letterSpacing: -0.02,
  },
  labelCaps: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.06,
  },
  badgePill: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  currencyNumeric: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700" as const,
    letterSpacing: 0,
  },
  titleCard: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// Stitch layout: 4px base, gutter 20, card padding 20, stack gap 12, overlap -12.
export const stitchSpacing = {
  gutterScreen: 20,
  cardPadding: 20,
  stackGap: 12,
  sheetOverlap: -12,
  bottomBar: 64,
  homeIndicator: 24,
} as const;

// Exact Stitch palettes. Light = Modern Fintech Expense Engine, Dark = Nocturne Ledger.
export const stitchLight = {
  canvas: "#F8FAFC",
  surface: "#FFFFFF",
  ink: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  primary: "#2547E8",
  heroFrom: "#1D3BBF",
  heroTo: "#2547E8",
  frostedBg: "rgba(255, 255, 255, 0.12)",
  frostedBorder: "rgba(255, 255, 255, 0.2)",
  emeraldTint: "#ECFDF5",
  emeraldBorder: "#A7F3D0",
  emeraldText: "#059669",
  skyTint: "#F0F9FF",
  skyBorder: "#BAE6FD",
  skyText: "#0284C7",
  roseTint: "#FFF1F2",
  roseBorder: "#FECDD3",
  roseText: "#E11D48",
} as const;

export const stitchDark = {
  canvas: "#0B0F19",
  canvasSubtle: "#111827",
  card: "#1A2234",
  cardElevated: "#1F293D",
  stroke: "#2A3756",
  strokeSubtle: "#334155",
  textPrimary: "#FFFFFF",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  cobalt: "#3B82F6",
  cobaltDeep: "#2563EB",
  emerald: "#10B981",
  mint: "#34D399",
  danger: "#F43F5E",
  amber: "#F59E0B",
  badgeSuccessBg: "rgba(16, 185, 129, 0.12)",
  badgeSuccessBorder: "rgba(16, 185, 129, 0.3)",
  badgeErrorBg: "rgba(244, 63, 94, 0.12)",
  badgeErrorBorder: "rgba(244, 63, 94, 0.3)",
  badgeWarningBg: "rgba(245, 158, 11, 0.12)",
  badgeWarningBorder: "rgba(245, 158, 11, 0.3)",
} as const;

export const transitions = {
  fast: 150,
  normal: 200,
  slow: 280,
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  "modal-backdrop": 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
} as const;

export type Radii = typeof radii;
export type Shadows = typeof shadows;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;