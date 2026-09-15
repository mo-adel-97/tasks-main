import { createTheme } from '@mui/material/styles';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { rtlComponents } from './config/rtlComponents';
import { designTokens } from './config/designTokens';
import { typographyStyles } from './config/typographySystem';
import { DESKTOP_BREAKPOINT } from './config/sidebarLayout';
import { adaptiveColorsPlugin } from './config/themeColors';

// Direction comes from the document/theme. Physical CSS properties and explicit
// LTR values must retain their meaning; do not run a CSS mirroring plugin here.
export const createAppCache = (options = {}) => createCache({
  key: 'muirtl',
  ...options,
  stylisPlugins: [adaptiveColorsPlugin, prefixer],
});

export const createAppTheme = (mode = 'light') => createTheme({
  direction: 'rtl',
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: DESKTOP_BREAKPOINT, xl: 1536 } },
  components: { ...rtlComponents, MuiCssBaseline: { styleOverrides: typographyStyles } },
  palette: {
    mode,
    primary: { main: designTokens.primary, dark: designTokens.primaryDark },
    background: { default: designTokens.background, paper: designTokens.surface },
    text: { primary: designTokens.text, secondary: designTokens.muted },
    divider: designTokens.border,
    ...(mode === 'dark' ? {
      primary: { main: '#80c9a7', dark: '#45a879', contrastText: '#10251c' },
      background: { default: '#101914', paper: '#19261f' },
      text: { primary: '#e6f0ea', secondary: '#adbdB3' },
      divider: '#364a3e',
    } : {}),
  },
  // Existing sx values use MUI's four-pixel radius multiplier.
  shape: { borderRadius: 3 },
  typography: {
    fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
    fontSize: 14,
    h1: { fontSize: designTokens.typography.pageTitle, fontWeight: 600, lineHeight: 1.35 },
    h2: { fontSize: designTokens.typography.pageTitle, fontWeight: 600, lineHeight: 1.35 },
    h3: { fontSize: designTokens.typography.sectionTitle, fontWeight: 600, lineHeight: 1.35 },
    h4: { fontSize: designTokens.typography.sectionTitle, fontWeight: 600, lineHeight: 1.35 },
    h5: { fontSize: designTokens.typography.sectionTitle, fontWeight: 600, lineHeight: 1.35 },
    h6: { fontSize: designTokens.typography.sectionTitle, fontWeight: 600, lineHeight: 1.35 },
    body1: { fontSize: designTokens.typography.body, lineHeight: 1.45 },
    body2: { fontSize: designTokens.typography.control, lineHeight: 1.45 },
    button: { fontSize: designTokens.typography.control, fontWeight: 500, textTransform: 'none' },
  },
});

export default createAppTheme();
