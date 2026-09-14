import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, Button, TextField, MenuItem, Dialog, DialogActions, InputAdornment,
  Autocomplete, Accordion, AccordionSummary, Table, TableBody, TableRow, TableCell, useMediaQuery } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import theme, { createAppCache } from '../theme';
import Header from './Header';
import StudentInfoCard from './attendance/StudentInfoCard';

// Card assertions concern layout and bidi values, not the full icon catalogue.
jest.mock('@mui/icons-material', () => Object.fromEntries(
  ['Person', 'School', 'Badge', 'Phone', 'Flag', 'Assignment', 'CheckCircle', 'Schedule', 'LocationOn']
    .map((name) => [name, () => null])
));

jest.mock('@mui/material', () => ({ ...jest.requireActual('@mui/material'), useMediaQuery: jest.fn() }));
function SharedUI({ children }) {
  return <CacheProvider value={createAppCache({ key: 'shared-test', speedy: false })}>
    <ThemeProvider theme={theme}><div dir="rtl">{children}</div></ThemeProvider>
  </CacheProvider>;
}

test('Arabic buttons retain leading/trailing icons and logical gaps', () => {
  const click = jest.fn();
  render(<SharedUI><Button onClick={click} startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>Action</Button></SharedUI>);
  const button = screen.getByRole('button');
  expect(button.firstElementChild).toContainElement(screen.getByTestId('start'));
  expect(button.querySelector('.MuiButton-endIcon')).toContainElement(screen.getByTestId('end'));
  expect(getComputedStyle(button.firstElementChild).marginInlineEnd).toBe('8px');
  expect(getComputedStyle(button.querySelector('.MuiButton-endIcon')).marginInlineStart).toBe('8px');
  fireEvent.click(button);
  expect(click).toHaveBeenCalledTimes(1);
});

test('form labels stay above the field while select arrows use the RTL edge', () => {
  const { container } = render(<SharedUI><TextField label="Selection" select value="a" onChange={() => {}}>
    <MenuItem value="a">Option</MenuItem>
  </TextField><TextField label="Email" inputProps={{ dir: 'ltr' }} defaultValue="test@example.com"
    InputProps={{ startAdornment: <InputAdornment position="start">@</InputAdornment> }} /></SharedUI>);
  const label = container.querySelector('.MuiInputLabel-root');
  expect(getComputedStyle(label).position).toBe('static');
  expect(getComputedStyle(label).transform).toBe('none');
  expect(getComputedStyle(container.querySelector('.MuiSelect-icon')).left).toBe('7px');
  expect(screen.getByDisplayValue('test@example.com')).toHaveAttribute('dir', 'ltr');
  expect(getComputedStyle(container.querySelector('.MuiInputAdornment-root')).marginInlineEnd).toBe('8px');
});

test('portal dialog action spacing and accordion order follow RTL', () => {
  render(<SharedUI><Dialog open><DialogActions><Button>First</Button><Button>Second</Button></DialogActions></Dialog>
    <Accordion><AccordionSummary expandIcon={<span data-testid="arrow" />}>Title</AccordionSummary></Accordion>
  </SharedUI>);
  expect(getComputedStyle(screen.getByRole('button', { name: 'Second' })).marginInlineStart).toBe('8px');
  const summary = screen.getByTestId('arrow').closest('.MuiAccordionSummary-root');
  expect(summary.lastElementChild).toContainElement(screen.getByTestId('arrow'));
});

test('shared table defaults use start alignment and preserve explicit numeric alignment', () => {
  render(<SharedUI><Table><TableBody><TableRow><TableCell>Name</TableCell><TableCell align="right">123</TableCell></TableRow></TableBody></Table></SharedUI>);
  expect(getComputedStyle(screen.getByText('Name')).textAlign).toBe('start');
  expect(getComputedStyle(screen.getByText('123')).textAlign).toBe('right');
});

test('shared header leaves the content gutter to NavigationShell on every viewport', () => {
  useMediaQuery.mockReturnValue(true);
  const ui = <SharedUI><MemoryRouter><Header user={{ fullName: 'User' }} /></MemoryRouter></SharedUI>;
  const { container, rerender } = render(ui);
  expect(container.querySelector('header').style.marginRight).toBe('');
  useMediaQuery.mockReturnValue(false);
  rerender(<SharedUI><MemoryRouter><Header user={{ fullName: 'User' }} /></MemoryRouter></SharedUI>);
  expect(container.querySelector('header').style.marginRight).toBe('');
});

test('student card uses RTL while phone and ID are isolated LTR values', () => {
  const { container } = render(<SharedUI><StudentInfoCard studentData={{ studentName: 'Student', nationalId: '1234567890', studentTel: '+966 50 123 4567' }} /></SharedUI>);
  expect(container.querySelector('bdi[dir="ltr"]')).toHaveTextContent('1234567890');
  expect(screen.getByText('+966 50 123 4567')).toHaveAttribute('dir', 'ltr');
});

test('autocomplete reserves space for its controls on the physical left', () => {
  const { container } = render(<SharedUI><Autocomplete size="small" options={['Option']}
    renderInput={(params) => <TextField {...params} label="Search" />} /></SharedUI>);
  const root = container.querySelector('.MuiAutocomplete-inputRoot');
  const controls = container.querySelector('.MuiAutocomplete-endAdornment');
  expect(getComputedStyle(root).paddingLeft).toBe('39px');
  expect(getComputedStyle(root).paddingRight).toBe('6px');
  expect(getComputedStyle(controls).left).toBe('9px');
});
