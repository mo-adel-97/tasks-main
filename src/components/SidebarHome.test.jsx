import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';

jest.mock('@mui/material', () => ({ ...jest.requireActual('@mui/material'), useMediaQuery: jest.fn() }));

test('Home starts closed, manual expansion works, and child navigation does not leak expansion back to Home', async () => {
  useMediaQuery.mockReturnValue(true);
  localStorage.clear();
  const previousFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    configured: true,
    groups: [{ groupKey: 'file', title: 'ملف', iconKey: 'home' }],
    items: [
      { title: 'الرئيسية', route: '/dashboard', groupKey: 'file', iconKey: 'home' },
      { title: 'صفحة فرعية', route: '/dashboard/child', groupKey: 'file', iconKey: 'home' },
    ],
  }) });
  function View() {
    const navigate = useNavigate();
    return <><button onClick={() => navigate('/dashboard')}>Home test</button><Sidebar /></>;
  }
  try {
    render(<MemoryRouter initialEntries={['/dashboard']}><View /></MemoryRouter>);
    const group = await screen.findByRole('button', { name: 'ملف' });
    expect(screen.queryByRole('link', { name: 'صفحة فرعية' })).not.toBeInTheDocument();
    fireEvent.click(group);
    fireEvent.click(await screen.findByRole('link', { name: 'صفحة فرعية' }));
    expect(await screen.findByRole('link', { name: 'الرئيسية' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Home test' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'صفحة فرعية' })).not.toBeInTheDocument());
  } finally { global.fetch = previousFetch; }
});
