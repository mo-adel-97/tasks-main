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
// The shared RTL theme keeps MUI's stock floating-label offsets, which are
// measured for the default 16px label inside a default-height control. The
// employee page and its dialogs render smaller Arabic fonts, so the placeholder
// label is re-centred against the height the control really has. The floated
// (shrunk) state is intentionally left to the theme so it keeps sitting on the
// outline instead of drifting over the input.
const FORM_LABEL_LINE_HEIGHT = 1.4375; // MUI InputLabel line-height
const PX_PER_REM = 16;

const toRemValue = (value) => {
  if (typeof value === 'number') return value + 'rem';
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([breakpoint, size]) => [breakpoint, toRemValue(size)]));
  }
  return value;
};
const toRemNumber = (value) => {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const isResponsive = (value) => value !== null && typeof value === 'object';

// Vertical offset that centres the label inside the control it belongs to.
export const hrFieldLabelOffset = (height, labelSize) =>
  Math.round(((height - FORM_LABEL_LINE_HEIGHT * toRemNumber(labelSize) * PX_PER_REM) / 2) * 100) / 100;

const placeholderTransform = (height, labelSize) =>
  'translate(-14px, ' + hrFieldLabelOffset(height, labelSize) + 'px) scale(1)';

// Shared geometry for every Employee Files input (page filters and dialogs).
export const hrEmployeeFieldSx = ({ height = 42, inputSize = 0.78, labelSize = null, radius = 2 } = {}) => {
  const label = labelSize === null || labelSize === undefined ? inputSize : labelSize;
  const transform = isResponsive(height) || isResponsive(label)
    ? (isResponsive(height) ? Object.keys(height) : Object.keys(label)).reduce((acc, key) => Object.assign(acc, {
      [key]: placeholderTransform(isResponsive(height) ? height[key] : height, isResponsive(label) ? label[key] : label),
    }), {})
    : placeholderTransform(height, label);

  return {
    '& .MuiInputBase-root': {
      minHeight: height,
      height: 'auto',
      fontFamily: 'Cairo',
      fontSize: toRemValue(inputSize),
      borderRadius: radius,
    },
    '& .MuiInputLabel-root': {
      fontFamily: 'Cairo',
      fontSize: toRemValue(label),
    },
    '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { transform },
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
