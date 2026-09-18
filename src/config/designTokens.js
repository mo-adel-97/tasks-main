// Pixel dimensions shared by the shell, theme and opt-in layout helpers.

// Small-laptop/normal-desktop density (<=1440px) is already tuned and must
// not shift. Every `fluid()` token below stays flat at its `minPx` up to
// LARGE_MIN_VW (compact: 1366/1440), then grows to `maxPx` by LARGE_MAX_VW
// (large desktop: 2560), then stays flat again through ultra-wide (3440+) —
// matching the product's own three named tiers (compact / comfortable /
// large) instead of one flat number reused everywhere from 1200px up, or a
// ramp so gradual that 1920/2560 barely differ from 1440.
const LARGE_MIN_VW = 1440;
const LARGE_MAX_VW = 2560;
const round = (value) => Math.round(value * 10000) / 10000;
// Exported so other opt-in contracts (e.g. the HR density layer) grow on the
// same large-screen curve instead of inventing their own anchors.
export const fluid = (minPx, maxPx) => {
  const slope = (maxPx - minPx) / (LARGE_MAX_VW - LARGE_MIN_VW);
  const intercept = minPx - slope * LARGE_MIN_VW;
  return `clamp(${round(minPx / 16)}rem, ${round(intercept / 16)}rem + ${round(slope * 100)}vw, ${round(maxPx / 16)}rem)`;
};

export const designTokens = Object.freeze({
  headerHeight: 56,
  pagePadding: { xs: 12, sm: 16, lg: 20 },
  dataRegionHeight: 'clamp(18rem, 55dvh, 38rem)',
  pageGutter: fluid(10, 14),
  cardPadding: fluid(9, 16),
  layoutGap: fluid(7, 12),
  typography: {
    pageTitle: fluid(16, 22),
    sectionTitle: fluid(14, 18),
    body: fluid(12, 14),
    control: fluid(12, 14),
    label: fluid(11, 13),
    table: fluid(11, 13),
    sidebar: fluid(10, 12),
    helper: fluid(10, 12),
  },
  controlHeight: fluid(32, 38),
  touchHeight: 44,
  radius: 8,
  sidebar: {
    itemHeight: { xs: 36, lg: fluid(34, 40) },
    itemPadding: { xs: '0.3rem 0.45rem', lg: '0.35rem 0.6rem' },
    itemRadius: '7px',
    iconSize: { xs: '0.875rem', lg: fluid(14.4, 18) },
    titleSize: { xs: '0.6875rem', lg: fluid(11, 16) },
    iconBoxMinWidth: { xs: 22, lg: fluid(26, 30) },
    // Child (leaf) menu links are the most frequently read sidebar text, and
    // previously used flat literals that never grew past the 1200px cutoff.
    childTitleSize: fluid(11.52, 16),
    childSecondarySize: fluid(10.24, 14),
    childIconSize: fluid(16, 19),
    childIconBoxMinWidth: fluid(19, 22),
    childItemHeight: fluid(34, 40),
  },
  text: '#203b30',
  muted: '#63786e',
  primary: '#057546',
  primaryDark: '#034d31',
  surface: '#ffffff',
  background: '#f5f8f6',
  border: '#dce7e1',
});

// CSS values (not MUI spacing units): reusable in theme overrides and sx.
export const mobileHeaderStyles = {
  height: designTokens.headerHeight,
  minHeight: designTokens.headerHeight,
  boxSizing: 'border-box',
  background: designTokens.surface,
  color: designTokens.primaryDark,
  borderBottom: `1px solid ${designTokens.border}`,
  boxShadow: '0 2px 8px rgba(3,77,49,.05)',
  paddingBlock: 0,
  '& .MuiToolbar-root': {
    height: designTokens.headerHeight, minHeight: designTokens.headerHeight,
    paddingInline: '12px', gap: 'clamp(6px, 1.5vw, 10px)', flexWrap: 'nowrap', minWidth: 0,
    '& > :not(.MuiTypography-root)': { flexShrink: 0 },
  },
  '& .MuiTypography-root': {
    minWidth: 0, fontSize: 'clamp(0.8125rem, 2.8vw, 0.875rem)', fontWeight: 700, lineHeight: 1.35,
    textAlign: 'start', overflowWrap: 'anywhere', whiteSpace: 'normal',
  },
  '& .MuiIconButton-root': {
    width: 40, height: 40, flexShrink: 0, borderRadius: '8px',
    color: designTokens.primaryDark, background: '#eef5f1', boxShadow: 'none',
  },
};
