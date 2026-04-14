// src/styles/tokens.ts
// Design tokens — source of truth for JS/animation logic
// Colors extracted from docs/diseño stitch/ (DESIGN.md) — Stitch teal palette

export const colors = {
  // extracted from docs/diseño stitch/
  primary:           'hsl(193 100% 22%)',   // #005a71
  primaryHover:      'hsl(193 82% 30%)',    // #0e7490
  primaryLight:      'hsl(199 100% 87%)',   // #b9eaff
  primaryMuted:      'hsl(199 82% 72%)',    // #81d1f0
  surface:           'hsl(210 25% 97%)',    // #f7f9fb
  surfaceLowest:     'hsl(0 0% 100%)',      // #ffffff
  surfaceLow:        'hsl(210 15% 96%)',    // #f2f4f6
  surfaceContainer:  'hsl(210 12% 93%)',    // #eceef0
  surfaceHigh:       'hsl(210 10% 90%)',    // #e6e8ea
  onSurface:         'hsl(210 10% 11%)',    // #191c1e
  onSurfaceVariant:  'hsl(200 10% 27%)',    // #3f484c
  outline:           'hsl(200 8% 45%)',     // #6f787d
  outlineVariant:    'hsl(198 15% 75%)',    // #bec8cd
  error:             'hsl(353 84% 40%)',    // #ba1a1a
  errorContainer:    'hsl(5 100% 92%)',     // #ffdad6
  // success = tertiary (Stitch), NOT brand — green reserved for real success states ONLY
  success:           'hsl(153 100% 19%)',   // #005f40
  successContainer:  'hsl(153 100% 24%)',   // #007a53
} as const;

export const shadows = {
  sm:    '0 2px 8px rgba(25, 28, 30, 0.04)',
  md:    '0 10px 40px rgba(25, 28, 30, 0.06)',
  lg:    '0 20px 60px rgba(25, 28, 30, 0.08)',
  xl:    '0 30px 80px rgba(25, 28, 30, 0.10)',
  glass: '0 8px 32px rgba(0, 90, 113, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
} as const;

export const radii = {
  sm:   '0.5rem',
  md:   '0.75rem',
  lg:   '1rem',
  xl:   '1.5rem',
  full: '9999px',
} as const;

export const typography = {
  fontHeadline: "'Manrope', system-ui, sans-serif",
  fontBody:     "'Inter', system-ui, sans-serif",
  sizes: {
    display: '3.5rem',
    '4xl':   '2.25rem',
    '3xl':   '1.875rem',
    '2xl':   '1.5rem',
    xl:      '1.25rem',
    lg:      '1.125rem',
    base:    '1rem',
    sm:      '0.875rem',
    xs:      '0.75rem',
  },
  weights: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },
} as const;

export const spacing = {
  1: '0.25rem',  2: '0.5rem',   3: '0.75rem',  4: '1rem',
  5: '1.25rem',  6: '1.5rem',   8: '2rem',     10: '2.5rem',
  12: '3rem',    16: '4rem',    20: '5rem',    24: '6rem',
} as const;

export const durations = {
  instant:  0,
  fast:     150,
  base:     250,
  moderate: 400,
  slow:     600,
  crawl:    1000,
} as const;

export const easings = {
  standard:   [0.2, 0.0, 0.0, 1.0],
  decelerate: [0.0, 0.0, 0.2, 1.0],
  accelerate: [0.4, 0.0, 1.0, 1.0],
  spring:     [0.22, 1, 0.36, 1],
  bouncy:     [0.34, 1.56, 0.64, 1],
} as const;