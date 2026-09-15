import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Portal, useTheme } from '@mui/material';
import { COLOR_MODE_KEY, ColorModeProvider } from './ColorModeContext';

function Probe() {
  const theme = useTheme();
  return <Portal><span data-testid="mode">{theme.palette.mode}</span></Portal>;
}
afterEach(() => localStorage.clear());

test('switching mode updates portalled content and persists across remounts', () => {
  localStorage.setItem(COLOR_MODE_KEY, 'light');
  const view = render(<ColorModeProvider><Probe /></ColorModeProvider>);
  expect(screen.getByTestId('mode')).toHaveTextContent('light');
  fireEvent.click(screen.getByRole('button', { name: 'تفعيل الوضع الداكن' }));
  expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');
  expect(localStorage.getItem(COLOR_MODE_KEY)).toBe('dark');
  view.unmount();
  render(<ColorModeProvider><Probe /></ColorModeProvider>);
  expect(screen.getByTestId('mode')).toHaveTextContent('dark');
  fireEvent.click(screen.getByRole('button', { name: 'تفعيل الوضع الفاتح' }));
  expect(screen.getByTestId('mode')).toHaveTextContent('light');
});
