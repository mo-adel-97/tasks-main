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
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";
import SalesInvoiceDialog from "./SalesInvoiceDialog";
import ArchiveIcon from "@mui/icons-material/Archive";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
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
      fontSize: "0.85rem"
    }}
  >
    {money(value)}
  </Typography>
);

const SummaryCard = ({ label, value, color = textColor }) => (
  <Paper
    elevation={0}
    sx={{
      px: 2,
      py: 1.4,
      borderRadius: 3,
      border: `1px solid ${primaryLight}`,
      backgroundColor: whiteColor,
      minWidth: 170,
      textAlign: "center",
      boxShadow: "0 8px 22px rgba(5,117,70,0.08)"
    }}
  >
    <Typography sx={{ fontSize: "0.78rem", color: primaryColor, fontWeight: 900 }}>
      {label}
    </Typography>

    <Typography sx={{ fontSize: "1.25rem", color, fontWeight: 1000 }}>
      {money(value)}
    </Typography>
  </Paper>
);

const EmptyBox = ({ text }) => (
  <Box
    sx={{
      height: 240,
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

const EllipsisText = ({ value, align = "left", direction = "ltr" }) => (
  <Tooltip title={value || ""} arrow>
    <Typography
      sx={{
        width: "100%",
        fontSize: "0.82rem",
        fontWeight: 800,
        color: textColor,
        whiteSpace: "nowrap",
        overflow: "hidden",
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
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [salesInvoiceOpen, setSalesInvoiceOpen] = useState(false);
  const [selectedSalesInvoice, setSelectedSalesInvoice] = useState(null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveRows, setArchiveRows] = useState([]);
  const [archiveError, setArchiveError] = useState("");

  const [oldStatementOpen, setOldStatementOpen] = useState(false);
  const [oldStatementLoading, setOldStatementLoading] = useState(false);
  const [oldStatementData, setOldStatementData] = useState(null);
  const [oldStatementError, setOldStatementError] = useState("");

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

  const oldRegistrationColumns = [
    { field: "date", headerName: "التاريخ", width: 120, align: "center", headerAlign: "center" },
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
      width: 125,
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
        </head>
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
                window.print();
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

  const statementColumns = [
    {
      field: "actions",
      headerName: "العمليات",
      width: 115,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ width: "100%" }}>
          <Tooltip title="عرض المستند">
            <IconButton
              size="small"
              onClick={() => onOpenStatementDocument?.(params.row)}
              sx={{
                color: primaryColor,
                backgroundColor: primaryLight,
                width: 30,
                height: 30,
                "&:hover": { backgroundColor: "#d7f0e5" }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="سجل العمليات">
            <IconButton
              size="small"
              onClick={() => onOpenHistory?.(params.row)}
              sx={{
                color: accentColor,
                backgroundColor: "#fff4f4",
                width: 30,
                height: 30,
                "&:hover": { backgroundColor: "#ffe4e4" }
              }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    },
    {
      field: "date",
      headerName: "التاريخ الميلادي",
      width: 125,
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
      width: 145,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "documentNo",
      headerName: "رقم المستند",
      width: 125,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "maden",
      headerName: "مدين",
      width: 105,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.maden} />
    },
    {
      field: "daen",
      headerName: "دائن",
      width: 105,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.daen} />
    },
    {
      field: "balance",
      headerName: "الرصيد",
      width: 115,
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
      flex: 1,
      minWidth: 360,
      renderCell: (params) => <EllipsisText value={params.value} />
    },
    {
      field: "costCenter",
      headerName: "مركز التكلفة",
      width: 245,
      renderCell: (params) => (
        <EllipsisText value={params.value} align="center" direction="ltr" />
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
          sx={{
            borderRadius: 2,
            fontWeight: 900,
            color: primaryColor,
            borderColor: primaryLight,
            backgroundColor: whiteColor,
            "&:hover": {
              borderColor: primaryColor,
              backgroundColor: "#f0faf5"
            }
          }}
        >
          عرض
        </Button>
      )
    },
    {
      field: "date",
      headerName: "التاريخ الميلادي",
      width: 130,
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
        <EllipsisText value={params.value} align="center" direction="ltr" />
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
          sx={{
            borderRadius: 2,
            fontWeight: 900,
            color: accentColor,
            borderColor: "#f3c6c7",
            backgroundColor: whiteColor,
            "&:hover": {
              borderColor: accentColor,
              backgroundColor: "#fff4f4"
            }
          }}
        >
          عرض
        </Button>
      )
    },
    {
      field: "date",
      headerName: "التاريخ الميلادي",
      width: 130,
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
        <EllipsisText value={params.value} align="center" direction="ltr" />
      )
    }
  ];

  const gridSx = {
    border: `1px solid ${primaryLight}`,
    borderRadius: 3,
    backgroundColor: whiteColor,
    direction: "ltr",
    overflow: "hidden",
    "& .MuiDataGrid-columnHeaders": {
      background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
      color: whiteColor,
      fontWeight: 1000,
      borderBottom: `1px solid ${primaryDark}`
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 1000,
      color: whiteColor
    },
    "& .MuiDataGrid-cell": {
      fontWeight: 800,
      borderColor: "#edf4f1"
    },
    "& .MuiDataGrid-row:nth-of-type(even)": {
      backgroundColor: "#fbfdfc"
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: "#f0faf5"
    },
    "& .MuiDataGrid-footerContainer": {
      direction: "ltr",
      borderTop: `1px solid ${primaryLight}`
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          direction: "ltr",
          height: "92vh",
          border: `1px solid ${primaryLight}`,
          boxShadow: "0 18px 50px rgba(5,117,70,0.18)"
        }
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
          borderBottom: `1px solid ${primaryDark}`,
          py: 1.4,
          color: whiteColor
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography sx={{ fontWeight: 1000, color: whiteColor, fontSize: "1.15rem" }}>
              كشف حساب طالب
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 0.8 }}>
              <Chip
                label={studentName}
                sx={{
                  fontWeight: 900,
                  backgroundColor: whiteColor,
                  color: primaryColor
                }}
              />
              <Chip
                label={nationalId}
                sx={{
                  fontWeight: 900,
                  backgroundColor: whiteColor,
                  color: primaryColor
                }}
              />
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="فتح أرشيف المتدرب">
              <Button
                onClick={openArchive}
                disabled={loading}
                startIcon={<ArchiveIcon />}
                variant="outlined"
                sx={{
                  minWidth: 112,
                  height: 38,
                  px: 1.4,
                  borderRadius: 2.5,
                  color: whiteColor,
                  borderColor: "rgba(255,255,255,0.75)",
                  fontWeight: 950,
                  direction: "ltr",
                  "& .MuiButton-startIcon": {
                    ml: 0.4,
                    mr: 0
                  },
                  "&:hover": {
                    borderColor: whiteColor,
                    backgroundColor: "rgba(255,255,255,0.12)"
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.45)",
                    borderColor: "rgba(255,255,255,0.25)"
                  }
                }}
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
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.45)"
                  }
                }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="تحديث">
              <IconButton onClick={loadStatement} sx={{ color: whiteColor }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="إغلاق">
              <IconButton onClick={onClose} sx={{ color: whiteColor }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2.2, background: `linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)` }}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
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
            p: 1.2,
            mb: 1.5,
            borderRadius: 3,
            border: `1px solid ${primaryLight}`,
            backgroundColor: whiteColor
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
            border: `1px solid ${primaryLight}`,
            backgroundColor: whiteColor,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(5,117,70,0.08)"
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            sx={{
              px: 1,
              borderBottom: `1px solid ${primaryLight}`,
              "& .MuiTab-root": {
                fontWeight: 1000,
                minHeight: 48
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

          <Box sx={{ height: "calc(92vh - 320px)", minHeight: 410, p: 1.2 }}>
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
                  columns={statementColumns}
                  density="compact"
                  disableRowSelectionOnClick
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 25, page: 0 }
                    }
                  }}
                  localeText={{
                    noRowsLabel: "لا توجد بيانات",
                    footerRowSelected: (count) => `${count} صف محدد`,
                    MuiTablePagination: {
                      labelRowsPerPage: "عدد الصفوف"
                    }
                  }}
                  sx={gridSx}
                />
              ) : (
                <EmptyBox text="لا توجد حركات في كشف الحساب" />
              )
            ) : activeTab === 1 ? (
              salesInvoices.length ? (
                <DataGrid
                  rows={salesInvoices}
                  columns={invoiceColumns}
                  density="compact"
                  disableRowSelectionOnClick
                  pageSizeOptions={[25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 25, page: 0 }
                    }
                  }}
                  localeText={{
                    noRowsLabel: "لا توجد بيانات",
                    footerRowSelected: (count) => `${count} صف محدد`,
                    MuiTablePagination: {
                      labelRowsPerPage: "عدد الصفوف"
                    }
                  }}
                  sx={gridSx}
                />
              ) : (
                <EmptyBox text="لا توجد فواتير مبيعات لهذا الطالب" />
              )
            ) : salesReturns.length ? (
              <DataGrid
                rows={salesReturns}
                columns={returnColumns}
                density="compact"
                disableRowSelectionOnClick
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25, page: 0 }
                  }
                }}
                localeText={{
                  noRowsLabel: "لا توجد بيانات",
                  footerRowSelected: (count) => `${count} صف محدد`,
                  MuiTablePagination: {
                    labelRowsPerPage: "عدد الصفوف"
                  }
                }}
                sx={gridSx}
              />
            ) : (
              <EmptyBox text="لا توجد مرتجعات مبيعات لهذا الطالب" />
            )}
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.5,
          borderTop: `1px solid ${primaryLight}`,
          backgroundColor: whiteColor
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            fontWeight: 1000,
            px: 4,
            color: accentColor,
            borderColor: "#f3c6c7",
            backgroundColor: whiteColor,
            "&:hover": {
              borderColor: accentColor,
              backgroundColor: "#fff4f4"
            }
          }}
        >
          إغلاق
        </Button>
      </DialogActions>

      <Dialog
        open={archiveOpen}
        onClose={() => !archiveLoading && setArchiveOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 4,
            direction: "rtl",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 1000,
            color: whiteColor,
            direction:"ltr",
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
          }}
        >
          أرشيف المتدرب
        </DialogTitle>

        <DialogContent dividers sx={{ direction:"ltr" }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Chip label={studentName} sx={{ fontWeight: 900 }} />
            <Chip label={nationalId} sx={{ fontWeight: 900 }} />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadArchiveStudents}
              disabled={archiveLoading}
              sx={{ fontWeight: 900 }}
            >
              تحديث
            </Button>
          </Stack>

          {archiveError ? (
            <Alert severity="error" sx={{ mb: 1.5, fontWeight: 900 }}>
              {archiveError}
            </Alert>
          ) : null}

          {archiveLoading ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 7 }}>
              <CircularProgress />
              <Typography sx={{ fontWeight: 900 }}>
                جاري تحميل أرشيف المتدرب...
              </Typography>
            </Stack>
          ) : (
            <DataGrid
              rows={archiveRows}
              columns={[
                {
                  field: "studentName",
                  headerName: "اسم الطالب",
                  flex: 1,
                  minWidth: 180
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
                  width: 140,
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
              ]}
              loading={archiveLoading}
              disableRowSelectionOnClick
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 }
                }
              }}
              localeText={{
                noRowsLabel: "لا توجد بيانات أرشيفية لهذا المتدرب",
                MuiTablePagination: {
                  labelRowsPerPage: "عدد الصفوف"
                }
              }}
              sx={gridSx}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setArchiveOpen(false)}
            disabled={archiveLoading}
            sx={{ color: accentColor, fontWeight: 900 }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={oldStatementOpen}
        onClose={() => !oldStatementLoading && setOldStatementOpen(false)}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            height: "90vh",
            borderRadius: 4,
            direction: "rtl",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 1000,
            color: whiteColor,
            direction:"ltr",
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
          }}
        >
          كشف حساب سابق
        </DialogTitle>

        <DialogContent dividers sx={{ direction:"ltr"}}>
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
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
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
                columns={oldRegistrationColumns}
                disableRowSelectionOnClick
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 }
                  }
                }}
                sx={gridSx}
              />

              <Typography sx={{ fontWeight: 1000, color: primaryColor }}>
                الحركات النقدية
              </Typography>

              <DataGrid
                rows={oldStatementRows(oldStatementData?.cashMovements || [])}
                columns={oldCashColumns}
                disableRowSelectionOnClick
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 }
                  }
                }}
                sx={gridSx}
              />
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOldStatementOpen(false)}
            disabled={oldStatementLoading}
            sx={{ color: accentColor, fontWeight: 900 }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

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