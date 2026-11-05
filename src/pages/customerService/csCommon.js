// أدوات مشتركة لمركز خدمة العملاء — api/customer-service (CustomerServiceController).
// الأوقات راجعة بساعة السيرفر (GETDATE) ومعاها serverNow؛ toClient بيحوّلها لساعة جهاز المستخدم.
import { API_BASE_URL, getUserGuid, readJson } from "../tasks/tasksCommon";

export const CS_API = `${API_BASE_URL}/api/customer-service`;

export const csGet = async (path, params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  const query = new URLSearchParams({ userGuid: getUserGuid(), ...clean });
  return readJson(await fetch(`${CS_API}${path}?${query}`, { cache: "no-store" }));
};

export const csSend = async (path, body = {}, method = "POST") =>
  readJson(
    await fetch(`${CS_API}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userGuid: getUserGuid(), ...body })
    })
  );

export const csDelete = async (path) =>
  readJson(await fetch(`${CS_API}${path}?${new URLSearchParams({ userGuid: getUserGuid() })}`, { method: "DELETE" }));

export const TICKET_TYPES = {
  0: { label: "استفسار عام", color: "#2563eb" },
  1: { label: "استفسار دراسي", color: "#7c3aed" },
  2: { label: "شكوى", color: "#dc2626" }
};

export const CS_PRIORITY = {
  1: { label: "منخفضة", color: "#64748b" },
  2: { label: "عادية", color: "#2563eb" },
  3: { label: "عالية", color: "#d97706" },
  4: { label: "عاجلة", color: "#dc2626" }
};

export const GREEN = "#059669";
export const RED = "#dc2626";
export const AMBER = "#d97706";
export const PURPLE = "#7c3aed";

// فرق ساعة السيرفر عن ساعة الجهاز (بالملي ثانية)
export const skewOf = (serverNow) => {
  const t = serverNow ? new Date(serverNow).getTime() : NaN;
  return Number.isNaN(t) ? 0 : Date.now() - t;
};

export const toClient = (value, skew = 0) => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : new Date(t + skew);
};

const pad = (n) => String(n).padStart(2, "0");

export const fmtDate = (d) => (d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "—");

export const fmtTime = (d) => {
  if (!d) return "";
  const h = d.getHours();
  return `${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h < 12 ? "ص" : "م"}`;
};

export const fmtDateTime = (d) => (d ? `${fmtDate(d)} ${fmtTime(d)}` : "—");

// "منذ 5 دقائق" / "منذ 3 ساعات" / التاريخ
export const ago = (d) => {
  if (!d) return "";
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return fmtDate(d);
};

const span = (minutes) => {
  const m = Math.abs(minutes);
  if (m < 60) return `${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} ساعة`;
  return `${Math.round(h / 24)} يوم`;
};

// حالة مهلة الحل لتذكرة: النص واللون
export const slaState = (ticket) => {
  if (!ticket.isOpen) return { label: "مغلقة", color: GREEN };
  const left = ticket.minutesLeft;
  if (left === null || left === undefined) return { label: "بلا مهلة", color: "#64748b" };
  if (left < 0) return { label: `متأخرة ${span(left)}`, color: RED };
  if (left < 120) return { label: `متبقٍّ ${span(left)}`, color: AMBER };
  return { label: `متبقٍّ ${span(left)}`, color: GREEN };
};

export const escalationLabel = (level) => (level >= 2 ? "تصعيد إداري" : level === 1 ? "مصعّدة للمشرف" : "");

export const telHref = (tel) => (tel ? `tel:${String(tel).replace(/\s/g, "")}` : undefined);

export const whatsappHref = (tel) => {
  let digits = String(tel || "").replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("05")) digits = `966${digits.slice(1)}`;
  else if (digits.startsWith("5") && digits.length === 9) digits = `966${digits}`;
  return `https://wa.me/${digits}`;
};
