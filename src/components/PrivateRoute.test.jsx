import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const originalFetch = global.fetch;
const response = (status, data) => ({ ok: status === 200, status, json: async () => data });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', expect.getState().currentTestName);
  localStorage.setItem('user', JSON.stringify({ guid: 'employee' }));
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
  localStorage.clear();
});

function mount() {
  render(<MemoryRouter initialEntries={['/dashboard']}><Routes>
    <Route path="/dashboard" element={<PrivateRoute><div>Dashboard content</div></PrivateRoute>} />
    <Route path="/login" element={<div>Login page</div>} />
  </Routes></MemoryRouter>);
}

test('a permissions connection failure retains the session and supports retry', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(async (url) => {
    if (url.endsWith('/userinfo/me')) return response(200, { guid: 'employee' });
    throw new TypeError('Failed to fetch');
  });
  mount();
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeTruthy();
  expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  global.fetch.mockImplementation(async (url) => url.endsWith('/userinfo/me')
    ? response(200, { guid: 'employee' })
    : response(200, { configured: true, items: [{ route: '/dashboard' }] }));
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText('Dashboard content')).toBeInTheDocument();
});

test('a session server error retains credentials without admitting the user', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(async () => response(503, {}));
  mount();
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeTruthy();
  expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
});

test('an invalid session clears credentials and returns to login', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn(async () => response(401, {}));
  mount();
  expect(await screen.findByText('Login page')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
});
