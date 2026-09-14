import React from 'react';
import { render } from '@testing-library/react';
import { CacheProvider } from '@emotion/react';
import { Box, TextField, ThemeProvider } from '@mui/material';
import theme, { createAppCache } from '../theme';
import { hrEmployeeFieldSx } from './hrControlStyles';

test('responsive employee fields render readable rem font sizes instead of subpixel text', () => {
  const cache = createAppCache({ key: 'employee-fields-test', speedy: false });
  const { unmount } = render(
    <CacheProvider value={cache}><ThemeProvider theme={theme}>
      <Box sx={hrEmployeeFieldSx({ height: { xs: 42, sm: 44 }, inputSize: { xs: 0.74, sm: 0.8 } })}>
        <TextField label="اسم الموظف" value="موظف اختبار" />
      </Box>
    </ThemeProvider></CacheProvider>
  );
  const css = cache.sheet.tags.map((tag) => tag.textContent).join('\n');
  expect(css).toContain('font-size:0.74rem');
  expect(css).toContain('font-size:0.8rem');
  expect(css).not.toMatch(/font-size:0\.(74|8)px/);
  unmount();
  cache.sheet.flush();
});
