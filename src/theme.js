import { createTheme } from '@mui/material/styles';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { rtlComponents } from './config/rtlComponents';
import { designTokens } from './config/designTokens';

// Direction comes from the document/theme. Physical CSS properties and explicit
// LTR values must retain their meaning; do not run a CSS mirroring plugin here.
export const createAppCache = (options = {}) => createCache({
  key: 'muirtl',
  ...options,
  stylisPlugins: [prefixer],
});

const theme = createTheme({
  direction: 'rtl',
  components: rtlComponents,
  palette: {
    primary: { main: designTokens.primary, dark: designTokens.primaryDark },
    background: { default: designTokens.background, paper: designTokens.surface },
    text: { primary: designTokens.text, secondary: designTokens.muted },
    divider: designTokens.border,
  },
  // Existing sx values use MUI's four-pixel radius multiplier.
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
    fontSize: 14,
    h1: { fontSize: 'clamp(1.5rem, 2.4vw, 2rem)', fontWeight: 800, lineHeight: 1.45 },
    h2: { fontSize: 'clamp(1.375rem, 2vw, 1.75rem)', fontWeight: 800, lineHeight: 1.45 },
    h3: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.5 },
    h4: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.5 },
    h5: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 700, lineHeight: 1.5 },
    body1: { fontSize: '0.875rem', lineHeight: 1.7 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.65 },
    button: { fontSize: '0.8125rem', fontWeight: 700, textTransform: 'none' },
  },
});

export default theme;
