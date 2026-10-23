// معاينة الترحيل لشيت المكافآت (عمولات التحصيل / المسوقين):
// قبل التأكيد بتظهر مين هيترحّل ومين لأ والسبب، عشان محدش يتفاجئ بعد الترحيل.

export const STATUS = {
  ok: { label: "هيترحّل", color: "#166534", bg: "#dcfce7" },
  update: { label: "هيتحدّث", color: "#1e40af", bg: "#dbeafe" },
  zero: { label: "عمولة صفر", color: "#475569", bg: "#f1f5f9" },
  warn: { label: "هيترحّل — انتبه", color: "#92400e", bg: "#fef3c7" },
  exists: { label: "مش هيتحدّث", color: "#9a3412", bg: "#ffedd5" },
  skip: { label: "مش هيترحّل", color: "#991b1b", bg: "#fee2e2" },
  missing: { label: "مش في التقرير", color: "#7f1d1d", bg: "#fecaca" }
};

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const money = (value) =>
  value === null || value === undefined || value === "" ? "—" : Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

export const fetchMigrationPreview = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || "تعذر تجهيز معاينة الترحيل");
  return result?.data || { summary: {}, rows: [] };
};

// السطور اللي محتاجة انتباه: كل حاجة غير "هيترحّل" العادي
export const attentionRows = (preview) => (preview?.rows || []).filter((r) => r.status !== "ok");

const table = (rows) => `
  <div style="max-height:340px;overflow:auto;border:1px solid #e2e8f0;border-radius:10px;margin-top:10px">
    <table style="width:100%;border-collapse:collapse;font-size:12.5px">
      <thead style="position:sticky;top:0;background:#f8fafc">
        <tr>
          <th style="padding:7px;text-align:right;border-bottom:1px solid #e2e8f0">الاسم</th>
          <th style="padding:7px;text-align:center;border-bottom:1px solid #e2e8f0">المبلغ</th>
          <th style="padding:7px;text-align:center;border-bottom:1px solid #e2e8f0">الحالة</th>
          <th style="padding:7px;text-align:right;border-bottom:1px solid #e2e8f0">السبب</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((r) => {
            const s = STATUS[r.status] || STATUS.skip;
            return `<tr>
              <td style="padding:6px 7px;border-bottom:1px solid #f1f5f9;font-weight:700">${esc(r.name)}${r.branch ? `<div style="font-size:11px;color:#64748b;font-weight:600">${esc(r.branch)}</div>` : ""}</td>
              <td style="padding:6px 7px;border-bottom:1px solid #f1f5f9;text-align:center;direction:ltr">${money(r.amount)}</td>
              <td style="padding:6px 7px;border-bottom:1px solid #f1f5f9;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:999px;font-weight:800;font-size:11px;color:${s.color};background:${s.bg};white-space:nowrap">${s.label}</span></td>
              <td style="padding:6px 7px;border-bottom:1px solid #f1f5f9;line-height:1.6">${esc(r.reason)}</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </div>`;

export const previewHtml = (preview, period) => {
  const s = preview?.summary || {};
  const rows = attentionRows(preview);
  const notMigrated = rows.filter((r) => !r.willMigrate);
  return `
    <div style="direction:rtl;font-family:Cairo,Arial;text-align:right">
      <div style="margin-bottom:8px">الفترة: <b>${esc(period)}</b></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px;padding:10px;border-radius:10px;background:#dcfce7;color:#166534">
          <div style="font-size:12px;font-weight:700">هيترحّل</div>
          <div style="font-size:20px;font-weight:900">${s.willMigrate ?? 0} سطر — ${money(s.willMigrateAmount)}</div>
        </div>
        <div style="flex:1;min-width:180px;padding:10px;border-radius:10px;background:${notMigrated.length ? "#fee2e2" : "#f1f5f9"};color:${notMigrated.length ? "#991b1b" : "#475569"}">
          <div style="font-size:12px;font-weight:700">مش هيترحّل</div>
          <div style="font-size:20px;font-weight:900">${s.notMigrated ?? 0} سطر${s.notMigratedAmount ? ` — ${money(s.notMigratedAmount)}` : ""}</div>
        </div>
      </div>
      ${
        rows.length
          ? `<div style="margin-top:12px;font-weight:900">مين مش هيترحّل أو محتاج انتباه وليه:</div>${table(rows)}`
          : `<div style="margin-top:12px;font-weight:800;color:#166534">كل السطور هتترحّل بدون ملاحظات.</div>`
      }
    </div>`;
};

export const notMigratedHtml = (preview) => {
  const rows = attentionRows(preview).filter((r) => !r.willMigrate || r.status === "warn");
  return rows.length
    ? `<div style="direction:rtl;font-family:Cairo,Arial;text-align:right;margin-top:12px">
         <div style="font-weight:900;color:#991b1b">اتبقّى بدون ترحيل أو محتاج مراجعة:</div>${table(rows)}
       </div>`
    : "";
};
