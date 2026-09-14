import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UserManagement from './UserManagement';
import SalesManManagement from './SalesManManagement';

jest.mock('../components/NavigationShell', () => ({ children }) => <>{children}</>);
jest.mock('sweetalert2', () => ({ fire: jest.fn(async () => ({})) }));
const originalFetch = global.fetch;
const reply = (body, status = 200) => ({ ok: status === 200, status,
  json: async () => body, text: async () => JSON.stringify(body) });

beforeEach(() => {
  // Modules were imported before login, as happens on the login page.
  localStorage.setItem('user', JSON.stringify({ guid: 'new-session-user' }));
  localStorage.setItem('token', 'session-token');
  global.fetch = jest.fn(async (url) => {
    if (url.includes('/screen-access/')) return reply({ allowed: true });
    if (url.includes('/user-permissions/')) return reply({ data: { file: { canView: true, screens: { addSalesMan: true } } } });
    if (url.includes('/user-management/users?')) return reply({ data: [{ code: 7, name: 'مستخدم موجود', fullName: 'مستخدم موجود' }] });
    return reply({ data: {} });
  });
});
afterEach(() => { global.fetch = originalFetch; localStorage.clear(); });

test('user search uses the identity established after the page module loaded', async () => {
  render(<UserManagement />);
  fireEvent.click(await screen.findByRole('button', { name: /بحث عن مستخدم/ }));
  expect(await screen.findByText('مستخدم موجود')).toBeInTheDocument();
  expect(global.fetch.mock.calls.some(([url]) => url.includes('/users?userGuid=new-session-user'))).toBe(true);
});

test('a failed lookup reports the failure instead of no results', async () => {
  const fetchSuccess = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url) => url.includes('/user-management/users?')
    ? reply({ message: 'تعذر الاتصال بخدمة المستخدمين' }, 503) : fetchSuccess(url));
  render(<UserManagement />);
  fireEvent.click(await screen.findByRole('button', { name: /بحث عن مستخدم/ }));
  expect(await screen.findByText('تعذر الاتصال بخدمة المستخدمين')).toBeInTheDocument();
  expect(within(screen.getByRole('dialog')).queryByText('لا توجد نتائج.')).not.toBeInTheDocument();
});

test('salesman permissions use the logged-in identity rather than the pre-login snapshot', async () => {
  render(<SalesManManagement />);
  await waitFor(() => expect(global.fetch.mock.calls.some(([url]) =>
    url.includes('/salesman-management/bootstrap?userGuid=new-session-user'))).toBe(true));
  expect(screen.queryByText('لا توجد لديك صلاحية إضافة مندوب بيع ضمن قائمة ملف.')).not.toBeInTheDocument();
});
