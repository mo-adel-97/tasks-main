// Opt-in presentation primitives. These never receive data, handlers or state.
// Keep the stock Emotion cache: no direction-transforming middleware is needed.
import { designTokens, mobileHeaderStyles } from '../../config/designTokens';
import { DESKTOP_BREAKPOINT } from '../../config/sidebarLayout';

export const mobileHeaderSx = {
  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { ...mobileHeaderStyles, px: '12px', gap: '10px' },
};

export const sidebarSurfaceSx = {
  overflowY: 'auto', overscrollBehavior: 'contain',
  '&& .MuiListItemText-primary': { fontSize: designTokens.typography.sidebar, fontWeight: 600, lineHeight: 1.5 },
  '& .MuiListItemText-secondary': { fontSize: '0.75rem', lineHeight: 1.5 },
  '&& .MuiListItemIcon-root .MuiSvgIcon-root': { fontSize: '1rem' },
  '& .MuiListItemButton-root, & .MuiListItem-root': { minHeight: 40, borderRadius: '8px' },
  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
    '& .MuiListItemButton-root, & .MuiListItem-root': { minHeight: 44 },
  },
};
export const withUiSx = (original, ...additions) => [
  ...(Array.isArray(original) ? original : [original]), ...additions,
];

export const formFieldSx = {
  direction: 'rtl',
  minWidth: 0,
  maxWidth: '100%',
  textAlign: 'start',
  '&& > .MuiInputLabel-root': {
    position: 'static', transform: 'none', maxWidth: '100%', width: 'auto',
    height: 'auto', minHeight: '24px', margin: '0 0 6px', padding: 0,
    whiteSpace: 'normal', overflow: 'visible', overflowWrap: 'anywhere', textAlign: 'start',
    fontSize: '0.8125rem', fontWeight: 700, lineHeight: '24px',
    pointerEvents: 'auto',
  },
  '&& > .MuiInputBase-root': {
    marginTop: 0, minHeight: 44, height: 'auto', borderRadius: '10px',
    fontSize: '0.875rem',
  },
  '&& > .MuiInputBase-root:not(.MuiInputBase-multiline) .MuiInputBase-input': {
    paddingBlock: '10px', height: 'auto', lineHeight: '24px',
  },
  '&& > .MuiInputBase-root > .MuiOutlinedInput-notchedOutline > legend': {
    display: 'none',
  },
  '&& > .MuiAutocomplete-inputRoot .MuiAutocomplete-input': { paddingBlock: '2px' },
  '&& .MuiFormHelperText-root': {
    marginInline: 0, lineHeight: 1.6, textAlign: 'start',
  },
  [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
    '&& > .MuiInputBase-root': { minHeight: designTokens.controlHeight },
    '&& > .MuiInputBase-root:not(.MuiInputBase-multiline) .MuiInputBase-input': { paddingBlock: '8px', lineHeight: '24px', fontSize: designTokens.typography.control },
    '&& > .MuiAutocomplete-inputRoot .MuiAutocomplete-input': { paddingBlock: '0px' },
  },
};

export const formGridSx = {
  direction: 'rtl', textAlign: 'start',
  display: 'grid', minWidth: 0, alignItems: 'start', gap: designTokens.layoutGap,
  gridTemplateColumns: {
    xs: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
  },
  '& > *': { minWidth: 0, maxWidth: '100%' },
  '& > .MuiFormControl-root, & > .MuiAutocomplete-root': { width: '100%' },
  '@media (max-width: 599.95px)': { '& > *': { gridColumn: 'auto' } },
};

export const filterBarSx = {
  direction: 'rtl', textAlign: 'start',
  display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
  alignItems: 'flex-end', gap: 1.5, minWidth: 0,
  '& > .MuiFormControl-root, & > .MuiAutocomplete-root': {
    flex: '1 1 210px', minWidth: 0, width: { xs: '100%', sm: 'auto' },
  },
  '& > .MuiButton-root': { minHeight: { xs: 44, lg: 40 }, flexShrink: 0 },
  '@media (max-width: 599.95px)': {
    '& > .MuiFormControl-root, & > .MuiAutocomplete-root': { flexBasis: '100%' },
    '& > .MuiButton-root': { flex: '1 1 130px' },
  },
};

export const actionBarSx = {
  direction: 'rtl', textAlign: 'start',
  display: 'flex', flexWrap: 'wrap', gap: 1.25, minWidth: 0,
  alignItems: 'center',
  '& > .MuiButton-root': { minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere', minHeight: { xs: 44, lg: 40 } },
};

export const checkboxFieldSx = {
  alignSelf: 'start', minHeight: 44, margin: 0, paddingInline: 0,
  paddingBlock: 0, border: 0, background: 'transparent',
  marginTop: { xs: 0, sm: '30px' },
  '& .MuiFormControlLabel-label': { fontSize: '0.875rem', lineHeight: 1.6 },
};

export const dialogLayoutSx = {
  direction: 'rtl', textAlign: 'start',
  '& .MuiDialog-paper': { direction: 'rtl', textAlign: 'start' },
  '& .MuiDialog-paper:not(.MuiDialog-paperFullScreen)': {
    margin: { xs: '12px', sm: '24px' },
    maxHeight: 'calc(100dvh - 24px)',
    '&.MuiDialog-paperFullWidth': { width: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 48px)' } },
    '@media (max-width: 599.95px)': { maxWidth: 'calc(100% - 24px)', minWidth: 0 },
  },
  '& .MuiDialogTitle-root': {
    textAlign: 'start', padding: { xs: '16px', sm: '20px 24px' },
    overflowWrap: 'anywhere',
  },
  '& .MuiDialogContent-root': { minWidth: 0, padding: { xs: '16px', sm: '20px 24px' } },
};

export const dialogActionsSx = {
  direction: 'rtl', textAlign: 'start', justifyContent: 'flex-start',
  flexWrap: 'wrap', gap: 1.25, padding: '16px 24px',
  '&& > :not(style) ~ :not(style)': { margin: 0 },
  '& > .MuiButton-root': { minHeight: 44 },
  '@media (max-width: 599.95px)': { padding: '12px 16px', '& > .MuiButton-root': { flex: '1 1 auto' } },
};

export const tableContainerSx = {
  direction: 'rtl',
  minWidth: 0, maxWidth: '100%', overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

export const tablePaginationSx = {
  direction: 'rtl',
  '&& .MuiTablePagination-toolbar': { flexWrap: 'wrap', gap: 1, paddingInline: 1 },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { marginBlock: 1 },
  '& .MuiTablePagination-actions': { marginInlineStart: 1, marginLeft: 0 },
};

export const dataGridSx = {
  direction: 'rtl', textAlign: 'start',
  minWidth: 0, maxWidth: '100%', fontSize: '0.875rem',
  '&& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
  '&& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.8125rem', lineHeight: 1.5 },
  '&& .MuiDataGrid-cell': { fontSize: '0.8125rem', paddingInline: '10px' },
  '&& .MuiDataGrid-toolbarContainer': { flexWrap: 'wrap', gap: 1, padding: 1.5 },
  '&& .MuiDataGrid-footerContainer': { flexWrap: 'wrap', minHeight: 52 },
  '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', gap: 1, paddingInline: 1 },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { marginBlock: 1 },
};

export const radioGroupSx = {
  direction: 'rtl', textAlign: 'start',
  flexWrap: 'wrap', gap: 1.25, minWidth: 0,
  '&& .MuiFormControlLabel-root': { margin: 0 },
  '&& .MuiFormControlLabel-label': { fontSize: '0.875rem', lineHeight: 1.6 },
};

export const pageHeaderSx = {
  direction: 'rtl', textAlign: 'start',
  flexWrap: 'wrap', gap: designTokens.layoutGap, minWidth: 0,
  '& > *': { minWidth: 0, maxWidth: '100%' },
  '& .MuiTypography-root': { overflowWrap: 'anywhere', whiteSpace: 'normal' },
};

export const buttonSx = {
  minHeight: { xs: designTokens.touchHeight, lg: designTokens.controlHeight }, maxWidth: '100%', fontSize: designTokens.typography.control, lineHeight: 1.5,
  whiteSpace: 'normal', overflowWrap: 'anywhere', borderRadius: '8px',
  '&& .MuiButton-startIcon': { marginLeft: 0, marginRight: 0, marginInlineEnd: '8px' },
  '&& .MuiButton-endIcon': { marginLeft: 0, marginRight: 0, marginInlineStart: '8px' },
};
