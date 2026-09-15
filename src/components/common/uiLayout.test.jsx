import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CacheProvider } from '@emotion/react';
import { TextField, ThemeProvider, MenuItem } from '@mui/material';
import theme, { createAppCache } from '../../theme';
import { formFieldSx } from './uiLayout';

test('integrated Arabic labels stay compact without losing accessibility or validation behavior', () => {
  const onChange = jest.fn();
  const { container } = render(<CacheProvider value={createAppCache({key:'ui-layout-test',speedy:false})}>
    <ThemeProvider theme={theme}><div dir="rtl">
      <TextField label="البريد" error helperText="بيانات غير صالحة" inputProps={{dir:'ltr'}}
        InputLabelProps={{shrink:true}} sx={formFieldSx} onChange={onChange} />
      <TextField label="الحالة" select defaultValue="active" InputLabelProps={{shrink:true}} sx={formFieldSx}>
        <MenuItem value="active">نشط</MenuItem>
      </TextField>
    </div></ThemeProvider>
  </CacheProvider>);

  const input = screen.getByLabelText('البريد');
  fireEvent.change(input, { target: { value: 'example@example.test' } });

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(input).toHaveAttribute('dir', 'ltr');
  expect(input).toHaveAttribute('aria-invalid', 'true');

  const labels = container.querySelectorAll('.MuiInputLabel-root');
  expect(labels.length).toBeGreaterThanOrEqual(2);
  labels.forEach((label) => {
    expect(getComputedStyle(label).position).toBe('absolute');
  });

  // The field label remains associated with the control while occupying no
  // standalone layout row above it. Exact transform geometry is theme/runtime
  // specific, so JSDOM only verifies the stable positioning contract here.
  expect(screen.getByText('بيانات غير صالحة')).toBeInTheDocument();
});
