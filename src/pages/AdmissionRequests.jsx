import React, { useEffect, useMemo, useState } from "react";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tabs,
  Tab,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import Sidebar from "../components/Sidebar";

const SIDEBAR_WIDTH = 280;

const primaryColor = "#80b49e";
const primaryDark = "#6a9a87";
const primaryLight = "#9ac9b5";
const textColor = "#2c3e50";
const softBg = "#f8fbfa";

const API_BASE_URL = "https://api4.sstli.com";
const today = new Date().toISOString().slice(0, 10);

const STATUS_FILTERS = [
  { value: "all", label: "الكل" },
  { value: "confirmed", label: "مؤكد", status: 1 },
  { value: "notConfirmed", label: "غير مؤكد", status: 0 },
  { value: "cancelled", label: "ملغي", status: 2 }
];

const normalizeNumber = (value) => {
  return String(value)
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
};

const toMoneyNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  const normalized = normalizeNumber(value)
    .replace(/,/g, "")
    .replace(/[^0-9.\-]/g, "");

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const pad2 = (num) => String(num).padStart(2, "0");

const formatDateDMY = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const parseDateParts = (value) => {
  if (!value) return null;

  const text = normalizeNumber(String(value).trim());
  const datePart = text.split("T")[0].split(" ")[0];

  let parts = null;

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(datePart)) {
    parts = datePart.split("-");
  } else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(datePart)) {
    parts = datePart.split("/");
  } else {
    return null;
  }

  return {
    year: Number(parts[0]),
    month: Number(parts[1]),
    day: Number(parts[2])
  };
};

const getHijriPartsFromGregorian = (date) => {
  const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });

  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value)
  };
};

const hijriToGregorianDate = (hijriValue) => {
  const hijri = parseDateParts(hijriValue);

  if (!hijri) return null;

  /*
    تحويل تقريبي كبداية للبحث:
    السنة الهجرية 1447 غالباً تقع بين 2025 و 2026.
    بعد كده نبحث حوالين التاريخ لحد ما نلاقي اليوم المطابق
    باستخدام تقويم أم القرى islamic-umalqura.
  */
  const approximateGregorianYear = hijri.year + 579;
  const searchStart = new Date(approximateGregorianYear, 0, 1);

  searchStart.setDate(searchStart.getDate() - 370);

  for (let i = 0; i < 900; i += 1) {
    const currentDate = new Date(searchStart);
    currentDate.setDate(searchStart.getDate() + i);

    const currentHijri = getHijriPartsFromGregorian(currentDate);

    if (
      currentHijri.year === hijri.year &&
      currentHijri.month === hijri.month &&
      currentHijri.day === hijri.day
    ) {
      return currentDate;
    }
  }

  return null;
};

const formatGregorianDate = (value) => {
  if (!value) return "-";

  const text = normalizeNumber(String(value).trim());
  const datePart = text.split("T")[0].split(" ")[0];

  const parts = parseDateParts(datePart);

  if (!parts) return text || "-";

  // لو التاريخ هجري مثل 1447-11-21
  if (String(parts.year).startsWith("14")) {
    const gregorianDate = hijriToGregorianDate(datePart);
    return gregorianDate ? formatDateDMY(gregorianDate) : datePart;
  }

  // لو التاريخ ميلادي yyyy-MM-dd
  const gregorianDate = new Date(parts.year, parts.month - 1, parts.day);
  return formatDateDMY(gregorianDate);
};

const getGregorianOrderDate = (item) => {
  return (
    item?.orderDateGregorian ||
    item?.orderGregorianDate ||
    item?.gregorianOrderDate ||
    item?.orderDateMiladi ||
    item?.miladiOrderDate ||
    item?.createdAt ||
    item?.createDate ||
    item?.createdDate ||
    item?.dateGregorian ||
    item?.gregorianDate ||
    item?.orderDate ||
    ""
  );
};

const showSuccess = (message) => {
  return Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#80b49e"
  });
};

const showError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#d33"
  });
};

const showWarning = (message) => {
  return Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#f57c00"
  });
};

const showConfirm = (message) => {
  return Swal.fire({
    icon: "question",
    title: "تأكيد",
    text: message,
    showCancelButton: true,
    confirmButtonText: "نعم",
    cancelButtonText: "لا",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#80b49e",
    reverseButtons: true
  });
};

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

const getActionTypeGuid = (user) => {
  return (
    user?.regOrderTypeGuid ||
    user?.actionTypeGuid ||
    user?.ActionTypeGuid ||
    ""
  );
};

const USERINFO_API_URL = "https://api1.sstli.com/api/userinfo";

const normalizeGuid = (value) => String(value || "").trim().toLowerCase();

const getOrderSellerGuid = (row, details) => {
  return normalizeGuid(
    details?.header?.sellerGuid ||
      details?.header?.SellerGuid ||
      details?.header?.raw?.SellerGuid ||
      row?.sellerGuid ||
      row?.SellerGuid ||
      row?.salesManGuid ||
      row?.SalesManGuid ||
      ""
  );
};

const getUserGuidBySellerGuid = async (sellerGuid) => {
  const cleanSellerGuid = normalizeGuid(sellerGuid);

  if (!cleanSellerGuid) {
    throw new Error("لا يمكن قراءة SellerGuid الخاص بمسئول التسجيل من الطلب");
  }

  const response = await fetch(USERINFO_API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  const users = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error("تعذر تحميل بيانات المستخدمين من userinfo");
  }

  const list = Array.isArray(users)
    ? users
    : Array.isArray(users?.data)
    ? users.data
    : [];

  const matchedUser = list.find(
    (u) => normalizeGuid(u?.sellerGuid) === cleanSellerGuid
  );

  if (!matchedUser?.guid) {
    throw new Error("لم يتم العثور على UserGuid مطابق لـ SellerGuid مسئول التسجيل");
  }

  return normalizeGuid(matchedUser.guid);
};

const DetailItem = ({ label, value, strong = false }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 2,
      border: "1px solid #e4eeea",
      backgroundColor: "#fcfdfd",
      height: "100%"
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: "#6f8a81",
        fontWeight: 900,
        display: "block",
        mb: 0.4
      }}
    >
      {label}
    </Typography>

    <Typography
      variant="body2"
      sx={{
        color: strong ? "#d32f2f" : textColor,
        fontWeight: 900,
        lineHeight: 1.6,
        wordBreak: "break-word",
        fontSize: strong ? "1rem" : "0.9rem"
      }}
    >
      {value || "-"}
    </Typography>
  </Paper>
);

const EllipsisCell = ({ value }) => (
  <Tooltip title={value || ""} arrow>
    <Typography
      sx={{
        width: "100%",
        fontSize: "0.82rem",
        fontWeight: 800,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textAlign: "center"
      }}
    >
      {value || "-"}
    </Typography>
  </Tooltip>
);

const SmallDataTable = ({ title, rows, emptyText = "لا توجد بيانات" }) => (
  <Paper
    elevation={0}
    sx={{
      border: "1px solid #d7e8e0",
      borderRadius: 2,
      overflow: "hidden",
      height: "100%"
    }}
  >
    <Box
      sx={{
        px: 1.5,
        py: 1,
        background: "linear-gradient(135deg, #eef7f3 0%, #ffffff 100%)",
        borderBottom: "1px solid #d7e8e0"
      }}
    >
      <Typography sx={{ fontWeight: 900, color: textColor }}>
        {title}
      </Typography>
    </Box>

    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell align="center" sx={{ fontWeight: 900 }}>
            البيان
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 900 }}>
            التكلفة
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 900 }}>
            الضريبة
          </TableCell>
          <TableCell align="center" sx={{ fontWeight: 900 }}>
            الصافي
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {Array.isArray(rows) && rows.length > 0 ? (
          rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                {row?.name || "-"}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                {row?.cost || "0"}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                {row?.tax || "0"}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 900 }}>
                {row?.subTotal || "0"}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#789" }}>
              {emptyText}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Paper>
);

const AdmissionRequests = () => {
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rowToCancel, setRowToCancel] = useState(null);

  const [convertOpen, setConvertOpen] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertRow, setConvertRow] = useState(null);
  const [convertDetails, setConvertDetails] = useState(null);
  const [convertSalesNotes, setConvertSalesNotes] = useState("");
  const [convertPayFees, setConvertPayFees] = useState(false);

  // ✅ جديد: مسجل في معهد آخر
const [convertRegisteredInOtherInstitute, setConvertRegisteredInOtherInstitute] = useState(false);
const [convertOtherInstituteName, setConvertOtherInstituteName] = useState("");

  const [statementOpen, setStatementOpen] = useState(false);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementRow, setStatementRow] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [statementSearch, setStatementSearch] = useState("");

  const handleShowStudentStatement = async (row, searchValue = "") => {
    if (!row?.accountGuid) {
      showWarning("لا يمكن قراءة حساب الطالب");
      return;
    }

    try {
      setStatementRow(row);
      setStatementOpen(true);
      setStatementLoading(true);
      setStatementData(null);

      const url =
        `${API_BASE_URL}/api/admission-requests/student-statement` +
        `?accountGuid=${encodeURIComponent(row.accountGuid)}` +
        `&studentName=${encodeURIComponent(row.studentName || "")}` +
        `&nationalId=${encodeURIComponent(row.nationalId || "")}` +
        `&notes=${encodeURIComponent(searchValue || "")}`;

      const response = await fetch(url);

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحميل كشف الحساب");
      }

      setStatementData(result);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل كشف الحساب");
      setStatementOpen(false);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleCloseStudentStatement = () => {
    setStatementOpen(false);
    setStatementLoading(false);
    setStatementRow(null);
    setStatementData(null);
    setStatementSearch("");
  };

  const handleSearchStudentStatement = () => {
    if (!statementRow) return;
    handleShowStudentStatement(statementRow, statementSearch);
  };

  const fetchAdmissionRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const url = `${API_BASE_URL}/api/admission-requests?fromDate=${encodeURIComponent(
        fromDate
      )}&toDate=${encodeURIComponent(toDate)}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "فشل تحميل البيانات");
      }

      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];

      setRows(
        data.map((item, index) => ({
          ...item,
          serial: index + 1,
          id: item.id || item.orderGuid || item.code || index + 1,
          orderDateGregorianDisplay: formatGregorianDate(getGregorianOrderDate(item))
        }))
      );
    } catch (error) {
      const msg = error.message || "حدث خطأ غير متوقع";
      setErrorMsg(msg);
      showError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissionRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;

    const selected = STATUS_FILTERS.find((item) => item.value === statusFilter);

    if (!selected || selected.status === undefined) return rows;

    return rows.filter((row) => Number(row?.status) === Number(selected.status));
  }, [rows, statusFilter]);

  const getStatusCount = (filterValue) => {
    if (filterValue === "all") return rows.length;

    const selected = STATUS_FILTERS.find((item) => item.value === filterValue);

    if (!selected || selected.status === undefined) return 0;

    return rows.filter((row) => Number(row?.status) === Number(selected.status)).length;
  };

  const handleCloseDetails = () => {
    setSelectedRow(null);
    setOrderDetails(null);
    setDetailsOpen(false);
  };

  const handleShowOrder = async (row) => {
    if (!row?.code) {
      showWarning("لا يمكن قراءة رقم الطلب");
      return;
    }

    try {
      setSelectedRow(row);
      setOrderDetails(null);
      setDetailsOpen(true);
      setDetailsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admission-requests/details?code=${encodeURIComponent(
          row.code
        )}&orderGuid=${encodeURIComponent(row.orderGuid || "")}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "تعذر تحميل تفاصيل الطلب");
      }

      const result = await response.json();
      setOrderDetails(result);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل تفاصيل الطلب");
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleShowAttachments = async (row) => {
    if (!row?.nationalId) {
      showWarning("لا يوجد رقم هوية لهذا الطالب");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admission-requests/attachments-url?nationalId=${encodeURIComponent(
          row.nationalId
        )}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "تعذر فتح المرفقات");
      }

      const result = await response.json();

      if (!result?.url) {
        showWarning("لم يتم العثور على رابط المرفقات");
        return;
      }

      const width = 1200;
const height = 800;
const left = window.screenX + (window.outerWidth - width) / 2;
const top = window.screenY + (window.outerHeight - height) / 2;

window.open(
  result.url,
  "attachmentsWindow",
  `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,noopener,noreferrer`
);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء فتح المرفقات");
    }
  };

  const handleConvertToRegForm = async (row) => {
    if (!row?.orderGuid) {
      showWarning("لا يمكن قراءة رقم الطلب");
      return;
    }

    if (!row?.isUse) {
      showWarning("الطلب غير نشط لا يمكن تحويله");
      return;
    }

    if (Number(row?.status) === 1) {
      showWarning("تم تحويل الطلب إلى استمارة بالفعل");
      return;
    }

    if (Number(row?.status) === 2) {
      showWarning("الطلب ملغي لا يمكن تحويله");
      return;
    }

    if (Number(row?.status) !== 0) {
      showWarning("لا يمكن تحويل هذا الطلب حسب حالته الحالية");
      return;
    }

    try {
      setConvertRow(row);
      setConvertDetails(null);
      setConvertSalesNotes("");
      setConvertPayFees(false);

      // ✅ جديد
       setConvertRegisteredInOtherInstitute(false);
       setConvertOtherInstituteName("");

      setConvertOpen(true);
      setConvertLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admission-requests/details?code=${encodeURIComponent(
          row.code
        )}&orderGuid=${encodeURIComponent(row.orderGuid || "")}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "تعذر تحميل بيانات التحويل");
      }

      const result = await response.json();
      setConvertDetails(result);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل بيانات التحويل");
      setConvertOpen(false);
    } finally {
      setConvertLoading(false);
    }
  };

const handleCloseConvert = () => {
  if (convertLoading) return;

  setConvertOpen(false);
  setConvertRow(null);
  setConvertDetails(null);
  setConvertSalesNotes("");
  setConvertPayFees(false);

  // ✅ جديد
  setConvertRegisteredInOtherInstitute(false);
  setConvertOtherInstituteName("");
};

  const handleConfirmConvert = async () => {
    if (!convertRow?.orderGuid) {
      showWarning("لا يمكن قراءة رقم الطلب");
      return;
    }

  const currentUser = getCurrentUser();
const currentUserGuid = getUserGuid(currentUser);

if (!currentUserGuid) {
  showWarning("لا يمكن قراءة المستخدم الحالي");
  return;
}

const orderSellerGuid = getOrderSellerGuid(convertRow, convertDetails);

if (!orderSellerGuid) {
  showWarning("لا يمكن قراءة SellerGuid الخاص بمسئول التسجيل من الطلب");
  return;
}

    const paidAmount = toMoneyNumber(convertDetails?.header?.paidAmount);
    const diplomSubTotal = Array.isArray(convertDetails?.diplomas)
      ? convertDetails.diplomas.reduce(
          (total, item) => total + toMoneyNumber(item?.subTotal),
          0
        )
      : 0;

    if (paidAmount > diplomSubTotal && !convertPayFees) {
      showWarning("المبلغ المدفوع أكبر من قيمة الدورة، يجب تحديد أن السداد يتضمن الرسوم");
      return;
    }

    if (convertRegisteredInOtherInstitute && !convertOtherInstituteName.trim()) {
  showWarning("برجاء كتابة اسم المعهد الآخر أو الملاحظة");
  return;
}
    const confirmResult = await Swal.fire({
      icon: "question",
      title: "تأكيد التحويل",
      text: `هل تريد تحويل الطلب رقم ${convertRow?.code || ""} إلى استمارة تسجيل؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، تحويل",
      cancelButtonText: "تراجع",
      confirmButtonColor: "#80b49e",
      cancelButtonColor: "#d33",
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setConvertLoading(true);

const responsibleUserGuid = convertRegisteredInOtherInstitute
  ? await getUserGuidBySellerGuid(orderSellerGuid)
  : "";

      Swal.fire({
        title: "جاري تحويل الطلب...",
        text: "برجاء الانتظار",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/admission-requests/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  orderGuid: convertRow.orderGuid,
  orderCode: String(convertRow.code || ""),

  // ✅ ده المستخدم الحالي اللي ضغط تأكيد التحويل
  userGuid: currentUserGuid,

  // ✅ ده اليوزر الحالي اللي ضغط تأكيد التحويل، للمتابعة والتسجيل فقط
  actionUserGuid: currentUserGuid,

  // ده SellerGuid الأصلي الراجع من تفاصيل الطلب
  sellerGuid: orderSellerGuid,

  salesNotes: convertSalesNotes,
  payFees: convertPayFees,

  registeredInOtherInstitute: convertRegisteredInOtherInstitute,
  otherInstituteName: convertRegisteredInOtherInstitute
    ? convertOtherInstituteName.trim()
    : "",

  // مهم لو الباك إند عايز يستخدمه مخصوص في جدول المعاهد الأخرى
  otherInstituteUserGuid: convertRegisteredInOtherInstitute
    ? responsibleUserGuid
    : ""
})
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحويل الطلب إلى استمارة");
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "تم التحويل بنجاح",
        html: `
          <div style="font-weight:bold; line-height:2">
            تم تحويل الطلب إلى استمارة تسجيل<br/>
            رقم الاستمارة: ${result?.regDocCode || "-"}<br/>
            ${result?.smsCreated ? "تم إنشاء رسالة SMS للطالب" : "لم يتم إنشاء SMS لهذا الطلب"}
          </div>
        `,
        confirmButtonText: "حسناً",
        confirmButtonColor: "#80b49e"
      });

      handleCloseConvert();
      fetchAdmissionRequests();
    } catch (error) {
      Swal.close();
      showError(error.message || "حدث خطأ أثناء تحويل الطلب");
    } finally {
      setConvertLoading(false);
    }
  };

  const handleOpenCancel = (row) => {
    if (!row?.orderGuid) {
      showWarning("لا يمكن قراءة رقم الطلب");
      return;
    }

    if (!row?.isUse) {
      showWarning("الطلب غير نشط لا يمكن إلغائه");
      return;
    }

    if (Number(row?.status) === 1) {
      showWarning("الطلب مؤكد لا يمكن إلغائه");
      return;
    }

    if (Number(row?.status) !== 0) {
      showWarning("لا يمكن إلغاء هذا الطلب حسب حالته الحالية");
      return;
    }

    setRowToCancel(row);
    setCancelReason("");
    setCancelOpen(true);
  };

  const handleCloseCancel = () => {
    setRowToCancel(null);
    setCancelReason("");
    setCancelOpen(false);
  };

  const handleConfirmCancel = async () => {
    if (!rowToCancel?.orderGuid) {
      showWarning("لا يمكن قراءة رقم الطلب");
      return;
    }

    if (!cancelReason.trim()) {
      showWarning("اكتب سبب الإلغاء أولاً");
      return;
    }

    const confirmResult = await showConfirm(
      `هل تريد إلغاء الطلب رقم ${rowToCancel?.code || ""}؟`
    );

    if (!confirmResult.isConfirmed) return;

    try {
      setCancelLoading(true);

      Swal.fire({
        title: "جاري إلغاء الطلب...",
        text: "برجاء الانتظار",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const user = getCurrentUser();

      const response = await fetch(`${API_BASE_URL}/api/admission-requests/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderGuid: rowToCancel.orderGuid,
          orderCode: String(rowToCancel.code || ""),
          reason: cancelReason.trim(),
          isUse: Boolean(rowToCancel.isUse),
          status: Number(rowToCancel.status),

          userGuid: getUserGuid(user),
          actionTypeGuid: getActionTypeGuid(user)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || "تعذر إلغاء الطلب");
      }

      Swal.close();

      await showSuccess("تم إلغاء الطلب بنجاح");

      handleCloseCancel();
      fetchAdmissionRequests();
    } catch (error) {
      Swal.close();
      showError(error.message || "حدث خطأ أثناء إلغاء الطلب");
    } finally {
      setCancelLoading(false);
    }
  };

  const getOrderStatusChip = (value, status) => {
    const numericStatus = Number(status);
    const text = value || "";

    if (numericStatus === 2 || text.includes("ملغي") || text.includes("إلغاء")) {
      return (
        <Chip
          label={text || "ملغي"}
          size="small"
          sx={{
            fontWeight: "bold",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "10px"
          }}
        />
      );
    }

    if (numericStatus === 0 || text.includes("غير مؤكد")) {
      return (
        <Chip
          label={text || "غير مؤكد"}
          size="small"
          sx={{
            fontWeight: "bold",
            backgroundColor: "#fff3e0",
            color: "#ef6c00",
            borderRadius: "10px"
          }}
        />
      );
    }

    if (numericStatus === 1 || text === "مؤكد") {
      return (
        <Chip
          label={text || "مؤكد"}
          size="small"
          sx={{
            fontWeight: "bold",
            backgroundColor: "#e8f5e9",
            color: "#2e7d32",
            borderRadius: "10px"
          }}
        />
      );
    }

    return (
      <Chip
        label={text || "غير محدد"}
        size="small"
        sx={{
          fontWeight: "bold",
          backgroundColor: "#eeeeee",
          color: "#424242",
          borderRadius: "10px"
        }}
      />
    );
  };

  const getActiveChip = (value) => {
    const text = value || "";

    if (text.includes("نشط")) {
      return (
        <Chip
          label={text}
          size="small"
          sx={{
            fontWeight: "bold",
            backgroundColor: "#e8f5e9",
            color: "#2e7d32",
            borderRadius: "10px"
          }}
        />
      );
    }

    return (
      <Chip
        label={text || "غير محدد"}
        size="small"
        sx={{
          fontWeight: "bold",
          backgroundColor: "#eeeeee",
          color: "#424242",
          borderRadius: "10px"
        }}
      />
    );
  };

  const columns = useMemo(
    () => [
      {
        field: "code",
        headerName: "رقم الطلب",
        flex: 0.65,
        minWidth: 75,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "orderDateGregorianDisplay",
        headerName: "تاريخ الطلب",
        flex: 0.85,
        minWidth: 105,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 900, fontSize: "0.82rem" }}>
            {params.value || "-"}
          </Typography>
        )
      },
      {
        field: "typeReg",
        headerName: "نوع التسجيل",
        flex: 0.7,
        minWidth: 80,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "typeStudy",
        headerName: "نوع الدراسة",
        flex: 0.7,
        minWidth: 80,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "branchName",
        headerName: "الفرع",
        flex: 1.25,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.value} />
      },
     {
  field: "studentName",
  headerName: "اسم الطالب",
  flex: 1.2,
  minWidth: 120,
  align: "center",
  headerAlign: "center",
  renderCell: (params) => <EllipsisCell value={params.value} />
},
{
  field: "nationalId",
  headerName: "رقم الهوية",
  flex: 0.95,
  minWidth: 105,
  align: "center",
  headerAlign: "center",
  renderCell: (params) => (
    <Typography sx={{ fontWeight: 900, fontSize: "0.82rem" }}>
      {params.value || "-"}
    </Typography>
  )
},
{
  field: "salesManName",
  headerName: "مسئول التسجيل",
  flex: 0.95,
  minWidth: 105,
  align: "center",
  headerAlign: "center",
  renderCell: (params) => <EllipsisCell value={params.value} />
},
      {
        field: "registerStatusText",
        headerName: "حالة التسجيل",
        flex: 0.85,
        minWidth: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => getOrderStatusChip(params.value, params.row?.status)
      },
      {
        field: "orderStatusText",
        headerName: "حالة الطلب",
        flex: 0.75,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => getActiveChip(params.value)
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        flex: 1.35,
        minWidth: 190,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Stack
            direction="row"
            spacing={0.4}
            justifyContent="center"
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <Tooltip title="عرض الطلب" arrow>
              <IconButton
                size="small"
                onClick={() => handleShowOrder(params.row)}
                sx={{
                  color: primaryDark,
                  backgroundColor: "#eef7f3",
                  "&:hover": {
                    backgroundColor: "#dcefe7"
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="عرض المرفقات" arrow>
              <IconButton
                size="small"
                onClick={() => handleShowAttachments(params.row)}
                sx={{
                  color: "#1976d2",
                  backgroundColor: "#eaf3ff",
                  "&:hover": {
                    backgroundColor: "#d7eaff"
                  }
                }}
              >
                <FolderOpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="تحويل لاستمارة" arrow>
              <IconButton
                size="small"
                onClick={() => handleConvertToRegForm(params.row)}
                sx={{
                  color: "#ef6c00",
                  backgroundColor: "#fff3e0",
                  "&:hover": {
                    backgroundColor: "#ffe0b2"
                  }
                }}
              >
                <AssignmentTurnedInIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="إلغاء الطلب" arrow>
              <IconButton
                size="small"
                onClick={() => handleOpenCancel(params.row)}
                sx={{
                  color: "#c62828",
                  backgroundColor: "#ffebee",
                  "&:hover": {
                    backgroundColor: "#ffcdd2"
                  }
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="كشف حساب" arrow>
              <IconButton
                size="small"
                onClick={() => handleShowStudentStatement(params.row)}
                sx={{
                  color: "#6a1b9a",
                  backgroundColor: "#f3e5f5",
                  "&:hover": {
                    backgroundColor: "#e1bee7"
                  }
                }}
              >
                <AccountBalanceWalletIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ],
    []
  );

  const handleExportCsv = () => {
    const headers = [
      "رقم الطلب",
      "تاريخ الطلب",
      "نوع التسجيل",
      "نوع الدراسة",
      "الفرع",
      "اسم الطالب",
      "رقم الجوال",
      "رقم الهوية",
      "مسئول التسجيل",
      "الدبلوم/الدورة",
      "الدفعة",
      "حالة التسجيل",
      "حالة الطلب"
    ];

    const csvRows = filteredRows.map((row) => [
      row.code,
      row.orderDateGregorianDisplay,
      row.typeReg,
      row.typeStudy,
      row.branchName,
      row.studentName,
      row.studentTel,
      row.nationalId,
      row.salesManName,
      row.diplomName,
      row.batchName,
      row.registerStatusText,
      row.orderStatusText
    ]);

    const csvContent = [headers, ...csvRows]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `طلبات الالتحاق ${fromDate} - ${toDate}.csv`;
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const header = orderDetails?.header || {};
  const diplomas = orderDetails?.diplomas || [];
  const fees = orderDetails?.fees || [];
  const packageCourses = orderDetails?.packageCourses || [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: softBg,
        fontFamily: "Cairo, Arial, sans-serif",
        direction: "ltr",
        overflowX: "hidden"
      }}
    >
      <Sidebar />

      <Box
        sx={{
          p: { xs: 1.5, md: 2.5 },
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          width: { xs: "100%", md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minHeight: "100vh",
          boxSizing: "border-box",
          overflowX: "hidden"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 2 },
            mb: 2,
            borderRadius: 3,
            border: `1px solid ${primaryLight}`,
            background: "linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%)"
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
            spacing={2}
          >
            <Box sx={{ minWidth: 200 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: textColor,
                  mb: 0.5,
                  fontSize: { xs: "1.35rem", md: "1.8rem" }
                }}
              >
                طلبات الالتحاق
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#607d73",
                  fontWeight: 800,
                  fontSize: "0.95rem"
                }}
              >
                عرض طلبات الالتحاق حسب الفترة المحددة
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              alignItems="center"
              useFlexGap
              flexWrap="wrap"
              sx={{ justifyContent: "flex-start" }}
            >
              <TextField
                label="الفترة من"
                type="date"
                size="small"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 165,
                  "& input": {
                    textAlign: "center",
                    fontWeight: 800
                  }
                }}
              />

              <TextField
                label="الفترة إلى"
                type="date"
                size="small"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 165,
                  "& input": {
                    textAlign: "center",
                    fontWeight: 800
                  }
                }}
              />

              <Button
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SearchIcon />
                  )
                }
                onClick={fetchAdmissionRequests}
                disabled={loading}
                sx={{
                  minWidth: 110,
                  height: 40,
                  fontWeight: "bold",
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                  boxShadow: "0 4px 10px rgba(128, 180, 158, 0.25)",
                  "&:hover": {
                    background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
                  }
                }}
              >
                عرض
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchAdmissionRequests}
                disabled={loading}
                sx={{
                  minWidth: 110,
                  height: 40,
                  fontWeight: "bold",
                  borderRadius: 2,
                  color: primaryDark,
                  borderColor: primaryColor,
                  "&:hover": {
                    borderColor: primaryDark,
                    backgroundColor: "#f4faf7"
                  }
                }}
              >
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportCsv}
                disabled={filteredRows.length === 0}
                sx={{
                  minWidth: 110,
                  height: 40,
                  fontWeight: "bold",
                  borderRadius: 2,
                  color: "#2e7d32",
                  borderColor: "#8fc9a5",
                  "&:hover": {
                    borderColor: "#2e7d32",
                    backgroundColor: "#f2fbf4"
                  }
                }}
              >
                تصدير
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 3,
            border: "1px solid #d7e8e0",
            background: "linear-gradient(135deg, #ffffff 0%, #fbfdfc 100%)"
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography sx={{ fontWeight: 900, color: textColor, mb: 0.3 }}>
                فلتر حالة الطلب
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#6f8a81", fontSize: "0.85rem" }}>
                اختر حالة الطلب لعرض النتائج المطلوبة فقط
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
            >
              {STATUS_FILTERS.map((item) => {
                const active = statusFilter === item.value;

                return (
                  <Button
                    key={item.value}
                    variant={active ? "contained" : "outlined"}
                    onClick={() => setStatusFilter(item.value)}
                    sx={{
                      borderRadius: 999,
                      px: 2,
                      minWidth: 105,
                      height: 38,
                      fontWeight: 900,
                      color: active ? "#fff" : primaryDark,
                      borderColor: primaryLight,
                      background: active
                        ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`
                        : "#fff",
                      "&:hover": {
                        borderColor: primaryDark,
                        background: active
                          ? `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
                          : "#f4faf7"
                      }
                    }}
                  >
                    {item.label}
                    <Box
                      component="span"
                      sx={{
                        ml: 0.8,
                        px: 0.8,
                        py: 0.1,
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        backgroundColor: active
                          ? "rgba(255,255,255,0.22)"
                          : "#eef7f3",
                        color: active ? "#fff" : primaryDark
                      }}
                    >
                      {getStatusCount(item.value)}
                    </Box>
                  </Button>
                );
              })}
            </Stack>
          </Stack>
        </Paper>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 800 }}>
            {errorMsg}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${primaryLight}`,
            backgroundColor: "#fff"
          }}
        >
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              disableColumnMenu
              rowHeight={54}
              columnHeaderHeight={54}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 25,
                    page: 0
                  }
                }
              }}
              localeText={{
                noRowsLabel: "لا توجد بيانات",
                noResultsOverlayLabel: "لا توجد نتائج",
                columnMenuSortAsc: "ترتيب تصاعدي",
                columnMenuSortDesc: "ترتيب تنازلي",
                columnMenuFilter: "تصفية",
                columnMenuHideColumn: "إخفاء العمود",
                columnMenuManageColumns: "إدارة الأعمدة",
                footerRowSelected: (count) => `${count} صف محدد`,
                footerTotalRows: "إجمالي الصفوف"
              }}
              sx={{
                border: "none",
                fontFamily: "Cairo, Arial, sans-serif",
                direction: "ltr",

                "& .MuiDataGrid-main": {
                  overflow: "hidden"
                },

                "& .MuiDataGrid-virtualScroller": {
                  overflowX: "hidden !important"
                },

                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#edf4f1",
                  color: textColor,
                  fontWeight: "bold",
                  borderBottom: `1px solid ${primaryLight}`
                },

                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 900,
                  fontSize: "0.82rem",
                  textAlign: "center",
                  width: "100%"
                },

                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #edf2ef",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  outline: "none !important",
                  px: 0.4
                },

                "& .MuiDataGrid-row:nth-of-type(even)": {
                  backgroundColor: "#fcf8f2"
                },

                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#eef7f3 !important"
                },

                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: "#fafdfb",
                  borderTop: `1px solid ${primaryLight}`
                },

                "& .MuiTablePagination-root": {
                  fontWeight: 800
                },

                "& .MuiDataGrid-columnSeparator": {
                  display: "none"
                }
              }}
            />
          </Box>
        </Paper>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
          <Paper
            elevation={0}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: 2,
              border: `1px solid ${primaryLight}`,
              fontWeight: "bold",
              color: textColor,
              backgroundColor: "#f9fcfb"
            }}
          >
            العدد: {filteredRows.length}
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #f8fbfa 0%, #eef7f3 100%)",
            borderBottom: "1px solid #e4eeea",
            py: 1.5
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 900, fontSize: "1.25rem", color: textColor }}>
              عرض طلب الالتحاق
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FolderOpenIcon />}
                onClick={() => selectedRow && handleShowAttachments(selectedRow)}
                sx={{ fontWeight: 800, borderRadius: 2 }}
              >
                المرفقات
              </Button>

              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => selectedRow && handleOpenCancel(selectedRow)}
                sx={{ fontWeight: 800, borderRadius: 2 }}
              >
                إلغاء الطلب
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, backgroundColor: "#ffffff" }}>
          {detailsLoading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {Number(selectedRow?.status) === 2 && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    fontWeight: 900,
                    borderRadius: 2
                  }}
                >
                  <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                    هذا الطلب ملغي
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }}>
                    ملاحظة الإلغاء: {header.cancelNote || "لا توجد ملاحظة مسجلة"}
                  </Typography>
                </Alert>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #d7e8e0",
                  mb: 2,
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: primaryDark,
                    mb: 1.5,
                    fontSize: "1.05rem"
                  }}
                >
                  البيانات الأساسية
                </Typography>

                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="كود" value={header.code || selectedRow?.code} />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="تاريخ الطلب"
                      value={
                        selectedRow?.orderDateGregorianDisplay ||
                        formatGregorianDate(getGregorianOrderDate(header))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="اسم الطالب"
                      value={header.studentName || selectedRow?.studentName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="رقم الهوية"
                      value={header.nationalId || selectedRow?.nationalId}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="رقم الجوال"
                      value={header.studentTel || selectedRow?.studentTel}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="نوع التسجيل"
                      value={header.regTypeText || selectedRow?.typeReg}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="نوع الدراسة"
                      value={header.studyTypeText || selectedRow?.typeStudy}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="فرع الدراسة"
                      value={header.branchName || selectedRow?.branchName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="الدفعة" value={header.batchName || selectedRow?.batchName} />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="مسئول التسجيل"
                      value={selectedRow?.salesManName || header.sellerName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="منصة التعارف"
                      value={header.platformText || header.platformValue}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={6}>
                    <DetailItem label="ملاحظات" value={header.notes} />
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <SmallDataTable title="الدبلوم / الدورة" rows={diplomas} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SmallDataTable title="الرسوم" rows={fees} />
                </Grid>
              </Grid>

              {Array.isArray(packageCourses) && packageCourses.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    border: "1px solid #d7e8e0",
                    overflow: "hidden"
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      background: "linear-gradient(135deg, #eef7f3 0%, #ffffff 100%)",
                      borderBottom: "1px solid #d7e8e0"
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, color: textColor }}>
                      تفاصيل الباكدج
                    </Typography>
                  </Box>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          الكود
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          البيان
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {packageCourses.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell align="center" sx={{ fontWeight: 800 }}>
                            {row?.code || "-"}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800 }}>
                            {row?.name || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #d7e8e0",
                  mt: 2,
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: primaryDark,
                    mb: 1.5,
                    fontSize: "1.05rem"
                  }}
                >
                  البيانات المالية
                </Typography>

                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="الإجمالي" value={header.total} strong />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="الضريبة" value={header.tax} strong />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="الصافي" value={header.subTotal} strong />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="المدفوع" value={header.paidAmount} strong />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="نوع السداد"
                      value={header.payTypeText || header.payTypeValue}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="الخزينة / الصندوق" value={header.cashBoxName} />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="البنك" value={header.bankName} />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="رقم المرجع" value={header.refNumber} />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="تاريخ الحوالة"
                      value={formatGregorianDate(header.transferDate)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="رقم جهاز الشبكة" value={header.deviceId} />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #e4eeea",
            backgroundColor: "#fafdfb"
          }}
        >
          <Button
            onClick={handleCloseDetails}
            variant="contained"
            startIcon={<CloseIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
              }
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onClose={cancelLoading ? undefined : handleCloseCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            background: "#ffebee",
            borderBottom: "1px solid #ffcdd2"
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "#c62828" }}>
            إلغاء الطلب
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Alert severity="warning" sx={{ mb: 2, fontWeight: 800 }}>
            سيتم إلغاء الطلب رقم {rowToCancel?.code}. برجاء كتابة سبب الإلغاء.
          </Alert>

          <TextField
            label="سبب الإلغاء"
            multiline
            minRows={4}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={cancelLoading}
            sx={{
              "& textarea": {
                fontWeight: 700
              }
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #eee"
          }}
        >
          <Button
            onClick={handleCloseCancel}
            disabled={cancelLoading}
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 800
            }}
          >
            تراجع
          </Button>

          <Button
            onClick={handleConfirmCancel}
            disabled={cancelLoading}
            variant="contained"
            color="error"
            startIcon={
              cancelLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteOutlineIcon />
              )
            }
            sx={{
              borderRadius: 2,
              fontWeight: 900
            }}
          >
            تأكيد الإلغاء
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={convertOpen}
        onClose={convertLoading ? undefined : handleCloseConvert}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #f8fbfa 0%, #eef7f3 100%)",
            borderBottom: "1px solid #e4eeea",
            py: 1.5
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 900, fontSize: "1.25rem", color: textColor }}>
              تحويل الطلب إلى استمارة تسجيل
            </Typography>

            <Chip
              label={`طلب رقم: ${convertRow?.code || "-"}`}
              sx={{
                fontWeight: 900,
                backgroundColor: "#e8f5e9",
                color: "#2e7d32"
              }}
            />
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, backgroundColor: "#ffffff" }}>
          {convertLoading && !convertDetails ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2, fontWeight: 800, borderRadius: 2 }}>
                راجع بيانات الطلب قبل تأكيد التحويل. عند التأكيد سيتم إنشاء استمارة تسجيل وسند السداد وربط الطلب بالاستمارة.
              </Alert>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #d7e8e0",
                  mb: 2,
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: primaryDark,
                    mb: 1.5,
                    fontSize: "1.05rem"
                  }}
                >
                  البيانات الأساسية
                </Typography>

                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="اسم الطالب"
                      value={convertDetails?.header?.studentName || convertRow?.studentName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="رقم الهوية"
                      value={convertDetails?.header?.nationalId || convertRow?.nationalId}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="رقم الجوال"
                      value={convertDetails?.header?.studentTel || convertRow?.studentTel}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="مسئول التسجيل"
                      value={convertRow?.salesManName || convertDetails?.header?.sellerName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="نوع التسجيل"
                      value={convertDetails?.header?.regTypeText || convertRow?.typeReg}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="نوع الدراسة"
                      value={convertDetails?.header?.studyTypeText || convertRow?.typeStudy}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="فرع الدراسة"
                      value={convertDetails?.header?.branchName || convertRow?.branchName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="الدفعة"
                      value={convertDetails?.header?.batchName || convertRow?.batchName}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <SmallDataTable
                    title="الدبلوم / الدورة"
                    rows={convertDetails?.diplomas || []}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <SmallDataTable
                    title="الرسوم"
                    rows={convertDetails?.fees || []}
                  />
                </Grid>
              </Grid>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #d7e8e0",
                  mt: 2,
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: primaryDark,
                    mb: 1.5,
                    fontSize: "1.05rem"
                  }}
                >
                  بيانات السداد
                </Typography>

                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="الإجمالي"
                      value={convertDetails?.header?.total}
                      strong
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="الضريبة"
                      value={convertDetails?.header?.tax}
                      strong
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="الصافي"
                      value={convertDetails?.header?.subTotal}
                      strong
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="المدفوع"
                      value={convertDetails?.header?.paidAmount}
                      strong
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="نوع السداد"
                      value={
                        convertDetails?.header?.payTypeText ||
                        convertDetails?.header?.payTypeValue
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="الخزينة / الصندوق"
                      value={convertDetails?.header?.cashBoxName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="البنك"
                      value={convertDetails?.header?.bankName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="رقم المرجع"
                      value={convertDetails?.header?.refNumber}
                    />
                  </Grid>
                </Grid>

               <Box
  sx={{
    mt: 2,
    p: 1.5,
    borderRadius: 2,
    border: "1px solid #e4eeea",
    backgroundColor: "#fbfdfc"
  }}
>
  <Stack spacing={1.2}>
    <FormControlLabel
      control={
        <Checkbox
          checked={convertPayFees}
          onChange={(e) => setConvertPayFees(e.target.checked)}
          sx={{
            color: primaryDark,
            "&.Mui-checked": {
              color: primaryDark
            }
          }}
        />
      }
      label={
        <Typography sx={{ fontWeight: 900, color: textColor }}>
          المبلغ المسدد يتضمن الرسوم
        </Typography>
      }
    />

    <Divider />

    <FormControlLabel
      control={
        <Checkbox
          checked={convertRegisteredInOtherInstitute}
          onChange={(e) => {
            const checked = e.target.checked;
            setConvertRegisteredInOtherInstitute(checked);

            if (!checked) {
              setConvertOtherInstituteName("");
            }
          }}
          sx={{
            color: "#ef6c00",
            "&.Mui-checked": {
              color: "#ef6c00"
            }
          }}
        />
      }
      label={
        <Typography sx={{ fontWeight: 900, color: textColor }}>
          مسجل في معهد آخر
        </Typography>
      }
    />

    {convertRegisteredInOtherInstitute && (
      <TextField
        label="اسم المعهد الآخر / ملاحظة"
        fullWidth
        multiline
        minRows={2}
        value={convertOtherInstituteName}
        onChange={(e) => setConvertOtherInstituteName(e.target.value)}
        placeholder="اكتب اسم المعهد الآخر أو أي ملاحظة مرتبطة بالتسجيل"
        sx={{
          "& textarea": {
            fontWeight: 700
          }
        }}
      />
    )}
  </Stack>
</Box>

<TextField
  label="ملاحظات المبيعات"
  fullWidth
  multiline
  minRows={3}
  value={convertSalesNotes}
  onChange={(e) => setConvertSalesNotes(e.target.value)}
  sx={{
    mt: 2,
    "& textarea": {
      fontWeight: 700
    }
  }}
/>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #e4eeea",
            backgroundColor: "#fafdfb"
          }}
        >
          <Button
            onClick={handleCloseConvert}
            disabled={convertLoading}
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 800
            }}
          >
            إغلاق
          </Button>

          <Button
            onClick={handleConfirmConvert}
            disabled={convertLoading || !convertDetails}
            variant="contained"
            startIcon={
              convertLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AssignmentTurnedInIcon />
              )
            }
            sx={{
              borderRadius: 2,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
              }
            }}
          >
            تأكيد التحويل
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={statementOpen}
        onClose={statementLoading ? undefined : handleCloseStudentStatement}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #f8fbfa 0%, #eef7f3 100%)",
            borderBottom: "1px solid #e4eeea",
            py: 1.5
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 900, fontSize: "1.25rem", color: textColor }}>
              كشف حساب طالب
            </Typography>

            <Chip
              label={statementData?.studentName || statementRow?.studentName || "-"}
              sx={{
                fontWeight: 900,
                backgroundColor: "#e8f5e9",
                color: "#2e7d32"
              }}
            />
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, backgroundColor: "#ffffff" }}>
          {statementLoading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #d7e8e0",
                  mb: 2,
                  background: "#fff"
                }}
              >
                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="اسم الطالب"
                      value={statementData?.studentName || statementRow?.studentName}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="رقم الهوية"
                      value={statementData?.nationalId || statementRow?.nationalId}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <DetailItem label="مدين" value={statementData?.totalDebit} strong />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <DetailItem label="دائن" value={statementData?.totalCredit} strong />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <DetailItem label="الرصيد" value={statementData?.balance} strong />
                  </Grid>
                </Grid>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid #d7e8e0",
                  mb: 2,
                  backgroundColor: "#fbfdfc"
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <TextField
                    label="بحث في البيان"
                    size="small"
                    value={statementSearch}
                    onChange={(e) => setStatementSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchStudentStatement();
                      }
                    }}
                    sx={{
                      minWidth: { xs: "100%", sm: 320 },
                      "& input": {
                        fontWeight: 700
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearchStudentStatement}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                      "&:hover": {
                        background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
                      }
                    }}
                  >
                    بحث
                  </Button>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #d7e8e0",
                  borderRadius: 2,
                  overflow: "hidden"
                }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    background: "linear-gradient(135deg, #eef7f3 0%, #ffffff 100%)",
                    borderBottom: "1px solid #d7e8e0"
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: textColor }}>
                    كشف الحساب
                  </Typography>
                </Box>

                <Box sx={{ maxHeight: 520, overflow: "auto" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          التاريخ
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          نوع المستند
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          رقم المستند
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          مدين
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          دائن
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          الرصيد
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          البيان
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 900 }}>
                          مركز التكلفة
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {Array.isArray(statementData?.rows) &&
                      statementData.rows.length > 0 ? (
                        statementData.rows.map((row, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              backgroundColor: index % 2 === 0 ? "#fff7ef" : "#fff",
                              "&:hover": {
                                backgroundColor: "#eef7f3"
                              }
                            }}
                          >
                            <TableCell align="center" sx={{ fontWeight: 800 }}>
                              {formatGregorianDate(row.date) || "-"}
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 800 }}>
                              {row.documentType || "-"}
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 800 }}>
                              {row.documentNumber || "-"}
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{ fontWeight: 900, color: "#d32f2f" }}
                            >
                              {row.debit || 0}
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{ fontWeight: 900, color: "#1565c0" }}
                            >
                              {row.credit || 0}
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 900 }}>
                              {row.balance || 0}
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 800,
                                minWidth: 320,
                                maxWidth: 520,
                                whiteSpace: "normal",
                                lineHeight: 1.8
                              }}
                            >
                              {row.statement || "-"}
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 800 }}>
                              {row.costCenter || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            لا توجد بيانات
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #e4eeea",
            backgroundColor: "#fafdfb"
          }}
        >
          <Button
            onClick={handleCloseStudentStatement}
            variant="contained"
            startIcon={<CloseIcon />}
            disabled={statementLoading}
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
              }
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdmissionRequests;