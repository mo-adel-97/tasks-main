import { createTheme } from '@mui/material/styles';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { rtlComponents } from './config/rtlComponents';

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
  typography: {
    fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
  },
});

export default theme;
