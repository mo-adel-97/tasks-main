// Shared MUI geometry for the non-mirroring cache. Logical spacing follows the
// element's direction; physical anchors are set deliberately, never mirrored.
import { designTokens, mobileHeaderStyles, fluid } from './designTokens';
import { DESKTOP_BREAKPOINT } from './sidebarLayout';
import { pinColor } from './themeColors';

// Labels behave like placeholders while a field is empty, then float to the
// physical left edge on focus / when the field contains a value. This keeps the
// Arabic UI compact without losing the field name after typing.
const labelPosition = ({ ownerState, theme }) => {
  if (!ownerState.formControl) return { textAlign: 'start' };

  const shrink = Boolean(ownerState.shrink);

  return {
    position: 'absolute',
    top: shrink ? 0 : '50%',
    left: shrink ? 12 : 'auto',
    right: shrink ? 'auto' : 14,
    width: 'auto',
    maxWidth: 'calc(100% - 28px)',
    minHeight: 0,
    margin: 0,
    paddingInline: shrink ? 4 : 0,
    backgroundColor: shrink ? theme.palette.background.paper : 'transparent',
    fontSize: designTokens.typography.label,
    lineHeight: shrink ? 1 : 1.35,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: shrink ? 'left' : 'right',
    transformOrigin: shrink ? 'top left' : 'top right',
    transform: shrink
      ? 'translateY(-50%) scale(0.82)'
      : 'translateY(-50%) scale(1)',
    zIndex: 1,
    pointerEvents: 'none',
    transition: theme.transitions.create(
      ['color', 'transform', 'top', 'left', 'right', 'font-size'],
      { duration: theme.transitions.duration.shorter }
    ),
  };
};

export const rtlComponents = {
  // MUI's default icon sizes (24/20/35px) never grew on large screens, unlike
  // the sidebar's own icon tokens. Grow them moderately too, app-wide.
  MuiSvgIcon: { styleOverrides: {
    fontSizeSmall: { fontSize: fluid(20, 22) },
    fontSizeMedium: { fontSize: fluid(24, 28) },
    fontSizeLarge: { fontSize: fluid(35, 40) },
  } },
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
    // Dark mode's primary.main ('#80c9a7') is bright enough that the shared
    // dark-color plugin treats it as an unconverted *light-mode* background
    // and auto-darkens it again -- turning every default "contained" button
    // (this app never overrides Button color, so it's always primary) into a
    // muddy off-hue plum instead of the intended solid mint-green fill.
    // Pinning it here, once, fixes every such button app-wide instead of
    // requiring every call site to work around it individually.
    containedPrimary: ({ theme }) => (theme.palette.mode === 'dark' ? {
      backgroundColor: pinColor(theme.palette.primary.main),
    } : {}),
    // "outlined" border colors go through the dark-color plugin's generic
    // border branch, which only recognizes brand green as "already fine" --
    // every non-green severity color (error/warning/info/success) falls
    // through to a flat muddy gray instead, so e.g. an outlined error button
    // loses its red border entirely in dark mode. Give each severity the
    // same bright, on-brand-saturation border used for Alerts everywhere else.
    outlinedError: ({ theme }) => (theme.palette.mode === 'dark' ? {
      borderColor: pinColor('rgba(229,90,90,.5)'), color: '#e57373',
    } : {}),
    outlinedWarning: ({ theme }) => (theme.palette.mode === 'dark' ? {
      borderColor: pinColor('rgba(237,137,54,.5)'), color: '#f0ad4e',
    } : {}),
    outlinedInfo: ({ theme }) => (theme.palette.mode === 'dark' ? {
      borderColor: pinColor('rgba(90,160,229,.5)'), color: '#78bdf5',
    } : {}),
    outlinedSuccess: ({ theme }) => (theme.palette.mode === 'dark' ? {
      borderColor: theme.palette.borders.accent, color: theme.palette.primary.main,
    } : {}),
  } },
  // Same root cause as MuiButton's containedPrimary above: the moving bar
  // paints with theme.palette.primary.main as a literal background, so it
  // gets the same unwanted re-darkening (the track itself already uses
  // darken(primary.main, 0.5) in dark mode, which lands under the plugin's
  // brightness threshold on its own and needs no help here).
  MuiLinearProgress: { styleOverrides: {
    barColorPrimary: ({ theme }) => (theme.palette.mode === 'dark' ? {
      backgroundColor: pinColor(theme.palette.primary.main),
    } : {}),
  } },
  MuiCardContent: { styleOverrides: { root: {
    padding: designTokens.cardPadding,
    '&:last-child': { paddingBottom: designTokens.cardPadding },
  } } },
  // Every card/container/grid across the app shares one fixed, always-visible
  // focus-green border (#67C99D) in dark mode, matching the Home page — not a
  // low-alpha token, so it reads the same everywhere without depending on
  // hover/focus state.
  MuiCard: { styleOverrides: { root: ({ theme }) => ({
    borderRadius: `${designTokens.radius}px`,
    ...(theme.palette.mode === 'dark' ? { border: '1px solid #67C99D' } : {}),
  }) } },
  // TableContainer renders as a plain div by default (no Paper), so tables
  // otherwise have no visible boundary in the dark enterprise theme. Tables
  // sit at the "section" surface tier: a step above the page, a step below a
  // card's own background.
  MuiTableContainer: { styleOverrides: { root: ({ theme }) => (
    theme.palette.mode === 'dark'
      ? {
        border: '1px solid #67C99D',
        borderRadius: `${designTokens.radius}px`,
        backgroundColor: theme.palette.surfaces.section,
      }
      : {}
  ) } },
  // Dialogs are form containers and get the same fixed border: they are
  // almost always the most important surface on screen while open.
  MuiDialog: { styleOverrides: { paper: ({ theme }) => (
    theme.palette.mode === 'dark' ? { border: '1px solid #67C99D' } : {}
  ) } },
  // Dropdowns/menus/popovers (selects, autocomplete lists, notification
  // popovers) render on every page and previously had zero boundary against
  // the page in dark mode — a big part of the "everything is flat black" look.
  MuiPopover: { styleOverrides: { paper: ({ theme }) => (
    theme.palette.mode === 'dark'
      ? { border: '1px solid #67C99D', backgroundColor: theme.palette.surfaces.card }
      : {}
  ) } },
  MuiMenu: { styleOverrides: { paper: ({ theme }) => (
    theme.palette.mode === 'dark'
      ? { border: '1px solid #67C99D', backgroundColor: theme.palette.surfaces.card }
      : {}
  ) } },
  // A bare <Paper variant="outlined"> is the app's most common hand-rolled
  // "section" wrapper (HR pages use it constantly). Give it the same visible
  // dark-mode boundary as Card instead of relying only on the page's literal
  // border color surviving the auto dark-color transform.
  MuiPaper: { styleOverrides: { root: ({ theme, ownerState }) => (
    theme.palette.mode === 'dark' && ownerState.variant === 'outlined'
      ? { borderColor: '#67C99D', backgroundColor: theme.palette.surfaces.section }
      : {}
  ) } },
  // DataGrid ("الجريدات") gets the same fixed border on its shell, header,
  // cells and footer — it previously had no dark-mode boundary of its own,
  // the one container type left unstyled next to the green-bordered rest.
  MuiDataGrid: { defaultProps: { density: 'compact' }, styleOverrides: {
    root: ({ theme }) => (theme.palette.mode === 'dark' ? {
      border: '1px solid #67C99D',
      borderRadius: `${designTokens.radius}px`,
      backgroundColor: theme.palette.surfaces.section,
      '& .MuiDataGrid-columnHeaders': {
        borderBottom: '1px solid #67C99D',
        backgroundColor: theme.palette.surfaces.card,
      },
      '& .MuiDataGrid-cell': { borderBottom: '1px solid #67C99D' },
      '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #67C99D' },
      '& .MuiDataGrid-withBorderColor': { borderColor: '#67C99D' },
    } : {}),
  } },
  MuiDialogTitle: { styleOverrides: { root: { padding: '9px 14px', fontSize: designTokens.typography.sectionTitle, fontWeight: 600 } } },
  MuiDialogContent: { styleOverrides: { root: { padding: '10px 14px', overflowX: 'hidden' } } },
  MuiDialogActions: { styleOverrides: { root: { padding: '8px 14px', gap: 6 } } },
  MuiChip: { styleOverrides: { root: { height: 24, fontSize: designTokens.typography.helper, fontWeight: 500 }, label: { paddingInline: 7 } } },
  MuiInputAdornment: { styleOverrides: { root: ({ ownerState }) => ({
    marginLeft: 0, marginRight: 0,
    marginInlineStart: ownerState.position === 'end' ? 8 : 0,
    marginInlineEnd: ownerState.position === 'start' ? 8 : 0,
  }) } },
  MuiOutlinedInput: { styleOverrides: {
    root: ({ ownerState, theme }) => {
      const isDark = theme.palette.mode === 'dark';
      // Inputs sit one level "recessed" from their card/dialog in dark mode,
      // so a form reads as a coherent surface instead of same-tone boxes.
      const recessed = isDark ? { backgroundColor: theme.palette.surfaces.input } : {};
      // MUI's own unfocused/hover outline colors are neutral grays with no
      // relation to this app's brand green, so every text field on every
      // page looked like a plain, unstyled dark box. Give the outline the
      // same visible green ladder used everywhere else in dark mode instead.
      const darkBorders = isDark ? {
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#67C99D' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#67C99D' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#67C99D', borderWidth: '1.5px' },
      } : {};
      // Autocomplete manages its own control gutter, including the compact size.
      if (ownerState.className?.includes('MuiAutocomplete-inputRoot')) {
        return { ...recessed, ...darkBorders, paddingRight: ownerState.size === 'small' ? 6 : 9 };
      }
      if (ownerState.multiline) return { ...recessed, ...darkBorders };
      return { ...recessed, ...darkBorders, paddingRight: ownerState.startAdornment ? 14 : 0,
        paddingLeft: ownerState.endAdornment ? 14 : 0 };
    },
    input: ({ ownerState }) => ownerState.multiline || ownerState.className?.includes('MuiAutocomplete-inputRoot') ? {} : {
      // The Arabic field shell owns icon placement even when its value is LTR.
      paddingRight: ownerState.startAdornment ? 0 : 14,
      paddingLeft: ownerState.endAdornment ? 0 : 14,
    },
  } },
  MuiInputLabel: { styleOverrides: { root: labelPosition } },
  // Compatibility for legacy fields that still force InputLabelProps.shrink=true.
  // When such a field is empty and not focused, visually restore placeholder
  // behaviour; focus or a real value returns it to the floating left position.
  MuiFormControl: { styleOverrides: { root: ({ theme }) => ({
    '&:has(> .MuiOutlinedInput-root .MuiInputBase-input[value=""]):not(:has(.Mui-focused)):not(:has(input[type="date"], input[type="time"], input[type="datetime-local"])) > .MuiInputLabel-root.MuiInputLabel-shrink': {
      top: '50%',
      left: 'auto',
      right: 14,
      paddingInline: 0,
      backgroundColor: 'transparent',
      lineHeight: 1.35,
      textAlign: 'right',
      transformOrigin: 'top right',
      transform: 'translateY(-50%) scale(1)',
      color: theme.palette.text.secondary,
    },
    '&:has(> .MuiOutlinedInput-root .MuiInputBase-input[value=""]):not(:has(.Mui-focused)):not(:has(input[type="date"], input[type="time"], input[type="datetime-local"])) .MuiOutlinedInput-notchedOutline legend': {
      maxWidth: 0,
    },
  }) } },
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
  // MUI's built-in dark-mode "standard" Alert colors are a generic
  // darken()/lighten() of the stock Material severity color -- they render
  // as a near-black/brown box that clashes with this app's actual dark
  // surfaces + bright green-bordered design language (first noticed, then
  // fixed page-locally, on the HR home page). Doing it once here instead
  // gives every Alert on every page a tinted-dark background and a visible,
  // on-brand-saturation border matching the app's surfaces/borders system.
  MuiAlert: { styleOverrides: {
    icon: { marginRight: 0, marginInlineEnd: 12 },
    action: { marginLeft: 0, marginRight: 0, marginInlineStart: 'auto', marginInlineEnd: -8,
      paddingLeft: 0, paddingInlineStart: 16 },
    standardWarning: ({ theme }) => (theme.palette.mode === 'dark' ? {
      backgroundColor: 'rgba(237,137,54,.12)', border: `1px solid ${pinColor('rgba(237,137,54,.42)')}`,
      color: '#f0ad4e', '& .MuiAlert-icon': { color: '#f0ad4e' },
    } : {}),
    standardError: ({ theme }) => (theme.palette.mode === 'dark' ? {
      backgroundColor: 'rgba(229,90,90,.12)', border: `1px solid ${pinColor('rgba(229,90,90,.42)')}`,
      color: '#e57373', '& .MuiAlert-icon': { color: '#e57373' },
    } : {}),
    standardInfo: ({ theme }) => (theme.palette.mode === 'dark' ? {
      backgroundColor: 'rgba(90,160,229,.12)', border: `1px solid ${pinColor('rgba(90,160,229,.42)')}`,
      color: '#78bdf5', '& .MuiAlert-icon': { color: '#78bdf5' },
    } : {}),
    standardSuccess: ({ theme }) => (theme.palette.mode === 'dark' ? {
      backgroundColor: 'rgba(103,201,157,.12)', border: '1px solid #67C99D',
      color: theme.palette.primary.main, '& .MuiAlert-icon': { color: theme.palette.primary.main },
    } : {}),
  } },
  MuiInputBase: { styleOverrides: {
    root: { minHeight: { xs: 44, lg: designTokens.controlHeight }, fontSize: designTokens.typography.control },
    input: { paddingBlock: { xs: '9px', lg: '4px' }, lineHeight: { xs: '22px', lg: '18px' } },
  } },
  MuiCardHeader: { styleOverrides: { root: { padding: '8px 10px' }, title: { fontSize: designTokens.typography.sectionTitle, fontWeight: 600 }, subheader: { fontSize: designTokens.typography.helper } } },
  MuiCardActions: { styleOverrides: { root: { padding: '6px 10px', gap: 6 } } },
};
