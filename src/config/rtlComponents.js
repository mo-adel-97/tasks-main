// Shared MUI geometry for the non-mirroring cache. Logical spacing follows the
// element's direction; physical anchors are set deliberately, never mirrored.
import { designTokens, mobileHeaderStyles } from './designTokens';
import { DESKTOP_BREAKPOINT } from './sidebarLayout';
const labelPosition = ({ ownerState }) => {
  if (!ownerState.formControl) return { textAlign: 'start' };
  return {
    position: 'static', transform: 'none', width: 'auto', maxWidth: '100%',
    minHeight: 17, marginBottom: 3, padding: 0,
    fontSize: designTokens.typography.label, lineHeight: '17px', fontWeight: 500,
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
          '&& .MuiTab-root': { flex: '1 1 110px', minWidth: 0, maxWidth: '100%', minHeight: 40 },
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root.Mui-selected': { boxShadow: 'inset 0 -2px currentColor', borderRadius: '6px' },
        },
      } : {}),
    }),
    flexContainer: { gap: '4px' },
  } },
  MuiTab: { styleOverrides: {
    root: { minHeight: 36, padding: '5px 8px', fontSize: designTokens.typography.label, lineHeight: 1.25, fontWeight: 500 },
    iconWrapper: { marginLeft: 0, marginRight: 0, marginInlineEnd: '4px' },
  } },
  MuiStack: { defaultProps: { useFlexGap: true } },
  MuiToolbar: { styleOverrides: { root: {
    '@media (min-width: 1200px)': { minHeight: '44px' },
  } } },
  MuiIconButton: { styleOverrides: { root: { padding: 5 } } },
  MuiButton: { styleOverrides: {
    root: { maxWidth: '100%', minHeight: designTokens.controlHeight, paddingInline: '10px', whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.35, fontWeight: 500 },
    startIcon: ({ ownerState }) => ({ marginLeft: 0, marginRight: 0,
      marginInlineStart: ownerState.size === 'small' ? -2 : -4, marginInlineEnd: 8 }),
    endIcon: ({ ownerState }) => ({ marginLeft: 0, marginRight: 0,
      marginInlineStart: 8, marginInlineEnd: ownerState.size === 'small' ? -2 : -4 }),
  } },
  MuiCardContent: { styleOverrides: { root: {
    padding: designTokens.cardPadding,
    '&:last-child': { paddingBottom: designTokens.cardPadding },
  } } },
  MuiCard: { styleOverrides: { root: {
    borderRadius: `${designTokens.radius}px`,
  } } },
  MuiDialogTitle: { styleOverrides: { root: { padding: '9px 14px', fontSize: designTokens.typography.sectionTitle, fontWeight: 600 } } },
  MuiDialogContent: { styleOverrides: { root: { padding: '10px 14px' } } },
  MuiDialogActions: { styleOverrides: { root: { padding: '8px 14px', gap: 6 } } },
  MuiChip: { styleOverrides: { root: { height: 24, fontSize: designTokens.typography.helper, fontWeight: 500 }, label: { paddingInline: 7 } } },
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
    padding: '8px 14px', gap: 6,
    '& > :not(style) ~ :not(style)': { marginLeft: 0, marginInlineStart: 6 },
  } } },
  MuiListItem: { styleOverrides: { root: { textAlign: 'start' } } },
  MuiListItemButton: { styleOverrides: { root: { textAlign: 'start' } } },
  MuiMenuItem: { styleOverrides: { root: { textAlign: 'start' } } },
  MuiTableCell: { defaultProps: { align: 'inherit' }, styleOverrides: {
    root: ({ ownerState }) => ({
      padding: '5px 7px', fontSize: designTokens.typography.table, lineHeight: 1.3,
      ...(ownerState.align === 'inherit' ? { textAlign: 'start' } : {}),
    }),
    head: { fontWeight: 600 },
  } },
  MuiAlert: { styleOverrides: {
    icon: { marginRight: 0, marginInlineEnd: 12 },
    action: { marginLeft: 0, marginRight: 0, marginInlineStart: 'auto', marginInlineEnd: -8,
      paddingLeft: 0, paddingInlineStart: 16 },
  } },
  MuiInputBase: { styleOverrides: {
    root: { minHeight: { xs: 44, lg: designTokens.controlHeight }, fontSize: designTokens.typography.control },
    input: { paddingBlock: { xs: '9px', lg: '4px' }, lineHeight: { xs: '22px', lg: '18px' } },
  } },
  MuiCardHeader: { styleOverrides: { root: { padding: '8px 10px' }, title: { fontSize: designTokens.typography.sectionTitle, fontWeight: 600 }, subheader: { fontSize: designTokens.typography.helper } } },
  MuiCardActions: { styleOverrides: { root: { padding: '6px 10px', gap: 6 } } },
};
