// إدارة الأصول: ثوابت ومساعدات مشتركة بين الشاشات (api/assets — AssetsController).
import { useEffect, useState } from "react";
import { getUserGuid, readJson } from "../tasks/tasksCommon";

export const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";
export const ASSETS_API = `${API_BASE_URL}/api/assets`;

export { getUserGuid };

export const ENTRY_STATUS = {
  Pending: { label: "قيد المراجعة", color: "#d97706" },
  Approved: { label: "معتمد", color: "#059669" },
  Rejected: { label: "مرفوض", color: "#dc2626" },
  Returned: { label: "مفتوح للتعديل", color: "#ea580c" },
  Deleted: { label: "محذوف", color: "#6b7280" }
};

export const EDIT_STATUS = {
  Pending: { label: "قيد المراجعة", color: "#d97706" },
  Done: { label: "تم التنفيذ", color: "#059669" },
  Unlocked: { label: "فُتح للفرع للتعديل", color: "#2563eb" },
  Rejected: { label: "مرفوض", color: "#dc2626" }
};

export const PURCHASE_STATUS = {
  Pending: { label: "بانتظار اعتماد عرض", color: "#d97706" },
  Approved: { label: "معتمد — بانتظار الشراء", color: "#2563eb" },
  Purchased: { label: "تم الشراء — بانتظار الحسابات", color: "#7c3aed" },
  Rejected: { label: "مرفوض", color: "#dc2626" },
  Cancelled: { label: "ملغى", color: "#6b7280" }
};

export const isPdf = (name) => /\.pdf$/i.test(String(name || ""));

export const ENTITY_LABEL = { Entry: "إضافة", Transfer: "نقل عهدة", Disposal: "تكهين" };

export const TRANSFER_STATUS = {
  Pending: { label: "بانتظار تأكيد الاستلام", color: "#0891b2" },
  Received: { label: "استلمها الفرع — بانتظار موافقة الحسابات", color: "#d97706" },
  Approved: { label: "تم النقل", color: "#059669" },
  Rejected: { label: "مرفوض", color: "#dc2626" },
  Cancelled: { label: "ملغى", color: "#6b7280" }
};

export const DISPOSAL_STATUS = {
  Pending: { label: "قيد المراجعة", color: "#d97706" },
  Approved: { label: "تم التكهين", color: "#475569" },
  Rejected: { label: "مرفوض", color: "#dc2626" },
  Cancelled: { label: "ملغى", color: "#6b7280" }
};

// العمليات اللي الإدارة بتفتحها وتقفلها من شاشة أصناف الأصول.
export const GATES = [
  { key: "add", label: "إضافة الأصناف الموجودة" },
  { key: "purchase", label: "طلبات الشراء" },
  { key: "transfer", label: "طلبات نقل العهدة" },
  { key: "disposal", label: "طلبات التكهين" }
];

export const ENTRY_TYPE = {
  Existing: { label: "موجود بالفعل", color: "#2563eb" },
  Purchase: { label: "شراء جديد", color: "#7c3aed" }
};

export const LOG_ACTION = {
  Created: "أضاف الطلب",
  Resubmitted: "عدّل الطلب وأرسله للمراجعة",
  Received: "أكّد استلام العهدة",
  Approved: "وافق",
  Rejected: "رفض",
  Cancelled: "ألغى الطلب",
  Deleted: "حذف الطلب",
  EditRequested: "طلب تعديل",
  EditRequestDone: "أغلق طلب التعديل",
  EditRequestRejected: "رفض طلب التعديل",
  Unlocked: "فتح الطلب للفرع للتعديل",
  AdminEdited: "عدّل العملية المعتمدة",
  AdminDeleted: "حذف العملية المعتمدة",
  AdminCancelled: "ألغى العملية المعتمدة",
  Purchased: "سجّل الشراء"
};

export const apiGet = async (path, params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  const query = new URLSearchParams({ userGuid: getUserGuid(), ...clean });
  return readJson(await fetch(`${ASSETS_API}${path}?${query}`, { cache: "no-store" }));
};

export const apiPost = async (path, body = {}) =>
  readJson(
    await fetch(`${ASSETS_API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userGuid: getUserGuid(), ...body })
    })
  );

export const apiPostForm = async (path, fields) => {
  const form = new FormData();
  form.append("userGuid", getUserGuid());
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    form.append(key, value);
  });
  return readJson(await fetch(`${ASSETS_API}${path}`, { method: "POST", body: form }));
};

export const fileUrl = (kind, guid) =>
  `${ASSETS_API}/files/${kind}/${guid}?userGuid=${encodeURIComponent(getUserGuid())}`;

// الصور بتتجاب بـ fetch (عشان التوكن يتبعت) وبتتحفظ في الذاكرة طول ما الصفحة مفتوحة.
const imageCache = new Map();

export const useAuthFile = (url) => {
  const [state, setState] = useState(() => ({ src: url ? imageCache.get(url) || "" : "", failed: false }));

  useEffect(() => {
    if (!url) {
      setState({ src: "", failed: false });
      return undefined;
    }
    if (imageCache.has(url)) {
      setState({ src: imageCache.get(url), failed: false });
      return undefined;
    }
    let alive = true;
    setState({ src: "", failed: false });
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        imageCache.set(url, objectUrl);
        if (alive) setState({ src: objectUrl, failed: false });
      })
      .catch(() => alive && setState({ src: "", failed: true }));
    return () => {
      alive = false;
    };
  }, [url]);

  return state;
};

// فتح الفاتورة في تاب جديدة (بالتوكن).
export const openAuthFile = async (url) => {
  const win = window.open("", "_blank");
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("تعذر فتح الملف");
    const objectUrl = URL.createObjectURL(await r.blob());
    if (win) win.location.href = objectUrl;
    else window.location.href = objectUrl;
  } catch (e) {
    if (win) win.close();
    throw e;
  }
};

export const money = (value) =>
  Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const qtyText = (value) => Number(value || 0).toLocaleString("en-US");

export const MAX_IMAGE_MB = 8;
export const MAX_INVOICE_MB = 15;
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif";
export const INVOICE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export const checkFile = (file, maxMb, accept, label) => {
  if (!file) return "";
  const ext = `.${String(file.name.split(".").pop() || "").toLowerCase()}`;
  if (!accept.split(",").includes(ext)) return `نوع ملف ${label} غير مسموح`;
  if (file.size > maxMb * 1024 * 1024) return `ملف ${label} أكبر من ${maxMb} ميجابايت`;
  return "";
};

// قراءة tab من الرابط (?tab=...) — الإشعارات بتفتح الشاشة على التاب الصح.
export const tabFromUrl = (allowed, fallback) => {
  try {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return allowed.includes(tab) ? tab : fallback;
  } catch {
    return fallback;
  }
};
