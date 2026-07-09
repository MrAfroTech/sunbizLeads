// Typography Constants

export const Typography = {
  // Font Families
  fontFamily: {
    // System fonts for cross-platform
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  
  // Font Sizes
  fontSize: {
    hero: 48,
    display: 36,
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,      // Mobile readable
    bodySmall: 16,
    caption: 14,
    small: 12,
    button: 16,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '900',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
    wider: 2,
  },
};

// Typography Styles
export const TextStyles = {
  hero: {
    fontSize: Typography.fontSize.hero,
    fontWeight: Typography.fontWeight.heavy,
    lineHeight: Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.normal,
    textTransform: 'uppercase',
  },
  display: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.heavy,
    lineHeight: Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.tight,
    textTransform: 'uppercase',
  },
  h1: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.heavy,
    lineHeight: Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.normal,
    textTransform: 'uppercase',
  },
  h2: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.normal,
  },
  h3: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.normal,
  },
  body: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium, // 500-600 weight for body (not thin)
    lineHeight: Typography.lineHeight.relaxed,
  },
  caption: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.medium, // 500 weight for captions
    lineHeight: Typography.lineHeight.normal,
  },
  button: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.normal,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
};

