import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';

// This test covers the login form, not MUI's entire icon catalogue.
jest.mock('@mui/icons-material', () => Object.fromEntries(
  ['AdminPanelSettings', 'AssessmentOutlined', 'BusinessOutlined', 'GroupsOutlined',
    'LockOutlined', 'PersonOutline', 'SecurityOutlined', 'Visibility', 'VisibilityOff']
    .map(name => [name, () => null])
));

test('Arabic login keeps its controls and rejects an empty submission locally', () => {
  const fetchBefore = global.fetch;
  global.fetch = jest.fn();
  try {
    render(<MemoryRouter><AuthProvider><ThemeProvider theme={theme}><Login /></ThemeProvider></AuthProvider></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument();
    expect(screen.getByLabelText('اسم المستخدم')).toBeInTheDocument();
    expect(screen.getByLabelText('كلمة المرور', { selector: 'input' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'دخول', exact: true }));
    expect(screen.getByText('برجاء إدخال اسم المستخدم وكلمة المرور')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  } finally { global.fetch = fetchBefore; }
});
