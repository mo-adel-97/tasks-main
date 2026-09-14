import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../theme';
import HrEmployeesPage from './HrEmployeesPage';

jest.mock('../components/NavigationShell', () => ({ children }) => <>{children}</>);
jest.mock('sweetalert2', () => ({ fire: jest.fn(async () => ({ isConfirmed: true })) }));

const employee = {
  employeeGuid: 'employee-1', employeeCode: 416, fullName: 'موظف اختبار',
  nationalId: '1234567890', mobile: '0501234567', iban: 'SA123456789',
  branchGuid: 'BRANCH-1', branchName: 'فرع الموظف',
  departmentGuid: 'DEPT-1', departmentName: 'قسم الموظف',
  jobCode: 12, jobTitle: 'المسمى الحالي', isActive: true
};
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn(async (url) => {
    let data = {};
    if (url.endsWith('/api/hr/employees')) data = [employee];
    if (url.endsWith('/employees/lookups')) data = {
      branches: [{ guid: 'branch-1', name: employee.branchName }],
      departments: [{ guid: 'dept-1', name: employee.departmentName }]
    };
    if (url.endsWith('/job-titles/lookups')) data = [];
    return { ok: true, json: async () => ({ data }) };
  });
});
afterEach(() => { global.fetch = originalFetch; });

test('editing retains contact data and the current organizational selections', async () => {
  render(<ThemeProvider theme={theme}><HrEmployeesPage /></ThemeProvider>);
  const openButton = (await screen.findAllByRole('button', { name: 'بطاقة الموظف' }))[0];
  await act(async () => { fireEvent.click(openButton); });
  const dialog = within(await screen.findByRole('dialog', { hidden: true }));
  fireEvent.click(dialog.getByRole('button', { name: 'تعديل البيانات', hidden: true }));
  expect(dialog.getByDisplayValue(employee.fullName)).toBeVisible();
  expect(dialog.getByDisplayValue(employee.nationalId)).toBeVisible();
  expect(dialog.getByDisplayValue(employee.mobile)).toBeVisible();
  expect(dialog.getByDisplayValue(employee.iban)).toBeVisible();
  const selections = dialog.getAllByRole('combobox', { hidden: true });
  expect(selections[1]).toHaveTextContent(employee.branchName);
  expect(selections[2]).toHaveTextContent(employee.departmentName);
  expect(selections[3]).toHaveTextContent(employee.jobTitle);
});
