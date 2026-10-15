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

// تطوير محلي فقط: تحويل كل طلبات api4 للباك إند المحلي (المتصل بنسخة الباك أب DATASSTLI_20260917).
// النسخة المبنية للإنتاج (npm run build) لا تتأثر لأن NODE_ENV فيها = production.
// لإيقاف التحويل أثناء التطوير: خلّي القيمة '' .
const LOCAL_API4_ORIGIN =
  process.env.NODE_ENV === 'development' ? 'https://api4.sstli.com' : '';
const PROD_API4_ORIGIN = 'https://api4.sstli.com';

const rewriteApi4Url = (rawUrl) => {
  if (!LOCAL_API4_ORIGIN || typeof rawUrl !== 'string') return rawUrl;
  return rawUrl.startsWith(PROD_API4_ORIGIN)
    ? LOCAL_API4_ORIGIN + rawUrl.slice(PROD_API4_ORIGIN.length)
    : rawUrl;
};

if (LOCAL_API4_ORIGIN) API_HOSTS.add(new URL(LOCAL_API4_ORIGIN).host);

const getToken = () => localStorage.getItem('token') || '';

// ===== بيانات جهاز المستخدم الحقيقي (نشاط المستخدمين) =====
// api4 (DbAuditUser) بيحطها في SESSION_CONTEXT وtrg_UserAction_CaptureDevice بيسجلها بدل جهاز السيرفر.
// بتتبعت مع طلبات الكتابة لـ api4 بس (مش api1). أي خطأ هنا مايوقفش الطلب.
const CLIENT_INFO_HOSTS = new Set(['api4.sstli.com', 'localhost:5258', '127.0.0.1:5258', 'localhost:5275', '127.0.0.1:5275']);

const shouldAttachClientInfo = (rawUrl, method) => {
  if (!method || ['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())) return false;
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (url.host === 'api1.sstli.com') return false;
    const sameOriginApi = url.origin === window.location.origin && url.pathname.startsWith('/api/');
    return CLIENT_INFO_HOSTS.has(url.host) || configuredApiOrigins.has(url.origin) || sameOriginApi;
  } catch {
    return false;
  }
};

// معرّف ثابت للجهاز/المتصفح: نفس الجهاز = نفس المعرّف في كل الحركات.
const getDeviceId = () => {
  try {
    let id = localStorage.getItem('sstli_device_id');
    if (!id) {
      id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('sstli_device_id', id);
    }
    return id;
  } catch {
    return '';
  }
};

// نظام التشغيل الدقيق (Windows 10 / 11) وموديل الموبايل من Client Hints لو المتصفح بيدعمها.
const clientHints = { platform: '', model: '' };
try {
  navigator.userAgentData?.getHighEntropyValues?.(['platform', 'platformVersion', 'model'])
    .then((v) => {
      const major = parseInt(String(v.platformVersion || '').split('.')[0], 10) || 0;
      if (v.platform === 'Windows') clientHints.platform = major >= 13 ? 'Windows 11' : major > 0 ? 'Windows 10' : 'Windows';
      else if (v.platform === 'Android') clientHints.platform = `Android ${String(v.platformVersion || '').split('.')[0]}`.trim();
      else if (v.platform === 'macOS') clientHints.platform = `macOS ${v.platformVersion || ''}`.trim();
      else if (v.platform) clientHints.platform = v.platform;
      clientHints.model = v.model || '';
    })
    .catch(() => {});
} catch {
  // متصفح من غير Client Hints
}

// بصمة الجهاز: من مواصفات الجهاز نفسه (كارت الشاشة، الأنوية، الرامات، الشاشة، المنطقة الزمنية، الخطوط المتسطبة).
// مش متخزنة في المتصفح، فمسح بيانات التصفح مش بيغيّرها (عكس معرّف الجهاز).
// من غير UA ولا تكبير الصفحة (devicePixelRatio) عشان تفضل ثابتة مع تحديث المتصفح والزوم.
const hash53 = (text) => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
};

const FINGERPRINT_FONTS = [
  'Arial', 'Calibri', 'Cambria', 'Segoe UI', 'Tahoma', 'Times New Roman', 'Verdana', 'Georgia', 'Consolas',
  'Courier New', 'Comic Sans MS', 'Impact', 'Microsoft Sans Serif', 'Traditional Arabic', 'Simplified Arabic',
  'Arabic Typesetting', 'Sakkal Majalla', 'Andalus', 'Aldhabi', 'Dubai', 'Noto Sans Arabic', 'Roboto',
  'Helvetica Neue', 'Ubuntu', 'Cairo', 'Tajawal', 'Almarai', 'Franklin Gothic Medium', 'Gabriola', 'Ebrima'
];

let fingerprintCache = null;
let fingerprintPartsCache = null;

export const getClientFingerprintParts = () => {
  if (fingerprintPartsCache) return fingerprintPartsCache;
  const parts = {};
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      parts.gpuVendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
      parts.gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      parts.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
  } catch {
    // من غير WebGL
  }
  try {
    parts.cores = navigator.hardwareConcurrency || 0;
    parts.memory = navigator.deviceMemory || 0;
    parts.screen = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
    parts.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    parts.touch = navigator.maxTouchPoints || 0;
    parts.platform = navigator.platform || '';
  } catch {
    // بيانات ناقصة
  }
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      const sample = 'mmmmmmmmmmlli1WQ@#عربي';
      ctx.font = '72px monospace';
      const base = ctx.measureText(sample).width;
      parts.fonts = FINGERPRINT_FONTS.filter((font) => {
        ctx.font = `72px '${font}', monospace`;
        return ctx.measureText(sample).width !== base;
      }).join(',');
    }
  } catch {
    // من غير canvas
  }
  fingerprintPartsCache = parts;
  return parts;
};

export const getClientFingerprint = () => {
  if (fingerprintCache) return fingerprintCache;
  try {
    const p = getClientFingerprintParts();
    const text = [p.gpuVendor, p.gpu, p.maxTexture, p.cores, p.memory, p.screen, p.timezone, p.touch, p.platform, p.fonts].join('|');
    fingerprintCache = text.replace(/\|/g, '') ? hash53(text) : '';
  } catch {
    fingerprintCache = '';
  }
  return fingerprintCache;
};

export { getDeviceId };

// على أي جهاز: F12 ← Console ← sstliDevice()
try {
  window.sstliDevice = () => ({ deviceId: getDeviceId(), fingerprint: getClientFingerprint(), ...getClientFingerprintParts() });
} catch {
  // مش في متصفح
}

const ascii = (value) => encodeURIComponent(String(value || '')).slice(0, 300);

const clientInfoHeaders = () => {
  const headers = {
    'X-Client-Device-Id': getDeviceId(),
    'X-Client-Screen': `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    'X-Client-Page': ascii(window.location.pathname),
    'X-Client-Fingerprint': getClientFingerprint()
  };
  if (clientHints.platform) headers['X-Client-Platform'] = ascii(clientHints.platform);
  if (clientHints.model) headers['X-Client-Model'] = ascii(clientHints.model);
  return headers;
};

const clearInvalidSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_branch');
};

// الجلسة انتهت (توكن قديم أو منتهي): نوديه لصفحة الدخول بدل ما يفضل
// واقف في الصفحة وكل الطلبات بترجع أخطاء. مرة واحدة بس حتى لو طلبات كتير رجعت 401.
let redirectingToLogin = false;
const LOGIN_PATH = `${process.env.PUBLIC_URL || ''}/login`;

const endSessionAndGoToLogin = () => {
  clearInvalidSession();

  if (redirectingToLogin || window.location.pathname.startsWith(LOGIN_PATH)) return;
  redirectingToLogin = true;

  window.dispatchEvent(new Event('sstli-auth-refreshed'));
  window.location.assign(`${LOGIN_PATH}?expired=1`);
};

// كل fetch متجه إلى api1 يحصل على التوكن تلقائياً، بدون تعديل عشرات الشاشات.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const originalUrl = typeof input === 'string'
    ? input
    : (input instanceof URL ? input.toString() : input?.url);
  const rawUrl = rewriteApi4Url(originalUrl);
  if (rawUrl !== originalUrl) {
    input = input instanceof Request ? new Request(rawUrl, input) : rawUrl;
  }
  const token = getToken();

  let requestInit = init;
  if (token && rawUrl && shouldAttachAuth(rawUrl)) {
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    requestInit = { ...init, headers };
  }

  try {
    const method = init.method || (input instanceof Request ? input.method : 'GET');
    if (rawUrl && shouldAttachClientInfo(rawUrl, method)) {
      const headers = new Headers(requestInit.headers || (input instanceof Request ? input.headers : undefined));
      Object.entries(clientInfoHeaders()).forEach(([key, value]) => {
        if (value && !headers.has(key)) headers.set(key, value);
      });
      requestInit = { ...requestInit, headers };
    }
  } catch {
    // بيانات الجهاز اختيارية
  }

  const response = await originalFetch(input, requestInit);

  if (response.status === 401 && token && rawUrl && shouldAttachAuth(rawUrl)) {
    // 401 = الجلسة نفسها غير صالحة. 403 لا يمسح الجلسة لأنه منع صلاحية فقط.
    // (بدون توكن أصلًا = صفحة عامة، مانحولوش لتسجيل الدخول.)
    endSessionAndGoToLogin();
  }

  return response;
};

axios.interceptors.request.use((config) => {
  if (config) {
    config.url = rewriteApi4Url(config.url);
    config.baseURL = rewriteApi4Url(config.baseURL);
  }
  const token = getToken();
  if (token && config?.url && shouldAttachAuth(config.url)) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  try {
    const full = config?.baseURL && config?.url && !/^https?:/i.test(config.url) ? config.baseURL + config.url : config?.url;
    if (full && shouldAttachClientInfo(full, config.method)) {
      config.headers = config.headers || {};
      Object.entries(clientInfoHeaders()).forEach(([key, value]) => {
        if (value && !config.headers[key]) config.headers[key] = value;
      });
    }
  } catch {
    // بيانات الجهاز اختيارية
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    if (status === 401 && getToken() && url && shouldAttachAuth(url)) {
      endSessionAndGoToLogin();
    }
    return Promise.reject(error);
  }
);

export { clearInvalidSession, getToken, shouldAttachAuth };
