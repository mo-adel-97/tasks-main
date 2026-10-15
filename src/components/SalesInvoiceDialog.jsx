import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import QRCode from "qrcode";
import logoImage from "../images/logo.jpg";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const REFUND_POLICY_URL =
  "https://sstli.com/%d8%b3%d9%8a%d8%a7%d8%b3%d9%8a%d8%a9-%d8%a7%d9%84%d8%a5%d8%b3%d8%aa%d8%b1%d8%af%d8%a7%d8%af-%d8%a7%d9%84%d9%85%d8%a7%d9%84%d9%8a/";

// الـ QR بيتولد محلياً (بدل api.qrserver.com) علشان الطباعة والـ PDF ما يعتمدوش على موقع خارجي.
const makeQr = (text) =>
  QRCode.toDataURL(text, { margin: 0, width: 240, errorCorrectionLevel: "M" }).catch(() => "");

// PDF مضغوط من نفس شكل الطباعة: صورة JPEG بجودة متوسطة على صفحة A4.
const htmlToCompressedPdf = async (html) => {
  const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  const frame = document.createElement("iframe");
  Object.assign(frame.style, { position: "fixed", left: "-10000px", top: "0", width: "794px", height: "1123px", border: "0" });
  document.body.appendChild(frame);

  try {
    const doc = frame.contentDocument;
    doc.open();
    // في الطباعة الهوامش من @page؛ هنا بنحطها padding علشان الصفحة تطلع بنفس الشكل.
    doc.write(html.replace("</head>", "<style>body{width:210mm;padding:9mm;}</style></head>"));
    doc.close();

    await Promise.all(
      Array.from(doc.images).map((img) =>
        img.complete ? null : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
      )
    );
    if (doc.fonts?.ready) await doc.fonts.ready;

    const canvas = await html2canvas(doc.body, { scale: 1.6, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: 794 });
    const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageW = 210;
    const pageH = 297;
    const imgH = (canvas.height * pageW) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.72), "JPEG", 0, 0, pageW, Math.min(imgH, pageH), undefined, "FAST");
    return pdf.output("blob");
  } finally {
    frame.remove();
  }
};


const numberValue = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
  numberValue(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const hijriDateCache = new Map();

const hijriToGregorian = (year, month, day) => {
  const cacheKey = `${year}-${month}-${day}`;

  if (hijriDateCache.has(cacheKey)) {
    return hijriDateCache.get(cacheKey);
  }

  try {
    const formatter = new Intl.DateTimeFormat(
      "en-US-u-ca-islamic-umalqura-nu-latn",
      {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "UTC"
      }
    );

    // تقريب السنة الميلادية المقابلة ثم البحث حولها.
    const approximateGregorianYear = Math.floor(
      year * 0.970224 + 621.5774
    );

    const start = new Date(
      Date.UTC(approximateGregorianYear - 1, 0, 1)
    );

    for (let i = 0; i < 950; i += 1) {
      const current = new Date(
        start.getTime() + i * 86400000
      );

      const parts = formatter.formatToParts(current);

      const getPart = (type) =>
        Number(
          parts.find((part) => part.type === type)?.value || 0
        );

      if (
        getPart("year") === year &&
        getPart("month") === month &&
        getPart("day") === day
      ) {
        const result =
          `${String(current.getUTCDate()).padStart(2, "0")}/` +
          `${String(current.getUTCMonth() + 1).padStart(2, "0")}/` +
          `${current.getUTCFullYear()}`;

        hijriDateCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // fallback below
  }

  return "";
};

const formatDate = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  // لو التاريخ الراجع من الباك بالشكل 1448-03-12
  // فهو هجري رقمي وليس ميلادي.
  const ymd = /^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})/.exec(raw);

  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);

    // سنة هجرية معتادة في النظام.
    if (year >= 1300 && year <= 1600) {
      const converted = hijriToGregorian(year, month, day);

      if (converted) {
        return converted;
      }
    }

    // تاريخ ميلادي طبيعي.
    if (year >= 1753) {
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }
  }

  // دعم MM/dd/yyyy أو أي صيغة ميلادية صالحة أخرى.
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  const year = date.getFullYear();

  // حماية إضافية: لا نعرض سنة هجرية كأنها ميلادية.
  if (year >= 1300 && year <= 1600) {
    const converted = hijriToGregorian(
      year,
      date.getMonth() + 1,
      date.getDate()
    );

    if (converted) {
      return converted;
    }
  }

  return date.toLocaleDateString("en-GB");
};

const formatHijriDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  try {
    const parts = new Intl.DateTimeFormat(
      "en-US-u-ca-islamic-umalqura-nu-latn",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Riyadh"
      }
    ).formatToParts(date);

    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value || "";

    const day = getPart("day");
    const month = getPart("month");
    const year = getPart("year");

    if (day && month && year) {
      return `${day}/${month}/${year} هـ`;
    }
  } catch {
    // fallback below
  }

  return new Intl.DateTimeFormat(
    "ar-SA-u-ca-islamic-umalqura",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Riyadh"
    }
  ).format(date);
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export default function SalesInvoiceDialog({
  open,
  onClose,
  invoice,
  apiBaseUrl
}) {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1199px)"
  );

  const printFrameRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [qr, setQr] = useState({ verify: "", refund: "" });
  const [exporting, setExporting] = useState(false);

  const billGuid =
    invoice?.billGuid ||
    invoice?.BillGuid ||
    invoice?.guid ||
    invoice?.Guid ||
    invoice?.actionGuid ||
    "";

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadInvoice = async () => {
      if (!billGuid) {
        setError("تعذر قراءة رقم الفاتورة الداخلي");
        setData(null);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setData(null);

        const response = await fetch(
          `${apiBaseUrl}/api/sales-invoices/${encodeURIComponent(billGuid)}`,
          {
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
            result?.message ||
            "تعذر تحميل بيانات الفاتورة"
          );
        }

        if (!cancelled) {
          setData(result?.data || null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e.message ||
            "حدث خطأ أثناء تحميل الفاتورة"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInvoice();

    return () => {
      cancelled = true;
    };
  }, [open, billGuid, apiBaseUrl]);

  // رموز الـ QR: التحقق من الفاتورة + سياسة الاسترداد.
  useEffect(() => {
    let cancelled = false;
    Promise.all([data?.verifyUrl ? makeQr(data.verifyUrl) : "", makeQr(REFUND_POLICY_URL)]).then(([verify, refund]) => {
      if (!cancelled) setQr({ verify, refund });
    });
    return () => {
      cancelled = true;
    };
  }, [data?.verifyUrl]);

  const totals = useMemo(() => {
    const items = Array.isArray(data?.items)
      ? data.items
      : [];

    const total =
      data?.invoice?.billTotal ??
      items.reduce(
        (sum, item) =>
          sum + numberValue(item.cost),
        0
      );

    const tax =
      data?.invoice?.billTax ??
      items.reduce(
        (sum, item) =>
          sum + numberValue(item.tax),
        0
      );

    const subTotal =
      data?.invoice?.billSubTotal ??
      items.reduce(
        (sum, item) =>
          sum + numberValue(item.subTotal),
        0
      );

    return {
      total: numberValue(total),
      tax: numberValue(tax),
      subTotal: numberValue(subTotal)
    };
  }, [data]);

  // Lazy-mount guard: this dialog is mounted eagerly (but closed) as soon
  // as the parent page loads, so skip building its JSX until it has
  // actually been opened once. Once opened, later closes still render
  // normally so the MUI exit transition keeps working.
  const hasOpenedRef = useRef(open);
  if (open) hasOpenedRef.current = true;
  if (!hasOpenedRef.current) return null;

  const buildPrintHtml = () => {
    const header = data?.invoice || {};
    const branch = data?.branch || {};
    const items = Array.isArray(data?.items)
      ? data.items
      : [];

    const rows = items
      .map(
        (item, index) => `
          <tr>
            <td class="num-col">${index + 1}</td>
            <td class="statement">${escapeHtml(item.diplomName)}</td>
            <td>${escapeHtml(item.unit || "PCS")}</td>
            <td>${escapeHtml(item.qty)}</td>
            <td>${money(item.cost)}</td>
            <td>${escapeHtml(item.taxValue)}%</td>
            <td>${money(item.tax)}</td>
            <td class="net">${money(item.subTotal)}</td>
          </tr>
        `
      )
      .join("");

    const verifyBlock =
      data?.verifyUrl && qr.verify
        ? `
        <a class="verify-card" href="${escapeHtml(data.verifyUrl)}" target="_blank" rel="noreferrer">
          <img src="${qr.verify}" alt="QR التحقق من الفاتورة" />
          <span class="verify-title">التحقق من الفاتورة</span>
          <span class="verify-sub">امسح الرمز للتأكد من صحتها</span>
          <span class="verify-badge">&#10003; فاتورة موثقة</span>
        </a>`
        : `<div></div>`;

    const metaRow = (ar, en, value, ltr = false) => `
      <div class="meta-row">
        <span class="meta-label"><b>${ar}</b><small>${en}</small></span>
        <span class="meta-value${ltr ? " ltr" : ""}">${escapeHtml(value) || "—"}</span>
      </div>`;

    return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>فاتورة رقم ${escapeHtml(header.code)}</title>

  <style>
    @page { size: A4 portrait; margin: 9mm; }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #1b2a23;
      font-family: Tahoma, Arial, sans-serif;
    }

    .page {
      width: 100%;
      min-height: 277mm;
      display: flex;
      flex-direction: column;
      border: 1.4px solid #cfdcd5;
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
    }

    .brand-bar { height: 7px; background: linear-gradient(90deg, #057546, #0a9a5c 55%, #ae1e21); }

    .content { padding: 5mm 7mm 6mm; display: flex; flex-direction: column; flex: 1; }

    /* ===== الهيدر: بيانات المعهد | QR التحقق | اللوجو ===== */
    .top-header {
      display: grid;
      grid-template-columns: 1fr 150px 1fr;
      align-items: center;
      gap: 5mm;
      padding-bottom: 4mm;
      border-bottom: 1.5px solid #dfe9e4;
    }

    .company-name { font-size: 16px; font-weight: 900; color: #034d31; line-height: 1.5; margin-bottom: 1.5mm; }
    .company-line { font-size: 10.5px; font-weight: 700; color: #33443c; line-height: 1.85; }
    .company-line span { color: #6b7d74; font-weight: 600; }
    .company-line .ltr { direction: ltr; unicode-bidi: isolate; color: #1b2a23; font-weight: 800; }

    .verify-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #1b2a23;
      border: 1.6px solid #057546;
      border-radius: 14px;
      padding: 7px 6px 6px;
      background: #f3faf6;
    }
    .verify-card img { width: 100px; height: 100px; display: block; background: #fff; padding: 4px; border-radius: 8px; }
    .verify-title { margin-top: 4px; font-size: 11px; font-weight: 900; color: #034d31; }
    .verify-sub { font-size: 9px; font-weight: 700; color: #5d6f66; }
    .verify-badge {
      margin-top: 4px;
      font-size: 9.5px;
      font-weight: 900;
      color: #fff;
      background: #057546;
      border-radius: 99px;
      padding: 1px 10px;
    }

    .logo-wrap { justify-self: end; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
    .logo { width: 92px; height: 92px; object-fit: contain; display: block; }
    .logo-caption { font-size: 9.5px; font-weight: 800; color: #034d31; text-align: center; line-height: 1.5; }

    /* ===== العنوان ===== */
    .title-band {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 5mm 0 4mm;
      padding: 3mm 5mm;
      border-radius: 12px;
      background: linear-gradient(135deg, #057546, #034d31);
      color: #fff;
    }
    .title-band h1 { margin: 0; font-size: 21px; font-weight: 900; line-height: 1.3; }
    .title-band small { display: block; font-size: 10px; font-weight: 700; opacity: .85; direction: ltr; text-align: right; }
    .invoice-no { text-align: center; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.35); border-radius: 10px; padding: 2mm 4mm; }
    .invoice-no span { display: block; font-size: 9.5px; font-weight: 700; opacity: .85; }
    .invoice-no b { font-size: 17px; letter-spacing: .5px; direction: ltr; unicode-bidi: isolate; }

    /* ===== بيانات العميل والفاتورة ===== */
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 5mm; }
    .meta-box { border: 1.3px solid #dfe9e4; border-radius: 12px; overflow: hidden; }
    .meta-box-title { background: #eef6f2; color: #034d31; font-size: 12px; font-weight: 900; padding: 2mm 4mm; border-bottom: 1px solid #dfe9e4; }
    .meta-row { display: grid; grid-template-columns: 95px 1fr; align-items: center; gap: 3mm; padding: 1.7mm 4mm; border-bottom: 1px solid #f0f4f2; min-height: 9mm; }
    .meta-row:last-child { border-bottom: 0; }
    .meta-label b { display: block; font-size: 10.5px; font-weight: 900; color: #33443c; line-height: 1.3; }
    .meta-label small { display: block; font-size: 8.5px; font-weight: 700; color: #8a9b92; direction: ltr; text-align: right; }
    .meta-value { font-size: 11px; font-weight: 700; line-height: 1.45; overflow-wrap: anywhere; }
    .meta-value.ltr { direction: ltr; unicode-bidi: isolate; text-align: right; }

    /* ===== البنود ===== */
    .items-table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; border: 1.3px solid #dfe9e4; border-radius: 12px; overflow: hidden; }
    .items-table thead th { background: #057546; color: #fff; padding: 2.4mm 1.5mm; font-size: 10.5px; font-weight: 900; text-align: center; line-height: 1.35; }
    .items-table tbody td { padding: 2.6mm 1.5mm; text-align: center; font-size: 11px; font-weight: 700; border-top: 1px solid #edf2ef; }
    .items-table tbody tr:nth-child(even) td { background: #f8fbf9; }
    .items-table .num-col { width: 7%; color: #6b7d74; }
    .items-table .statement { width: 33%; text-align: right; padding-right: 3mm; line-height: 1.5; }
    .items-table td.net { font-weight: 900; color: #034d31; }

    .note-line { margin: 4mm 0; padding: 2.5mm 4mm; border-radius: 10px; background: #f6f9f7; border-right: 4px solid #057546; font-size: 12.5px; font-weight: 800; color: #33443c; }
    .note-line span { font-size: 10px; font-weight: 700; color: #6b7d74; margin-left: 2mm; }

    /* ===== الإجماليات + سياسة الاسترداد ===== */
    .bottom-section { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-items: center; margin-top: 1mm; }
    .totals-box { border: 1.3px solid #dfe9e4; border-radius: 12px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; align-items: center; padding: 2.4mm 4mm; font-size: 11.5px; font-weight: 800; border-bottom: 1px solid #f0f4f2; }
    .totals-row .val { direction: ltr; unicode-bidi: isolate; font-weight: 900; }
    .totals-row.grand { background: #057546; color: #fff; font-size: 13.5px; font-weight: 900; border-bottom: 0; }
    .totals-row .cur { font-size: 9.5px; font-weight: 700; opacity: .8; margin-left: 1.5mm; }

    .refund-side { display: flex; align-items: center; gap: 4mm; justify-content: flex-end; text-decoration: none; color: #1b2a23; }
    .refund-side img { width: 78px; height: 78px; display: block; }
    .refund-side div { text-align: right; font-size: 10.5px; font-weight: 800; line-height: 1.7; max-width: 150px; }
    .refund-side small { display: block; font-size: 9px; color: #6b7d74; font-weight: 700; }

    .footer { margin-top: auto; padding-top: 5mm; }
    .footer-note { text-align: center; font-size: 14px; font-weight: 900; color: #ae1e21; padding: 2.5mm; border: 1.3px dashed #e6b8b9; border-radius: 10px; background: #fdf5f5; }
    .footer-line { margin-top: 3mm; display: flex; justify-content: space-between; font-size: 9px; color: #8a9b92; font-weight: 700; }
  </style>
</head>

<body>
  <main class="page">
    <div class="brand-bar"></div>
    <div class="content">
      <section class="top-header">
        <div class="company-block">
          <div class="company-name">${escapeHtml(branch.name || "المعهد السعودي المتخصص العالي للتدريب")}</div>
          ${branch.address ? `<div class="company-line">${escapeHtml(branch.address)}</div>` : ""}
          <div class="company-line"><span>الرقم الضريبي:</span> <b class="ltr">${escapeHtml(branch.vatNumber || "—")}</b></div>
          <div class="company-line"><span>السجل التجاري:</span> <b class="ltr">${escapeHtml(branch.commercialRegister || "—")}</b></div>
          <div class="company-line"><span>الهاتف:</span> <b class="ltr">${escapeHtml(branch.tel || "—")}</b></div>
        </div>

        ${verifyBlock}

        <div class="logo-wrap">
          <img class="logo" src="${logoImage}" alt="SSTLI" />
          <div class="logo-caption">المعهد السعودي المتخصص<br />العالي للتدريب</div>
        </div>
      </section>

      <section class="title-band">
        <div>
          <h1>فاتورة ضريبية مبسطة</h1>
          <small>Simplified Tax Invoice</small>
        </div>
        <div class="invoice-no">
          <span>رقم الفاتورة · Invoice No</span>
          <b>${escapeHtml(header.code)}</b>
        </div>
      </section>

      <section class="meta-grid">
        <div class="meta-box">
          <div class="meta-box-title">بيانات العميل</div>
          ${metaRow("اسم العميل", "Customer Name", header.studentName)}
          ${metaRow("رقم الهوية", "ID Number", header.nationalId, true)}
          ${metaRow("رقم الجوال", "Mobile No", header.studentTel, true)}
        </div>

        <div class="meta-box">
          <div class="meta-box-title">بيانات الفاتورة</div>
          ${metaRow("تاريخ الفاتورة", "Invoice Date", formatDate(header.billDate), true)}
          ${metaRow("وقت الفاتورة", "Invoice Time", formatTime(header.billDate), true)}
          ${metaRow("البائع", "Seller Name", header.fullName)}
        </div>
      </section>

      <table class="items-table">
        <thead>
          <tr>
            <th class="num-col">#</th>
            <th class="statement">البيان</th>
            <th>الوحدة</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th>الضريبة</th>
            <th>مبلغ الضريبة</th>
            <th>الصافي</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8">لا توجد بنود</td></tr>'}
        </tbody>
      </table>

      ${header.notes ? `<div class="note-line"><span>البيان:</span>${escapeHtml(header.notes).replaceAll("\n", "<br />")}</div>` : `<div style="height:4mm"></div>`}

      <section class="bottom-section">
        <div class="totals-box">
          <div class="totals-row">
            <span>الإجمالي قبل الضريبة</span>
            <span class="val">${money(totals.total)}<span class="cur">ر.س</span></span>
          </div>
          <div class="totals-row">
            <span>ضريبة القيمة المضافة</span>
            <span class="val">${money(totals.tax)}<span class="cur">ر.س</span></span>
          </div>
          <div class="totals-row grand">
            <span>الإجمالي بعد الضريبة</span>
            <span class="val">${money(totals.subTotal)}<span class="cur">ر.س</span></span>
          </div>
        </div>

        <a class="refund-side" href="${REFUND_POLICY_URL}" target="_blank" rel="noreferrer">
          <div>يرجى متابعة سياسة الاسترداد المالي<small>امسح الرمز لعرض السياسة</small></div>
          ${qr.refund ? `<img src="${qr.refund}" alt="QR سياسة الاسترداد المالي" />` : ""}
        </a>
      </section>

      <div class="footer">
        <div class="footer-note">المبالغ المدفوعة رسوم دراسية غير مستردة</div>
        <div class="footer-line">
          <span>المعهد السعودي المتخصص العالي للتدريب</span>
          <span>Saudi Specialized Institute for Higher Training</span>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`;
  };

  const printInvoice = () => {
    if (!data) return;

    try {
      setPrinting(true);

      const frame = printFrameRef.current;

      if (!frame) {
        throw new Error("تعذر تجهيز صفحة الطباعة");
      }

      const documentRef =
        frame.contentDocument ||
        frame.contentWindow?.document;

      if (!documentRef) {
        throw new Error("تعذر فتح مستند الطباعة");
      }

      documentRef.open();
      documentRef.write(buildPrintHtml());
      documentRef.close();

      const printWhenReady = () => {
        const images = Array.from(
          documentRef.images || []
        );

        const pendingImages = images.filter(
          (image) => !image.complete
        );

        if (pendingImages.length === 0) {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          setPrinting(false);
          return;
        }

        let completed = 0;

        const finish = () => {
          completed += 1;

          if (completed >= pendingImages.length) {
            frame.contentWindow?.focus();
            frame.contentWindow?.print();
            setPrinting(false);
          }
        };

        pendingImages.forEach((image) => {
          image.addEventListener("load", finish, {
            once: true
          });

          image.addEventListener("error", finish, {
            once: true
          });
        });

        window.setTimeout(() => {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          setPrinting(false);
        }, 2500);
      };

      window.setTimeout(printWhenReady, 150);
    } catch (e) {
      setError(
        e.message ||
        "تعذر طباعة الفاتورة"
      );
      setPrinting(false);
    }
  };

  // تصدير PDF مضغوط بنفس شكل الطباعة (فيه QR التحقق من الفاتورة).
  const exportPdf = async () => {
    if (!data) return;
    try {
      setExporting(true);
      const blob = await htmlToCompressedPdf(buildPrintHtml());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `فاتورة-${data?.invoice?.code || "مبيعات"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError(e.message || "تعذر تصدير الفاتورة PDF");
    } finally {
      setExporting(false);
    }
  };

  const header = data?.invoice || {};
  const items = Array.isArray(data?.items)
    ? data.items
    : [];

  return (
    <>
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={open}
        onClose={loading || printing ? undefined : onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isPhone}
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: isPhone ? 0 : 3,
            overflow: "hidden",
            width: isPhone
              ? "100%"
              : isTablet
                ? "calc(100vw - 28px)"
                : "min(1180px, calc(100vw - 56px))",
            maxWidth: "none",
            maxHeight: isPhone
              ? "100dvh"
              : "calc(100dvh - 28px)",
            m: isPhone ? 0 : 1.75
          }
        }}
      >
        <DialogTitle
          sx={{
            color: primaryColor,
            fontWeight: 950,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: isPhone ? 1.2 : 2.5,
            py: isPhone ? 1 : 1.5,
            "& .MuiStack-root": {
              minWidth: 0
            },
            "& span": {
              fontSize: isPhone ? 14 : 18,
              lineHeight: 1.45,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: isPhone ? "normal" : "nowrap"
            }
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptLongIcon />
            <span>فاتورة مبيعات رقم {header.code || invoice?.invoiceNo || ""}</span>
          </Stack>

          <IconButton
            onClick={onClose}
            disabled={loading || printing}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: isPhone
              ? 1
              : isTablet
                ? 1.5
                : 2.5,
            overflowY: "auto",
            overflowX: "hidden"
          }}
        >
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{
                minHeight: isPhone ? 240 : 420
              }}
            >
              <CircularProgress sx={{ color: primaryColor }} />
              <Typography sx={{ fontWeight: 900 }}>
                جاري تحميل بيانات الفاتورة...
              </Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : data ? (
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: isPhone ? 1 : 2,
                  borderRadius: isPhone ? 2 : 3
                }}
              >
                <Grid container spacing={1.5}>
                  {[
                    ["كود الفاتورة", header.code],
                    ["التاريخ", formatDate(header.billDate)],
                    ["نوع المستند", header.documentName],
                    ["الفرع", data?.branch?.name],
                    ["اسم الطالب", header.studentName],
                    ["رقم الهوية", header.nationalId],
                    ["رقم الجوال", header.studentTel],
                    ["المحصل", header.fullName],
                    ["تاريخ التحويل", formatDate(header.payDate)]
                  ].map(([label, value]) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={label}
                    >
                      <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                        label={label}
                        value={value || ""}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  ))}

                  <Grid item xs={12}>
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      fullWidth
                      multiline
                      minRows={2}
                      label="الملاحظات"
                      value={header.notes || ""}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {isPhone ? (
                <Stack spacing={1}>
                  {items.length ? (
                    items.map((item, index) => (
                      <Paper
                        key={`${item.diplomName}-${index}`}
                        variant="outlined"
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: "#fffaf0"
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 950,
                            fontSize: 13,
                            color: primaryDark,
                            mb: 0.8
                          }}
                        >
                          {item.diplomName || "بدون بيان"}
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(2,minmax(0,1fr))",
                            gap: 0.7
                          }}
                        >
                          {[
                            ["الوحدة", item.unit || "PCS"],
                            ["الكمية", item.qty ?? ""],
                            ["السعر", money(item.cost)],
                            ["الضريبة %", item.taxValue ?? ""],
                            ["مبلغ الضريبة", money(item.tax)],
                            ["الصافي", money(item.subTotal)]
                          ].map(([label, value]) => (
                            <Box
                              key={label}
                              sx={{
                                p: 0.7,
                                border: "1px solid #ececec",
                                borderRadius: 1.5,
                                bgcolor: "#fff"
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: "#777",
                                  fontWeight: 800
                                }}
                              >
                                {label}
                              </Typography>

                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 950,
                                  wordBreak: "break-word"
                                }}
                              >
                                {value}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    ))
                  ) : (
                    <Alert severity="info">
                      لا توجد تفاصيل للفاتورة
                    </Alert>
                  )}
                </Stack>
              ) : (
                <Box
                  sx={{
                    overflowX: "auto",
                    width: "100%"
                  }}
                >
                  <Box
                    component="table"
                    sx={{
                      width: "100%",
                      minWidth: isTablet ? 720 : 900,
                      borderCollapse: "collapse",
                      "& th, & td": {
                        border: "1px solid #ddd",
                        px: 1,
                        py: 1,
                        textAlign: "center",
                        whiteSpace: "nowrap"
                      },
                      "& th": {
                        backgroundColor: "#f7d58b",
                        fontWeight: 950
                      }
                    }}
                  >
                    <thead>
                      <tr>
                        <th>البيان</th>
                        <th>الوحدة</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الضريبة %</th>
                        <th>مبلغ الضريبة</th>
                        <th>الصافي</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.length ? (
                        items.map((item, index) => (
                          <tr key={`${item.diplomName}-${index}`}>
                            <td>{item.diplomName || ""}</td>
                            <td>{item.unit || "PCS"}</td>
                            <td>{item.qty ?? ""}</td>
                            <td>{money(item.cost)}</td>
                            <td>{item.taxValue ?? ""}</td>
                            <td>{money(item.tax)}</td>
                            <td>{money(item.subTotal)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7}>
                            لا توجد تفاصيل للفاتورة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Box>
                </Box>
              )}

              <Grid container spacing={1.5}>
                {[
                  ["الإجمالي", totals.total],
                  ["الضريبة", totals.tax],
                  ["الصافي", totals.subTotal]
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={4} key={label}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        textAlign: "center"
                      }}
                    >
                      <Typography sx={{ fontWeight: 900 }}>
                        {label}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: accentColor,
                          fontWeight: 950,
                          mt: 0.5
                        }}
                      >
                        {money(value)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: isPhone ? 1 : 3,
            py: isPhone ? 1 : 2,
            gap: 1,
            flexDirection: isPhone
              ? "column"
              : "row",
            alignItems: "stretch",
            bgcolor: "#fff"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            variant="contained"
            onClick={printInvoice}
            disabled={loading || printing || !data}
            startIcon={
              printing
                ? <CircularProgress size={18} color="inherit" />
                : <PrintIcon />
            }
            sx={uiLayout.withUiSx({
              minWidth: isPhone ? "100%" : 145,
              minHeight: isPhone ? 44 : undefined,
              fontWeight: 950,
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
            }, uiLayout.buttonSx)}
          >
            طباعة الفاتورة
          </Button>

          <Button
            variant="outlined"
            onClick={exportPdf}
            disabled={loading || printing || exporting || !data}
            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            sx={uiLayout.withUiSx({
              minWidth: isPhone ? "100%" : 145,
              minHeight: isPhone ? 44 : undefined,
              fontWeight: 900,
              borderColor: primaryColor,
              color: primaryColor
            }, uiLayout.buttonSx)}
          >
            تصدير PDF
          </Button>

          <Button
            onClick={onClose}
            disabled={loading || printing}
            sx={uiLayout.withUiSx({
              color: accentColor,
              fontWeight: 900,
              width: isPhone ? "100%" : "auto",
              minHeight: isPhone ? 42 : undefined
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <iframe
        ref={printFrameRef}
        title="invoice-print-frame"
        style={adaptiveInlineStyle({
          position: "fixed",
          width: 0,
          height: 0,
          border: 0,
          visibility: "hidden"
        })}
      />
    </>
  );
}