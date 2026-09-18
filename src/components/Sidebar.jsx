import * as uiLayout from './common/uiLayout';
import { DrawerHeader } from './MobileHeader';
import {
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
  DESKTOP_BREAKPOINT,
  SIDEBAR_DESKTOP_QUERY,
  SIDEBAR_MOBILE_WIDTH,
  SIDEBAR_MOBILE_MAX_WIDTH,
  sidebarPositionStyle,
} from '../config/sidebarLayout';
import { resolveSidebarIcon, normalizeSidebarKey, getAdminNavigation } from '../config/sidebarNavigation';
import { designTokens } from '../config/designTokens';
import { keyframes } from '@mui/system';
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import {
  Box,
  Avatar,
  Chip,
  ListItemButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip,
  Typography,
  Collapse,
  Drawer,
  useMediaQuery,
  useTheme,
  Badge,
  IconButton,
  Popover,
  CircularProgress,
  Divider,
  GlobalStyles
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Link, useLocation, useNavigate } from 'react-router-dom';





import logo from "../images/logo.jpg";
import AssignmentIcon from '@mui/icons-material/Assignment';


import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useEffect, useMemo, useState } from 'react';












































import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';



const HR_API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";
const user = JSON.parse(localStorage.getItem('user') || '{}');
const SIDEBAR_CACHE_KEY = 'sstli_sidebar_config_v6';
const SIDEBAR_CACHE_TTL_MS = 5 * 60 * 1000;

let sidebarMemoryCache = null;
let sidebarRequestPromise = null;
let sidebarRequestUserKey = '';

const getAuthorizedHeaders = (extraHeaders = {}) => {
  const token = String(localStorage.getItem('token') || '').trim();

  return {
    Accept: 'application/json',
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const getSidebarUserKey = () => {
  // Cache namespace only; authorization never depends on localStorage.
  // Prefer the current token fingerprint so changing user.guid manually
  // cannot switch the cached menu to another local user record.
  const token = String(localStorage.getItem('token') || '');
  if (token) {
    let hash = 2166136261;
    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `token:${(hash >>> 0).toString(16)}`;
  }

  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    return `user:${String(currentUser?.guid || currentUser?.Guid || '')
      .trim()
      .toLowerCase()}`;
  } catch {
    return 'anonymous';
  }
};

const readSidebarCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(SIDEBAR_CACHE_KEY) || 'null');
    const currentUserKey = getSidebarUserKey();

    if (
      cached &&
      cached.userKey === currentUserKey &&
      Array.isArray(cached.groups) &&
      Array.isArray(cached.items)
    ) {
      return cached;
    }
  } catch {
    // Ignore invalid cache.
  }

  return null;
};

const writeSidebarCache = (config) => {
  const nextCache = {
    userKey: getSidebarUserKey(),
    loadedAt: Date.now(),
    groups: Array.isArray(config?.groups) ? config.groups : [],
    items: Array.isArray(config?.items) ? config.items : []
  };

  sidebarMemoryCache = nextCache;
  localStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify(nextCache));
  return nextCache;
};

const fetchSidebarConfigShared = async (force = false) => {
  const currentUserKey = getSidebarUserKey();
  const now = Date.now();
  const cached = sidebarMemoryCache || readSidebarCache();

  if (
    !force &&
    cached &&
    cached.userKey === currentUserKey &&
    Number(cached.loadedAt || 0) > 0 &&
    now - Number(cached.loadedAt) < SIDEBAR_CACHE_TTL_MS
  ) {
    sidebarMemoryCache = cached;
    return cached;
  }

  if (sidebarRequestPromise && sidebarRequestUserKey === currentUserKey) {
    return sidebarRequestPromise;
  }

  sidebarRequestUserKey = currentUserKey;
  sidebarRequestPromise = (async () => {
    const headers = getAuthorizedHeaders();

    const response = await fetch(
      `${HR_API_BASE_URL}/api/sidebar-navigation/me`,
      {
        method: 'GET',
        headers,
        cache: 'no-store'
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.configured !== true) {
      throw new Error(result?.message || 'تعذر تحميل القائمة الجانبية');
    }

    return writeSidebarCache({
      groups: Array.isArray(result?.groups) ? result.groups : [],
      items: Array.isArray(result?.items) ? result.items : []
    });
  })();

  try {
    return await sidebarRequestPromise;
  } finally {
    sidebarRequestPromise = null;
    sidebarRequestUserKey = '';
  }
};

const primaryColor = '#057546';
const primaryDark = '#034d31';
const primaryLight = '#e6f3ee';
const accentColor = '#ae1e21';
const whiteColor = '#fefefe';
const backgroundColor = '#fefefe';
const textColor = '#1f2d3d';
const mutedTextColor = '#6f8a81';
const softShadow = '0 14px 35px rgba(5,117,70,0.12)';

// Animates the registered custom property --border-angle so the
// conic-gradient highlight sweeps around a border while the element's own
// shape (a circle for the logo ring, a pill for the active sub-tab) stays
// perfectly still -- no rotation of the box itself, so rounded pills never
// get dragged into a diagonal-looking shape mid-spin.
const tabBorderOrbit = keyframes`
  from { --border-angle: 0deg; }
  to { --border-angle: 360deg; }
`;

const logoRingOrbit = keyframes`
  from { --border-angle: 0deg; }
  to { --border-angle: 360deg; }
`;

const organicRingMorph = keyframes`
  0%, 100% {
    border-radius: 18px 14px 19px 13px / 14px 19px 13px 18px;
    transform: scale(1);
    opacity: .52;
  }
  35% {
    border-radius: 14px 19px 13px 18px / 19px 13px 18px 14px;
    transform: scale(1.006);
    opacity: .82;
  }
  70% {
    border-radius: 19px 13px 18px 14px / 13px 18px 14px 19px;
    transform: scale(.998);
    opacity: .64;
  }
`;

const activeTabBreathe = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
`;

const iconMicroMotion = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.055) rotate(-2deg); }
`;

const indicatorPulse = keyframes`
  0%, 100% { opacity: .68; transform: scaleY(.82); }
  50% { opacity: 1; transform: scaleY(1); }
`;

// Active sub-tab arrow-head: a gentle brighten/fade breath plus a 1-2px
// nudge toward the tab so the little pointer reads as "alive" without
// actually moving the tab itself.
const activeArrowBreathe = keyframes`
  0%, 100% { opacity: .70; transform: translateY(-50%) scaleY(.90); }
  50% { opacity: 1; transform: translateY(-50%) scaleY(1.04); }
`;


/*
 * Database-driven sidebar renderer.
 * The API returns only the items authorized by Form_Name/User_Premision/
 * User_Menu. Form_Name/Main_Menu are the only screen/menu metadata sources.
 * React only resolves icon components and renders the returned metadata.
 */
const StandardSidebar = ({ mobileOpen = false, onMobileClose = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Palette واحدة للسايدبار تتبدل تلقائياً مع Light / Dark. Dark-mode borders
  // pull from the shared theme border ladder (subtle/standard/accent/strong)
  // instead of one-off literals, so the sidebar's hierarchy stays consistent
  // with cards/tables/dialogs. Light mode keeps its original, validated colors.
  const sidebarColors = {
    // Dark Mode follows the same approved green surface system used across HR pages.
    surface: isDarkMode ? theme.palette.surfaces.card : '#f7fbf9',
    surfaceRaised: isDarkMode ? theme.palette.surfaces.section : '#ffffff',
    surfaceHover: isDarkMode ? theme.palette.surfaces.hover : '#f0f7f3',
    childSurface: isDarkMode ? theme.palette.surfaces.nested : 'rgba(255,255,255,.92)',
    childHover: isDarkMode ? theme.palette.surfaces.hover : '#f0f8f4',
    childSelected: isDarkMode ? theme.palette.surfaces.selected : '#eaf7f0',
    text: isDarkMode ? theme.palette.text.primary : '#24372f',
    textMuted: isDarkMode ? theme.palette.text.secondary : '#6f8a81',

    // Approved project rule: dark borders stay permanently visible.
    border: isDarkMode ? '#67C99D' : 'rgba(5,117,70,.12)',
    borderStrong: isDarkMode ? '#67C99D' : 'rgba(5,117,70,.20)',
    footer: isDarkMode ? theme.palette.surfaces.section : 'rgba(255,255,255,.98)',
    guide: isDarkMode ? 'rgba(103,201,157,.62)' : 'rgba(5,117,70,.11)'
  };

  // نفس breakpoint المركزي للمشروع: ديسكتوب/Laptop دائم، وما دونه Drawer.
  // لا يوجد أي افتراض أن الشاشة يجب أن تكون 1600px أو أكبر.
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  // اقفل القائمة تلقائياً بعد الانتقال لأي صفحة على الموبايل/التابلت.
  useEffect(() => {
    if (!isDesktop) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isDesktop]);

  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const [sidebarConfig, setSidebarConfig] = useState(() => {
    const cached = sidebarMemoryCache || readSidebarCache();

    if (cached) {
      sidebarMemoryCache = cached;
      return {
        loading: false,
        configured: true,
        groups: cached.groups,
        items: cached.items,
        error: ''
      };
    }

    return {
      loading: true,
      configured: false,
      groups: [],
      items: [],
      error: ''
    };
  });

  // touched=false: افتح تلقائياً مجموعة الصفحة الحالية في أول ظهور فقط.
  // بعد أول ضغطة يصبح التحكم يدويًا: يمكن غلق نفس المجموعة أو فتح أخرى حصريًا.
  const [dbGroupUi, setDbGroupUi] = useState({
    touched: false,
    openKey: null
  });

  useEffect(() => {
    setDbGroupUi({ touched: false, openKey: null });
  }, [location.pathname]);

  /*
   * القائمة الجانبية لا تختفي أثناء التنقل.
   * نعرض آخر نسخة ناجحة فوراً من الذاكرة/الكاش، ثم نعيد التحقق من السيرفر
   * مرة واحدة كل عدة دقائق فقط. إعادة تركيب Sidebar داخل صفحات المشروع
   * لن تعيد شاشة "جاري تحميل القائمة" في كل انتقال.
   */
  useEffect(() => {
    let isMounted = true;

    const cached = sidebarMemoryCache || readSidebarCache();
    if (cached) {
      sidebarMemoryCache = cached;
      setSidebarConfig({
        loading: false,
        configured: true,
        groups: cached.groups,
        items: cached.items,
        error: ''
      });
    }

    fetchSidebarConfigShared()
      .then((nextConfig) => {
        if (!isMounted) return;

        setSidebarConfig({
          loading: false,
          configured: true,
          groups: nextConfig.groups,
          items: nextConfig.items,
          error: ''
        });
      })
      .catch((sidebarError) => {
        if (!isMounted) return;

        const fallback = sidebarMemoryCache || readSidebarCache();
        if (fallback) {
          setSidebarConfig({
            loading: false,
            configured: true,
            groups: fallback.groups,
            items: fallback.items,
            error: ''
          });
          return;
        }

        console.warn('Sidebar loading error:', sidebarError);
        setSidebarConfig({
          loading: false,
          configured: false,
          groups: [],
          items: [],
          error: sidebarError?.message || 'تعذر تحميل القائمة الجانبية'
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Admin page can refresh sidebar metadata immediately after saving changes.
  useEffect(() => {
    const handleSidebarRefresh = async () => {
      sidebarMemoryCache = null;
      sidebarRequestPromise = null;
      sidebarRequestUserKey = '';
      localStorage.removeItem(SIDEBAR_CACHE_KEY);

      try {
        const nextConfig = await fetchSidebarConfigShared(true);
        setSidebarConfig({
          loading: false,
          configured: true,
          groups: nextConfig.groups,
          items: nextConfig.items,
          error: ''
        });
      } catch (sidebarError) {
        console.warn('Sidebar refresh error:', sidebarError);
      }
    };

    window.addEventListener('sstli:sidebar-refresh', handleSidebarRefresh);
    return () => window.removeEventListener('sstli:sidebar-refresh', handleSidebarRefresh);
  }, []);

  const loadHrNotifications = async () => {
    const userGuid = String(
      user?.guid || user?.Guid || ""
    ).trim();

    if (!userGuid) {
      setNotifications([]);
      setNotificationUnreadCount(0);
      return;
    }

    try {
      setNotificationsLoading(true);

      const response = await fetch(
        `${HR_API_BASE_URL}/api/hr/notifications?userGuid=${encodeURIComponent(userGuid)}&take=30`,
        {
          cache: "no-store",
          headers: getAuthorizedHeaders()
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل الإشعارات"
        );
      }

      setNotifications(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
      setNotificationUnreadCount(
        Number(result?.unreadCount || 0)
      );
    } catch (notificationError) {
      console.warn(
        "HR notifications error:",
        notificationError
      );
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadHrNotifications();

    const timer = window.setInterval(
      loadHrNotifications,
      60000
    );

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markNotificationRead = async (item) => {
    const userGuid = String(
      user?.guid || user?.Guid || ""
    ).trim();

    if (!userGuid || !item?.notificationKey) return;

    try {
      await fetch(
        `${HR_API_BASE_URL}/api/hr/notifications/read`,
        {
          method: "POST",
          headers: getAuthorizedHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            userGuid,
            notificationKey: item.notificationKey
          })
        }
      );
    } catch {
      // التنقل لا يتوقف بسبب فشل تحديث حالة القراءة.
    }

    setNotificationAnchor(null);

    if (item?.targetPath) {
      navigate(item.targetPath);
    }

    loadHrNotifications();
  };

  const markAllNotificationsRead = async () => {
    const userGuid = String(
      user?.guid || user?.Guid || ""
    ).trim();

    if (!userGuid) return;

    try {
      await fetch(
        `${HR_API_BASE_URL}/api/hr/notifications/read-all`,
        {
          method: "POST",
          headers: getAuthorizedHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ userGuid })
        }
      );

      await loadHrNotifications();
    } catch (notificationError) {
      console.warn(
        "Mark all notifications error:",
        notificationError
      );
    }
  };

  const handleDbGroupToggle = (groupKey, currentlyOpen) => {
    setDbGroupUi({
      touched: true,
      pathname: location.pathname,
      openKey: currentlyOpen ? null : groupKey
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem(SIDEBAR_CACHE_KEY);
    sidebarMemoryCache = null;
    sidebarRequestPromise = null;
    sidebarRequestUserKey = '';
    navigate('/login');
  };

  const configuredSidebarItems = useMemo(() => {
    return (sidebarConfig?.items || [])
      .filter((item) => item?.isActive !== false)
      .filter((item) => !(item?.desktopOnly === true && !isDesktop))
      .map((item) => ({
        itemKey: String(item?.itemKey || '').trim(),
        text: String(item?.title || '').trim(),
        description: String(item?.description || '').trim() || undefined,
        icon: resolveSidebarIcon(item?.iconKey),
        path: String(item?.route || '').trim(),
        isNew: item?.isNew === true,
        badgeText: item?.badgeText || undefined,
        customBadge: item?.customBadge || undefined,
        placement: normalizeSidebarKey(item?.placement || 'grouped'),
        __groupKey: String(item?.groupKey || '').trim(),
        __sortOrder: Number(item?.sortOrder || 0)
      }))
      .filter((item) => item.path && item.text);
  }, [sidebarConfig, isDesktop]);

  const configuredSidebarGroups = useMemo(() => {
    return (sidebarConfig?.groups || [])
      .filter((group) => group?.isActive !== false)
      .map((group) => {
        const groupKey = String(group?.groupKey || '').trim();
        const items = configuredSidebarItems
          .filter((item) =>
            item.placement !== 'standalone' &&
            item.__groupKey === groupKey
          )
          .sort((a, b) => a.__sortOrder - b.__sortOrder);

        const activeByRoute = items.some(
          (item) => item.path === location.pathname
        );

        // Home links must not auto-expand a submenu; manual choices belong to one route.
        const isHome = ['/dashboard', '/dashboard/home', '/dashboard/classic-home'].includes(location.pathname.replace(/\/$/, ''));
        const open = dbGroupUi.touched && dbGroupUi.pathname === location.pathname
          ? dbGroupUi.openKey === groupKey
          : !isHome && activeByRoute;

        return {
          groupKey,
          title: String(group?.title || '').trim(),
          icon: resolveSidebarIcon(group?.iconKey),
          items,
          open,
          onToggle: () => handleDbGroupToggle(groupKey, open),
          visible: true,
          showWhenEmpty: group?.showWhenEmpty === true,
          sortOrder: Number(group?.sortOrder || 0)
        };
      })
      .filter((group) =>
        group.groupKey &&
        group.title &&
        (group.showWhenEmpty || group.items.length > 0)
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [
    sidebarConfig,
    configuredSidebarItems,
    location.pathname,
    dbGroupUi
  ]);

  const configuredStandaloneItems = useMemo(() => {
    return configuredSidebarItems
      .filter((item) => item.placement === 'standalone')
      .sort((a, b) => a.__sortOrder - b.__sortOrder);
  }, [configuredSidebarItems]);

const childItemSx = (selected) => ({
  mb: isDesktop ? 0.28 : 0.18,
  mx: isDesktop ? 1.55 : 0.8,
  minHeight: isDesktop ? designTokens.sidebar.childItemHeight : 34,
  px: isDesktop ? 0.78 : 0.62,
  py: isDesktop ? 0.18 : 0.12,

  // Compact pill sub-tab: clean base shape, organic motion only in the active outline.
  borderRadius: 999,
  color: selected
    ? (isDarkMode ? '#f4fff9' : primaryDark)
    : sidebarColors.text,

  background: selected
    ? (isDarkMode ? sidebarColors.childSurface : '#ffffff')
    : sidebarColors.childSurface,

  // Active sub-tab: focused green border only.
  border: selected
    ? '2px solid #67C99D'
    : `1px solid ${sidebarColors.border}`,

  boxShadow: selected
    ? (isDarkMode
        ? '0 0 9px rgba(103,201,157,.20)'
        : '0 0 0 1px rgba(103,201,157,.10)')
    : 'none',
  outline: 'none',

  position: 'relative',
  overflow: 'visible',
  isolation: 'isolate',
  transform: 'translateZ(0)',


  '&.Mui-selected': {
    color: isDarkMode ? '#ffffff' : primaryDark,
    background: isDarkMode ? sidebarColors.childSurface : '#ffffff',
    borderColor: '#67C99D',
    boxShadow: isDarkMode
      ? '0 0 9px rgba(103,201,157,.20)'
      : '0 0 0 1px rgba(103,201,157,.10)'
  },

  '&.Mui-selected:hover': {
    background: isDarkMode ? sidebarColors.childHover : '#ffffff',
    borderColor: '#67C99D'
  },

  // Kill the thick/ugly focus outline that was making the selected pill
  // look double-bordered.
  '&:focus, &:focus-visible, &.Mui-focusVisible': {
    outline: 'none !important',
    boxShadow: 'none !important'
  },

  '&:hover': {
    color: isDarkMode ? '#ffffff' : primaryDark,
    background: selected
      ? (isDarkMode ? sidebarColors.childHover : '#ffffff')
      : sidebarColors.childHover,
    borderColor: selected ? '#67C99D' : sidebarColors.borderStrong,
    boxShadow: selected
      ? (isDarkMode
          ? '0 0 9px rgba(103,201,157,.20)'
          : '0 0 0 1px rgba(103,201,157,.10)')
      : 'none',
    transform: 'none',
    '& .MuiListItemIcon-root svg': {
      animation: 'none'
    }
  },

  '&:active': {
    transform: 'none'
  },

  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
    '&:hover': { transform: 'none' }
  },

  transition:
    'background-color .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease'
});

  const renderChildItem = (item) => {
    const selected = location.pathname === item.path;

    return (
      <Tooltip
        key={item.path || item.text}
        title={item.text}
        placement="left"
        disableHoverListener
        disableFocusListener
        disableTouchListener
      >
        <ListItem
          button
          component={Link}
          to={item.path}
          selected={selected}
          sx={childItemSx(selected)}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <ListItemIcon
                sx={{
                  minWidth: isDesktop ? designTokens.sidebar.childIconBoxMinWidth : 18,
                  // Unselected dark-mode icons used to sit at '#a9bdb4', a
                  // desaturated gray-green that read as "off" rather than
                  // brand green. A translucent version of the same vivid
                  // selected green keeps the brand hue itself bright and
                  // just dims it via opacity for hierarchy, instead of
                  // muddying the color.
                  color: selected
                    ? (isDarkMode ? '#67c99d' : primaryColor)
                    : (isDarkMode ? 'rgba(103,201,157,.78)' : primaryColor),
                  '& svg': {
                    fontSize: isDesktop ? designTokens.sidebar.childIconSize : 15
                  }
                }}
              >
                {item.icon}
              </ListItemIcon>
            <ListItemText
              primary={item.text}
              secondary={item.description}
              sx={{
                m: 0,
                minWidth: 0,
                '& .MuiListItemText-primary': {
                  fontFamily: 'Cairo',
                  fontWeight: selected ? 850 : 700,
                  // Leaf menu links are the sidebar text read most often, so
                  // this is the size that most needed to stop freezing at the
                  // same value from 1200px through 3440px.
                  fontSize: isDesktop ? designTokens.sidebar.childTitleSize : '0.7rem',
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '5px' : '4px',
                  lineHeight: 1.28,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                },
                '& .MuiListItemText-secondary': {
                  fontFamily: 'Cairo',
                  fontSize: isDesktop ? designTokens.sidebar.childSecondarySize : '0.62rem',
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '6px' : '4px',
                  color: selected
                    ? (isDarkMode ? 'rgba(240,255,247,.72)' : '#527467')
                    : sidebarColors.textMuted
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {(item.customBadge || item.badgeText) && (
                <Box
                  sx={{
                    px: 0.65,
                    py: 0.18,
                    borderRadius: 999,
                    fontFamily: 'Cairo',
                    fontSize: designTokens.typography.helper,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    color: selected
                      ? (isDarkMode ? '#dff8ea' : primaryDark)
                      : whiteColor,
                    background: selected
                      ? (isDarkMode ? 'rgba(103,201,157,.16)' : '#dff2e8')
                      : item.customBadge
                        ? `linear-gradient(135deg, ${accentColor}, #7f1518)`
                        : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
                  }}
                >
                  {item.customBadge || item.badgeText}
                </Box>
              )}

              
            </Box>
          </Box>
        </ListItem>
      </Tooltip>
    );
  };

  const renderStandaloneItem = (item) => {
    const selected = location.pathname === item.path;

    return (
      <Tooltip
        key={item.path || item.text}
        title={item.text}
        placement="left"
        arrow
      >
        <ListItem
          button
          component={Link}
          to={item.path}
          selected={selected}
          sx={{
            mb: isDesktop ? 0.45 : 0.25,
            mx: isDesktop ? 1 : 0.45,
            minHeight: designTokens.sidebar.itemHeight,
            px: isDesktop ? 0.75 : 0.5,
            py: isDesktop ? 0.42 : 0.34,
            borderRadius: 2.4,
            position: 'relative',
            overflow: 'visible',
            isolation: 'isolate',
            color: selected
              ? (isDarkMode ? '#f4fff9' : primaryDark)
              : sidebarColors.text,
            background: selected
              ? (isDarkMode ? sidebarColors.childSelected : '#eaf7f0')
              : sidebarColors.surfaceRaised,
            border: `1px solid ${isDarkMode ? '#67C99D' : (selected ? 'rgba(5,117,70,.26)' : sidebarColors.border)}`,
            boxShadow: selected && isDarkMode
              ? '0 7px 20px rgba(0,0,0,.18)'
              : 'none',
            animation: selected && isDarkMode
              ? `${activeTabBreathe} 3.6s ease-in-out infinite`
              : 'none',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 2,
              zIndex: -1,
              pointerEvents: 'none',
              border: selected && isDarkMode
                ? '1px solid rgba(103,201,157,.55)'
                : '1px solid transparent',
              borderRadius: '18px 14px 19px 13px / 14px 19px 13px 18px',
              animation: selected && isDarkMode
                ? `${organicRingMorph} 6.2s ease-in-out infinite`
                : 'none'
            },
            '&.Mui-selected': {
              color: isDarkMode ? '#f4fff9' : primaryDark,
              background: isDarkMode ? sidebarColors.childSelected : '#eaf7f0'
            },
            '&:hover': {
              color: isDarkMode ? '#ffffff' : primaryDark,
              background: selected
                ? (isDarkMode ? sidebarColors.childSelected : '#eaf7f0')
                : sidebarColors.surfaceHover,
              borderColor: isDarkMode ? '#67C99D' : sidebarColors.borderStrong,
              boxShadow: isDarkMode ? '0 7px 20px rgba(0,0,0,.16)' : 'none',
              transform: isDarkMode ? 'translateY(-1px)' : 'none',
              '& .MuiListItemIcon-root svg': {
                animation: isDarkMode ? `${iconMicroMotion} .55s ease both` : 'none'
              }
            },
            '&:active': { transform: 'scale(.992)' },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              transition: 'none',
              '&::after': { animation: 'none' },
              '&:hover': { transform: 'none' }
            },
            transition: 'background-color .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease'
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <ListItemIcon
                sx={{
                  minWidth: isDesktop ? designTokens.sidebar.iconBoxMinWidth : 22,
                  color: selected
                    ? (isDarkMode ? '#67C99D' : primaryColor)
                    : (isDarkMode ? 'rgba(103,201,157,.78)' : primaryColor),
                  '& svg': { fontSize: designTokens.sidebar.iconSize }
                }}
              >
                {item.icon}
              </ListItemIcon>
            <ListItemText
              primary={item.text}
              secondary={item.description}
              sx={{
                m: 0,
                minWidth: 0,
                '& .MuiListItemText-primary': {
                  fontFamily: 'Cairo',
                  fontWeight: 750,
                  fontSize: designTokens.sidebar.titleSize,
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '8px' : '5px'
                },
                '& .MuiListItemText-secondary': {
                  fontFamily: 'Cairo',
                  fontSize: designTokens.typography.helper,
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '8px' : '5px',
                  color: selected ? 'rgba(255,255,255,.78)' : mutedTextColor
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
              {(item.customBadge || item.badgeText) && (
                <Box
                  sx={{
                    px: isDesktop ? 0.8 : 0.55,
                    height: isDesktop ? 20 : 17,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Cairo',
                    fontSize: designTokens.typography.helper,
                    fontWeight: 900,
                    color: selected
                      ? (isDarkMode ? '#dff8ea' : primaryDark)
                      : whiteColor,
                    background: selected
                      ? (isDarkMode ? 'rgba(103,201,157,.16)' : '#dff2e8')
                      : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                    border: isDarkMode ? '1px solid #67C99D' : 'none',
                    boxShadow: 'none'
                  }}
                >
                  {item.customBadge || item.badgeText}
                </Box>
              )}

              
            </Box>
          </Box>
        </ListItem>
      </Tooltip>
    );
  };

  const renderGroup = ({
    title,
    icon,
    items,
    open,
    onToggle,
    visible = true,
    showWhenEmpty = false
  }) => {
    if (!visible || !items || (!showWhenEmpty && items.length === 0)) {
      return null;
    }

    const active = items.some(
      (item) => location.pathname === item.path
    );

    return (
      <Box sx={{ mb: 0.5 }}>
        <ListItem
          button
          onClick={onToggle}
          sx={{
            mb: isDesktop ? 0.38 : 0.22,
            mx: isDesktop ? 1 : 0.45,
            minHeight: designTokens.sidebar.itemHeight,
            px: isDesktop ? 0.75 : 0.5,
            py: isDesktop ? 0.42 : 0.34,
            borderRadius: 2.4,
            color: open || active ? whiteColor : sidebarColors.text,
            position: 'relative',
            overflow: 'visible',
            isolation: 'isolate',
            background: open || active
              ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`
              : sidebarColors.surfaceRaised,
            border: open || active
              ? (isDarkMode ? '2px solid #67C99D' : '1px solid rgba(81,194,140,.22)')
              : `1px solid ${sidebarColors.border}`,
            boxShadow: open || active
              ? (isDarkMode
                  ? '0 8px 22px rgba(0,0,0,.22)'
                  : '0 8px 20px rgba(5,117,70,.13)')
              : 'none',
            animation: (open || active) && isDarkMode
              ? `${activeTabBreathe} 3.8s ease-in-out infinite`
              : 'none',

            // Animated organic frame: the tab remains clean; only the inner outline morphs.
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 2,
              zIndex: -1,
              pointerEvents: 'none',
              border: (open || active) && isDarkMode
                ? '1px solid rgba(179,241,213,.46)'
                : '1px solid transparent',
              borderRadius: '18px 14px 19px 13px / 14px 19px 13px 18px',
              animation: (open || active) && isDarkMode
                ? `${organicRingMorph} 5.6s ease-in-out infinite`
                : 'none'
            },

            '&:hover': {
              color: open || active
                ? whiteColor
                : (isDarkMode ? '#ffffff' : primaryDark),
              background: open || active
                ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`
                : sidebarColors.surfaceHover,
              borderColor: open || active
                ? (isDarkMode ? '#67C99D' : 'rgba(81,194,140,.22)')
                : sidebarColors.borderStrong,
              boxShadow: open || active
                ? (isDarkMode ? '0 9px 24px rgba(0,0,0,.24)' : '0 9px 22px rgba(5,117,70,.14)')
                : (isDarkMode ? '0 6px 18px rgba(0,0,0,.14)' : '0 6px 16px rgba(5,117,70,.07)'),
              transform: 'translateY(-1px)',
              '& .MuiListItemIcon-root svg': {
                animation: `${iconMicroMotion} .55s ease both`
              }
            },
            '&:active': {
              transform: 'scale(.992)'
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              transition: 'none',
              '&::after': { animation: 'none' },
              '&:hover': { transform: 'none' }
            },
            transition: 'background-color .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease'
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <ListItemIcon
                sx={{
                  minWidth: isDesktop ? designTokens.sidebar.iconBoxMinWidth : 22,
                  color: 'inherit',
                  '& svg': { fontSize: designTokens.sidebar.iconSize }
                }}
              >
                {icon}
              </ListItemIcon>
            <ListItemText
              primary={title}
              sx={{
                m: 0,
                '.MuiTypography-root': {
                  fontFamily: 'Cairo',
                  fontWeight: 500,
                  fontSize: designTokens.sidebar.titleSize,
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '8px' : '5px'
                }
              }}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.6
              }}
            >
              

              {open ? (
                <ExpandLess
                  sx={{
                    fontSize: designTokens.sidebar.iconSize,
                    transition: 'transform .22s ease, opacity .22s ease',
                    transform: 'rotate(0deg)',
                    opacity: .95
                  }}
                />
              ) : (
                <ExpandMore
                  sx={{
                    fontSize: designTokens.sidebar.iconSize,
                    transition: 'transform .22s ease, opacity .22s ease',
                    transform: 'rotate(0deg)',
                    opacity: .82
                  }}
                />
              )}
            </Box>
          </Box>
        </ListItem>

        <Collapse in={open} timeout={{ enter: 230, exit: 180 }} unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              position: 'relative',
              pt: 0.15,
              pb: 0.35,
              '&::before': {
                content: '""',
                position: 'absolute',
                insetInlineStart: isDesktop ? 13 : 8,
                top: 4,
                bottom: 5,
                width: 1,
                bgcolor: sidebarColors.guide,
                borderRadius: 999
              }
            }}
          >
            {items.length > 0 ? (
              items.map(renderChildItem)
            ) : (
              <Box
                sx={{
                  mx: isDesktop ? 1 : 0.5,
                  ml: isDesktop ? 3 : 1.2,
                  px: isDesktop ? 1.2 : 0.7,
                  py: isDesktop ? 1.25 : 0.7,
                  borderRadius: isDesktop ? 2.5 : 1.8,
                  textAlign: 'center',
                  fontFamily: 'Cairo',
                  fontSize: designTokens.typography.helper,
                  color: sidebarColors.textMuted,
                  background: sidebarColors.surfaceRaised,
                  border: `1px solid ${sidebarColors.border}`
                }}
              >
                لا توجد شاشات متاحة حسب الصلاحيات
              </Box>
            )}
          </List>
        </Collapse>
      </Box>
    );
  };

  const sidebarContent = (
    <Box
      dir="rtl"
      style={sidebarPositionStyle}
      onClick={(event) => event.stopPropagation()}
      sx={{
        // الديسكتوب يرجع لنفس العرض والشكل القديم 100%.
        // الموبايل/التابلت Drawer صغير فقط بعرض التابات.
        width: isDesktop ? SIDEBAR_WIDTH : SIDEBAR_MOBILE_WIDTH,
        maxWidth: isDesktop ? SIDEBAR_WIDTH : SIDEBAR_MOBILE_MAX_WIDTH,
        height: '100dvh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        minWidth: 0,
        flexShrink: 0,
        '&, & *': {
          boxSizing: 'border-box'
        },
        '& .MuiList-root': {
          maxWidth: '100%',
          overflowX: 'hidden'
        },
        '& .MuiListItem-root': {
          width: 'auto',
          minWidth: 0,
          maxWidth: '100%'
        },
        background: sidebarColors.surface,
        color: sidebarColors.text,
        borderInlineEnd: isDesktop ? `1px solid ${sidebarColors.border}` : 'none',
        borderInlineStart: !isDesktop && isDarkMode ? '1px solid #67C99D' : 'none',
        fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
        position: isDesktop ? 'fixed' : 'relative',
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        boxShadow: isDesktop
          ? (isDarkMode
              ? '6px 0 22px rgba(0,0,0,.22)'
              : '6px 0 22px rgba(5,117,70,.08)')
          : 'none',
        transition: 'background-color .18s ease, color .18s ease, border-color .18s ease'
      }}
    >
      <Box
        sx={{
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {!isDesktop && <DrawerHeader onClose={onMobileClose} />}
        <Box
          sx={{
            display: isDesktop ? 'flex' : 'none',
            flex: '0 0 auto',
            height: 74,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryColor} 64%, #0a8152 100%)`,
            boxShadow: 'none',
            borderBottom: isDarkMode
              ? '1px solid #67C99D'
              : '1px solid rgba(255,255,255,.22)'
          }}
        >
          <Box
            sx={{
              width: 68,
              height: 68,
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              // Two fixed layers, like a metallic frame with a light
              // reflection orbiting it: ::before is the constant, clearly
              // visible ring (never animates), ::after is only the bright
              // shine sweeping around it (via the --border-angle custom
              // property on a fixed circular mask -- nothing here rotates
              // the logo image or the container itself). Dark-mode only;
              // light mode keeps the plain crisp ring already on the badge
              // underneath instead of an animated glow.
              '&::before': isDarkMode ? {
                content: '""',
                position: 'absolute',
                inset: 1,
                borderRadius: '50%',
                border: '3px solid #67C99D',
                boxShadow: '0 0 6px rgba(103,201,157,.45)',
                pointerEvents: 'none'
              } : { content: 'none' },
              '&::after': isDarkMode ? {
                content: '""',
                position: 'absolute',
                inset: 1,
                borderRadius: '50%',
                padding: 3,
                background: `conic-gradient(from var(--border-angle, 0deg), transparent 0deg, transparent 315deg, #eafff5 340deg, #ffffff 350deg, #eafff5 360deg)`,
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                filter: 'drop-shadow(0 0 6px rgba(103,201,157,.9)) drop-shadow(0 0 12px rgba(103,201,157,.5))',
                animation: `${logoRingOrbit} 7s linear infinite`,
                pointerEvents: 'none'
              } : { content: 'none' },
              '@media (prefers-reduced-motion: reduce)': {
                '&::after': { animation: 'none' }
              }
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                background: '#fff',
                border: isDarkMode ? '2px solid #ffffff' : '1px solid rgba(255,255,255,.92)',
                boxShadow: isDarkMode
                  ? '0 4px 14px rgba(3,77,49,.22), 0 0 0 2px rgba(103,201,157,.55)'
                  : '0 4px 14px rgba(3,77,49,.22)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="شعار النظام"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  bgcolor: '#fff',
                  p: 0
                }}
              />
            </Box>
          </Box>
        </Box>

        <List
          sx={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            flex: '1 1 auto',
            minHeight: 0,

            // منطقة القوائم فقط هي التي تعمل Scroll.
            // إخفاء شكل الـ scrollbar يمنع زق السايدبار عند فتح/غلق أي مجموعة.
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              width: 0,
              height: 0,
              display: 'none'
            },

            // على الموبايل/التابلت نسيب مساحة تحت الهيدر الثابت.
            pt: isDesktop ? 0.75 : 1,
            pb: isDesktop ? 0.75 : 0.5,
            px: 0,
            bgcolor: sidebarColors.surface
          }}
        >
          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={() => setNotificationAnchor(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: isDesktop ? "left" : "center"
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: isDesktop ? "right" : "center"
            }}
            marginThreshold={8}
            PaperProps={{
              sx: {
                width: {
                  xs: "calc(100vw - 16px)",
                  sm: 390
                },
                maxWidth: 420,
                maxHeight: {
                  xs: "72dvh",
                  sm: "70vh"
                },
                mt: { xs: .45, sm: .7 },
                borderRadius: { xs: 2.2, sm: 2.5 },
                overflow: "hidden",
                bgcolor: isDarkMode ? theme.palette.surfaces.card : '#ffffff',
                color: isDarkMode ? theme.palette.text.primary : textColor,
                border: isDarkMode ? '1px solid #67C99D' : '1px solid rgba(5,117,70,.12)',
                boxShadow: isDarkMode
                  ? "0 18px 45px rgba(0,0,0,.28)"
                  : "0 18px 45px rgba(3,77,49,.20)"
              }
            }}
          >
            <Box sx={{
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <Box>
                <Typography sx={{
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  fontSize: 14
                }}>
                  إشعاراتي
                </Typography>
                <Typography color="text.secondary" sx={{
                  fontFamily: "Cairo",
                  fontSize: 12
                }}>
                  موافقات الإجازات وتحديثات طلباتك
                </Typography>
              </Box>

              <Tooltip title="تعليم الكل كمقروء">
                <IconButton size="small" onClick={markAllNotificationsRead}>
                  <DoneAllRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Divider />

            <Box sx={{ maxHeight: "58vh", overflowY: "auto" }}>
              {notificationsLoading && (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <CircularProgress size={22} />
                </Box>
              )}

              {!notificationsLoading && notifications.length === 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography color="text.secondary" sx={{
                    textAlign: "center",
                    fontFamily: "Cairo",
                    fontSize: 12
                  }}>
                    لا توجد إشعارات حالياً
                  </Typography>
                </Box>
              )}

              {notifications.map((item) => (
                <Box
                  key={item.notificationKey}
                  onClick={() => markNotificationRead(item)}
                  sx={{
                    p: 1,
                    cursor: "pointer",
                    borderBottom: isDarkMode ? '1px solid #67C99D' : "1px solid rgba(5,117,70,.10)",
                    bgcolor: isDarkMode
                      ? (item.isRead ? theme.palette.surfaces.card : theme.palette.surfaces.selected)
                      : (item.isRead ? "#fff" : "#f0fbf5"),
                    "&:hover": { bgcolor: isDarkMode ? theme.palette.surfaces.hover : "#e9f7f0" }
                  }}
                >
                  <Typography sx={{
                    fontFamily: "Cairo",
                    fontWeight: item.isRead ? 800 : 950,
                    fontSize: 12,
                    color: isDarkMode ? sidebarColors.text : textColor
                  }}>
                    {item.title}
                  </Typography>

                  <Typography color="text.secondary" sx={{
                    mt: .2,
                    fontFamily: "Cairo",
                    fontSize: 12,
                    lineHeight: 1.6
                  }}>
                    {item.message}
                  </Typography>

                  {item.eventAt && (
                    <Typography color="text.secondary" sx={{
                      mt: .35,
                      fontFamily: "Cairo",
                      fontSize: 12
                    }}>
                      {new Date(item.eventAt).toLocaleString("ar-SA")}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Popover>

          {sidebarConfig.loading ? (
            <Box
              sx={{
                px: 2,
                py: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                color: mutedTextColor,
                fontFamily: 'Cairo'
              }}
            >
              <CircularProgress size={18} />
              <Typography sx={{ fontFamily: 'Cairo', fontSize: '0.75rem' }}>
                جاري تحميل القائمة...
              </Typography>
            </Box>
          ) : sidebarConfig.error && configuredSidebarGroups.length === 0 ? (
            <Box
              sx={{
                mx: 1,
                my: 1.5,
                p: 1.5,
                borderRadius: 2,
                textAlign: 'center',
                fontFamily: 'Cairo',
                fontSize: "0.75rem",
                color: isDarkMode ? '#ff8a80' : accentColor,
                background: isDarkMode ? 'rgba(229,90,90,.12)' : '#fff7f7',
                border: isDarkMode ? '1px solid rgba(229,90,90,.4)' : '1px solid rgba(174,30,33,.16)'
              }}
            >
              {sidebarConfig.error}
            </Box>
          ) : (
            <>
              {configuredSidebarGroups.map((group) => (
                <Box key={group.groupKey}>
                  {renderGroup({
                    title: group.title,
                    icon: group.icon,
                    items: group.items,
                    open: group.open,
                    onToggle: group.onToggle,
                    visible: group.visible,
                    showWhenEmpty: group.showWhenEmpty
                  })}
                </Box>
              ))}

              {configuredStandaloneItems.length > 0 && (
                <Box
                  sx={{
                    mt: 0.8,
                    pt: 0.8,
                    borderTop: isDarkMode ? '1px solid #67C99D' : '1px solid rgba(5,117,70,0.10)'
                  }}
                >
                  {configuredStandaloneItems.map(renderStandaloneItem)}
                </Box>
              )}
            </>
          )}

        </List>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          flex: '0 0 auto',
          p: isDesktop ? 1.15 : 0.65,
          overflowX: 'hidden',
          background: sidebarColors.footer,
          borderTop: `1px solid ${sidebarColors.border}`,
          boxShadow: isDarkMode
            ? '0 -4px 12px rgba(0,0,0,.12)'
            : '0 -4px 12px rgba(5,117,70,.04)'
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
          sx={uiLayout.withUiSx({
            borderRadius: designTokens.sidebar.itemRadius,
            fontWeight: 'bold',
            py: isDesktop ? 0.75 : 0.65,
            fontSize: designTokens.typography.control,
            minHeight: isDesktop ? 'auto' : 34,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            color: whiteColor,
            boxShadow: '0 4px 10px rgba(5,117,70,0.24)',
            '&:hover': {
              background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`,
              boxShadow: '0 5px 12px rgba(5,117,70,0.24)'
            },
            transition: 'background-color .15s ease, box-shadow .15s ease'
          }, uiLayout.buttonSx)}
        >
          تسجيل الخروج
        </Button>
      </Box>
    </Box>
  );

  // الديسكتوب: نفس السايدبار القديم بدون أي Drawer أو تغيير في المنطق.
  if (isDesktop) {
    return sidebarContent;
  }

  // الموبايل والتابلت: Drawer صغير، بدون لوجو/هيدر، ولا يحجز مساحة من الصفحة.
  // Explicit paper positioning bypasses physical-property mirroring.
  return (
    <Drawer
      anchor="right"
      SlideProps={{ direction: "left" }}
      open={mobileOpen}
      onClose={onMobileClose}
      transitionDuration={{ enter: 180, exit: 140 }}
      ModalProps={{
        keepMounted: true,
        disableScrollLock: true,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0,0,0,0.42)',
          },
        },
      }}
      PaperProps={{
        style: sidebarPositionStyle,
        sx: {
          width: SIDEBAR_MOBILE_WIDTH,
          maxWidth: SIDEBAR_MOBILE_MAX_WIDTH,
          height: '100dvh',
          background: sidebarColors.surface,
          boxShadow: isDarkMode
            ? '-12px 0 34px rgba(0,0,0,.34)'
            : '-12px 0 34px rgba(3,77,49,.16)',
          overflow: 'hidden',
          borderRadius: 0,
          borderInlineStart: isDarkMode ? '1px solid #67C99D' : 'none',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};


function AdminSidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  mobileOpen = false,
  onMobileClose = () => {},
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  // Same background/color system as the rest of the app instead of a
  // one-off dark-navy palette that never adapted to the light/dark toggle.
  const PRIMARY = isDarkMode ? theme.palette.primary.main : primaryColor;
  const PRIMARY_DARK = isDarkMode ? theme.palette.primary.dark : primaryDark;
  const BG = isDarkMode ? theme.palette.surfaces.card : '#f7fbf9';
  const BG2 = isDarkMode ? theme.palette.surfaces.section : '#ffffff';
  const TEXT_MUTED = isDarkMode ? theme.palette.text.secondary : mutedTextColor;
  const TEXT = isDarkMode ? theme.palette.text.primary : '#24372f';
  const ON_PRIMARY = theme.palette.primary.contrastText;

  // Same approved Dark Mode rule as the normal sidebar and HR pages.
  const BORDER = isDarkMode ? '#67C99D' : 'rgba(5,117,70,.12)';
  const SURFACE_TINT = isDarkMode ? theme.palette.surfaces.nested : 'rgba(5,117,70,0.05)';
  const SURFACE_TINT_BORDER = isDarkMode ? '#67C99D' : 'rgba(5,117,70,0.12)';
  const HOVER_TINT = isDarkMode ? theme.palette.surfaces.hover : 'rgba(5,117,70,0.09)';
  const CHIP_TINT = isDarkMode ? theme.palette.surfaces.nested : 'rgba(5,117,70,0.04)';
  const CHIP_TINT_HOVER = isDarkMode ? theme.palette.surfaces.hover : 'rgba(5,117,70,0.08)';
  const [currentUser, setCurrentUser] = useState(null);
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? localCollapsed;
  const setCollapsed = (next) => {
    const value = typeof next === "function" ? next(collapsed) : next;
    setLocalCollapsed(value);
    onCollapsedChange?.(value);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_QUERY, { noSsr: true });

  useEffect(() => {
    if (!isDesktop) {
      onMobileClose();
      if (collapsed) setCollapsed(false);
    }
    // Close the off-canvas menu after navigation on tablet/mobile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isDesktop, collapsed]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayName = useMemo(() => {
    return (
      currentUser?.fullName ||
      currentUser?.userName ||
      currentUser?.name ||
      "مستخدم"
    );
  }, [currentUser]);

  const roleLabel = useMemo(() => {
    // عدّلها حسب نظامك
    if (currentUser?.userName === "sa") return "Super Admin";
    if (currentUser?.userJop != null) return `Role: ${currentUser.userJop}`;
    return "User";
  }, [currentUser]);

  const menu = useMemo(() => getAdminNavigation(currentUser), [currentUser]);

  const isActive = (path) => {
    // لو عندك nested routes خليها startsWith
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const itemSx = (active) => ({
    borderRadius: 2.4,
    mb: 0.75,
    mx: 1,
    px: collapsed ? 1 : 1.5,
    py: 1.1,
    color: active ? ON_PRIMARY : TEXT,
    position: "relative",
    overflow: "visible",
    isolation: "isolate",
    border: active
      ? (isDarkMode ? '2px solid #67C99D' : '1px solid rgba(5,117,70,.24)')
      : `1px solid ${isDarkMode ? '#67C99D' : SURFACE_TINT_BORDER}`,
    ...(active
      ? {
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
          boxShadow: isDarkMode
            ? "0 9px 24px rgba(0,0,0,0.24)"
            : "0 9px 24px rgba(5,117,70,0.16)",
          animation: isDarkMode
            ? `${activeTabBreathe} 3.8s ease-in-out infinite`
            : 'none',
        }
      : {
          backgroundColor: CHIP_TINT,
          "&:hover": {
            backgroundColor: CHIP_TINT_HOVER,
          },
        }),

    // Soft irregular outline, based on the sketch, without distorting the actual button.
    "&::after": (active && isDarkMode)
      ? {
          content: '""',
          position: "absolute",
          inset: 2,
          zIndex: -1,
          pointerEvents: "none",
          border: '1px solid rgba(179,241,213,.48)',
          borderRadius: "18px 14px 19px 13px / 14px 19px 13px 18px",
          animation: `${organicRingMorph} 5.8s ease-in-out infinite`,
        }
      : {},

    "&:hover": {
      transform: isDarkMode ? "translateY(-1px)" : "none",
      boxShadow: isDarkMode ? "0 8px 22px rgba(0,0,0,.20)" : "none",
      "& .MuiListItemIcon-root svg": {
        animation: isDarkMode ? `${iconMicroMotion} .55s ease both` : 'none',
      },
    },
    "&:active": {
      transform: isDarkMode ? "scale(.992)" : "none",
    },
    "@media (prefers-reduced-motion: reduce)": {
      animation: "none",
      transition: "none",
      "&::after": { animation: "none" },
      "&:hover": { transform: "none" },
    },
    transition:
      "background-color .22s ease, color .22s ease, border-color .22s ease, box-shadow .22s ease, transform .22s ease",
  });

  const adminContent = (
    <Box
      dir="rtl"
      style={sidebarPositionStyle}
      sx={uiLayout.withUiSx({
        width: isDesktop
          ? (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH)
          : SIDEBAR_MOBILE_WIDTH,
        maxWidth: isDesktop ? SIDEBAR_WIDTH : SIDEBAR_MOBILE_MAX_WIDTH,
        height: "100dvh",
        position: isDesktop ? "fixed" : "relative",
        top: 0,
        zIndex: 1200,
        color: isDarkMode ? theme.palette.text.primary : '#24372f',
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(180deg, ${BG} 0%, ${BG2} 100%)`,
        borderInlineEnd: isDarkMode ? "1px solid #67C99D" : `1px solid rgba(5,117,70,.12)`,
        boxShadow: isDarkMode ? "0 18px 45px rgba(0,0,0,0.35)" : softShadow,
        transition: "width .25s ease",
        overflow: "hidden",
      }, uiLayout.sidebarSurfaceSx)}
    >
      {/* ====== Top / Brand ====== */}
      {!isDesktop && <DrawerHeader onClose={onMobileClose} />}
      <Box sx={{ p: 2.2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: collapsed ? "column" : "row",
            gap: 1.2,
            mb: 2,
            px: 1,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
              boxShadow: isDarkMode
                ? "0 10px 25px rgba(0,0,0,0.3)"
                : "0 10px 25px rgba(5,117,70,0.22)",
              flexShrink: 0,
            }}
          >
            <SchoolRoundedIcon sx={{ color: ON_PRIMARY }} />
          </Box>

          <Collapse orientation="horizontal" in={!collapsed} unmountOnExit>
            <Box>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                لوحة التحكم
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: TEXT_MUTED, fontWeight: 500 }}
              >
                Saudi Training Institute
              </Typography>
            </Box>
          </Collapse>

          <Box sx={{ flexGrow: 1 }} />

          {isDesktop && (
            <Tooltip title={collapsed ? "توسيع" : "تصغير"} placement="left" arrow>
              <IconButton
                aria-label={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
                onClick={() => setCollapsed((p) => !p)}
                sx={{
                  color: TEXT,
                  backgroundColor: SURFACE_TINT,
                  borderRadius: 2,
                  border: `1px solid ${SURFACE_TINT_BORDER}`,
                  "&:hover": { backgroundColor: HOVER_TINT, borderColor: isDarkMode ? '#67C99D' : SURFACE_TINT_BORDER },
                }}
              >
                {collapsed ? <ChevronLeftRoundedIcon /> : <ChevronRightRoundedIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* ====== User Card ====== */}
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 3,
            backgroundColor: SURFACE_TINT,
            border: `1px solid ${SURFACE_TINT_BORDER}`,
            display: "flex",
            alignItems: "center",
            gap: 1.3,
          }}
        >
          <Avatar
            sx={{
              bgcolor: PRIMARY,
              color: ON_PRIMARY,
              fontWeight: 900,
              width: 42,
              height: 42,
              flexShrink: 0,
            }}
          >
            {String(displayName || "U").trim().charAt(0).toUpperCase()}
          </Avatar>

          <Collapse orientation="horizontal" in={!collapsed} unmountOnExit>
            <Box>
              <Typography sx={{ fontWeight: 800, maxWidth: 170, color: TEXT }} noWrap>
                {displayName}
              </Typography>
              <Chip
                size="small"
                label={roleLabel}
                sx={{
                  mt: 0.7,
                  height: 22,
                  fontWeight: 700,
                  bgcolor: isDarkMode ? "rgba(128,180,158,0.18)" : "rgba(5,117,70,0.10)",
                  color: isDarkMode ? "#d8fff0" : primaryDark,
                  border: isDarkMode
                    ? "1px solid #67C99D"
                    : "1px solid rgba(5,117,70,0.22)",
                }}
              />
            </Box>
          </Collapse>
        </Box>

        <Divider
          sx={{
            my: 2.2,
            borderColor: BORDER,
          }}
        />

        {/* ====== Menu ====== */}
        <List sx={{ px: 0 }}>
          {menu.map((item) => {
            const active = isActive(item.to);

            return (
              <Tooltip
                key={item.to}
                title={collapsed ? item.label : ""}
                placement="left"
                arrow
              >
                <ListItemButton
                  component={Link}
                  to={item.to}
                  sx={itemSx(active)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      marginInlineEnd: collapsed ? 0 : 1.3,
                      color: active ? ON_PRIMARY : TEXT,
                      opacity: active ? 1 : 0.9,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 900 : 700,
                        fontSize: "0.95rem",
                      }}
                    />
                  )}

                  {!collapsed && item.admin && (
                    <Chip
                      size="small"
                      label="ADMIN"
                      sx={{
                        marginInlineStart: 1,
                        height: 20,
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        bgcolor: active
                          ? "rgba(255,255,255,0.18)"
                          : (isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(5,117,70,0.10)"),
                        color: active ? ON_PRIMARY : TEXT,
                        border: active
                          ? `1px solid ${isDarkMode ? '#67C99D' : 'rgba(255,255,255,0.28)'}`
                          : `1px solid ${SURFACE_TINT_BORDER}`,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* ====== Bottom / Logout ====== */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2, borderColor: BORDER }} />

        <Tooltip title={collapsed ? "تسجيل الخروج" : ""} placement="left" arrow>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5,
              px: collapsed ? 1 : 1.5,
              py: 1.2,
              backgroundColor: "rgba(244,67,54,0.10)",
              border: "1px solid rgba(244,67,54,0.25)",
              color: isDarkMode ? "#ffdad6" : accentColor,
              transition: "all .25s ease",
              "&:hover": {
                backgroundColor: "rgba(244,67,54,0.18)",
                transform: "translateY(-1px)",
                boxShadow: isDarkMode
                  ? "0 10px 25px rgba(0,0,0,0.25)"
                  : "0 10px 25px rgba(174,30,33,0.18)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                marginInlineEnd: collapsed ? 0 : 1.3,
                color: isDarkMode ? "#ffb4ae" : accentColor,
              }}
            >
              <LogoutRoundedIcon />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="تسجيل الخروج"
                primaryTypographyProps={{ fontWeight: 900 }}
              />
            )}
          </ListItemButton>
        </Tooltip>

        <Typography
          variant="body2"
          sx={{
            mt: 2,
            textAlign: "center",
            color: TEXT_MUTED,
            fontWeight: 600,
          }}
        >
          © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );

  if (isDesktop) return adminContent;

  return (
    <Drawer
      anchor="right"
      SlideProps={{ direction: "left" }}
      open={mobileOpen}
      onClose={onMobileClose}
      transitionDuration={{ enter: 180, exit: 140 }}
      ModalProps={{ keepMounted: true, disableScrollLock: true }}
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.42)" } },
      }}
      PaperProps={{
        style: sidebarPositionStyle,
        sx: {
          width: SIDEBAR_MOBILE_WIDTH,
          maxWidth: SIDEBAR_MOBILE_MAX_WIDTH,
          height: "100dvh",
          background: isDarkMode ? theme.palette.surfaces.card : '#f7fbf9',
          borderInlineStart: isDarkMode ? '1px solid #67C99D' : 'none',
          boxShadow: isDarkMode
            ? "-14px 0 38px rgba(0,0,0,0.30)"
            : "-14px 0 38px rgba(3,77,49,0.16)",
          overflow: "hidden",
          borderRadius: 0,
        },
      }}
    >
      {adminContent}
    </Drawer>
  );
}


// Registers --border-angle as a real, animatable <angle> so browsers can
// smoothly interpolate the conic-gradient highlights used for the logo ring
// and the active sub-tab's traveling border (see tabBorderOrbit/logoRingOrbit
// above). Declared once here since @property is a global at-rule; without
// it those two rings still render, just without the smooth sweep animation.
const borderAngleProperty = `
  @property --border-angle {
    syntax: '<angle>';
    inherits: false;
    initial-value: 0deg;
  }
`;

export default function Sidebar({ variant = "standard", ...props }) {
  return (
    <>
      <GlobalStyles styles={borderAngleProperty} />
      {variant === "admin" ? <AdminSidebar {...props} /> : <StandardSidebar {...props} />}
    </>
  );
}
