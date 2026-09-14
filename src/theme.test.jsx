import React from 'react';
import { render, screen } from '@testing-library/react';
import { CacheProvider } from '@emotion/react';
import { Box, Portal, ThemeProvider } from '@mui/material';
import theme, { createAppCache } from './theme';

function Foundation({ children }) {
  const cache = createAppCache({ key: 'foundation-test', speedy: false });
  return <CacheProvider value={cache}><ThemeProvider theme={theme}>{children}</ThemeProvider></CacheProvider>;
}

test('theme is RTL and explicit RTL/LTR styles retain their direction', () => {
  expect(theme.direction).toBe('rtl');
  render(<Foundation><Box data-testid="arabic" sx={{ direction: 'rtl', textAlign: 'start' }}>
    <Box data-testid="technical" sx={{ direction: 'ltr', unicodeBidi: 'isolate' }}>user@example.com</Box>
  </Box></Foundation>);
  expect(getComputedStyle(screen.getByTestId('arabic')).direction).toBe('rtl');
  expect(getComputedStyle(screen.getByTestId('technical')).direction).toBe('ltr');
  expect(getComputedStyle(screen.getByTestId('technical')).unicodeBidi).toBe('isolate');
});

test('physical edges and spacing are not mirrored by the cache', () => {
  render(<Foundation><Box data-testid="edges" sx={{ position: 'fixed', right: 0, left: 'auto', marginRight: '12px', marginLeft: '3px', textAlign: 'right' }} /></Foundation>);
  const style = getComputedStyle(screen.getByTestId('edges'));
  expect(style.right).toBe('0px');
  expect(style.left).not.toBe('0px');
  expect(style.marginRight).toBe('12px');
  expect(style.marginLeft).toBe('3px');
  expect(style.textAlign).toBe('right');
});

test('portal styles preserve RTL and intentional technical LTR', () => {
  render(<Foundation><Portal><Box data-testid="portal" dir="rtl" sx={{ direction: 'rtl' }}>
    <Box data-testid="code" dir="ltr" sx={{ direction: 'ltr' }}>ABC-123</Box>
  </Box></Portal></Foundation>);
  expect(getComputedStyle(screen.getByTestId('portal')).direction).toBe('rtl');
  expect(getComputedStyle(screen.getByTestId('code')).direction).toBe('ltr');
});
