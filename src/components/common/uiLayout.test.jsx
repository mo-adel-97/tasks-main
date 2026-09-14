import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CacheProvider } from '@emotion/react';
import { TextField, ThemeProvider, MenuItem } from '@mui/material';
import theme, { createAppCache } from '../../theme';
import { formFieldSx } from './uiLayout';

test('static Arabic labels retain accessible fields, change handlers and validation styling', () => {
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
  const input=screen.getByLabelText('البريد');
  fireEvent.change(input,{target:{value:'example@example.test'}});
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(input).toHaveAttribute('dir','ltr');
  expect(input).toHaveAttribute('aria-invalid','true');
  const label=container.querySelector('.MuiInputLabel-root');
  expect(getComputedStyle(label).position).toBe('static');
  expect(getComputedStyle(label).transform).toBe('none');
  // Outline geometry needs a real layout engine; JSDOM does not verify it.
  expect(screen.getByText('بيانات غير صالحة')).toBeInTheDocument();
});
