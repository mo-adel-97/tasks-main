// One responsive navigation contract for the whole application.
// Pages must never calculate their own sidebar gutter.
import { fluid } from './designTokens';

// The 16rem ceiling stayed fixed all the way to 3440px, which is also why
// larger sidebar text (see designTokens.sidebar) had no extra room and would
// truncate sooner on ultra-wide. Let the ceiling itself grow modestly instead.
export const SIDEBAR_WIDTH = `clamp(12rem, 15vw, ${fluid(256, 288)})`;
export const SIDEBAR_COLLAPSED_WIDTH = 86;

// >= 1200px: permanent sidebar (desktop/laptop)
// < 1200px: off-canvas drawer (tablet/mobile) and content uses the full width.
// This intentionally does not assume a 1600px+ screen.
export const DESKTOP_BREAKPOINT = 1200;
export const SIDEBAR_DESKTOP_QUERY = `(min-width:${DESKTOP_BREAKPOINT}px)`;

// Drawer is fluid and capped, so it works on small phones through tablets.
export const SIDEBAR_MOBILE_WIDTH = {
  xs: 'min(86vw, 300px)',
  sm: 'min(72vw, 308px)',
  md: 'min(42vw, 324px)',
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
