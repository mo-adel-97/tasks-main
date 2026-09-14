// One responsive navigation contract for the whole application.
// Pages must never calculate their own sidebar gutter.
export const SIDEBAR_WIDTH = 'clamp(13rem, 17vw, 17rem)';
export const SIDEBAR_COLLAPSED_WIDTH = 86;

// >= 1200px: permanent sidebar (desktop/laptop)
// < 1200px: off-canvas drawer (tablet/mobile) and content uses the full width.
// This intentionally does not assume a 1600px+ screen.
export const DESKTOP_BREAKPOINT = 1200;
export const SIDEBAR_DESKTOP_QUERY = `(min-width:${DESKTOP_BREAKPOINT}px)`;

// Drawer is fluid and capped, so it works on small phones through tablets.
export const SIDEBAR_MOBILE_WIDTH = {
  xs: 'min(86vw, 312px)',
  sm: 'min(72vw, 320px)',
  md: 'min(42vw, 336px)',
};
export const SIDEBAR_MOBILE_MAX_WIDTH = 'calc(100vw - 40px)';

export const getSidebarOffset = (variant, isDesktop, collapsed = false) => {
  if (!isDesktop) return 0;
  if (variant === 'admin') {
    return collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  }
  return SIDEBAR_WIDTH;
};

// Kept for backwards compatibility with existing screens. The actual gutter is
// now owned by NavigationShell, so page components no longer calculate widths.
export const navigationContentSx = {
  direction: 'var(--navigation-direction, rtl)',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  marginInlineStart: 0,
  marginInlineEnd: 0,
  boxSizing: 'border-box',
};

export const navigationContentStyle = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  marginRight: 0,
  marginLeft: 0,
  boxSizing: 'border-box',
};

// Physical placement is an inline style, outside Emotion's RTL transform.
export const sidebarPositionStyle = { right: 0, left: 'auto', direction: 'rtl' };
