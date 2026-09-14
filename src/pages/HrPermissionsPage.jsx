import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
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
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
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
  "http://localhost:5258";



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

const getActor = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return {
      actorUserGuid: user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || null,
      actorName:
        user?.fullName ||
        user?.FullName ||
        user?.userName ||
        user?.UserName ||
        "مستخدم النظام"
    };
  } catch {
    return { actorUserGuid: null, actorName: "مستخدم النظام" };
  }
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
      if (form.toTime <= form.fromTime) return "وقت العودة يجب أن يكون بعد وقت الخروج";
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
      ["إجمالي الفترة", stats.totalCount, <AccessTimeRoundedIcon fontSize="small" />],
      ["قيد المراجعة", stats.pendingCount, <TimerOutlinedIcon fontSize="small" />],
      ["معتمد", stats.approvedCount, <CheckCircleRoundedIcon fontSize="small" />],
      ["مرفوض", stats.rejectedCount, <CloseRoundedIcon fontSize="small" />],
      ["معتمد اليوم", stats.approvedTodayCount, <EventAvailableRoundedIcon fontSize="small" />],
      ["مدة الأذونات", minutesText(stats.approvedMinutes), <TimerOutlinedIcon fontSize="small" />]
    ],
    [stats]
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box dir="rtl" sx={{ minHeight: "100vh", bgcolor: bg }}>
      

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
                <Typography sx={{ fontSize: { xs: 19, md: 24 }, fontWeight: 1000 }}>
                  أذونات الموظفين
                </Typography>
                <Typography sx={{ opacity: 0.78, fontSize: 12 }}>
                  إدارة التأخير، الانصراف المبكر، الخروج أثناء الدوام، والإذن ليوم كامل
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(3,1fr)", xl: "repeat(6,1fr)" },
            gap: 1,
            mb: 1
          }}
        >
          {statCards.map(([label, value, icon]) => (
            <Paper key={label} elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: 2.5, p: 1.2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{label}</Typography>
                  <Typography sx={{ fontWeight: 1000, fontSize: 19 }}>{value}</Typography>
                </Box>
                <Box sx={{ color: primary }}>{icon}</Box>
              </Stack>
            </Paper>
          ))}
        </Box>

        <Paper elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: 2.5, p: 1.2, mb: 1 }}>
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2,1fr)", xl: "1fr 1fr 1fr 1fr 1.6fr auto" },
              gap: 1,
              alignItems: "center"
            }, uiLayout.formGridSx)}
          >
            <TextField sx={uiLayout.formFieldSx}
              type="date"
              size="small"
              label="من تاريخ"
              value={filters.fromDate}
              onChange={(e) => setFilters((x) => ({ ...x, fromDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField sx={uiLayout.formFieldSx}
              type="date"
              size="small"
              label="إلى تاريخ"
              value={filters.toDate}
              onChange={(e) => setFilters((x) => ({ ...x, toDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <FormControl sx={uiLayout.formFieldSx} size="small">
              <InputLabel>الفرع</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الفرع"
                value={filters.branchGuid}
                onChange={(e) => setFilters((x) => ({ ...x, branchGuid: e.target.value }))}
              >
                <MenuItem value="">كل الفروع</MenuItem>
                {lookups.branches.map((b) => (
                  <MenuItem key={b.branchGuid} value={b.branchGuid}>{b.branchName}</MenuItem>
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
                {lookups.permissionTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              placeholder="بحث باسم الموظف أو الكود أو رقم الإذن..."
              value={filters.search}
              onChange={(e) => setFilters((x) => ({ ...x, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>
                )
              }}
            />
            <Stack sx={uiLayout.filterBarSx} direction="row" spacing={0.7}>
              <FormControl size="small" sx={uiLayout.withUiSx({ minWidth: 125 }, uiLayout.formFieldSx)}>
                <InputLabel>الحالة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الحالة"
                  value={filters.status}
                  onChange={(e) => setFilters((x) => ({ ...x, status: e.target.value }))}
                >
                  <MenuItem value="">كل الحالات</MenuItem>
                  {lookups.statuses.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={applyFilters} sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 800 }, uiLayout.buttonSx)}>
                عرض
              </Button>
              <Button variant="outlined" onClick={clearFilters} sx={uiLayout.withUiSx({ minWidth: 55 }, uiLayout.buttonSx)}>مسح</Button>
            </Stack>
          </Box>
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
            <TableContainer sx={uiLayout.withUiSx({ maxHeight: "calc(100vh - 390px)" }, uiLayout.tableContainerSx)}>
              <Table stickyHeader size="small" sx={{ minWidth: 1350 }}>
                <TableHead>
                  <TableRow>
                    {["#", "الموظف", "الفرع", "التاريخ", "نوع الإذن", "الوقت", "السبب", "الحالة", "المرحلة الحالية", "مقدم الطلب", "الإجراءات"].map((h) => (
                      <TableCell key={h} align="right" sx={{ fontWeight: 1000, bgcolor: "#f1f7f4", whiteSpace: "nowrap" }}>
                        {h}
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
                        <TableCell>{row.permissionNumber}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{row.employeeName}</Typography>
                          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>كود {row.employeeCode || "-"}</Typography>
                        </TableCell>
                        <TableCell>{row.branchName || "-"}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.permissionDate)}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{row.permissionTypeName}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography sx={{ fontWeight: 800, fontSize: 12.5 }}>{permissionTimeDescription(row)}</Typography>
                          {Number(row.requestedMinutes || 0) > 0 && (
                            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{minutesText(row.requestedMinutes)}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>{row.reason || "-"}</TableCell>
                        <TableCell><Chip size="small" label={meta.label} color={meta.color} sx={{ fontWeight: 800 }} /></TableCell>
                        <TableCell sx={{ minWidth: 150 }}>
                          {row.status === "Pending" && row.currentApprovalStep ? (
                            <>
                              <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{row.currentApprovalRole || `الخطوة ${row.currentApprovalStep}`}</Typography>
                              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{row.currentApproverName || "حسب الهيكل الإداري"}</Typography>
                            </>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{row.requestedByName || "-"}</Typography>
                          {row.decisionByName && row.status !== "Pending" && (
                            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>القرار: {row.decisionByName}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 220 }}>
                          {busy ? (
                            <CircularProgress size={22} />
                          ) : (
                            <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
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
        dir="rtl"
      >
        <DialogTitle sx={{ fontWeight: 1000, color: primaryDark }}>إضافة إذن موظف</DialogTitle>
        <DialogContent dividers>
          {lookupsLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
          ) : (
            <Box sx={uiLayout.withUiSx({ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, pt: 0.5 }, uiLayout.formGridSx)}>
              <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                options={lookups.employees}
                value={form.employee}
                onChange={(_, value) => setForm((x) => ({ ...x, employee: value }))}
                getOptionLabel={(option) => `${option?.employeeName || ""}${option?.employeeCode ? ` - ${option.employeeCode}` : ""}`}
                isOptionEqualToValue={(option, value) => option?.employeeGuid === value?.employeeGuid}
                renderOption={(props, option) => (
                  <li {...props} key={option.employeeGuid}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{option.employeeName}</Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{option.branchName} • كود {option.employeeCode || "-"}</Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} label="الموظف" required />}
              />
              <TextField sx={uiLayout.formFieldSx}
                type="date"
                label="تاريخ الإذن"
                value={form.permissionDate}
                onChange={(e) => setForm((x) => ({ ...x, permissionDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <FormControl sx={uiLayout.formFieldSx} fullWidth required>
                <InputLabel>نوع الإذن</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="نوع الإذن"
                  value={form.permissionType}
                  onChange={(e) => setForm((x) => ({ ...x, permissionType: Number(e.target.value), fromTime: "", toTime: "" }))}
                >
                  {lookups.permissionTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>

              <Box sx={uiLayout.formGridSx}>
                {Number(form.permissionType) === 1 && (
                  <TextField sx={uiLayout.formFieldSx}
                    fullWidth type="time" label="السماح بالحضور حتى" value={form.toTime}
                    onChange={(e) => setForm((x) => ({ ...x, toTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }} required
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                )}
                {Number(form.permissionType) === 2 && (
                  <TextField sx={uiLayout.formFieldSx}
                    fullWidth type="time" label="السماح بالانصراف من" value={form.fromTime}
                    onChange={(e) => setForm((x) => ({ ...x, fromTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }} required
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                )}
                {Number(form.permissionType) === 3 && (
                  <Stack sx={uiLayout.formGridSx} direction="row" spacing={1}>
                    <TextField sx={uiLayout.formFieldSx}
                      fullWidth type="time" label="وقت الخروج" value={form.fromTime}
                      onChange={(e) => setForm((x) => ({ ...x, fromTime: e.target.value }))}
                      InputLabelProps={{ shrink: true }} required
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <TextField sx={uiLayout.formFieldSx}
                      fullWidth type="time" label="وقت العودة" value={form.toTime}
                      onChange={(e) => setForm((x) => ({ ...x, toTime: e.target.value }))}
                      InputLabelProps={{ shrink: true }} required
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  </Stack>
                )}
                {Number(form.permissionType) === 4 && (
                  <Alert severity="info">سيتم اعتبار اليوم إذن يوم كامل داخل الحضور والانصراف بعد الاعتماد.</Alert>
                )}
              </Box>

              <TextField InputLabelProps={{ shrink: true }}
                fullWidth label="سبب الإذن" value={form.reason}
                onChange={(e) => setForm((x) => ({ ...x, reason: e.target.value }))}
                required sx={uiLayout.withUiSx({ gridColumn: { md: "1 / -1" } }, uiLayout.formFieldSx)}
              />
              <TextField InputLabelProps={{ shrink: true }}
                fullWidth multiline minRows={2} label="ملاحظات إضافية" value={form.notes}
                onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))}
                sx={uiLayout.withUiSx({ gridColumn: { md: "1 / -1" } }, uiLayout.formFieldSx)}
              />
              <FormControlLabel
                control={<Checkbox checked={form.autoApprove} onChange={(e) => setForm((x) => ({ ...x, autoApprove: e.target.checked }))} />}
                label="اعتماد الإذن مباشرة عند الإنشاء"
                sx={uiLayout.withUiSx({ gridColumn: { md: "1 / -1" } }, uiLayout.checkboxFieldSx)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={uiLayout.withUiSx({ p: 1.5 }, uiLayout.dialogActionsSx)}>
          <Button sx={uiLayout.buttonSx} onClick={() => setCreateOpen(false)} disabled={saving}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={savePermission}
            disabled={saving || lookupsLoading}
            sx={uiLayout.withUiSx({ bgcolor: primary, minWidth: 120, fontWeight: 900 }, uiLayout.buttonSx)}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : "حفظ الإذن"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}
