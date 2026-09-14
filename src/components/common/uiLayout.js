// Opt-in presentation primitives. These never receive data, handlers or state.
// Keep the stock Emotion cache: no direction-transforming middleware is needed.
export const withUiSx = (original, ...additions) => [
  ...(Array.isArray(original) ? original : [original]), ...additions,
];

export const formFieldSx = {
  minWidth: 0,
  maxWidth: '100%',
  textAlign: 'start',
  '&& > .MuiInputLabel-root': {
    position: 'static', transform: 'none', maxWidth: '100%', width: 'auto',
    height: 'auto', minHeight: '24px', margin: '0 0 6px', padding: 0,
    whiteSpace: 'normal', overflow: 'visible', textAlign: 'start',
    fontSize: '0.875rem', fontWeight: 700, lineHeight: '24px',
    pointerEvents: 'auto',
  },
  '&& > .MuiInputBase-root': {
    marginTop: 0, minHeight: 44, height: 'auto', borderRadius: '10px',
    fontSize: '0.9375rem',
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
};

export const formGridSx = {
  display: 'grid', minWidth: 0, alignItems: 'start', gap: 2,
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))',
    lg: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))',
  },
  '& > *': { minWidth: 0, maxWidth: '100%' },
  '& > .MuiFormControl-root, & > .MuiAutocomplete-root': { width: '100%' },
  '@media (max-width: 599.95px)': { '& > *': { gridColumn: 'auto' } },
};

export const filterBarSx = {
  display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
  alignItems: 'flex-end', gap: 1.5, minWidth: 0,
  '& > .MuiFormControl-root, & > .MuiAutocomplete-root': {
    flex: '1 1 210px', minWidth: 0, width: { xs: '100%', sm: 'auto' },
  },
  '& > .MuiButton-root': { minHeight: 44, flexShrink: 0 },
  '@media (max-width: 599.95px)': {
    '& > .MuiFormControl-root, & > .MuiAutocomplete-root': { flexBasis: '100%' },
    '& > .MuiButton-root': { flex: '1 1 130px' },
  },
};

export const actionBarSx = {
  display: 'flex', flexWrap: 'wrap', gap: 1.25, minWidth: 0,
  alignItems: 'center',
  '& > .MuiButton-root': { flexShrink: 0, minHeight: 44 },
};

export const checkboxFieldSx = {
  alignSelf: 'start', minHeight: 44, margin: 0, paddingInline: 0,
  paddingBlock: 0, border: 0, background: 'transparent',
  marginTop: { xs: 0, sm: '30px' },
  '& .MuiFormControlLabel-label': { fontSize: '0.875rem', lineHeight: 1.6 },
};

export const dialogLayoutSx = {
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
  flexWrap: 'wrap', gap: 1.25, padding: '16px 24px',
  '&& > :not(style) ~ :not(style)': { margin: 0 },
  '& > .MuiButton-root': { minHeight: 44 },
  '@media (max-width: 599.95px)': { padding: '12px 16px', '& > .MuiButton-root': { flex: '1 1 auto' } },
};

export const tableContainerSx = {
  minWidth: 0, maxWidth: '100%', overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

export const tablePaginationSx = {
  '&& .MuiTablePagination-toolbar': { flexWrap: 'wrap', gap: 1, paddingInline: 1 },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { marginBlock: 1 },
  '& .MuiTablePagination-actions': { marginInlineStart: 1, marginLeft: 0 },
};

export const dataGridSx = {
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
  flexWrap: 'wrap', gap: 1.25, minWidth: 0,
  '&& .MuiFormControlLabel-root': { margin: 0 },
  '&& .MuiFormControlLabel-label': { fontSize: '0.875rem', lineHeight: 1.6 },
};

export const pageHeaderSx = {
  flexWrap: 'wrap', gap: 2, minWidth: 0,
  '& > *': { minWidth: 0, maxWidth: '100%' },
};

export const buttonSx = {
  minHeight: 40, maxWidth: '100%', fontSize: '0.875rem', lineHeight: 1.6,
  whiteSpace: 'normal', borderRadius: '8px',
  '&& .MuiButton-startIcon': { marginLeft: 0, marginRight: 0, marginInlineEnd: '8px' },
  '&& .MuiButton-endIcon': { marginLeft: 0, marginRight: 0, marginInlineStart: '8px' },
};
