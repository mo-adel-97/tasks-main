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
import logoImage from "../images/logo.jpg";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const REFUND_POLICY_URL =
  "https://sstli.com/%d8%b3%d9%8a%d8%a7%d8%b3%d9%8a%d8%a9-%d8%a7%d9%84%d8%a5%d8%b3%d8%aa%d8%b1%d8%af%d8%a7%d8%af-%d8%a7%d9%84%d9%85%d8%a7%d9%84%d9%8a/";

const refundQrUrl = (size = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(
    REFUND_POLICY_URL
  )}`;


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

  const buildPrintHtml = () => {
    const header = data?.invoice || {};
    const branch = data?.branch || {};
    const items = Array.isArray(data?.items)
      ? data.items
      : [];

    const rows = items
      .map(
        (item) => `
          <tr>
            <td class="statement">${escapeHtml(item.diplomName)}</td>
            <td>${escapeHtml(item.unit || "PCS")}</td>
            <td>${escapeHtml(item.qty)}</td>
            <td>${money(item.cost)}</td>
            <td>${escapeHtml(item.taxValue)}</td>
            <td>${money(item.tax)}</td>
            <td>${money(item.subTotal)}</td>
          </tr>
        `
      )
      .join("");

    return `
<!doctype html>
<html lang="ar" dir="ltr">
<head>
  <meta charset="utf-8" />
  <title>فاتورة رقم ${escapeHtml(header.code)}</title>

  <style>
    @page {
      size: A4 portrait;
      margin: 9mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family: Arial, Tahoma, sans-serif;
    }

    body {
      direction: ltr;
    }

    .page {
      width: 100%;
      min-height: 278mm;
      padding: 5mm 6mm 7mm;
      border: 1.8px solid #2f2f2f;
      border-radius: 12px;
      background: #fff;
    }

    .top-header {
      display: grid;
      grid-template-columns: 1fr 120px;
      align-items: center;
      gap: 18px;
      direction: ltr;
      padding: 2mm 1mm 5mm;
      border-bottom: 2.5px solid #111;
      margin-bottom: 6mm;
    }

    .logo-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 110px;
      min-height: 110px;
      border: 1.6px solid #b7b7b7;
      border-radius: 16px;
      padding: 10px;
      background: #fafafa;
      justify-self: start;
    }

    .logo {
      width: 82px;
      height: 82px;
      object-fit: contain;
      display: block;
    }

.company-block {
  direction: rtl;
  text-align: right;
  line-height: 2;
  justify-self: stretch;
  width: 100%;
  min-width: 0;
  padding-right: 2mm;
}

  .company-name {
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 2mm;
  white-space: nowrap;
  word-break: keep-all;
}

.company-line {
  font-size: 11.5px;
  font-weight: 700;
  margin-bottom: 1px;
  white-space: nowrap;
  word-break: keep-all;
}

    .invoice-title {
      text-align: center;
      font-size: 24px;
      font-weight: 900;
      margin: 1mm 0 6mm;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10mm;
      direction: ltr;
      margin-bottom: 6mm;
    }

    .meta-box {
      border: 1.5px solid #555;
      border-radius: 10px;
      padding: 3.5mm 4.5mm;
      min-height: 38mm;
      direction: ltr;
    }

    .meta-box-title {
      text-align: center;
      font-size: 13px;
      font-weight: 900;
      margin-bottom: 2mm;
      padding-bottom: 1.5mm;
      border-bottom: 1px solid #e3e3e3;
    }

    .meta-row {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr) 92px;
      align-items: center;
      gap: 8px;
      min-height: 8mm;
      padding: 1.2mm 0;
      border-bottom: 1px solid #eeeeee;
      font-size: 11.5px;
    }

    .meta-row:last-child {
      border-bottom: 0;
    }

    .meta-label-en {
      text-align: left;
      direction: ltr;
      font-size: 10.4px;
      font-weight: 700;
      white-space: nowrap;
    }

    .meta-label-ar {
      text-align: right;
      font-size: 10.4px;
      font-weight: 700;
      white-space: nowrap;
    }

    .meta-value {
      text-align: center;
      font-size: 10px;
      font-weight: 500;
      line-height: 1.35;
      word-break: normal;
      overflow-wrap: anywhere;
    }

    .meta-value-ltr {
      direction: ltr;
      unicode-bidi: isolate;
      white-space: nowrap;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 5mm;
      direction: rtl;
    }

    .items-table thead th {
      background: #ececec;
      border-top: 1.5px solid #888;
      border-bottom: 1.5px solid #888;
      padding: 8px 4px;
      font-size: 11px;
      font-weight: 900;
    }

    .items-table tbody td {
      border-bottom: 1px solid #b8b8b8;
      padding: 8px 4px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      vertical-align: middle;
    }

    .items-table th.statement,
    .items-table td.statement {
      width: 37%;
      text-align: right;
      padding-right: 8px;
      line-height: 1.5;
    }

    .note-line {
      min-height: 15mm;
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 5mm;
    }

    .bottom-section {
        display: grid;
  grid-template-columns: 285px 1fr;
      gap: 12mm;
      align-items: start;
      direction: rtl;
      margin-top: 2mm;
    }

    .totals-box {
      border: 1.5px solid #555;
      border-radius: 10px;
      padding: 5mm 6mm;
    }

 .totals-row {
  display: grid;
  grid-template-columns: minmax(145px, 1fr) 85px;
  align-items: center;
  gap: 12px;
  min-height: 10mm;
  font-size: 12px;
  font-weight: 900;
}

.totals-row > span:first-child {
  white-space: nowrap;
  word-break: keep-all;
  text-align: right;
}

    .totals-value {
      text-align: center;
      direction: ltr;
      font-weight: 900;
    }

    .policy-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 48mm;
      padding-top: 2mm;
    }

    .policy-side a {
      color: #111;
      text-decoration: none;
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      line-height: 1.6;
    }

    .refund-qr {
      width: 122px;
      height: 122px;
      object-fit: contain;
      display: block;
      margin: 0 auto 6px;
    }

    .footer-note {
      margin-top: 10mm;
      text-align: center;
      font-size: 16px;
      font-weight: 900;
    }

    .footer-sub-note {
      margin-top: 3mm;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
    }

    .muted {
      color: #333;
    }
  </style>
</head>

<body>
  <main class="page">
    <section class="top-header">
      <div class="logo-wrap">
        <img class="logo" src="${logoImage}" alt="SSTLI" />
      </div>

      <div class="company-block">
        <div class="company-name">${escapeHtml(branch.name || "")}</div>
        <div class="company-line">${escapeHtml(branch.address || "")}</div>
        <div class="company-line">الرقم الضريبي - ${escapeHtml(branch.vatNumber || "")}</div>
        <div class="company-line">الهاتف - ${escapeHtml(branch.tel || "")}</div>
        <div class="company-line">السجل التجاري - ${escapeHtml(branch.commercialRegister || "")}</div>
      </div>
    </section>

    <div class="invoice-title">فاتورة ضريبية مبسطة</div>

    <section class="meta-grid">
      <div class="meta-box">
        <div class="meta-box-title">بيانات العميل</div>

        <div class="meta-row">
          <span class="meta-label-en">Customer Name</span>
          <span class="meta-value">${escapeHtml(header.studentName)}</span>
          <span class="meta-label-ar">اسم العميل</span>
        </div>

        <div class="meta-row">
          <span class="meta-label-en">ID Number</span>
          <span class="meta-value meta-value-ltr">${escapeHtml(header.nationalId)}</span>
          <span class="meta-label-ar">رقم الهوية</span>
        </div>

        <div class="meta-row">
          <span class="meta-label-en">Mobile No</span>
          <span class="meta-value meta-value-ltr">${escapeHtml(header.studentTel)}</span>
          <span class="meta-label-ar">رقم الجوال</span>
        </div>
      </div>

      <div class="meta-box">
        <div class="meta-box-title">بيانات الفاتورة</div>

        <div class="meta-row">
          <span class="meta-label-en">Invoice No</span>
          <span class="meta-value meta-value-ltr">${escapeHtml(header.code)}</span>
          <span class="meta-label-ar">رقم الفاتورة</span>
        </div>

        <div class="meta-row">
          <span class="meta-label-en">Invoice Date</span>
          <span class="meta-value meta-value-ltr">${escapeHtml(formatDate(header.billDate))}</span>
          <span class="meta-label-ar">تاريخ الفاتورة</span>
        </div>

        <div class="meta-row">
          <span class="meta-label-en">Invoice Time</span>
          <span class="meta-value meta-value-ltr">${escapeHtml(formatTime(header.billDate))}</span>
          <span class="meta-label-ar">وقت الفاتورة</span>
        </div>

        <div class="meta-row">
          <span class="meta-label-en">Seller Name</span>
          <span class="meta-value">${escapeHtml(header.fullName)}</span>
          <span class="meta-label-ar">البائع</span>
        </div>
      </div>
    </section>

    <table class="items-table">
      <thead>
        <tr>
          <th class="statement">البيان</th>
          <th>الوحدة</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>الضريبة %</th>
          <th>مبلغ الضريبة</th>
          <th>الصافي</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="7">لا توجد بنود</td></tr>'}
      </tbody>
    </table>

    <div class="note-line muted">${escapeHtml(header.notes || "--").replaceAll("\n", "<br />")}</div>

    <section class="bottom-section">
      <div class="totals-box">
        <div class="totals-row">
          <span>الإجمالي قبل الضريبة</span>
          <span class="totals-value">${money(totals.total)}</span>
        </div>
        <div class="totals-row">
          <span>ضريبة القيمة المضافة</span>
          <span class="totals-value">${money(totals.tax)}</span>
        </div>
        <div class="totals-row">
          <span>الإجمالي بعد الضريبة</span>
          <span class="totals-value">${money(totals.subTotal)}</span>
        </div>
      </div>

      <div class="policy-side">
        <a href="${REFUND_POLICY_URL}" target="_blank" rel="noreferrer">
          <img class="refund-qr" src="${refundQrUrl(240)}" alt="QR سياسة الاسترداد المالي" />
          <span>يرجى متابعة سياسة الاسترداد المالي</span>
        </a>
      </div>
    </section>

    <div class="footer-note">المبالغ المدفوعة رسوم دراسية غير مستردة</div>
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
        style={{
          position: "fixed",
          width: 0,
          height: 0,
          border: 0,
          visibility: "hidden"
        }}
      />
    </>
  );
}