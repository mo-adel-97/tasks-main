// نظام المهام: ثوابت ومساعدات مشتركة بين الشاشات (api/tasks — TasksController).
import { alpha, lighten, useTheme } from "@mui/material/styles";

export const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";
export const TASKS_API = `${API_BASE_URL}/api/tasks`;

export const STATUS = {
  New: { label: "جديدة", color: "#2563eb" },
  InProgress: { label: "قيد التنفيذ", color: "#d97706" },
  InReview: { label: "بانتظار المراجعة", color: "#7c3aed" },
  Returned: { label: "مُعادة للتعديل", color: "#ea580c" },
  Done: { label: "مكتملة", color: "#059669" },
  Rejected: { label: "اعتذر عنها", color: "#dc2626" },
  Cancelled: { label: "ملغاة", color: "#6b7280" }
};

// حالة المهمة كلها (عند المرسل). Closed بتتقسم: كل المستلمين أنجزوا = مكتملة، غير كده = منتهية جزئيًا.
export const TASK_STATUS = {
  Open: { label: "جارية", color: "#2563eb" },
  Completed: { label: "مكتملة", color: "#059669" },
  Partial: { label: "منتهية جزئيًا", color: "#b45309" },
  Closed: { label: "منتهية", color: "#059669" },
  Cancelled: { label: "ملغاة", color: "#6b7280" }
};

// doneCount / total لو معروفين (قائمة المرسلة أو لوحة المرسل)؛ من غيرهم Closed تفضل "منتهية".
export const taskStatusKey = (status, doneCount, total) => {
  if (status !== "Closed") return status;
  if (total == null || doneCount == null) return "Closed";
  return total > 0 && doneCount >= total ? "Completed" : "Partial";
};

export const PRIORITY = {
  1: { label: "منخفضة", color: "#6b7280" },
  2: { label: "عادية", color: "#2563eb" },
  3: { label: "مهمة", color: "#d97706" },
  4: { label: "عاجلة", color: "#dc2626" }
};

export const OVERDUE_COLOR = "#dc2626";
export const OPEN_STATUSES = ["New", "InProgress", "Returned"];

// ألوان الشاشة من الثيم نفسه (فاتح / داكن) بدل ألوان ثابتة.
export const useTasksPalette = () => {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const surfaces = theme.palette.surfaces || {};
  const borders = theme.palette.borders || {};
  return {
    dark,
    primary: theme.palette.primary.main,
    onPrimary: theme.palette.primary.contrastText || "#fff",
    page: surfaces.page || theme.palette.background.default,
    section: surfaces.section || theme.palette.background.paper,
    card: surfaces.card || theme.palette.background.paper,
    nested: surfaces.nested || theme.palette.action.hover,
    hover: surfaces.hover || theme.palette.action.hover,
    selected: surfaces.selected || theme.palette.action.selected,
    border: borders.subtle || theme.palette.divider,
    borderStrong: borders.standard || theme.palette.divider,
    text: theme.palette.text.primary,
    muted: theme.palette.text.secondary,
    // الأزرار الأساسية: في الداكن الأخضر الفاتح للثيم مع نص أبيض (من rtl-forms-fix) بيبقى باهت
    containedSx: dark
      ? {
          "& .MuiButton-contained:not(.MuiButton-containedError):not(.MuiButton-containedWarning)": {
            backgroundColor: "#2e8b5f",
            color: "#ffffff",
            "&:hover": { backgroundColor: "#277a52" },
            "&.Mui-disabled": { backgroundColor: "rgba(103,201,157,.14)", color: "rgba(233,243,238,.45)" }
          }
        }
      : {},
    // لون "ناعم" لأي حالة: خلفية خفيفة + نص واضح في الوضعين
    tone: (color) =>
      dark
        ? { fg: lighten(color, 0.45), bg: alpha(color, 0.2), border: alpha(color, 0.45) }
        : { fg: color, bg: alpha(color, 0.09), border: alpha(color, 0.3) }
  };
};

export const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || "").trim();
  } catch {
    return "";
  }
};

export const readJson = async (response) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(json?.message || "حدث خطأ، يرجى المحاولة مرة أخرى");
    error.status = response.status;
    throw error;
  }
  return json;
};

export const apiGet = async (path, params = {}) => {
  const query = new URLSearchParams({ userGuid: getUserGuid(), ...params });
  return readJson(await fetch(`${TASKS_API}${path}?${query}`, { cache: "no-store" }));
};

export const apiPost = async (path, body) =>
  readJson(
    await fetch(`${TASKS_API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userGuid: getUserGuid(), ...body })
    })
  );

export const apiPostForm = async (path, fields, files = []) => {
  const form = new FormData();
  form.append("userGuid", getUserGuid());
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  files.forEach((file) => form.append("files", file));
  return readJson(await fetch(`${TASKS_API}${path}`, { method: "POST", body: form }));
};

export const attachmentUrl = (guid) =>
  `${TASKS_API}/attachments/${guid}?userGuid=${encodeURIComponent(getUserGuid())}`;

const pad = (n) => String(n).padStart(2, "0");

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours();
  return `${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h < 12 ? "صباحًا" : "مساءً"}`;
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(value)} ${formatTime(value)}`;
};

// العدد مع المعدود بالفصحى: ساعة واحدة / ساعتان / 3 ساعات / 11 ساعة
const countText = (n, one, two, few, many) => {
  if (n <= 1) return one;
  if (n === 2) return two;
  if (n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
};

export const durationText = (ms) => {
  const hours = Math.max(1, Math.round(ms / 36e5));
  if (hours < 24) return countText(hours, "ساعة واحدة", "ساعتان", "ساعات", "ساعة");
  const days = Math.round(hours / 24);
  return countText(days, "يوم واحد", "يومان", "أيام", "يومًا");
};

// "متبقٍّ يومان" / "متأخرة 3 ساعات"
export const dueText = (dueAt) => {
  if (!dueAt) return "";
  const diff = new Date(dueAt).getTime() - Date.now();
  return diff >= 0 ? `متبقٍّ ${durationText(diff)}` : `متأخرة ${durationText(-diff)}`;
};

export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// datetime-local ⇄ وقت محلي (من غير تحويل للـ UTC)
export const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ك.ب`;
  return `${(bytes / 1024 / 1024).toFixed(1)} م.ب`;
};

export const MAX_FILE_MB = 25;
export const ACCEPT_FILES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z,.mp3,.mp4,.m4a";

export const checkFiles = (files) => {
  const big = files.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
  if (big) return `حجم الملف ${big.name} يتجاوز ${MAX_FILE_MB} ميجابايت`;
  if (files.length > 10) return "الحد الأقصى 10 ملفات في المرة الواحدة";
  return "";
};
