import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMediaQuery } from '@mui/material';
import MobileHeader from './MobileHeader';
import { designTokens } from '../config/designTokens';
import Sidebar from './Sidebar';
import { getSidebarOffset, SIDEBAR_DESKTOP_QUERY } from '../config/sidebarLayout';

const NavigationContext = createContext(null);

/*
 * The single navigation/layout owner for the application.
 *
 * Responsibilities kept here (not in individual pages):
 * - permanent desktop/laptop sidebar gutter
 * - tablet/mobile off-canvas drawer
 * - content width and RTL physical offset
 * - fallback mobile menu trigger for screens that do not provide one yet
 * - nested screens sharing one sidebar renderer
 *
 * Existing page-level `navigationContentSx` calls are intentionally harmless:
 * the real offset is calculated only here.
 */
export default function NavigationShell({ children, variant = 'standard', ...sidebarProps }) {
  const parent = useContext(NavigationContext);
  const id = useId();
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_QUERY, { noSsr: true });
  const [collapsed, setCollapsed] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [overrides, setOverrides] = useState(() => new Map());

  const register = useCallback((key, nextVariant) => {
    setOverrides((previous) => new Map(previous).set(key, nextVariant));
    return () => setOverrides((previous) => {
      const next = new Map(previous);
      next.delete(key);
      return next;
    });
  }, []);

  const parentRegister = parent?.register;
  const closeRef = useRef(sidebarProps.onMobileClose);
  closeRef.current = sidebarProps.onMobileClose;
  const closeNested = useCallback(() => closeRef.current?.(), []);

  useEffect(() => {
    if (parentRegister) {
      return parentRegister(id, {
        variant,
        mobileOpen: sidebarProps.mobileOpen,
        onMobileClose: closeNested,
      });
    }
    return undefined;
  }, [parentRegister, id, variant, sidebarProps.mobileOpen, closeNested]);

  // A resize must never leave a stale drawer open behind a permanent sidebar.
  useEffect(() => {
    if (isDesktop) setInternalMobileOpen(false);
  }, [isDesktop]);

  const nestedScreens = Array.from(overrides.values());
  const activeVariant = nestedScreens.at(-1)?.variant || variant;
  const hasControlledMobileState = typeof sidebarProps.mobileOpen === 'boolean';
  const nestedHasControlledMobileState = nestedScreens.some(
    (screen) => typeof screen.mobileOpen === 'boolean'
  );
  const shellOwnsMobileTrigger =
    !isDesktop && !hasControlledMobileState && !nestedHasControlledMobileState;
  const ownMobileOpen = hasControlledMobileState
    ? Boolean(sidebarProps.mobileOpen)
    : internalMobileOpen;
  const mobileOpen = Boolean(
    ownMobileOpen || nestedScreens.some((screen) => screen.mobileOpen)
  );

  const closeMobile = () => {
    setInternalMobileOpen(false);
    sidebarProps.onMobileClose?.();
    nestedScreens.forEach((screen) => screen.onMobileClose?.());
  };

  const context = useMemo(() => ({ register }), [register]);
  const offset = parent ? 0 : getSidebarOffset(activeVariant, isDesktop, collapsed);

  if (parent) {
    return <NavigationContext.Provider value={parent}>{children}</NavigationContext.Provider>;
  }

  return (
    <NavigationContext.Provider value={context}>
      <div
        dir="rtl"
        className="sstli-navigation-shell"
        style={{
          direction: 'rtl',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          minHeight: '100dvh',
          '--navigation-direction': 'rtl',
          '--navigation-content-offset': `${offset}px`,
          '--app-header-height': `${designTokens.headerHeight}px`,
        }}
      >
        <Sidebar
          {...sidebarProps}
          variant={activeVariant}
          mobileOpen={mobileOpen}
          onMobileClose={closeMobile}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />

        {/*
          Older screens already have a page-header menu button and pass a
          controlled mobileOpen prop. New/legacy screens without one receive
          this common trigger automatically, so every route remains usable on
          tablet/mobile without page-specific sidebar code.
        */}
        {shellOwnsMobileTrigger && (
          <MobileHeader
            title={sidebarProps.title}
            open={mobileOpen}
            onToggle={() => setInternalMobileOpen((current) => !current)}
          />
        )}

        <div
          className="sstli-navigation-main"
          data-navigation-variant={activeVariant}
          style={{
            marginRight: `${offset}px`,
            marginLeft: 0,
            width: `calc(100% - ${offset}px)`,
            maxWidth: `calc(100% - ${offset}px)`,
            minWidth: 0,
            minHeight: '100dvh',
            boxSizing: 'border-box',
            paddingTop: shellOwnsMobileTrigger ? `${designTokens.headerHeight}px` : 0,
            transition: 'margin-right 180ms ease, width 180ms ease, max-width 180ms ease',
          }}
        >
          {children}
        </div>
      </div>
    </NavigationContext.Provider>
  );
}
