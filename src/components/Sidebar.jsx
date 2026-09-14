import * as uiLayout from './common/uiLayout';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, DESKTOP_BREAKPOINT, SIDEBAR_MOBILE_WIDTH, SIDEBAR_MOBILE_MAX_WIDTH, sidebarPositionStyle } from '../config/sidebarLayout';
import { resolveSidebarIcon, normalizeSidebarKey, getAdminNavigation } from '../config/sidebarNavigation';
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
  Badge,
  IconButton,
  Popover,
  Stack,
  CircularProgress,
  Divider
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Link, useLocation, useNavigate } from 'react-router-dom';





import logo from "../images/logo.jpg";
import AssignmentIcon from '@mui/icons-material/Assignment';


import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useEffect, useMemo, useState } from 'react';












































import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';



const HR_API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";
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


/*
 * Database-driven sidebar renderer.
 * The API returns only the items authorized by Form_Name/User_Premision/
 * User_Menu. Form_Name/Main_Menu are the only screen/menu metadata sources.
 * React only resolves icon components and renders the returned metadata.
 */
const StandardSidebar = ({ mobileOpen = false, onMobileClose = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // مهم: الديسكتوب فقط من 1600px وما فوق.
  // أقل من ذلك = Drawer خفيف لا يحجز أي مساحة من الصفحة.
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

        const open = dbGroupUi.touched
          ? dbGroupUi.openKey === groupKey
          : activeByRoute;

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
  mb: isDesktop ? 0.25 : 0.18,

  // نفس عرض التاب الرئيسي تقريبًا
  mx: isDesktop ? 1 : 0.45,
  ml: isDesktop ? 1 : 0.45,
  mr: isDesktop ? 1 : 0.45,

  minHeight: isDesktop ? 38 : 32,

  px: isDesktop ? 1 : 0.65,
  py: isDesktop ? 0.4 : 0.22,

  borderRadius: isDesktop ? 2.5 : 1.8,

  color: selected ? whiteColor : textColor,

  background: selected
    ? `linear-gradient(135deg, ${accentColor} 0%, #7f1518 100%)`
    : '#ffffff',

  border: selected
    ? '1px solid transparent'
    : '1px solid rgba(5,117,70,0.09)',

  boxShadow: selected
    ? '0 7px 16px rgba(174,30,33,0.20)'
    : '0 2px 8px rgba(31,45,61,0.035)',

  position: 'relative',
  overflow: 'hidden',

  '&:before': {
    content: '""',
    position: 'absolute',
    insetInlineStart: 0,
    top: 7,
    bottom: 7,
    width: 3,
    borderRadius: '999px 0 0 999px',
    background: selected ? whiteColor : primaryColor
  },

  '&.Mui-selected': {
    color: whiteColor,
    background: `linear-gradient(135deg, ${accentColor} 0%, #7f1518 100%)`
  },

  '&:hover': {
    color: selected ? whiteColor : primaryDark,
    background: selected
      ? `linear-gradient(135deg, ${accentColor} 0%, #7f1518 100%)`
      : primaryLight,

    transform: 'translateX(-2px)'
  },

  transition: 'all 0.2s ease'
});

  const renderChildItem = (item) => {
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
                  minWidth: isDesktop ? 26 : 22,
                  color: selected ? whiteColor : primaryColor,
                  '& svg': { fontSize: isDesktop ? '1.08rem' : '0.95rem' }
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
                  fontWeight: 700,
                  fontSize: isDesktop ? "0.75rem" : "0.75rem",
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '8px' : '5px',
                  lineHeight: isDesktop ? 1.45 : 1.3
                },
                '& .MuiListItemText-secondary': {
                  fontFamily: 'Cairo',
                  fontSize: isDesktop ? "0.75rem" : "0.75rem",
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '8px' : '5px',
                  color: selected
                    ? 'rgba(255,255,255,.78)'
                    : mutedTextColor
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
                    fontSize: isDesktop ? "0.75rem" : "0.75rem",
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    color: selected ? accentColor : whiteColor,
                    background: selected
                      ? whiteColor
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
            mb: isDesktop ? 0.6 : 0.3,
            mx: isDesktop ? 1 : 0.45,
            minHeight: isDesktop ? 48 : 38,
            px: isDesktop ? 1.15 : 0.72,
            py: isDesktop ? 0.75 : 0.38,
            borderRadius: isDesktop ? 3 : 2,
            color: selected ? whiteColor : textColor,
            background: selected
              ? 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
              : 'linear-gradient(135deg, #f5fbff 0%, #ffffff 100%)',
            border: selected
              ? '1px solid transparent'
              : '1px solid rgba(25,118,210,0.18)',
            boxShadow: selected
              ? '0 8px 18px rgba(25,118,210,0.24)'
              : '0 3px 10px rgba(25,118,210,0.07)',
            '&.Mui-selected': {
              color: whiteColor,
              background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
            },
            '&:hover': {
              color: whiteColor,
              background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
              transform: 'translateX(-4px)'
            },
            transition: 'all 0.22s ease'
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
                  minWidth: isDesktop ? 26 : 22,
                  color: selected ? whiteColor : '#1976d2',
                  '& svg': { fontSize: isDesktop ? '1.18rem' : '0.98rem' }
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
                  fontWeight: 800,
                  fontSize: isDesktop ? '0.9rem' : "0.75rem",
                  textAlign: 'start',
                  marginInlineStart: isDesktop ? '8px' : '5px'
                },
                '& .MuiListItemText-secondary': {
                  fontFamily: 'Cairo',
                  fontSize: isDesktop ? "0.75rem" : "0.75rem",
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
                    fontSize: isDesktop ? "0.75rem" : "0.75rem",
                    fontWeight: 900,
                    color: selected ? '#1976d2' : whiteColor,
                    background: selected
                      ? whiteColor
                      : 'linear-gradient(135deg, #2196f3, #0d6fc2)',
                    boxShadow: '0 3px 8px rgba(33,150,243,0.24)'
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
            mb: isDesktop ? 0.45 : 0.25,
            mx: isDesktop ? 1 : 0.45,
            minHeight: isDesktop ? 48 : 38,
            px: isDesktop ? 1.15 : 0.72,
            py: isDesktop ? 0.75 : 0.38,
            borderRadius: isDesktop ? 3 : 2,
            color: open || active ? whiteColor : textColor,
            background: open || active
              ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`
              : 'linear-gradient(135deg, #f7fcf9 0%, #ffffff 100%)',
            border: open || active
              ? '1px solid transparent'
              : '1px solid rgba(5,117,70,0.13)',
            boxShadow: open || active
              ? '0 8px 18px rgba(5,117,70,0.24)'
              : '0 3px 10px rgba(5,117,70,0.06)',
            '&:hover': {
              color: whiteColor,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              transform: 'translateX(-4px)'
            },
            transition: 'all 0.22s ease'
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
                  minWidth: isDesktop ? 26 : 22,
                  color: 'inherit',
                  '& svg': { fontSize: isDesktop ? '1.18rem' : '0.98rem' }
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
                  fontWeight: 800,
                  fontSize: isDesktop ? '0.8rem' : "0.75rem",
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
                <ExpandLess sx={{ fontSize: isDesktop ? '1.05rem' : '0.9rem' }} />
              ) : (
                <ExpandMore sx={{ fontSize: isDesktop ? '1.05rem' : '0.9rem' }} />
              )}
            </Box>
          </Box>
        </ListItem>

        <Collapse in={open} timeout={260} unmountOnExit>
          <List component="div" disablePadding>
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
                  fontSize: isDesktop ? '0.76rem' : "0.75rem",
                  color: mutedTextColor,
                  background: '#ffffff',
                  border: '1px solid rgba(5,117,70,0.09)'
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
        overflowY: 'auto',
        overflowX: 'hidden',
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
        background: `linear-gradient(180deg, ${whiteColor} 0%, #f4fbf7 100%)`,
        color: textColor,
        borderInlineEnd: isDesktop ? `1px solid ${primaryLight}` : 'none',
        fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
        position: isDesktop ? 'fixed' : 'relative',
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        boxShadow: isDesktop
          ? '8px 0 28px rgba(5,117,70,0.10)'
          : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: isDesktop ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 3,
            width: '100%',
            overflow: 'hidden',
            background: `linear-gradient(145deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            color: whiteColor,
            textAlign: 'center',
            position: 'relative',
            boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.10)'
          }}
        >
          <Box
            sx={{
              width: '116px',
              height: '116px',
              borderRadius: '28px',
              overflow: 'hidden',
              border: `3px solid ${whiteColor}`,
              background: whiteColor,
              boxShadow: softShadow,
              mb: 1.5
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="شعار النظام"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={0.55}
            sx={{
              width: '100%',
              minHeight: 30
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Cairo',
                fontWeight: 900,
                fontSize: '1.05rem',
                lineHeight: 1.5
              }}
            >
              نظام الإدارة
            </Typography>

            <Tooltip
              title={
                notificationUnreadCount > 0
                  ? `الإشعارات (${notificationUnreadCount})`
                  : "الإشعارات"
              }
              placement="top"
            >
              <IconButton
                aria-label="الإشعارات"
                onClick={(event) =>
                  setNotificationAnchor(event.currentTarget)
                }
                size="small"
                sx={{
                  width: 27,
                  height: 27,
                  p: 0,
                  color: whiteColor,
                  bgcolor: "rgba(255,255,255,.13)",
                  border: "1px solid rgba(255,255,255,.25)",
                  boxShadow: "0 4px 12px rgba(0,0,0,.10)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,.22)"
                  },
                  "& svg": {
                    fontSize: 17
                  }
                }}
              >
                <Badge
                  badgeContent={notificationUnreadCount}
                  color="error"
                  max={99}
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-badge": {
                      minWidth: 14,
                      height: 14,
                      px: .25,
                      fontSize: 12,
                      fontWeight: 950,
                      border: "1.5px solid #fff"
                    }
                  }}
                >
                  <NotificationsNoneRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>

          <Typography
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 500,
              fontSize: '0.78rem',
              opacity: 0.95
            }}
          >
            المستخدم
          </Typography>
        </Box>

        {/* على الموبايل/التابلت فقط: جرس ثابت بجوار زر القائمة */}
        {!isDesktop && (
<Tooltip
          title={
            notificationUnreadCount > 0
              ? `الإشعارات (${notificationUnreadCount})`
              : "الإشعارات"
          }
          placement={isDesktop ? "left" : "bottom"}
        >
          <IconButton
            aria-label="الإشعارات"
            onClick={(event) =>
              setNotificationAnchor(event.currentTarget)
            }
            sx={{
              position: "fixed",

              top: {
                xs: 7,
                sm: 9,
                md: 10
              },

              right: {
                xs: 50,
                sm: 56,
                md: 60
              },

              width: {
                xs: 34,
                sm: 36,
                md: 38
              },

              height: {
                xs: 34,
                sm: 36,
                md: 38
              },

              zIndex: 1455,
              color: whiteColor,
              bgcolor: primaryColor,
              border: "1px solid rgba(255,255,255,.38)",
              boxShadow: "0 5px 14px rgba(3,77,49,.24)",
              backdropFilter: "blur(8px)",
              transition: "transform .18s ease, box-shadow .18s ease",

              "&:hover": {
                bgcolor: primaryDark,
                transform: "translateY(-1px)",
                boxShadow: "0 8px 20px rgba(3,77,49,.24)"
              },

              "& svg": {
                fontSize: {
                  xs: 18,
                  sm: 19,
                  md: 20
                }
              }
            }}
          >
            <Badge
              badgeContent={notificationUnreadCount}
              color="error"
              max={99}
              overlap="circular"
              sx={{
                "& .MuiBadge-badge": {
                  minWidth: 16,
                  height: 16,
                  px: .35,
                  fontSize: 12,
                  fontWeight: 950,
                  border: "2px solid #fff"
                }
              }}
            >
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        )}

        <List
          sx={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,

            // على الموبايل/التابلت نسيب مساحة تحت الهيدر الثابت
            // عشان أول التابات ما تتغطاش.
            pt: isDesktop
              ? 1.2
              : {
                  xs: 6.6,
                  sm: 7,
                  md: 7.3,
                },

            pb: isDesktop ? 1.2 : 0.5,

            px: 0,
            overflowX: 'hidden'
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
                boxShadow: "0 18px 45px rgba(3,77,49,.20)"
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
                    borderBottom: "1px solid rgba(5,117,70,.10)",
                    bgcolor: item.isRead ? "#fff" : "#f0fbf5",
                    "&:hover": { bgcolor: "#e9f7f0" }
                  }}
                >
                  <Typography sx={{
                    fontFamily: "Cairo",
                    fontWeight: item.isRead ? 800 : 950,
                    fontSize: 12,
                    color: textColor
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
                color: accentColor,
                background: '#fff7f7',
                border: '1px solid rgba(174,30,33,.16)'
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
                    borderTop: '1px solid rgba(5,117,70,0.10)'
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
          p: isDesktop ? 2 : 0.65,
          overflowX: 'hidden',
          borderTop: `1px solid ${primaryLight}`
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
          sx={uiLayout.withUiSx({
            borderRadius: 3,
            fontWeight: 'bold',
            py: isDesktop ? 1.2 : 0.65,
            fontSize: isDesktop ? '0.84rem' : "0.75rem",
            minHeight: isDesktop ? 'auto' : 34,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            color: whiteColor,
            boxShadow: '0 4px 10px rgba(5,117,70,0.24)',
            '&:hover': {
              background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`,
              boxShadow: '0 6px 15px rgba(5,117,70,0.30)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
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
          background: 'transparent',
          boxShadow: '-14px 0 38px rgba(3,77,49,0.20)',
          overflow: 'hidden',
          borderRadius: 0,
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};


const PRIMARY = "#80b49e";
const PRIMARY_DARK = "#6a9a87";
const BG = "#0f172a";        // slate-900
const BG2 = "#111c33";       // deeper
const TEXT_MUTED = "#94a3b8";

function AdminSidebar({ collapsed: controlledCollapsed, onCollapsedChange }) {
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
    borderRadius: 2,
    mb: 0.75,
    mx: 1,
    px: collapsed ? 1 : 1.5,
    py: 1.1,
    transition: "all .25s ease",
    color: "white",
    position: "relative",
    overflow: "hidden",
    ...(active
      ? {
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        }
      : {
          backgroundColor: "rgba(255,255,255,0.04)",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.09)",
            transform: "translateY(-1px)",
          },
        }),
    "&::after": active
      ? {
          content: '""',
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%)",
          transform: "rotate(20deg)",
        }
      : {},
  });

  return (
    <Box
      dir="rtl"
      style={sidebarPositionStyle}
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        height: "100vh",
        position: "fixed",
        top: 0,
        zIndex: 1200,
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(180deg, ${BG} 0%, ${BG2} 100%)`,
        borderInlineEnd: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
        transition: "width .25s ease",
        overflow: "hidden",
      }}
    >
      {/* ====== Top / Brand ====== */}
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
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          >
            <SchoolRoundedIcon />
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

          <Tooltip title={collapsed ? "توسيع" : "تصغير"} placement="left" arrow>
            <IconButton
              aria-label={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
              onClick={() => setCollapsed((p) => !p)}
              sx={{
                color: "white",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 2,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              {collapsed ? <ChevronLeftRoundedIcon /> : <ChevronRightRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* ====== User Card ====== */}
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 1.3,
          }}
        >
          <Avatar
            sx={{
              bgcolor: PRIMARY,
              color: "#0b1220",
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
              <Typography sx={{ fontWeight: 800, maxWidth: 170 }} noWrap>
                {displayName}
              </Typography>
              <Chip
                size="small"
                label={roleLabel}
                sx={{
                  mt: 0.7,
                  height: 22,
                  fontWeight: 700,
                  bgcolor: "rgba(128,180,158,0.18)",
                  color: "#d8fff0",
                  border: "1px solid rgba(128,180,158,0.35)",
                }}
              />
            </Box>
          </Collapse>
        </Box>

        <Divider
          sx={{
            my: 2.2,
            borderColor: "rgba(148,163,184,0.25)",
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
                      color: "white",
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
                        bgcolor: "rgba(255,255,255,0.12)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.16)",
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
        <Divider sx={{ mb: 2, borderColor: "rgba(148,163,184,0.25)" }} />

        <Tooltip title={collapsed ? "تسجيل الخروج" : ""} placement="left" arrow>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5,
              px: collapsed ? 1 : 1.5,
              py: 1.2,
              backgroundColor: "rgba(244,67,54,0.10)",
              border: "1px solid rgba(244,67,54,0.25)",
              color: "white",
              transition: "all .25s ease",
              "&:hover": {
                backgroundColor: "rgba(244,67,54,0.18)",
                transform: "translateY(-1px)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                marginInlineEnd: collapsed ? 0 : 1.3,
                color: "#ffb4ae",
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
}


export default function Sidebar({ variant = "standard", ...props }) {
  return variant === "admin" ? <AdminSidebar {...props} /> : <StandardSidebar {...props} />;
}
