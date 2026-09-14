import axios from 'axios';

const API_HOSTS = new Set([
  'api1.sstli.com',
  'api4.sstli.com',
  'localhost:5258',
  '127.0.0.1:5258',
  'localhost:5275',
  '127.0.0.1:5275'
]);

const configuredApiOrigins = new Set(
  [process.env.REACT_APP_API_BASE_URL, process.env.REACT_APP_API_URL]
    .filter(Boolean)
    .flatMap((value) => {
      try { return [new URL(value, window.location.origin).origin]; }
      catch { return []; }
    })
);

const shouldAttachAuth = (rawUrl) => {
  try {
    const url = new URL(rawUrl, window.location.origin);
    const sameOriginApi = url.origin === window.location.origin && url.pathname.startsWith('/api/');
    return API_HOSTS.has(url.host) || configuredApiOrigins.has(url.origin) || sameOriginApi;
  } catch {
    return false;
  }
};

const getToken = () => localStorage.getItem('token') || '';

const clearInvalidSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_branch');
};

// كل fetch متجه إلى api1 يحصل على التوكن تلقائياً، بدون تعديل عشرات الشاشات.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const rawUrl = typeof input === 'string'
    ? input
    : (input instanceof URL ? input.toString() : input?.url);
  const token = getToken();

  let requestInit = init;
  if (token && rawUrl && shouldAttachAuth(rawUrl)) {
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    requestInit = { ...init, headers };
  }

  const response = await originalFetch(input, requestInit);

  if (response.status === 401 && rawUrl && shouldAttachAuth(rawUrl)) {
    // 401 = الجلسة نفسها غير صالحة. 403 لا يمسح الجلسة لأنه منع صلاحية فقط.
    clearInvalidSession();
  }

  return response;
};

axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config?.url && shouldAttachAuth(config.url)) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    if (status === 401 && url && shouldAttachAuth(url)) {
      clearInvalidSession();
    }
    return Promise.reject(error);
  }
);

export { clearInvalidSession, getToken, shouldAttachAuth };
