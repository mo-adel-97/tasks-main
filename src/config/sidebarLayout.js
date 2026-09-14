// Shared dimensions for the sidebar renderer and page layouts.
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 86;
export const DESKTOP_BREAKPOINT = 1600;
export const SIDEBAR_DESKTOP_QUERY = '(min-width:' + DESKTOP_BREAKPOINT + 'px)';
export const SIDEBAR_MOBILE_WIDTH = { xs: 220, sm: 236, md: 248 };
export const SIDEBAR_MOBILE_MAX_WIDTH = '74vw';

export const getSidebarOffset = (variant, isDesktop, collapsed = false) =>
  variant === 'admin'
    ? (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH)
    : (isDesktop ? SIDEBAR_WIDTH : 0);

const offset = 'var(--navigation-content-offset, 0px)';
const contentWidth = 'calc(100% - ' + offset + ')';

// The RTL plugin reverses a literal direction:rtl in sx. A CSS variable
// keeps logical margins anchored to true RTL without changing global styles.
export const navigationContentSx = {
  direction: 'var(--navigation-direction, rtl)',
  marginInlineStart: offset,
  marginInlineEnd: 0,
  width: contentWidth,
  minWidth: 0,
  boxSizing: 'border-box',
};

// Inline styles bypass Emotion: right means physical right.
export const navigationContentStyle = {
  marginRight: offset,
  marginLeft: 0,
  width: contentWidth,
  minWidth: 0,
  boxSizing: 'border-box',
};

// Physical placement is an inline style, outside the RTL CSS transform.
export const sidebarPositionStyle = { right: 0, left: 'auto', direction: 'rtl' };
