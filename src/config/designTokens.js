// Pixel dimensions shared by the shell, theme and opt-in layout helpers.
export const designTokens = Object.freeze({
  headerHeight: 56,
  pagePadding: { xs: 12, sm: 16, lg: 20 },
  dataRegionHeight: 'clamp(18rem, 55dvh, 38rem)',
  pageGutter: 'clamp(0.5rem, 0.7vw, 0.75rem)',
  cardPadding: 'clamp(0.5rem, 0.65vw, 0.625rem)',
  layoutGap: 'clamp(0.375rem, 0.5vw, 0.625rem)',
  typography: {
    pageTitle: 'clamp(0.9375rem, 0.875rem + 0.15vw, 1.125rem)',
    sectionTitle: 'clamp(0.8125rem, 0.775rem + 0.1vw, 0.9375rem)',
    body: 'clamp(0.6875rem, 0.66rem + 0.08vw, 0.75rem)',
    control: 'clamp(0.6875rem, 0.66rem + 0.08vw, 0.75rem)',
    label: '0.6875rem',
    table: '0.6875rem',
    sidebar: '0.625rem',
    helper: '0.625rem',
  },
  controlHeight: 32,
  touchHeight: 44,
  radius: 8,
  sidebar: {
    itemHeight: { xs: 36, lg: 34 },
    itemPadding: { xs: '0.3rem 0.45rem', lg: '0.35rem 0.6rem' },
    itemRadius: '7px',
    iconSize: { xs: '0.875rem', lg: '0.9rem' },
    titleSize: { xs: '0.6875rem', lg: '0.6875rem' },
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
