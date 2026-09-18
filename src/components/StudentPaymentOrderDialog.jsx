import { PRINT_READY_SCRIPT } from '../utils/printReady';
import { pinColor } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import React, { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import logoImage from "../images/logo.jpg";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
// Always-visible focus-green outline (never hover/focus-only) for every field
// and the dialog frame itself — matches the reference styling on the Home page.
const FOCUS_BORDER_SX = (theme) => (theme.palette.mode !== "dark" ? {} : {
  "& .MuiDialog-paper": { border: "1px solid #67C99D" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" }
});
const whiteColor = "#fefefe";
const softBg = "#fefefe";
const textColor = "#1f2d3d";
const dangerColor = accentColor;
const warningColor = accentColor;

const noGuid = "00000000-0000-0000-0000-000000000000";


const exportHtmlDocumentToPdf = async ({
  html,
  fileName = "document.pdf",
  selector = ".sheet, .page, main, body",
  scale = 2
}) => {
  let iframe = null;

  try {
    iframe = document.createElement("iframe");

    Object.assign(iframe.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "820px",
      height: "1180px",
      border: "0",
      opacity: "0",
      pointerEvents: "none"
    });

    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const safeHtml = String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(
        /<button[^>]*class=["'][^"']*(?:print-btn|no-print)[^"']*["'][^>]*>[\s\S]*?<\/button>/gi,
        ""
      );

    const loaded = new Promise((resolve) => {
      iframe.onload = () => resolve();
    });

    iframe.srcdoc = safeHtml;
    await loaded;

    const doc = iframe.contentDocument;

    if (!doc) {
      throw new Error("تعذر تجهيز محتوى ملف PDF");
    }

    if (doc.fonts?.ready) {
      try {
        await doc.fonts.ready;
      } catch {}
    }

    const images = Array.from(doc.images || []);

    await Promise.all(
      images.map(
        (image) =>
          new Promise((resolve) => {
            if (
              image.complete &&
              image.naturalWidth > 0
            ) {
              resolve();
              return;
            }

            const finish = () => resolve();

            image.addEventListener(
              "load",
              finish,
              { once: true }
            );

            image.addEventListener(
              "error",
              finish,
              { once: true }
            );

            window.setTimeout(finish, 5000);
          })
      )
    );

    const target =
      doc.querySelector(selector) ||
      doc.body;

    if (!target) {
      throw new Error("تعذر العثور على نموذج التصدير");
    }

    target.style.boxShadow = "none";
    target.style.margin = "0 auto";

    const canvas = await html2canvas(target, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 7000,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(
        target.scrollWidth,
        794
      ),
      windowHeight: Math.max(
        target.scrollHeight,
        1123
      )
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const canvasRatio =
      canvas.height / canvas.width;

    const renderedHeight =
      pageWidth * canvasRatio;

    if (renderedHeight <= pageHeight) {
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.96),
        "JPEG",
        0,
        0,
        pageWidth,
        renderedHeight,
        undefined,
        "FAST"
      );
    } else {
      const pagePixelHeight =
        Math.floor(
          canvas.width *
            (pageHeight / pageWidth)
        );

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        const sliceHeight = Math.min(
          pagePixelHeight,
          canvas.height - offsetY
        );

        const pageCanvas =
          document.createElement("canvas");

        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const context =
          pageCanvas.getContext("2d");

        context.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        if (pageIndex > 0) {
          pdf.addPage("a4", "portrait");
        }

        const sliceRenderedHeight =
          pageWidth *
          (sliceHeight / canvas.width);

        pdf.addImage(
          pageCanvas.toDataURL(
            "image/jpeg",
            0.96
          ),
          "JPEG",
          0,
          0,
          pageWidth,
          sliceRenderedHeight,
          undefined,
          "FAST"
        );

        offsetY += sliceHeight;
        pageIndex += 1;
      }
    }

    pdf.save(
      fileName.toLowerCase().endsWith(".pdf")
        ? fileName
        : `${fileName}.pdf`
    );
  } finally {
    if (
      iframe &&
      iframe.parentNode
    ) {
      iframe.parentNode.removeChild(
        iframe
      );
    }
  }
};


const money = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const safeText = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const toNumber = (value) => {
  const n = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) => {
  return (
    user?.userGuid ||
    user?.guid ||
    user?.Guid ||
    user?.USER_GUID ||
    user?.USER_GUID____ ||
    ""
  );
};

const getBranchForWork = (user) => {
  return user?.branchForWork || user?.BranchForWork || user?.branchForWorkGuid || "";
};

const getResponsiveSwalOptions = () => {
  const width =
    typeof window !== "undefined"
      ? window.innerWidth
      : DESKTOP_BREAKPOINT;

  const isPhoneView = width < 600;
  const isTabletView =
    width >= 600 && width < DESKTOP_BREAKPOINT;

  return {
    width: isPhoneView
      ? "82vw"
      : isTabletView
        ? "360px"
        : "380px",
    padding: isPhoneView
      ? "0.65rem"
      : isTabletView
        ? "0.8rem"
        : "0.9rem",
    customClass: {
      popup: `sstli-swal-popup${
        isPhoneView || isTabletView
          ? " sstli-swal-compact"
          : ""
      }`,
      icon: "sstli-swal-icon",
      title: "sstli-swal-title",
      htmlContainer: "sstli-swal-text",
      actions: "sstli-swal-actions",
      confirmButton: "sstli-swal-confirm",
      cancelButton: "sstli-swal-cancel"
    }
  };
};

const showWarning = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: warningColor
  });

const showError = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#ae1e21"
  });

const showSuccess = (message) =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });


const askPrintAfterSave = () =>
  Swal.fire({
    ...getResponsiveSwalOptions(),
    icon: "question",
    title: "طباعة طلب السداد",
    text: "تم الحفظ بنجاح. هل تريد طباعة طلب السداد الآن؟",
    showCancelButton: true,
    confirmButtonText: "طباعة",
    cancelButtonText: "لاحقاً",
    confirmButtonColor: primaryColor,
    cancelButtonColor: "#9e9e9e"
  });

const htmlEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const pickValue = (row, names = [], index = null, fallback = "") => {
  if (!row) return fallback;

  for (const name of names) {
    const direct = row?.[name];
    if (direct !== undefined && direct !== null && String(direct).trim() !== "") return direct;

    const lower = row?.[String(name).charAt(0).toLowerCase() + String(name).slice(1)];
    if (lower !== undefined && lower !== null && String(lower).trim() !== "") return lower;
  }

  if (index !== null && row?.[`__index_${index}`] !== undefined && row?.[`__index_${index}`] !== null) {
    return row[`__index_${index}`];
  }

  return fallback;
};

const normalizePrintRows = (rows, fallbackItems = []) => {
  if (Array.isArray(rows) && rows.length > 0) {
    return rows.map((row, index) => ({
      id: index + 1,
      name: pickValue(row, ["DiplomName", "ItemName", "Name", "بيان", "البيان"], 1, fallbackItems[index]?.name || "-"),
      cost: toNumber(pickValue(row, ["Cost", "OrderTotal", "BillTotal", "Total", "القيمة"], 6, fallbackItems[index]?.cost || 0)),
      taxPercent: toNumber(pickValue(row, ["TaxPercent", "TaxValue", "TaxRate", "الضريبة%"], 4, fallbackItems[index]?.taxPercent || 0)),
      tax: toNumber(pickValue(row, ["Tax", "OrderTax", "BillTax", "مبلغ الضريبة"], 7, fallbackItems[index]?.tax || 0)),
      subTotal: toNumber(pickValue(row, ["SubTotal", "OrderSubTotal", "BillSubTotal", "الصافي"], 8, fallbackItems[index]?.subTotal || 0))
    }));
  }

  return fallbackItems.map((item, index) => ({
    id: index + 1,
    name: item.name || "-",
    cost: toNumber(item.cost),
    taxPercent: toNumber(item.taxPercent),
    tax: toNumber(item.tax),
    subTotal: toNumber(item.subTotal)
  }));
};

const buildOrderPayPrintHtml = ({ rows, saved, context, selectedStudent, currentUser, currentDoc, items, totals }) => {
  const first = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
  const printItems = normalizePrintRows(rows, items);

  const orderCode = saved?.orderCode || saved?.code || pickValue(first, ["Code", "OrderCode", "FormNo"], 0, "");
  const orderDate = pickValue(first, ["OrderDate", "Date", "FormDate"], 1, new Date().toLocaleDateString("en-US"));

  // مهم: لا نثبت اسم الفرع هنا ولا نعيد صياغته.
  // نعرض نفس النص القادم من PrintBillOrderPay أو من context كما هو.
  const branchHeader = String(
    pickValue(
      first,
      [
        "BranchName",
        "branchName",
        "Branch",
        "branch",
        "BranchTitle",
        "branchTitle",
        "BranchAddress",
        "branchAddress",
        "Address",
        "address",
        "الفرع"
      ],
      null,
      context?.branchName || context?.BranchName || ""
    ) || ""
  ).trim();

  const studentName = pickValue(
    first,
    ["StudentName", "CustomerName", "Name"],
    null,
    context?.studentName || context?.StudentName || selectedStudent?.studentName || ""
  );

  const nationalId = pickValue(
    first,
    ["NationalId", "IDNumber", "NationalID"],
    null,
    context?.nationalId || context?.NationalId || selectedStudent?.nationalId || ""
  );

  const mobile = pickValue(
    first,
    ["StudentTel", "Tel", "MobileNo", "Mobile"],
    null,
    context?.tel || context?.Tel || selectedStudent?.studentTel || selectedStudent?.tel || ""
  );

  const sellerName = pickValue(
    first,
    ["FullName", "UserName", "SellerName"],
    null,
    currentUser?.fullName || currentUser?.userName || "sa"
  );

  const total = toNumber(saved?.total ?? totals?.total);
  const tax = toNumber(saved?.tax ?? totals?.tax);
  const subTotal = toNumber(saved?.subTotal ?? totals?.subTotal);

  const itemRows = printItems
    .map(
      (item) => `
        <tr>
          <td class="item-name">${htmlEscape(item.name)}</td>
          <td>${money(item.cost)}</td>
          <td>${money(item.taxPercent)}</td>
          <td>${money(item.tax)}</td>
          <td>${money(item.subTotal)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="ltr">
<head>
  <meta charset="utf-8" />
  <title>طلب سداد ${htmlEscape(orderCode)}</title>
  <style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      font-family: Tahoma, Arial, sans-serif;
      color: #111827;
      margin: 0;
      background:
        radial-gradient(circle at 20% 0%, rgba(5,117,70,.12), transparent 28%),
        linear-gradient(135deg, #eef5f2 0%, #f7faf9 45%, #ffffff 100%);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: hidden;
    }
    .no-print {
      position: fixed;
      top: 16px;
      left: 16px;
      padding: 11px 22px;
      font-weight: 900;
      border: 0;
      border-radius: 14px;
      background: linear-gradient(135deg, #034d31, #034d31);
      color: #fff;
      cursor: pointer;
      z-index: 20;
      box-shadow: 0 10px 24px rgba(47,111,88,.22);
      letter-spacing: .2px;
    }
    .no-print:hover { filter: brightness(.96); }
    .preview {
      height: 100vh;
      overflow: auto;
      padding: 18px 0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .sheet {
      width: 800px;
      min-height: 1060px;
      margin: 0 auto;
      padding: 34px 48px 34px;
      background:
        linear-gradient(#fff, #fff) padding-box,
        linear-gradient(135deg, rgba(5,117,70,.45), rgba(214,238,229,.25), rgba(5,117,70,.45)) border-box;
      border: 1px solid transparent;
      border-radius: 22px;
      position: relative;
      box-shadow: 0 18px 45px rgba(31,45,61,.16);
      transform-origin: top center;
      overflow: hidden;
    }
    .sheet:before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 7px;
      background: linear-gradient(90deg, #034d31, #057546, #e6f3ee, #057546, #034d31);
    }
    .sheet:after {
      content: "SSTLI";
      position: absolute;
      right: 28px;
      bottom: 26px;
      font-size: 44px;
      font-weight: 950;
      color: rgba(5,117,70,.045);
      letter-spacing: 5px;
      pointer-events: none;
    }
    .header {
      display: grid;
      grid-template-columns: 150px 1fr 150px;
      align-items: center;
      border-bottom: 3px solid #111827;
      padding: 14px 0 22px;
      margin-bottom: 22px;
      min-height: 128px;
      position: relative;
    }
    .header:after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -6px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(5,117,70,.75), transparent);
    }
    .logo-wrap {
      text-align: center;
      padding-top: 0;
    }
    .logo-card {
      width: 122px;
      height: 122px;
      margin: 0 auto;
      border-radius: 24px;
      border: 1px solid rgba(5,117,70,.28);
      background: linear-gradient(145deg, #ffffff 0%, #f5fbf8 100%);
      box-shadow: 0 12px 26px rgba(5,117,70,.16);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 9px;
      position: relative;
    }
    .logo-card:before {
      content: "";
      position: absolute;
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: rgba(230,243,238,.55);
      z-index: 0;
    }
    .logo {
      width: 108px;
      height: 108px;
      object-fit: contain;
      display: inline-block;
      border-radius: 18px;
      position: relative;
      z-index: 1;
      filter: drop-shadow(0 5px 8px rgba(0,0,0,.10));
    }
    .company {
      text-align: center;
      line-height: 1.65;
      font-size: 15px;
      font-weight: 850;
      padding-top: 0;
      color: #111827;
    }
    .company-main {
      font-size: 21px;
      font-weight: 950;
      margin-bottom: 4px;
      direction: rtl;
      white-space: normal;
      color: #0f172a;
      text-shadow: 0 1px 0 rgba(255,255,255,.7);
    }
    .company div:not(.company-main) { color: #111827; }
    .title {
      width: fit-content;
      min-width: 180px;
      text-align: center;
      font-size: 24px;
      font-weight: 950;
      margin: 0 auto 24px;
      color: #5b4428;
      letter-spacing: .5px;
      padding: 8px 28px 10px;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(230,243,238,.75), rgba(255,255,255,.88));
      border: 1px solid rgba(5,117,70,.18);
      box-shadow: inset 0 -1px 0 rgba(5,117,70,.12);
    }
    .info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 34px;
      margin-bottom: 26px;
      direction: ltr;
      padding: 16px 18px;
      border-radius: 18px;
      background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
      border: 1px solid #edf4f1;
    }
    .info-row {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr) 78px;
      gap: 10px;
      align-items: center;
      min-height: 34px;
      font-size: 13px;
    }
    .en-label {
      direction: ltr;
      text-align: left;
      color: #222;
      font-size: 14px;
      white-space: nowrap;
    }
    .ar-label {
      direction: rtl;
      text-align: right;
      color: #333;
      font-size: 13px;
      white-space: nowrap;
    }
    .value {
      width: 100%;
      min-width: 0;
      font-weight: 950;
      text-align: center;
      min-height: 30px;
      line-height: 1.45;
      padding: 4px 3px;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .value.customer-name {
      direction: rtl;
      font-size: 12.5px;
      line-height: 1.55;
    }
    table.details {
      width: 640px;
      margin: 0 auto;
      border-collapse: separate;
      border-spacing: 0;
      direction: rtl;
      table-layout: fixed;
    }
    .details th {
      background: linear-gradient(180deg, #eef5f1 0%, #dfe8e4 100%);
      color: #111827;
      padding: 14px 8px;
      font-size: 14px;
      border: 3px solid #fff;
      text-align: center;
      font-weight: 950;
    }
    .details td {
      padding: 10px 8px;
      text-align: center;
      border-bottom: 1px dotted #777;
      font-weight: 900;
      font-size: 14px;
    }
    .details .item-name {
      text-align: right;
      width: 270px;
    }
    .separator {
      height: 3px;
      background: linear-gradient(90deg, #111827, #034d31, #111827);
      margin: 18px 0 12px;
      border-radius: 999px;
    }
    .summary {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 110px 48px 260px 1fr;
      gap: 10px;
      direction: ltr;
      align-items: start;
    }
    .amounts,
    .labels {
      border: 1px solid #222;
      background: #fff;
    }
    .amounts div,
    .labels div {
      border-bottom: 1px solid #222;
      min-height: 36px;
      line-height: 36px;
      font-weight: 950;
      text-align: center;
      font-size: 14px;
    }
    .amounts div:last-child,
    .labels div:last-child { border-bottom: 0; }
    .labels { direction: rtl; }
    .sar {
      font-size: 28px;
      line-height: 36px;
      text-align: center;
      font-weight: 950;
    }
    @media screen and (max-height: 800px) {
      .preview { padding-top: 10px; }
      .sheet { transform: scale(.68); margin-bottom: -330px; }
    }
    @media screen and (min-height: 801px) and (max-height: 930px) {
      .sheet { transform: scale(.78); margin-bottom: -230px; }
    }
    @media screen and (min-height: 931px) {
      .sheet { transform: scale(.88); margin-bottom: -120px; }
    }
    @media print {
      html, body { height: auto; overflow: visible; background: #fff; }
      .no-print { display: none !important; }
      .preview { height: auto; overflow: visible; padding: 0; display: block; }
      .sheet {
        width: 190mm;
        min-height: 270mm;
        margin: 0 auto;
        padding: 8mm 9mm 6mm;
        box-shadow: none;
        transform: none !important;
        border-radius: 0;
        border: 0;
      }
      .sheet:before, .sheet:after { display: none; }
    }
  </style>
${PRINT_READY_SCRIPT}</head>
<body>
  <button class="no-print" onclick="printWhenReady()">طباعة</button>

  <div class="preview">
  <div class="sheet">
    <div class="header">
      <div class="logo-wrap">
        <div class="logo-card">
          <img class="logo" src="${htmlEscape(logoImage)}" onerror="this.style.display='none'" />
        </div>
      </div>

      <div class="company">
        <div class="company-main">شركة معهد السعودي المتخصص العالي للتدريب</div>
        <div>${htmlEscape(branchHeader)}</div>
        <div>920012673</div>
        <div>312191561600003</div>
      </div>

      <div></div>
    </div>

    <div class="title">طلب سداد</div>

    <div class="info">
      <div class="info-row">
        <span class="en-label">Form No</span>
        <span class="value">${htmlEscape(orderCode)}</span>
        <span class="ar-label">رقم الطلب</span>
      </div>
      <div class="info-row">
        <span class="en-label">Customer Name</span>
        <span class="value customer-name">${htmlEscape(studentName)}</span>
        <span class="ar-label">اسم العميل</span>
      </div>
      <div class="info-row">
        <span class="en-label">Form Date</span>
        <span class="value">${htmlEscape(orderDate)}</span>
        <span class="ar-label">تاريخ الطلب</span>
      </div>
      <div class="info-row">
        <span class="en-label">ID Number</span>
        <span class="value">${htmlEscape(nationalId)}</span>
        <span class="ar-label">رقم الهوية</span>
      </div>
      <div class="info-row">
        <span class="en-label">Seller Name</span>
        <span class="value">${htmlEscape(sellerName)}</span>
        <span class="ar-label">المحصل</span>
      </div>
      <div class="info-row">
        <span class="en-label">Mobile No</span>
        <span class="value">${htmlEscape(mobile)}</span>
        <span class="ar-label">رقم الجوال</span>
      </div>
    </div>

    <table class="details">
      <thead>
        <tr>
          <th>البيان</th>
          <th>القيمة</th>
          <th>الضريبة</th>
          <th>مبلغ الضريبة</th>
          <th>الصافي</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="separator"></div>

    <div class="summary">
      <div class="amounts">
        <div>${money(total)}</div>
        <div>${money(tax)}</div>
        <div>${money(subTotal)}</div>
      </div>
      <div class="sar">﷼<br/>﷼<br/>﷼</div>
      <div class="labels">
        <div>الإجمالي قبل الضريبة</div>
        <div>ضريبة القيمة المضافة</div>
        <div>الإجمالي بعد الضريبة</div>
      </div>
      <div></div>
    </div>
  </div>
  </div>
</body>
</html>`;
};

const infoCell = ({ value }) => (
  <Tooltip title={safeText(value)} arrow>
    <Typography
      sx={{
        width: "100%",
        fontWeight: 900,
        fontSize: "0.82rem",
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" },
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        direction: "rtl"
      }}
    >
      <bdi dir="auto">{safeText(value)}</bdi>
    </Typography>
  </Tooltip>
);

const SectionTitle = ({ children, color = dangerColor }) => (
  <Typography
    sx={{
      fontWeight: 950,
      color,
      fontSize: "1rem",
      mb: 1,
      textAlign: "start",
      lineHeight: 1.15,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        fontSize: "0.75rem",
        mb: 0.3
      },
      "@media (max-width:599px)": {
        fontSize: "0.75rem",
        mb: 0.22
      }
    }}
  >
    {children}
  </Typography>
);

const DetailBox = ({ label, value, color = textColor }) => (
  <Paper
    elevation={0}
    sx={(theme) => {
      const isDark = theme.palette.mode === "dark";
      return {
      p: 1.2,
      borderRadius: 2,
      border: isDark ? `1px solid #67C99D` : "1px solid #e6f3ee",
      backgroundColor: isDark ? theme.palette.surfaces.card : whiteColor,
      height: "100%",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        p: 0.48,
        borderRadius: 1.3,
        minHeight: 48
      },
      "@media (max-width:599px)": {
        p: 0.34,
        minHeight: 44
      }
      };
    }}
  >
    <Typography
      sx={{
        color: "#6f8a81",
        fontWeight: 900,
        fontSize: "0.76rem",
        mb: 0.4,
        textAlign: "start",
        lineHeight: 1.15,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          fontSize: "0.75rem",
          mb: 0.12
        },
        "@media (max-width:599px)": {
          fontSize: "0.75rem"
        }
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        color,
        fontWeight: 950,
        lineHeight: 1.6,
        wordBreak: "break-word",
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          fontSize: "0.75rem",
          lineHeight: 1.25
        },
        "@media (max-width:599px)": {
          fontSize: "0.75rem"
        },
        textAlign: "start"
      }}
    >
      <bdi dir="auto">{safeText(value)}</bdi>
    </Typography>
  </Paper>
);

const ActionChoiceButton = ({ active, icon, title, subtitle, onClick, color }) => (
  <Button
    fullWidth
    variant={active ? "contained" : "outlined"}
    onClick={onClick}
    startIcon={icon}
    sx={uiLayout.withUiSx({
      minHeight: 62,
      borderRadius: 3,
      justifyContent: "flex-start",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        minHeight: 42,
        borderRadius: 1.5,
        px: 0.65,
        py: 0.35
      },
      "@media (max-width:599px)": {
        minHeight: 38,
        px: 0.5,
        py: 0.28
      },
      textAlign: "start",
      direction: "rtl",
      fontWeight: 950,
      borderColor: active ? pinColor(color) : pinColor("#d7eee4"),
      backgroundColor: (theme) => (active ? pinColor(color) : (theme.palette.mode === "dark" ? theme.palette.surfaces.card : "#fff")),
      color: active ? pinColor("#fff") : color,
      "& .MuiButton-startIcon": {
        ml: 1,
        mr: 0,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          ml: 0.45,
          "& svg": { fontSize: "0.9rem" }
        },
        "@media (max-width:599px)": {
          ml: 0.35,
          "& svg": { fontSize: "0.8rem" }
        }
      },
      "&:hover": {
        borderColor: pinColor(color),
        backgroundColor: (theme) => (active ? pinColor(color) : (theme.palette.mode === "dark" ? theme.palette.surfaces.hover : "#f8fbfa"))
      }
    }, uiLayout.buttonSx)}
  >
    <Box sx={{ width: "100%", direction: "rtl" }}>
      <Typography
        sx={{
          fontWeight: 950,
          lineHeight: 1.15,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
          "@media (max-width:599px)": { fontSize: "0.75rem" }
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "0.75rem",
          opacity: 0.85,
          lineHeight: 1.15,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
          "@media (max-width:599px)": {
            fontSize: "0.75rem",
            display: "none"
          }
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  </Button>
);

const StudentPaymentOrderDialog = ({
  open,
  onClose,
  context,
  selectedStudent,
  loading = false,
  apiBaseUrl,
  onSaved
}) => {
  const theme = useTheme();
  const isDarkGrid = theme.palette.mode === "dark";
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`,
    { noSsr: true }
  );
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );
  const isCompact = !isDesktop;

  const [paymentKind, setPaymentKind] = useState("diplom");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [itemsLoading, setItemsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [cashBoxGuid, setCashBoxGuid] = useState("");
  const [cashBoxName, setCashBoxName] = useState("");
  const [costCenterGuid, setCostCenterGuid] = useState("");
  const [ref, setRef] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [bankOptions, setBankOptions] = useState([]);
  const [cashBoxLoading, setCashBoxLoading] = useState(false);
  const [feeCatalogOpen, setFeeCatalogOpen] = useState(false);
  const [feeCatalogLoading, setFeeCatalogLoading] = useState(false);
  const [feeCatalog, setFeeCatalog] = useState([]);
  const [savedPrintResult, setSavedPrintResult] = useState(null);
  const [keepDialogOpenAfterSave, setKeepDialogOpenAfterSave] = useState(false);
  const [printSnapshot, setPrintSnapshot] = useState(null);

  const lastOrders = useMemo(() => {
    if (Array.isArray(context?.lastOrders)) return context.lastOrders;
    if (Array.isArray(context?.LastOrders)) return context.LastOrders;
    return [];
  }, [context]);

  const lastBills = useMemo(() => {
    if (Array.isArray(context?.lastBills)) return context.lastBills;
    if (Array.isArray(context?.LastBills)) return context.LastBills;
    return [];
  }, [context]);

  const totals = useMemo(() => {
    const total = items.reduce((sum, item) => sum + toNumber(item.cost), 0);
    const tax = items.reduce((sum, item) => sum + toNumber(item.tax), 0);
    const subTotal = items.reduce((sum, item) => sum + toNumber(item.subTotal), 0);

    return {
      total: round2(total),
      tax: round2(tax),
      subTotal: round2(subTotal)
    };
  }, [items]);

  const cashBoxDisplayName = useMemo(() => {
    if (cashBoxLoading) return "جاري التحميل...";

    if (cashBoxName && String(cashBoxName).trim()) return cashBoxName;

    if (paymentMethod === "cash" && cashBoxGuid) return "صندوق مكتب المستخدم";
    if (paymentMethod === "network" && cashBoxGuid) return "بنك الشبكة";
    if (paymentMethod === "bank" && cashBoxGuid) return "البنك المختار";

    return "";
  }, [cashBoxLoading, cashBoxName, paymentMethod, cashBoxGuid]);

  const orderColumns = useMemo(
    () => [
      {
        field: "Code",
        headerName: "رقم الطلب",
        flex: 0.55,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => infoCell({ value: p.row?.Code || p.row?.code || p.row?.__index_0 })
      },
      {
        field: "OrderDate",
        headerName: "تاريخ الطلب",
        flex: 0.75,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({ value: p.row?.OrderDate || p.row?.orderDate || p.row?.__index_1 })
      },
      {
        field: "DocName",
        headerName: "نوع الطلب",
        flex: 1.2,
        minWidth: 180,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({ value: p.row?.DocName || p.row?.docName || p.row?.__index_2 })
      },
      {
        field: "FullName",
        headerName: "المستخدم",
        flex: 1,
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({ value: p.row?.FullName || p.row?.fullName || p.row?.__index_3 })
      },
      {
        field: "ORDERSTAUT",
        headerName: "حالة الطلب",
        flex: 0.65,
        minWidth: 110,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => {
          const value = p.row?.ORDERSTAUT || p.row?.orderStaut || p.row?.__index_4 || "-";
          return (
            <Chip
              label={safeText(value)}
              size="small"
              sx={(theme) => {
                const isDark = theme.palette.mode === "dark";
                const confirmed = String(value).includes("مؤكد");
                return {
                  fontWeight: 950,
                  borderRadius: 2,
                  color: confirmed ? (isDark ? "#67c99d" : "#2e7d32") : (isDark ? "#f0ad4e" : warningColor),
                  backgroundColor: confirmed
                    ? (isDark ? "rgba(103,201,157,.14)" : "#e8f5e9")
                    : (isDark ? "rgba(237,137,54,.14)" : "#fff3e0")
                };
              }}
            />
          );
        }
      },
      {
        field: "OrderSubTotal",
        headerName: "القيمة",
        flex: 0.55,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({
            value: money(p.row?.OrderSubTotal || p.row?.orderSubTotal || p.row?.__index_5)
          })
      }
    ],
    []
  );

  const billColumns = useMemo(
    () => [
      {
        field: "Code",
        headerName: "رقم الفاتورة",
        flex: 0.65,
        minWidth: 110,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => infoCell({ value: p.row?.Code || p.row?.code || p.row?.__index_0 })
      },
      {
        field: "BillDate",
        headerName: "تاريخ الفاتورة",
        flex: 0.75,
        minWidth: 125,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({ value: p.row?.BillDate || p.row?.billDate || p.row?.__index_1 })
      },
      {
        field: "DocName",
        headerName: "نوع الفاتورة",
        flex: 1.2,
        minWidth: 190,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({ value: p.row?.DocName || p.row?.docName || p.row?.__index_2 })
      },
      {
        field: "FullName",
        headerName: "المستخدم",
        flex: 1,
        minWidth: 155,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({ value: p.row?.FullName || p.row?.fullName || p.row?.__index_3 })
      },
      {
        field: "BillSubTotal",
        headerName: "القيمة",
        flex: 0.6,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (p) =>
          infoCell({
            value: money(p.row?.BillSubTotal || p.row?.billSubTotal || p.row?.__index_4)
          })
      }
    ],
    []
  );

  const itemColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "البيان",
        flex: 1.6,
        minWidth: 220,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => infoCell({ value: p.row?.name })
      },
      {
        field: "unit",
        headerName: "الوحدة",
        flex: 0.45,
        minWidth: 75,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => infoCell({ value: p.row?.unit || "Pcs" })
      },
      {
        field: "qty",
        headerName: "الكمية",
        flex: 0.45,
        minWidth: 75,
        align: "center",
        headerAlign: "center",
        editable: true,
        type: "number",
        renderCell: (p) => infoCell({ value: p.row?.qty || 1 })
      },
      {
        field: "cost",
        headerName: "التكلفة",
        flex: 0.55,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        editable: true,
        type: "number",
        renderCell: (p) => infoCell({ value: money(p.row?.cost) })
      },
      {
        field: "taxPercent",
        headerName: "الضريبة %",
        flex: 0.55,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        editable: true,
        type: "number",
        renderCell: (p) => infoCell({ value: p.row?.taxPercent ?? 0 })
      },
      {
        field: "tax",
        headerName: "الضريبة",
        flex: 0.55,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => infoCell({ value: money(p.row?.tax) })
      },
      {
        field: "subTotal",
        headerName: "الصافي",
        flex: 0.55,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        editable: true,
        type: "number",
        renderCell: (p) => infoCell({ value: money(p.row?.subTotal) })
      }
    ],
    []
  );

  const compactOrderColumns = isPhone
    ? orderColumns.filter((c) => ["Code", "DocName", "OrderSubTotal"].includes(c.field))
    : isTablet
      ? orderColumns.filter((c) => ["Code", "OrderDate", "DocName", "ORDERSTAUT", "OrderSubTotal"].includes(c.field))
      : orderColumns;

  const compactBillColumns = isPhone
    ? billColumns.filter((c) => ["Code", "DocName", "BillSubTotal"].includes(c.field))
    : isTablet
      ? billColumns.filter((c) => ["Code", "BillDate", "DocName", "BillSubTotal"].includes(c.field))
      : billColumns;

  const compactItemColumns = isPhone
    ? itemColumns.filter((c) => ["name", "qty", "subTotal"].includes(c.field))
    : isTablet
      ? itemColumns.filter((c) => ["name", "qty", "cost", "taxPercent", "subTotal"].includes(c.field))
      : itemColumns;

  const fitCompactColumn = (column) => {
    if (!isCompact) return column;

    const widthMap = isPhone
      ? {
          Code: 60,
          OrderSubTotal: 65,
          BillSubTotal: 65,
          qty: 50,
          subTotal: 68
        }
      : {
          Code: 72,
          OrderDate: 82,
          BillDate: 82,
          ORDERSTAUT: 76,
          OrderSubTotal: 80,
          BillSubTotal: 80,
          qty: 55,
          cost: 70,
          taxPercent: 66,
          subTotal: 80
        };

    if (column.field === "DocName" || column.field === "name") {
      return {
        ...column,
        flex: 1,
        minWidth: isPhone ? 110 : 145,
        width: undefined
      };
    }

    const width = widthMap[column.field];
    return width
      ? { ...column, flex: undefined, minWidth: width, width, maxWidth: width }
      : column;
  };

  const rowsWithIds = (rows) =>
    rows.map((row, index) => ({
      ...row,
      id:
        row.id ||
        row.Guid ||
        row.guid ||
        row.Code ||
        row.code ||
        row.__index_0 ||
        `${index + 1}`
    }));

  const normalizePaymentItem = (item, index) => ({
    id: item.id || item.diplomGuid || item.DiplomGuid || item.code || item.Code || index + 1,
    code: item.code || item.Code || "",
    name: item.name || item.Name || "",
    unit: item.unit || item.Unit || "Pcs",
    qty: toNumber(item.qty ?? item.Qty ?? 1) || 1,
    cost: round2(toNumber(item.cost ?? item.Cost ?? 0)),
    taxPercent: round2(toNumber(item.taxPercent ?? item.TaxPercent ?? 0)),
    tax: round2(toNumber(item.tax ?? item.Tax ?? 0)),
    subTotal: round2(toNumber(item.subTotal ?? item.SubTotal ?? 0)),
    diplomGuid: item.diplomGuid || item.DiplomGuid || "",
    diplomType: String(item.diplomType ?? item.DiplomType ?? "0")
  });

  const recalculatePaymentItem = (row, changedField = "") => {
    const qty = toNumber(row.qty) || 1;
    const taxPercent = toNumber(row.taxPercent);
    let cost = toNumber(row.cost);
    let tax = toNumber(row.tax);
    let subTotal = toNumber(row.subTotal);

    if (changedField === "subTotal") {
      if (subTotal > 0) {
        cost = subTotal / (1 + taxPercent / 100);
        tax = subTotal - cost;
      }
    } else {
      const baseTotal = qty * cost;
      tax = baseTotal * (taxPercent / 100);
      subTotal = baseTotal + tax;
    }

    return {
      ...row,
      qty: round2(qty),
      cost: round2(cost),
      taxPercent: round2(taxPercent),
      tax: round2(tax),
      subTotal: round2(subTotal)
    };
  };

  const handleItemRowUpdate = (newRow, oldRow) => {
    let changedField = "";

    if (toNumber(newRow.subTotal) !== toNumber(oldRow.subTotal)) changedField = "subTotal";
    else if (toNumber(newRow.qty) !== toNumber(oldRow.qty)) changedField = "qty";
    else if (toNumber(newRow.cost) !== toNumber(oldRow.cost)) changedField = "cost";
    else if (toNumber(newRow.taxPercent) !== toNumber(oldRow.taxPercent)) changedField = "taxPercent";

    const updatedRow = recalculatePaymentItem(newRow, changedField);

    setItems((prev) =>
      prev.map((item) => (String(item.id) === String(updatedRow.id) ? updatedRow : item))
    );

    return updatedRow;
  };

  const currentDoc = useMemo(() => {
    if (!context) return null;

    if (paymentKind === "fees") {
      return {
        docGuid: context.payFeesDocGuid || context.PayFeesDocGuid || context.payFESSDocGuid || "",
        docCode: context.payFeesDocCode || context.PayFeesDocCode || context.payFESSDocCode || "",
        docName: context.payFeesDocName || context.PayFeesDocName || context.payFESSDocName || "سداد رسوم"
      };
    }

    return {
      docGuid: context.payDocGuid || context.PayDocGuid || "",
      docCode: context.payDocCode || context.PayDocCode || "",
      docName: context.payDocName || context.PayDocName || "سداد قسط شهري"
    };
  }, [context, paymentKind]);

  const resetExecutionFields = () => {
    setItems([]);
    setCashBoxGuid("");
    setCashBoxName("");
    setCostCenterGuid("");
    setRef("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setAttachmentName("");
    setAttachmentFile(null);
    setBankOptions([]);
    setFeeCatalog([]);
    setFeeCatalogOpen(false);
    setSavedPrintResult(null);
    setKeepDialogOpenAfterSave(false);
    setPrintSnapshot(null);
  };

  useEffect(() => {
    // مهم: بعد الحفظ ممكن الأب يحاول يقفل الـ Dialog بتغيير open إلى false.
    // طالما keepDialogOpenAfterSave=true نسيبه ظاهر عشان زر الطباعة يفضل موجود.
    if (!open && !keepDialogOpenAfterSave) {
      resetExecutionFields();
      setPaymentKind("diplom");
      setPaymentMethod("cash");
      return;
    }

    if ((open || keepDialogOpenAfterSave) && context) {
      loadPaymentItems("diplom");
      setPaymentKind("diplom");
      handleChangeMethod("cash");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context, keepDialogOpenAfterSave]);

  const loadPaymentItems = async (kind = paymentKind) => {
    if (!context) return;

    try {
      setItemsLoading(true);
      setItems([]);

      const params = new URLSearchParams({
        paymentKind: kind,
        diplomGuid: context.diplomGuid || context.DiplomGuid || "",
        regDocGuid: context.regDocGuid || context.RegDocGuid || "",
        studentNational: String(context.studentNational ?? context.StudentNational ?? "0")
      });

      const response = await fetch(
        `${apiBaseUrl}/api/student-payment-orders/payment-items?${params.toString()}`
      );

      const result = await response.json().catch(() => null);

    if (!response.ok) {
  console.error("Payment items error:", result);

  throw new Error(
    result?.error ||
    result?.message ||
    "تعذر تحميل بنود السداد"
  );
}

      const data = Array.isArray(result?.data) ? result.data : [];

      setItems(data.map((item, index) => normalizePaymentItem(item, index)));
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل بنود السداد");
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleChangeKind = async (kind) => {
    setPaymentKind(kind);
    await loadPaymentItems(kind);
  };

  const loadBranchCashInfo = async () => {
    const user = getCurrentUser();
    const branchGuid =
      getBranchForWork(user) ||
      context?.branchForWork ||
      context?.BranchForWork ||
      context?.branchGuid ||
      context?.BranchGuid ||
      "";

    if (!branchGuid || branchGuid === noGuid) {
      showWarning("لا يتوفر فرع عمل للمستخدم الحالي، برجاء مراجعة بيانات المستخدم");
      return;
    }

    try {
      setCashBoxLoading(true);

      const params = new URLSearchParams({ branchGuid });

      const response = await fetch(
        `${apiBaseUrl}/api/student-payment-orders/branch-cash-info?${params.toString()}`
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "فشل تحميل بيانات صندوق المكتب");
      }

      setCashBoxName(result?.cashBoxName || result?.CashBoxName || "");
      setCashBoxGuid(result?.cashBoxGuid || result?.CashBoxGuid || "");
      setCostCenterGuid(result?.costCenterGuid || result?.CostCenterGuid || "");
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل صندوق المكتب");
      setCashBoxName("");
      setCashBoxGuid("");
      setCostCenterGuid("");
    } finally {
      setCashBoxLoading(false);
    }
  };

  const loadBankOptions = async () => {
    try {
      setCashBoxLoading(true);
      setBankOptions([]);

      const response = await fetch(`${apiBaseUrl}/api/student-payment-orders/cashboxes?kind=bank`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحميل قائمة البنوك");
      }

      const data = Array.isArray(result?.data) ? result.data : [];
      setBankOptions(data);

      if (data.length === 0) {
        showWarning("لا توجد بنوك نشطة متاحة للاختيار");
      }
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل قائمة البنوك");
    } finally {
      setCashBoxLoading(false);
    }
  };

  const handleSelectBank = (cashBoxGuidValue) => {
    const selected = bankOptions.find(
      (item) =>
        String(item.cashBoxGuid || item.CashBoxGuid || "").toLowerCase() ===
        String(cashBoxGuidValue || "").toLowerCase()
    );

    if (!selected) {
      setCashBoxGuid("");
      setCashBoxName("");
      setCostCenterGuid("");
      return;
    }

    setCashBoxGuid(selected.cashBoxGuid || selected.CashBoxGuid || "");
    setCashBoxName(selected.cashBoxName || selected.CashBoxName || "");
    setCostCenterGuid(selected.costCenterGuid || selected.CostCenterGuid || "");
  };

  const handleChangeMethod = async (method) => {
    setPaymentMethod(method);
    setAttachmentName("");

    if (method === "cash") {
      setRef("CASH");
      setBankOptions([]);
      await loadBranchCashInfo();
      return;
    }

    setRef("");
    setCashBoxGuid("");
    setCashBoxName("");
    setCostCenterGuid("");

    if (method === "network") {
      setBankOptions([]);

      try {
        setCashBoxLoading(true);

        const response = await fetch(`${apiBaseUrl}/api/student-payment-orders/default-network-bank`);
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.message || result?.error || "تعذر تحميل بنك الشبكة الافتراضي");
        }

        setCashBoxName(result?.cashBoxName || "");
        setCashBoxGuid(result?.cashBoxGuid || "");
        setCostCenterGuid(result?.costCenterGuid || "");
      } catch (error) {
        showError(error.message || "حدث خطأ أثناء تحميل بنك الشبكة الافتراضي");
      } finally {
        setCashBoxLoading(false);
      }

      return;
    }

    if (method === "bank") {
      await loadBankOptions();
    }
  };

  const loadFeeCatalog = async () => {
    if (!context) return;

    const docGuid = currentDoc?.docGuid || "";
    const priceListGuid =
      context.priceListGuid ||
      context.PriceListGuid ||
      context.feesPriceListGuid ||
      context.FeesPriceListGuid ||
      "";

    if ((!docGuid || docGuid === noGuid) && (!priceListGuid || priceListGuid === noGuid)) {
      showWarning("لا يمكن قراءة قائمة السعر الخاصة برسوم هذا الفرع");
      return;
    }

    try {
      setFeeCatalogLoading(true);
      setFeeCatalog([]);

      const params = new URLSearchParams({
        docGuid,
        priceListGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/student-payment-orders/fee-catalog?${params.toString()}`
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحميل قائمة الرسوم");
      }

      const data = Array.isArray(result?.data) ? result.data : [];
      setFeeCatalog(data.map((item, index) => normalizePaymentItem(item, `fee-${index + 1}`)));
      setFeeCatalogOpen(true);

      if (data.length === 0) {
        showWarning("لا توجد رسوم مضافة في قائمة السعر لهذا الفرع");
      }
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل قائمة الرسوم");
    } finally {
      setFeeCatalogLoading(false);
    }
  };

  const handleAddFeeItem = (fee) => {
    const row = recalculatePaymentItem(
      {
        ...fee,
        id: `${fee.diplomGuid || fee.code || Date.now()}-${Date.now()}`,
        unit: fee.unit || "Pcs",
        qty: toNumber(fee.qty) || 1,
        taxPercent: toNumber(fee.taxPercent),
        tax: toNumber(fee.tax),
        subTotal: toNumber(fee.subTotal),
        diplomType: String(fee.diplomType ?? "1")
      },
      fee.subTotal > 0 ? "subTotal" : "cost"
    );

    setItems((prev) => [...prev, row]);
    setFeeCatalogOpen(false);
  };

  const validateBeforeSave = () => {
    if (!context) {
      showWarning("بيانات السداد غير جاهزة");
      return false;
    }

    if (!currentDoc?.docGuid || currentDoc.docGuid === noGuid) {
      showWarning("لا يمكن قراءة دفتر السداد");
      return false;
    }

    if (!cashBoxGuid || cashBoxGuid === noGuid) {
      showWarning("برجاء إدخال/اختيار الخزينة أو البنك");
      return false;
    }

    if (!costCenterGuid || costCenterGuid === noGuid) {
      showWarning("برجاء إدخال مركز التكلفة");
      return false;
    }

    if (!ref.trim()) {
      showWarning("برجاء إدخال رقم المرجع");
      return false;
    }

    if (paymentMethod === "bank" && !attachmentFile) {
      showWarning("الحوالة البنكية تحتاج إرفاق مستند الدفع");
      return false;
    }

    if (!items.length || totals.subTotal <= 0) {
      showWarning(
        paymentKind === "fees"
          ? "لا توجد بنود رسوم صالحة للسداد في استمارة الطالب"
          : "لا توجد بنود أو مبلغ السداد صفر"
      );
      return false;
    }

    return true;
  };



  const openPrintPreview = async (savedResult) => {
    const saved = savedResult || {};
    const orderGuid =
      saved.orderGuid ||
      saved.OrderGuid ||
      saved.orderPayGuid ||
      saved.OrderPayGuid ||
      saved.guid ||
      saved.Guid ||
      saved.data?.orderGuid ||
      saved.data?.OrderGuid ||
      saved.data?.orderPayGuid ||
      saved.data?.OrderPayGuid ||
      "";

    let printRows = [];

    if (orderGuid && orderGuid !== noGuid) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/student-payment-orders/print/${orderGuid}`
        );

        const result = await response.json().catch(() => null);

        if (response.ok) {
          printRows = Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.Data)
              ? result.Data
              : [];
        }
      } catch {
        printRows = [];
      }
    }

    const currentUser = getCurrentUser();
    const snapshot = printSnapshot || {};

    const html = buildOrderPayPrintHtml({
      rows: printRows,
      saved,
      context: snapshot.context || context,
      selectedStudent: snapshot.selectedStudent || selectedStudent,
      currentUser,
      currentDoc: snapshot.currentDoc || currentDoc,
      items: snapshot.items || items,
      totals: snapshot.totals || totals
    });

    if (isCompact) {
      try {
        const orderCode =
          saved?.orderCode ||
          saved?.code ||
          saved?.Code ||
          "طلب";

        await exportHtmlDocumentToPdf({
          html,
          fileName: `طلب-سداد-${orderCode}.pdf`,
          selector: ".sheet, .preview, body",
          scale: isPhone ? 2 : 2.25
        });
      } catch (pdfError) {
        showError(
          pdfError?.message ||
            "تعذر تصدير طلب السداد PDF"
        );
      }

      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=850"
    );

    if (!printWindow) {
      showWarning(
        "المتصفح منع فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى."
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  const savePaymentOrder = async () => {
    if (!validateBeforeSave()) return;

    const confirm = await Swal.fire({
      ...getResponsiveSwalOptions(),
      icon: "question",
      title: "حفظ طلب السداد",
      text: `هل تريد حفظ طلب ${paymentKind === "fees" ? "سداد رسوم" : "سداد قسط شهري"} بقيمة ${money(totals.subTotal)} ر.س؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، حفظ",
      cancelButtonText: "تراجع",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#777",
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);

      const user = getCurrentUser();

      const payload = {
        paymentKind,
        paymentMethod,

        accountGuid: context.accountGuid || context.AccountGuid || "",
        studentName:
          context.studentName ||
          context.StudentName ||
          selectedStudent?.studentName ||
          "",
        nationalId:
          context.nationalId ||
          context.NationalId ||
          selectedStudent?.nationalId ||
          "",
        tel:
          context.tel ||
          context.Tel ||
          selectedStudent?.studentTel ||
          selectedStudent?.tel ||
          "",
        studentNational: String(context.studentNational ?? context.StudentNational ?? "0"),

        diplomGuid: context.diplomGuid || context.DiplomGuid || "",
        regDocGuid: context.regDocGuid || context.RegDocGuid || "",

        docGuid: currentDoc.docGuid,
        docCode: currentDoc.docCode,
        docName: currentDoc.docName,

        branchGuid: context.branchGuid || context.BranchGuid || "",
        branchName: context.branchName || context.BranchName || "",

        cashBoxGuid,
        cashBoxName,
        costCenterGuid,

        ref,
        payDate,
        notes,

        total: totals.total,
        tax: totals.tax,
        subTotal: totals.subTotal,

        // الصلاحية الفعلية لطلب السداد يتم فحصها في الباكيند بنفس منطق الديسكتوب:
        // DoUserHavePremision + FormName = "orderpay".
        user: {
          userGuid: getUserGuid(user),
          userName: user?.userName || "",
          fullName: user?.fullName || "",
          userJop: Number(user?.userJop || 0),
          chkAmount: Boolean(user?.chkAmount),
          chkOtherFess: Boolean(user?.chkOtherFess),
          chkBranch: Boolean(user?.chkBranch),
          chkTrainer: Boolean(user?.chkTrainer),
          staut: user?.staut_ !== false,
          branchForWork: getBranchForWork(user)
        },

        items: items.map((item) => ({
          code: item.code || "",
          name: item.name || "",
          unit: item.unit || "Pcs",
          qty: toNumber(item.qty) || 1,
          cost: toNumber(item.cost),
          taxPercent: toNumber(item.taxPercent),
          tax: toNumber(item.tax),
          subTotal: toNumber(item.subTotal),
          diplomGuid: item.diplomGuid || "",
          diplomType: String(item.diplomType ?? "0")
        }))
      };

      let response;

      if (attachmentFile) {
        const formData = new FormData();
        formData.append("payload", JSON.stringify(payload));
        formData.append("file", attachmentFile);

        response = await fetch(`${apiBaseUrl}/api/student-payment-orders/create-with-attachment`, {
          method: "POST",
          body: formData
        });
      } else {
        response = await fetch(`${apiBaseUrl}/api/student-payment-orders/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "فشل حفظ طلب السداد");
      }

      // نخزن نسخة من بيانات الطباعة قبل أي تحديث من الشاشة الأب
      // ونثبت فتح الديالوج حتى لو الأب غير open=false بعد الحفظ.
      setPrintSnapshot({
        context,
        selectedStudent,
        currentDoc,
        items,
        totals
      });
      setSavedPrintResult(result);
      setKeepDialogOpenAfterSave(true);

      await showSuccess(result?.message || "تم حفظ طلب السداد بنجاح");

      // مهم جداً:
      // لا نستدعي onSaved هنا لأن أغلب الشاشات الأب تقفل الديالوج بعد الحفظ.
      // المطلوب في طلب السداد أن الديالوج يفضل مفتوحاً بعد الحفظ
      // عشان زر "طباعة الطلب" يفضل ظاهر وتقدر تطبع أكتر من مرة.
      // لو محتاج تحدّث القائمة الخارجية، اعملها من الأب عند إغلاق الديالوج أو بعد الطباعة.
      // if (typeof onSaved === "function") {
      //   onSaved(result);
      // }
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء حفظ طلب السداد");
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || itemsLoading || saving || feeCatalogLoading;

  return (
    <>
      <style>
        {`
          .sstli-swal-popup {
            font-family: Cairo, Arial, sans-serif !important;
            width: min(380px, calc(100vw - 32px)) !important;
            max-width: calc(100vw - 32px) !important;
            padding: 0.9rem !important;
            border-radius: 14px !important;
          }

          .sstli-swal-icon {
            width: 3.4em !important;
            height: 3.4em !important;
            margin: 0.55em auto 0.25em !important;
          }

          .sstli-swal-icon .swal2-icon-content {
            font-size: 2.25em !important;
          }

          .sstli-swal-title {
            padding: 0.2em 0.45em 0 !important;
            font-weight: 950 !important;
            font-size: 1rem !important;
            line-height: 1.25 !important;
          }

          .sstli-swal-text {
            margin: 0.4em 0 0 !important;
            padding: 0 0.65em !important;
            font-weight: 800 !important;
            font-size: 0.76rem !important;
            line-height: 1.45 !important;
          }

          .sstli-swal-actions {
            margin: 0.7em auto 0 !important;
            gap: 0.4rem !important;
          }

          .sstli-swal-confirm,
          .sstli-swal-cancel {
            min-width: 82px !important;
            min-height: 32px !important;
            margin: 0 !important;
            padding: 0.42rem 0.85rem !important;
            font-weight: 900 !important;
            font-size: 0.72rem !important;
            border-radius: 8px !important;
          }

          @media (max-width: ${DESKTOP_BREAKPOINT - 0.05}px) {
            .sstli-swal-popup.sstli-swal-compact {
              max-width: 360px !important;
              border-radius: 14px !important;
            }

            .sstli-swal-icon {
              width: 3.5em !important;
              height: 3.5em !important;
              margin: 0.65em auto 0.3em !important;
            }

            .sstli-swal-icon .swal2-icon-content {
              font-size: 2.4em !important;
            }

            .sstli-swal-title {
              padding: 0.25em 0.5em 0 !important;
              font-size: 1rem !important;
              line-height: 1.25 !important;
            }

            .sstli-swal-text {
              margin: 0.45em 0 0 !important;
              padding: 0 0.8em !important;
              font-size: 0.72rem !important;
              line-height: 1.45 !important;
            }

            .sstli-swal-actions {
              margin: 0.7em auto 0 !important;
              gap: 0.35rem !important;
            }

            .sstli-swal-confirm,
            .sstli-swal-cancel {
              min-width: 78px !important;
              min-height: 32px !important;
              padding: 0.4rem 0.8rem !important;
              margin: 0 !important;
              font-size: 0.68rem !important;
            }
          }

          @media (max-width: 599px) {
            .sstli-swal-popup.sstli-swal-compact {
              width: 82vw !important;
              max-width: 300px !important;
              border-radius: 12px !important;
            }

            .sstli-swal-icon {
              width: 3em !important;
              height: 3em !important;
              margin: 0.55em auto 0.25em !important;
            }

            .sstli-swal-icon .swal2-icon-content {
              font-size: 2em !important;
            }

            .sstli-swal-title {
              font-size: 0.82rem !important;
            }

            .sstli-swal-text {
              font-size: 0.58rem !important;
              line-height: 1.4 !important;
              padding: 0 0.55em !important;
            }

            .sstli-swal-confirm,
            .sstli-swal-cancel {
              min-width: 66px !important;
              min-height: 29px !important;
              padding: 0.34rem 0.6rem !important;
              font-size: 0.58rem !important;
              border-radius: 8px !important;
            }
          }
        `}
      </style>

      <Dialog
      open={open || keepDialogOpenAfterSave}
      onClose={() => {
        if (!disabled) {
          setKeepDialogOpenAfterSave(false);
          setSavedPrintResult(null);
          setPrintSnapshot(null);
          onClose?.();
        }
      }}
      fullWidth
      maxWidth="xl"
      fullScreen={isPhone}
      sx={uiLayout.withUiSx({
        "& .MuiDialog-container": {
          pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
          px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          pb: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          alignItems: isPhone ? "stretch" : "center"
        }
      }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
          maxWidth: isPhone ? "100vw" : isTablet ? "1180px" : undefined,
          height: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "92vh",
          maxHeight: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "92vh",
          m: 0,
          borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
          direction: "rtl",
          textAlign: "start",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <DialogTitle
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            p: 0,
            background: isDark
              ? `linear-gradient(135deg, ${theme.palette.surfaces.section}, ${theme.palette.surfaces.card})`
              : `linear-gradient(135deg, ${whiteColor} 0%, #f1faf6 55%, ${primaryLight} 100%)`,
            borderBottom: isDark ? `1px solid #67C99D` : `1px solid ${primaryLight}`
          };
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: isPhone ? 0.5 : isTablet ? 0.8 : 2.5,
            py: isPhone ? 0.38 : isTablet ? 0.55 : 1.5,
            gap: isCompact ? 0.35 : 1
          }}
        >
          <Stack direction="row" spacing={isCompact ? 0.35 : 1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <IconButton
              onClick={() => {
                setKeepDialogOpenAfterSave(false);
                setSavedPrintResult(null);
                setPrintSnapshot(null);
                onClose?.();
              }}
              disabled={disabled}
              sx={(theme) => {
                const isDark = theme.palette.mode === "dark";
                return {
                  color: dangerColor,
                  backgroundColor: isDark ? "rgba(229,90,90,.14)" : "#ffebee",
                  width: isPhone ? 26 : isTablet ? 30 : undefined,
                  height: isPhone ? 26 : isTablet ? 30 : undefined,
                  p: isCompact ? 0.25 : undefined,
                  "& svg": { fontSize: isPhone ? 15 : isTablet ? 17 : undefined },
                  "&:hover": { backgroundColor: isDark ? "rgba(229,90,90,.24)" : "#ffcdd2" }
                };
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box>
              <Typography
                sx={{
                  fontWeight: 950,
                  color: textColor,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.8rem" : "1.15rem",
                  lineHeight: 1.1
                }}
              >
                طلب سداد
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: "#6f8a81",
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.82rem",
                  lineHeight: 1.1,
                  display: isPhone ? "none" : "block"
                }}
              >
                عرض آخر طلب وآخر فاتورة + إنشاء طلب سداد جديد
              </Typography>
            </Box>
          </Stack>

          <Chip
            icon={<PaymentsIcon />}
            label={paymentKind === "fees" ? "سداد رسوم" : "سداد قسط شهري"}
            sx={{
              fontWeight: 950,
              color: "#fff",
              backgroundColor: paymentKind === "fees" ? warningColor : "#2e7d32",
              px: isPhone ? 0.4 : isTablet ? 0.6 : 1,
              height: isPhone ? 22 : isTablet ? 25 : undefined,
              "& .MuiChip-label": {
                px: isPhone ? 0.5 : isTablet ? 0.65 : undefined,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
              },
              "& .MuiChip-icon": {
                fontSize: isPhone ? 13 : isTablet ? 15 : undefined
              }
            }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: isPhone ? 0.28 : isTablet ? 0.5 : 2,
          backgroundColor: whiteColor,
          overflowY: "auto",
          flex: 1,
          minHeight: 0,

          "& .MuiInputLabel-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          },
          "& .MuiInputBase-input, & .MuiSelect-select": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            py: isPhone ? 0.5 : isTablet ? 0.65 : undefined
          },
          "& .MuiOutlinedInput-root": {
            minHeight: isPhone ? 31 : isTablet ? 35 : undefined,
            borderRadius: isCompact ? 1.25 : undefined
          },
          "& .MuiFormHelperText-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            mt: isCompact ? 0.12 : undefined,
            lineHeight: 1.15
          },
          "& .MuiChip-root": {
            height: isPhone ? 20 : isTablet ? 23 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }
        }}
      >
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 7 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, fontWeight: 950 }}>
              جاري تجهيز بيانات السداد...
            </Typography>
          </Stack>
        ) : !context ? (
          <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 900 }}>
            لا توجد بيانات جاهزة لطلب السداد.
          </Alert>
        ) : (
          <Stack spacing={isPhone ? 0.42 : isTablet ? 0.62 : 1.6}>
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.38 : isTablet ? 0.58 : 1.5,
                borderRadius: isCompact ? 1.45 : 3,
                border: isDarkGrid ? `1px solid #67C99D` : "1px solid #d7eee4",
                backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
              }}
            >
              <Grid container spacing={isPhone ? 0.32 : isTablet ? 0.5 : 1.2}>
                <Grid item xs={6} sm={6} md={3}>
                  <DetailBox
                    label="اسم الطالب"
                    value={context.studentName || selectedStudent?.studentName}
                  />
                </Grid>
                <Grid item xs={6} sm={6} md={2}>
                  <DetailBox
                    label="رقم الهوية"
                    value={context.nationalId || selectedStudent?.nationalId}
                    color={dangerColor}
                  />
                </Grid>
                <Grid item xs={6} sm={6} md={2}>
                  <DetailBox
                    label="رقم الجوال"
                    value={context.tel || selectedStudent?.studentTel || selectedStudent?.tel}
                  />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <DetailBox label="الدبلوم / الدورة" value={context.diplomName} />
                </Grid>
                <Grid item xs={6} sm={6} md={2}>
                  <DetailBox label="الفرع" value={context.branchName} />
                </Grid>
              </Grid>
            </Paper>

            <Grid
              container
              spacing={isTablet ? 0.55 : 1.5}
              sx={{ display: isPhone ? "none" : "flex" }}
            >
              <Grid item xs={6} sm={6} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: isTablet ? 0.5 : 1.4,
                    borderRadius: isTablet ? 1.4 : 3,
                    border: isDarkGrid ? `1px solid #67C99D` : "1px solid #d7eee4",
                    backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
                  }}
                >
                  <SectionTitle>آخر طلب سداد</SectionTitle>
                  <Box sx={uiLayout.withUiSx({ height: 170 }, uiLayout.tableContainerSx)}>
                    <DataGrid
                      rows={rowsWithIds(lastOrders)}
                      columns={compactOrderColumns.map(fitCompactColumn)}
                      disableRowSelectionOnClick
                      hideFooter
                      rowHeight={isTablet ? 34 : 42}
                      columnHeaderHeight={isTablet ? 32 : 38}
                      localeText={{ noRowsLabel: "لا توجد طلبات سداد سابقة" }}
                      sx={uiLayout.withUiSx(gridStyle, uiLayout.dataGridSx)}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={6} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: isTablet ? 0.5 : 1.4,
                    borderRadius: isTablet ? 1.4 : 3,
                    border: isDarkGrid ? `1px solid #67C99D` : "1px solid #d7eee4",
                    backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
                  }}
                >
                  <SectionTitle>آخر فاتورة سداد</SectionTitle>
                  <Box sx={uiLayout.withUiSx({ height: 170 }, uiLayout.tableContainerSx)}>
                    <DataGrid
                      rows={rowsWithIds(lastBills)}
                      columns={compactBillColumns.map(fitCompactColumn)}
                      disableRowSelectionOnClick
                      hideFooter
                      rowHeight={isTablet ? 34 : 42}
                      columnHeaderHeight={isTablet ? 32 : 38}
                      localeText={{ noRowsLabel: "لا توجد فواتير سداد سابقة" }}
                      sx={uiLayout.withUiSx(gridStyle, uiLayout.dataGridSx)}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.38 : isTablet ? 0.58 : 1.5,
                borderRadius: isCompact ? 1.45 : 3,
                border: isDarkGrid ? `1px solid #67C99D` : "1px solid #d7eee4",
                backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
              }}
            >
              <Grid container spacing={isPhone ? 0.32 : isTablet ? 0.5 : 1.2}>
                <Grid item xs={12} md={6}>
                  <ActionChoiceButton
                    active={paymentKind === "diplom"}
                    icon={<PaymentsIcon />}
                    title="سداد قسط شهري"
                    subtitle={context.payDocName || "سداد من بيانات الدبلوم"}
                    color="#2e7d32"
                    onClick={() => handleChangeKind("diplom")}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ActionChoiceButton
                    active={paymentKind === "fees"}
                    icon={<ReceiptLongIcon />}
                    title="سداد رسوم"
                    subtitle={context.payFeesDocName || "سداد من استمارة الرسوم"}
                    color={warningColor}
                    onClick={() => handleChangeKind("fees")}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: isCompact ? 0.45 : 1.5 }} />

              <Grid container spacing={isPhone ? 0.32 : isTablet ? 0.5 : 1.2}>
                <Grid item xs={4} sm={4} md={4}>
                  <ActionChoiceButton
                    active={paymentMethod === "cash"}
                    icon={<PaymentsIcon />}
                    title="نقدي"
                    subtitle="تحميل صندوق مكتب المستخدم والمرجع CASH"
                    color="#2e7d32"
                    onClick={() => handleChangeMethod("cash")}
                  />
                </Grid>
                <Grid item xs={4} sm={4} md={4}>
                  <ActionChoiceButton
                    active={paymentMethod === "network"}
                    icon={<PointOfSaleIcon />}
                    title="شبكة"
                    subtitle="تحميل بنك الشبكة الافتراضي"
                    color="#1565c0"
                    onClick={() => handleChangeMethod("network")}
                  />
                </Grid>
                <Grid item xs={4} sm={4} md={4}>
                  <ActionChoiceButton
                    active={paymentMethod === "bank"}
                    icon={<AccountBalanceIcon />}
                    title="حوالة / بنك"
                    subtitle="اختيار بنك + مرجع + مستند دفع"
                    color="#6a1b9a"
                    onClick={() => handleChangeMethod("bank")}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.38 : isTablet ? 0.58 : 1.5,
                borderRadius: isCompact ? 1.45 : 3,
                border: isDarkGrid ? `1px solid #67C99D` : "1px solid #d7eee4",
                backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
              }}
            >
              <SectionTitle color={primaryDark}>بيانات التنفيذ</SectionTitle>

              <Grid container spacing={1.2}>
                <Grid item xs={12} sm={6} md={4}>
                  {paymentMethod === "bank" ? (
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      select
                      fullWidth
                      size="small"
                      label="الخزينة / البنك"
                      value={cashBoxGuid}
                      onChange={(e) => handleSelectBank(e.target.value)}
                      disabled={disabled || cashBoxLoading}
                      helperText={
                        cashBoxGuid
                          ? `تم اختيار: ${cashBoxName || ""}`
                          : ""
                      }
                      inputProps={{ style: { textAlign: "start", fontWeight: 900 } }}
                    >
                      {bankOptions.map((bank) => {
                        const guid = bank.cashBoxGuid || bank.CashBoxGuid || "";
                        const name = bank.cashBoxName || bank.CashBoxName || "";
                        return (
                          <MenuItem key={guid} value={guid} sx={{ direction: "rtl", fontWeight: 900 }}>
                            {name}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  ) : (
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      label={paymentMethod === "cash" ? "الخزينة" : "بنك الشبكة"}
                      value={cashBoxDisplayName}
                      disabled
                      helperText={
                        cashBoxGuid && costCenterGuid
                          ? `تم تحميل بيانات الحساب ومركز التكلفة داخلياً${cashBoxName ? "" : " - الاسم الافتراضي ظاهر مؤقتاً"}`
                          : "سيتم تحميل الاسم تلقائياً"
                      }
                      inputProps={{ style: { textAlign: "start", fontWeight: 900 } }}
                    />
                  )}
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    label="رقم المرجع"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    disabled={disabled || paymentMethod === "cash"}
                    inputProps={{ style: { textAlign: "left", fontWeight: 900 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField sx={uiLayout.formFieldSx}
                    fullWidth
                    size="small"
                    type="date"
                    label="تاريخ الحوالة / السداد"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    disabled={disabled}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ style: { textAlign: "left", direction: "ltr", fontWeight: 900 , unicodeBidi: "isolate" } , dir: "ltr" }}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    label="ملاحظات"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={disabled}
                    inputProps={{ style: { textAlign: "start", fontWeight: 900 } }}
                  />
                </Grid>

                <Grid item xs={6} sm={6} md={4}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    disabled={disabled || paymentMethod !== "bank"}
                    startIcon={<AttachFileIcon />}
                    sx={uiLayout.withUiSx({
                      height: isPhone ? 31 : isTablet ? 35 : 40,
                      borderRadius: isCompact ? 1.25 : 2,
                      fontWeight: 950,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      direction: "rtl",
                      borderColor: "#d7eee4",
                      color: paymentMethod === "bank" ? "#6a1b9a" : "#888"
                    }, uiLayout.buttonSx)}
                  >
                    {attachmentName || "مستند الدفع"}
                    <input
                      hidden
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.bmp,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setAttachmentFile(file);
                        setAttachmentName(file?.name || "");
                      }}
                    />
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.38 : isTablet ? 0.58 : 1.5,
                borderRadius: isCompact ? 1.45 : 3,
                border: isDarkGrid ? `1px solid #67C99D` : "1px solid #d7eee4",
                backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={isCompact ? 0.3 : 1.2}
                sx={{ mb: isCompact ? 0.35 : 1.2, minWidth: 0 }}
              >
                <SectionTitle color={primaryDark}>بنود طلب السداد</SectionTitle>

                <Stack
                  direction="row"
                  spacing={isCompact ? 0.22 : 1}
                  justifyContent="flex-start"
                  flexWrap="nowrap"
                  useFlexGap
                  sx={{ minWidth: 0 }}
                >
                  {paymentKind === "fees" && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ReceiptLongIcon />}
                      onClick={loadFeeCatalog}
                      disabled={disabled || feeCatalogLoading}
                      sx={uiLayout.withUiSx({
                        borderRadius: isCompact ? 1.2 : 2,
                        fontWeight: 950,
                        minWidth: isPhone ? 52 : isTablet ? 62 : undefined,
                        px: isPhone ? 0.45 : isTablet ? 0.65 : undefined,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                        backgroundColor: warningColor,
                        direction: "rtl",
                        "&:hover": { backgroundColor: "#b45309" }
                      }, uiLayout.buttonSx)}
                    >
                      إضافة رسوم
                    </Button>
                  )}
                  {!isPhone && (
                    <Chip
                      label={`الإجمالي: ${money(totals.total)}`}
                      sx={(theme) => ({
                        ...chipStyle(theme),
                        fontSize: isTablet ? "0.75rem" : undefined,
                        height: isTablet ? 22 : undefined
                      })}
                    />
                  )}
                  {!isPhone && (
                    <Chip
                      label={`الضريبة: ${money(totals.tax)}`}
                      sx={(theme) => ({
                        ...chipStyle(theme),
                        fontSize: isTablet ? "0.75rem" : undefined,
                        height: isTablet ? 22 : undefined
                      })}
                    />
                  )}
                  <Chip
                    label={`الصافي: ${money(totals.subTotal)}`}
                    sx={(theme) => ({
                      ...chipStyle(theme),
                      backgroundColor: theme.palette.mode === "dark" ? "rgba(229,90,90,.14)" : "#ffebee",
                      color: dangerColor,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      height: isPhone ? 20 : isTablet ? 22 : undefined
                    })}
                  />
                </Stack>
              </Stack>

              <Box sx={uiLayout.withUiSx({ height: isPhone ? 205 : isTablet ? 235 : 230, minWidth: 0 }, uiLayout.tableContainerSx)}>
                <DataGrid
                  rows={items}
                  columns={compactItemColumns.map(fitCompactColumn)}
                  loading={itemsLoading}
                  disableRowSelectionOnClick
                  hideFooter
                  rowHeight={isPhone ? 32 : isTablet ? 36 : 42}
                  columnHeaderHeight={isPhone ? 30 : isTablet ? 34 : 38}
                  disableColumnMenu={isCompact}
                  disableColumnFilter={isCompact}
                  processRowUpdate={handleItemRowUpdate}
                  onProcessRowUpdateError={(error) =>
                    showError(error?.message || "حدث خطأ أثناء تعديل بند السداد")
                  }
                  localeText={{
                    noRowsLabel:
                      paymentKind === "fees"
                        ? "لا توجد بنود رسوم في الاستمارة، اضغط إضافة رسوم مثل الديسكتوب"
                        : "لا توجد بنود سداد"
                  }}
                  sx={uiLayout.withUiSx(gridStyle, uiLayout.dataGridSx)}
                />
              </Box>
            </Paper>
          </Stack>
        )}
      </DialogContent>

            <Dialog
              open={feeCatalogOpen}
              onClose={() => setFeeCatalogOpen(false)}
              fullWidth
              maxWidth="md"
              fullScreen={isPhone}
              sx={uiLayout.withUiSx({
                "& .MuiDialog-container": {
                  pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
                  px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
                  pb: isPhone ? 0 : isTablet ? 0.5 : 1.5
                }
              }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
              PaperProps={{
                sx: {
                  width: isPhone ? "100vw" : isTablet ? "92vw" : undefined,
                  height: isPhone ? "calc(100dvh - 58px)" : isTablet ? "72dvh" : undefined,
                  maxHeight: isPhone ? "calc(100dvh - 58px)" : isTablet ? "72dvh" : undefined,
                  m: 0,
                  borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
                  direction: "rtl",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column"
                }
              }}
            >
              <DialogTitle
                sx={{
                  fontWeight: 950,
                  color: textColor,
                  py: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
                  px: isPhone ? 0.65 : isTablet ? 0.9 : 2,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  flexShrink: 0
                }}
              >
                قائمة الرسوم الأخرى
              </DialogTitle>
              <DialogContent
                dividers
                sx={{
                  backgroundColor: "#fffaf3",
                  p: isPhone ? 0.3 : isTablet ? 0.5 : 2,
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden"
                }}
              >
                <Box sx={uiLayout.withUiSx({ height: "100%", minHeight: 0 }, uiLayout.tableContainerSx)}>
                  <DataGrid
                    rows={feeCatalog.map((row, index) => ({ ...row, id: row.id || index + 1 }))}
                    columns={
                      isPhone
                        ? [
                            {
                              field: "name",
                              headerName: "البيان",
                              flex: 1,
                              minWidth: 0,
                              align: "center",
                              headerAlign: "center",
                              renderCell: (p) => (
                                <Tooltip title={safeText(p.row?.name)} arrow>
                                  <Typography
                                    sx={{
                                      width: "100%",
                                      fontWeight: 900,
                                      fontSize: "0.75rem",
                                      textAlign: "center",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      direction: "rtl"
                                    }}
                                  >
                                    {safeText(p.row?.name)}
                                  </Typography>
                                </Tooltip>
                              )
                            },
                            {
                              field: "subTotal",
                              headerName: "القيمة",
                              width: 58,
                              minWidth: 58,
                              maxWidth: 58,
                              align: "center",
                              headerAlign: "center",
                              renderCell: (p) => infoCell({ value: money(p.row?.subTotal || p.row?.cost) })
                            },
                            {
                              field: "action",
                              headerName: "",
                              width: 48,
                              minWidth: 48,
                              maxWidth: 48,
                              sortable: false,
                              filterable: false,
                              disableColumnMenu: true,
                              align: "center",
                              headerAlign: "center",
                              renderCell: (p) => (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleAddFeeItem(p.row)}
                                  sx={uiLayout.withUiSx({
                                    minWidth: 40,
                                    width: 40,
                                    px: 0.25,
                                    py: 0.2,
                                    borderRadius: 1,
                                    fontWeight: 950,
                                    fontSize: "0.75rem",
                                    lineHeight: 1,
                                    backgroundColor: warningColor
                                  }, uiLayout.buttonSx)}
                                >
                                  إضافة
                                </Button>
                              )
                            }
                          ]
                        : isTablet
                          ? [
                              {
                                field: "name",
                                headerName: "البيان",
                                flex: 1,
                                minWidth: 0,
                                align: "center",
                                headerAlign: "center",
                                renderCell: (p) => (
                                  <Tooltip title={safeText(p.row?.name)} arrow>
                                    <Typography
                                      sx={{
                                        width: "100%",
                                        fontWeight: 900,
                                        fontSize: "0.75rem",
                                        textAlign: "center",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        direction: "rtl"
                                      }}
                                    >
                                      {safeText(p.row?.name)}
                                    </Typography>
                                  </Tooltip>
                                )
                              },
                              {
                                field: "cost",
                                headerName: "القيمة",
                                width: 72,
                                minWidth: 72,
                                maxWidth: 72,
                                align: "center",
                                headerAlign: "center",
                                renderCell: (p) => infoCell({ value: money(p.row?.cost) })
                              },
                              {
                                field: "subTotal",
                                headerName: "الصافي",
                                width: 76,
                                minWidth: 76,
                                maxWidth: 76,
                                align: "center",
                                headerAlign: "center",
                                renderCell: (p) => infoCell({ value: money(p.row?.subTotal) })
                              },
                              {
                                field: "action",
                                headerName: "",
                                width: 54,
                                minWidth: 54,
                                maxWidth: 54,
                                sortable: false,
                                filterable: false,
                                disableColumnMenu: true,
                                align: "center",
                                headerAlign: "center",
                                renderCell: (p) => (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleAddFeeItem(p.row)}
                                    sx={uiLayout.withUiSx({
                                      minWidth: 46,
                                      width: 46,
                                      px: 0.3,
                                      py: 0.25,
                                      borderRadius: 1.1,
                                      fontWeight: 950,
                                      fontSize: "0.75rem",
                                      backgroundColor: warningColor
                                    }, uiLayout.buttonSx)}
                                  >
                                    إضافة
                                  </Button>
                                )
                              }
                            ]
                          : [
                      {
                        field: "name",
                        headerName: "البيان",
                        flex: 1.5,
                        minWidth: 220,
                        align: "center",
                        headerAlign: "center",
                        renderCell: (p) => infoCell({ value: p.row?.name })
                      },
                      {
                        field: "subTotal",
                        headerName: "الصافي",
                        flex: 0.45,
                        minWidth: 110,
                        align: "center",
                        headerAlign: "center",
                        renderCell: (p) => infoCell({ value: money(p.row?.subTotal || p.row?.cost) })
                      },
                      {
                        field: "action",
                        headerName: "اختيار",
                        flex: 0.35,
                        minWidth: 100,
                        align: "center",
                        headerAlign: "center",
                        sortable: false,
                        renderCell: (p) => (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddFeeItem(p.row)}
                            sx={uiLayout.withUiSx({ borderRadius: 2, fontWeight: 950, backgroundColor: warningColor }, uiLayout.buttonSx)}
                          >
                            إضافة
                          </Button>
                        )
                      }
                    ]
                    }
                    loading={feeCatalogLoading}
                    disableRowSelectionOnClick
                    hideFooter
                    rowHeight={isPhone ? 32 : isTablet ? 36 : 42}
                    columnHeaderHeight={isPhone ? 30 : isTablet ? 34 : 40}
                    disableColumnMenu={isCompact}
                    disableColumnFilter={isCompact}
                    localeText={{ noRowsLabel: "لا توجد رسوم في قائمة السعر" }}
                    sx={uiLayout.withUiSx(gridStyle, uiLayout.dataGridSx)}
                  />
                </Box>
              </DialogContent>
              <DialogActions sx={uiLayout.withUiSx({ p: isPhone ? 0.3 : isTablet ? 0.45 : 1, flexShrink: 0 }, uiLayout.dialogActionsSx)}>
                <Button
                  onClick={() => setFeeCatalogOpen(false)}
                  sx={uiLayout.withUiSx({
                    fontWeight: 950,
                    color: dangerColor,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  }, uiLayout.buttonSx)}
                >
                  إغلاق
                </Button>
              </DialogActions>
            </Dialog>

      <DialogActions
        sx={uiLayout.withUiSx({
          px: isPhone ? 0.35 : isTablet ? 0.55 : 2,
          py: isPhone ? 0.28 : isTablet ? 0.42 : 1.4,
          gap: isCompact ? 0.35 : 1,
          flexShrink: 0,
          borderTop: `1px solid ${primaryLight}`,
          backgroundColor: whiteColor,
          justifyContent: "space-between"
        }, uiLayout.dialogActionsSx)}
      >
        <Button
          onClick={() => {
            setKeepDialogOpenAfterSave(false);
            setSavedPrintResult(null);
            setPrintSnapshot(null);
            onClose?.();
          }}
          disabled={disabled}
          startIcon={<CloseIcon />}
          sx={uiLayout.withUiSx({
            fontWeight: 950,
            color: dangerColor,
            direction: "rtl",
            minHeight: isPhone ? 29 : isTablet ? 33 : undefined,
            px: isPhone ? 0.8 : isTablet ? 1.1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          خروج
        </Button>

        <Stack sx={uiLayout.actionBarSx} direction="row" spacing={isCompact ? 0.3 : 1} alignItems="center">
          {savedPrintResult && (
            <Button
              variant="outlined"
              disabled={disabled}
              startIcon={
                isCompact ? (
                  <PictureAsPdfIcon />
                ) : (
                  <PrintIcon />
                )
              }
              onClick={() => openPrintPreview(savedPrintResult)}
              sx={uiLayout.withUiSx((theme) => {
                const isDark = theme.palette.mode === "dark";
                return {
                  minWidth: isPhone ? 90 : isTablet ? 110 : 150,
                  minHeight: isPhone ? 29 : isTablet ? 33 : undefined,
                  px: isPhone ? 0.65 : isTablet ? 0.9 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  borderRadius: isCompact ? 1.2 : 2,
                  fontWeight: 950,
                  direction: "rtl",
                  borderColor: isDark ? pinColor("#1565c0") : "#1565c0",
                  color: "#1565c0",
                  backgroundColor: isDark ? "rgba(90,160,229,.12)" : "#eef6ff",
                  "&:hover": {
                    borderColor: isDark ? pinColor("#0d47a1") : "#0d47a1",
                    backgroundColor: isDark ? "rgba(90,160,229,.2)" : "#e3f2fd"
                  }
                };
              }, uiLayout.buttonSx)}
            >
              {isCompact ? "تصدير PDF" : "طباعة الطلب"}
            </Button>
          )}

          <Button
            variant="contained"
            disabled={disabled || !context}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={savePaymentOrder}
            sx={uiLayout.withUiSx({
              minWidth: isPhone ? 105 : isTablet ? 130 : 170,
              minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
              px: isPhone ? 0.75 : isTablet ? 1 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              borderRadius: isCompact ? 1.2 : 2,
              fontWeight: 950,
              direction: "rtl",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              boxShadow: "none",
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark}, #034d31)`,
                boxShadow: "none"
              }
            }, uiLayout.buttonSx)}
          >
            حفظ طلب السداد
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
    </>
  );
};

const gridStyle = (theme) => {
  const isDark = theme.palette.mode === "dark";
  return {
    border: isDark ? "1px solid #67C99D" : "none",
    direction: "rtl",
    "& .MuiDataGrid-columnHeaders": {
      background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
      color: whiteColor,
      fontWeight: 950,
      borderBottom: isDark ? "1px solid #67C99D" : `1px solid ${primaryDark}`
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 950,
      fontSize: "0.78rem",
      textAlign: "center",
      color: whiteColor,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.5rem", lineHeight: 1.05 },
      "@media (max-width:599px)": { fontSize: "0.42rem" }
    },
    "& .MuiDataGrid-cell": {
      borderBottom: isDark ? `1px solid #67C99D` : "1px solid #edf4f1",
      fontWeight: 900,
      outline: "none !important",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.5rem", px: 0.28 },
      "@media (max-width:599px)": { fontSize: "0.42rem", px: 0.1 }
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: isDark ? theme.palette.surfaces.hover : "#f0faf5"
    },
    "& .MuiDataGrid-footerContainer": {
      direction: "rtl",
      borderTop: isDark ? "1px solid #67C99D" : undefined
    }
  };
};

const chipStyle = (theme) => {
  const isDark = theme.palette.mode === "dark";
  return {
    fontWeight: 950,
    borderRadius: 2,
    backgroundColor: isDark ? "rgba(103,201,157,.14)" : primaryLight,
    color: isDark ? theme.palette.primary.main : primaryColor,
    border: isDark ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
      height: 22,
      fontSize: "0.48rem"
    },
    "@media (max-width:599px)": {
      height: 20,
      fontSize: "0.42rem"
    }
  };
};

export default StudentPaymentOrderDialog;
