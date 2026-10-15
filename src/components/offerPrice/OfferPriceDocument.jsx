import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  OFFER_MODE_TRAINEES,
  hijriDateText,
  issueNoText,
  moneyText,
  multilineLines,
  offerVerifyUrl,
  parseBoldLine,
  percentText,
  qtyText,
  toNum
} from "./offerPriceCalc";

/*
  مستند عرض السعر (A4) — تصميم حديث بتنسيق متدفق:
  كل جزء بياخد مساحته، والجداول الطويلة بتتقسم على أكتر من صفحة،
  والتوقيع والختم وQR التحقق في بلوك واحد آخر المحتوى.
  المحتوى والنصوص والحسابات نفس عرض السعر في الديسكتوب.
*/

export const PAGE_W = 827;
export const PAGE_H = 1169;

const ASSET = `${process.env.PUBLIC_URL || ""}/offer-price`;
const FONT = "'Cairo', 'Noto Kufi Arabic', Tahoma, Arial, sans-serif";

const C = {
  primary: "#057546",
  primaryDark: "#034d31",
  primarySoft: "#e8f4ee",
  border: "#d3e2da",
  zebra: "#f6faf8",
  text: "#1c2a24",
  muted: "#5d6f66",
  gold: "#b08d3c"
};

// نفس نسب صور الهيدر والفوتر الأصلية (827×150 و 827×135) علشان ما تتمطّش.
const HEADER_TOP = 12;
const HEADER_H = 150;
const FOOTER_H = 135;
const CONTENT_TOP = HEADER_TOP + HEADER_H + 6;
const CONTENT_BOTTOM = FOOTER_H + 16;

// صفوف الجدول في الصفحة: صفحة فيها الشروط والتوقيع / صفحة جدول بس.
const ROWS_WITH_TAIL = 6;
const ROWS_FULL_PAGE = 16;

// ===================== أدوات العرض =====================

const sar = (value) => `${moneyText(value)} ر.س`;

const chunkRows = (rows, withTail = ROWS_WITH_TAIL, full = ROWS_FULL_PAGE) => {
  const remaining = [...rows];
  const chunks = [];
  while (remaining.length > withTail) {
    chunks.push(remaining.splice(0, Math.min(full, remaining.length - 1)));
  }
  chunks.push(remaining);
  return chunks;
};

// تقسيم متن الخطاب لفقرات (السطور الفاضية بتفصل الفقرات)، والسطر المعلّم Bold بيبقى لوحده.
const toParagraphs = (value) => {
  const paragraphs = [];
  let current = [];
  const flush = () => {
    if (current.length) paragraphs.push({ text: current.join(" "), bold: false });
    current = [];
  };

  multilineLines(value).forEach((line) => {
    if (!line.trim()) {
      flush();
      return;
    }
    const parsed = parseBoldLine(line);
    if (parsed.bold) {
      flush();
      paragraphs.push(parsed);
    } else {
      current.push(parsed.text);
    }
  });
  flush();
  return paragraphs;
};

// البنود (الشروط): كل سطر بند، والعلامة • في الأول بتتشال لأن القائمة ليها علامتها.
const toTerms = (...values) =>
  values
    .flatMap((v) => multilineLines(v))
    .filter((line) => line.trim())
    .map((line) => {
      const parsed = parseBoldLine(line);
      return { ...parsed, text: parsed.text.replace(/^[•\-–*]\s*/, "") };
    });

// ===================== أجزاء الصفحة =====================

const Page = React.forwardRef(({ children, pageNo, pageCount, plain = false }, ref) => (
  <div
    ref={ref}
    className="offer-price-page"
    dir="rtl"
    style={{
      position: "relative",
      width: PAGE_W,
      height: PAGE_H,
      background: "#fff",
      overflow: "hidden",
      flexShrink: 0,
      fontFamily: FONT,
      color: C.text
    }}
  >
    {plain ? (
      children
    ) : (
      <>
        <img
          alt=""
          src={`${ASSET}/watermark.png`}
          crossOrigin="anonymous"
          style={{ position: "absolute", left: (PAGE_W - 520) / 2, top: (PAGE_H - 520) / 2, width: 520, height: 520, objectFit: "contain", opacity: 0.06 }}
        />
        <img
          alt=""
          src={`${ASSET}/header.png`}
          crossOrigin="anonymous"
          style={{ position: "absolute", left: 0, top: HEADER_TOP, width: PAGE_W, height: HEADER_H, objectFit: "fill" }}
        />
        <img
          alt=""
          src={`${ASSET}/footer.png`}
          crossOrigin="anonymous"
          style={{ position: "absolute", left: 0, bottom: 0, width: PAGE_W, height: FOOTER_H, objectFit: "fill" }}
        />
        <div
          style={{
            position: "absolute",
            top: CONTENT_TOP,
            bottom: CONTENT_BOTTOM,
            left: 52,
            right: 52,
            display: "flex",
            flexDirection: "column"
          }}
        >
          {children}
        </div>
        {pageNo ? (
          <div
            style={{
              position: "absolute",
              bottom: FOOTER_H + 2,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 10.5,
              color: C.muted,
              fontWeight: 600
            }}
          >
            صفحة {pageNo} من {pageCount}
          </div>
        ) : null}
      </>
    )}
  </div>
));

const SectionTitle = ({ children }) => (
  <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 14px" }}>
    <div
      style={{
        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
        color: "#fff",
        fontWeight: 700,
        fontSize: 18,
        padding: "6px 26px",
        borderRadius: 999,
        lineHeight: 1.6,
        maxWidth: "92%",
        textAlign: "center"
      }}
    >
      {children}
    </div>
  </div>
);

const SubTitle = ({ children }) => (
  <div style={{ fontWeight: 700, fontSize: 14, color: C.primaryDark, margin: "4px 0 6px", lineHeight: 1.7 }}>{children}</div>
);

const Lines = ({ value, size = 13 }) =>
  multilineLines(value).map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
    const parsed = parseBoldLine(line);
    return (
      <div key={i} style={{ fontSize: size, lineHeight: 1.8, fontWeight: parsed.bold ? 700 : 400 }}>
        {parsed.text}
      </div>
    );
  });

const TermsBox = ({ title, terms, markItems = false }) =>
  terms.length ? (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRight: `4px solid ${C.primary}`,
        background: "rgba(232,244,238,.55)",
        borderRadius: 10,
        padding: "10px 16px",
        marginTop: 12
      }}
    >
      {title ? <div style={{ fontWeight: 700, fontSize: 14, color: C.primaryDark, marginBottom: 4 }}>{title}</div> : null}
      {terms.map((term, i) => (
        <div key={i} data-m-term={markItems ? i : undefined} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, lineHeight: 1.75, fontWeight: term.bold ? 700 : 400 }}>
          <span style={{ color: C.primary, fontWeight: 700, flexShrink: 0 }}>●</span>
          <span>{term.text}</span>
        </div>
      ))}
    </div>
  ) : null;

const Thanks = ({ children }) => (
  <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14, color: C.primaryDark, margin: "14px 0 4px", wordSpacing: 4 }}>{children}</div>
);

// التوقيع + الختم + QR التحقق في بلوك واحد.
const SignatureBlock = ({ code }) => (
  <div style={{ marginTop: "auto", paddingTop: 10 }}>
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(255,255,255,.92)"
      }}
    >
      <div
        style={{
          background: C.primarySoft,
          color: C.primaryDark,
          fontWeight: 700,
          fontSize: 13.5,
          textAlign: "center",
          padding: "5px 0",
          borderBottom: `1px solid ${C.border}`
        }}
      >
        المعهد السعودي المتخصص العالي للتدريب
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 150px", alignItems: "stretch" }}>
        <div style={{ padding: "8px 12px", textAlign: "center", borderLeft: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.muted }}>التوقيع</div>
          <img alt="" src={`${ASSET}/sign.png`} crossOrigin="anonymous" style={{ width: 180, height: 70, objectFit: "contain", display: "block", margin: "6px auto 0" }} />
        </div>
        <div style={{ padding: "8px 12px", textAlign: "center", borderLeft: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.muted }}>الختم</div>
          <img alt="" src={`${ASSET}/stamp.jpeg`} crossOrigin="anonymous" style={{ width: 190, height: 92, objectFit: "contain", display: "block", margin: "2px auto 0" }} />
        </div>
        <div style={{ padding: "10px 8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <div style={{ background: "#fff", padding: 4, borderRadius: 6, border: `1px solid ${C.border}`, lineHeight: 0 }}>
            <QRCodeCanvas value={offerVerifyUrl(code)} size={84} level="M" marginSize={0} />
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted }}>فحص موثوقية العرض</div>
        </div>
      </div>
    </div>
  </div>
);

const cellBase = {
  border: `1px solid ${C.border}`,
  padding: "7px 4px",
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: 1.45,
  wordBreak: "break-word"
};

const DataTable = ({ columns, rows, totalRow, startIndex = 0, showIndex = true }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      tableLayout: "fixed",
      fontSize: 12,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflow: "hidden"
    }}
  >
    <colgroup>
      {showIndex ? <col style={{ width: 34 }} /> : null}
      {columns.map((c, i) => (
        <col key={i} style={{ width: c.width }} />
      ))}
    </colgroup>
    <thead>
      <tr>
        {showIndex ? <th style={{ ...cellBase, background: C.primary, color: "#fff", fontWeight: 700 }}>#</th> : null}
        {columns.map((c, i) => (
          <th key={i} style={{ ...cellBase, background: C.primary, color: "#fff", fontWeight: 700, fontSize: 11.5 }}>
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((cells, r) => (
        <tr key={r} style={{ background: r % 2 ? C.zebra : "#fff" }}>
          {showIndex ? <td style={{ ...cellBase, color: C.muted, fontWeight: 600 }}>{startIndex + r + 1}</td> : null}
          {cells.map((value, i) => (
            <td
              key={i}
              style={{
                ...cellBase,
                fontWeight: columns[i].strong ? 700 : 500,
                textAlign: columns[i].align || "center",
                direction: columns[i].ltr ? "ltr" : "rtl",
                whiteSpace: columns[i].nowrap ? "nowrap" : "normal",
                fontSize: columns.length > 7 ? 11 : 12
              }}
            >
              {value}
            </td>
          ))}
        </tr>
      ))}
      {totalRow ? (
        <tr style={{ background: C.primarySoft }}>
          {showIndex ? <td style={{ ...cellBase, fontWeight: 700 }} /> : null}
          {totalRow.map((value, i) => (
            <td key={i} style={{ ...cellBase, fontWeight: 700, color: C.primaryDark, whiteSpace: "nowrap", fontSize: columns.length > 7 ? 11 : 12 }}>
              {value}
            </td>
          ))}
        </tr>
      ) : null}
    </tbody>
  </table>
);

// ===================== حسابات الأسطر (نفس التقرير) =====================

const serviceNumbers = (r) => {
  let qty = toNum(r.offerQty, 1);
  if (qty <= 0) qty = 1;
  let unit = toNum(r.priceBeforeDiscount);
  if (unit <= 0 && toNum(r.offerSubtotal) > 0) unit = Math.round((toNum(r.offerSubtotal) / qty) * 100) / 100;
  if (unit <= 0) unit = toNum(r.offerCost);
  const before = Math.round(qty * unit * 100) / 100;
  const discount = Math.min(100, Math.max(0, toNum(r.discountValue)));
  let after = toNum(r.priceAfterDiscount, -1);
  if (after < 0 || after > before) after = Math.round(before * (1 - discount / 100) * 100) / 100;
  after = Math.max(0, after);
  const paid = Math.max(0, toNum(r.paidAmount));
  let remaining = toNum(r.remainingAmount, -1);
  if (remaining < 0 || (remaining === 0 && after > paid)) remaining = after - paid;
  remaining = Math.max(0, Math.round(remaining * 100) / 100);
  return { qty, unit, before, discount, after, paid, remaining };
};

const traineeNumbers = (r) => {
  const before = toNum(r.priceBeforeDiscount);
  const discount = Math.round(toNum(r.discountValue));
  let after = toNum(r.priceAfterDiscount, -1);
  if (after < 0 && before > 0) after = Math.round(before * (1 - discount / 100) * 100) / 100;
  after = Math.max(0, after);
  const paid = Math.max(0, toNum(r.paidAmount));
  let remaining = toNum(r.remainingAmount, -1);
  if (remaining < 0) remaining = after - paid;
  return { before, discount, after, paid, remaining: Math.max(0, remaining) };
};

// ===================== الصفحات =====================

const LetterPage = React.forwardRef(({ doc, pageNo, pageCount }, ref) => {
  const t = doc.texts;
  return (
    <Page ref={ref} pageNo={pageNo} pageCount={pageCount}>
      <SectionTitle>{doc.offerTitle || "عرض سعر"}</SectionTitle>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.7 }}>{parseBoldLine(t.page1Recipient).text}</div>
          <div style={{ fontSize: 14, lineHeight: 1.9, marginTop: 6 }}>{parseBoldLine(t.page1Greeting).text}</div>
          <div style={{ fontSize: 14, lineHeight: 1.9 }}>{parseBoldLine(t.page1AfterGreeting).text}</div>
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", minWidth: 210, fontSize: 12.5, flexShrink: 0 }}>
          {[
            ["التاريخ", hijriDateText()],
            ["صادر رقم", issueNoText(doc.code)]
          ].map(([label, value], i) => (
            <div key={label} style={{ display: "flex", borderTop: i ? `1px solid ${C.border}` : "none" }}>
              <div style={{ background: C.primarySoft, color: C.primaryDark, fontWeight: 700, padding: "6px 10px", width: 80 }}>{label}</div>
              <div style={{ padding: "6px 10px", fontWeight: 600, flex: 1, textAlign: "center" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {toParagraphs(t.page1Body).map((p, i) => (
        <p key={i} style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 2, fontWeight: p.bold ? 700 : 400 }}>
          {p.text}
        </p>
      ))}

      {t.page1BoldClosing?.trim() ? (
        <div style={{ marginTop: 6, fontSize: 14.5, fontWeight: 700, color: C.primaryDark, lineHeight: 1.9 }}>
          {parseBoldLine(t.page1BoldClosing).text}
        </div>
      ) : null}
      {t.page1Thanks?.trim() ? <Thanks>{parseBoldLine(t.page1Thanks).text}</Thanks> : null}

      {isShown(doc, "signature") ? <SignatureBlock code={doc.code} /> : null}
    </Page>
  );
});

const InfoTexts = ({ t }) => {
  const before = t.page2BeforeInfoTitle?.trim() || multilineLines(t.page2BeforeInfoText).length;
  const after = t.page2AfterInfoTitle?.trim() || multilineLines(t.page2AfterInfoText).length;
  return (
    <>
      {before ? (
        <div style={{ marginTop: 12 }}>
          {t.page2BeforeInfoTitle?.trim() ? <SubTitle>{parseBoldLine(t.page2BeforeInfoTitle).text}</SubTitle> : null}
          <Lines value={t.page2BeforeInfoText} />
        </div>
      ) : null}
      {after ? (
        <div style={{ marginTop: 8 }}>
          {t.page2AfterInfoTitle?.trim() ? <SubTitle>{parseBoldLine(t.page2AfterInfoTitle).text}</SubTitle> : null}
          <Lines value={t.page2AfterInfoText} />
        </div>
      ) : null}
    </>
  );
};

// fixed = عمود ثابت مايتشالش من "إظهار / إخفاء".
const SUMMARY_COLUMNS = [
  { key: "name", label: "البيان", width: 260, strong: true, align: "right", fixed: true },
  { key: "unit", label: "الوحدة", width: 80 },
  { key: "qty", label: "الكمية", width: 70 },
  { key: "unitPrice", label: "سعر الوحدة (شامل الضريبة)", width: 130 },
  { key: "total", label: "الإجمالي (شامل الضريبة)", width: 130, strong: true }
];

// مجموع العرض + عمود الترقيم (34) لازم ما يزيدش عن عرض المحتوى (723).
const DETAILS_COLUMNS = [
  { key: "name", label: "البيان", width: 175, strong: true, align: "right", fixed: true },
  { key: "qty", label: "الكمية", width: 45, nowrap: true },
  { key: "unitPrice", label: "سعر الوحدة", width: 85, nowrap: true },
  { key: "before", label: "قبل الخصم", width: 85, nowrap: true },
  { key: "discount", label: "الخصم", width: 50, nowrap: true },
  { key: "after", label: "بعد الخصم", width: 85, strong: true, nowrap: true },
  { key: "paid", label: "المدفوع", width: 75, nowrap: true },
  { key: "remaining", label: "المتبقي", width: 85, strong: true, nowrap: true }
];

const TRAINEE_COLUMNS = [
  { key: "name", label: "اسم المتدرب", width: 130, strong: true, align: "right", fixed: true },
  { key: "nationalId", label: "رقم الهوية", width: 78, ltr: true, nowrap: true },
  { key: "tel", label: "الجوال", width: 78, ltr: true, nowrap: true },
  { key: "specialization", label: "التخصص", width: 110 },
  { key: "before", label: "قبل الخصم", width: 62, nowrap: true },
  { key: "discount", label: "الخصم", width: 44, nowrap: true },
  { key: "after", label: "بعد الخصم", width: 66, strong: true, nowrap: true },
  { key: "paid", label: "المدفوع", width: 56, nowrap: true },
  { key: "remaining", label: "المتبقي", width: 65, strong: true, nowrap: true }
];

// ===================== إظهار / إخفاء أجزاء المستند =====================
// doc.show = أجزاء المستند، doc.hiddenColumns = أعمدة مخفية لكل جدول. الافتراضي: كله ظاهر.
export const SHOW_OPTIONS = [
  { key: "letter", label: "الصفحة الأولى (الخطاب)" },
  { key: "summary", label: "جدول بيان العرض المالي" },
  { key: "summaryTotal", label: "سطر الإجمالي في بيان العرض" },
  { key: "info", label: "نصوص الإيضاح وبنود الصفحة الثانية" },
  { key: "details", label: "جدول التفاصيل / كشف المتدربين" },
  { key: "detailsTotal", label: "سطر الإجمالي في التفاصيل" },
  { key: "currencyNote", label: "جملة «جميع المبالغ بالريال السعودي...»" },
  { key: "page3Terms", label: "الشروط والأحكام" },
  { key: "thanks", label: "جملة «وتفضلوا بقبول وافر التحية»" },
  { key: "signature", label: "التوقيع والختم وQR" },
  { key: "bank", label: "صفحة بيانات البنك" }
];

export const HIDEABLE_COLUMNS = {
  summary: { title: "أعمدة بيان العرض المالي", columns: SUMMARY_COLUMNS.filter((c) => !c.fixed) },
  details: { title: "أعمدة جدول التفاصيل", columns: DETAILS_COLUMNS.filter((c) => !c.fixed) },
  trainees: { title: "أعمدة كشف المتدربين", columns: TRAINEE_COLUMNS.filter((c) => !c.fixed) }
};

const isShown = (doc, key) => doc.show?.[key] !== false;

// بيشيل الأعمدة المخفية من رأس الجدول والصفوف وسطر الإجمالي مع بعض.
const visibleTable = (doc, tableKey, columns, rows, totalRow) => {
  const hidden = new Set(doc.hiddenColumns?.[tableKey] || []);
  const keep = columns.map((c) => c.fixed || !hidden.has(c.key));
  const pick = (cells) => cells.filter((_, i) => keep[i]);
  return { columns: pick(columns), rows: rows.map(pick), totalRow: totalRow ? pick(totalRow) : null };
};

// يبني كل صفحات المستند (الجداول الطويلة بتتقسم).
// ===================== أقسام المستند =====================
// كل قسم = عنوان + جدول + ذيل (إيضاح / شروط / التحية / التوقيع). التقسيم على الصفحات بعدين.

const buildSections = (doc) => {
  const t = doc.texts;
  const sections = [];

  // ---- بيان البنود ----
  const summaryRows = doc.services.map((r) => {
    const n = serviceNumbers(r);
    return [r.diplomName || "الخدمة التدريبية", r.offerUnit || "متدرب", qtyText(n.qty), sar(n.unit), sar(n.before)];
  });
  const summaryTotal = doc.services.reduce((s, r) => s + serviceNumbers(r).before, 0);
  const summary = visibleTable(
    doc,
    "summary",
    SUMMARY_COLUMNS,
    summaryRows,
    isShown(doc, "summaryTotal") ? ["الإجمالي", "", "", "", sar(summaryTotal)] : null
  );
  if (isShown(doc, "summary")) {
    const tail = [];
    const infoText = t.page2BeforeInfoTitle?.trim() || multilineLines(t.page2BeforeInfoText).length || t.page2AfterInfoTitle?.trim() || multilineLines(t.page2AfterInfoText).length;
    if (isShown(doc, "info") && infoText) tail.push({ type: "info" });
    const terms = isShown(doc, "info") ? toTerms(t.commonTerms, t.page2ExtraTerms) : [];
    if (terms.length) tail.push({ type: "terms", title: parseBoldLine(t.page2InfoLabel || "إيضاح:").text.replace(/:$/, "") || "إيضاح", terms });
    if (isShown(doc, "thanks")) tail.push({ type: "thanks" });
    if (isShown(doc, "signature")) tail.push({ type: "signature" });
    sections.push({
      key: "summary",
      title: t.page2Title,
      columns: summary.columns,
      rows: summary.rows,
      totalRow: summary.totalRow,
      empty: "لا توجد بنود محفوظة في عرض السعر",
      currencyNote: false,
      tail
    });
  }

  // ---- التفاصيل / كشف المتدربين ----
  const traineesMode = Number(doc.offerMode) === OFFER_MODE_TRAINEES && doc.trainees.length > 0;
  let detailRows;
  let detailTotal;
  let columns;
  let title;
  let tableKey;

  if (traineesMode) {
    const totals = { before: 0, after: 0, paid: 0, remaining: 0 };
    detailRows = doc.trainees.map((r) => {
      const n = traineeNumbers(r);
      totals.before += n.before;
      totals.after += n.after;
      totals.paid += n.paid;
      totals.remaining += n.remaining;
      return [
        r.traineeName || "-",
        r.traineeNationalId || "-",
        r.traineeTel || "-",
        r.specialization || "-",
        moneyText(n.before),
        percentText(n.discount),
        moneyText(n.after),
        moneyText(n.paid),
        moneyText(n.remaining)
      ];
    });
    detailTotal = ["الإجمالي", "", "", "", moneyText(totals.before), "", moneyText(totals.after), moneyText(totals.paid), moneyText(totals.remaining)];
    columns = TRAINEE_COLUMNS;
    title = t.page3TraineesTitle;
    tableKey = "trainees";
  } else {
    const totals = { before: 0, after: 0, paid: 0, remaining: 0 };
    detailRows = doc.services.map((r) => {
      const n = serviceNumbers(r);
      totals.before += n.before;
      totals.after += n.after;
      totals.paid += n.paid;
      totals.remaining += n.remaining;
      return [
        r.diplomName || "الخدمة التدريبية",
        qtyText(n.qty),
        moneyText(n.unit),
        moneyText(n.before),
        percentText(r.discountValue),
        moneyText(n.after),
        moneyText(n.paid),
        moneyText(n.remaining)
      ];
    });
    detailTotal = ["الإجمالي", "", "", moneyText(totals.before), "", moneyText(totals.after), moneyText(totals.paid), moneyText(totals.remaining)];
    columns = DETAILS_COLUMNS;
    title = t.page3DetailsTitle;
    tableKey = "details";
  }

  if (isShown(doc, "details")) {
    const details = visibleTable(doc, tableKey, columns, detailRows, isShown(doc, "detailsTotal") ? detailTotal : null);
    const tail = [];
    const terms = isShown(doc, "page3Terms") ? toTerms(t.commonTerms, t.page3ExtraTerms) : [];
    if (terms.length) tail.push({ type: "terms", title: "الشروط والأحكام", terms });
    if (isShown(doc, "thanks")) tail.push({ type: "thanks" });
    if (isShown(doc, "signature")) tail.push({ type: "signature" });
    sections.push({
      key: "details",
      title,
      columns: details.columns,
      rows: details.rows,
      totalRow: details.totalRow,
      empty: "لا توجد بنود محفوظة",
      currencyNote: isShown(doc, "currencyNote"),
      tail
    });
  }

  return { letter: isShown(doc, "letter"), sections, bank: isShown(doc, "bank") };
};

// ===================== التقسيم على الصفحات =====================

// ارتفاع منطقة المحتوى بين الهيدر والفوتر، وهامش أمان بسيط علشان مفيش حاجة تتقص.
const CONTENT_H = PAGE_H - CONTENT_TOP - CONTENT_BOTTOM;
const SAFETY = 10;

const newTablePage = (section, continued) => ({
  kind: "table",
  sectionKey: section.key,
  title: section.title,
  continued,
  columns: section.columns,
  rows: [],
  startIndex: 0,
  showTotal: false,
  totalRow: section.totalRow,
  empty: section.empty,
  showEmpty: false,
  currencyNote: section.currencyNote,
  blocks: []
});

// من غير قياس (أول رسم / الاختبارات): نفس التقسيم القديم بعدد الصفوف.
const paginateByCount = (section) => {
  const pages = [];
  const chunks = chunkRows(section.rows, section.key === "summary" ? 7 : ROWS_WITH_TAIL, ROWS_FULL_PAGE);
  let offset = 0;
  chunks.forEach((rows, i) => {
    const page = newTablePage(section, i > 0);
    page.rows = rows;
    page.startIndex = offset;
    const last = i === chunks.length - 1;
    page.showTotal = last && rows.length > 0 && Boolean(section.totalRow);
    page.showEmpty = !rows.length && !section.rows.length;
    if (last) page.blocks = section.tail.map((b) => (b.type === "terms" ? { ...b, first: true } : b));
    offset += rows.length;
    pages.push(page);
  });
  return pages;
};

// بالقياس الحقيقي: الصفوف والإجمالي والذيل بيتوزعوا بحيث محدش يعدّي حدود الصفحة.
const paginateByMeasure = (section, m) => {
  const sm = m.sections[section.key];
  const avail = CONTENT_H - SAFETY;
  const head = sm.title + (section.currencyNote ? m.note : 0);
  const pages = [];
  let page = newTablePage(section, false);
  let used = head;
  let tableOpen = false;

  const hasContent = () => page.rows.length > 0 || page.blocks.length > 0 || page.showEmpty || page.showTotal;

  const pushPage = () => {
    pages.push(page);
    page = newTablePage(section, true);
    used = head;
    tableOpen = false;
  };

  // الجدول
  if (!section.rows.length) {
    page.showEmpty = true;
    used += m.empty;
  }
  section.rows.forEach((row, i) => {
    const rowH = sm.rows[i] || 30;
    if (!tableOpen) {
      if (used + sm.tableHead + rowH > avail && hasContent()) pushPage();
      page.startIndex = i;
      used += sm.tableHead;
      tableOpen = true;
    }
    if (used + rowH > avail && page.rows.length) {
      pushPage();
      page.startIndex = i;
      used += sm.tableHead;
      tableOpen = true;
    }
    page.rows.push(row);
    used += rowH;
  });

  // سطر الإجمالي: لو مش هيدخل، آخر صف بينزل معاه الصفحة الجاية (عشان الإجمالي ميبقاش لوحده).
  if (section.totalRow && section.rows.length) {
    if (used + sm.total > avail) {
      const moved = page.rows.length > 1 ? page.rows.pop() : null;
      const movedIndex = page.startIndex + page.rows.length;
      pushPage();
      used += sm.tableHead;
      tableOpen = true;
      if (moved) {
        page.rows.push(moved);
        page.startIndex = movedIndex;
        used += sm.rows[movedIndex] || 30;
      } else {
        page.startIndex = section.rows.length;
      }
    }
    page.showTotal = true;
    used += sm.total;
  }

  // الذيل
  section.tail.forEach((block, bi) => {
    const bm = sm.tail[bi];
    if (block.type === "terms") {
      // البنود بتتقسم على أكتر من صفحة لو طويلة؛ كل جزء في صندوق بعنوانه.
      let chunk = null;
      block.terms.forEach((term, ti) => {
        const itemH = bm.items[ti] || 22;
        if (chunk && used + itemH > avail) {
          pushPage();
          chunk = null;
        }
        if (!chunk) {
          if (used + bm.base + itemH > avail && hasContent()) pushPage();
          chunk = { type: "terms", title: block.title, terms: [], first: ti === 0 };
          page.blocks.push(chunk);
          used += bm.base;
        }
        chunk.terms.push(term);
        used += itemH;
      });
      return;
    }
    if (used + bm.height > avail && hasContent()) {
      // التحية بتنزل مع التوقيع في نفس الصفحة بدل ما تفضل لوحدها.
      const last = page.blocks[page.blocks.length - 1];
      const carry = block.type === "signature" && last?.type === "thanks" ? page.blocks.pop() : null;
      pushPage();
      if (carry) {
        page.blocks.push(carry);
        used += sm.tail[section.tail.indexOf(carry)]?.height || 0;
      }
    }
    page.blocks.push(block);
    used += bm.height;
  });

  pages.push(page);
  return pages;
};

const paginate = (layout, metrics) => {
  const pages = layout.letter ? [{ kind: "letter" }] : [];
  layout.sections.forEach((section) => {
    const ready = metrics?.sections?.[section.key];
    pages.push(...(ready ? paginateByMeasure(section, metrics) : paginateByCount(section)));
  });
  if (layout.bank) pages.push({ kind: "bank" });
  return pages;
};

export const countPages = (doc) => (doc ? paginate(buildSections(doc), null).length : 0);

// للاختبارات: التقسيم بقياسات معروفة.
export const paginateOffer = (doc, metrics) => paginate(buildSections(doc), metrics);
export const OFFER_CONTENT_H = CONTENT_H - SAFETY;

// ===================== القياس =====================

// بيرسم كل الأجزاء بعرض المحتوى الحقيقي خارج الشاشة ويقيس ارتفاعها (بالهوامش).
const CONTENT_W = PAGE_W - 104;
const blockHeight = (el) => (el ? el.getBoundingClientRect().height : 0);

const Measurer = ({ layout, doc, onMeasured }) => {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      const root = rootRef.current;
      if (!root || !alive) return;
      const q = (sel) => root.querySelector(sel);
      // jsdom (الاختبارات) مفيهوش أبعاد حقيقية: نسيب التقسيم بالعدد.
      if (!blockHeight(q("[data-m='note']")) && !blockHeight(q("[data-m='empty']"))) return;

      const metrics = { note: blockHeight(q("[data-m='note']")), empty: blockHeight(q("[data-m='empty']")), sections: {} };
      layout.sections.forEach((section) => {
        const box = q(`[data-m-section='${section.key}']`);
        if (!box) return;
        const table = box.querySelector("[data-m='table']");
        const trs = table ? Array.from(table.querySelectorAll("tbody > tr")) : [];
        const rowHs = trs.slice(0, section.rows.length).map(blockHeight);
        metrics.sections[section.key] = {
          title: blockHeight(box.querySelector("[data-m='title']")),
          // رأس الجدول + حدوده (2px)
          tableHead: blockHeight(table?.querySelector("thead")) + 2,
          rows: rowHs,
          total: section.totalRow && trs.length > section.rows.length ? blockHeight(trs[trs.length - 1]) : 0,
          tail: section.tail.map((block, bi) => {
            const el = box.querySelector(`[data-m-tail='${bi}']`);
            if (block.type !== "terms") return { height: blockHeight(el) };
            const items = Array.from(el?.querySelectorAll("[data-m-term]") || []).map(blockHeight);
            const total = blockHeight(el);
            return { base: Math.max(0, total - items.reduce((s, h) => s + h, 0)), items };
          })
        };
      });
      onMeasured(metrics);
    };

    measure();
    // الخط (Cairo) بيغيّر الأطوال: نقيس تاني بعد ما يتحمل.
    document.fonts?.ready?.then(() => alive && measure()).catch(() => {});
    return () => {
      alive = false;
    };
  }, [layout, onMeasured]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      dir="rtl"
      style={{ position: "fixed", left: -40000, top: 0, width: CONTENT_W, visibility: "hidden", pointerEvents: "none", fontFamily: FONT, color: C.text }}
    >
      <div data-m="note" style={{ display: "flow-root" }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>جميع المبالغ بالريال السعودي وشاملة ضريبة القيمة المضافة</div>
      </div>
      <div data-m="empty" style={{ display: "flow-root" }}>
        <div style={{ border: `1px dashed ${C.border}`, borderRadius: 10, padding: 18, textAlign: "center", fontWeight: 600 }}>—</div>
      </div>
      {layout.sections.map((section) => (
        <div key={section.key} data-m-section={section.key}>
          <div data-m="title" style={{ display: "flow-root" }}>
            <SectionTitle>{section.title} (تابع)</SectionTitle>
          </div>
          {section.rows.length ? (
            <div data-m="table">
              <DataTable columns={section.columns} rows={section.rows} totalRow={section.totalRow} />
            </div>
          ) : null}
          {section.tail.map((block, bi) => (
            <div key={bi} data-m-tail={bi} style={{ display: "flow-root" }}>
              <TailBlock block={block} doc={doc} measure />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// layout + القياس مرة واحدة، ويتشاركوا بين المعاينة ونسخة التصدير.
export const useOfferLayout = (doc) => {
  const layout = useMemo(() => (doc ? buildSections(doc) : null), [doc]);
  const [metrics, setMetrics] = useState(null);
  useEffect(() => setMetrics(null), [layout]);
  const pages = useMemo(() => (layout ? paginate(layout, metrics) : []), [layout, metrics]);
  const measurer = layout ? <Measurer layout={layout} doc={doc} onMeasured={setMetrics} /> : null;
  return { pages, measurer, measured: Boolean(metrics) };
};

// ===================== رسم الصفحات =====================

const TailBlock = ({ block, doc, measure = false }) => {
  if (block.type === "info") return <InfoTexts t={doc.texts} />;
  if (block.type === "terms") {
    return (
      <TermsBox
        title={block.first === false ? `${block.title} (تابع)` : block.title}
        terms={block.terms}
        markItems={measure}
      />
    );
  }
  if (block.type === "thanks") return <Thanks>وتفضلوا بقبول وافر التحية والتقدير،،،</Thanks>;
  if (block.type === "signature") return <SignatureBlock code={doc.code} />;
  return null;
};

const TablePage = React.forwardRef(({ doc, page, pageNo, pageCount }, ref) => (
  <Page ref={ref} pageNo={pageNo} pageCount={pageCount}>
    <SectionTitle>
      {page.title}
      {page.continued ? " (تابع)" : ""}
    </SectionTitle>

    {page.currencyNote ? (
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>جميع المبالغ بالريال السعودي وشاملة ضريبة القيمة المضافة</div>
    ) : null}

    {page.rows.length || page.showTotal ? (
      <DataTable columns={page.columns} rows={page.rows} totalRow={page.showTotal ? page.totalRow : null} startIndex={page.startIndex} />
    ) : null}

    {page.showEmpty ? (
      <div style={{ border: `1px dashed ${C.border}`, borderRadius: 10, padding: 18, textAlign: "center", color: C.muted, fontWeight: 600 }}>
        {page.empty}
      </div>
    ) : null}

    {page.blocks.map((block, i) => (
      <TailBlock key={i} block={block} doc={doc} />
    ))}
  </Page>
));

const BankPage = React.forwardRef((props, ref) => (
  <Page ref={ref} plain>
    <img
      alt=""
      src={`${ASSET}/bank.jpg`}
      crossOrigin="anonymous"
      style={{ position: "absolute", inset: 0, width: PAGE_W, height: PAGE_H, objectFit: "contain", background: "#fff" }}
    />
  </Page>
));

/**
 * doc = { code, offerMode, companyName, offerTitle, texts, services, trainees }
 * pages (اختياري) = من useOfferLayout لو المعاينة بتحسبها مرة واحدة لنسختين؛ من غيرها المستند بيقيس لوحده.
 */
const OfferPriceDocument = ({ doc, pageRefs, pages: givenPages }) => {
  const own = useOfferLayout(givenPages ? null : doc);
  const pages = givenPages || own.pages;
  // صفحة البنك مش بتترقم.
  const numbered = pages.filter((p) => p.kind !== "bank").length;

  return (
    <>
      {givenPages ? null : own.measurer}
      {pages.map((page, i) => {
        const ref = (el) => {
          if (pageRefs) pageRefs.current[i] = el;
        };
        if (page.kind === "letter") return <LetterPage key={i} ref={ref} doc={doc} pageNo={i + 1} pageCount={numbered} />;
        if (page.kind === "bank") return <BankPage key={i} ref={ref} />;
        return <TablePage key={i} ref={ref} doc={doc} page={page} pageNo={i + 1} pageCount={numbered} />;
      })}
    </>
  );
};

export default OfferPriceDocument;
