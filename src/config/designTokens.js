// Pixel dimensions shared by the shell, theme and opt-in layout helpers.
export const designTokens = Object.freeze({
  headerHeight: 56,
  pagePadding: { xs: 12, sm: 16, lg: 24 },
  controlHeight: 40,
  touchHeight: 44,
  radius: 10,
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
    paddingInline: '12px', gap: '10px',
  },
  '& .MuiTypography-root': {
    minWidth: 0, fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.5,
    textAlign: 'start', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  '& .MuiIconButton-root': {
    width: 40, height: 40, flexShrink: 0, borderRadius: '8px',
    color: designTokens.primaryDark, background: '#eef5f1', boxShadow: 'none',
  },
};
