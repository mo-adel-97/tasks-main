// Local HR control geometry for the application's non-mirroring RTL cache.
export const hrTabIconSx = {
  '& .MuiTab-iconWrapper': {
    marginLeft: 0,
    marginRight: 0,
    marginInlineEnd: '8px',
  },
};

// Employee Files field geometry.
//
// Arabic Employee Files forms use external labels above the control instead of
// MUI's outlined floating-label geometry. Keeping the label in normal document
// flow removes the RTL notch collision and gives every label a predictable
// vertical space regardless of the control height or Arabic font metrics.
const toRemValue = (value) => {
  if (typeof value === 'number') return value + 'rem';
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([breakpoint, size]) => [breakpoint, toRemValue(size)])
    );
  }
  return value;
};

// Shared geometry for every Employee Files input (page filters and dialogs).
export const hrEmployeeFieldSx = ({
  height = 42,
  inputSize = 0.78,
  labelSize = null,
  radius = 2,
} = {}) => {
  const label = labelSize === null || labelSize === undefined ? inputSize : labelSize;

  return {
    direction: 'rtl',
    textAlign: 'right',

    '& .MuiFormControl-root': {
      direction: 'rtl',
      textAlign: 'right',
      minWidth: 0,
      maxWidth: '100%',
    },

    // Force the Arabic label into its own row above the field. !important is
    // intentional because a few legacy fields still opt into uiLayout.formFieldSx,
    // which otherwise absolutely positions the label on the outlined border.
    '& .MuiInputLabel-root': {
      position: 'static !important',
      inset: 'auto !important',
      transform: 'none !important',
      transformOrigin: 'top right !important',
      display: 'block',
      width: '100% !important',
      maxWidth: '100% !important',
      height: 'auto !important',
      minHeight: 0,
      margin: '0 0 6px 0 !important',
      padding: '0 !important',
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'clip',
      direction: 'rtl',
      textAlign: 'right !important',
      lineHeight: 1.45,
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontSize: toRemValue(label),
      fontWeight: 800,
      zIndex: 1,
    },

    '& .MuiInputLabel-root.Mui-focused': {
      color: '#057546',
    },

    '& .MuiInputBase-root': {
      minHeight: height,
      height: 'auto',
      marginTop: '0 !important',
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontSize: toRemValue(inputSize),
      borderRadius: radius,
      direction: 'rtl',
      textAlign: 'right',
      backgroundColor: '#fff',
    },

    '& .MuiInputBase-input, & .MuiSelect-select, & textarea': {
      direction: 'rtl',
      textAlign: 'right',
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
    },

    // The label is rendered above the field, so the outline no longer needs a
    // notch reserved for a floating label.
    '& .MuiOutlinedInput-notchedOutline legend': {
      maxWidth: '0 !important',
    },
    '& .MuiOutlinedInput-notchedOutline legend > span': {
      display: 'none !important',
    },

    '& .MuiSelect-select': {
      paddingRight: '14px !important',
      paddingLeft: '40px !important',
    },
    '& .MuiSelect-icon': {
      right: 'auto !important',
      left: '10px !important',
    },

    '& .MuiFormHelperText-root': {
      direction: 'rtl',
      textAlign: 'right',
      marginLeft: 0,
      marginRight: 0,
      marginTop: '5px',
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
    },
  };
};

export const hrChipSx = (size = 'medium') => {
  const small = size === 'small';
  return {
    '& .MuiChip-icon, & .MuiChip-avatar': {
      marginLeft: 0,
      marginRight: 0,
      marginInlineStart: small ? '4px' : '5px',
      marginInlineEnd: small ? '-4px' : '-6px',
    },
    '& .MuiChip-deleteIcon': {
      marginLeft: 0,
      marginRight: 0,
      marginInlineStart: small ? '-4px' : '-6px',
      marginInlineEnd: small ? '4px' : '5px',
    },
  };
};
