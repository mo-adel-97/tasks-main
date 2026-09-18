import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import { useTheme } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import HrPermissionWorkflowManager from "./components/HrPermissionWorkflowManager";

// ============================================================
// RTL dialog form system
// Keeps Arabic labels above controls instead of floating on the outline,
// normalizes spacing/alignment, and preserves LTR rendering for date/time.
// ============================================================
const RTL_DIALOG_SX = {
  "& .MuiDialog-paper": {
    direction: "rtl",
    textAlign: "right",
    backgroundImage: "none"
  },
  "& .MuiDialogTitle-root": {
    direction: "rtl",
    textAlign: "right",
    fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
  },
  "& .MuiDialogContent-root": {
    direction: "rtl",
    textAlign: "right",
    overflowX: "hidden",

    "& .MuiFormControl-root": {
      direction: "rtl",
      textAlign: "right"
    },

    // Use a real external-looking label above the control. This avoids the
    // outlined-border/label collision that appears in Arabic RTL forms.
    "& .MuiInputLabel-root": {
      position: "static !important",
      transform: "none !important",
      transformOrigin: "top right !important",
      width: "100%",
      maxWidth: "100%",
      margin: "0 0 6px 0",
      padding: 0,
      direction: "rtl",
      textAlign: "right",
      whiteSpace: "normal",
      overflow: "visible",
      lineHeight: 1.45,
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontSize: "0.78rem",
      fontWeight: 800,
      color: "#52635c",
      pointerEvents: "auto"
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#057546"
    },
    "& .MuiInputLabel-root.Mui-error": {
      color: "#d32f2f"
    },
    "& .MuiInputLabel-root.Mui-disabled": {
      color: "rgba(0,0,0,.42)"
    },

    "& .MuiOutlinedInput-root": {
      direction: "rtl",
      textAlign: "right",
      borderRadius: "10px",
      backgroundColor: "#fff",
      transition: "border-color .18s ease, box-shadow .18s ease, background-color .18s ease",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d7e3dd"
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#9fc7b5"
      },
      "&.Mui-focused": {
        boxShadow: "0 0 0 3px rgba(5,117,70,.08)"
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#057546",
        borderWidth: "1.5px"
      },
      "&.Mui-error .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d32f2f"
      }
    },

    // The label is no longer inside the outline, so remove MUI's notch.
    "& .MuiOutlinedInput-notchedOutline legend": {
      maxWidth: "0 !important"
    },
    "& .MuiOutlinedInput-notchedOutline legend > span": {
      display: "none !important"
    },

    "& .MuiInputBase-input, & textarea, & .MuiSelect-select": {
      direction: "rtl",
      textAlign: "right",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },
    "& .MuiSelect-select": {
      paddingRight: "14px !important",
      paddingLeft: "40px !important"
    },
    "& .MuiSelect-icon": {
      right: "auto !important",
      left: "10px !important"
    },
    "& .MuiInputAdornment-positionStart": {
      marginRight: "0 !important",
      marginLeft: "8px !important"
    },
    "& .MuiInputAdornment-positionEnd": {
      marginLeft: "0 !important",
      marginRight: "8px !important"
    },
    "& .MuiFormHelperText-root": {
      direction: "rtl",
      textAlign: "right",
      marginLeft: 0,
      marginRight: 0,
      marginTop: "5px",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },
    "& .MuiAutocomplete-inputRoot": {
      direction: "rtl",
      paddingRight: "10px !important",
      paddingLeft: "38px !important"
    },
    "& .MuiAutocomplete-endAdornment": {
      right: "auto !important",
      left: "8px !important"
    },
    "& .MuiFormControlLabel-root": {
      direction: "rtl",
      marginLeft: 0,
      marginRight: 0,
      gap: "3px"
    },
    "& .MuiFormControlLabel-label": {
      direction: "rtl",
      textAlign: "right",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },

    // Dates and times must keep their natural numeric order in Arabic UI.
    '& input[type="date"], & input[type="time"], & input[type="datetime-local"]': {
      direction: "ltr !important",
      textAlign: "center !important",
      unicodeBidi: "isolate"
    }
  },
  "& .MuiDialogActions-root": {
    direction: "rtl",
    gap: "8px",
    flexWrap: "wrap",
    padding: { xs: "12px 14px", sm: "14px 20px" },
    borderTop: "1px solid #edf2ef",
    "& .MuiButton-root": {
      minHeight: 38,
      borderRadius: "10px",
      textTransform: "none",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontWeight: 800
    },
    "& .MuiButton-startIcon": {
      marginRight: "0 !important",
      marginLeft: "6px !important"
    },
    "& .MuiButton-endIcon": {
      marginLeft: "0 !important",
      marginRight: "6px !important"
    }
  }
};

const RTL_MENU_PROPS = {
  PaperProps: {
    sx: {
      direction: "rtl",
      textAlign: "right",
      mt: 0.5,
      borderRadius: "10px",
      maxHeight: 360,
      "& .MuiMenuItem-root": {
        direction: "rtl",
        textAlign: "right",
        justifyContent: "flex-start",
        minHeight: 40,
        fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
      }
    }
  },
  MenuListProps: {
    dir: "rtl",
    sx: { py: 0.5 }
  }
};

const RTL_AUTOCOMPLETE_LISTBOX_PROPS = {
  dir: "rtl",
  style: {
    direction: "rtl",
    textAlign: "right",
    fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
  }
};

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";



const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const bg = "#f5f8f6";

const pad = (value) => String(value).padStart(2, "0");
const dateInput = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayValue = () => dateInput(new Date());
const monthStartValue = () => {
  const now = new Date();
  return dateInput(new Date(now.getFullYear(), now.getMonth(), 1));
};

const emptyForm = () => ({
  employee: null,
  permissionDate: todayValue(),
  permissionType: 1,
  fromTime: "",
  toTime: "",
  reason: "",
  notes: "",
  autoApprove: false
});

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getStoredUserGuid = (user) => {
  const candidate =
    user?.userGuid ||
    user?.UserGuid ||
    user?.guid ||
    user?.Guid ||
    user?.USER_GUID ||
    user?.USER_GUID____ ||
    user?.sellerGuid ||
    user?.SellerGuid ||
    localStorage.getItem("userGuid") ||
    localStorage.getItem("UserGuid") ||
    localStorage.getItem("guid") ||
    "";

  const value = String(candidate || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : "";
};

const getActor = () => {
  const user = getStoredUser();
  return {
    actorUserGuid: getStoredUserGuid(user) || null,
    actorName:
      user?.fullName ||
      user?.FullName ||
      user?.ManFullName ||
      user?.manFullName ||
      user?.userName ||
      user?.UserName ||
      user?.name ||
      user?.Name ||
      "مستخدم النظام"
  };
};

const statusMeta = (status) => {
  const map = {
    Pending: ["قيد المراجعة", "warning"],
    Approved: ["معتمد", "success"],
    Rejected: ["مرفوض", "error"],
    Cancelled: ["ملغي", "default"]
  };
  const [label, color] = map[status] || [status || "-", "default"];
  return { label, color };
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

const formatTime = (value) => {
  if (!value) return "-";
  const text = String(value);
  const match = text.match(/(\d{1,2}):(\d{2})/);
  return match ? `${pad(match[1])}:${match[2]}` : text;
};

const minutesText = (minutes) => {
  const value = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (!hours) return `${mins} د`;
  if (!mins) return `${hours} س`;
  return `${hours} س ${mins} د`;
};

const apiError = (result, fallback) =>
  result?.error
    ? `${result?.message || fallback}: ${result.error}`
    : result?.message || fallback;

export default function HrPermissionsPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, {
    noSsr: true
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [lookups, setLookups] = useState({
    employees: [],
    branches: [],
    permissionTypes: [],
    statuses: []
  });
  const [loading, setLoading] = useState(true);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
    approvedTodayCount: 0,
    approvedMinutes: 0
  });

  const [filters, setFilters] = useState({
    fromDate: monthStartValue(),
    toDate: todayValue(),
    search: "",
    branchGuid: "",
    permissionType: "",
    status: ""
  });
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    fromDate: monthStartValue(),
    toDate: todayValue(),
    search: "",
    branchGuid: "",
    permissionType: "",
    status: ""
  }));

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [actionGuid, setActionGuid] = useState("");

  const loadLookups = useCallback(async () => {
    try {
      setLookupsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/hr/permissions/lookups`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(apiError(result, "تعذر تحميل بيانات الأذونات"));
      }
      setLookups({
        employees: Array.isArray(result?.data?.employees) ? result.data.employees : [],
        branches: Array.isArray(result?.data?.branches) ? result.data.branches : [],
        permissionTypes: Array.isArray(result?.data?.permissionTypes)
          ? result.data.permissionTypes
          : [],
        statuses: Array.isArray(result?.data?.statuses) ? result.data.statuses : []
      });
    } catch (e) {
      setError(e?.message || "تعذر تحميل بيانات الأذونات");
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        fromDate: appliedFilters.fromDate,
        toDate: appliedFilters.toDate,
        page: String(page),
        pageSize: String(pageSize)
      });
      if (appliedFilters.search.trim()) params.set("search", appliedFilters.search.trim());
      if (appliedFilters.branchGuid) params.set("branchGuid", appliedFilters.branchGuid);
      if (appliedFilters.permissionType !== "") {
        params.set("permissionType", String(appliedFilters.permissionType));
      }
      if (appliedFilters.status) params.set("status", appliedFilters.status);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/permissions?${params.toString()}`,
        { cache: "no-store", headers: { Accept: "application/json" } }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(result, "تعذر تحميل أذونات الموظفين"));

      setRows(Array.isArray(result?.data) ? result.data : []);
      setTotalCount(Number(result?.totalCount || 0));
      setPageCount(Number(result?.pageCount || 0));
      setStats({
        totalCount: Number(result?.stats?.totalCount || 0),
        pendingCount: Number(result?.stats?.pendingCount || 0),
        approvedCount: Number(result?.stats?.approvedCount || 0),
        rejectedCount: Number(result?.stats?.rejectedCount || 0),
        cancelledCount: Number(result?.stats?.cancelledCount || 0),
        approvedTodayCount: Number(result?.stats?.approvedTodayCount || 0),
        approvedMinutes: Number(result?.stats?.approvedMinutes || 0)
      });
    } catch (e) {
      setRows([]);
      setError(e?.message || "حدث خطأ أثناء تحميل أذونات الموظفين");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const selectedEmployee = form.employee;

  const permissionTimeDescription = (row) => {
    switch (Number(row?.permissionType)) {
      case 1:
        return `حضور حتى ${formatTime(row?.toTime)}`;
      case 2:
        return `انصراف من ${formatTime(row?.fromTime)}`;
      case 3:
        return `${formatTime(row?.fromTime)} ← ${formatTime(row?.toTime)}`;
      case 4:
        return "اليوم كامل";
      default:
        return "-";
    }
  };

  const applyFilters = () => {
    if (!filters.fromDate || !filters.toDate) {
      Swal.fire({ icon: "warning", title: "حدد الفترة", text: "حدد تاريخ البداية والنهاية" });
      return;
    }
    if (new Date(filters.toDate) < new Date(filters.fromDate)) {
      Swal.fire({
        icon: "warning",
        title: "الفترة غير صحيحة",
        text: "تاريخ النهاية يجب أن يكون بعد أو مساويًا لتاريخ البداية"
      });
      return;
    }
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const next = {
      fromDate: monthStartValue(),
      toDate: todayValue(),
      search: "",
      branchGuid: "",
      permissionType: "",
      status: ""
    };
    setFilters(next);
    setPage(1);
    setAppliedFilters(next);
  };

  const openCreate = () => {
    setForm(emptyForm());
    setCreateOpen(true);
  };

  const recalculateAttendance = async (employeeGuid, permissionDate) => {
    if (!employeeGuid || !permissionDate) return;
    try {
      await fetch(`${API_BASE_URL}/api/hr/attendance/recalculate-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          employeeGuid,
          attendanceDate: String(permissionDate).slice(0, 10)
        })
      });
    } catch {
      // الإذن نفسه محفوظ؛ فشل إعادة الحساب لا يلغي العملية.
    }
  };

  const validateCreate = () => {
    if (!selectedEmployee?.employeeGuid) return "اختر الموظف";
    if (!form.permissionDate) return "حدد تاريخ الإذن";
    if (!form.permissionType) return "اختر نوع الإذن";
    if (!form.reason.trim()) return "سبب الإذن مطلوب";
    if (Number(form.permissionType) === 1 && !form.toTime) {
      return "حدد وقت السماح بالحضور";
    }
    if (Number(form.permissionType) === 2 && !form.fromTime) {
      return "حدد وقت بداية الانصراف";
    }
    if (Number(form.permissionType) === 3) {
      if (!form.fromTime || !form.toTime) return "حدد وقت الخروج ووقت العودة";
      // لا نقارن الوقتين نصيًا هنا لأن الوردية قد تعبر منتصف الليل.
      // الـ API هو المصدر النهائي للتحقق من أن الفترة تقع بالكامل داخل الوردية.
    }
    return "";
  };

  const savePermission = async () => {
    const validation = validateCreate();
    if (validation) {
      await Swal.fire({ icon: "warning", title: "راجع البيانات", text: validation });
      return;
    }

    const actor = getActor();
    if (!actor.actorUserGuid) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحديد المستخدم",
        text: "سجل الدخول مرة أخرى ثم أعد المحاولة"
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        employeeGuid: selectedEmployee.employeeGuid,
        permissionDate: form.permissionDate,
        permissionType: Number(form.permissionType),
        fromTime:
          [2, 3].includes(Number(form.permissionType)) && form.fromTime
            ? `${form.fromTime}:00`
            : null,
        toTime:
          [1, 3].includes(Number(form.permissionType)) && form.toTime
            ? `${form.toTime}:00`
            : null,
        reason: form.reason.trim(),
        notes: form.notes.trim() || null,
        autoApprove: Boolean(form.autoApprove),
        ...actor
      };

      const response = await fetch(`${API_BASE_URL}/api/hr/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-User-Guid": actor.actorUserGuid
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(result, "تعذر إنشاء الإذن"));

      setCreateOpen(false);
      if (result?.data?.autoApproved) {
        await recalculateAttendance(result.data.employeeGuid, result.data.permissionDate);
      }
      await Swal.fire({
        icon: "success",
        title: form.autoApprove ? "تم إنشاء الإذن واعتماده" : "تم إنشاء الإذن",
        text: result?.message || "تم الحفظ بنجاح"
      });
      await loadRows();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر الحفظ", text: e?.message || "حدث خطأ" });
    } finally {
      setSaving(false);
    }
  };

  const decidePermission = async (row, nextStatus) => {
    const actor = getActor();
    if (!actor.actorUserGuid) {
      await Swal.fire({ icon: "error", title: "تعذر تحديد المستخدم", text: "سجل الدخول مرة أخرى" });
      return;
    }

    const isApprove = nextStatus === "Approved";
    const prompt = await Swal.fire({
      icon: isApprove ? "question" : "warning",
      title: isApprove ? "اعتماد الإذن؟" : "رفض الإذن؟",
      text: `${row?.employeeName || "الموظف"} - ${row?.permissionTypeName || ""}`,
      input: "textarea",
      inputLabel: isApprove ? "ملاحظات الاعتماد (اختياري)" : "سبب الرفض / الملاحظات",
      inputPlaceholder: "اكتب الملاحظات هنا...",
      showCancelButton: true,
      confirmButtonText: isApprove ? "اعتماد" : "رفض",
      cancelButtonText: "رجوع",
      confirmButtonColor: isApprove ? primary : "#b42318",
      reverseButtons: true
    });
    if (!prompt.isConfirmed) return;

    try {
      setActionGuid(row.permissionGuid);
      const response = await fetch(
        `${API_BASE_URL}/api/hr/permissions/${encodeURIComponent(row.permissionGuid)}/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-Guid": actor.actorUserGuid
          },
          body: JSON.stringify({
            status: nextStatus,
            notes: String(prompt.value || "").trim() || null,
            ...actor
          })
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(result, "تعذر تنفيذ القرار"));

      await recalculateAttendance(result?.data?.employeeGuid, result?.data?.permissionDate);
      await loadRows();
      await Swal.fire({
        icon: "success",
        title: isApprove ? "تم اعتماد الإذن" : "تم رفض الإذن",
        timer: 1200,
        showConfirmButton: false
      });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر تنفيذ القرار", text: e?.message || "حدث خطأ" });
    } finally {
      setActionGuid("");
    }
  };

  const cancelPermission = async (row) => {
    const actor = getActor();
    if (!actor.actorUserGuid) {
      await Swal.fire({ icon: "error", title: "تعذر تحديد المستخدم", text: "سجل الدخول مرة أخرى" });
      return;
    }
    const prompt = await Swal.fire({
      icon: "warning",
      title: "إلغاء الإذن؟",
      text: `${row?.employeeName || "الموظف"} - ${row?.permissionTypeName || ""}`,
      input: "textarea",
      inputLabel: "سبب الإلغاء",
      inputPlaceholder: "اكتب سبب الإلغاء...",
      showCancelButton: true,
      confirmButtonText: "إلغاء الإذن",
      cancelButtonText: "رجوع",
      confirmButtonColor: "#6b7280",
      reverseButtons: true
    });
    if (!prompt.isConfirmed) return;

    try {
      setActionGuid(row.permissionGuid);
      const response = await fetch(
        `${API_BASE_URL}/api/hr/permissions/${encodeURIComponent(row.permissionGuid)}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-User-Guid": actor.actorUserGuid
          },
          body: JSON.stringify({
            reason: String(prompt.value || "").trim() || null,
            ...actor
          })
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(result, "تعذر إلغاء الإذن"));
      await recalculateAttendance(result?.data?.employeeGuid, result?.data?.permissionDate);
      await loadRows();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر الإلغاء", text: e?.message || "حدث خطأ" });
    } finally {
      setActionGuid("");
    }
  };

  const statCards = useMemo(
    () => [
      ["إجمالي الطلبات", stats.totalCount, <AccessTimeRoundedIcon fontSize="small" />],
      ["تنتظر الموافقة", stats.pendingCount, <TimerOutlinedIcon fontSize="small" />],
      ["معتمدة", stats.approvedCount, <CheckCircleRoundedIcon fontSize="small" />],
      ["مرفوضة / ملغاة", stats.rejectedCount + stats.cancelledCount, <CloseRoundedIcon fontSize="small" />]
    ],
    [stats]
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box dir="rtl" sx={{ minHeight: "100vh", bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : bg }}>
      

      <PageContainer
        component="main"
        sx={uiLayout.withUiSx({
          
          ...navigationContentSx
        }, uiLayout.mobileHeaderSx)}
      >
        <Paper
          elevation={0}
          sx={{ p: 1.5, mb: 1, borderRadius: 3, bgcolor: primaryDark, color: "#fff" }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {!isDesktop && (
                <IconButton sx={{ color: "#fff" }} onClick={() => setMobileSidebarOpen(true)}>
                  <MenuRoundedIcon />
                </IconButton>
              )}
              <AccessTimeRoundedIcon />
              <Box>
                <Typography className="hr-page-title" sx={{ fontSize: { xs: 19, md: 24 }, fontWeight: 1000 }}>
                  أذونات الموظفين
                </Typography>
                <Typography sx={{ opacity: 0.82, fontSize: 12 }}>
                  متابعة الطلبات ومعرفة حالتها والجهة التي يوجد عندها الطلب الآن
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={0.8} justifyContent="flex-end" alignItems={{ xs: "stretch", sm: "center" }}>
              <Tooltip title="تحديث">
                <span>
                  <IconButton
                    disabled={loading}
                    onClick={() => Promise.all([loadLookups(), loadRows()])}
                    sx={{ bgcolor: "rgba(255,255,255,.12)", color: "#fff" }}
                  >
                    <RefreshRoundedIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <HrPermissionWorkflowManager />
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={openCreate}
                sx={uiLayout.withUiSx({ bgcolor: "#fff", color: primaryDark, fontWeight: 900, "&:hover": { bgcolor: "#edf7f2" } }, uiLayout.buttonSx)}
              >
                إذن جديد
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{ border: `1px solid ${border}`, borderRadius: 2.5, p: 1, mb: 1, bgcolor: "#fff" }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" },
              gap: 0.75
            }}
          >
            {statCards.map(([label, value, icon]) => (
              <Box
                key={label}
                sx={{
                  px: 1.15,
                  py: 0.85,
                  borderRadius: 2,
                  bgcolor: "#f8fbf9",
                  border: `1px solid ${border}`
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.8}>
                  <Box>
                    <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: 17 }}>{value}</Typography>
                  </Box>
                  <Box sx={{ color: primary, display: "flex" }}>{icon}</Box>
                </Stack>
              </Box>
            ))}
          </Box>
          <Typography sx={{ mt: 0.75, px: 0.25, fontSize: 11.5, color: "text.secondary" }}>
            اليوم: {stats.approvedTodayCount} طلب معتمد • إجمالي مدة الأذونات المعتمدة: {minutesText(stats.approvedMinutes)}
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: 2.5, p: 1.15, mb: 1 }}>
          <Stack spacing={0.9}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Box>
                <Typography sx={{ fontWeight: 950, color: primaryDark, fontSize: 13 }}>البحث والتصفية</Typography>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>حدد ما تحتاجه فقط ثم اضغط عرض.</Typography>
              </Box>
              <Button size="small" variant="text" onClick={clearFilters} sx={{ fontWeight: 850 }}>إعادة ضبط</Button>
            </Stack>

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" },
                gap: 0.9,
                alignItems: "end"
              }, uiLayout.formSectionSx)}
            >
              <TextField sx={uiLayout.formFieldSx}
                type="date"
                size="small"
                label="من تاريخ"
                value={filters.fromDate}
                onChange={(e) => setFilters((x) => ({ ...x, fromDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />
              <TextField sx={uiLayout.formFieldSx}
                type="date"
                size="small"
                label="إلى تاريخ"
                value={filters.toDate}
                onChange={(e) => setFilters((x) => ({ ...x, toDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />
              <FormControl sx={uiLayout.formFieldSx} size="small">
                <InputLabel>الحالة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الحالة"
                  value={filters.status}
                  onChange={(e) => setFilters((x) => ({ ...x, status: e.target.value }))}
                >
                  <MenuItem value="">كل الحالات</MenuItem>
                  {lookups.statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>{status.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={uiLayout.formFieldSx} size="small">
                <InputLabel>الفرع</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الفرع"
                  value={filters.branchGuid}
                  onChange={(e) => setFilters((x) => ({ ...x, branchGuid: e.target.value }))}
                >
                  <MenuItem value="">كل الفروع</MenuItem>
                  {lookups.branches.map((branch) => (
                    <MenuItem key={branch.branchGuid} value={branch.branchGuid}>{branch.branchName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={uiLayout.formFieldSx} size="small">
                <InputLabel>نوع الإذن</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="نوع الإذن"
                  value={filters.permissionType}
                  onChange={(e) => setFilters((x) => ({ ...x, permissionType: e.target.value }))}
                >
                  <MenuItem value="">كل الأنواع</MenuItem>
                  {lookups.permissionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                sx={uiLayout.formFieldSx}
                InputLabelProps={{ shrink: true }}
                size="small"
                label="بحث"
                placeholder="اسم الموظف، الكود أو رقم الإذن"
                value={filters.search}
                onChange={(e) => setFilters((x) => ({ ...x, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>
                  )
                }}
              />
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={0.7}>
              <Button variant="contained" onClick={applyFilters} sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 850, minWidth: 100 }, uiLayout.buttonSx)}>
                عرض النتائج
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        <Paper elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: 2.5, overflow: "hidden" }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260 }} spacing={1}>
              <CircularProgress size={34} />
              <Typography>جاري تحميل الأذونات...</Typography>
            </Stack>
          ) : rows.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240 }} spacing={1}>
              <DoNotDisturbAltRoundedIcon sx={{ fontSize: 44, color: "text.disabled" }} />
              <Typography sx={{ fontWeight: 800 }}>لا توجد أذونات في الفترة المحددة</Typography>
            </Stack>
          ) : (
            <TableContainer sx={uiLayout.withUiSx({ maxHeight: "calc(100vh - 350px)" }, uiLayout.tableContainerSx)}>
              <Table stickyHeader size="small" sx={{ minWidth: 1040 }}>
                <TableHead>
                  <TableRow>
                    {["الطلب", "الموظف", "الإذن", "السبب", "الحالة", "مسار الموافقة", "الإجراءات"].map((header) => (
                      <TableCell
                        key={header}
                        align="right"
                        sx={{ fontWeight: 1000, bgcolor: "#f1f7f4", whiteSpace: "nowrap" }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const meta = statusMeta(row.status);
                    const busy = actionGuid === row.permissionGuid;
                    return (
                      <TableRow key={row.permissionGuid} hover>
                        <TableCell sx={{ minWidth: 100 }}>
                          <Typography sx={{ fontWeight: 950, fontSize: 13 }}>#{row.permissionNumber}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: "text.secondary", whiteSpace: "nowrap" }}>
                            {formatDate(row.permissionDate)}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ minWidth: 185 }}>
                          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{row.employeeName}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                            كود {row.employeeCode || "-"} • {row.branchName || "بدون فرع"}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ minWidth: 170 }}>
                          <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>{row.permissionTypeName}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: "text.secondary", whiteSpace: "nowrap" }}>
                            {permissionTimeDescription(row)}
                            {Number(row.requestedMinutes || 0) > 0 ? ` • ${minutesText(row.requestedMinutes)}` : ""}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ minWidth: 180, maxWidth: 260 }}>
                          <Tooltip title={row.reason || "-"} arrow>
                            <Typography
                              sx={{
                                fontSize: 12.5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical"
                              }}
                            >
                              {row.reason || "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Chip size="small" label={meta.label} color={meta.color} sx={{ fontWeight: 850 }} />
                        </TableCell>

                        <TableCell sx={{ minWidth: 210 }}>
                          {row.status === "Pending" ? (
                            <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#fff8e8", border: "1px solid #f2dfae" }}>
                              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>الطلب موجود الآن عند</Typography>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 950 }}>
                                {row.currentApprovalRole || (row.currentApprovalStep ? `الخطوة ${row.currentApprovalStep}` : "المسؤول المباشر")}
                              </Typography>
                              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                                المسؤول: {row.currentApproverName || "يُحدد من الهيكل الإداري"}
                              </Typography>
                            </Box>
                          ) : (
                            <Box>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>
                                {row.status === "Approved"
                                  ? "اكتمل الاعتماد"
                                  : row.status === "Rejected"
                                    ? "تم رفض الطلب"
                                    : row.status === "Cancelled"
                                      ? "تم إلغاء الطلب"
                                      : "-"}
                              </Typography>
                              {row.decisionByName && (
                                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                                  آخر قرار بواسطة: {row.decisionByName}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </TableCell>

                        <TableCell sx={{ minWidth: 185 }}>
                          {busy ? (
                            <CircularProgress size={22} />
                          ) : (
                            <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {row.status !== "Approved" && row.status !== "Cancelled" && (
                                <Button sx={uiLayout.buttonSx} size="small" color="success" variant="contained" onClick={() => decidePermission(row, "Approved")}>اعتماد</Button>
                              )}
                              {row.status === "Pending" && (
                                <Button sx={uiLayout.buttonSx} size="small" color="error" variant="outlined" onClick={() => decidePermission(row, "Rejected")}>رفض</Button>
                              )}
                              {row.status !== "Cancelled" && (
                                <Button sx={uiLayout.buttonSx} size="small" color="inherit" variant="outlined" onClick={() => cancelPermission(row)}>إلغاء</Button>
                              )}
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ p: 1.2, borderTop: `1px solid ${border}` }}
          >
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>إجمالي النتائج: {totalCount}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={uiLayout.withUiSx({ minWidth: 85 }, uiLayout.formFieldSx)}>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  {[20, 30, 50, 100].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
              </FormControl>
              <Pagination
                count={Math.max(1, pageCount)}
                page={Math.min(page, Math.max(1, pageCount))}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
              />
            </Stack>
          </Stack>
        </Paper>
      </PageContainer>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 12px)",
              sm: "min(720px, calc(100% - 32px))",
              md: "min(780px, calc(100% - 48px))"
            },
            maxWidth: "780px !important",
            m: { xs: 0.75, sm: 2 },
            maxHeight: { xs: "94dvh", sm: "90vh" },
            borderRadius: { xs: 2.5, sm: 3 },
            overflow: "hidden",
            direction: "rtl"
          }
        }}
        dir="rtl"
      >
        <DialogTitle
          sx={{
            px: { xs: 1.4, sm: 2.2 },
            py: { xs: 1.15, sm: 1.45 },
            borderBottom: `1px solid ${border}`,
            background: "linear-gradient(180deg,#ffffff 0%,#fbfdfc 100%)"
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 1000, color: primaryDark, fontSize: { xs: 15, sm: 18 } }}>
                إضافة إذن موظف
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.2, fontSize: 11.5, lineHeight: 1.5 }}>
                يجب أن توجد وردية فعالة تغطي التاريخ والوقت، ويُطبق مسار الموافقات عند عدم الاعتماد المباشر.
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
              sx={{ flexShrink: 0, border: `1px solid ${border}`, borderRadius: 1.7 }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 1.25, sm: 2.2 },
            py: { xs: "14px !important", sm: "20px !important" },
            bgcolor: "#fbfdfc",
            overflowX: "hidden"
          }}
        >
          {lookupsLoading ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Stack spacing={1.25}>
              <Alert severity="info" sx={{ borderRadius: 2, py: 0.35 }}>
                لن يُقبل الإذن إذا لم يكن للموظف تكليف وردية فعال في هذا التاريخ أو إذا كان اليوم غير داخل أيام عمل الوردية.
              </Alert>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1.4fr .8fr" },
                  gap: 1.1,
                  alignItems: "start",
                  "& > *": { minWidth: 0 }
                }}
              >
                <Autocomplete
                  ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                  options={lookups.employees}
                  value={form.employee}
                  onChange={(_, value) => setForm((x) => ({ ...x, employee: value }))}
                  getOptionLabel={(option) =>
                    `${option?.employeeName || ""}${option?.employeeCode ? ` - ${option.employeeCode}` : ""}`
                  }
                  isOptionEqualToValue={(option, value) =>
                    option?.employeeGuid === value?.employeeGuid
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.employeeGuid}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>
                          {option.employeeName}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                          {option.branchName || "فرع غير محدد"} • كود {option.employeeCode || "-"}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      sx={uiLayout.formFieldSx}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      label="الموظف"
                      required
                    />
                  )}
                />

                <TextField
                  sx={uiLayout.formFieldSx}
                  size="small"
                  type="date"
                  label="تاريخ الإذن"
                  value={form.permissionDate}
                  onChange={(e) =>
                    setForm((x) => ({ ...x, permissionDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                  inputProps={{
                    dir: "ltr",
                    style: { direction: "ltr", unicodeBidi: "isolate" }
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.1,
                  alignItems: "start",
                  "& > *": { minWidth: 0 }
                }}
              >
                <FormControl sx={uiLayout.formFieldSx} fullWidth required size="small">
                  <InputLabel>نوع الإذن</InputLabel>
                  <Select
                    MenuProps={RTL_MENU_PROPS}
                    label="نوع الإذن"
                    value={form.permissionType}
                    onChange={(e) =>
                      setForm((x) => ({
                        ...x,
                        permissionType: Number(e.target.value),
                        fromTime: "",
                        toTime: ""
                      }))
                    }
                  >
                    {lookups.permissionTypes.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ minWidth: 0 }}>
                  {Number(form.permissionType) === 1 && (
                    <TextField
                      sx={uiLayout.formFieldSx}
                      fullWidth
                      size="small"
                      type="time"
                      label="السماح بالحضور حتى"
                      value={form.toTime}
                      onChange={(e) =>
                        setForm((x) => ({ ...x, toTime: e.target.value }))
                      }
                      InputLabelProps={{ shrink: true }}
                      required
                      inputProps={{
                        dir: "ltr",
                        style: { direction: "ltr", unicodeBidi: "isolate" }
                      }}
                    />
                  )}

                  {Number(form.permissionType) === 2 && (
                    <TextField
                      sx={uiLayout.formFieldSx}
                      fullWidth
                      size="small"
                      type="time"
                      label="السماح بالانصراف من"
                      value={form.fromTime}
                      onChange={(e) =>
                        setForm((x) => ({ ...x, fromTime: e.target.value }))
                      }
                      InputLabelProps={{ shrink: true }}
                      required
                      inputProps={{
                        dir: "ltr",
                        style: { direction: "ltr", unicodeBidi: "isolate" }
                      }}
                    />
                  )}

                  {Number(form.permissionType) === 3 && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                        gap: 0.8
                      }}
                    >
                      <TextField
                        sx={uiLayout.formFieldSx}
                        fullWidth
                        size="small"
                        type="time"
                        label="وقت الخروج"
                        value={form.fromTime}
                        onChange={(e) =>
                          setForm((x) => ({ ...x, fromTime: e.target.value }))
                        }
                        InputLabelProps={{ shrink: true }}
                        required
                        inputProps={{
                          dir: "ltr",
                          style: { direction: "ltr", unicodeBidi: "isolate" }
                        }}
                      />
                      <TextField
                        sx={uiLayout.formFieldSx}
                        fullWidth
                        size="small"
                        type="time"
                        label="وقت العودة"
                        value={form.toTime}
                        onChange={(e) =>
                          setForm((x) => ({ ...x, toTime: e.target.value }))
                        }
                        InputLabelProps={{ shrink: true }}
                        required
                        inputProps={{
                          dir: "ltr",
                          style: { direction: "ltr", unicodeBidi: "isolate" }
                        }}
                      />
                    </Box>
                  )}

                  {Number(form.permissionType) === 4 && (
                    <Alert severity="info" sx={{ py: 0.25, borderRadius: 1.8 }}>
                      إذن يوم كامل، بشرط أن يكون التاريخ يوم عمل فعليًا في وردية الموظف.
                    </Alert>
                  )}
                </Box>
              </Box>

              <TextField
                sx={uiLayout.formFieldSx}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                label="سبب الإذن"
                value={form.reason}
                onChange={(e) => setForm((x) => ({ ...x, reason: e.target.value }))}
                required
              />

              <TextField
                sx={uiLayout.formFieldSx}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="ملاحظات إضافية"
                value={form.notes}
                onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))}
              />

              <Paper
                variant="outlined"
                sx={{
                  px: 1,
                  py: 0.3,
                  borderRadius: 2,
                  borderColor: border,
                  bgcolor: "#fff"
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.autoApprove}
                      onChange={(e) =>
                        setForm((x) => ({ ...x, autoApprove: e.target.checked }))
                      }
                    />
                  }
                  label="اعتماد الإذن مباشرة عند الإنشاء"
                  sx={uiLayout.checkboxFieldSx}
                />
                {!form.autoApprove && (
                  <Typography
                    color="text.secondary"
                    sx={{ pr: 4.5, pb: 0.7, mt: -0.6, fontSize: 11 }}
                  >
                    سيتم تجميد مسار الموافقات المناسب للطلب عند الحفظ.
                  </Typography>
                )}
              </Paper>
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: { xs: 1.25, sm: 2.2 },
            py: { xs: 1, sm: 1.25 },
            gap: 0.75,
            borderTop: `1px solid ${border}`,
            bgcolor: "#fff",
            justifyContent: "flex-start"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            variant="contained"
            onClick={savePermission}
            disabled={saving || lookupsLoading}
            sx={uiLayout.withUiSx({
              bgcolor: primary,
              minWidth: 120,
              fontWeight: 900
            }, uiLayout.buttonSx)}
          >
            {saving ? <CircularProgress size={21} color="inherit" /> : "حفظ الإذن"}
          </Button>
          <Button
            sx={uiLayout.buttonSx}
            onClick={() => setCreateOpen(false)}
            disabled={saving}
          >
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}
