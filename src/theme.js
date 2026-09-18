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
    // Semantic surface/border ladder so "important" containers (cards,
    // tables, dialogs) can reference one shared hierarchy instead of each
    // component inventing its own literal color. Light mode mirrors today's
    // validated flat appearance; only dark mode's component overrides below
    // actually apply borders/alternate surfaces, so light mode is unchanged.
    surfaces: {
      page: designTokens.background, section: '#eef4f0', card: designTokens.surface,
      nested: '#f2f7f4', input: designTokens.surface,
      hover: 'rgba(5,117,70,.05)', selected: 'rgba(5,117,70,.09)',
    },
    borders: {
      subtle: designTokens.border, standard: 'rgba(5,117,70,.16)',
      accent: 'rgba(5,117,70,.26)', strong: 'rgba(5,117,70,.42)',
    },
    ...(mode === 'dark' ? {
      primary: { main: '#80c9a7', dark: '#45a879', contrastText: '#10251c' },
      // Base dark background pinned to the exact requested tone (#07150f)
      // instead of a desaturated gray-green; the rest of the ladder is
      // derived from it so section/card/nested still read as distinct,
      // progressively lighter steps off this same base.
      background: { default: '#07150f', paper: '#0d1c14' },
      text: { primary: '#e9f3ee', secondary: '#a9c2b4' },
      divider: 'rgba(103,201,157,.16)',
      // A visible surface ladder from page -> section -> card -> nested, so
      // dark mode reads as coordinated levels instead of near-identical
      // black-on-black. Border strength climbs the same way: subtle hairlines
      // on ordinary containers, up to a strong brand-green mark on the
      // active/selected/focused element only.
      surfaces: {
        page: '#07150f', section: '#0d1c14', card: '#112119', nested: '#17291f',
        input: '#091711', hover: 'rgba(103,201,157,.08)', selected: 'rgba(103,201,157,.16)',
      },
      // Bumped up twice now: at low alpha these hairlines were too close to
      // invisible against the near-black surfaces above, and the ladder steps
      // themselves were too close together to read as distinct levels.
      borders: {
        subtle: 'rgba(103,201,157,.18)', standard: 'rgba(103,201,157,.32)',
        accent: 'rgba(103,201,157,.5)', strong: 'rgba(103,201,157,.72)',
      },
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
