import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, IconButton, Tooltip } from '@mui/material';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { createAppTheme } from '../theme';

// Bumped to -v2 so this deploy's new "dark by default" below applies to
// everyone once, including users who had already saved 'light' under the
// old key -- that old value simply stops being read. Whatever a user picks
// from here on (light or dark) still persists normally under this key.
export const COLOR_MODE_KEY = 'sstli-color-mode-v2';
const ColorModeContext = createContext({ mode: 'dark', toggleMode: () => {} });

export function initialColorMode() {
  try {
    const saved = localStorage.getItem(COLOR_MODE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* Storage may be disabled by the browser. */ }
  return 'dark';
}

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(initialColorMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  useLayoutEffect(() => {
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme = mode;
    try { localStorage.setItem(COLOR_MODE_KEY, mode); } catch { /* Keep in-memory choice. */ }
  }, [mode]);
  const value = useMemo(() => ({ mode, toggleMode: () => setMode((current) => current === 'dark' ? 'light' : 'dark') }), [mode]);
  return <ColorModeContext.Provider value={value}><ThemeProvider theme={theme}>
    <CssBaseline />{children}<ColorModeToggle />
  </ThemeProvider></ColorModeContext.Provider>;
}

function ColorModeToggle() {
  const { mode, toggleMode } = useContext(ColorModeContext);
  const label = mode === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن';
  return <Tooltip title={label}><IconButton className="app-color-mode-toggle" aria-label={label}
    onClick={toggleMode} sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1201,
      width: 44, height: 44, bgcolor: 'background.paper', color: 'text.primary',
      border: 1, borderColor: 'divider', boxShadow: 3, '&:hover': { bgcolor: 'action.hover' } }}>
    {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
  </IconButton></Tooltip>;
}
