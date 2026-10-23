// إدارة التعاقدات (P2P) — ثوابت مشتركة، الاتصال بالـ API، الألوان، والطباعة.
import { useMemo } from "react";
import { alpha, useTheme } from "@mui/material";
import Swal from "sweetalert2";

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
export const GREEN = "#057546";
export const GREEN_DARK = "#034d31";
export const BLUE = "#1565c0";
export const ORANGE = "#e65100";

export const CONTACT_METHODS = [
  { value: "field", label: "زيارة ميدانية" },
  { value: "phone", label: "اتصال هاتفي" },
  { value: "whatsapp", label: "واتساب" },
  { value: "email", label: "بريد إلكتروني" },
  { value: "online", label: "اجتماع عن بُعد" }
];

export const PURPOSES = [
  { value: "intro", label: "تعريف بالمعهد وخدماته" },
  { value: "needs", label: "دراسة احتياج تدريبي" },
  { value: "offer", label: "تقديم عرض فني/مالي" },
  { value: "followup", label: "متابعة" },
  { value: "contract", label: "تعاقد / توقيع" },
  { value: "other", label: "أخرى" }
];

export const RESULTS = [
  { value: "positive", label: "إيجابية", color: "success" },
  { value: "followup", label: "تحتاج متابعة", color: "info" },
  { value: "pending", label: "لم يُبت فيها", color: "warning" },
  { value: "negative", label: "سلبية", color: "error" }
];

export const STAGES = [
  { value: "new", label: "جديدة", color: "default" },
  { value: "offer_sent", label: "تم إرسال عرض", color: "info" },
  { value: "negotiation", label: "تفاوض", color: "warning" },
  { value: "won", label: "تم التعاقد", color: "success" },
  { value: "lost", label: "لم تتم", color: "error" }
];

export const REPORT_STATUS = {
  draft: { label: "مسودة", color: "default" },
  submitted: { label: "بانتظار المراجعة", color: "warning" },
  returned: { label: "معاد للاستكمال", color: "error" },
  reviewed: { label: "تمت المراجعة", color: "success" }
};

// ثالثًا: تقييم نتيجة كل زيارة
export const EVALUATION_QUESTIONS = [
  { key: "metResponsible", label: "هل تم مقابلة الشخص المسؤول عن التدريب أو التعاقدات؟" },
  { key: "introducedServices", label: "هل تم التعريف بخدمات المعهد وبرامجه التدريبية؟" },
  { key: "requestedOffer", label: "هل طلبت الشركة عرضًا فنيًا أو ماليًا؟" },
  { key: "hasTrainingNeeds", label: "هل توجد احتياجات تدريبية فعلية لدى الشركة؟" },
  { key: "gotContactData", label: "هل تم الحصول على بيانات مسؤول التدريب أو الموارد البشرية؟" },
  { key: "agreedNextStep", label: "هل تم الاتفاق على اجتماع أو خطوة تالية؟" }
];

export const labelOf = (list, value) => list.find((x) => x.value === value)?.label || value || "—";
export const colorOf = (list, value) => list.find((x) => x.value === value)?.color || "default";

export const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
export const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthStart = () => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
};
export const dayName = (iso) => {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][d.getDay()] || "";
};

export const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

// نطاق البيانات حسب الشاشة: شاشة الإدخال = بياناتي بس (mine)، شاشة التقارير = الكل (all).
let currentScope = "mine";
export const setP2PScope = (scope) => {
  currentScope = scope === "all" ? "all" : "mine";
};

// كل الطلبات لـ api4 (apiAuth بيضيف التوكن). userGuid بيتبعت للتوافق، والباك إند بيعتمد على التوكن.
export async function p2pApi(path, { method = "GET", body, query } = {}) {
  const params = new URLSearchParams({ userGuid: getUserGuid(), scope: currentScope, ...(query || {}) });
  [...params.keys()].forEach((k) => {
    const v = params.get(k);
    if (v === "" || v === "null" || v === "undefined") params.delete(k);
  });
  const url = `${API_BASE_URL}/api/p2p${path}?${params}`;
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify({ userGuid: getUserGuid(), ...body }) : undefined
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result?.message ||
        (response.status === 404 ? "خدمة إدارة التعاقدات غير متاحة على الخادم بعد (404)" : `حدث خطأ (${response.status})`)
    );
  }
  return result;
}

export const toast = (icon, title, text) =>
  Swal.fire({ icon, title, text, confirmButtonText: "حسنًا", confirmButtonColor: GREEN });

export const confirmBox = async (title, text, confirmButtonText = "تأكيد") =>
  (
    await Swal.fire({
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: "إلغاء",
      confirmButtonColor: GREEN,
      reverseButtons: true
    })
  ).isConfirmed;

// ألوان متوافقة مع الوضع الفاتح والداكن
export function useUi() {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  return useMemo(
    () => ({
      theme,
      dark,
      card: {
        borderRadius: 3,
        border: `1px solid ${alpha(dark ? "#67C99D" : GREEN, dark ? 0.22 : 0.14)}`,
        bgcolor: "background.paper",
        boxShadow: dark ? "none" : "0 6px 22px rgba(3,77,49,.06)"
      },
      headRow: {
        "& th": {
          fontWeight: 900,
          whiteSpace: "nowrap",
          color: dark ? "#d7f5e6" : GREEN_DARK,
          bgcolor: dark ? alpha("#67C99D", 0.14) : alpha(GREEN, 0.07),
          borderBottom: `1px solid ${alpha(dark ? "#67C99D" : GREEN, 0.25)}`
        }
      },
      bodyRow: {
        "& td": { borderColor: alpha(dark ? "#ffffff" : GREEN, 0.08) },
        "&:hover td": { bgcolor: alpha(dark ? "#67C99D" : GREEN, dark ? 0.06 : 0.035) }
      },
      soft: alpha(dark ? "#67C99D" : GREEN, dark ? 0.14 : 0.07),
      greenText: dark ? "#8fe0b8" : GREEN_DARK,
      primaryBtn: { fontWeight: 900, bgcolor: GREEN, color: "#fff", "&:hover": { bgcolor: GREEN_DARK } },
      dialogPaper: { borderRadius: { xs: 0, md: 3 }, bgcolor: "background.default", backgroundImage: "none" },
      sectionTitle: { fontWeight: 900, fontSize: 16, color: dark ? "#8fe0b8" : GREEN_DARK },
      badge: {
        width: 30,
        height: 30,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        fontSize: 14,
        flexShrink: 0,
        color: "#fff",
        background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})`,
        boxShadow: dark ? "none" : "0 4px 10px rgba(5,117,70,.25)"
      },
      inputBg: { "& .MuiOutlinedInput-root": { bgcolor: dark ? alpha("#ffffff", 0.03) : "#fff" } },
      muted: dark ? alpha("#ffffff", 0.04) : alpha(GREEN, 0.03)
    }),
    [theme, dark]
  );
}

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const box = (checked) => (checked ? "☑" : "☐");

// طباعة التقرير اليومي بنفس ترتيب النموذج الورقي
export function printReport(report) {
  const visits = report.visits || [];
  const opps = report.opportunities || [];
  const companiesVisited = new Set(visits.filter((v) => v.contactMethod === "field").map((v) => v.companyGuid)).size;
  const remote = visits.filter((v) => v.contactMethod !== "field").length;

  const visitRows = visits.length
    ? visits
        .map(
          (v, i) => `<tr><td>${i + 1}</td><td>${esc(v.companyName)}</td><td>${esc(v.personName)}</td><td>${esc(v.personTitle)}</td>
          <td>${esc(labelOf(CONTACT_METHODS, v.contactMethod))}</td>
          <td>${esc(labelOf(PURPOSES, v.purpose))}${v.purposeDetails ? `<br><small>${esc(v.purposeDetails)}</small>` : ""}</td>
          <td>${esc(labelOf(RESULTS, v.resultStatus))}${v.resultDetails ? `<br><small>${esc(v.resultDetails)}</small>` : ""}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="7" class="empty">لا توجد زيارات</td></tr>`;

  const evalRows = visits.length
    ? `<table><thead><tr><th>السؤال</th>${visits.map((v, i) => `<th>${i + 1}. ${esc(v.companyName)}</th>`).join("")}</tr></thead><tbody>
      ${EVALUATION_QUESTIONS.map(
        (q) => `<tr><td class="q">${esc(q.label)}</td>${visits.map((v) => `<td class="c">${v[q.key] ? "نعم" : "لا"}</td>`).join("")}</tr>`
      ).join("")}</tbody></table>`
    : `<p class="empty">لا توجد زيارات</p>`;

  const oppRows = opps.length
    ? opps
        .map(
          (o) => `<tr><td>${esc(o.companyName)}</td><td>${esc(o.trainingNeed)}</td><td>${esc(o.expectedTrainees ?? "")}</td>
          <td>${o.estimatedValue != null ? money(o.estimatedValue) : ""}</td><td>${esc(o.nextAction)}</td><td>${esc(o.followUpDate)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="6" class="empty">لا توجد فرص</td></tr>`;

  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير الزيارات اليومية - ${esc(report.employeeName)} - ${esc(report.reportDate)}</title>
<style>
@page { size: A4; margin: 12mm; }
body { font-family: "Cairo", "Segoe UI", Tahoma, Arial, sans-serif; color: #111; font-size: 12.5px; }
.head { text-align: center; border-bottom: 3px solid ${GREEN}; padding-bottom: 8px; margin-bottom: 10px; }
.head h1 { margin: 0; font-size: 18px; color: ${GREEN_DARK}; } .head h2 { margin: 4px 0 0; font-size: 15px; }
h3 { background: ${GREEN}; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 13.5px; margin: 14px 0 6px; }
table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #999; padding: 5px; vertical-align: top; }
th { background: #eef6f1; } td.c { text-align: center; } td.q { width: 40%; } .empty { text-align: center; color: #777; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; } .grid div b { color: ${GREEN_DARK}; }
.text { border: 1px solid #ccc; min-height: 26px; padding: 5px; border-radius: 4px; white-space: pre-wrap; }
.sign { display: flex; gap: 30px; margin-top: 8px; } small { color: #555; }
</style></head><body>
<div class="head"><h1>المعهد السعودي المتخصص العالي للتدريب</h1><h2>إدارة التعاقدات — تقرير الزيارات اليومية للشركات</h2></div>
<h3>أولًا: بيانات الموظف</h3>
<div class="grid"><div><b>اسم الموظف:</b> ${esc(report.employeeName)}</div><div><b>التاريخ:</b> ${esc(report.reportDate)}</div>
<div><b>اليوم:</b> ${esc(dayName(report.reportDate))}</div><div><b>حالة التقرير:</b> ${esc(REPORT_STATUS[report.status]?.label || report.status)}</div>
<div><b>إجمالي عدد الشركات التي تمت زيارتها:</b> ${companiesVisited}</div><div><b>إجمالي عدد الزيارات الهاتفية أو الإلكترونية:</b> ${remote}</div></div>
<h3>ثانيًا: تفاصيل زيارات الشركات</h3>
<table><thead><tr><th>م</th><th>اسم الشركة</th><th>اسم الشخص الذي تمت مقابلته</th><th>المسمى الوظيفي</th><th>وسيلة التواصل</th><th>الغرض من الزيارة</th><th>نتيجة الزيارة</th></tr></thead><tbody>${visitRows}</tbody></table>
<h3>ثالثًا: تقييم نتيجة كل زيارة</h3>${evalRows}
<h3>رابعًا: الفرص التعاقدية الناتجة عن الزيارات</h3>
<table><thead><tr><th>اسم الشركة</th><th>الاحتياج التدريبي أو التعاقدي</th><th>عدد المتدربين المتوقع</th><th>قيمة الفرصة التقديرية</th><th>الإجراء القادم</th><th>موعد المتابعة</th></tr></thead><tbody>${oppRows}</tbody></table>
<h3>خامسًا: المعوقات والملاحظات</h3>
<p><b>أهم المعوقات التي واجهت الموظف اليوم:</b></p><div class="text">${esc(report.obstacles)}</div>
<p><b>الشركات التي تحتاج إلى تدخل أو دعم من مدير الإدارة:</b></p><div class="text">${esc(report.needsManagerSupport)}</div>
<p><b>ملاحظات أو فرص جديدة:</b></p><div class="text">${esc(report.newOpportunities)}</div>
<h3>سادسًا: خطة اليوم التالي</h3>
<p><b>1. الشركات المستهدف زيارتها:</b></p><div class="text">${esc(report.planCompanies)}</div>
<p><b>2. الاتصالات والمتابعات المطلوب تنفيذها:</b></p><div class="text">${esc(report.planFollowUps)}</div>
<p><b>3. أهم هدف مطلوب تحقيقه:</b></p><div class="text">${esc(report.planMainGoal)}</div>
<h3>إقرار الموظف</h3>
<p>أقر بأن البيانات الواردة في التقرير تعكس الزيارات والمتابعات التي قمت بها خلال يوم العمل.</p>
<div class="sign"><div><b>اسم الموظف:</b> ${esc(report.declarationName || "")}</div><div><b>تاريخ الإرسال:</b> ${esc(report.submittedAt || "لم يُرسل")}</div></div>
<h3>مراجعة مدير إدارة التعاقدات</h3>
<p>${box(report.status === "reviewed")} تم الاطلاع على التقرير &nbsp;&nbsp; ${box(report.needsFollowUp)} مطلوب متابعة إضافية &nbsp;&nbsp; ${box(report.needsIntervention)} مطلوب تدخل من الإدارة</p>
<p><b>ملاحظات المدير:</b></p><div class="text">${esc(report.managerNotes)}</div>
<div class="sign"><div><b>المراجِع:</b> ${esc(report.reviewedByName || "")}</div><div><b>تاريخ المراجعة:</b> ${esc(report.reviewedAt || "")}</div></div>
<script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) {
    toast("warning", "تعذرت الطباعة", "اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
