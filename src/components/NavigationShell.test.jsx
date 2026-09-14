import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useMediaQuery } from '@mui/material';
import NavigationShell from './NavigationShell';

jest.mock('@mui/material', () => ({ useMediaQuery: jest.fn() }));
jest.mock('./Sidebar', () => function TestSidebar(props) {
  return <><button data-testid="sidebar" data-variant={props.variant}
    data-open={String(props.mobileOpen)}
    onClick={() => props.onCollapsedChange(!props.collapsed)}>Toggle</button>
    <button data-testid="close-sidebar" onClick={props.onMobileClose}>Close</button></>;
});
beforeEach(() => useMediaQuery.mockReturnValue(true));

test('admin collapse updates the shared content gutter', () => {
  render(<NavigationShell variant="admin"><main data-testid="content" /></NavigationShell>);
  const wrapper = screen.getByTestId('content').parentElement;
  expect(wrapper.dir).toBe('rtl');
  expect(wrapper.style.getPropertyValue('--navigation-content-offset')).toBe('280px');
  fireEvent.click(screen.getByTestId('sidebar'));
  expect(wrapper.style.getPropertyValue('--navigation-content-offset')).toBe('86px');
});

test('mobile standard shell reserves no gutter and forwards its open state', () => {
  useMediaQuery.mockReturnValue(false);
  render(<NavigationShell mobileOpen><main data-testid="content" /></NavigationShell>);
  expect(screen.getByTestId('content').parentElement.style.getPropertyValue('--navigation-content-offset')).toBe('0px');
  expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');
});

test('embedded screens share one renderer and restore parent navigation on unmount', () => {
  const View = ({ nested }) => <NavigationShell>
    {nested && <NavigationShell variant="admin"><main data-testid="nested" /></NavigationShell>}
  </NavigationShell>;
  const { rerender } = render(<View nested />);
  expect(screen.getAllByTestId('sidebar')).toHaveLength(1);
  expect(screen.getByTestId('sidebar')).toHaveAttribute('data-variant', 'admin');
  expect(screen.getByTestId('nested').parentElement.style.getPropertyValue('--navigation-content-offset')).toBe('0px');
  rerender(<View nested={false} />);
  expect(screen.getByTestId('sidebar')).toHaveAttribute('data-variant', 'standard');
});


test('embedded mobile controls open and close the parent renderer', () => {
  useMediaQuery.mockReturnValue(false);
  const onClose = jest.fn();
  const View = ({ open }) => <NavigationShell>
    <NavigationShell mobileOpen={open} onMobileClose={onClose}><main /></NavigationShell>
  </NavigationShell>;
  const { rerender } = render(<View open={false} />);
  expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');
  rerender(<View open />);
  expect(screen.getAllByTestId('sidebar')).toHaveLength(1);
  expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');
  fireEvent.click(screen.getByTestId('close-sidebar'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
