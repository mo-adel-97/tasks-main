// تسجيل تنقل المستخدم بين الشاشات + محاولات فتح شاشات غير مسموحة (شاشة مراقبة الأمان).
// الهوية بتتحدد في السيرفر من التوكن نفسه، والجهاز من هيدرات apiAuth.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";

// System Admin (يوزر sa) — الوحيد اللي بيشوف شاشة مراقبة الأمان. السيرفر هو الحماية الحقيقية.
export const SECURITY_ADMIN_GUID = "f426653a-b389-4036-95f0-907920e7f205";

export const isSecurityAdmin = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim().toLowerCase() === SECURITY_ADMIN_GUID;
  } catch {
    return false;
  }
};

let last = { key: "", at: 0 };

// اسم الشاشة بالعربي زي ما هو في القائمة الجانبية (أطول مسار مطابق).
const FIXED_TITLES = {
  "/dashboard": "الرئيسية",
  "/dashboard/security-monitor": "مراقبة الأمان"
};

export const screenTitle = (path) => {
  const p = String(path || "").split("?")[0].toLowerCase().replace(/\/+$/, "") || "/";
  if (FIXED_TITLES[p]) return FIXED_TITLES[p];
  try {
    const cache = JSON.parse(localStorage.getItem("sstli_sidebar_config_v4") || "null");
    let best = null;
    (cache?.items || []).forEach((item) => {
      const route = String(item?.route || "").toLowerCase().replace(/\/+$/, "");
      const title = String(item?.title || "").trim();
      if (route && title && (p === route || p.startsWith(`${route}/`)) && (!best || route.length > best.route.length)) best = { route, title };
    });
    return best?.title || "";
  } catch {
    return "";
  }
};

// الصفحات اللي جوه PrivateRoute بتتسجل منه (فتح أو منع). الباقي بيسجله RouteTracker.
const guarded = new Set();
export const markGuarded = (path) => {
  guarded.add(path);
};

export const trackIfUnguarded = (path) => {
  setTimeout(() => {
    if (!guarded.has(path) && window.location.pathname === path) trackPage(`${path}${window.location.search || ""}`);
  }, 1500);
};

export const trackPage = (path, kind = "visit", detail) => {
  try {
    if (!path || !localStorage.getItem("token")) return;
    const key = `${kind}|${path}`;
    const now = Date.now();
    // نفس الشاشة خلال 5 ثواني (إعادة رسم / رجوع سريع) = مرة واحدة
    if (last.key === key && now - last.at < 5000) return;
    last = { key, at: now };

    fetch(`${API_BASE_URL}/api/security-monitor/track`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: String(path).slice(0, 300), kind, detail: detail || screenTitle(path) || undefined })
    }).catch(() => {});
  } catch {
    // التسجيل مايوقفش التطبيق
  }
};
