// Shared MUI geometry for the non-mirroring cache. Logical spacing follows the
// element's direction; physical anchors are set deliberately, never mirrored.
import { designTokens, mobileHeaderStyles } from './designTokens';
import { DESKTOP_BREAKPOINT } from './sidebarLayout';
const labelPosition = ({ ownerState }) => {
  if (!ownerState.formControl) return { textAlign: 'start' };
  return {
    position: 'static', transform: 'none', width: 'auto', maxWidth: '100%',
    minHeight: 20, marginBottom: 4, padding: 0,
    fontSize: '0.8125rem', lineHeight: '20px', fontWeight: 700,
    whiteSpace: 'normal', overflow: 'visible', overflowWrap: 'anywhere', textAlign: 'start', pointerEvents: 'auto',
  };
};

export const rtlComponents = {
  MuiDataGrid: { defaultProps: { density: "compact" } },
  MuiAppBar: { styleOverrides: { root: ({ ownerState }) =>
    ['fixed', 'sticky'].includes(ownerState.position) ? {
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        '&&': { ...mobileHeaderStyles, width: '100%', right: 0, left: 0, marginInline: 0 },
      },
    } : {},
  } },
  MuiTabs: { styleOverrides: {
    root: ({ ownerState }) => ({ minWidth: 0, maxWidth: '100%',
      ...(ownerState.orientation !== 'vertical' && ownerState.variant !== 'scrollable' ? {
        '@media (max-width: 599.95px)': {
          '&& .MuiTabs-flexContainer': { flexWrap: 'wrap', gap: '4px' },
          '&& .MuiTab-root': { flex: '1 1 130px', minWidth: 0, maxWidth: '100%', minHeight: 44 },
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root.Mui-selected': { boxShadow: 'inset 0 -2px currentColor', borderRadius: '6px' },
        },
      } : {}),
    }),
    flexContainer: { gap: '4px' },
  } },
  MuiTab: { styleOverrides: {
    root: { minHeight: 44, padding: '10px 14px', fontSize: '0.8125rem', lineHeight: 1.5 },
    iconWrapper: { marginLeft: 0, marginRight: 0, marginInlineEnd: '6px' },
  } },
  MuiStack: { defaultProps: { useFlexGap: true } },
  MuiButton: { styleOverrides: {
    root: { maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.5 },
    startIcon: ({ ownerState }) => ({ marginLeft: 0, marginRight: 0,
      marginInlineStart: ownerState.size === 'small' ? -2 : -4, marginInlineEnd: 8 }),
    endIcon: ({ ownerState }) => ({ marginLeft: 0, marginRight: 0,
      marginInlineStart: 8, marginInlineEnd: ownerState.size === 'small' ? -2 : -4 }),
  } },
  MuiCardContent: { styleOverrides: { root: {
    padding: designTokens.cardPadding,
    '&:last-child': { paddingBottom: designTokens.cardPadding },
  } } },
  MuiInputAdornment: { styleOverrides: { root: ({ ownerState }) => ({
    marginLeft: 0, marginRight: 0,
    marginInlineStart: ownerState.position === 'end' ? 8 : 0,
    marginInlineEnd: ownerState.position === 'start' ? 8 : 0,
  }) } },
  MuiOutlinedInput: { defaultProps: { notched: false }, styleOverrides: {
    root: ({ ownerState }) => {
      // Autocomplete manages its own control gutter, including the compact size.
      if (ownerState.className?.includes('MuiAutocomplete-inputRoot')) {
        return { paddingRight: ownerState.size === 'small' ? 6 : 9 };
      }
      if (ownerState.multiline) return {};
      return { paddingRight: ownerState.startAdornment ? 14 : 0,
        paddingLeft: ownerState.endAdornment ? 14 : 0 };
    },
    input: ({ ownerState }) => ownerState.multiline || ownerState.className?.includes('MuiAutocomplete-inputRoot') ? {} : {
      // The Arabic field shell owns icon placement even when its value is LTR.
      paddingRight: ownerState.startAdornment ? 0 : 14,
      paddingLeft: ownerState.endAdornment ? 0 : 14,
    },
  } },
  MuiInputLabel: { defaultProps: { shrink: true }, styleOverrides: { root: labelPosition } },
  MuiFormHelperText: { styleOverrides: { root: { textAlign: 'start' } } },
  MuiFormControlLabel: { styleOverrides: { root: ({ ownerState }) => ({
    marginLeft: 0, marginRight: 0,
    marginInlineStart: ['start', 'top', 'bottom'].includes(ownerState.labelPlacement) ? 16 : -11,
    marginInlineEnd: ownerState.labelPlacement === 'start' ? -11 : 16,
  }) } },
  MuiSelect: { styleOverrides: {
    icon: ({ ownerState }) => ({ right: 'auto', left: ownerState.variant === 'standard' ? 0 : 7 }),
    select: ({ ownerState }) => ({ '&&': {
      paddingRight: ownerState.variant === 'standard' ? 0 : ownerState.variant === 'filled' ? 12 : 14,
      paddingLeft: ownerState.variant === 'standard' ? 24 : 32,
      textAlign: 'start', whiteSpace: 'normal', overflowWrap: 'anywhere',
    } }),
  } },
  MuiAutocomplete: { styleOverrides: {
    endAdornment: { right: 'auto' },
    root: ({ ownerState }) => {
      const icons = (ownerState.hasClearIcon ? 26 : 0) + (ownerState.hasPopupIcon ? 26 : 0);
      const space = icons ? icons + 4 : 0;
      return {
        '&& .MuiAutocomplete-inputRoot': { paddingRight: 0, paddingLeft: space },
        '& .MuiInput-root .MuiAutocomplete-endAdornment': { left: 0 },
        '&& .MuiOutlinedInput-root': {
          paddingRight: ownerState.size === 'small' ? 6 : 9, paddingLeft: space + 9,
          '& .MuiAutocomplete-endAdornment': { right: 'auto', left: 9 },
          '& .MuiAutocomplete-input': { paddingLeft: 4, paddingRight: ownerState.size === 'small' ? 8 : 5 },
        },
        '&& .MuiFilledInput-root': { paddingRight: 8, paddingLeft: space + 9,
          '& .MuiAutocomplete-endAdornment': { right: 'auto', left: 9 } },
      };
    },
  } },
  MuiDialogActions: { styleOverrides: { root: ({ ownerState }) => ownerState.disableSpacing ? {} : {
    '& > :not(style) ~ :not(style)': { marginLeft: 0, marginInlineStart: 8 },
  } } },
  MuiListItem: { styleOverrides: { root: { textAlign: 'start' } } },
  MuiListItemButton: { styleOverrides: { root: { textAlign: 'start' } } },
  MuiMenuItem: { styleOverrides: { root: { textAlign: 'start' } } },
  MuiTableCell: { defaultProps: { align: 'inherit' }, styleOverrides: {
    root: ({ ownerState }) => ownerState.align === 'inherit' ? { textAlign: 'start' } : {},
  } },
  MuiAlert: { styleOverrides: {
    icon: { marginRight: 0, marginInlineEnd: 12 },
    action: { marginLeft: 0, marginRight: 0, marginInlineStart: 'auto', marginInlineEnd: -8,
      paddingLeft: 0, paddingInlineStart: 16 },
  } },
};
