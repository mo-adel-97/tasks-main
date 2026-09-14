import { designTokens } from './designTokens';

const type = designTokens.typography;
const text = (fontSize, fontWeight = 400) => ({ fontSize, lineHeight: 1.4, fontWeight });

// Semantic text rules intentionally outrank legacy sx font sizes. Icons, charts,
// media and print documents are not scaled. All sizes live in designTokens.
export const typographyStyles = {
  ':root body': text(type.body, 400),
  ':root body .MuiTypography-root': text(type.body, 400),
  ':root body h1, :root body .MuiTypography-h1, :root body .MuiTypography-h2': text(type.pageTitle, 600),
  ':root body h2, :root body h3, :root body h4, :root body h5, :root body h6, :root body .MuiTypography-h3, :root body .MuiTypography-h4, :root body .MuiTypography-h5, :root body .MuiTypography-h6, :root body .MuiDialogTitle-root': text(type.sectionTitle, 600),
  ':root body .MuiButton-root, :root body .MuiTab-root, :root body .MuiInputBase-root, :root body .MuiInputBase-root .MuiInputBase-input': text(type.control, 500),
  ':root body .MuiInputLabel-root, :root body .MuiFormLabel-root, :root body .MuiFormControlLabel-label, :root body .MuiMenuItem-root, :root body .MuiBreadcrumbs-root, :root body .MuiBreadcrumbs-root .MuiTypography-root': text(type.label, 500),
  ':root body .MuiTableCell-root, :root body .MuiTableCell-root .MuiTypography-root, :root body .MuiDataGrid-cell, :root body .MuiDataGrid-columnHeaderTitle, :root body .MuiTablePagination-root, :root body .MuiTablePagination-root .MuiTypography-root': text(type.table, 400),
  ':root body .MuiListItemText-primary, :root body .MuiListItemText-primary .MuiTypography-root': text(type.label, 500),
  ':root body .MuiFormHelperText-root, :root body .MuiTypography-caption, :root body .MuiTypography-overline, :root body .MuiListItemText-secondary': text(type.helper, 400),
};
