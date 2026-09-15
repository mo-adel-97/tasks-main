import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import {
  Alert,
  AppBar,
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
  GlobalStyles,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Select,
  Tabs,
  Tab,
  Tooltip,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
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
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";






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
  { value: "cancelled", label: "ملغي", status: 2 },
  { value: "shared", label: "مشترك", shared: true }
];

const SHARED_CONVERSION_STATUS = {
  PENDING: 0,
  ALLOW: 1,
  BLOCK: 2
};

const SHARED_CONVERSION_OPTIONS = [
  { value: 0, label: "لم يراجع" },
  { value: 1, label: "إمكانية التحويل" },
  { value: 2, label: "عدم التحويل" }
];

const isSharedOrder = (row) => Boolean(row?.isSharedRegistration);

const getSharedStatus = (row) => Number(row?.sharedConversionStatus ?? 0);

const canConvertSharedOrder = (row) => {
  if (!isSharedOrder(row)) return true;
  return getSharedStatus(row) === SHARED_CONVERSION_STATUS.ALLOW;
};

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
      "@media (max-width:599px)": { p: 0.45, borderRadius: 1 },
      [`@media (min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { p: 0.65, borderRadius: 1.3 },
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
        mb: 0.4,
        "@media (max-width:599px)": { fontSize: "0.75rem", mb: 0.15 },
        [`@media (min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem", mb: 0.2 }
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
        fontSize: strong ? "1rem" : "0.9rem",
        "@media (max-width:599px)": { fontSize: strong ? "0.75rem" : "0.75rem", lineHeight: 1.35 },
        [`@media (min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: strong ? "0.75rem" : "0.75rem", lineHeight: 1.4 }
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
        fontSize: "0.75rem",
        "@media (max-width:599px)": { fontSize: "0.75rem" },
        [`@media (min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
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
    sx={uiLayout.withUiSx({
      border: "1px solid #d7e8e0",
      borderRadius: 2,
      overflow: "hidden",
      height: "100%"
    }, uiLayout.tableContainerSx)}
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

    <Table
      size="small"
      sx={{
        "& th, & td": {
          "@media (max-width:599px)": { fontSize: "0.75rem", px: 0.35, py: 0.45 },
          [`@media (min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem", px: 0.55, py: 0.55 }
        }
      }}
    >
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
  const muiTheme = useTheme();

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

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

  const handleUpdateSharedConversionStatus = async (row, statusValue) => {
    if (!row?.orderGuid) {
      showWarning("لا يمكن قراءة رقم الطلب");
      return;
    }

    const selectedStatus = Number(statusValue);
    const option = SHARED_CONVERSION_OPTIONS.find((item) => item.value === selectedStatus);
    const currentUser = getCurrentUser();
    const currentUserGuid = getUserGuid(currentUser);

    if (!currentUserGuid) {
      showWarning("لا يمكن قراءة المستخدم الحالي");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admission-requests/shared-conversion-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderGuid: row.orderGuid,
          status: selectedStatus,
          note: option?.label || "",
          userGuid: currentUserGuid
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر تحديث حالة الطلب المشترك");
      }

      setRows((prevRows) =>
        prevRows.map((item) =>
          item.orderGuid === row.orderGuid
            ? {
                ...item,
                sharedConversionStatus: selectedStatus,
                sharedConversionStatusText: option?.label || "",
                sharedConversionNote: option?.label || ""
              }
            : item
        )
      );

      await showSuccess("تم تحديث حالة الطلب المشترك");
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحديث حالة الطلب المشترك");
    }
  };

  useEffect(() => {
    fetchAdmissionRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;

    const selected = STATUS_FILTERS.find((item) => item.value === statusFilter);

    if (!selected) return rows;

    if (selected.shared) {
      return rows.filter((row) => isSharedOrder(row));
    }

    if (selected.status === undefined) return rows;

    return rows.filter((row) => Number(row?.status) === Number(selected.status));
  }, [rows, statusFilter]);

  const getStatusCount = (filterValue) => {
    if (filterValue === "all") return rows.length;

    const selected = STATUS_FILTERS.find((item) => item.value === filterValue);

    if (!selected) return 0;

    if (selected.shared) {
      return rows.filter((row) => isSharedOrder(row)).length;
    }

    if (selected.status === undefined) return 0;

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

    if (!canConvertSharedOrder(row)) {
      showWarning("هذا طلب مشترك ومحدد عليه عدم التحويل أو لم تتم مراجعته. برجاء تغيير إمكانية التحويل أولاً.");
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

      // ============================================================
      // 🚀 تحديث الصف محلياً فقط - بدون إعادة تحميل القائمة بالكامل
      // ============================================================
      const acceptedOrderGuid = convertRow.orderGuid;

      setRows((prevRows) =>
        prevRows.map((item) =>
          item.orderGuid === acceptedOrderGuid
            ? {
                ...item,
                status: 1,
                registerStatusText: "مؤكد",
                orderStatusText: "تم التحويل إلى استمارة",
                docGuid: result?.regDocGuid || item.docGuid,
                regDocGuid: result?.regDocGuid || item.regDocGuid,
                regDocCode: result?.regDocCode || item.regDocCode
              }
            : item
        )
      );

      handleCloseConvert();
      // لا نعيد fetchAdmissionRequests هنا؛ القائمة تتحمل مرة واحدة فقط عند العرض/Refresh
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

      // ============================================================
      // 🚀 تحديث الصف محلياً فقط - بدون إعادة تحميل القائمة بالكامل
      // ============================================================
      const cancelledOrderGuid = rowToCancel.orderGuid;

      setRows((prevRows) =>
        prevRows.map((item) =>
          item.orderGuid === cancelledOrderGuid
            ? {
                ...item,
                status: 2,
                registerStatusText: "ملغي",
                orderStatusText: "ملغي",
                isUse: false
              }
            : item
        )
      );

      handleCloseCancel();
      // لا نعيد fetchAdmissionRequests هنا؛ القائمة تتحمل مرة واحدة فقط عند العرض/Refresh
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
            borderRadius: isCompact ? "7px" : "10px",
            height: isPhone ? 21 : isTablet ? 24 : undefined,
            fontSize: isPhone
              ? "0.75rem"
              : isTablet
                ? "0.75rem"
                : undefined,
            "& .MuiChip-label": {
              px: isPhone ? 0.55 : isTablet ? 0.7 : undefined
            }
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
            borderRadius: isCompact ? "7px" : "10px",
            height: isPhone ? 21 : isTablet ? 24 : undefined,
            fontSize: isPhone
              ? "0.75rem"
              : isTablet
                ? "0.75rem"
                : undefined,
            "& .MuiChip-label": {
              px: isPhone ? 0.55 : isTablet ? 0.7 : undefined
            }
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
            borderRadius: isCompact ? "7px" : "10px",
            height: isPhone ? 21 : isTablet ? 24 : undefined,
            fontSize: isPhone
              ? "0.75rem"
              : isTablet
                ? "0.75rem"
                : undefined,
            "& .MuiChip-label": {
              px: isPhone ? 0.55 : isTablet ? 0.7 : undefined
            }
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
          borderRadius: isCompact ? "7px" : "10px",
          height: isPhone ? 21 : isTablet ? 24 : undefined,
          fontSize: isPhone
            ? "0.75rem"
            : isTablet
              ? "0.75rem"
              : undefined,
          "& .MuiChip-label": {
            px: isPhone ? 0.55 : isTablet ? 0.7 : undefined
          }
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

  const columns = useMemo(() => {
    const actionColumn = {
      field: "actions",
      headerName: isCompact ? "" : "الإجراءات",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      width: isPhone ? 86 : isTablet ? 108 : 174,
      minWidth: isPhone ? 86 : isTablet ? 108 : 174,
      maxWidth: isPhone ? 86 : isTablet ? 108 : 174,
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={isPhone ? 0.03 : isTablet ? 0.12 : 0.35}
          justifyContent="center"
          alignItems="center"
          sx={{ width: "100%" }}
        >
          {[
            {
              title: "عرض الطلب",
              icon: <VisibilityIcon />,
              onClick: () => handleShowOrder(params.row),
              color: primaryDark,
              bg: "#eef7f3"
            },
            {
              title: "المرفقات",
              icon: <FolderOpenIcon />,
              onClick: () => handleShowAttachments(params.row),
              color: "#1976d2",
              bg: "#eaf3ff"
            },
            {
              title: !canConvertSharedOrder(params.row)
                ? "طلب مشترك غير مسموح بتحويله حالياً"
                : "تحويل لاستمارة",
              icon: <AssignmentTurnedInIcon />,
              onClick: () => handleConvertToRegForm(params.row),
              disabled: !canConvertSharedOrder(params.row),
              color: canConvertSharedOrder(params.row) ? "#ef6c00" : "#9e9e9e",
              bg: canConvertSharedOrder(params.row) ? "#fff3e0" : "#eeeeee"
            },
            {
              title: "إلغاء الطلب",
              icon: <DeleteOutlineIcon />,
              onClick: () => handleOpenCancel(params.row),
              color: "#c62828",
              bg: "#ffebee"
            },
            {
              title: "كشف حساب",
              icon: <AccountBalanceWalletIcon />,
              onClick: () => handleShowStudentStatement(params.row),
              color: "#6a1b9a",
              bg: "#f3e5f5"
            }
          ].map((item, index) => (
            <Tooltip key={index} title={item.title} arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={item.disabled}
                  onClick={item.onClick}
                  sx={{
                    width: isPhone ? 16 : isTablet ? 20 : 29,
                    height: isPhone ? 16 : isTablet ? 20 : 29,
                    p: 0,
                    color: item.color,
                    backgroundColor: item.bg,
                    "& .MuiSvgIcon-root": {
                      fontSize: isPhone ? 12 : isTablet ? 12 : 16
                    }
                  }}
                >
                  {item.icon}
                </IconButton>
              </span>
            </Tooltip>
          ))}
        </Stack>
      )
    };

    const orderStatusColumn = {
      field: "registerStatusText",
      headerName: "حالة التسجيل",
      flex: 0.72,
      minWidth: isPhone ? 66 : isTablet ? 80 : 92,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        getOrderStatusChip(params.value, params.row?.status)
    };

    const activeStatusColumn = {
      field: "orderStatusText",
      headerName: "حالة الطلب",
      flex: 0.68,
      minWidth: isPhone ? 62 : isTablet ? 76 : 88,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => getActiveChip(params.value)
    };

    const compactConversionColumn = {
      field: "sharedConversionStatus",
      headerName: isPhone ? "التحويل" : "إمكانية التحويل",
      flex: 0.85,
      minWidth: isPhone ? 78 : 96,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        if (!isSharedOrder(params.row)) {
          return (
            <Typography
              sx={{
                fontWeight: 900,
                color: "#9aa8a2",
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : "0.75rem"
              }}
            >
              -
            </Typography>
          );
        }

        return (
          <FormControl
            size="small"
            sx={uiLayout.withUiSx({
              minWidth: isPhone ? 54 : 78,
              width: "100%"
            }, uiLayout.formFieldSx)}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <Select
              value={getSharedStatus(params.row)}
              onChange={(event) =>
                handleUpdateSharedConversionStatus(
                  params.row,
                  event.target.value
                )
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    "& .MuiMenuItem-root": {
                      minHeight: isPhone ? 26 : 30,
                      fontSize: isPhone
                        ? "0.38rem"
                        : isTablet
                          ? "0.46rem"
                          : "0.68rem",
                      fontWeight: 900
                    }
                  }
                }
              }}
              sx={{
                height: isPhone ? 21 : 27,
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : "0.75rem",
                fontWeight: 900,
                borderRadius: isPhone ? 1 : 1.3,
                backgroundColor:
                  canConvertSharedOrder(params.row)
                    ? "#e8f5e9"
                    : "#fff5f5",
                color:
                  canConvertSharedOrder(params.row)
                    ? "#1b5e20"
                    : "#b71c1c",
                "& .MuiSelect-select": {
                  px: isPhone ? 0.45 : 0.65,
                  py: 0
                },
                "& .MuiSvgIcon-root": {
                  fontSize: isPhone ? 14 : 16
                }
              }}
            >
              {SHARED_CONVERSION_OPTIONS.map(
                (option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {isPhone
                      ? option.value === 0
                        ? "لم يراجع"
                        : option.value === 1
                          ? "تحويل"
                          : "عدم"
                      : option.label}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        );
      }
    };

    if (isPhone) {
      return [
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1.05,
          minWidth: 70,
          align: "center",
          headerAlign: "center",
          renderCell: (params) => (
            <EllipsisCell value={params.value} />
          )
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          flex: 0.82,
          minWidth: 62,
          align: "center",
          headerAlign: "center"
        },
        {
          ...orderStatusColumn,
          headerName: "الحالة",
          minWidth: 46,
          flex: 0.55
        },
        {
          ...compactConversionColumn,
          headerName: "التحويل",
          minWidth: 60,
          flex: 0.68
        },
        actionColumn
      ];
    }

    if (isTablet) {
      return [
        {
          field: "orderDateGregorianDisplay",
          headerName: "التاريخ",
          flex: 0.62,
          minWidth: 72,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 0.95,
          minWidth: 94,
          align: "center",
          headerAlign: "center",
          renderCell: (params) => (
            <EllipsisCell value={params.value} />
          )
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          flex: 0.74,
          minWidth: 80,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "branchName",
          headerName: "الفرع",
          flex: 0.82,
          minWidth: 90,
          align: "center",
          headerAlign: "center",
          renderCell: (params) => (
            <EllipsisCell value={params.value} />
          )
        },
        {
          field: "salesManName",
          headerName: "مسئول التسجيل",
          flex: 0.76,
          minWidth: 84,
          align: "center",
          headerAlign: "center",
          renderCell: (params) => (
            <EllipsisCell value={params.value} />
          )
        },
        {
          ...orderStatusColumn,
          headerName: "الحالة",
          minWidth: 58,
          flex: 0.56
        },
        {
          ...compactConversionColumn,
          minWidth: 84,
          flex: 0.76
        },
        actionColumn
      ];
    }

    // Desktop: نحذف الأعمدة الأقل أهمية من الجريد الرئيسي.
    // أي بيانات مخفية تظل موجودة داخل "عرض الطلب".
    return [
      {
        field: "orderDateGregorianDisplay",
        headerName: "تاريخ الطلب",
        flex: 0.72,
        minWidth: 92,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        flex: 1.18,
        minWidth: 130,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.value} />
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        flex: 0.82,
        minWidth: 100,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "branchName",
        headerName: "الفرع",
        flex: 1.12,
        minWidth: 125,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.value} />
      },
      {
        field: "typeReg",
        headerName: "نوع التسجيل",
        flex: 0.68,
        minWidth: 78,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "typeStudy",
        headerName: "نوع الدراسة",
        flex: 0.68,
        minWidth: 78,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "salesManName",
        headerName: "مسئول التسجيل",
        flex: 0.9,
        minWidth: 102,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <EllipsisCell value={params.value} />
      },
      {
        field: "sharedOrder",
        headerName: "مشترك",
        flex: 0.62,
        minWidth: 78,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) =>
          isSharedOrder(params.row) ? (
            <Chip
              label="مشترك"
              size="small"
              sx={{
                height: 24,
                fontSize: "0.75rem",
                fontWeight: 900,
                backgroundColor: canConvertSharedOrder(params.row)
                  ? "#e8f5e9"
                  : "#ffebee",
                color: canConvertSharedOrder(params.row)
                  ? "#1b5e20"
                  : "#b71c1c"
              }}
            />
          ) : null
      },
      {
        field: "sharedConversionStatus",
        headerName: "التحويل",
        flex: 0.92,
        minWidth: 118,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params) => {
          if (!isSharedOrder(params.row)) return null;
          return (
            <FormControl
              size="small"
              sx={uiLayout.withUiSx({ minWidth: 104 }, uiLayout.formFieldSx)}
              onClick={(e) => e.stopPropagation()}
            >
              <Select
                value={getSharedStatus(params.row)}
                onChange={(e) =>
                  handleUpdateSharedConversionStatus(params.row, e.target.value)
                }
                sx={{
                  height: 30,
                  fontSize: "0.75rem",
                  fontWeight: 900,
                  backgroundColor: canConvertSharedOrder(params.row)
                    ? "#e8f5e9"
                    : "#fff5f5"
                }}
              >
                {SHARED_CONVERSION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
      },
      orderStatusColumn,
      activeStatusColumn,
      actionColumn
    ];
  }, [isPhone, isTablet, isCompact]);

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
      "طلب مشترك",
      "مندوب الطالب",
      "مندوب الاستمارة",
      "إمكانية التحويل",
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
      row.isSharedRegistration ? "طلب مشترك" : "",
      row.isSharedRegistration ? row.studentSellerName : "",
      row.isSharedRegistration ? row.orderSellerName : "",
      row.isSharedRegistration ? row.sharedConversionStatusText : "",
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
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        background: softBg,
        fontFamily: "Cairo, Arial, sans-serif",
        direction: "rtl",
        overflowX: "hidden"
      }}
    >
      {!isDesktop && (
        <GlobalStyles
          styles={{
            ".MuiDrawer-root": { zIndex: "2100 !important" },
            ".MuiDrawer-root .MuiBackdrop-root": { zIndex: "2099 !important" },
            ".MuiDrawer-root .MuiDrawer-paper": { zIndex: "2101 !important" },
            ".swal2-popup": {
              width: isPhone ? "88vw !important" : isTablet ? "560px !important" : undefined,
              fontFamily: "Cairo !important"
            }
          }}
        />
      )}

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1400,
            background: "rgba(255,255,255,.97)",
            color: textColor,
            borderBottom: "1px solid #d7e8e0",
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
              minHeight: { xs: "var(--app-header-height, 56px)", sm: "var(--app-header-height, 56px)" },
              px: { xs: 0.75, sm: 1 },
              gap: 0.8
            }}
          >
            <IconButton
              onClick={() => setMobileSidebarOpen((v) => !v)}
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                color: "#fff",
                background: "linear-gradient(135deg,#057546,#034d31)"
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>
            <Typography
              sx={{
                flex: 1,
                textAlign: "start",
                fontWeight: 900,
                fontSize: { xs: "0.75rem", sm: "0.8rem" }
              }}
            >
              طلبات الالتحاق
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <PageContainer
        component="main"
        sx={{
          
          
          ml: 0,
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          minWidth: 0,
          minHeight: "100dvh",
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            p: 2
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.65 : isTablet ? 0.9 : 1.4,
            mb: isPhone ? 0.6 : isTablet ? 0.8 : 1.2,
            borderRadius: isCompact ? 1.5 : 2.4,
            border: `1px solid ${primaryLight}`,
            background: "linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%)"
          }}
        >
          <Stack
            direction={isCompact ? "column" : "row"}
            justifyContent="space-between"
            alignItems={isCompact ? "stretch" : "center"}
            spacing={isPhone ? 0.55 : isTablet ? 0.8 : 1.2}
          >
            <Box sx={{ minWidth: 200 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: textColor,
                  mb: 0.5,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.92rem" : "1.35rem"
                }}
              >
                طلبات الالتحاق
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#607d73",
                  fontWeight: 800,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.78rem",
                  display: isPhone ? "none" : "block"
                }}
              >
                عرض طلبات الالتحاق حسب الفترة المحددة
              </Typography>
            </Box>

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: isCompact
                  ? "repeat(2,minmax(0,1fr))"
                  : "repeat(5,auto)",
                gap: isPhone ? 0.45 : isTablet ? 0.65 : 0.8,
                alignItems: "center",
                "& .MuiInputLabel-root": {
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                },
                "& .MuiInputBase-input": {
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                },
                "& .MuiButton-root": {
                  minWidth: 0,
                  minHeight: isPhone ? 30 : isTablet ? 33 : 36,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
                  px: isPhone ? 0.55 : isTablet ? 0.8 : 1.1
                }
              }, uiLayout.filterBarSx)}
            >
              <TextField
                label="الفترة من"
                type="date"
                size="small"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={uiLayout.withUiSx({
                  minWidth: 0,
                  width: "100%",
                  "& input": {
                    textAlign: "center",
                    fontWeight: 800
                  }
                }, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField
                label="الفترة إلى"
                type="date"
                size="small"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={uiLayout.withUiSx({
                  minWidth: 0,
                  width: "100%",
                  "& input": {
                    textAlign: "center",
                    fontWeight: 800
                  }
                }, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

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
                sx={uiLayout.withUiSx({
                  minWidth: 0,
                  height: isCompact ? "auto" : 36,
                  fontWeight: "bold",
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                  boxShadow: "0 4px 10px rgba(128, 180, 158, 0.25)",
                  "&:hover": {
                    background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
                  }
                }, uiLayout.buttonSx)}
              >
                عرض
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchAdmissionRequests}
                disabled={loading}
                sx={uiLayout.withUiSx({
                  minWidth: 0,
                  height: isCompact ? "auto" : 36,
                  fontWeight: "bold",
                  borderRadius: 2,
                  color: primaryDark,
                  borderColor: primaryColor,
                  "&:hover": {
                    borderColor: primaryDark,
                    backgroundColor: "#f4faf7"
                  }
                }, uiLayout.buttonSx)}
              >
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportCsv}
                disabled={filteredRows.length === 0}
                sx={uiLayout.withUiSx({
                  minWidth: 0,
                  height: isCompact ? "auto" : 36,
                  fontWeight: "bold",
                  borderRadius: 2,
                  color: "#2e7d32",
                  borderColor: "#8fc9a5",
                  gridColumn: isPhone ? "1 / -1" : undefined,
                  "&:hover": {
                    borderColor: "#2e7d32",
                    backgroundColor: "#f2fbf4"
                  }
                }, uiLayout.buttonSx)}
              >
                تصدير
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.55 : isTablet ? 0.75 : 1,
            mb: isPhone ? 0.55 : isTablet ? 0.75 : 1.1,
            borderRadius: isCompact ? 1.4 : 2.2,
            border: "1px solid #d7e8e0",
            background: "linear-gradient(135deg, #ffffff 0%, #fbfdfc 100%)"
          }}
        >
          <Stack
            direction={isCompact ? "column" : "row"}
            spacing={isPhone ? 0.45 : isTablet ? 0.65 : 0.9}
            alignItems={isCompact ? "stretch" : "center"}
            justifyContent="space-between"
          >
            <Box>
              <Typography sx={{ fontWeight: 900, color: textColor, mb: 0.3 }}>
                فلتر حالة الطلب
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#6f8a81", fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem", display: isPhone ? "none" : "block" }}>
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
                    sx={uiLayout.withUiSx({
                      borderRadius: 999,
                      px: isPhone ? 0.65 : isTablet ? 0.9 : 1.3,
                      minWidth: isPhone ? 70 : isTablet ? 82 : 92,
                      height: isPhone ? 28 : isTablet ? 31 : 34,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
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
                    }, uiLayout.buttonSx)}
                  >
                    {item.label}
                    <Box
                      component="span"
                      sx={{
                        ml: 0.8,
                        px: 0.8,
                        py: 0.1,
                        borderRadius: 999,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
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
            maxWidth: "100%",
            borderRadius: isPhone
              ? 1.2
              : isTablet
                ? 1.8
                : 3,
            overflow: "hidden",
            m: 0,
            border: `1px solid ${primaryLight}`,
            backgroundColor: "#fff",
            boxSizing: "border-box"
          }}
        >
          <Box sx={uiLayout.withUiSx({ width: "100%", overflow: "hidden" }, uiLayout.tableContainerSx)}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              disableColumnMenu
              rowHeight={isPhone ? 36 : isTablet ? 42 : 48}
              columnHeaderHeight={isPhone ? 34 : isTablet ? 40 : 46}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 25,
                    page: 0
                  }
                }
              }}
              getRowClassName={(params) => {
                if (!isSharedOrder(params.row)) return "";
                return canConvertSharedOrder(params.row)
                  ? "shared-order-allowed"
                  : "shared-order-blocked";
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
              sx={uiLayout.withUiSx({
                border: "none",
                fontFamily: "Cairo, Arial, sans-serif",
                direction: "rtl",

                "& .MuiDataGrid-main": {
                  overflow: "hidden"
                },

                "& .MuiDataGrid-virtualScroller": {
                  overflowX: "auto"
                },

                "& .MuiDataGrid-scrollbar--horizontal": {
                  display: "block"
                },

                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#edf4f1",
                  color: textColor,
                  fontWeight: "bold",
                  borderBottom: `1px solid ${primaryLight}`
                },

                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 900,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
                  textAlign: "center",
                  width: "100%"
                },

                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #edf2ef",
                  fontWeight: 800,
                  px: isPhone ? 0.15 : isTablet ? 0.3 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
                  outline: "none !important",
                  px: 0.4
                },

                "& .MuiDataGrid-row:nth-of-type(even)": {
                  backgroundColor: "#fcf8f2"
                },

                "& .MuiDataGrid-row.shared-order-blocked": {
                  backgroundColor: "#ffebee !important",
                  color: "#8a1c1c"
                },

                "& .MuiDataGrid-row.shared-order-allowed": {
                  backgroundColor: "#e8f5e9 !important",
                  color: "#1b5e20"
                },

                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#eef7f3 !important"
                },

                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: "#fafdfb",
                  borderTop: `1px solid ${primaryLight}`
                },

                "& .MuiTablePagination-root": {
                  fontWeight: 800,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                },

                "& .MuiDataGrid-columnSeparator": {
                  display: "none"
                }
              }, uiLayout.dataGridSx)}
            />
          </Box>
        </Paper>

        <Box sx={{ mt: isCompact ? 0.7 : 1.2, display: "flex", justifyContent: "flex-start" }}>
          <Paper
            elevation={0}
            sx={{
              px: isPhone ? 0.8 : isTablet ? 1 : 1.5,
              py: isPhone ? 0.45 : isTablet ? 0.55 : 0.7,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
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
      </PageContainer>

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="xl"
        fullWidth
        fullScreen={isPhone}
        sx={uiLayout.withUiSx({
          "& .MuiDialog-container": {
            pt: isPhone ? "50px" : isTablet ? "58px" : 0,
            alignItems: isPhone ? "stretch" : "center"
          }
        }, uiLayout.dialogLayoutSx)}
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
            py: isPhone ? 0.55 : isTablet ? 0.75 : 1.2,
            px: isPhone ? 0.7 : isTablet ? 1 : 2
          }}
        >
          <Stack sx={uiLayout.pageHeaderSx} direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 900, fontSize: isPhone ? "0.75rem" : isTablet ? "0.82rem" : "1.05rem", color: textColor }}>
              عرض طلب الالتحاق
            </Typography>

            <Stack sx={uiLayout.actionBarSx} direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FolderOpenIcon />}
                onClick={() => selectedRow && handleShowAttachments(selectedRow)}
                sx={uiLayout.withUiSx({ fontWeight: 800, borderRadius: 1.5, minWidth: isPhone ? 30 : undefined, px: isPhone ? 0.5 : 1 }, uiLayout.buttonSx)}
              >
                {isPhone ? "" : "المرفقات"}
              </Button>

              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => selectedRow && handleOpenCancel(selectedRow)}
                sx={uiLayout.withUiSx({ fontWeight: 800, borderRadius: 1.5, minWidth: isPhone ? 30 : undefined, px: isPhone ? 0.5 : 1 }, uiLayout.buttonSx)}
              >
                {isPhone ? "" : "إلغاء الطلب"}
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: isPhone ? 0.65 : isTablet ? 0.9 : 1.5, backgroundColor: "#ffffff" }}>
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
                  p: isPhone ? 0.6 : isTablet ? 0.8 : 1.2,
                  borderRadius: isCompact ? 1.4 : 2,
                  border: "1px solid #d7e8e0",
                  mb: isPhone ? 0.75 : isTablet ? 1 : 2,
                  background: "#fff"
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: primaryDark,
                    mb: isPhone ? 0.55 : isTablet ? 0.75 : 1,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.9rem"
                  }}
                >
                  البيانات الأساسية
                </Typography>

                <Grid
                  container
                  spacing={
                    isPhone
                      ? 0.65
                      : isTablet
                        ? 0.9
                        : 1.2
                  }
                >
                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem label="كود" value={header.code || selectedRow?.code} />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem
                      label="تاريخ الطلب"
                      value={
                        selectedRow?.orderDateGregorianDisplay ||
                        formatGregorianDate(getGregorianOrderDate(header))
                      }
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem
                      label="اسم الطالب"
                      value={header.studentName || selectedRow?.studentName}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem
                      label="رقم الهوية"
                      value={header.nationalId || selectedRow?.nationalId}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem
                      label="رقم الجوال"
                      value={header.studentTel || selectedRow?.studentTel}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem
                      label="نوع التسجيل"
                      value={header.regTypeText || selectedRow?.typeReg}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem
                      label="نوع الدراسة"
                      value={header.studyTypeText || selectedRow?.typeStudy}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem
                      label="فرع الدراسة"
                      value={header.branchName || selectedRow?.branchName}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={3}>
                    <DetailItem label="الدفعة" value={header.batchName || selectedRow?.batchName} />
                  </Grid>

                  {isPhone ? (
                    <>
                      <Grid item xs={6}>
                        <DetailItem
                          label="مندوب الطالب"
                          value={
                            selectedRow?.studentSellerName ||
                            header.studentSellerName ||
                            "-"
                          }
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <DetailItem
                          label="مندوب الاستمارة"
                          value={
                            selectedRow?.orderSellerName ||
                            header.orderSellerName ||
                            "-"
                          }
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item sm={4} md={3}>
                        <DetailItem
                          label="مسئول التسجيل"
                          value={selectedRow?.salesManName || header.sellerName}
                        />
                      </Grid>

                      <Grid item sm={4} md={3}>
                        <DetailItem
                          label="مندوب الطالب"
                          value={
                            selectedRow?.studentSellerName ||
                            header.studentSellerName ||
                            "-"
                          }
                        />
                      </Grid>

                      <Grid item sm={4} md={3}>
                        <DetailItem
                          label="مندوب الاستمارة"
                          value={
                            selectedRow?.orderSellerName ||
                            header.orderSellerName ||
                            "-"
                          }
                        />
                      </Grid>
                    </>
                  )}

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
                <Grid item xs={12} sm={6} md={6}>
                  <SmallDataTable title="الدبلوم / الدورة" rows={diplomas} />
                </Grid>

                <Grid item xs={12} sm={6} md={6}>
                  <SmallDataTable title="الرسوم" rows={fees} />
                </Grid>
              </Grid>

              {Array.isArray(packageCourses) && packageCourses.length > 0 && (
                <Paper
                  elevation={0}
                  sx={uiLayout.withUiSx({
                    mt: 2,
                    borderRadius: 2,
                    border: "1px solid #d7e8e0",
                    overflow: "hidden"
                  }, uiLayout.tableContainerSx)}
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
          sx={uiLayout.withUiSx({
            px: isPhone ? 0.65 : isTablet ? 0.9 : 1.5,
            py: isPhone ? 0.5 : isTablet ? 0.65 : 0.9,
            borderTop: "1px solid #e4eeea",
            backgroundColor: "#fafdfb"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={handleCloseDetails}
            variant="contained"
            startIcon={<CloseIcon />}
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
              }
            }, uiLayout.buttonSx)}
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
        fullScreen={isPhone}
        sx={uiLayout.withUiSx({
          "& .MuiDialog-container": {
            pt: isPhone ? "50px" : isTablet ? "58px" : 0,
            alignItems: isPhone ? "stretch" : "center"
          }
        }, uiLayout.dialogLayoutSx)}
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

          <TextField InputLabelProps={{ shrink: true }}
            label="سبب الإلغاء"
            multiline
            minRows={4}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={cancelLoading}
            sx={uiLayout.withUiSx({
              "& textarea": {
                fontWeight: 700
              }
            }, uiLayout.formFieldSx)}
          />
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #eee"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={handleCloseCancel}
            disabled={cancelLoading}
            variant="outlined"
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 800
            }, uiLayout.buttonSx)}
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
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 900
            }, uiLayout.buttonSx)}
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
        fullScreen={isPhone}
        sx={uiLayout.withUiSx({
          "& .MuiDialog-container": {
            pt: isPhone ? "50px" : isTablet ? "58px" : 0,
            alignItems: isPhone ? "stretch" : "center"
          }
        }, uiLayout.dialogLayoutSx)}
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
    <FormControlLabel sx={uiLayout.checkboxFieldSx}
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

    <FormControlLabel sx={uiLayout.checkboxFieldSx}
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
      <TextField InputLabelProps={{ shrink: true }}
        label="اسم المعهد الآخر / ملاحظة"
        fullWidth
        multiline
        minRows={2}
        value={convertOtherInstituteName}
        onChange={(e) => setConvertOtherInstituteName(e.target.value)}
        placeholder="اكتب اسم المعهد الآخر أو أي ملاحظة مرتبطة بالتسجيل"
        sx={uiLayout.withUiSx({
          "& textarea": {
            fontWeight: 700
          }
        }, uiLayout.formFieldSx)}
      />
    )}
  </Stack>
</Box>

<TextField InputLabelProps={{ shrink: true }}
  label="ملاحظات المبيعات"
  fullWidth
  multiline
  minRows={3}
  value={convertSalesNotes}
  onChange={(e) => setConvertSalesNotes(e.target.value)}
  sx={uiLayout.withUiSx({
    mt: 2,
    "& textarea": {
      fontWeight: 700
    }
  }, uiLayout.formFieldSx)}
/>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #e4eeea",
            backgroundColor: "#fafdfb"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={handleCloseConvert}
            disabled={convertLoading}
            variant="outlined"
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 800
            }, uiLayout.buttonSx)}
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
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
              }
            }, uiLayout.buttonSx)}
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
        fullScreen={isPhone}
        sx={uiLayout.withUiSx({
          "& .MuiDialog-container": {
            pt: isPhone ? "50px" : isTablet ? "58px" : 0,
            alignItems: isPhone ? "stretch" : "center"
          }
        }, uiLayout.dialogLayoutSx)}
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
                <Stack sx={uiLayout.filterBarSx}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <TextField InputLabelProps={{ shrink: true }}
                    label="بحث في البيان"
                    size="small"
                    value={statementSearch}
                    onChange={(e) => setStatementSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchStudentStatement();
                      }
                    }}
                    sx={uiLayout.withUiSx({
                      minWidth: { xs: "100%", sm: 320 },
                      "& input": {
                        fontWeight: 700
                      }
                    }, uiLayout.formFieldSx)}
                  />

                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearchStudentStatement}
                    sx={uiLayout.withUiSx({
                      borderRadius: 2,
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                      "&:hover": {
                        background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
                      }
                    }, uiLayout.buttonSx)}
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

                <Box sx={uiLayout.withUiSx({ maxHeight: 520, overflow: "auto" }, uiLayout.tableContainerSx)}>
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
          sx={uiLayout.withUiSx({
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid #e4eeea",
            backgroundColor: "#fafdfb"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={handleCloseStudentStatement}
            variant="contained"
            startIcon={<CloseIcon />}
            disabled={statementLoading}
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
              }
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
};

export default AdmissionRequests;