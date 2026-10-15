import { useCallback, useEffect, useState } from "react";

// إضافات مكتب الاستقبال وشئون الطلاب (VIP / طلب نقل وتحويل / مرفقات الملف التدريبي).
// الباك إند: api/reception-extras (ReceptionExtrasController).
export const RECEPTION_EXTRAS_API =
  `${process.env.REACT_APP_API_URL || "https://api4.sstli.com"}/api/reception-extras`;

export const getCurrentUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || "").trim();
  } catch {
    return "";
  }
};

export const readApiJson = async (response) => {
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || result?.error || "حدث خطأ أثناء الاتصال بالسيرفر");
  }
  return result;
};

const normalizeNationalId = (value) => String(value ?? "").replace(/\D+/g, "");
const normalizeGuid = (value) => String(value ?? "").trim().toLowerCase();

// ===== علامة VIP =====
// كاش مشترك لكل الشاشات (الطلب بيتعمل مرة واحدة ويتجدد كل دقيقتين).
const VIP_TTL_MS = 2 * 60 * 1000;
let vipCache = null;
let vipPromise = null;
const vipListeners = new Set();

// confirmed = عملاء VIP اللي اتأكدوا من قائمة عملاء VIP في المبيعات (حالة "مؤكد") => دول بس ليهم العلامة.
// requested = أي طلب VIP (مؤكد أو لسه في المبيعات، مش مرفوض) => عشان ما يتعملش طلب مكرر.
const isConfirmedStatus = (status) => String(status ?? "").trim() === "مؤكد";

const buildVipLookup = (rows = []) => {
  const confirmed = { nationalIds: new Set(), accountGuids: new Set() };
  const requested = { nationalIds: new Set(), accountGuids: new Set() };
  rows.forEach((row) => {
    const nid = normalizeNationalId(row?.nationalId);
    const guid = normalizeGuid(row?.accountGuid);
    // الطلب المرفوض ما يمنعش طلب جديد
    if (String(row?.status ?? "").trim() === "مرفوض") return;
    const targets = isConfirmedStatus(row?.status) ? [confirmed, requested] : [requested];
    targets.forEach((set) => {
      if (nid) set.nationalIds.add(nid);
      if (guid) set.accountGuids.add(guid);
    });
  });
  return { confirmed, requested, loadedAt: Date.now() };
};

export const loadVipFlags = async ({ force = false } = {}) => {
  if (!force && vipCache && Date.now() - vipCache.loadedAt < VIP_TTL_MS) return vipCache;
  if (!force && vipPromise) return vipPromise;

  const userGuid = getCurrentUserGuid();
  if (!userGuid) return buildVipLookup([]);

  vipPromise = (async () => {
    try {
      const params = new URLSearchParams({ userGuid });
      const response = await fetch(`${RECEPTION_EXTRAS_API}/vip-flags?${params.toString()}`, { cache: "no-store" });
      const result = await readApiJson(response);
      vipCache = buildVipLookup(result?.data || []);
    } catch {
      // فشل تحميل القائمة ما يوقفش الشاشة: الشاشة تشتغل عادي بدون علامات.
      vipCache = vipCache || buildVipLookup([]);
    } finally {
      vipPromise = null;
    }
    vipListeners.forEach((listener) => listener(vipCache));
    return vipCache;
  })();

  return vipPromise;
};

const matches = (set, row) => {
  if (!set || !row) return false;
  const nid = normalizeNationalId(row.nationalId ?? row.NationalId);
  if (nid && set.nationalIds.has(nid)) return true;
  const guid = normalizeGuid(row.accountGuid ?? row.AccountGuid);
  return Boolean(guid && set.accountGuids.has(guid));
};

// عميل VIP مؤكد (العلامة بتظهر بس للحالة دي)
export const isVipStudent = (lookup, row) => matches(lookup?.confirmed, row);

// عليه طلب VIP (مؤكد أو لسه في المبيعات)
export const hasVipRequest = (lookup, row) => matches(lookup?.requested, row);

// hook: isVip(row) = عميل VIP مؤكد، hasVipRequest(row) = عليه طلب VIP.
export const useVipLookup = () => {
  const [lookup, setLookup] = useState(vipCache);

  useEffect(() => {
    let alive = true;
    const listener = (next) => alive && setLookup(next);
    vipListeners.add(listener);
    loadVipFlags().then((next) => alive && setLookup(next));
    return () => {
      alive = false;
      vipListeners.delete(listener);
    };
  }, []);

  const isVip = useCallback((row) => isVipStudent(lookup, row), [lookup]);
  const hasRequest = useCallback((row) => hasVipRequest(lookup, row), [lookup]);
  return { isVip, hasVipRequest: hasRequest, loaded: Boolean(lookup) };
};

// ===== صلاحيات الإضافات =====
const permissionCache = new Map();

export const loadReceptionExtrasPermissions = async () => {
  const userGuid = getCurrentUserGuid();
  const empty = { vipConvert: false, transferRequest: false, attachmentAdd: false };
  if (!userGuid) return empty;

  const cached = permissionCache.get(userGuid);
  if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.value;

  try {
    const params = new URLSearchParams({ userGuid });
    const response = await fetch(`${RECEPTION_EXTRAS_API}/permissions?${params.toString()}`, { cache: "no-store" });
    const result = await readApiJson(response);
    const value = {
      vipConvert: result?.vipConvert === true,
      transferRequest: result?.transferRequest === true,
      attachmentAdd: result?.attachmentAdd === true
    };
    permissionCache.set(userGuid, { at: Date.now(), value });
    return value;
  } catch {
    return empty;
  }
};

export const useReceptionExtrasPermissions = () => {
  const [state, setState] = useState({
    loading: true,
    vipConvert: false,
    transferRequest: false,
    attachmentAdd: false
  });

  useEffect(() => {
    let alive = true;
    loadReceptionExtrasPermissions().then((value) => alive && setState({ loading: false, ...value }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
};
