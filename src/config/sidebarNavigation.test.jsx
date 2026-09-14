import { CacheProvider } from '@emotion/react';
import rtlTheme, { createAppCache } from '../theme';
import NavigationShell from '../components/NavigationShell';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Box, ThemeProvider, useMediaQuery } from '@mui/material';
import Sidebar from '../components/Sidebar';
import { getAdminNavigation, HEADER_NAVIGATION, normalizeSidebarKey, resolveSidebarIcon } from './sidebarNavigation';
import { getSidebarOffset, navigationContentSx, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './sidebarLayout';

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'), useMediaQuery: jest.fn(),
}));

// Captured from the original menu before the refactor.
const originalMenu = [
  [
    "/admin-income",
    "الدخل"
  ],
  [
    "/admin-dashboard",
    "الرئيسية"
  ],
  [
    "/dashboard/employee-cvs",
    "السير الذاتية"
  ],
  [
    "/admin-stats",
    "عرض الإحصائيات"
  ],
  [
    "/admin-add-task",
    "إضافة مهمة جديدة"
  ],
  [
    "/admin-view-tasks",
    "عرض المهام"
  ]
];
const originalHeader = [
  {
    "to": "/dashboard/create-exam",
    "label": "إضافة اختبار"
  },
  {
    "to": "/dashboard/tests",
    "label": "طباعة أوراق الاختبار"
  }
];
const expandLabel = "توسيع القائمة";
const collapseLabel = "تصغير القائمة";

test('preserves admin routes, labels, ordering, and the exact sa condition', () => {
  for (const user of [null, { userName: 'employee' }, { userName: 'SA' }]) {
    expect(getAdminNavigation(user).map(({ to, label }) => [to, label])).toEqual(originalMenu);
  }
  expect(getAdminNavigation({ userName: 'sa' }).at(-1)).toMatchObject({ to: '/admin-all-tasks', admin: true });
  expect(getAdminNavigation({ userName: 'sa' })).toHaveLength(7);
  expect(HEADER_NAVIGATION).toEqual(originalHeader);
});

test('normalizes server icon keys and retains the unknown-icon fallback', () => {
  expect(normalizeSidebarKey(' HOME ')).toBe('home');
  expect(resolveSidebarIcon(' HOME ').type).toBe(resolveSidebarIcon('home').type);
  expect(resolveSidebarIcon('unknown').type).toBe(resolveSidebarIcon('dashboard').type);
  const fallback = <span>fallback</span>;
  expect(resolveSidebarIcon('unknown', fallback)).toBe(fallback);
});

test('mobile standard navigation overlays content and admin collapse controls its gutter', () => {
  expect(getSidebarOffset('standard', false)).toBe(0);
  expect(getSidebarOffset('standard', true)).toBe(SIDEBAR_WIDTH);
  expect(getSidebarOffset('admin', false, false)).toBe(SIDEBAR_WIDTH);
  expect(getSidebarOffset('admin', true, true)).toBe(SIDEBAR_COLLAPSED_WIDTH);
});

test('real admin renderer preserves links and collapses in RTL', () => {
  useMediaQuery.mockReturnValue(true);
  localStorage.setItem('user', JSON.stringify({ userName: 'sa' }));
  const { container } = render(<RtlEnvironment>
    <MemoryRouter><Sidebar variant="admin" /></MemoryRouter>
  </RtlEnvironment>);
  const sidebar = container.querySelector('[dir="rtl"]');
  expect(getComputedStyle(sidebar).width).toBe('280px');
  expect(getComputedStyle(sidebar).direction).toBe('rtl');
  expect(sidebar.style.right).toBe('0px');
  expect(container.querySelector('a[href="/admin-all-tasks"]')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: collapseLabel }));
  expect(getComputedStyle(sidebar).width).toBe('86px');
  expect(container.querySelectorAll('a')).toHaveLength(7);
  fireEvent.click(screen.getByRole('button', { name: expandLabel }));
  expect(screen.getByRole('link', { name: originalMenu[3][1] })).toHaveAttribute('href', '/admin-stats');
  localStorage.clear();
});

test('mobile drawer is physically on the right and retains RTL content', async () => {
  useMediaQuery.mockReturnValue(false);
  localStorage.clear();
  const oldFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ configured: true, groups: [{ groupKey: 'test', title: 'Group', iconKey: 'home' }], items: [{ title: 'Standalone', route: '/standalone', placement: 'standalone', iconKey: 'home' }, { title: 'Child', route: '/child', groupKey: 'test', iconKey: 'home' }] }) });
  try {
    const { baseElement } = render(<RtlEnvironment>
      <MemoryRouter><Sidebar mobileOpen onMobileClose={() => {}} /></MemoryRouter>
    </RtlEnvironment>);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(baseElement.querySelector('.MuiCircularProgress-root')).toBeNull();
    });
    const paper = baseElement.querySelector('.MuiDrawer-paper');
    expect(paper.style.right).toBe('0px');
    // This project's jsdom drops the valid CSS value left:auto.
    expect(paper.style.left).not.toBe('0px');
    expect(paper.querySelector('[dir="rtl"]')).not.toBeNull();
    const standalone = screen.getByRole('link', { name: 'Standalone' });
    const icon = standalone.querySelector('.MuiListItemIcon-root');
    const label = standalone.querySelector('.MuiListItemText-root');
    expect(icon.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getComputedStyle(label.querySelector('.MuiTypography-root')).textAlign).toBe('start');
    fireEvent.click(screen.getByText('Group'));
    const child = await screen.findByRole('link', { name: 'Child' });
    expect(child.querySelector('.MuiListItemIcon-root').compareDocumentPosition(child.querySelector('.MuiListItemText-root')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  } finally { global.fetch = oldFetch; }
});


// Exercise the same cache configuration used by the application.
const rtlCache = createAppCache({ key: 'sidebar-test-rtl', speedy: false });
function RtlEnvironment({ children }) {
  return <CacheProvider value={rtlCache}><ThemeProvider theme={rtlTheme}>{children}</ThemeProvider></CacheProvider>;
}

test('expanded and collapsed content gutters remain on the RTL start side under the real cache', () => {
  useMediaQuery.mockReturnValue(true);
  const { container } = render(<RtlEnvironment><MemoryRouter>
    <NavigationShell variant="admin"><Box data-testid="main-content" sx={navigationContentSx} /></NavigationShell>
  </MemoryRouter></RtlEnvironment>);
  const shell = container.querySelector('[dir="rtl"]');
  const content = screen.getByTestId('main-content');
  expect(shell.style.getPropertyValue('--navigation-direction')).toBe('rtl');
  expect(shell.style.getPropertyValue('--navigation-content-offset')).toBe('280px');
  expect(getComputedStyle(content).direction).toBe('var(--navigation-direction, rtl)');
  expect(getComputedStyle(content).marginInlineStart).toBe('var(--navigation-content-offset, 0px)');
  expect(getComputedStyle(content).marginInlineEnd).toBe('0px');
  fireEvent.click(screen.getByRole('button', { name: collapseLabel }));
  expect(shell.style.getPropertyValue('--navigation-content-offset')).toBe('86px');
  expect(getComputedStyle(content).direction).toBe('var(--navigation-direction, rtl)');
});

test('standard desktop sidebar is physically right under the real RTL cache', async () => {
  useMediaQuery.mockReturnValue(true);
  const oldFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ configured: true, groups: [{ groupKey: 'test', title: 'Group', iconKey: 'home' }], items: [{ title: 'Standalone', route: '/standalone', placement: 'standalone', iconKey: 'home' }, { title: 'Child', route: '/child', groupKey: 'test', iconKey: 'home' }] }) });
  try {
    const { container } = render(<RtlEnvironment><MemoryRouter><Sidebar /></MemoryRouter></RtlEnvironment>);
    await waitFor(() => expect(container.querySelector('.MuiCircularProgress-root')).toBeNull());
    const sidebar = container.querySelector('[dir="rtl"]');
    expect(getComputedStyle(sidebar).direction).toBe('rtl');
    expect(getComputedStyle(sidebar).position).toBe('fixed');
    expect(sidebar.style.right).toBe('0px');
    expect(getComputedStyle(sidebar).width).toBe('280px');
  } finally { global.fetch = oldFetch; }
});
