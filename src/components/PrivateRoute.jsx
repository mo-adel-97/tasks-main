import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ME_URL = 'https://api1.sstli.com/api/userinfo/me';
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5258';

const SIDEBAR_CACHE_KEY = 'sstli_sidebar_config_v4';

/*
 * Fast route guard
 * ----------------
 * سابقاً كل انتقال بين الصفحات كان يعمل:
 *   /api/userinfo/me + /api/screen-access/me
 * ويوقف الصفحة على "جاري التحقق...".
 *
 * الآن يتم تحميل Session + قائمة الشاشات المصرح بها من السيرفر مرة واحدة
 * في ذاكرة التطبيق لكل Token. بعد ذلك التنقل بين التابات المصرح بها فوري.
 * لا يتم استخدام user.guid أو أي قيمة صلاحية من localStorage لاتخاذ القرار.
 * Backend يظل هو الحماية الحقيقية لكل API.
 */
let verifiedUserKey = '';
let verifiedUser = null;
let sessionPromise = null;
let sessionPromiseKey = '';

let navigationUserKey = '';
let navigationItems = [];
let navigationPromise = null;
let navigationPromiseKey = '';

const memoryScreenAccess = new Map();
const screenPromises = new Map();

const normalizePath = (value) => {
  const path = String(value || '').trim().split('?')[0].split('#')[0];
  if (!path) return '/';
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
};

const tokenFingerprint = (token) => {
  const value = String(token || '');
  if (!value) return '';

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `token:${(hash >>> 0).toString(16)}`;
};

const routeMatches = (configuredRoute, currentRoute) => {
  const configured = normalizePath(configuredRoute);
  const current = normalizePath(currentRoute);

  if (!configured || configured === '/') return current === configured;
  return current === configured || current.startsWith(`${configured}/`);
};

const clearRuntimeCaches = () => {
  verifiedUserKey = '';
  verifiedUser = null;
  navigationUserKey = '';
  navigationItems = [];
  sessionPromise = null;
  sessionPromiseKey = '';
  navigationPromise = null;
  navigationPromiseKey = '';
  memoryScreenAccess.clear();
  screenPromises.clear();
};

const verifySessionShared = async (token) => {
  const key = tokenFingerprint(token);

  if (verifiedUserKey === key && verifiedUser?.guid) {
    return verifiedUser;
  }

  if (sessionPromise && sessionPromiseKey === key) {
    return sessionPromise;
  }

  sessionPromiseKey = key;
  sessionPromise = (async () => {
    const response = await fetch(ME_URL, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Session verification failed: ${response.status}`);
    }

    const user = await response.json();
    if (!user?.guid) {
      throw new Error('Session response is missing user identity');
    }

    verifiedUserKey = key;
    verifiedUser = user;

    // Cache بيانات واجهة فقط؛ قرار الصلاحية لا يعتمد عليها.
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('sstli-auth-refreshed'));

    return user;
  })();

  try {
    return await sessionPromise;
  } finally {
    sessionPromise = null;
    sessionPromiseKey = '';
  }
};

const loadNavigationShared = async (token, force = false) => {
  const key = tokenFingerprint(token);

  if (!force && navigationUserKey === key && Array.isArray(navigationItems)) {
    return navigationItems;
  }

  if (!force && navigationPromise && navigationPromiseKey === key) {
    return navigationPromise;
  }

  navigationPromiseKey = key;
  navigationPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/sidebar-navigation/me`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
      throw new Error('Navigation session is invalid');
    }

    if (!response.ok) {
      throw new Error(`Navigation verification failed: ${response.status}`);
    }

    const result = await response.json().catch(() => null);
    if (result?.configured !== true) {
      throw new Error(result?.message || 'Sidebar navigation is not configured');
    }

    const items = Array.isArray(result?.items) ? result.items : [];
    navigationUserKey = key;
    navigationItems = items;

    // نفس Snapshot يُستفاد منه لعرض الـSidebar بسرعة، لكن PrivateRoute يعتمد
    // على النسخة الموجودة في الذاكرة والتي جاءت مباشرة من السيرفر.
    localStorage.setItem(
      SIDEBAR_CACHE_KEY,
      JSON.stringify({
        userKey: key,
        loadedAt: Date.now(),
        groups: Array.isArray(result?.groups) ? result.groups : [],
        items
      })
    );

    return items;
  })();

  try {
    return await navigationPromise;
  } finally {
    navigationPromise = null;
    navigationPromiseKey = '';
  }
};

const isAllowedByNavigationMemory = (token, route) => {
  const key = tokenFingerprint(token);
  if (navigationUserKey !== key || !Array.isArray(navigationItems)) return false;

  return navigationItems.some(
    (item) =>
      item?.isActive !== false &&
      item?.route &&
      routeMatches(item.route, route)
  );
};

const screenCacheKey = (token, route) =>
  `${tokenFingerprint(token)}|${normalizePath(route).toLowerCase()}`;

const verifyScreenShared = async (token, route) => {
  if (isAllowedByNavigationMemory(token, route)) {
    return { registered: true, allowed: true };
  }

  const key = screenCacheKey(token, route);
  if (memoryScreenAccess.has(key)) return memoryScreenAccess.get(key);
  if (screenPromises.has(key)) return screenPromises.get(key);

  const promise = (async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/screen-access/me?route=${encodeURIComponent(normalizePath(route))}`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.status === 401) {
      throw new Error('Screen access session is invalid');
    }

    // صفحات داخلية قديمة غير مسجلة في Form_Name لا تُكسر أثناء الانتقال.
    if (!response.ok) {
      const fallback = { registered: false, allowed: true };
      memoryScreenAccess.set(key, fallback);
      return fallback;
    }

    const access = await response.json().catch(() => null);
    const normalized = {
      registered: access?.registered === true,
      allowed: access?.registered === true ? access?.allowed === true : true
    };

    memoryScreenAccess.set(key, normalized);
    return normalized;
  })();

  screenPromises.set(key, promise);
  try {
    return await promise;
  } finally {
    screenPromises.delete(key);
  }
};

const getInitialStatus = (route) => {
  const token = String(localStorage.getItem('token') || '').trim();
  if (!token) return 'denied';

  const key = tokenFingerprint(token);
  if (verifiedUserKey !== key || !verifiedUser?.guid) return 'checking';

  if (isAllowedByNavigationMemory(token, route)) return 'allowed';

  const cached = memoryScreenAccess.get(screenCacheKey(token, route));
  if (cached?.registered === true && cached?.allowed !== true) return 'forbidden';
  if (cached) return 'allowed';

  return 'checking';
};

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState(() => getInitialStatus(location.pathname));

  useEffect(() => {
    let cancelled = false;
    const route = location.pathname;
    const token = String(localStorage.getItem('token') || '').trim();

    if (!token) {
      setStatus('denied');
      return undefined;
    }

    const immediate = getInitialStatus(route);
    if (immediate === 'allowed' || immediate === 'forbidden') {
      setStatus(immediate);
      return undefined;
    }

    const verify = async () => {
      setStatus('checking');

      try {
        // أول مرة فقط: الجلسة وقائمة التابات يتحققوا بالتوازي.
        const results = await Promise.allSettled([
          verifySessionShared(token),
          loadNavigationShared(token)
        ]);

        const sessionResult = results[0];
        if (sessionResult.status === 'rejected') {
          throw sessionResult.reason;
        }

        if (cancelled) return;

        // غالبية الصفحات تُحسم هنا بدون طلب screen-access إضافي.
        if (isAllowedByNavigationMemory(token, route)) {
          setStatus('allowed');
          return;
        }

        const access = await verifyScreenShared(token, route);
        if (cancelled) return;

        if (access?.registered === true && access?.allowed !== true) {
          setStatus('forbidden');
          return;
        }

        setStatus('allowed');
      } catch (error) {
        console.error('Session verification error:', error);
        clearRuntimeCaches();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_branch');
        if (!cancelled) setStatus('denied');
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    const refreshPermissions = () => {
      const token = String(localStorage.getItem('token') || '').trim();
      navigationUserKey = '';
      navigationItems = [];
      memoryScreenAccess.clear();
      screenPromises.clear();

      // Warm refresh في الخلفية حتى لا ينتظر المستخدم في التنقل التالي.
      if (token) {
        loadNavigationShared(token, true).catch((error) => {
          console.warn('Background permission refresh failed:', error);
        });
      }
    };

    window.addEventListener('sstli:sidebar-refresh', refreshPermissions);
    return () => window.removeEventListener('sstli:sidebar-refresh', refreshPermissions);
  }, []);

  if (status === 'checking') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Cairo, Arial, sans-serif',
        direction: 'rtl'
      }}>
        جاري التحقق من الجلسة والصلاحية...
      </div>
    );
  }

  if (status === 'forbidden') {
    return <Navigate to="/dashboard" replace state={{ permissionDenied: true }} />;
  }

  return status === 'allowed'
    ? children
    : <Navigate to="/login" replace />;
}
