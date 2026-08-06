import React, { useEffect, useMemo, useState } from "react";
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
  Typography
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
import logoImage from "../images/logo.jpg";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
const whiteColor = "#fefefe";
const softBg = "#fefefe";
const textColor = "#1f2d3d";
const dangerColor = accentColor;
const warningColor = accentColor;

const noGuid = "00000000-0000-0000-0000-000000000000";

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

const showWarning = (message) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: warningColor
  });

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#ae1e21"
  });

const showSuccess = (message) =>
  Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });


const askPrintAfterSave = () =>
  Swal.fire({
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
</head>
<body>
  <button class="no-print" onclick="window.print()">طباعة</button>

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
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        direction: "ltr"
      }}
    >
      {safeText(value)}
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
      textAlign: "left"
    }}
  >
    {children}
  </Typography>
);

const DetailBox = ({ label, value, color = textColor }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 2,
      border: "1px solid #e6f3ee",
      backgroundColor: whiteColor,
      height: "100%"
    }}
  >
    <Typography
      sx={{
        color: "#6f8a81",
        fontWeight: 900,
        fontSize: "0.76rem",
        mb: 0.4,
        textAlign: "left"
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
        textAlign: "left"
      }}
    >
      {safeText(value)}
    </Typography>
  </Paper>
);

const ActionChoiceButton = ({ active, icon, title, subtitle, onClick, color }) => (
  <Button
    fullWidth
    variant={active ? "contained" : "outlined"}
    onClick={onClick}
    startIcon={icon}
    sx={{
      minHeight: 62,
      borderRadius: 3,
      justifyContent: "flex-start",
      textAlign: "left",
      direction: "ltr",
      fontWeight: 950,
      borderColor: active ? color : "#d7eee4",
      backgroundColor: active ? color : "#fff",
      color: active ? "#fff" : color,
      "& .MuiButton-startIcon": {
        ml: 1,
        mr: 0
      },
      "&:hover": {
        borderColor: color,
        backgroundColor: active ? color : "#f8fbfa"
      }
    }}
  >
    <Box sx={{ width: "100%", direction: "ltr" }}>
      <Typography sx={{ fontWeight: 950, lineHeight: 1.2 }}>{title}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", opacity: 0.85 }}>
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
              sx={{
                fontWeight: 950,
                borderRadius: 2,
                color: String(value).includes("مؤكد") ? "#2e7d32" : warningColor,
                backgroundColor: String(value).includes("مؤكد") ? "#e8f5e9" : "#fff3e0"
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

    const printWindow = window.open("", "_blank", "width=1100,height=850");

    if (!printWindow) {
      showWarning("المتصفح منع فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى.");
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
      PaperProps={{
        sx: {
          borderRadius: 4,
          direction: "ltr",
          textAlign: "left",
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          background: `linear-gradient(135deg, ${whiteColor} 0%, #f1faf6 55%, ${primaryLight} 100%)`,
          borderBottom: `1px solid ${primaryLight}`
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 1.5 }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <IconButton
              onClick={() => {
                setKeepDialogOpenAfterSave(false);
                setSavedPrintResult(null);
                setPrintSnapshot(null);
                onClose?.();
              }}
              disabled={disabled}
              sx={{
                color: dangerColor,
                backgroundColor: "#ffebee",
                "&:hover": { backgroundColor: "#ffcdd2" }
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box>
              <Typography sx={{ fontWeight: 950, color: textColor, fontSize: "1.15rem" }}>
                طلب سداد
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#6f8a81", fontSize: "0.82rem" }}>
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
              px: 1
            }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: { xs: 1.2, md: 2 },
          backgroundColor: whiteColor
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
          <Stack spacing={1.6}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #d7eee4",
                backgroundColor: whiteColor
              }}
            >
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={3}>
                  <DetailBox
                    label="اسم الطالب"
                    value={context.studentName || selectedStudent?.studentName}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DetailBox
                    label="رقم الهوية"
                    value={context.nationalId || selectedStudent?.nationalId}
                    color={dangerColor}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DetailBox
                    label="رقم الجوال"
                    value={context.tel || selectedStudent?.studentTel || selectedStudent?.tel}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DetailBox label="الدبلوم / الدورة" value={context.diplomName} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DetailBox label="الفرع" value={context.branchName} />
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.4,
                    borderRadius: 3,
                    border: "1px solid #d7eee4",
                    backgroundColor: whiteColor
                  }}
                >
                  <SectionTitle>آخر طلب سداد</SectionTitle>
                  <Box sx={{ height: 170 }}>
                    <DataGrid
                      rows={rowsWithIds(lastOrders)}
                      columns={orderColumns}
                      disableRowSelectionOnClick
                      hideFooter
                      rowHeight={42}
                      columnHeaderHeight={38}
                      localeText={{ noRowsLabel: "لا توجد طلبات سداد سابقة" }}
                      sx={gridStyle}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.4,
                    borderRadius: 3,
                    border: "1px solid #d7eee4",
                    backgroundColor: whiteColor
                  }}
                >
                  <SectionTitle>آخر فاتورة سداد</SectionTitle>
                  <Box sx={{ height: 170 }}>
                    <DataGrid
                      rows={rowsWithIds(lastBills)}
                      columns={billColumns}
                      disableRowSelectionOnClick
                      hideFooter
                      rowHeight={42}
                      columnHeaderHeight={38}
                      localeText={{ noRowsLabel: "لا توجد فواتير سداد سابقة" }}
                      sx={gridStyle}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #d7eee4",
                backgroundColor: whiteColor
              }}
            >
              <Grid container spacing={1.2}>
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

              <Divider sx={{ my: 1.5 }} />

              <Grid container spacing={1.2}>
                <Grid item xs={12} md={4}>
                  <ActionChoiceButton
                    active={paymentMethod === "cash"}
                    icon={<PaymentsIcon />}
                    title="نقدي"
                    subtitle="تحميل صندوق مكتب المستخدم والمرجع CASH"
                    color="#2e7d32"
                    onClick={() => handleChangeMethod("cash")}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ActionChoiceButton
                    active={paymentMethod === "network"}
                    icon={<PointOfSaleIcon />}
                    title="شبكة"
                    subtitle="تحميل بنك الشبكة الافتراضي"
                    color="#1565c0"
                    onClick={() => handleChangeMethod("network")}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
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
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #d7eee4",
                backgroundColor: whiteColor
              }}
            >
              <SectionTitle color={primaryDark}>بيانات التنفيذ</SectionTitle>

              <Grid container spacing={1.2}>
                <Grid item xs={12} md={4}>
                  {paymentMethod === "bank" ? (
                    <TextField
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
                      inputProps={{ style: { textAlign: "left", fontWeight: 900 } }}
                    >
                      {bankOptions.map((bank) => {
                        const guid = bank.cashBoxGuid || bank.CashBoxGuid || "";
                        const name = bank.cashBoxName || bank.CashBoxName || "";
                        return (
                          <MenuItem key={guid} value={guid} sx={{ direction: "ltr", fontWeight: 900 }}>
                            {name}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  ) : (
                    <TextField
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
                      inputProps={{ style: { textAlign: "left", fontWeight: 900 } }}
                    />
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="رقم المرجع"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    disabled={disabled || paymentMethod === "cash"}
                    inputProps={{ style: { textAlign: "left", fontWeight: 900 } }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="تاريخ الحوالة / السداد"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    disabled={disabled}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ style: { textAlign: "left", direction: "ltr", fontWeight: 900 } }}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ملاحظات"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={disabled}
                    inputProps={{ style: { textAlign: "left", fontWeight: 900 } }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    disabled={disabled || paymentMethod !== "bank"}
                    startIcon={<AttachFileIcon />}
                    sx={{
                      height: 40,
                      borderRadius: 2,
                      fontWeight: 950,
                      direction: "ltr",
                      borderColor: "#d7eee4",
                      color: paymentMethod === "bank" ? "#6a1b9a" : "#888"
                    }}
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
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #d7eee4",
                backgroundColor: whiteColor
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
                spacing={1.2}
                sx={{ mb: 1.2 }}
              >
                <SectionTitle color={primaryDark}>بنود طلب السداد</SectionTitle>

                <Stack direction="row" spacing={1} justifyContent="flex-start" flexWrap="wrap" useFlexGap>
                  {paymentKind === "fees" && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ReceiptLongIcon />}
                      onClick={loadFeeCatalog}
                      disabled={disabled || feeCatalogLoading}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 950,
                        backgroundColor: warningColor,
                        direction: "ltr",
                        "&:hover": { backgroundColor: "#b45309" }
                      }}
                    >
                      إضافة رسوم
                    </Button>
                  )}
                  <Chip label={`الإجمالي: ${money(totals.total)}`} sx={chipStyle} />
                  <Chip label={`الضريبة: ${money(totals.tax)}`} sx={chipStyle} />
                  <Chip
                    label={`الصافي: ${money(totals.subTotal)}`}
                    sx={{
                      ...chipStyle,
                      backgroundColor: "#ffebee",
                      color: dangerColor
                    }}
                  />
                </Stack>
              </Stack>

              <Box sx={{ height: 230 }}>
                <DataGrid
                  rows={items}
                  columns={itemColumns}
                  loading={itemsLoading}
                  disableRowSelectionOnClick
                  hideFooter
                  rowHeight={42}
                  columnHeaderHeight={38}
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
                  sx={gridStyle}
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
              PaperProps={{ sx: { borderRadius: 3, direction: "ltr" } }}
            >
              <DialogTitle sx={{ fontWeight: 950, color: textColor }}>
                قائمة الرسوم الأخرى
              </DialogTitle>
              <DialogContent dividers sx={{ backgroundColor: "#fffaf3" }}>
                <Box sx={{ height: 360 }}>
                  <DataGrid
                    rows={feeCatalog.map((row, index) => ({ ...row, id: row.id || index + 1 }))}
                    columns={[
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
                            sx={{ borderRadius: 2, fontWeight: 950, backgroundColor: warningColor }}
                          >
                            إضافة
                          </Button>
                        )
                      }
                    ]}
                    loading={feeCatalogLoading}
                    disableRowSelectionOnClick
                    hideFooter
                    rowHeight={42}
                    columnHeaderHeight={40}
                    localeText={{ noRowsLabel: "لا توجد رسوم في قائمة السعر" }}
                    sx={gridStyle}
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setFeeCatalogOpen(false)} sx={{ fontWeight: 950, color: dangerColor }}>
                  إغلاق
                </Button>
              </DialogActions>
            </Dialog>

      <DialogActions
        sx={{
          px: 2,
          py: 1.4,
          borderTop: `1px solid ${primaryLight}`,
          backgroundColor: whiteColor,
          justifyContent: "space-between"
        }}
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
          sx={{
            fontWeight: 950,
            color: dangerColor,
            direction: "ltr"
          }}
        >
          خروج
        </Button>

        <Stack direction="row" spacing={1} alignItems="center">
          {savedPrintResult && (
            <Button
              variant="outlined"
              disabled={disabled}
              startIcon={<PrintIcon />}
              onClick={() => openPrintPreview(savedPrintResult)}
              sx={{
                minWidth: 150,
                borderRadius: 2,
                fontWeight: 950,
                direction: "ltr",
                borderColor: "#1565c0",
                color: "#1565c0",
                backgroundColor: "#eef6ff",
                "&:hover": {
                  borderColor: "#0d47a1",
                  backgroundColor: "#e3f2fd"
                }
              }}
            >
              طباعة الطلب
            </Button>
          )}

          <Button
            variant="contained"
            disabled={disabled || !context}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={savePaymentOrder}
            sx={{
              minWidth: 170,
              borderRadius: 2,
              fontWeight: 950,
              direction: "ltr",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              boxShadow: "none",
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark}, #034d31)`,
                boxShadow: "none"
              }
            }}
          >
            حفظ طلب السداد
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

const gridStyle = {
  border: "none",
  direction: "ltr",
  "& .MuiDataGrid-columnHeaders": {
    background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
    color: whiteColor,
    fontWeight: 950,
    borderBottom: `1px solid ${primaryDark}`
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 950,
    fontSize: "0.78rem",
    textAlign: "center",
    color: whiteColor
  },
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid #edf4f1",
    fontWeight: 900,
    outline: "none !important"
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#f0faf5"
  },
  "& .MuiDataGrid-footerContainer": {
    direction: "ltr"
  }
};

const chipStyle = {
  fontWeight: 950,
  borderRadius: 2,
  backgroundColor: primaryLight,
  color: primaryColor,
  border: `1px solid ${primaryLight}`
};

export default StudentPaymentOrderDialog;
