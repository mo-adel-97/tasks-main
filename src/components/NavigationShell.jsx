import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import { getSidebarOffset, SIDEBAR_DESKTOP_QUERY } from '../config/sidebarLayout';

const NavigationContext = createContext(null);

// Embedded screens delegate their navigation to the containing shell and
// reserve no second sidebar gutter.
export default function NavigationShell({ children, variant = 'standard', ...sidebarProps }) {
  const parent = useContext(NavigationContext);
  const id = useId();
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_QUERY, { noSsr: true });
  const [collapsed, setCollapsed] = useState(false);
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
    if (parentRegister) return parentRegister(id, {
      variant, mobileOpen: sidebarProps.mobileOpen, onMobileClose: closeNested,
    });
    return undefined;
  }, [parentRegister, id, variant, sidebarProps.mobileOpen, closeNested]);

  const nestedScreens = Array.from(overrides.values());
  const activeVariant = nestedScreens.at(-1)?.variant || variant;
  const mobileOpen = Boolean(sidebarProps.mobileOpen || nestedScreens.some((screen) => screen.mobileOpen));
  const closeMobile = () => {
    sidebarProps.onMobileClose?.();
    nestedScreens.forEach((screen) => screen.onMobileClose());
  };
  const context = useMemo(() => ({ register }), [register]);
  const offset = parent ? 0 : getSidebarOffset(activeVariant, isDesktop, collapsed);

  return (
    <NavigationContext.Provider value={parent || context}>
      <div dir="rtl" style={{ display: 'contents', direction: 'rtl', '--navigation-direction': 'rtl', '--navigation-content-offset': offset + 'px' }}>
        {!parent && (
          <Sidebar {...sidebarProps} variant={activeVariant}
            mobileOpen={mobileOpen} onMobileClose={closeMobile}
            collapsed={collapsed} onCollapsedChange={setCollapsed} />
        )}
        {children}
      </div>
    </NavigationContext.Provider>
  );
}
