import React from 'react';
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { render, screen, fireEvent } from '@testing-library/react';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, Chip, Tabs, Tab } from '@mui/material';
import theme, { createAppCache } from '../theme';
import EmployeeProfileDialog from './EmployeeProfileDialog';
import { hrChipSx, hrTabIconSx } from './hrControlStyles';

function UI({ children }) {
  return <CacheProvider value={createAppCache({ key: 'hr-test', speedy: false })}>
    <ThemeProvider theme={theme}><div dir="rtl">{children}</div></ThemeProvider>
  </CacheProvider>;
}

test('employee profile keeps all six tabs in an RTL dialog and isolates contact values', () => {
  const close = jest.fn();
  render(<UI><EmployeeProfileDialog open onClose={close}
    employee={{ fullName: 'موظف اختبار', userName: 'employee', email: 'hr@example.com', phone: '+966501234567' }}
  /></UI>);
  const dialog = screen.getByRole('dialog');
  expect(dialog.closest('[dir]')).toHaveAttribute('dir', 'rtl');
  expect(getComputedStyle(dialog).textAlign).toBe('start');
  expect(screen.getByText('hr@example.com')).toHaveAttribute('dir', 'ltr');
  expect(screen.getByText('+966501234567')).toHaveAttribute('dir', 'ltr');
  const tabs = screen.getAllByRole('tab');
  expect(tabs).toHaveLength(6);
  for (const tab of tabs) {
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(dialog.closest('[dir]')).toHaveAttribute('dir', 'rtl');
  }
  fireEvent.click(tabs[1]);
  for (const input of dialog.querySelectorAll('input[type="date"]')) {
    expect(input).toHaveAttribute('dir', 'ltr');
    expect(input.closest('.MuiTextField-root')).not.toHaveAttribute('dir', 'ltr');
  }
  fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }));
  expect(close).toHaveBeenCalledTimes(1);
});

test('HR tab and chip icons use logical spacing without changing action behavior', () => {
  const remove = jest.fn();
  const { container } = render(<UI>
    <Tabs value={0}><Tab sx={hrTabIconSx} icon={<span>icon</span>} iconPosition="start" label="بيانات" /></Tabs>
    <Chip sx={hrChipSx('small')} size="small" icon={<span>status</span>} label="نشط" onDelete={remove} />
  </UI>);
  const tabIcon = container.querySelector('.MuiTab-iconWrapper');
  expect(getComputedStyle(tabIcon).marginRight).toBe('0px');
  expect(getComputedStyle(tabIcon).marginInlineEnd).toBe('8px');
  const chipIcon = container.querySelector('.MuiChip-icon');
  expect(getComputedStyle(chipIcon).marginInlineStart).toBe('4px');
  expect(getComputedStyle(chipIcon).marginInlineEnd).toBe('-4px');
  fireEvent.click(container.querySelector('.MuiChip-deleteIcon'));
  expect(remove).toHaveBeenCalledTimes(1);
});

test('all HR page direction constants keep Arabic containers RTL and dates LTR', () => {
  const directory = path.join(process.cwd(), 'src/pages');
  const checked = [];
  for (const file of fs.readdirSync(directory).filter(name => /^Hr.*\.(js|jsx)$/.test(name))) {
    const ast = parse(fs.readFileSync(path.join(directory, file), 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    traverse(ast, { VariableDeclarator(p) {
      const { id, init } = p.node;
      if (init?.type !== 'StringLiteral') return;
      if (id.name.endsWith('_DIRECTION')) {
        expect(init.value).toBe(id.name.includes('DATE') ? 'ltr' : 'rtl');
        checked.push(id.name);
      }
      if (id.name.endsWith('_TEXT_ALIGN')) expect(init.value).not.toBe('left');
    } });
  }
  expect(checked.length).toBeGreaterThan(15);
});

test('employee history uses natural grid order and date fields do not flip the control shell', () => {
  const file = path.join(process.cwd(), 'src/pages/HrEmployeesPage.jsx');
  const ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  let histories = 0;
  traverse(ast, { ObjectProperty(p) {
    if (p.node.key.name === 'gridTemplateAreas') {
      const desktop = p.node.value.properties.find(x => x.key.name === 'sm');
      expect(desktop.value.value).toBe('"old new"');
      histories += 1;
    }
    if (p.node.key.value === '& .MuiInputBase-root') {
      const direction = p.node.value.properties.find(x => x.key?.name === 'direction');
      expect(direction?.value?.name).not.toBe('ATTENDANCE_DATE_DIRECTION');
    }
  } });
  expect(histories).toBe(1);
});
