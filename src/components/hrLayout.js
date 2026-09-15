// Explicitly opted-in HR presentation contract; no theme or global selectors.
import * as common from './common/uiLayout';
export * from './common/uiLayout';

export const hrTokens = Object.freeze({ title: 22, section: 17, control: 13, table: 13, gap: 1, desktopControl: 36 });
// The application's :root body typography rules outrank ordinary sx. Increase
// specificity only on opted-in HR surfaces, including their portalled dialogs.
export const scopeSx = {
  '&&& .MuiTypography-root, &&& .MuiTab-root, &&& .MuiButton-root, &&& .MuiInputBase-root, &&& .MuiInputBase-input, &&& .MuiInputLabel-root, &&& .MuiFormControlLabel-label, &&& .MuiTableCell-root': { fontSize: hrTokens.control, lineHeight: 1.45 },
  '&&& h1, &&& .hr-page-title': { fontSize: { xs: 20, lg: hrTokens.title }, fontWeight: 700 },
  '&&& h2, &&& h3, &&& .MuiDialogTitle-root': { fontSize: hrTokens.section, fontWeight: 700 },
};
export const pageSx = { width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', p: { xs: 1, sm: 1.25, lg: 1.5 } };
export const filterColumns = {
  xs: 'minmax(0,1fr)',
  sm: 'repeat(2,minmax(0,1fr))',
  lg: 'repeat(auto-fit,minmax(140px,1fr))',
};
export const formSectionSx = {
  ...common.formSectionSx,
  '@media (max-width:599.95px)': {
    gridTemplateColumns: 'minmax(0,1fr)',
    '& > *': { gridColumn: 'auto', minWidth: 0, maxWidth: '100%' },
  },
};
export const formFieldSx = {
  ...common.formFieldSx,
  '&& > .MuiInputLabel-root': { ...common.formFieldSx['&& > .MuiInputLabel-root'], fontSize: hrTokens.control },
  '&& > .MuiInputBase-root': { ...common.formFieldSx['&& > .MuiInputBase-root'], fontSize: hrTokens.control, minHeight: { xs: 44, lg: hrTokens.desktopControl } },
};
export const buttonSx = { ...common.buttonSx, fontSize: hrTokens.control, minHeight: { xs: 44, lg: hrTokens.desktopControl }, px: 1 };
export const filterBarSx = {
  ...common.filterBarSx,
  '& > .MuiFormControl-root, & > .MuiAutocomplete-root': { flex: '1 1 150px', minWidth: 0, width: { xs: '100%', sm: 'auto' } },
};
export const tableContainerSx = {
  ...common.tableContainerSx,
  '& .MuiTableCell-root': { fontSize: hrTokens.table, px: 1, py: .75, overflowWrap: 'anywhere' },
};
export const dataGridSx = {
  ...common.dataGridSx,
  fontSize: hrTokens.table,
  '&& .MuiDataGrid-cell, && .MuiDataGrid-columnHeaderTitle': { fontSize: hrTokens.table, paddingInline: '6px' },
};
export const dialogLayoutSx = {
  ...common.dialogLayoutSx,
  ...scopeSx,
  '& .MuiDialog-paper:not(.MuiDialog-paperFullScreen)': {
    ...common.dialogLayoutSx['& .MuiDialog-paper:not(.MuiDialog-paperFullScreen)'],
    minWidth: 0, maxWidth: 'calc(100% - 24px)',
  },
  '& .MuiDialogTitle-root': { ...common.dialogLayoutSx['& .MuiDialogTitle-root'], fontSize: hrTokens.section },
  '& .MuiDialogContent-root': { ...common.dialogLayoutSx['& .MuiDialogContent-root'], overflowX: 'auto' },
};
export const dialogActionsSx = { ...common.dialogActionsSx, '& > .MuiButton-root': { minHeight: { xs: 44, lg: hrTokens.desktopControl }, fontSize: hrTokens.control } };
export const attendanceRowSx = {
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))', lg: 'minmax(155px,1.5fr) repeat(5,minmax(0,1fr)) minmax(130px,1.15fr)' },
  gap: 1, alignItems: 'center', minWidth: 0,
  '& > *': { minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' },
};
