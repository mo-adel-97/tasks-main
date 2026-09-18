import { PRINT_READY_SCRIPT } from '../utils/printReady';
import { pinColor } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
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
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";
import SalesInvoiceDialog from "./SalesInvoiceDialog";
import RegisterDocumentDialog from "./RegisterDocumentDialog";
import ArchiveIcon from "@mui/icons-material/Archive";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";

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
const textColor = "#1f2d3d";
const softBg = "#fefefe";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) =>
  user?.userGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  user?.USER_GUID____ ||
  "";

const toNumber = (value) => {
  if (value && typeof value === "object") {
    if ("value" in value) value = value.value;
    else if ("row" in value && "field" in value) value = value.row?.[value.field];
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const money = (value) => {
  return toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeDateDigits = (value) =>
  String(value || "")
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    )
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    );

const formatGregorianDate = (value) => {
  if (!value) return "";

  const normalized = normalizeDateDigits(value).trim();
  const match = normalized.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);

  if (!match) return normalized;

  let first = Number(match[1]);
  let second = Number(match[2]);
  let third = Number(match[3]);

  let year;
  let month;
  let day;

  if (first > 999) {
    year = first;
    month = second;
    day = third;
  } else {
    day = first;
    month = second;
    year = third;
  }

  // الباك إند بعد التعديل يرجع dd/MM/yyyy.
  // هذه الحماية تمنع المتصفح من قلب ترتيب التاريخ.
  if (year >= 1700) {
    return `${String(day).padStart(2, "0")}/${String(month).padStart(
      2,
      "0"
    )}/${String(year).padStart(4, "0")}`;
  }

  return normalized;
};

const normalizeRowId = (row, index) => {
  return (
    row?.id ||
    row?.actionGuid ||
    row?.billGuid ||
    `${index + 1}-${row?.documentNo || row?.invoiceNo || row?.returnNo || ""}`
  );
};

const MoneyCell = ({ value, color = textColor }) => (
  <Typography
    sx={{
      width: "100%",
      textAlign: "center",
      fontWeight: 1000,
      color,
      fontSize: "0.85rem",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
      "@media (max-width:599px)": { fontSize: "0.75rem" }
    }}
  >
    {money(value)}
  </Typography>
);

const SummaryCard = ({ label, value, color = textColor }) => (
  <Paper
    elevation={0}
    sx={(theme) => {
      const isDark = theme.palette.mode === "dark";
      return {
        px: 2,
        py: 1.4,
        borderRadius: 3,
        border: isDark ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
        backgroundColor: isDark ? theme.palette.surfaces.card : whiteColor,
        minWidth: 170,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          minWidth: 0,
          px: 0.7,
          py: 0.55,
          borderRadius: 1.5,
          flex: 1
        },
        "@media (max-width:599px)": {
          px: 0.45,
          py: 0.4
        },
        textAlign: "center",
        boxShadow: isDark ? `0 0 0 1px #67C99D` : "0 8px 22px rgba(5,117,70,0.08)"
      };
    }}
  >
    <Typography
      sx={{
        fontSize: "0.78rem",
        color: primaryColor,
        fontWeight: 900,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        fontSize: "1.25rem",
        color,
        fontWeight: 1000,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.82rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {money(value)}
    </Typography>
  </Paper>
);

const EmptyBox = ({ text }) => (
  <Box
    sx={{
      height: 240,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { height: 160, fontSize: "0.75rem" },
      "@media (max-width:599px)": { height: 120, fontSize: "0.75rem" },
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: primaryColor,
      fontWeight: 900
    }}
  >
    {text}
  </Box>
);

const EllipsisText = ({ value, align = "start", direction = "rtl" }) => (
  <Tooltip title={value || ""} arrow>
    <Typography
      sx={{
        width: "100%",
        fontSize: "0.82rem",
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" },
        fontWeight: 800,
        color: textColor,
        whiteSpace: "nowrap",
        overflow: "hidden",
    width: "100%",
    minWidth: 0,
        textOverflow: "ellipsis",
        direction,
        textAlign: align
      }}
    >
      {value || "-"}
    </Typography>
  </Tooltip>
);

const StudentStatementDialog2 = ({
  open,
  onClose,
  student,
  apiBaseUrl = API_BASE_URL,
  onOpenStatementDocument,
  onOpenSalesInvoice,
  onOpenSalesReturn,
  onOpenHistory
}) => {
  const theme = useTheme();
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

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [salesInvoiceOpen, setSalesInvoiceOpen] = useState(false);
  const [selectedSalesInvoice, setSelectedSalesInvoice] = useState(null);

  // معاينة استمارة التسجيل مباشرة من كشف الحساب.
  // لا نعتمد على callback خارجي حتى لا يصبح زر "عرض المستند" بلا نتيجة.
  const [registerDocumentOpen, setRegisterDocumentOpen] = useState(false);
  const [selectedRegisterDocument, setSelectedRegisterDocument] = useState(null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveRows, setArchiveRows] = useState([]);
  const [archiveError, setArchiveError] = useState("");

  const [oldStatementOpen, setOldStatementOpen] = useState(false);
  const [oldStatementLoading, setOldStatementLoading] = useState(false);
  const [oldStatementData, setOldStatementData] = useState(null);
  const [oldStatementError, setOldStatementError] = useState("");
  const [selectedOldArchiveRow, setSelectedOldArchiveRow] = useState(null);

  const accountGuid = student?.accountGuid || student?.AccountGuid || "";

  const studentName = useMemo(() => {
    return student?.studentName || student?.StudentName || "-";
  }, [student]);

  const nationalId = useMemo(() => {
    return student?.nationalId || student?.NationalId || "-";
  }, [student]);

  const loadArchiveStudents = async () => {
    const userGuid = getUserGuid(getCurrentUser());

    if (!userGuid) {
      setArchiveError("تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى");
      setArchiveRows([]);
      return;
    }

    if (!nationalId || nationalId === "-") {
      setArchiveError("رقم هوية الطالب غير موجود");
      setArchiveRows([]);
      return;
    }

    try {
      setArchiveLoading(true);
      setArchiveError("");
      setArchiveRows([]);

      const permissionParams = new URLSearchParams({
        userGuid,
        formName: "studentstatment",
        action: "find"
      });

      const permissionResponse = await fetch(
        `${apiBaseUrl}/api/reception-office/permissions/check?${permissionParams.toString()}`
      );

      const permissionResult =
        await permissionResponse.json().catch(() => null);

      if (!permissionResponse.ok || !permissionResult?.allowed) {
        throw new Error(
          permissionResult?.message ||
          permissionResult?.error ||
          "لا تملك صلاحية استعراض أرشيف المتدرب"
        );
      }

      const params = new URLSearchParams({
        nationalId: String(nationalId).trim()
      });

      const response = await fetch(
        `${apiBaseUrl}/api/reception-office/old-students/search?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تحميل أرشيف المتدرب"
        );
      }

      const rows = Array.isArray(result?.data) ? result.data : [];

      setArchiveRows(
        rows.map((row, index) => ({
          ...row,
          id:
            row?.id ||
            row?.oldCustomerNo ||
            `${row?.nationalId || "old"}-${row?.branchCode || index}`
        }))
      );
    } catch (err) {
      setArchiveError(err?.message || "حدث خطأ أثناء تحميل أرشيف المتدرب");
      setArchiveRows([]);
    } finally {
      setArchiveLoading(false);
    }
  };

  const openArchive = async () => {
    setArchiveOpen(true);
    await loadArchiveStudents();
  };

  const loadOldStatement = async (row) => {
    const userGuid = getUserGuid(getCurrentUser());
    const oldCustomerNo = String(row?.oldCustomerNo || "").trim();
    const branchCode = Number(row?.branchCode || 0);

    if (!userGuid) {
      setOldStatementError("تعذر قراءة بيانات المستخدم");
      return;
    }

    if (!oldCustomerNo || !branchCode) {
      setOldStatementError("تعذر قراءة رقم العميل أو كود الفرع القديم");
      return;
    }

    try {
      setSelectedOldArchiveRow(row);
      setOldStatementOpen(true);
      setOldStatementLoading(true);
      setOldStatementData(null);
      setOldStatementError("");

      const params = new URLSearchParams({
        oldCustomerNo,
        branchCode: String(branchCode),
        studentName: row?.studentName || studentName || "",
        userGuid,
        purpose: "view"
      });

      const response = await fetch(
        `${apiBaseUrl}/api/reception-office/old-students/statement?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تحميل كشف الحساب السابق"
        );
      }

      setOldStatementData(result?.data || null);
    } catch (err) {
      setOldStatementError(
        err?.message || "حدث خطأ أثناء تحميل كشف الحساب السابق"
      );
    } finally {
      setOldStatementLoading(false);
    }
  };

  const oldStatementRows = (rows = []) =>
    rows.map((row, index) => ({
      ...row,
      id: row?.id || `old-row-${index + 1}`
    }));

  const exportOldStatementToPdf = () => {
    if (!oldStatementData) {
      setOldStatementError("لا توجد بيانات في كشف الحساب السابق لتصديرها");
      return;
    }

    const registrations = oldStatementData?.registrations || [];
    const cashMovements = oldStatementData?.cashMovements || [];

    if (registrations.length === 0 && cashMovements.length === 0) {
      setOldStatementError("لا توجد حركات في كشف الحساب السابق لتصديرها");
      return;
    }

    const oldStudentName =
      selectedOldArchiveRow?.studentName ||
      oldStatementData?.studentName ||
      studentName ||
      "-";

    const oldNationalId =
      selectedOldArchiveRow?.nationalId ||
      oldStatementData?.nationalId ||
      nationalId ||
      "-";

    const oldCustomerNo =
      selectedOldArchiveRow?.oldCustomerNo ||
      oldStatementData?.oldCustomerNo ||
      "-";

    const oldBranchCode =
      selectedOldArchiveRow?.branchCode ||
      oldStatementData?.branchCode ||
      "-";

    const registrationRowsHtml = registrations
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatGregorianDate(row.date))}</td>
            <td>${escapeHtml(row.documentType || "")}</td>
            <td>${escapeHtml(row.documentNo || "")}</td>
            <td>${escapeHtml(money(row.debit))}</td>
            <td>${escapeHtml(money(row.credit))}</td>
            <td class="notes">${escapeHtml(row.statement || "")}</td>
            <td>${escapeHtml(row.sellerName || "")}</td>
          </tr>
        `
      )
      .join("");

    const cashRowsHtml = cashMovements
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatGregorianDate(row.date))}</td>
            <td>${escapeHtml(row.documentNo || "")}</td>
            <td>${escapeHtml(money(row.debit))}</td>
            <td>${escapeHtml(money(row.credit))}</td>
            <td class="notes">${escapeHtml(row.statement || "")}</td>
            <td>${escapeHtml(row.reference || "")}</td>
            <td>${escapeHtml(row.bank || "")}</td>
          </tr>
        `
      )
      .join("");

    const documentTitle = `كشف حساب سابق - ${oldStudentName}`;

    const printableHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(documentTitle)}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm 10mm 14mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              margin: 0;
              color: #1f2d3d;
              direction: rtl;
              font-family: Arial, Tahoma, sans-serif;
              background: #fff;
            }

            .page-header {
              border: 2px solid #057546;
              border-radius: 12px;
              padding: 14px 18px;
              margin-bottom: 12px;
              page-break-inside: avoid;
            }

            .title {
              color: #057546;
              text-align: center;
              font-size: 24px;
              font-weight: 900;
              margin-bottom: 12px;
            }

            .student-info {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              font-size: 13px;
              font-weight: 700;
            }

            .student-info div {
              border: 1px solid #dceee6;
              border-radius: 8px;
              padding: 8px 10px;
              text-align: center;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin: 12px 0 0;
              page-break-inside: avoid;
            }

            .summary-card {
              border: 1px solid #cfe6db;
              border-radius: 10px;
              padding: 9px 6px;
              text-align: center;
            }

            .summary-card .label {
              color: #057546;
              font-size: 12px;
              font-weight: 800;
            }

            .summary-card .value {
              margin-top: 4px;
              font-size: 18px;
              font-weight: 900;
            }

            .summary-card.balance .value {
              color: #ae1e21;
            }

            .section-title {
              color: #057546;
              font-size: 17px;
              font-weight: 900;
              margin: 14px 0 7px;
              padding: 6px 10px;
              border-right: 4px solid #057546;
              background: #f4faf7;
              page-break-after: avoid;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 9.5px;
              margin-bottom: 12px;
            }

            thead {
              display: table-header-group;
            }

            tr {
              page-break-inside: avoid;
            }

            th {
              background: #057546;
              color: #fff;
              padding: 7px 4px;
              border: 1px solid #034d31;
              font-weight: 900;
            }

            td {
              border: 1px solid #d9e6e0;
              padding: 6px 4px;
              text-align: center;
              vertical-align: middle;
              overflow-wrap: anywhere;
            }

            tbody tr:nth-child(even) {
              background: #f4faf7;
            }

            .notes {
              text-align: right;
              line-height: 1.5;
            }

            .empty-row {
              padding: 18px;
              color: #777;
              font-weight: 800;
            }

            .footer-note {
              margin-top: 10px;
              padding-top: 7px;
              border-top: 1px solid #057546;
              font-size: 10px;
              color: #555;
              text-align: center;
            }

            .col-index { width: 4%; }
            .col-date { width: 10%; }
            .col-type { width: 12%; }
            .col-no { width: 10%; }
            .col-money { width: 9%; }
            .col-notes { width: 30%; }
            .col-name { width: 17%; }
            .col-ref { width: 12%; }
            .col-bank { width: 17%; }

            @media print {
              body {
                width: 100%;
              }

              .no-print {
                display: none !important;
              }
            }
          </style>
        ${PRINT_READY_SCRIPT}</head>
        <body>
          <section class="page-header">
            <div class="title">كشف حساب سابق</div>

            <div class="student-info">
              <div><strong>اسم الطالب:</strong> ${escapeHtml(oldStudentName)}</div>
              <div><strong>رقم الهوية:</strong> ${escapeHtml(oldNationalId)}</div>
              <div><strong>رقم العميل القديم:</strong> ${escapeHtml(oldCustomerNo)}</div>
              <div><strong>كود الفرع:</strong> ${escapeHtml(oldBranchCode)}</div>
            </div>

            <div class="summary">
              <div class="summary-card">
                <div class="label">مدين</div>
                <div class="value">${escapeHtml(money(oldStatementData?.summary?.debit || 0))}</div>
              </div>

              <div class="summary-card">
                <div class="label">دائن</div>
                <div class="value">${escapeHtml(money(oldStatementData?.summary?.credit || 0))}</div>
              </div>

              <div class="summary-card balance">
                <div class="label">الرصيد</div>
                <div class="value">${escapeHtml(money(oldStatementData?.summary?.balance || 0))}</div>
              </div>

              <div class="summary-card">
                <div class="label">افتتاحي مدين</div>
                <div class="value">${escapeHtml(money(oldStatementData?.opening?.debit || 0))}</div>
              </div>

              <div class="summary-card">
                <div class="label">افتتاحي دائن</div>
                <div class="value">${escapeHtml(money(oldStatementData?.opening?.credit || 0))}</div>
              </div>
            </div>
          </section>

          <div class="section-title">استمارات التسجيل</div>

          <table>
            <colgroup>
              <col class="col-index" />
              <col class="col-date" />
              <col class="col-type" />
              <col class="col-no" />
              <col class="col-money" />
              <col class="col-money" />
              <col class="col-notes" />
              <col class="col-name" />
            </colgroup>
            <thead>
              <tr>
                <th>م</th>
                <th>التاريخ</th>
                <th>نوع المستند</th>
                <th>رقم المستند</th>
                <th>مدين</th>
                <th>دائن</th>
                <th>البيان</th>
                <th>مندوب البيع</th>
              </tr>
            </thead>
            <tbody>
              ${
                registrationRowsHtml ||
                `<tr><td colspan="8" class="empty-row">لا توجد استمارات تسجيل</td></tr>`
              }
            </tbody>
          </table>

          <div class="section-title">الحركات النقدية</div>

          <table>
            <colgroup>
              <col class="col-index" />
              <col class="col-date" />
              <col class="col-no" />
              <col class="col-money" />
              <col class="col-money" />
              <col class="col-notes" />
              <col class="col-ref" />
              <col class="col-bank" />
            </colgroup>
            <thead>
              <tr>
                <th>م</th>
                <th>التاريخ</th>
                <th>رقم المستند</th>
                <th>مدين</th>
                <th>دائن</th>
                <th>البيان</th>
                <th>المرجع</th>
                <th>البنك / الخزينة</th>
              </tr>
            </thead>
            <tbody>
              ${
                cashRowsHtml ||
                `<tr><td colspan="8" class="empty-row">لا توجد حركات نقدية</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer-note">
          المعهد السعودي المتخصص العالي للتدريب
          </div>

          <script>
            window.addEventListener("load", function () {
              window.setTimeout(function () {
                printWhenReady();
              }, 350);
            });
          </script>
        </body>
      </html>
    `;

    const htmlBlob = new Blob([printableHtml], {
      type: "text/html;charset=utf-8"
    });

    const blobUrl = URL.createObjectURL(htmlBlob);
    const printWindow = window.open(blobUrl, "_blank", "width=1200,height=850");

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      setOldStatementError(
        "المتصفح منع نافذة التصدير. برجاء السماح بالنوافذ المنبثقة"
      );
      return;
    }

    const releaseBlobUrl = () => {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    };

    printWindow.addEventListener("load", releaseBlobUrl, { once: true });
  };


  const oldRegistrationColumns = [
    { field: "date", headerName: "التاريخ", width: 110, align: "center", headerAlign: "center" },
    { field: "documentType", headerName: "نوع المستند", width: 150, align: "center", headerAlign: "center" },
    { field: "documentNo", headerName: "رقم المستند", width: 130, align: "center", headerAlign: "center" },
    { field: "debit", headerName: "مدين", width: 110, align: "center", headerAlign: "center", renderCell: (params) => <MoneyCell value={params.value} /> },
    { field: "credit", headerName: "دائن", width: 110, align: "center", headerAlign: "center", renderCell: (params) => <MoneyCell value={params.value} /> },
    { field: "statement", headerName: "البيان", flex: 1, minWidth: 300, renderCell: (params) => <EllipsisText value={params.value} /> },
    { field: "sellerName", headerName: "مندوب البيع", width: 180, align: "center", headerAlign: "center" }
  ];

  const oldCashColumns = [
    {
      field: "date",
      headerName: "التاريخ",
      width: 110,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "documentNo",
      headerName: "رقم المستند",
      width: 135,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "debit",
      headerName: "مدين",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.value} />
    },
    {
      field: "credit",
      headerName: "دائن",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.value} />
    },
    {
      field: "statement",
      headerName: "البيان",
      flex: 1,
      minWidth: 300,
      renderCell: (params) => <EllipsisText value={params.value} />
    },
    {
      field: "reference",
      headerName: "المرجع",
      width: 150,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "bank",
      headerName: "البنك / الخزينة",
      width: 180,
      align: "center",
      headerAlign: "center"
    }
  ];

  const loadStatement = async () => {
    if (!accountGuid) {
      setError("لا يمكن قراءة حساب الطالب");
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        accountGuid
      });

      if (notes.trim()) {
        params.append("notes", notes.trim());
      }

      const url = `${apiBaseUrl}/api/reception-office/student-statement?${params.toString()}`;

      console.log("STUDENT STATEMENT URL =>", url);

      const response = await fetch(url);

      const result = await response.json().catch(() => null);

      console.log("STUDENT STATEMENT RESPONSE =>", result);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحميل كشف الحساب");
      }

      setData(result);
    } catch (err) {
      console.error("STUDENT STATEMENT ERROR =>", err);
      setError(err.message || "حدث خطأ أثناء تحميل كشف الحساب");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setActiveTab(0);
      setNotes("");
      setData(null);
      setError("");
    }
  }, [open, accountGuid]);

  useEffect(() => {
    if (open && accountGuid) {
      loadStatement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountGuid, apiBaseUrl]);

  const statementRows = (data?.statementRows || []).map((row, index) => ({
    ...row,
    id: normalizeRowId(row, index)
  }));

  const salesInvoices = (data?.salesInvoices || []).map((row, index) => ({
    ...row,
    id: normalizeRowId(row, index)
  }));

  const salesReturns = (data?.salesReturns || []).map((row, index) => ({
    ...row,
    id: normalizeRowId(row, index)
  }));

  const exportStatementToPdf = () => {
    if (!data || statementRows.length === 0) {
      setError("لا توجد بيانات في كشف الحساب لتصديرها");
      return;
    }

    const rowsHtml = statementRows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(formatGregorianDate(row.date))}</td>
            <td>${escapeHtml(row.documentType)}</td>
            <td>${escapeHtml(row.documentNo)}</td>
            <td>${escapeHtml(money(row.maden))}</td>
            <td>${escapeHtml(money(row.daen))}</td>
            <td class="${toNumber(row.balance) > 0 ? "balance-due" : ""}">
              ${escapeHtml(money(row.balance))}
            </td>
            <td class="notes">${escapeHtml(row.notes)}</td>
            <td>${escapeHtml(row.costCenter)}</td>
          </tr>
        `
      )
      .join("");

    const documentTitle = `كشف حساب - ${studentName}`;

    // لا نكتب HTML مباشرة داخل نافذة جديدة؛ بعض الاستضافات والمتصفحات
    // تمنع أو تؤخر document.write بعد الـbuild. ننشئ مستند Blob كاملًا
    // ثم نفتح رابطه، وبذلك تعمل الطباعة محليًا وعلى الاستضافة بنفس الطريقة.
    const printableHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(documentTitle)}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm 10mm 14mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              margin: 0;
              color: #1f2d3d;
              direction: rtl;
              font-family: Arial, Tahoma, sans-serif;
              background: #fff;
            }

            .page-header {
              border: 2px solid #057546;
              border-radius: 12px;
              padding: 14px 18px;
              margin-bottom: 12px;
              page-break-inside: avoid;
            }

            .title {
              color: #057546;
              text-align: center;
              font-size: 24px;
              font-weight: 900;
              margin-bottom: 12px;
            }

            .student-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 15px;
              font-weight: 700;
            }

            .student-info div {
              border: 1px solid #dceee6;
              border-radius: 8px;
              padding: 8px 10px;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin: 12px 0;
              page-break-inside: avoid;
            }

            .summary-card {
              border: 1px solid #cfe6db;
              border-radius: 10px;
              padding: 10px;
              text-align: center;
            }

            .summary-card .label {
              color: #057546;
              font-size: 14px;
              font-weight: 800;
            }

            .summary-card .value {
              margin-top: 4px;
              font-size: 20px;
              font-weight: 900;
            }

            .summary-card.balance .value {
              color: #ae1e21;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 9.5px;
            }

            thead {
              display: table-header-group;
            }

            tfoot {
              display: table-footer-group;
            }

            tr {
              page-break-inside: avoid;
            }

            th {
              background: #057546;
              color: #fff;
              padding: 7px 4px;
              border: 1px solid #034d31;
              font-weight: 900;
            }

            td {
              border: 1px solid #d9e6e0;
              padding: 6px 4px;
              text-align: center;
              vertical-align: middle;
              overflow-wrap: anywhere;
            }

            tbody tr:nth-child(even) {
              background: #f4faf7;
            }

            .notes {
              text-align: right;
              line-height: 1.5;
            }

            .balance-due {
              color: #ae1e21;
              font-weight: 900;
            }

            .footer-note {
              margin-top: 10px;
              padding-top: 7px;
              border-top: 1px solid #057546;
              font-size: 10px;
              color: #555;
              text-align: center;
            }

            .col-index { width: 4%; }
            .col-date { width: 9%; }
            .col-type { width: 10%; }
            .col-no { width: 8%; }
            .col-money { width: 7%; }
            .col-notes { width: 31%; }
            .col-center { width: 17%; }

            @media print {
              body {
                width: 100%;
              }

              .no-print {
                display: none !important;
              }
            }
          </style>
        ${PRINT_READY_SCRIPT}</head>
        <body>
          <section class="page-header">
            <div class="title">كشف حساب طالب</div>

            <div class="student-info">
              <div><strong>اسم الطالب:</strong> ${escapeHtml(studentName)}</div>
              <div><strong>رقم الهوية:</strong> ${escapeHtml(nationalId)}</div>
            </div>

            <div class="summary">
              <div class="summary-card">
                <div class="label">مدين</div>
                <div class="value">${escapeHtml(money(data?.summary?.maden || 0))}</div>
              </div>

              <div class="summary-card">
                <div class="label">دائن</div>
                <div class="value">${escapeHtml(money(data?.summary?.daen || 0))}</div>
              </div>

              <div class="summary-card balance">
                <div class="label">الرصيد</div>
                <div class="value">${escapeHtml(money(data?.summary?.balance || 0))}</div>
              </div>
            </div>
          </section>

          <table>
            <colgroup>
              <col class="col-index" />
              <col class="col-date" />
              <col class="col-type" />
              <col class="col-no" />
              <col class="col-money" />
              <col class="col-money" />
              <col class="col-money" />
              <col class="col-notes" />
              <col class="col-center" />
            </colgroup>
            <thead>
              <tr>
                <th>م</th>
                <th>التاريخ الميلادي</th>
                <th>نوع المستند</th>
                <th>رقم المستند</th>
                <th>مدين</th>
                <th>دائن</th>
                <th>الرصيد</th>
                <th>البيان</th>
                <th>مركز التكلفة</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <div class="footer-note">
            تم إصدار كشف الحساب من نظام إدارة المهام
          </div>

          <script>
            window.addEventListener("load", function () {
              window.setTimeout(function () {
                printWhenReady();
              }, 350);
            });
          </script>
        </body>
      </html>
    `;

    const htmlBlob = new Blob([printableHtml], {
      type: "text/html;charset=utf-8"
    });

    const blobUrl = URL.createObjectURL(htmlBlob);
    const printWindow = window.open(blobUrl, "_blank", "width=1200,height=850");

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      setError("المتصفح منع نافذة التصدير. برجاء السماح بالنوافذ المنبثقة");
      return;
    }

    const releaseBlobUrl = () => {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    };

    printWindow.addEventListener("load", releaseBlobUrl, { once: true });
  };

  const resolveRegisterDocumentGuid = (row) => {
    const candidates = [
      row?.docGuid,
      row?.DocGuid,
      row?.regDocGuid,
      row?.RegDocGuid,
      row?.documentGuid,
      row?.DocumentGuid,
      row?.actionGuid,
      row?.ActionGuid,
      row?.guid,
      row?.Guid,
      row?.id
    ];

    const guidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return (
      candidates
        .map((value) => String(value || "").trim())
        .find((value) => guidPattern.test(value)) || ""
    );
  };

  const openRegisterDocumentPreview = (row) => {
    const docGuid = resolveRegisterDocumentGuid(row);
    const documentNo =
      row?.documentNo ||
      row?.DocumentNo ||
      row?.docNo ||
      row?.DocNo ||
      "";

    if (!docGuid) {
      // Backward compatibility: لو الصفحة الأب عندها resolver خاص بها نستخدمه فقط كـ fallback.
      if (typeof onOpenStatementDocument === "function") {
        onOpenStatementDocument(row);
        return;
      }

      setError(
        `تعذر قراءة معرف مستند التسجيل${documentNo ? ` رقم ${documentNo}` : ""}`
      );
      return;
    }

    setSelectedRegisterDocument({
      ...row,
      docGuid,
      documentNo
    });
    setRegisterDocumentOpen(true);
  };

  const statementColumns = [
    {
      field: "actions",
      headerName: "العمليات",
      width: isCompact ? 88 : 178,
      minWidth: isCompact ? 88 : 178,
      maxWidth: isCompact ? 88 : 178,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={0.45} justifyContent="center" sx={{ width: "100%" }}>
          {isCompact ? (
            <Tooltip title="عرض المستند">
              <IconButton
                size="small"
                aria-label="عرض المستند"
                onClick={() => openRegisterDocumentPreview(params.row)}
                sx={(theme) => ({
                  color: primaryColor,
                  border: theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
                  backgroundColor: theme.palette.mode === "dark"
                    ? (theme.palette.surfaces?.nested || "#1b3328")
                    : primaryLight,
                  width: 28,
                  height: 28,
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark"
                      ? (theme.palette.surfaces?.hover || "#214333")
                      : "#d7f0e5"
                  }
                })}
              >
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon sx={{ fontSize: 17 }} />}
              onClick={() => openRegisterDocumentPreview(params.row)}
              sx={uiLayout.withUiSx((theme) => ({
                minWidth: 112,
                height: 30,
                px: 1.1,
                borderRadius: 1.8,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: "0.72rem",
                color: theme.palette.mode === "dark" ? "#dff8ec" : primaryDark,
                borderColor: theme.palette.mode === "dark" ? "#67C99D" : primaryColor,
                backgroundColor: theme.palette.mode === "dark"
                  ? (theme.palette.surfaces?.nested || "#1b3328")
                  : "#f4faf7",
                "&:hover": {
                  borderColor: theme.palette.mode === "dark" ? "#67C99D" : primaryDark,
                  backgroundColor: theme.palette.mode === "dark"
                    ? (theme.palette.surfaces?.hover || "#214333")
                    : "#e7f5ee"
                }
              }), uiLayout.buttonSx)}
            >
              عرض المستند
            </Button>
          )}

          <Tooltip title="سجل العمليات">
            <IconButton
              size="small"
              aria-label="سجل العمليات"
              onClick={() => onOpenHistory?.(params.row)}
              sx={(theme) => ({
                color: accentColor,
                border: theme.palette.mode === "dark" ? "1px solid #67C99D" : "1px solid #f3c8c8",
                backgroundColor: theme.palette.mode === "dark"
                  ? (theme.palette.surfaces?.nested || "#1b3328")
                  : "#fff4f4",
                width: 28,
                height: 28,
                "&:hover": {
                  backgroundColor: theme.palette.mode === "dark"
                    ? (theme.palette.surfaces?.hover || "#214333")
                    : "#ffe4e4"
                }
              })}
            >
              <HistoryIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    },
    {
      field: "date",
      headerName: "التاريخ الميلادي",
      width: 108,
      minWidth: 108,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) =>
        formatGregorianDate(
          params && typeof params === "object" && "value" in params
            ? params.value
            : params
        )
    },
    {
      field: "documentType",
      headerName: "نوع المستند",
      flex: 0.8,
      minWidth: 105,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "documentNo",
      headerName: "رقم المستند",
      width: 96,
      minWidth: 96,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "maden",
      headerName: "مدين",
      width: 76,
      minWidth: 76,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.maden} />
    },
    {
      field: "daen",
      headerName: "دائن",
      width: 76,
      minWidth: 76,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.daen} />
    },
    {
      field: "balance",
      headerName: "الرصيد",
      width: 82,
      minWidth: 82,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <MoneyCell
          value={params.row?.balance}
          color={toNumber(params.row?.balance) > 0 ? accentColor : primaryColor}
        />
      )
    },
    {
      field: "notes",
      headerName: "بيان",
      flex: 1.55,
      minWidth: 220,
      renderCell: (params) => <EllipsisText value={params.value} />
    },
    {
      field: "costCenter",
      headerName: "مركز التكلفة",
      flex: 1,
      minWidth: 180,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <EllipsisText value={params.value} align="center" direction="rtl" />
      )
    }
  ];

  const openSalesInvoice = (row) => {
    const billGuid =
      row?.billGuid ||
      row?.BillGuid ||
      row?.guid ||
      row?.Guid ||
      row?.actionGuid ||
      "";

    if (!billGuid) {
      setError("تعذر قراءة رقم الفاتورة الداخلي");
      return;
    }

    setSelectedSalesInvoice({
      ...row,
      billGuid
    });

    setSalesInvoiceOpen(true);
  };

  const invoiceColumns = [
    {
      field: "actions",
      headerName: "عرض",
      width: 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => openSalesInvoice(params.row)}
          sx={uiLayout.withUiSx((theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              borderRadius: 2,
              fontWeight: 900,
              color: primaryColor,
              borderColor: isDark ? "#67C99D" : primaryLight,
              backgroundColor: isDark ? theme.palette.surfaces.card : whiteColor,
              "&:hover": {
                borderColor: primaryColor,
                backgroundColor: isDark ? "rgba(103,201,157,.14)" : "#f0faf5"
              }
            };
          }, uiLayout.buttonSx)}
        >
          عرض
        </Button>
      )
    },
    {
      field: "date",
      headerName: "التاريخ الميلادي",
      width: 110,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) =>
        formatGregorianDate(
          params && typeof params === "object" && "value" in params
            ? params.value
            : params
        )
    },
    {
      field: "invoiceNo",
      headerName: "رقم الفاتورة",
      width: 150,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "notes",
      headerName: "ملاحظات",
      flex: 1,
      minWidth: 330,
      renderCell: (params) => <EllipsisText value={params.value} />
    },
    {
      field: "total",
      headerName: "الإجمالي",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.total} />
    },
    {
      field: "collector",
      headerName: "المحصل",
      width: 240,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <EllipsisText value={params.value} align="center" direction="rtl" />
      )
    }
  ];

  const returnColumns = [
    {
      field: "actions",
      headerName: "عرض",
      width: 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => onOpenSalesReturn?.(params.row)}
          sx={uiLayout.withUiSx((theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              borderRadius: 2,
              fontWeight: 900,
              color: accentColor,
              borderColor: isDark ? pinColor("#f3c6c7") : "#f3c6c7",
              backgroundColor: isDark ? theme.palette.surfaces.card : whiteColor,
              "&:hover": {
                borderColor: accentColor,
                backgroundColor: isDark ? "rgba(229,90,90,.14)" : "#fff4f4"
              }
            };
          }, uiLayout.buttonSx)}
        >
          عرض
        </Button>
      )
    },
    {
      field: "date",
      headerName: "التاريخ الميلادي",
      width: 110,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) =>
        formatGregorianDate(
          params && typeof params === "object" && "value" in params
            ? params.value
            : params
        )
    },
    {
      field: "returnNo",
      headerName: "رقم المرتجع",
      width: 150,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "notes",
      headerName: "ملاحظات",
      flex: 1,
      minWidth: 330,
      renderCell: (params) => <EllipsisText value={params.value} />
    },
    {
      field: "total",
      headerName: "الإجمالي",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.total} />
    },
    {
      field: "collector",
      headerName: "المحصل",
      width: 240,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <EllipsisText value={params.value} align="center" direction="rtl" />
      )
    }
  ];

  const compactStatementColumns = isPhone
    ? statementColumns.filter((column) =>
        ["date", "documentType", "balance", "actions"].includes(column.field)
      )
    : statementColumns.filter((column) =>
        ["date", "documentType", "documentNo", "maden", "daen", "balance", "actions"].includes(column.field)
      );

  const compactInvoiceColumns = isPhone
    ? invoiceColumns.filter((column) =>
        ["date", "invoiceNo", "total", "actions"].includes(column.field)
      )
    : invoiceColumns.filter((column) =>
        ["date", "invoiceNo", "total", "collector", "actions"].includes(column.field)
      );

  const compactReturnColumns = isPhone
    ? returnColumns.filter((column) =>
        ["date", "returnNo", "total", "actions"].includes(column.field)
      )
    : returnColumns.filter((column) =>
        ["date", "returnNo", "total", "collector", "actions"].includes(column.field)
      );

  const compactOldRegistrationColumns = oldRegistrationColumns.filter((column) =>
    (isPhone
      ? ["date", "documentNo", "debit", "credit"].includes(column.field)
      : ["date", "documentType", "documentNo", "debit", "credit"].includes(column.field))
  );

  const compactOldCashColumns = oldCashColumns.filter((column) =>
    (isPhone
      ? ["date", "documentNo", "debit", "credit"].includes(column.field)
      : ["date", "documentNo", "debit", "credit", "reference"].includes(column.field))
  );

  const compactGridColumn = (column) => ({
    ...column,
    flex: column.flex ? 1 : undefined,
    minWidth: column.flex ? (isPhone ? 92 : 120) : undefined,
    width: column.flex ? undefined : Math.min(column.width || 110, isPhone ? 92 : 118)
  });

  const isDarkGrid = theme.palette.mode === "dark";
  const gridSx = {
    border: isDarkGrid ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
    borderRadius: 3,
    backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor,
    direction: "rtl",
    overflow: "hidden",
    "& .MuiDataGrid-columnHeaders": {
      background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
      color: whiteColor,
      fontWeight: 1000,
      borderBottom: `1px solid ${primaryDark}`
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 1000,
      color: whiteColor,
      fontSize: isPhone ? "0.43rem" : isTablet ? "0.52rem" : undefined,
      whiteSpace: "normal",
      lineHeight: 1.15,
      textAlign: "center"
    },
    "& .MuiDataGrid-cell": {
      fontWeight: 800,
      borderColor: isDarkGrid ? "#67C99D" : "#edf4f1",
      fontSize: isPhone ? "0.44rem" : isTablet ? "0.53rem" : "0.75rem",
      px: isPhone ? 0.15 : isTablet ? 0.35 : 0.45
    },
    "& .MuiDataGrid-row:nth-of-type(even)": {
      backgroundColor: isDarkGrid ? theme.palette.surfaces.section : "#fbfdfc"
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: isDarkGrid ? theme.palette.surfaces.hover : "#f0faf5"
    },
    "& .MuiDataGrid-footerContainer": {
      direction: "rtl",
      borderTop: isDarkGrid ? `1px solid #67C99D` : `1px solid ${primaryLight}`
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      fullScreen={isPhone}
      sx={uiLayout.withUiSx({
  "& .MuiDialog-container": {
    pt: isPhone ? "120px" : isTablet ? "50px" : 1.5,
    px: isPhone ? 0 : isTablet ? 0.7 : 1.5,
    pb: isPhone ? 0 : isTablet ? 0.7 : 1.5,
  },
}, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
      PaperProps={{
        sx: (theme) => ({
          width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
          maxWidth: isPhone ? "100vw" : isTablet ? "1200px" : undefined,
          borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
          overflow: "hidden",
          direction: "rtl",
          height: isPhone ? "100dvh" : isTablet ? "94dvh" : "92vh",
          border: theme.palette.mode === "dark" ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
          boxShadow: theme.palette.mode === "dark" ? `0 0 0 1px #67C99D, 0 18px 50px rgba(0,0,0,.5)` : "0 18px 50px rgba(5,117,70,0.18)"
        })
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
          borderBottom: `1px solid ${primaryDark}`,
          py: isPhone ? 0.35 : isTablet ? 0.5 : 1.4,
          px: isPhone ? 0.4 : isTablet ? 0.65 : 2,
          color: whiteColor,
          overflow: "hidden"
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={isCompact ? 0.25 : 1}
          sx={{ width: "100%", minWidth: 0 }}
        >
          <Box sx={{ minWidth: 0, flexShrink: 1 }}>
            {!isCompact && (
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: whiteColor,
                  fontSize: "1.15rem"
                }}
              >
                كشف حساب طالب
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={isCompact ? 0.25 : 1}
              sx={{ mt: isCompact ? 0 : 0.8, minWidth: 0 }}
            >
              {!isCompact && (
                <Chip
                  label={studentName}
                  sx={{
                    fontWeight: 900,
                    backgroundColor: pinColor(whiteColor),
                    color: pinColor(primaryColor)
                  }}
                />
              )}

              <Chip
                label={nationalId}
                sx={{
                  fontWeight: 950,
                  backgroundColor: pinColor(whiteColor),
                  color: pinColor(primaryColor),
                  height: isPhone ? 24 : isTablet ? 27 : undefined,
                  maxWidth: isCompact ? 102 : undefined,
                  "& .MuiChip-label": {
                    px: isPhone ? 0.65 : isTablet ? 0.8 : undefined,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    whiteSpace: "nowrap"
                  }
                }}
              />
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={isCompact ? 0.08 : 1}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            <Tooltip title="فتح أرشيف المتدرب">
              <Button
                onClick={openArchive}
                disabled={loading}
                startIcon={<ArchiveIcon />}
                variant="outlined"
                sx={uiLayout.withUiSx({
                  minWidth: isPhone ? 54 : isTablet ? 64 : 112,
                  height: isPhone ? 25 : isTablet ? 28 : 38,
                  px: isPhone ? 0.35 : isTablet ? 0.55 : 1.4,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  borderRadius: isCompact ? 1.4 : 2.5,
                  color: whiteColor,
                  borderColor: "rgba(255,255,255,0.75)",
                  fontWeight: 950,
                  direction: "rtl",
                  whiteSpace: "nowrap",
                  "& .MuiButton-startIcon": {
                    ml: isCompact ? 0.2 : 0.4,
                    mr: 0,
                    "& svg": {
                      fontSize: isPhone ? 13 : isTablet ? 15 : undefined
                    }
                  },
                  "&:hover": {
                    borderColor: whiteColor,
                    backgroundColor: "rgba(255,255,255,0.12)"
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.45)",
                    borderColor: "rgba(255,255,255,0.25)"
                  }
                }, uiLayout.buttonSx)}
              >
                الأرشيف
              </Button>
            </Tooltip>

            <Tooltip title="تصدير كشف الحساب كامل PDF">
              <IconButton
                onClick={exportStatementToPdf}
                disabled={loading || statementRows.length === 0}
                sx={{
                  color: whiteColor,
                  width: isPhone ? 25 : isTablet ? 28 : undefined,
                  height: isPhone ? 25 : isTablet ? 28 : undefined,
                  p: isCompact ? 0.25 : undefined,
                  "& svg": {
                    fontSize: isPhone ? 15 : isTablet ? 17 : undefined
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.45)"
                  }
                }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="تحديث">
              <IconButton
                onClick={loadStatement}
                sx={{
                  color: whiteColor,
                  width: isPhone ? 25 : isTablet ? 28 : undefined,
                  height: isPhone ? 25 : isTablet ? 28 : undefined,
                  p: isCompact ? 0.25 : undefined,
                  "& svg": {
                    fontSize: isPhone ? 15 : isTablet ? 17 : undefined
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="إغلاق">
              <IconButton
                onClick={onClose}
                sx={{
                  color: whiteColor,
                  width: isPhone ? 25 : isTablet ? 28 : undefined,
                  height: isPhone ? 25 : isTablet ? 28 : undefined,
                  p: isCompact ? 0.25 : undefined,
                  "& svg": {
                    fontSize: isPhone ? 15 : isTablet ? 17 : undefined
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: isPhone ? 0.4 : isTablet ? 0.7 : 2.2,
          background: theme.palette.mode === "dark" ? theme.palette.surfaces.page : `linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0
        }}
      >
        <Stack
          direction="row"
          spacing={isCompact ? 0.35 : 1.5}
          flexWrap="nowrap"
          sx={{ mb: isCompact ? 0.45 : 2 }}
        >
          <SummaryCard label="مدين" value={data?.summary?.maden || 0} />
          <SummaryCard label="دائن" value={data?.summary?.daen || 0} />
          <SummaryCard
            label="الرصيد"
            value={data?.summary?.balance || 0}
            color={toNumber(data?.summary?.balance) > 0 ? accentColor : primaryColor}
          />
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: isCompact ? 0.35 : 1.2,
            mb: isCompact ? 0.45 : 1.5,
            borderRadius: 3,
            border: isDarkGrid ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
            backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
          }}
        >
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5, fontWeight: 900 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: isDarkGrid ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
            backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor,
            overflow: "hidden",
            boxShadow: isDarkGrid ? `0 0 0 1px #67C99D` : "0 10px 30px rgba(5,117,70,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant={isCompact ? "scrollable" : "standard"}
            scrollButtons={false}
            sx={{
              px: 1,
              borderBottom: isDarkGrid ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
              "& .MuiTab-root": {
                fontWeight: 1000,
                minHeight: isPhone ? 34 : isTablet ? 40 : 48,
                minWidth: isPhone ? 86 : isTablet ? 110 : undefined,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                px: isPhone ? 0.6 : isTablet ? 0.9 : undefined
              },
              "& .Mui-selected": {
                color: `${primaryColor} !important`
              },
              "& .MuiTabs-indicator": {
                backgroundColor: primaryColor,
                height: 3
              }
            }}
          >
            <Tab label="كشف الحساب" />
            <Tab label="فواتير المبيعات" />
            <Tab label="مرتجع المبيعات" />
          </Tabs>

          <Divider />

          <Box
            sx={uiLayout.withUiSx({
              height: isPhone ? "calc(100dvh - 225px)" : isTablet ? "calc(94dvh - 245px)" : "calc(92vh - 320px)",
              minHeight: isPhone ? 360 : isTablet ? 430 : 410,
              p: isPhone ? 0.25 : isTablet ? 0.45 : 1.2,
              minWidth: 0
            }, uiLayout.tableContainerSx)}
          >
            {loading ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CircularProgress sx={{ color: primaryColor }} />
              </Box>
            ) : activeTab === 0 ? (
              statementRows.length ? (
                <DataGrid
                  rows={statementRows}
                  columns={(isCompact ? compactStatementColumns.map(compactGridColumn) : statementColumns)}
                  density="compact"
                  disableRowSelectionOnClick
                  disableColumnMenu={isCompact}
                  disableColumnFilter={isCompact}
                  rowHeight={isPhone ? 38 : isTablet ? 44 : undefined}
                  columnHeaderHeight={isPhone ? 36 : isTablet ? 42 : undefined}
                  pageSizeOptions={[30, 60, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 30, page: 0 }
                    }
                  }}
                  localeText={{
                    noRowsLabel: "لا توجد بيانات",
                    footerRowSelected: (count) => `${count} صف محدد`,
                    MuiTablePagination: {
                      labelRowsPerPage: "عدد الصفوف"
                    }
                  }}
                  sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
                />
              ) : (
                <EmptyBox text="لا توجد حركات في كشف الحساب" />
              )
            ) : activeTab === 1 ? (
              salesInvoices.length ? (
                <DataGrid
                  rows={salesInvoices}
                  columns={(isCompact ? compactInvoiceColumns.map(compactGridColumn) : invoiceColumns)}
                  density="compact"
                  disableRowSelectionOnClick
                  disableColumnMenu={isCompact}
                  disableColumnFilter={isCompact}
                  rowHeight={isPhone ? 38 : isTablet ? 44 : undefined}
                  columnHeaderHeight={isPhone ? 36 : isTablet ? 42 : undefined}
                  pageSizeOptions={[30, 60, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 30, page: 0 }
                    }
                  }}
                  localeText={{
                    noRowsLabel: "لا توجد بيانات",
                    footerRowSelected: (count) => `${count} صف محدد`,
                    MuiTablePagination: {
                      labelRowsPerPage: "عدد الصفوف"
                    }
                  }}
                  sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
                />
              ) : (
                <EmptyBox text="لا توجد فواتير مبيعات لهذا الطالب" />
              )
            ) : salesReturns.length ? (
              <DataGrid
                rows={salesReturns}
                columns={(isCompact ? compactReturnColumns.map(compactGridColumn) : returnColumns)}
                density="compact"
                disableRowSelectionOnClick
                pageSizeOptions={[30, 60, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 30, page: 0 }
                  }
                }}
                localeText={{
                  noRowsLabel: "لا توجد بيانات",
                  footerRowSelected: (count) => `${count} صف محدد`,
                  MuiTablePagination: {
                    labelRowsPerPage: "عدد الصفوف"
                  }
                }}
                sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
              />
            ) : (
              <EmptyBox text="لا توجد مرتجعات مبيعات لهذا الطالب" />
            )}
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={uiLayout.withUiSx({
          px: isPhone ? 0.45 : isTablet ? 0.7 : 2,
          py: isPhone ? 0.35 : isTablet ? 0.55 : 1.5,
          borderTop: isDarkGrid ? `1px solid #67C99D` : `1px solid ${primaryLight}`,
          backgroundColor: isDarkGrid ? theme.palette.surfaces.card : whiteColor
        }, uiLayout.dialogActionsSx)}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={uiLayout.withUiSx({
            borderRadius: 2,
            fontWeight: 1000,
            px: isPhone ? 1 : isTablet ? 1.4 : 4,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            color: accentColor,
            borderColor: isDarkGrid ? pinColor("#f3c6c7") : "#f3c6c7",
            backgroundColor: isDarkGrid ? "transparent" : whiteColor,
            "&:hover": {
              borderColor: accentColor,
              backgroundColor: isDarkGrid ? "rgba(229,90,90,.14)" : "#fff4f4"
            }
          }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>

      <Dialog
        open={archiveOpen}
        onClose={() => !archiveLoading && setArchiveOpen(false)}
        fullWidth
        maxWidth="lg"
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
            maxWidth: isPhone ? "100vw" : isTablet ? "980px" : undefined,

            height: isPhone
              ? "calc(100dvh - 58px)"
              : isTablet
                ? "calc(100dvh - 72px)"
                : "82vh",

            maxHeight: isPhone
              ? "calc(100dvh - 58px)"
              : isTablet
                ? "calc(100dvh - 72px)"
                : "82vh",

            m: 0,
            borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
            direction: "rtl",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }
        }}
      >
        <DialogTitle
          sx={{
            flexShrink: 0,
            fontWeight: 1000,
            color: whiteColor,
            direction: "rtl",
            textAlign: "center",
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
            py: isPhone ? 0.45 : isTablet ? 0.65 : 1.4,
            px: isPhone ? 0.55 : isTablet ? 0.8 : 2,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.8rem" : undefined,
            lineHeight: 1.2
          }}
        >
          أرشيف المتدرب
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            direction: "rtl",
            p: isPhone ? 0.25 : isTablet ? 0.45 : 2,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden"
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={isCompact ? 0.25 : 1}
            sx={{
              mb: isCompact ? 0.3 : 1.5,
              flexShrink: 0,
              minWidth: 0
            }}
          >
            <Stack
              direction="row"
              spacing={isCompact ? 0.25 : 1}
              sx={{ minWidth: 0 }}
            >
              {!isCompact && (
                <Chip
                  label={studentName}
                  sx={{ fontWeight: 900 }}
                />
              )}

              <Chip
                label={nationalId}
                sx={{
                  fontWeight: 950,
                  height: isPhone ? 22 : isTablet ? 25 : undefined,
                  maxWidth: isCompact ? 105 : undefined,

                  "& .MuiChip-label": {
                    px: isPhone ? 0.5 : isTablet ? 0.7 : undefined,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    whiteSpace: "nowrap"
                  }
                }}
              />
            </Stack>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadArchiveStudents}
              disabled={archiveLoading}
              sx={uiLayout.withUiSx({
                flexShrink: 0,
                fontWeight: 900,
                minWidth: isPhone ? 58 : isTablet ? 72 : undefined,
                height: isPhone ? 27 : isTablet ? 31 : undefined,
                px: isPhone ? 0.45 : isTablet ? 0.7 : undefined,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,

                "& .MuiButton-startIcon": {
                  mr: 0.2,
                  ml: 0,

                  "& svg": {
                    fontSize: isPhone ? 13 : isTablet ? 15 : undefined
                  }
                }
              }, uiLayout.buttonSx)}
            >
              تحديث
            </Button>
          </Stack>

          {archiveError ? (
            <Alert
              severity="error"
              sx={{
                mb: isCompact ? 0.3 : 1.5,
                py: isCompact ? 0.15 : undefined,
                fontWeight: 900,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                flexShrink: 0
              }}
            >
              {archiveError}
            </Alert>
          ) : null}

          {archiveLoading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={isCompact ? 0.6 : 2}
              sx={{ flex: 1, minHeight: 0 }}
            >
              <CircularProgress size={isPhone ? 24 : isTablet ? 30 : 40} />

              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                }}
              >
                جاري تحميل أرشيف المتدرب...
              </Typography>
            </Stack>
          ) : (
            <Box
              sx={uiLayout.withUiSx({
                flex: 1,
                minHeight: 0,
                width: "100%",
                overflow: "hidden"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={archiveRows}
                columns={
                  isCompact
                    ? [
                        {
                          field: "studentName",
                          headerName: "الطالب",
                          flex: 1,
                          minWidth: isPhone ? 105 : 150,
                          renderCell: (params) => (
                            <EllipsisText
                              value={params.value}
                              align="center"
                              direction="rtl"
                            />
                          )
                        },
                        {
                          field: "nationalId",
                          headerName: "الهوية",
                          width: isPhone ? 84 : 110,
                          align: "center",
                          headerAlign: "center"
                        },
                        {
                          field: "actions",
                          headerName: "",
                          width: isPhone ? 42 : 48,
                          sortable: false,
                          filterable: false,
                          disableColumnMenu: true,
                          align: "center",
                          headerAlign: "center",
                          renderCell: (params) => (
                            <IconButton
                              onClick={() => loadOldStatement(params.row)}
                              sx={{
                                color: primaryColor,
                                backgroundColor: primaryLight,
                                width: isPhone ? 25 : 28,
                                height: isPhone ? 25 : 28
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: isPhone ? 14 : 16 }} />
                            </IconButton>
                          )
                        }
                      ]
                    : [
                        {
                          field: "studentName",
                          headerName: "اسم الطالب",
                          flex: 1,
                          minWidth: 140
                        },
                        {
                          field: "studentTel",
                          headerName: "رقم الجوال",
                          width: 140,
                          align: "center",
                          headerAlign: "center"
                        },
                        {
                          field: "nationalId",
                          headerName: "رقم الهوية",
                          width: 110,
                          align: "center",
                          headerAlign: "center"
                        },
                        {
                          field: "notes",
                          headerName: "الملاحظات",
                          flex: 1.3,
                          minWidth: 250,
                          renderCell: (params) => (
                            <EllipsisText value={params.value} />
                          )
                        },
                        {
                          field: "branchCode",
                          headerName: "كود الفرع",
                          width: 110,
                          align: "center",
                          headerAlign: "center"
                        },
                        {
                          field: "oldCustomerNo",
                          headerName: "رقم العميل القديم",
                          width: 150,
                          align: "center",
                          headerAlign: "center"
                        },
                        {
                          field: "actions",
                          headerName: "العمليات",
                          width: 130,
                          sortable: false,
                          filterable: false,
                          align: "center",
                          headerAlign: "center",
                          renderCell: (params) => (
                            <Tooltip title="كشف الحساب السابق">
                              <IconButton
                                onClick={() => loadOldStatement(params.row)}
                                sx={{
                                  color: primaryColor,
                                  backgroundColor: primaryLight
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      ]
                }
                loading={archiveLoading}
                disableRowSelectionOnClick
                disableColumnMenu={isCompact}
                disableColumnFilter={isCompact}
                density="compact"
                rowHeight={isPhone ? 36 : isTablet ? 42 : undefined}
                columnHeaderHeight={isPhone ? 34 : isTablet ? 40 : undefined}
                pageSizeOptions={[30, 60, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 30, page: 0 }
                  }
                }}
                localeText={{
                  noRowsLabel: "لا توجد بيانات أرشيفية لهذا المتدرب",
                  MuiTablePagination: {
                    labelRowsPerPage: "عدد الصفوف"
                  }
                }}
                sx={uiLayout.withUiSx({
                  ...gridSx,
                  width: "100%",
                  height: "100%",
                  minWidth: 0,

                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 1000,
                    color: whiteColor,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    whiteSpace: "normal",
                    lineHeight: 1.1
                  },

                  "& .MuiDataGrid-cell": {
                    fontWeight: 800,
                    borderColor: isDarkGrid ? "#67C99D" : "#edf4f1",
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    px: isPhone ? 0.1 : isTablet ? 0.3 : undefined
                  },

                  "& .MuiDataGrid-footerContainer": {
                    direction: "rtl",
                    minHeight: isPhone ? 38 : isTablet ? 42 : undefined,
                    borderTop: isDarkGrid ? "1px solid #67C99D" : undefined
                  },

                  "& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  }
                }, uiLayout.dataGridSx)}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            flexShrink: 0,
            p: isPhone ? 0.3 : isTablet ? 0.45 : 1,
            borderTop: isDarkGrid ? `1px solid #67C99D` : `1px solid ${primaryLight}`
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={() => setArchiveOpen(false)}
            disabled={archiveLoading}
            sx={uiLayout.withUiSx({
              color: accentColor,
              fontWeight: 900,
              minHeight: isPhone ? 28 : isTablet ? 31 : undefined,
              px: isPhone ? 1 : isTablet ? 1.3 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog sx={uiLayout.withUiSx(uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
        open={oldStatementOpen}
        onClose={() => !oldStatementLoading && setOldStatementOpen(false)}
        fullWidth
        maxWidth="xl"
        fullScreen={isPhone}
        PaperProps={{
          sx: {
            height: isPhone ? "100dvh" : isTablet ? "94dvh" : "90vh",
            width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
            borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
            direction: "rtl",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            color: whiteColor,
            direction: "rtl",
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
            py: isPhone ? 0.45 : isTablet ? 0.65 : 1.2,
            px: isPhone ? 0.55 : isTablet ? 0.8 : 2
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography
              sx={{
                fontWeight: 1000,
                color: whiteColor,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.8rem" : "1.15rem"
              }}
            >
              كشف حساب سابق
            </Typography>

            <Tooltip title="تصدير كشف الحساب السابق PDF">
              <span>
                <IconButton
                  onClick={exportOldStatementToPdf}
                  disabled={oldStatementLoading || !oldStatementData}
                  sx={{
                    color: whiteColor,
                    width: isPhone ? 25 : isTablet ? 28 : 36,
                    height: isPhone ? 25 : isTablet ? 28 : 36,
                    p: isCompact ? 0.25 : 0.7,
                    "& svg": {
                      fontSize: isPhone ? 15 : isTablet ? 17 : 21
                    },
                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.45)"
                    }
                  }}
                >
                  <PrintIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            direction: "rtl",
            p: isPhone ? 0.4 : isTablet ? 0.7 : 2
          }}
        >
          {oldStatementLoading ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
              <CircularProgress />
              <Typography sx={{ fontWeight: 900 }}>
                جاري تحميل كشف الحساب السابق...
              </Typography>
            </Stack>
          ) : oldStatementError ? (
            <Alert severity="error" sx={{ fontWeight: 900 }}>
              {oldStatementError}
            </Alert>
          ) : oldStatementData ? (
            <Stack sx={uiLayout.tableContainerSx} spacing={2}>
              <Stack direction="row" spacing={isCompact ? 0.3 : 1} flexWrap="nowrap">
                <SummaryCard
                  label="مدين"
                  value={oldStatementData?.summary?.debit || 0}
                />
                <SummaryCard
                  label="دائن"
                  value={oldStatementData?.summary?.credit || 0}
                />
                <SummaryCard
                  label="الرصيد"
                  value={oldStatementData?.summary?.balance || 0}
                  color={
                    toNumber(oldStatementData?.summary?.balance) > 0
                      ? accentColor
                      : primaryColor
                  }
                />
                <SummaryCard
                  label="افتتاحي مدين"
                  value={oldStatementData?.opening?.debit || 0}
                />
                <SummaryCard
                  label="افتتاحي دائن"
                  value={oldStatementData?.opening?.credit || 0}
                />
              </Stack>

              <Typography sx={{ fontWeight: 1000, color: primaryColor }}>
                استمارات التسجيل
              </Typography>

              <DataGrid
                rows={oldStatementRows(oldStatementData?.registrations || [])}
                columns={isCompact ? compactOldRegistrationColumns.map(compactGridColumn) : oldRegistrationColumns}
                disableRowSelectionOnClick
                autoHeight
                pageSizeOptions={[30, 60, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 30, page: 0 }
                  }
                }}
                sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
              />

              <Typography sx={{ fontWeight: 1000, color: primaryColor }}>
                الحركات النقدية
              </Typography>

              <DataGrid
                rows={oldStatementRows(oldStatementData?.cashMovements || [])}
                columns={isCompact ? compactOldCashColumns.map(compactGridColumn) : oldCashColumns}
                disableRowSelectionOnClick
                autoHeight
                pageSizeOptions={[30, 60, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 30, page: 0 }
                  }
                }}
                sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
              />
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button
            onClick={() => setOldStatementOpen(false)}
            disabled={oldStatementLoading}
            sx={uiLayout.withUiSx({ color: accentColor, fontWeight: 900 }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <RegisterDocumentDialog
        open={registerDocumentOpen}
        onClose={() => {
          setRegisterDocumentOpen(false);
          setSelectedRegisterDocument(null);
        }}
        docGuid={selectedRegisterDocument?.docGuid || ""}
        documentNo={selectedRegisterDocument?.documentNo || ""}
        apiBaseUrl={apiBaseUrl}
      />

      <SalesInvoiceDialog
        open={salesInvoiceOpen}
        onClose={() => {
          setSalesInvoiceOpen(false);
          setSelectedSalesInvoice(null);
        }}
        invoice={selectedSalesInvoice}
        apiBaseUrl={apiBaseUrl}
      />
    </Dialog>
  );
};

export default StudentStatementDialog2