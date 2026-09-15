// Local HR control geometry for the application's non-mirroring RTL cache.
export const hrTabIconSx = {
  '& .MuiTab-iconWrapper': {
    marginLeft: 0,
    marginRight: 0,
    marginInlineEnd: '8px',
  },
};

const toRemValue = (value) => {
  if (typeof value === 'number') return value + 'rem';
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([breakpoint, size]) => [breakpoint, toRemValue(size)])
    );
  }
  return value;
};

// Shared geometry for every Employee Files input. Label positioning is owned by
// the project-wide MUI theme so HR fields follow the same placeholder -> focus
// floating behaviour as the rest of the application.
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

    '& .MuiInputLabel-root': {
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontSize: toRemValue(label),
      fontWeight: 700,
    },

    '& .MuiInputBase-root': {
      minHeight: height,
      height: 'auto',
      marginTop: 0,
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

    '& .MuiSelect-select': {
      paddingRight: '14px',
      paddingLeft: '40px',
    },
    '& .MuiSelect-icon': {
      right: 'auto',
      left: '10px',
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
