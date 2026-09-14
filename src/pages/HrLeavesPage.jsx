import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

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
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";

import {
  AddRounded as AddRoundedIcon,
  BeachAccessRounded as BeachAccessRoundedIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
  CloseRounded as CloseRoundedIcon,
  EditRounded as EditRoundedIcon,
  EventRounded as EventRoundedIcon,
  FolderRounded as FolderRoundedIcon,
  HistoryRounded as HistoryRoundedIcon,
  RefreshRounded as RefreshRoundedIcon,
  SearchRounded as SearchRoundedIcon,
  TuneRounded as TuneRoundedIcon
} from "@mui/icons-material";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";


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
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const bg = "#f5f8f6";

// ============================================================
// اتجاهات شاشة الإجازات مستقلة
// ============================================================
const LEAVES_PAGE_DIRECTION = "rtl";
const LEAVES_TEXT_ALIGN = "right";
const LEAVES_GRID_DIRECTION = "rtl";
const LEAVES_GRID_TEXT_ALIGN = "right";
const LEAVES_DATE_DIRECTION = "ltr";

const todayValue = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const currentYear = () => new Date().getFullYear();

const toDateInput = (value) =>
  value ? String(value).slice(0, 10) : "";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const apiErrorText = (result, fallback, response) => {
  const parts = [
    result?.message,
    result?.error,
    result?.detail,
    result?.hint
  ].filter(Boolean);

  if (parts.length) return parts.join(" • ");

  if (response) {
    return `${fallback} (HTTP ${response.status}${response.statusText ? ` - ${response.statusText}` : ""})`;
  }

  return fallback;
};

const getActor = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    return {
      actorUserGuid:
        user?.guid ||
        user?.Guid ||
        null,
      actorName:
        user?.fullName ||
        user?.FullName ||
        user?.userName ||
        user?.UserName ||
        "مستخدم النظام"
    };
  } catch {
    return {
      actorUserGuid: null,
      actorName: "مستخدم النظام"
    };
  }
};

const statusInfo = (status) => {
  switch (status) {
    case "Pending":
      return ["معلق (قديم)", "warning"];
    case "PendingApproval":
      return ["بانتظار الموافقة", "warning"];
    case "Returned":
      return ["مرتجع للتعديل", "secondary"];
    case "Approved":
      return ["معتمد", "success"];
    case "Rejected":
      return ["مرفوض", "error"];
    case "Cancelled":
      return ["ملغي", "default"];
    default:
      return [status || "-", "default"];
  }
};

const emptyRequest = () => ({
  employee: null,
  leaveTypeGuid: "",
  fromDate: todayValue(),
  toDate: todayValue(),
  dayPart: 0,
  reason: "",
  attachment: null
});

const emptyType = () => ({
  leaveTypeGuid: "",
  code: "",
  leaveTypeName: "",
  isPaid: true,
  requiresBalance: false,
  countMode: 1,
  allowsHalfDay: false,
  requiresAttachment: false,
  minNoticeDays: "",
  maxDaysPerRequest: "",
  defaultAnnualEntitlement: "",
  maxCarryForwardDays: "",
  sortOrder: 0,
  isActive: true,
  notes: ""
});

const emptyHoliday = () => ({
  holidayGuid: "",
  holidayDate: todayValue(),
  holidayName: "",
  branchGuid: "",
  isActive: true,
  notes: ""
});

export default function HrLeavesPage() {

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [tab, setTab] = useState(0);

  const [myApprovals, setMyApprovals] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState({
    leaveTypes: [],
    jobTitles: [],
    departments: [],
    branches: [],
    employees: [],
    policies: []
  });
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    policyGuid: null,
    leaveTypeGuid: "",
    sourceJobTitleGuid: "",
    branchGuid: "",
    notes: "",
    steps: []
  });
  const [workflowLeaveFilter, setWorkflowLeaveFilter] = useState("all");

  const [lookups, setLookups] = useState({
    employees: [],
    leaveTypes: [],
    branches: []
  });

  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState([]);
  const [requestStats, setRequestStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
    approvedDaysThisYear: 0
  });
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageCount, setRequestPageCount] =
    useState(0);
  const [requestFilters, setRequestFilters] = useState({
    search: "",
    branchGuid: "",
    leaveTypeGuid: "",
    status: "all",
    fromDate: "",
    toDate: ""
  });

  const [requestOpen, setRequestOpen] =
    useState(false);
  const [requestForm, setRequestForm] =
    useState(emptyRequest());
  const [requestSaving, setRequestSaving] =
    useState(false);
  const [calculation, setCalculation] =
    useState(null);
  const [calculating, setCalculating] =
    useState(false);

  const [balances, setBalances] = useState([]);
  const [balancePage, setBalancePage] = useState(1);
  const [balancePageCount, setBalancePageCount] =
    useState(0);
  const [balanceYear, setBalanceYear] =
    useState(currentYear());
  const [balanceSearch, setBalanceSearch] =
    useState("");
  const [balanceTypeGuid, setBalanceTypeGuid] =
    useState("");
  const [balanceOpen, setBalanceOpen] =
    useState(false);
  const [balanceRow, setBalanceRow] =
    useState(null);
  const [balanceForm, setBalanceForm] =
    useState({
      openingBalance: 0,
      accruedDays: 0,
      carriedForwardDays: 0,
      adjustmentDays: 0,
      notes: "",
      reason: ""
    });
  const [balanceSaving, setBalanceSaving] =
    useState(false);

  const [types, setTypes] = useState([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeForm, setTypeForm] =
    useState(emptyType());
  const [typeSaving, setTypeSaving] =
    useState(false);

  const [holidays, setHolidays] = useState([]);
  const [holidayYear, setHolidayYear] =
    useState(currentYear());
  const [holidayOpen, setHolidayOpen] =
    useState(false);
  const [holidayForm, setHolidayForm] =
    useState(emptyHoliday());
  const [holidaySaving, setHolidaySaving] =
    useState(false);

  const [initOpen, setInitOpen] = useState(false);
  const [initSaving, setInitSaving] = useState(false);
  const [initForm, setInitForm] = useState({
    balanceYear: currentYear(), leaveTypeGuid: "", days: 0,
    branchGuid: "", employee: null, overwriteExisting: false,
    reason: "تهيئة رصيد بداية السنة"
  });




  const loadLookups = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/lookups`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل القوائم"
        );
      }

      setLookups({
        employees: Array.isArray(result?.employees)
          ? result.employees
          : [],
        leaveTypes: Array.isArray(
          result?.leaveTypes
        )
          ? result.leaveTypes
          : [],
        branches: Array.isArray(result?.branches)
          ? result.branches
          : []
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل الإجازات",
        text: error?.message || "حدث خطأ"
      });
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(requestPage),
        pageSize: "20"
      });

      Object.entries(requestFilters).forEach(
        ([key, value]) => {
          if (value && value !== "all") {
            params.set(key, String(value));
          }
        }
      );

      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل طلبات الإجازات"
        );
      }

      setRequests(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
      setRequestPageCount(
        Number(result?.pageCount || 0)
      );
      setRequestStats({
        pendingCount:
          Number(result?.stats?.pendingCount || 0),
        approvedCount:
          Number(result?.stats?.approvedCount || 0),
        rejectedCount:
          Number(result?.stats?.rejectedCount || 0),
        cancelledCount:
          Number(result?.stats?.cancelledCount || 0),
        approvedDaysThisYear:
          Number(
            result?.stats?.approvedDaysThisYear || 0
          )
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل الطلبات",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setLoading(false);
    }
  }, [requestPage, requestFilters]);

  const loadBalances = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        year: String(balanceYear),
        page: String(balancePage),
        pageSize: "30"
      });

      if (balanceSearch.trim()) {
        params.set("search", balanceSearch.trim());
      }

      if (balanceTypeGuid) {
        params.set(
          "leaveTypeGuid",
          balanceTypeGuid
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/balances?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل الأرصدة"
        );
      }

      setBalances(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
      setBalancePageCount(
        Number(result?.pageCount || 0)
      );
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل الأرصدة",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setLoading(false);
    }
  }, [
    balanceYear,
    balancePage,
    balanceSearch,
    balanceTypeGuid
  ]);

  const loadTypes = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/types?includeInactive=true`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل أنواع الإجازات"
        );
      }

      setTypes(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل الأنواع",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHolidays = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/holidays?year=${holidayYear}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل العطلات"
        );
      }

      setHolidays(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل العطلات",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setLoading(false);
    }
  }, [holidayYear]);


  const loadMyApprovals = useCallback(async () => {
    const actor = getActor();

    if (!actor.actorUserGuid) {
      setMyApprovals([]);
      return;
    }

    setWorkflowLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/workflow/my-approvals?actorUserGuid=${encodeURIComponent(actor.actorUserGuid)}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiErrorText(result, "تعذر تحميل الموافقات", response)
        );
      }

      setMyApprovals(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل الموافقات",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  const loadWorkflowSettings = useCallback(async () => {
    setWorkflowLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/workflow/config`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiErrorText(
            result,
            "تعذر تحميل إعدادات مسارات الإجازات",
            response
          )
        );
      }

      setWorkflowConfig({
        leaveTypes: Array.isArray(result?.leaveTypes)
          ? result.leaveTypes
          : [],
        jobTitles: Array.isArray(result?.jobTitles)
          ? result.jobTitles
          : [],
        departments: Array.isArray(result?.departments)
          ? result.departments
          : [],
        branches: Array.isArray(result?.branches)
          ? result.branches
          : [],
        employees: Array.isArray(result?.employees)
          ? result.employees
          : [],
        policies: Array.isArray(result?.policies)
          ? result.policies
          : []
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل إعدادات الموافقات",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  const decideWorkflow = async (row, action) => {
    const actor = getActor();

    if (!actor.actorUserGuid) {
      return Swal.fire({
        icon: "warning",
        title: "تعذر تحديد المستخدم الحالي"
      });
    }

    const ask = await Swal.fire({
      title:
        action === "reject"
          ? "رفض طلب الإجازة"
          : `الموافقة - ${row.currentApprovalRole || "الخطوة الحالية"}`,
      input: "textarea",
      inputPlaceholder:
        action === "reject"
          ? "سبب الرفض..."
          : "ملاحظات الموافقة - اختياري",
      showCancelButton: true,
      confirmButtonText:
        action === "reject" ? "رفض" : "موافقة",
      cancelButtonText: "إلغاء",
      inputValidator: (value) =>
        action === "reject" && !String(value || "").trim()
          ? "سبب الرفض مطلوب"
          : undefined
    });

    if (!ask.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/${row.leaveRequestGuid}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: String(ask.value || "").trim(),
            actorUserGuid: actor.actorUserGuid,
            actorName: actor.actorName
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiErrorText(result, "تعذر تنفيذ الإجراء", response)
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم",
        text: result?.message || "تم تنفيذ الإجراء"
      });

      await Promise.all([loadMyApprovals(), loadRequests()]);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تنفيذ الإجراء",
        text: error?.message || "حدث خطأ"
      });
    }
  };

  const getWorkflowJobTitle = (guid) =>
    workflowConfig.jobTitles.find(
      (item) => item.jobTitleGuid === guid
    ) || null;

  const getWorkflowDepartment = (guid) =>
    workflowConfig.departments.find(
      (item) => item.departmentGuid === guid
    ) || null;

  const getWorkflowEmployee = (guid) =>
    workflowConfig.employees.find(
      (x) => x.employeeGuid === guid
    ) || null;

  const getWorkflowBranch = (guid) =>
    workflowConfig.branches.find(
      (x) => x.branchGuid === guid
    ) || null;

  const getStepDepartmentGuid = (step) => {
    const source = getWorkflowJobTitle(policyForm.sourceJobTitleGuid);

    if (step.approverType === "SOURCE_DEPARTMENT_MANAGER" || step.approverType === "SOURCE_DEPARTMENT_PEOPLE") {
      return source?.departmentGuid || "";
    }

    if (step.approverType === "TARGET_DEPARTMENT_MANAGER" || step.approverType === "TARGET_DEPARTMENT_PEOPLE") {
      return step.targetDepartmentGuid || "";
    }

    if (step.approverType === "EXECUTIVE_MANAGER") {
      return workflowConfig.departments.find((x) => Number(x.departmentCode) === 1)?.departmentGuid || "";
    }

    if (step.approverType === "HR_MANAGER") {
      return workflowConfig.departments.find((x) => Number(x.departmentCode) === 6)?.departmentGuid || "";
    }

    if (step.approverType === "SAME_BRANCH_JOB_TITLE") {
      return getWorkflowJobTitle(step.targetJobTitleGuid)?.departmentGuid || "";
    }

    return "";
  };

  const getStepSelectedApprovers = (step) => {
    const ids = Array.isArray(step.approverUserGuids)
      ? step.approverUserGuids
      : step.approverUserGuid ? [step.approverUserGuid] : [];
    const idSet = new Set(ids.filter(Boolean));
    return (workflowConfig.employees || []).filter((employee) => idSet.has(employee.employeeGuid));
  };

  const getStepCandidates = (step) => {
    const all = workflowConfig.employees || [];
    const requiredDepartmentGuid = getStepDepartmentGuid(step);
    let candidates = requiredDepartmentGuid
      ? all.filter((x) => x.departmentGuid === requiredDepartmentGuid)
      : [];

    if (step.approverType === "SAME_BRANCH_JOB_TITLE") {
      const target = getWorkflowJobTitle(step.targetJobTitleGuid);
      candidates = candidates.filter((x) => {
        const sameJob = target?.legacyJobCode === null || target?.legacyJobCode === undefined
          ? x.jobTitleGuid === target?.jobTitleGuid
          : Number(x.legacyJobCode) === Number(target.legacyJobCode);
        const sameBranch = policyForm.branchGuid ? x.branchGuid === policyForm.branchGuid : true;
        return sameJob && sameBranch;
      });
    }

    return candidates.map((x) => ({ ...x, workflowRecommended: true }));
  };

  const getStepAutoApproverText = (step) => {
    const selected = getStepSelectedApprovers(step);
    if (selected.length) {
      return `محدد بالاسم: ${selected.map((person) => person.employeeName).join(" / ")}`;
    }

    const source = getWorkflowJobTitle(policyForm.sourceJobTitleGuid);

    if (step.approverType === "ORG_DIRECT_MANAGER") {
      return "يتحدد تلقائياً من المسؤول المباشر في الهيكل الإداري الموحد";
    }
    if (step.approverType === "ORG_PARENT_MANAGER") {
      return "يتحدد تلقائياً من أقرب مسؤول في الوحدة الأعلى";
    }
    if (step.approverType === "ORG_ROOT_MANAGER") {
      return "يتحدد تلقائياً من مسؤولي أعلى الهيكل";
    }
    if (step.approverType === "SOURCE_DEPARTMENT_MANAGER") {
      return source?.departmentName
        ? `يتحدد من مسؤول وحدة قسم ${source.departmentName} في الهيكل الموحد`
        : "يتحدد من مسؤول القسم في الهيكل الموحد";
    }
    if (step.approverType === "TARGET_DEPARTMENT_MANAGER") {
      const d = getWorkflowDepartment(step.targetDepartmentGuid);
      return d?.departmentName
        ? `يتحدد من مسؤول وحدة قسم ${d.departmentName} في الهيكل الموحد`
        : "يتحدد من مسؤول القسم المحدد في الهيكل الموحد";
    }
    if (step.approverType === "SOURCE_DEPARTMENT_PEOPLE") {
      return source?.departmentName ? `اختر شخصاً أو أكثر من قسم ${source.departmentName}` : "اختر المسمى أولاً لتحديد القسم";
    }
    if (step.approverType === "TARGET_DEPARTMENT_PEOPLE") {
      const d = getWorkflowDepartment(step.targetDepartmentGuid);
      return d?.departmentName ? `اختر شخصاً أو أكثر من قسم ${d.departmentName}` : "اختر القسم أولاً";
    }
    if (step.approverType === "EXECUTIVE_MANAGER") {
      return "يتحدد من مسؤول جذر الهيكل الإداري الموحد";
    }
    if (step.approverType === "HR_MANAGER") {
      return "يتحدد من مسؤول وحدة الموارد البشرية في الهيكل الإداري الموحد";
    }
    if (step.approverType === "SAME_BRANCH_JOB_TITLE") {
      const target = getWorkflowJobTitle(step.targetJobTitleGuid);
      if (!target) return "اختر المسمى المستهدف";
      const candidates = getStepCandidates(step);
      if (!policyForm.branchGuid) return candidates.length ? `حسب فرع مقدم الطلب: ${target.jobTitleName}. ويمكنك تحديد أكثر من اسم من نفس القسم.` : `لا يوجد مرشحون على ${target.jobTitleName}`;
      if (candidates.length === 1) return `تلقائي: ${candidates[0].employeeName}`;
      if (candidates.length > 1) return `يوجد ${candidates.length} مرشحين — اختر واحداً أو أكثر`;
      return `لا يوجد ${target.jobTitleName} في الفرع المحدد`;
    }
    return "تلقائي";
  };

  const openNewPolicy = () => {
    setPolicyForm({
      policyGuid: null,
      leaveTypeGuid: "",
      sourceJobTitleGuid: "",
      branchGuid: "",
      notes: "",
      steps: [
        {
          approverType: "SOURCE_DEPARTMENT_MANAGER",
          targetJobTitleGuid: "",
          targetDepartmentGuid: "",
          approverUserGuid: "",
          approverUserGuids: [],
          stepName: "مدير القسم"
        },
        {
          approverType: "HR_MANAGER",
          targetJobTitleGuid: "",
          targetDepartmentGuid: "",
          approverUserGuid: "",
          approverUserGuids: [],
          stepName: "الموارد البشرية"
        }
      ]
    });
    setPolicyOpen(true);
  };

  const openEditPolicy = (row) => {
    setPolicyForm({
      policyGuid: row.policyGuid,
      leaveTypeGuid: row.leaveTypeGuid || "",
      sourceJobTitleGuid: row.sourceJobTitleGuid || "",
      branchGuid: row.branchGuid || "",
      notes: row.notes || "",
      steps: (row.steps || []).map((step) => ({
        approverType: step.approverType,
        targetJobTitleGuid: step.targetJobTitleGuid || "",
        targetDepartmentGuid: step.targetDepartmentGuid || "",
        approverUserGuid: step.approverUserGuid || "",
        approverUserGuids:
          Array.isArray(step.approvers) && step.approvers.length
            ? step.approvers.map((x) => x.approverUserGuid).filter(Boolean)
            : step.approverUserGuid ? [step.approverUserGuid] : [],
        stepName: step.stepName || ""
      }))
    });
    setPolicyOpen(true);
  };

  const addPolicyStep = () => {
    setPolicyForm((value) => ({
      ...value,
      steps: [
        ...value.steps,
        {
          approverType: "SOURCE_DEPARTMENT_MANAGER",
          targetJobTitleGuid: "",
          targetDepartmentGuid: "",
          approverUserGuid: "",
          approverUserGuids: [],
          stepName: "مدير القسم"
        }
      ]
    }));
  };

  const updatePolicyStep = (index, patch) => {
    setPolicyForm((value) => ({
      ...value,
      steps: value.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step
      )
    }));
  };

  const removePolicyStep = (index) => {
    setPolicyForm((value) => ({
      ...value,
      steps: value.steps.filter((_, stepIndex) => stepIndex !== index)
    }));
  };

  const movePolicyStep = (index, direction) => {
    setPolicyForm((value) => {
      const next = [...value.steps];
      const target = index + direction;

      if (target < 0 || target >= next.length) return value;

      [next[index], next[target]] = [next[target], next[index]];
      return { ...value, steps: next };
    });
  };

  const savePolicy = async () => {
    if (!policyForm.leaveTypeGuid) {
      return Swal.fire({ icon: "warning", title: "اختر نوع الإجازة" });
    }

    if (!policyForm.sourceJobTitleGuid) {
      return Swal.fire({ icon: "warning", title: "اختر المسمى الوظيفي" });
    }

    if (!policyForm.steps.length) {
      return Swal.fire({ icon: "warning", title: "أضف خطوة موافقة" });
    }

    const actor = getActor();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/workflow/policy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policyGuid: policyForm.policyGuid || null,
            leaveTypeGuid: policyForm.leaveTypeGuid,
            sourceJobTitleGuid: policyForm.sourceJobTitleGuid,
            branchGuid: policyForm.branchGuid || null,
            notes: policyForm.notes || "",
            actorUserGuid: actor.actorUserGuid,
            steps: policyForm.steps.map((step) => ({
              approverType: step.approverType,
              targetJobTitleGuid: step.targetJobTitleGuid || null,
              targetDepartmentGuid: step.targetDepartmentGuid || null,
              approverUserGuid:
                (Array.isArray(step.approverUserGuids) && step.approverUserGuids[0]) ||
                step.approverUserGuid || null,
              approverUserGuids: Array.isArray(step.approverUserGuids)
                ? step.approverUserGuids
                : step.approverUserGuid ? [step.approverUserGuid] : [],
              stepName: step.stepName || ""
            }))
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiErrorText(result, "تعذر حفظ المسار", response)
        );
      }

      setPolicyOpen(false);
      await loadWorkflowSettings();

      await Swal.fire({
        icon: "success",
        title: "تم حفظ مسار الموافقات",
        timer: 1200,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر حفظ المسار",
        text: error?.message || "حدث خطأ"
      });
    }
  };

  const disablePolicy = async (row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "تعطيل المسار؟",
      text: `${row.leaveTypeName} - ${row.sourceJobTitleName}`,
      showCancelButton: true,
      confirmButtonText: "تعطيل",
      cancelButtonText: "إلغاء"
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/workflow/policy/${row.policyGuid}`,
        { method: "DELETE" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiErrorText(result, "تعذر تعطيل المسار", response)
        );
      }

      await loadWorkflowSettings();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تعطيل المسار",
        text: error?.message || "حدث خطأ"
      });
    }
  };

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);



  useEffect(() => {
    if (tab === 0) loadRequests();
    if (tab === 1) loadMyApprovals();
    if (tab === 2) loadBalances();
    if (tab === 3) loadTypes();
    if (tab === 4) loadHolidays();
    if (tab === 5) loadWorkflowSettings();
}, [
    tab,
    loadRequests,
    loadMyApprovals,
    loadBalances,
    loadTypes,
    loadHolidays,
    loadWorkflowSettings]);




  const initializeBalances = async () => {
    if (!initForm.leaveTypeGuid) return Swal.fire({icon:"warning",title:"اختر نوع الإجازة"});
    setInitSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/leaves/balances/initialize`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          balanceYear:Number(initForm.balanceYear), leaveTypeGuid:initForm.leaveTypeGuid,
          days:Number(initForm.days), branchGuid:initForm.branchGuid || null,
          employeeGuid:initForm.employee?.employeeGuid || null,
          overwriteExisting:initForm.overwriteExisting, reason:initForm.reason,
          actorUserGuid:getActor().actorUserGuid
        })
      });
      const result=await response.json().catch(()=>null);
      if(!response.ok) throw new Error(result?.message || "تعذر تهيئة الأرصدة");
      setInitOpen(false); await loadBalances();
      await Swal.fire({icon:"success",title:"تمت التهيئة",text:`جديد: ${result?.data?.created||0} • تحديث: ${result?.data?.updated||0} • متروك كما هو: ${result?.data?.skipped||0}`});
    } catch(error){ await Swal.fire({icon:"error",title:"تعذر التهيئة",text:error?.message||"حدث خطأ"}); }
    finally{ setInitSaving(false); }
  };


  const selectedType = useMemo(
    () =>
      lookups.leaveTypes.find(
        (x) =>
          x.leaveTypeGuid ===
          requestForm.leaveTypeGuid
      ) || null,
    [lookups.leaveTypes, requestForm.leaveTypeGuid]
  );

  useEffect(() => {
    if (
      !requestOpen ||
      !requestForm.employee?.employeeGuid ||
      !requestForm.leaveTypeGuid ||
      !requestForm.fromDate ||
      !requestForm.toDate
    ) {
      setCalculation(null);
      return;
    }

    const timer = window.setTimeout(
      async () => {
        setCalculating(true);

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/hr/leaves/calculate-days`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                employeeGuid:
                  requestForm.employee.employeeGuid,
                leaveTypeGuid:
                  requestForm.leaveTypeGuid,
                fromDate:
                  requestForm.fromDate,
                toDate:
                  requestForm.toDate,
                dayPart:
                  Number(requestForm.dayPart)
              })
            }
          );

          const result = await response
            .json()
            .catch(() => null);

          if (!response.ok) {
            setCalculation({
              error:
                result?.message ||
                "تعذر حساب الأيام"
            });
            return;
          }

          setCalculation(result);
        } catch (error) {
          setCalculation({
            error:
              error?.message ||
              "تعذر حساب الأيام"
          });
        } finally {
          setCalculating(false);
        }
      },
      350
    );

    return () => window.clearTimeout(timer);
  }, [
    requestOpen,
    requestForm.employee,
    requestForm.leaveTypeGuid,
    requestForm.fromDate,
    requestForm.toDate,
    requestForm.dayPart
  ]);

  const submitRequest = async () => {
    if (
      !requestForm.employee ||
      !requestForm.leaveTypeGuid
    ) {
      await Swal.fire({
        icon: "warning",
        title: "بيانات ناقصة",
        text: "اختر الموظف ونوع الإجازة"
      });
      return;
    }

    if (calculation?.error) {
      await Swal.fire({
        icon: "warning",
        title: "راجع الفترة",
        text: calculation.error
      });
      return;
    }

    setRequestSaving(true);

    try {
      const actor = getActor();
      const form = new FormData();

      form.append(
        "employeeGuid",
        requestForm.employee.employeeGuid
      );
      form.append(
        "leaveTypeGuid",
        requestForm.leaveTypeGuid
      );
      form.append(
        "fromDate",
        requestForm.fromDate
      );
      form.append(
        "toDate",
        requestForm.toDate
      );
      form.append(
        "dayPart",
        String(requestForm.dayPart)
      );

      if (requestForm.reason.trim()) {
        form.append(
          "reason",
          requestForm.reason.trim()
        );
      }

      if (requestForm.attachment) {
        form.append(
          "attachment",
          requestForm.attachment
        );
      }

      if (actor.actorUserGuid) {
        form.append(
          "actorUserGuid",
          actor.actorUserGuid
        );
      }

      form.append(
        "actorName",
        actor.actorName
      );

      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/request`,
        {
          method: "POST",
          body: form
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر إنشاء الطلب"
        );
      }

      setRequestOpen(false);
      setRequestForm(emptyRequest());
      setCalculation(null);
      setRequestPage(1);
      await loadRequests();

      await Swal.fire({
        icon: "success",
        title: "تم إرسال الطلب",
        text:
          `رقم الطلب: ${result?.data?.requestNumber ?? "-"} • الأيام: ${result?.data?.requestedDays ?? "-"}`
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر إرسال الطلب",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setRequestSaving(false);
    }
  };

  const decideRequest = async (
    row,
    action
  ) => {
    let notes = "";

    if (action !== "approve") {
      const result = await Swal.fire({
        title:
          action === "reject"
            ? "رفض طلب الإجازة"
            : "إلغاء طلب الإجازة",
        input: "textarea",
        inputPlaceholder:
          action === "reject"
            ? "اكتب سبب الرفض..."
            : "اكتب سبب الإلغاء...",
        showCancelButton: true,
        confirmButtonText:
          action === "reject"
            ? "رفض الطلب"
            : "إلغاء الطلب",
        cancelButtonText: "رجوع",
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "السبب مطلوب"
            : undefined
      });

      if (!result.isConfirmed) return;
      notes = String(result.value).trim();
    } else {
      const result = await Swal.fire({
        icon: "question",
        title: "اعتماد الإجازة؟",
        text:
          `${row.employeeName} • ${row.leaveTypeName} • ${row.requestedDays} يوم`,
        input: "textarea",
        inputPlaceholder:
          "ملاحظات الاعتماد - اختياري",
        showCancelButton: true,
        confirmButtonText: "اعتماد",
        cancelButtonText: "رجوع"
      });

      if (!result.isConfirmed) return;
      notes = String(result.value || "");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/${row.leaveRequestGuid}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            notes,
            ...getActor()
          })
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تنفيذ العملية"
        );
      }

      await loadRequests();

      await Swal.fire({
        icon: "success",
        title: "تم",
        text: result?.message || "تمت العملية"
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التنفيذ",
        text: error?.message || "حدث خطأ"
      });
    }
  };

  const openAttachment = (row) => {
    window.open(
      `${API_BASE_URL}/api/hr/leaves/${row.leaveRequestGuid}/attachment`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openBalance = (row) => {
    setBalanceRow(row);
    setBalanceForm({
      openingBalance:
        Number(row.openingBalance || 0),
      accruedDays:
        Number(row.accruedDays || 0),
      carriedForwardDays:
        Number(row.carriedForwardDays || 0),
      adjustmentDays:
        Number(row.adjustmentDays || 0),
      notes: "",
      reason: ""
    });
    setBalanceOpen(true);
  };

  const saveBalance = async () => {
    if (!balanceRow) return;

    setBalanceSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/balances/adjust`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            employeeGuid:
              balanceRow.employeeGuid,
            leaveTypeGuid:
              balanceRow.leaveTypeGuid,
            balanceYear,
            openingBalance:
              Number(balanceForm.openingBalance),
            accruedDays:
              Number(balanceForm.accruedDays),
            carriedForwardDays:
              Number(
                balanceForm.carriedForwardDays
              ),
            adjustmentDays:
              Number(balanceForm.adjustmentDays),
            notes:
              balanceForm.notes.trim() || null,
            reason:
              balanceForm.reason.trim(),
            actorUserGuid:
              getActor().actorUserGuid
          })
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حفظ الرصيد"
        );
      }

      setBalanceOpen(false);
      await loadBalances();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر حفظ الرصيد",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setBalanceSaving(false);
    }
  };

  const openType = (row = null) => {
    setTypeForm(
      row
        ? {
            ...emptyType(),
            ...row,
            minNoticeDays:
              row.minNoticeDays ?? "",
            maxDaysPerRequest:
              row.maxDaysPerRequest ?? "",
            defaultAnnualEntitlement:
              row.defaultAnnualEntitlement ??
              "",
            maxCarryForwardDays:
              row.maxCarryForwardDays ?? ""
          }
        : emptyType()
    );
    setTypeOpen(true);
  };

  const saveType = async () => {
    setTypeSaving(true);

    try {
      const actor = getActor();
      const editing = Boolean(
        typeForm.leaveTypeGuid
      );

      const payload = {
        code: typeForm.code.trim(),
        leaveTypeName:
          typeForm.leaveTypeName.trim(),
        isPaid: typeForm.isPaid,
        requiresBalance:
          typeForm.requiresBalance,
        countMode:
          Number(typeForm.countMode),
        allowsHalfDay:
          typeForm.allowsHalfDay,
        requiresAttachment:
          typeForm.requiresAttachment,
        minNoticeDays:
          typeForm.minNoticeDays === ""
            ? null
            : Number(typeForm.minNoticeDays),
        maxDaysPerRequest:
          typeForm.maxDaysPerRequest === ""
            ? null
            : Number(
                typeForm.maxDaysPerRequest
              ),
        defaultAnnualEntitlement:
          typeForm.defaultAnnualEntitlement ===
          ""
            ? null
            : Number(
                typeForm.defaultAnnualEntitlement
              ),
        maxCarryForwardDays:
          typeForm.maxCarryForwardDays === ""
            ? null
            : Number(
                typeForm.maxCarryForwardDays
              ),
        sortOrder:
          Number(typeForm.sortOrder || 0),
        isActive: typeForm.isActive,
        notes:
          typeForm.notes.trim() || null,
        actorUserGuid:
          actor.actorUserGuid
      };

      const response = await fetch(
        editing
          ? `${API_BASE_URL}/api/hr/leaves/types/${typeForm.leaveTypeGuid}`
          : `${API_BASE_URL}/api/hr/leaves/types`,
        {
          method:
            editing ? "PUT" : "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حفظ نوع الإجازة"
        );
      }

      setTypeOpen(false);
      await Promise.all([
        loadTypes(),
        loadLookups()
      ]);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setTypeSaving(false);
    }
  };

  const openHoliday = (row = null) => {
    setHolidayForm(
      row
        ? {
            ...emptyHoliday(),
            ...row,
            holidayDate:
              toDateInput(row.holidayDate),
            branchGuid:
              row.branchGuid || ""
          }
        : emptyHoliday()
    );
    setHolidayOpen(true);
  };

  const saveHoliday = async () => {
    setHolidaySaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/holidays`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            ...holidayForm,
            branchGuid:
              holidayForm.branchGuid || null,
            actorUserGuid:
              getActor().actorUserGuid
          })
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حفظ العطلة"
        );
      }

      setHolidayOpen(false);
      await loadHolidays();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر حفظ العطلة",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setHolidaySaving(false);
    }
  };

  const deleteHoliday = async (row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "حذف العطلة؟",
      text: row.holidayName,
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "رجوع"
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/holidays/${row.holidayGuid}`,
        { method: "DELETE" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حذف العطلة"
        );
      }

      await loadHolidays();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحذف",
        text: error?.message || "حدث خطأ"
      });
    }
  };

  const statCards = [
    ["طلبات معلقة", requestStats.pendingCount],
    ["معتمدة", requestStats.approvedCount],
    ["مرفوضة", requestStats.rejectedCount],
    ["ملغاة", requestStats.cancelledCount],
    [
      "أيام معتمدة هذا العام",
      requestStats.approvedDaysThisYear
    ]
  ];

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      dir={LEAVES_PAGE_DIRECTION}
      sx={{
        minHeight: "100vh",
        bgcolor: bg,
        textAlign: LEAVES_TEXT_ALIGN
      }}
    >
      

      <Box
        component="main"
        sx={{
          p: {
            xs: 1,
            md: 1.5
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.4,
            borderRadius: 3,
            bgcolor: primaryDark,
            color: "#fff",
            mb: 1
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row"
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              md: "center"
            }}
            spacing={1}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <BeachAccessRoundedIcon />
              <Box>
                <Typography
                  sx={{
                    fontWeight: 1000,
                    fontSize: {
                      xs: 19,
                      md: 24
                    }
                  }}
                >
                  الإجازات
                </Typography>
                <Typography
                  sx={{
                    opacity: .75,
                    fontSize: 11
                  }}
                >
                  الطلبات ومسار موافقة المدير المباشر والموارد البشرية والأرصدة والعطلات
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={.6}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  setRequestForm(
                    emptyRequest()
                  );
                  setCalculation(null);
                  setRequestOpen(true);
                }}
                sx={{
                  bgcolor: "#fff",
                  color: primaryDark,
                  fontWeight: 950,
                  "&:hover": {
                    bgcolor: "#f1fff8"
                  }
                }}
              >
                طلب إجازة جديد
              </Button>

              <Tooltip title="تحديث">
                <IconButton
                  onClick={() => {
                    loadLookups();
                    if (tab === 0) loadRequests();
                    if (tab === 1) loadMyApprovals();
                    if (tab === 2) loadBalances();
                    if (tab === 3) loadTypes();
                    if (tab === 4) loadHolidays();
                    if (tab === 5) loadWorkflowSettings();
}}
                  sx={{ color: "#fff" }}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.6,
            border: `1px solid ${border}`,
            overflow: "hidden",
            mb: 1
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value) =>
              setTab(value)
            }
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              px: { xs: 0.5, md: 1 },
              "& .MuiTabs-scroller": {
                overflowX: "auto !important"
              },
              "& .MuiTabs-flexContainer": {
                gap: { xs: 0.25, md: 0.75 }
              },
              "& .MuiTab-root": {
                fontWeight: 900,
                minHeight: 50,
                minWidth: { xs: 112, md: 122 },
                px: { xs: 1.5, md: 2.2 },
                py: 1.1,
                whiteSpace: "nowrap",
                borderRadius: 1.5
              },
              "& .MuiTab-root:nth-of-type(2), & .MuiTab-root:nth-of-type(6)": {
                minWidth: { xs: 148, md: 165 },
                px: { xs: 2, md: 2.7 }
              },
              "& .MuiTab-root.Mui-selected": {
                bgcolor: "rgba(5,117,70,0.07)"
              }
            }}
          >
            <Tab label="طلبات الإجازات" />
            <Tab label={`بانتظار موافقتي${myApprovals.length ? ` (${myApprovals.length})` : ""}`} />
            <Tab label="الأرصدة" />
            <Tab label="أنواع الإجازات" />
            <Tab label="العطلات الرسمية" />
            <Tab label="إعدادات الموافقات" />
            
          </Tabs>
        </Paper>

        {tab === 0 && (
          <Stack spacing={1}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs:
                    "repeat(2,minmax(0,1fr))",
                  lg:
                    "repeat(5,minmax(0,1fr))"
                },
                gap: .7
              }}
            >
              {statCards.map(
                ([label, value]) => (
                  <Paper
                    key={label}
                    elevation={0}
                    sx={{
                      p: 1,
                      borderRadius: 2.3,
                      border:
                        `1px solid ${border}`,
                      bgcolor: "#fff"
                    }}
                  >
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: 10 }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 21,
                        color: primaryDark,
                        fontWeight: 1000
                      }}
                    >
                      {value}
                    </Typography>
                  </Paper>
                )
              )}
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: 2.5,
                border: `1px solid ${border}`
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  lg: "row"
                }}
                spacing={.7}
              >
                <TextField
                  size="small"
                  fullWidth
                  value={
                    requestFilters.search
                  }
                  onChange={(e) => {
                    setRequestPage(1);
                    setRequestFilters(
                      (current) => ({
                        ...current,
                        search: e.target.value
                      })
                    );
                  }}
                  placeholder="بحث بالموظف أو الكود أو رقم الطلب..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon />
                      </InputAdornment>
                    )
                  }}
                />

                <FormControl
                  size="small"
                  sx={{ minWidth: 190 }}
                >
                  <InputLabel>
                    الحالة
                  </InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS}
                    label="الحالة"
                    value={
                      requestFilters.status
                    }
                    onChange={(e) => {
                      setRequestPage(1);
                      setRequestFilters(
                        (current) => ({
                          ...current,
                          status: e.target.value
                        })
                      );
                    }}
                  >
                    <MenuItem value="all">
                      كل الحالات
                    </MenuItem>
                    <MenuItem value="Pending">
                      معلق
                    </MenuItem>
                    <MenuItem value="Approved">
                      معتمد
                    </MenuItem>
                    <MenuItem value="Rejected">
                      مرفوض
                    </MenuItem>
                    <MenuItem value="Cancelled">
                      ملغي
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  sx={{ minWidth: 210 }}
                >
                  <InputLabel>
                    نوع الإجازة
                  </InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS}
                    label="نوع الإجازة"
                    value={
                      requestFilters.leaveTypeGuid
                    }
                    onChange={(e) => {
                      setRequestPage(1);
                      setRequestFilters(
                        (current) => ({
                          ...current,
                          leaveTypeGuid:
                            e.target.value
                        })
                      );
                    }}
                  >
                    <MenuItem value="">
                      كل الأنواع
                    </MenuItem>
                    {lookups.leaveTypes.map(
                      (type) => (
                        <MenuItem
                          key={
                            type.leaveTypeGuid
                          }
                          value={
                            type.leaveTypeGuid
                          }
                        >
                          {type.leaveTypeName}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  sx={{ minWidth: 220 }}
                >
                  <InputLabel>
                    الفرع
                  </InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS}
                    label="الفرع"
                    value={
                      requestFilters.branchGuid
                    }
                    onChange={(e) => {
                      setRequestPage(1);
                      setRequestFilters(
                        (current) => ({
                          ...current,
                          branchGuid:
                            e.target.value
                        })
                      );
                    }}
                  >
                    <MenuItem value="">
                      كل الفروع
                    </MenuItem>
                    {lookups.branches.map(
                      (branch) => (
                        <MenuItem
                          key={
                            branch.branchGuid
                          }
                          value={
                            branch.branchGuid
                          }
                        >
                          {branch.branchName}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.6,
                border: `1px solid ${border}`,
                overflow: "hidden"
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 350,
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table
                    size="small"
                    sx={{
                      direction:
                        LEAVES_GRID_DIRECTION
                    }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: "#f3f8f5"
                        }}
                      >
                        {[
                          "الطلب",
                          "الموظف",
                          "النوع",
                          "الفترة",
                          "الأيام",
                          "الحالة",
                          "المرفق",
                          "الإجراءات"
                        ].map((title) => (
                          <TableCell
                            key={title}
                            align="right"
                            sx={{
                              fontWeight: 950
                            }}
                          >
                            {title}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {requests.map((row) => {
                        const [
                          statusLabel,
                          statusColor
                        ] = statusInfo(
                          row.status
                        );

                        return (
                          <TableRow
                            key={
                              row.leaveRequestGuid
                            }
                            hover
                          >
                            <TableCell>
                              <Typography
                                sx={{
                                  fontWeight: 950
                                }}
                              >
                                #{row.requestNumber}
                              </Typography>
                              <Typography
                                color="text.secondary"
                                sx={{
                                  fontSize: 9.5
                                }}
                              >
                                {formatDateTime(
                                  row.submittedAt
                                )}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography
                                sx={{
                                  fontWeight: 900
                                }}
                              >
                                {row.employeeName}
                              </Typography>
                              <Typography
                                color="text.secondary"
                                sx={{
                                  fontSize: 9.5
                                }}
                              >
                                #{row.employeeCode}
                                {" • "}
                                {row.branchName}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography
                                sx={{
                                  fontWeight: 850
                                }}
                              >
                                {row.leaveTypeName}
                              </Typography>
                              {!row.isPaid && (
                                <Chip
                                  size="small"
                                  label="بدون راتب"
                                  variant="outlined"
                                  sx={{
                                    mt: .2,
                                    height: 20,
                                    fontSize: 9
                                  }}
                                />
                              )}
                            </TableCell>

                            <TableCell
                              sx={{
                                direction:
                                  LEAVES_DATE_DIRECTION
                              }}
                            >
                              {formatDate(
                                row.fromDate
                              )}
                              {" → "}
                              {formatDate(
                                row.toDate
                              )}
                            </TableCell>

                            <TableCell>
                              <strong>
                                {row.requestedDays}
                              </strong>
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                label={
                                  statusLabel
                                }
                                color={
                                  statusColor
                                }
                                sx={{
                                  fontWeight: 900
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              {row.attachmentOriginalName ? (
                                <Button
                                  size="small"
                                  startIcon={
                                    <FolderRoundedIcon />
                                  }
                                  onClick={() =>
                                    openAttachment(
                                      row
                                    )
                                  }
                                >
                                  فتح
                                </Button>
                              ) : (
                                "-"
                              )}
                            </TableCell>

                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={.4}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                {row.status ===
                                  "Pending" && (
                                  <>
                                    <Button
                                      size="small"
                                      color="success"
                                      variant="contained"
                                      onClick={() =>
                                        decideRequest(
                                          row,
                                          "approve"
                                        )
                                      }
                                    >
                                      اعتماد
                                    </Button>
                                    <Button
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      onClick={() =>
                                        decideRequest(
                                          row,
                                          "reject"
                                        )
                                      }
                                    >
                                      رفض
                                    </Button>
                                  </>
                                )}

                                {(row.status ===
                                  "Pending" ||
                                  row.status ===
                                    "Approved") && (
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() =>
                                      decideRequest(
                                        row,
                                        "cancel"
                                      )
                                    }
                                  >
                                    إلغاء
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {!requests.length && (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                          >
                            <Alert severity="info">
                              لا توجد طلبات ضمن الفلتر الحالي.
                            </Alert>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {requestPageCount > 1 && (
                <Stack
                  direction="row"
                  justifyContent="center"
                  sx={{ p: 1 }}
                >
                  <Pagination
                    page={requestPage}
                    count={requestPageCount}
                    onChange={(_, value) =>
                      setRequestPage(value)
                    }
                    color="primary"
                  />
                </Stack>
              )}
            </Paper>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={1}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: 2.5,
                border: `1px solid ${border}`
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  md: "row"
                }}
                spacing={.7}
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder="بحث بالموظف..."
                  value={balanceSearch}
                  onChange={(e) => {
                    setBalancePage(1);
                    setBalanceSearch(
                      e.target.value
                    );
                  }}
                />

                <TextField
                  size="small"
                  type="number"
                  label="السنة"
                  value={balanceYear}
                  onChange={(e) => {
                    setBalancePage(1);
                    setBalanceYear(
                      Number(e.target.value)
                    );
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  sx={{ width: 130 }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <FormControl
                  size="small"
                  sx={{ minWidth: 220 }}
                >
                  <InputLabel>
                    نوع الإجازة
                  </InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS}
                    label="نوع الإجازة"
                    value={balanceTypeGuid}
                    onChange={(e) => {
                      setBalancePage(1);
                      setBalanceTypeGuid(
                        e.target.value
                      );
                    }}
                  >
                    <MenuItem value="">
                      كل الأنواع ذات الرصيد
                    </MenuItem>
                    {lookups.leaveTypes
                      .filter(
                        (x) =>
                          x.requiresBalance
                      )
                      .map((type) => (
                        <MenuItem
                          key={
                            type.leaveTypeGuid
                          }
                          value={
                            type.leaveTypeGuid
                          }
                        >
                          {type.leaveTypeName}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<TuneRoundedIcon />}
                  onClick={() => setInitOpen(true)}
                  sx={{ bgcolor: primary, fontWeight: 900, whiteSpace: "nowrap" }}
                >
                  تهيئة أرصدة الموظفين
                </Button>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.6,
                border: `1px solid ${border}`,
                overflow: "hidden"
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 300,
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: "#f3f8f5"
                        }}
                      >
                        {[
                          "الموظف",
                          "نوع الإجازة",
                          "افتتاحي",
                          "مكتسب",
                          "مرحّل",
                          "تسويات",
                          "مستخدم",
                          "المتاح",
                          ""
                        ].map((title) => (
                          <TableCell
                            key={title}
                            sx={{
                              fontWeight: 950
                            }}
                          >
                            {title}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {balances.map((row) => (
                        <TableRow
                          key={`${row.employeeGuid}-${row.leaveTypeGuid}`}
                          hover
                        >
                          <TableCell>
                            <strong>
                              {row.employeeName}
                            </strong>
                            <Typography
                              color="text.secondary"
                              sx={{
                                fontSize: 9.5
                              }}
                            >
                              {row.branchName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {row.leaveTypeName}
                          </TableCell>
                          <TableCell>
                            {row.openingBalance}
                          </TableCell>
                          <TableCell>
                            {row.accruedDays}
                          </TableCell>
                          <TableCell>
                            {
                              row.carriedForwardDays
                            }
                          </TableCell>
                          <TableCell>
                            {row.adjustmentDays}
                          </TableCell>
                          <TableCell>
                            {row.usedDays}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={
                                Number(
                                  row.availableDays
                                ) > 0
                                  ? "success"
                                  : "default"
                              }
                              label={
                                row.availableDays
                              }
                              sx={{
                                fontWeight: 950
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() =>
                                openBalance(row)
                              }
                            >
                              تعديل الرصيد
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {balancePageCount > 1 && (
                <Stack
                  alignItems="center"
                  sx={{ p: 1 }}
                >
                  <Pagination
                    count={balancePageCount}
                    page={balancePage}
                    onChange={(_, value) =>
                      setBalancePage(value)
                    }
                  />
                </Stack>
              )}
            </Paper>
          </Stack>
        )}

        {tab === 3 && (
          <Stack spacing={1}>
            <Stack
              direction="row"
              justifyContent="flex-end"
            >
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => openType()}
                sx={{
                  bgcolor: primary,
                  fontWeight: 900
                }}
              >
                نوع إجازة جديد
              </Button>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.6,
                border: `1px solid ${border}`,
                overflow: "hidden"
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: "#f3f8f5"
                      }}
                    >
                      {[
                        "الكود",
                        "النوع",
                        "الأجر",
                        "الرصيد",
                        "الاحتساب",
                        "نصف يوم",
                        "مرفق",
                        "الحالة",
                        ""
                      ].map((title) => (
                        <TableCell
                          key={title}
                          sx={{
                            fontWeight: 950
                          }}
                        >
                          {title}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {types.map((row) => (
                      <TableRow
                        key={
                          row.leaveTypeGuid
                        }
                        hover
                      >
                        <TableCell>
                          {row.code}
                        </TableCell>
                        <TableCell>
                          <strong>
                            {row.leaveTypeName}
                          </strong>
                        </TableCell>
                        <TableCell>
                          {row.isPaid
                            ? "مدفوعة"
                            : "بدون راتب"}
                        </TableCell>
                        <TableCell>
                          {row.requiresBalance
                            ? "يخصم من رصيد"
                            : "بدون رصيد"}
                        </TableCell>
                        <TableCell>
                          {Number(
                            row.countMode
                          ) === 1
                            ? "أيام العمل"
                            : "تقويمية"}
                        </TableCell>
                        <TableCell>
                          {row.allowsHalfDay
                            ? "نعم"
                            : "لا"}
                        </TableCell>
                        <TableCell>
                          {row.requiresAttachment
                            ? "مطلوب"
                            : "اختياري"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              row.isActive
                                ? "نشط"
                                : "متوقف"
                            }
                            color={
                              row.isActive
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() =>
                              openType(row)
                            }
                          >
                            <EditRoundedIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}

        {tab === 4 && (
          <Stack spacing={1}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: 2.5,
                border: `1px solid ${border}`
              }}
            >
              <Stack
                direction="row"
                spacing={.7}
                alignItems="center"
                justifyContent="space-between"
              >
                <TextField
                  size="small"
                  type="number"
                  label="السنة"
                  value={holidayYear}
                  onChange={(e) =>
                    setHolidayYear(
                      Number(e.target.value)
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                  sx={{ width: 140 }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() =>
                    openHoliday()
                  }
                  sx={{
                    bgcolor: primary,
                    fontWeight: 900
                  }}
                >
                  إضافة عطلة
                </Button>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.6,
                border: `1px solid ${border}`,
                overflow: "hidden"
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: "#f3f8f5"
                      }}
                    >
                      {[
                        "التاريخ",
                        "العطلة",
                        "الفرع",
                        "الحالة",
                        ""
                      ].map((title) => (
                        <TableCell
                          key={title}
                          sx={{
                            fontWeight: 950
                          }}
                        >
                          {title}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holidays.map((row) => (
                      <TableRow
                        key={row.holidayGuid}
                      >
                        <TableCell>
                          {formatDate(
                            row.holidayDate
                          )}
                        </TableCell>
                        <TableCell>
                          <strong>
                            {row.holidayName}
                          </strong>
                        </TableCell>
                        <TableCell>
                          {row.branchName}
                        </TableCell>
                        <TableCell>
                          {row.isActive
                            ? "نشطة"
                            : "متوقفة"}
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={.3}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                openHoliday(row)
                              }
                            >
                              <EditRoundedIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                deleteHoliday(row)
                              }
                            >
                              <CloseRoundedIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}

                    {!holidays.length && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                        >
                          <Alert severity="info">
                            لا توجد عطلات مسجلة لهذه السنة.
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}
        {tab === 1 && (
          <Paper
            elevation={0}
            sx={{
              width:"100%",
              maxWidth:"100%",
              minWidth:0,
              boxSizing:"border-box",
              border:`1px solid ${border}`,
              borderRadius:2.6,
              overflow:"hidden",
              p:{xs:1,md:1.4}
            }}
          >
            <Box sx={{p:1.4,borderBottom:`1px solid ${border}`}}>
              <Typography sx={{fontWeight:950,fontSize:15}}>طلبات بانتظار موافقتي</Typography>
              <Typography color="text.secondary" sx={{fontSize:11}}>
                يظهر لك الطلب عندما تصل الموافقة إلى خطوتك فقط، وبعد الموافقة ينتقل تلقائيًا للخطوة التالية.
              </Typography>
            </Box>
            {workflowLoading ? (
              <Box sx={{p:5,textAlign:"center"}}><CircularProgress size={28}/></Box>
            ) : myApprovals.length === 0 ? (
              <Box sx={{p:5,textAlign:"center"}}><Typography color="text.secondary">لا توجد طلبات بانتظار موافقتك حاليًا</Typography></Box>
            ) : (
              <TableContainer sx={{width:"100%",maxWidth:"100%",overflowX:"auto"}}>
                <Table size="small" sx={{direction:LEAVES_GRID_DIRECTION,minWidth:820}}>
                  <TableHead><TableRow>
                    <TableCell>الطلب</TableCell><TableCell>الموظف</TableCell><TableCell>النوع</TableCell>
                    <TableCell>الفترة</TableCell><TableCell>الأيام</TableCell><TableCell>المرحلة</TableCell><TableCell align="center">الإجراء</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {myApprovals.map(row=>{
                      const [label,color]=statusInfo(row.status);
                      return <TableRow key={row.leaveRequestGuid} hover>
                        <TableCell>#{row.requestNumber}</TableCell>
                        <TableCell><Typography sx={{fontWeight:900,fontSize:12}}>{row.employeeName}</Typography><Typography color="text.secondary" sx={{fontSize:10}}>{row.employeeCode}</Typography></TableCell>
                        <TableCell>{row.leaveTypeName}</TableCell>
                        <TableCell sx={{direction:LEAVES_DATE_DIRECTION,textAlign:"center"}}>{formatDate(row.fromDate)} - {formatDate(row.toDate)}</TableCell>
                        <TableCell>{row.requestedDays}</TableCell>
                        <TableCell><Chip size="small" label={label} color={color}/></TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={.5} justifyContent="center">
                            <Button size="small" variant="contained" color="success" onClick={()=>decideWorkflow(row,"approve")}>موافقة</Button>
                            <Button size="small" variant="outlined" color="error" onClick={()=>decideWorkflow(row,"reject")}>رفض</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>;
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {tab === 5 && (
          <Stack
            spacing={1.4}
            sx={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              px: { xs: 0.25, md: 0.75 },
              pb: 1
            }}
          >
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <b>هنا لا يتم إنشاء أقسام ولا تعيين مديرين.</b>{" "}
              مدير القسم يُقرأ من شاشة <b>إدارة الأقسام</b>،
              وربط المسمى بالقسم يُقرأ من شاشة <b>الوظائف والمسميات الوظيفية</b>.
              هنا تحدد فقط مسار كل مسمى وظيفي لكل نوع إجازة.
            </Alert>

            <Paper elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: 2.6, p: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 1
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 950, fontSize: 15 }}>
                    مسارات الموافقة
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                    مثال: مدرب ← مشرف فرع في نفس الفرع ← مدير قسم الإشراف العام ← الموارد البشرية
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <FormControl size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>نوع الإجازة</InputLabel>
                    <Select
                  MenuProps={RTL_MENU_PROPS}
                      label="نوع الإجازة"
                      value={workflowLeaveFilter}
                      onChange={(e) => setWorkflowLeaveFilter(e.target.value)}
                    >
                      <MenuItem value="all">كل أنواع الإجازات</MenuItem>
                      {workflowConfig.leaveTypes.map((type) => (
                        <MenuItem key={type.leaveTypeGuid} value={type.leaveTypeGuid}>
                          {type.leaveTypeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNewPolicy}>
                    إضافة مسار
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: 2.6, overflow: "hidden" }}>
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{minWidth:1320}}>
                  <TableHead>
                    <TableRow>
                      <TableCell>نوع الإجازة</TableCell>
                      <TableCell>المسمى الوظيفي</TableCell>
                      <TableCell>القسم</TableCell>
                      <TableCell>نطاق الفرع</TableCell>
                      <TableCell>مسار الموافقة بالأسماء</TableCell>
                      <TableCell>الحالة</TableCell>
                      <TableCell align="center">الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workflowConfig.policies
                      .filter((row) => workflowLeaveFilter === "all" || row.leaveTypeGuid === workflowLeaveFilter)
                      .map((row) => (
                        <TableRow key={row.policyGuid} hover>
                          <TableCell><Typography sx={{fontWeight:900,fontSize:12}}>{row.leaveTypeName}</Typography></TableCell>
                          <TableCell>
                            <Typography sx={{fontWeight:900,fontSize:12}}>{row.sourceJobTitleName}</Typography>
                            {row.sourceLegacyJobCode !== null && row.sourceLegacyJobCode !== undefined && (
                              <Typography color="text.secondary" sx={{fontSize:10}}>Legacy: {row.sourceLegacyJobCode}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{fontWeight:800,fontSize:12}}>{row.sourceDepartmentName || "غير مربوط"}</Typography>
                            <Typography color="text.secondary" sx={{fontSize:10}}>المدير الحالي: {row.sourceDepartmentManagerName || "غير محدد"}</Typography>
                          </TableCell>
                          <TableCell>
                            {row.branchGuid
                              ? <Chip size="small" color="info" label={row.branchName || "فرع محدد"}/>
                              : <Chip size="small" variant="outlined" label="كل الفروع"/>}
                          </TableCell>
                          <TableCell sx={{minWidth:520}}>
                            <Stack direction="row" spacing={.5} flexWrap="wrap" useFlexGap alignItems="center">
                              {(row.steps || []).map((step,index) => {
                                let personText = Array.isArray(step.approvers) && step.approvers.length
                                  ? step.approvers.map((x) => x.approverUserName || x.approverUserCode).filter(Boolean).join(" / ")
                                  : step.approverUserName || "";
                                if (!personText && step.approverType === "SOURCE_DEPARTMENT_MANAGER") personText = row.sourceDepartmentManagerName || "مدير القسم - تلقائي";
                                if (!personText && step.approverType === "TARGET_DEPARTMENT_MANAGER") personText = workflowConfig.departments.find((d) => d.departmentGuid === step.targetDepartmentGuid)?.managerName || "مدير القسم - تلقائي";
                                if (!personText && step.approverType === "SOURCE_DEPARTMENT_PEOPLE") personText = "أشخاص محددون من قسم المسمى";
                                if (!personText && step.approverType === "TARGET_DEPARTMENT_PEOPLE") personText = "أشخاص محددون من القسم";
                                if (!personText && step.approverType === "EXECUTIVE_MANAGER") personText = workflowConfig.departments.find((d) => Number(d.departmentCode) === 1)?.managerName || "المدير التنفيذي - تلقائي";
                                if (!personText && step.approverType === "HR_MANAGER") personText = workflowConfig.departments.find((d) => Number(d.departmentCode) === 6)?.managerName || "الموارد البشرية - تلقائي";
                                if (!personText && step.approverType === "SAME_BRANCH_JOB_TITLE") personText = row.branchGuid ? "يتحدد من الفرع" : "يتحدد حسب فرع الموظف";
                                return (
                                  <React.Fragment key={step.policyStepGuid || `${row.policyGuid}-${index}`}>
                                    <Chip size="small" color={(Array.isArray(step.approvers) && step.approvers.length) || step.approverUserGuid ? "success" : "default"} label={`${index+1}. ${step.stepName || "-"} — ${personText}`}/>
                                    {index < (row.steps || []).length-1 && <Typography component="span" color="text.secondary" sx={{fontWeight:900}}>←</Typography>}
                                  </React.Fragment>
                                );
                              })}
                            </Stack>
                          </TableCell>
                          <TableCell><Chip size="small" label={row.isActive ? "فعال" : "متوقف"} color={row.isActive ? "success" : "default"}/></TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={.5} justifyContent="center">
                              <Button size="small" onClick={() => openEditPolicy(row)}>تعديل</Button>
                              {row.isActive && <Button size="small" color="error" onClick={() => disablePolicy(row)}>تعطيل</Button>}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!workflowLoading && workflowConfig.policies.filter((row) => workflowLeaveFilter === "all" || row.leaveTypeGuid === workflowLeaveFilter).length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center" sx={{py:5}}><Typography color="text.secondary">لا توجد مسارات معرفة للفلتر الحالي</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}

      </Box>

        <Dialog
        sx={RTL_DIALOG_SX}
          open={policyOpen}
          onClose={() => setPolicyOpen(false)}
          fullWidth
          maxWidth="lg"
          PaperProps={{ sx: { direction: LEAVES_PAGE_DIRECTION, maxHeight: "92vh" } }}
        >
          <DialogTitle sx={{ fontWeight: 950 }}>
            {policyForm.policyGuid ? "تعديل مسار موافقات الإجازة" : "إعداد مسار موافقات جديد"}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1.5}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                اختر <b>نوع الإجازة + المسمى الوظيفي</b>. القسم ومديره سيظهران تلقائيًا من الإعدادات الموجودة بالفعل.
              </Alert>

              <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr 1fr"},gap:1.2}}>
                <FormControl size="small">
                  <InputLabel>نوع الإجازة</InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS} label="نوع الإجازة" value={policyForm.leaveTypeGuid} onChange={(e) => setPolicyForm((value) => ({...value,leaveTypeGuid:e.target.value}))}>
                    {workflowConfig.leaveTypes.map((type) => <MenuItem key={type.leaveTypeGuid} value={type.leaveTypeGuid}>{type.leaveTypeName}</MenuItem>)}
                  </Select>
                </FormControl>
                <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                  options={workflowConfig.jobTitles}
                  groupBy={(option) => option.departmentName || "بدون قسم"}
                  value={getWorkflowJobTitle(policyForm.sourceJobTitleGuid)}
                  getOptionLabel={(option) => `${option.jobTitleName || ""}${option.legacyJobCode !== null && option.legacyJobCode !== undefined ? ` - ${option.legacyJobCode}` : ""}`}
                  isOptionEqualToValue={(a,b) => a.jobTitleGuid === b.jobTitleGuid}
                  onChange={(_,value) => setPolicyForm((form) => ({...form,sourceJobTitleGuid:value?.jobTitleGuid || ""}))}
                  renderInput={(params) => <TextField {...params} size="small" label="المسمى الوظيفي" placeholder="مثال: مدرب"/>}
                />
                <FormControl size="small">
                  <InputLabel>الفرع - اختياري</InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS} label="الفرع - اختياري" value={policyForm.branchGuid} onChange={(e) => setPolicyForm((value) => ({...value,branchGuid:e.target.value}))}>
                    <MenuItem value="">كل الفروع</MenuItem>
                    {workflowConfig.branches.map((branch) => <MenuItem key={branch.branchGuid} value={branch.branchGuid}>{branch.branchName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              {(() => {
                const source = getWorkflowJobTitle(policyForm.sourceJobTitleGuid);
                if (!source) return null;
                return (
                  <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f8fbf9" }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4,1fr)" }, gap: 1 }}>
                      <Box><Typography color="text.secondary" sx={{ fontSize: 10 }}>المسمى</Typography><Typography sx={{ fontWeight: 950 }}>{source.jobTitleName}</Typography></Box>
                      <Box><Typography color="text.secondary" sx={{ fontSize: 10 }}>القسم الموجود بالفعل</Typography><Typography sx={{ fontWeight: 950 }}>{source.departmentName || "غير مربوط بقسم"}</Typography></Box>
                      <Box><Typography color="text.secondary" sx={{ fontSize: 10 }}>مدير القسم الموجود بالفعل</Typography><Typography sx={{ fontWeight: 950 }}>{source.departmentManagerName || "غير محدد"}</Typography></Box>
                      <Box><Typography color="text.secondary" sx={{ fontSize: 10 }}>نطاق المسار</Typography><Typography sx={{ fontWeight: 950 }}>{policyForm.branchGuid ? (getWorkflowBranch(policyForm.branchGuid)?.branchName || "فرع محدد") : "كل الفروع"}</Typography></Box>
                    </Box>
                  </Paper>
                );
              })()}

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>خطوات الموافقة</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 11 }}>رتب الخطوات كما تريد. آخر خطوة هي الاعتماد النهائي.</Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={addPolicyStep}>إضافة خطوة</Button>
              </Box>

              {policyForm.steps.map((step,index) => {
                const selectedPeople = getStepSelectedApprovers(step);
                const candidates = getStepCandidates(step);
                const source = getWorkflowJobTitle(policyForm.sourceJobTitleGuid);
                const stepDepartmentGuid = getStepDepartmentGuid(step);
                const stepDepartment = getWorkflowDepartment(stepDepartmentGuid);

                return (
                  <Paper key={index} variant="outlined" sx={{p:1.25,borderRadius:2}}>
                    <Stack spacing={1}>
                      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"70px minmax(210px,1fr) minmax(250px,1.3fr) minmax(180px,1fr) auto"},gap:1,alignItems:"center"}}>
                        <TextField size="small" label="الخطوة" value={index+1} disabled/>
                        <FormControl size="small">
                          <InputLabel>تذهب إلى</InputLabel>
                          <Select
                  MenuProps={RTL_MENU_PROPS} label="تذهب إلى" value={step.approverType} onChange={(e) => {
                            const type=e.target.value;
                            const stepName = type === "ORG_DIRECT_MANAGER" ? "المسؤول المباشر من الهيكل" : type === "ORG_PARENT_MANAGER" ? "مسؤول الوحدة الأعلى" : type === "ORG_ROOT_MANAGER" ? "الإدارة العليا من الهيكل" : type === "SAME_BRANCH_JOB_TITLE" ? "وظيفة في نفس الفرع" : type === "SOURCE_DEPARTMENT_MANAGER" ? "مدير القسم" : type === "TARGET_DEPARTMENT_MANAGER" ? "مدير قسم محدد" : type === "SOURCE_DEPARTMENT_PEOPLE" ? "أشخاص من قسم المسمى" : type === "TARGET_DEPARTMENT_PEOPLE" ? "أشخاص من قسم محدد" : type === "EXECUTIVE_MANAGER" ? "الإدارة التنفيذية" : "الموارد البشرية";
                            updatePolicyStep(index,{approverType:type,targetJobTitleGuid:"",targetDepartmentGuid:"",approverUserGuid:"",approverUserGuids:[],stepName});
                          }}>
                            <MenuItem value="ORG_DIRECT_MANAGER">المسؤول المباشر من الهيكل الموحد</MenuItem>
                            <MenuItem value="ORG_PARENT_MANAGER">مسؤول الوحدة الأعلى في الهيكل</MenuItem>
                            <MenuItem value="ORG_ROOT_MANAGER">الإدارة العليا في الهيكل</MenuItem>
                            <MenuItem value="SAME_BRANCH_JOB_TITLE">وظيفة محددة في نفس الفرع</MenuItem>
                            <MenuItem value="SOURCE_DEPARTMENT_MANAGER">مدير قسم المسمى + بدلاء من نفس القسم</MenuItem>
                            <MenuItem value="TARGET_DEPARTMENT_MANAGER">مدير قسم محدد + بدلاء من نفس القسم</MenuItem>
                            <MenuItem value="SOURCE_DEPARTMENT_PEOPLE">أشخاص محددون من قسم المسمى</MenuItem>
                            <MenuItem value="TARGET_DEPARTMENT_PEOPLE">أشخاص محددون من قسم أختاره</MenuItem>
                            <MenuItem value="EXECUTIVE_MANAGER">الإدارة التنفيذية + بدلاء</MenuItem>
                            <MenuItem value="HR_MANAGER">الموارد البشرية + بدلاء</MenuItem>
                          </Select>
                        </FormControl>

                        {step.approverType === "SAME_BRANCH_JOB_TITLE" ? (
                          <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                            options={workflowConfig.jobTitles}
                            groupBy={(option) => option.departmentName || "بدون قسم"}
                            value={getWorkflowJobTitle(step.targetJobTitleGuid)}
                            getOptionLabel={(option) => option.jobTitleName || ""}
                            isOptionEqualToValue={(a,b) => a.jobTitleGuid === b.jobTitleGuid}
                            onChange={(_,value) => updatePolicyStep(index,{targetJobTitleGuid:value?.jobTitleGuid || "",targetDepartmentGuid:value?.departmentGuid || "",approverUserGuid:"",approverUserGuids:[],stepName:value ? `${value.jobTitleName} - نفس الفرع` : "وظيفة في نفس الفرع"})}
                            renderInput={(params) => <TextField {...params} size="small" label="المسمى داخل نفس الفرع" placeholder="مثال: مشرف فرع"/>}
                          />
                        ) : (step.approverType === "TARGET_DEPARTMENT_MANAGER" || step.approverType === "TARGET_DEPARTMENT_PEOPLE") ? (
                          <FormControl size="small">
                            <InputLabel>القسم المطلوب</InputLabel>
                            <Select
                  MenuProps={RTL_MENU_PROPS} label="القسم المطلوب" value={step.targetDepartmentGuid} onChange={(e) => {
                              const department=getWorkflowDepartment(e.target.value);
                              updatePolicyStep(index,{targetDepartmentGuid:e.target.value,approverUserGuid:"",approverUserGuids:[],stepName:department ? (step.approverType === "TARGET_DEPARTMENT_MANAGER" ? `مدير قسم ${department.departmentName}` : department.departmentName) : (step.approverType === "TARGET_DEPARTMENT_MANAGER" ? "مدير قسم محدد" : "أشخاص من قسم محدد")});
                            }}>
                              {workflowConfig.departments.map((department) => <MenuItem key={department.departmentGuid} value={department.departmentGuid}>{department.departmentName}{department.managerName ? ` - المدير الحالي: ${department.managerName}` : " - بدون مدير"}</MenuItem>)}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField size="small" value={step.approverType === "ORG_DIRECT_MANAGER" ? "يتحدد من الهيكل الإداري الموحد" : step.approverType === "ORG_PARENT_MANAGER" ? "أقرب وحدة أعلى في الهيكل" : step.approverType === "ORG_ROOT_MANAGER" ? "مسؤول جذر الهيكل" : (step.approverType === "SOURCE_DEPARTMENT_MANAGER" || step.approverType === "SOURCE_DEPARTMENT_PEOPLE") ? (source?.departmentName ? `قسم ${source.departmentName}` : "القسم المرتبط بالمسمى") : step.approverType === "EXECUTIVE_MANAGER" ? "قسم الإدارة التنفيذية" : "قسم الموارد البشرية"} disabled/>
                        )}

                        <TextField size="small" label="اسم الخطوة" value={step.stepName} onChange={(e) => updatePolicyStep(index,{stepName:e.target.value})}/>
                        <Stack direction="row" spacing={.25}>
                          <IconButton size="small" onClick={() => movePolicyStep(index,-1)} disabled={index===0}>↑</IconButton>
                          <IconButton size="small" onClick={() => movePolicyStep(index,1)} disabled={index===policyForm.steps.length-1}>↓</IconButton>
                          <IconButton size="small" color="error" onClick={() => removePolicyStep(index)} disabled={policyForm.steps.length<=1}><CloseRoundedIcon fontSize="small"/></IconButton>
                        </Stack>
                      </Box>

                      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1.5fr 1fr"},gap:1,alignItems:"center"}}>
                        {["ORG_DIRECT_MANAGER","ORG_PARENT_MANAGER","ORG_ROOT_MANAGER"].includes(step.approverType) ? (
                          <Alert severity="success" sx={{gridColumn:{md:"1 / -1"},py:.4,borderRadius:1.5}}>
                            <b>الموافق الفعلي:</b>{" "}{getStepAutoApproverText(step)}. المصدر الوحيد هو الهيكل الإداري المرن.
                          </Alert>
                        ) : (
                          <>
                            <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                              multiple
                              disableCloseOnSelect
                              limitTags={3}
                              options={candidates}
                              value={selectedPeople}
                              getOptionLabel={(option) => `${option.employeeName || ""}${option.employeeCode ? ` - ${option.employeeCode}` : ""}${option.jobTitleName ? ` • ${option.jobTitleName}` : ""}${option.branchName ? ` • ${option.branchName}` : ""}`}
                              isOptionEqualToValue={(a,b) => a.employeeGuid === b.employeeGuid}
                              onChange={(_,values) => updatePolicyStep(index,{approverUserGuid:values?.[0]?.employeeGuid || "",approverUserGuids:(values || []).map((x) => x.employeeGuid).filter(Boolean)})}
                              renderInput={(params) => <TextField {...params} size="small" label="الموافقون بالاسم - اختياري" placeholder={stepDepartment?.departmentName ? `أسماء من قسم ${stepDepartment.departmentName}` : "حدد القسم/المسمى أولاً"} helperText={step.approverType === "SAME_BRANCH_JOB_TITLE" && !policyForm.branchGuid ? "الأسماء هنا من قسم المسمى فقط. عند التنفيذ سيُقبل منهم الموجودون في نفس فرع مقدم الطلب." : "يمكن اختيار أكثر من شخص من نفس القسم؛ موافقة أي واحد منهم تنفذ الخطوة."}/>} 
                            />
                            <Alert severity={selectedPeople.length ? "success" : "info"} sx={{py:.25,borderRadius:1.5}}>
                              <b>الموافق الفعلي:</b>{" "}{getStepAutoApproverText(step)}
                            </Alert>
                          </>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}

              <TextField size="small" multiline minRows={2} label="ملاحظات المسار" value={policyForm.notes} onChange={(e) => setPolicyForm((value) => ({ ...value, notes: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPolicyOpen(false)}>إلغاء</Button>
            <Button variant="contained" onClick={savePolicy}>حفظ المسار</Button>
          </DialogActions>
        </Dialog>

      <Dialog
        sx={RTL_DIALOG_SX} open={initOpen} onClose={()=>!initSaving&&setInitOpen(false)} fullWidth maxWidth="sm" dir={LEAVES_PAGE_DIRECTION}>
        <DialogTitle sx={{fontWeight:950}}>تهيئة أرصدة الموظفين</DialogTitle><DialogContent dividers><Stack spacing={1}>
          <Alert severity="info">اختار السنة ونوع الإجازة والرصيد. بدون فرع أو موظف = كل الموظفين النشطين. الافتراضي لا يلمس أي رصيد موجود مسبقًا.</Alert>
          <Stack direction={{xs:"column",sm:"row"}} spacing={1}><TextField fullWidth type="number" label="السنة" value={initForm.balanceYear} onChange={e=>setInitForm(x=>({...x,balanceYear:e.target.value}))} inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} /><TextField fullWidth type="number" label="عدد الأيام" value={initForm.days} onChange={e=>setInitForm(x=>({...x,days:e.target.value}))} inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} /></Stack>
          <FormControl fullWidth><InputLabel>نوع الإجازة</InputLabel><Select
                  MenuProps={RTL_MENU_PROPS} label="نوع الإجازة" value={initForm.leaveTypeGuid} onChange={e=>setInitForm(x=>({...x,leaveTypeGuid:e.target.value}))}>{lookups.leaveTypes.filter(x=>x.requiresBalance).map(x=><MenuItem key={x.leaveTypeGuid} value={x.leaveTypeGuid}>{x.leaveTypeName}</MenuItem>)}</Select></FormControl>
          <FormControl fullWidth><InputLabel>الفرع - اختياري</InputLabel><Select
                  MenuProps={RTL_MENU_PROPS} label="الفرع - اختياري" value={initForm.branchGuid} onChange={e=>setInitForm(x=>({...x,branchGuid:e.target.value}))}><MenuItem value="">كل الفروع</MenuItem>{lookups.branches.map(x=><MenuItem key={x.branchGuid} value={x.branchGuid}>{x.branchName}</MenuItem>)}</Select></FormControl>
          <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS} options={lookups.employees} value={initForm.employee} onChange={(_,v)=>setInitForm(x=>({...x,employee:v}))} getOptionLabel={o=>`${o.employeeName||""} • #${o.employeeCode||"-"}`} renderInput={params=><TextField {...params} label="موظف محدد - اختياري"/>}/>
          <FormControlLabel control={<Checkbox checked={initForm.overwriteExisting} onChange={e=>setInitForm(x=>({...x,overwriteExisting:e.target.checked}))}/>} label="استبدال الرصيد الافتتاحي الموجود بالفعل (استخدمها بحذر)"/>
          <TextField label="سبب التهيئة" value={initForm.reason} onChange={e=>setInitForm(x=>({...x,reason:e.target.value}))}/>
        </Stack></DialogContent><DialogActions><Button onClick={()=>setInitOpen(false)}>إلغاء</Button><Button variant="contained" disabled={initSaving} onClick={initializeBalances}>تنفيذ التهيئة</Button></DialogActions>
      </Dialog>

      {/* Request dialog */}
      <Dialog
        sx={RTL_DIALOG_SX}
        open={requestOpen}
        onClose={() =>
          !requestSaving &&
          setRequestOpen(false)
        }
        fullWidth
        maxWidth="md"
        dir={LEAVES_PAGE_DIRECTION}
      >
        <DialogTitle
          sx={{ fontWeight: 950 }}
        >
          طلب إجازة جديد
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
              options={lookups.employees}
              value={requestForm.employee}
              onChange={(_, value) =>
                setRequestForm(
                  (current) => ({
                    ...current,
                    employee: value
                  })
                )
              }
              getOptionLabel={(option) =>
                `${option.employeeName || ""} • #${option.employeeCode || "-"} • ${option.branchName || ""}`
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="الموظف"
                  placeholder="ابحث باسم الموظف..."
                />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>
                نوع الإجازة
              </InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="نوع الإجازة"
                value={
                  requestForm.leaveTypeGuid
                }
                onChange={(e) =>
                  setRequestForm(
                    (current) => ({
                      ...current,
                      leaveTypeGuid:
                        e.target.value,
                      dayPart: 0
                    })
                  )
                }
              >
                {lookups.leaveTypes.map(
                  (type) => (
                    <MenuItem
                      key={
                        type.leaveTypeGuid
                      }
                      value={
                        type.leaveTypeGuid
                      }
                    >
                      {type.leaveTypeName}
                      {type.requiresBalance
                        ? " • من الرصيد"
                        : ""}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <Stack
              direction={{
                xs: "column",
                sm: "row"
              }}
              spacing={1}
            >
              <TextField
                fullWidth
                type="date"
                label="من تاريخ"
                value={
                  requestForm.fromDate
                }
                onChange={(e) =>
                  setRequestForm(
                    (current) => ({
                      ...current,
                      fromDate:
                        e.target.value
                    })
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  dir:
                    "ltr"
                , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />

              <TextField
                fullWidth
                type="date"
                label="إلى تاريخ"
                value={requestForm.toDate}
                onChange={(e) =>
                  setRequestForm(
                    (current) => ({
                      ...current,
                      toDate:
                        e.target.value
                    })
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  dir:
                    "ltr"
                , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />
            </Stack>

            {selectedType?.allowsHalfDay &&
              requestForm.fromDate ===
                requestForm.toDate && (
                <FormControl fullWidth>
                  <InputLabel>
                    نوع اليوم
                  </InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS}
                    label="نوع اليوم"
                    value={
                      requestForm.dayPart
                    }
                    onChange={(e) =>
                      setRequestForm(
                        (current) => ({
                          ...current,
                          dayPart:
                            Number(
                              e.target.value
                            )
                        })
                      )
                    }
                  >
                    <MenuItem value={0}>
                      يوم كامل
                    </MenuItem>
                    <MenuItem value={1}>
                      النصف الأول
                    </MenuItem>
                    <MenuItem value={2}>
                      النصف الثاني
                    </MenuItem>
                  </Select>
                </FormControl>
              )}

            {calculating ? (
              <Alert severity="info">
                جاري حساب أيام الإجازة حسب الوردية والعطلات...
              </Alert>
            ) : calculation?.error ? (
              <Alert severity="error">
                {calculation.error}
              </Alert>
            ) : calculation ? (
              <Alert
                severity={
                  calculation.requiresBalance &&
                  Number(
                    calculation.availableBalance ||
                      0
                  ) <
                    Number(
                      calculation.requestedDays ||
                        0
                    )
                    ? "warning"
                    : "success"
                }
              >
                الأيام المحسوبة:{" "}
                <strong>
                  {calculation.requestedDays}
                </strong>
                {calculation.requiresBalance && (
                  <>
                    {" • "}الرصيد المتاح:{" "}
                    <strong>
                      {calculation.availableBalance ??
                        0}
                    </strong>
                  </>
                )}
                {Number(
                  calculation.holidayDays ||
                    0
                ) > 0 && (
                  <>
                    {" • "}عطلات مستبعدة:{" "}
                    {calculation.holidayDays}
                  </>
                )}
              </Alert>
            ) : null}

            <TextField
              multiline
              minRows={3}
              label="السبب / الملاحظات"
              value={requestForm.reason}
              onChange={(e) =>
                setRequestForm(
                  (current) => ({
                    ...current,
                    reason:
                      e.target.value
                  })
                )
              }
            />

            <Button
              component="label"
              variant="outlined"
              startIcon={
                <FolderRoundedIcon />
              }
            >
              {requestForm.attachment
                ? requestForm.attachment.name
                : selectedType?.requiresAttachment
                  ? "إرفاق مستند - مطلوب"
                  : "إرفاق مستند - اختياري"}
              <input
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) =>
                  setRequestForm(
                    (current) => ({
                      ...current,
                      attachment:
                        e.target.files?.[0] ||
                        null
                    })
                  )
                }
              />
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setRequestOpen(false)
            }
            disabled={requestSaving}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={submitRequest}
            disabled={
              requestSaving ||
              calculating ||
              Boolean(calculation?.error)
            }
            sx={{
              bgcolor: primary,
              fontWeight: 950
            }}
          >
            {requestSaving
              ? "جاري الإرسال..."
              : "إرسال الطلب"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Balance dialog */}
      <Dialog
        sx={RTL_DIALOG_SX}
        open={balanceOpen}
        onClose={() =>
          !balanceSaving &&
          setBalanceOpen(false)
        }
        fullWidth
        maxWidth="sm"
        dir={LEAVES_PAGE_DIRECTION}
      >
        <DialogTitle
          sx={{ fontWeight: 950 }}
        >
          تعديل رصيد الإجازة
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Alert severity="info">
              {balanceRow?.employeeName}
              {" • "}
              {balanceRow?.leaveTypeName}
              {" • "}
              سنة {balanceYear}
              {" • "}المستخدم:{" "}
              {balanceRow?.usedDays ?? 0}
            </Alert>

            <Stack
              direction={{
                xs: "column",
                sm: "row"
              }}
              spacing={1}
            >
              <TextField
                fullWidth
                type="number"
                label="الرصيد الافتتاحي"
                value={
                  balanceForm.openingBalance
                }
                onChange={(e) =>
                  setBalanceForm(
                    (c) => ({
                      ...c,
                      openingBalance:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField
                fullWidth
                type="number"
                label="المكتسب"
                value={balanceForm.accruedDays}
                onChange={(e) =>
                  setBalanceForm(
                    (c) => ({
                      ...c,
                      accruedDays:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Stack>

            <Stack
              direction={{
                xs: "column",
                sm: "row"
              }}
              spacing={1}
            >
              <TextField
                fullWidth
                type="number"
                label="المرحّل"
                value={
                  balanceForm.carriedForwardDays
                }
                onChange={(e) =>
                  setBalanceForm(
                    (c) => ({
                      ...c,
                      carriedForwardDays:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField
                fullWidth
                type="number"
                label="التسويات"
                value={
                  balanceForm.adjustmentDays
                }
                onChange={(e) =>
                  setBalanceForm(
                    (c) => ({
                      ...c,
                      adjustmentDays:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Stack>

            <TextField
              required
              multiline
              minRows={2}
              label="سبب التعديل"
              value={balanceForm.reason}
              onChange={(e) =>
                setBalanceForm(
                  (c) => ({
                    ...c,
                    reason: e.target.value
                  })
                )
              }
            />

            <TextField
              multiline
              minRows={2}
              label="ملاحظات"
              value={balanceForm.notes}
              onChange={(e) =>
                setBalanceForm(
                  (c) => ({
                    ...c,
                    notes: e.target.value
                  })
                )
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setBalanceOpen(false)
            }
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={saveBalance}
            disabled={
              balanceSaving ||
              !balanceForm.reason.trim()
            }
          >
            حفظ الرصيد
          </Button>
        </DialogActions>
      </Dialog>

      {/* Type dialog */}
      <Dialog
        sx={RTL_DIALOG_SX}
        open={typeOpen}
        onClose={() =>
          !typeSaving &&
          setTypeOpen(false)
        }
        fullWidth
        maxWidth="md"
        dir={LEAVES_PAGE_DIRECTION}
      >
        <DialogTitle
          sx={{ fontWeight: 950 }}
        >
          {typeForm.leaveTypeGuid
            ? "تعديل نوع الإجازة"
            : "نوع إجازة جديد"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Stack
              direction={{
                xs: "column",
                sm: "row"
              }}
              spacing={1}
            >
              <TextField
                fullWidth
                label="الكود"
                value={typeForm.code}
                onChange={(e) =>
                  setTypeForm(
                    (c) => ({
                      ...c,
                      code:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField
                fullWidth
                label="اسم الإجازة"
                value={
                  typeForm.leaveTypeName
                }
                onChange={(e) =>
                  setTypeForm(
                    (c) => ({
                      ...c,
                      leaveTypeName:
                        e.target.value
                    })
                  )
                }
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>
                طريقة احتساب الأيام
              </InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="طريقة احتساب الأيام"
                value={typeForm.countMode}
                onChange={(e) =>
                  setTypeForm(
                    (c) => ({
                      ...c,
                      countMode:
                        Number(
                          e.target.value
                        )
                    })
                  )
                }
              >
                <MenuItem value={1}>
                  أيام العمل حسب الوردية مع استبعاد العطلات
                </MenuItem>
                <MenuItem value={2}>
                  أيام تقويمية
                </MenuItem>
              </Select>
            </FormControl>

            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              spacing={1}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={typeForm.isPaid}
                    onChange={(e) =>
                      setTypeForm(
                        (c) => ({
                          ...c,
                          isPaid:
                            e.target.checked
                        })
                      )
                    }
                  />
                }
                label="مدفوعة"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      typeForm.requiresBalance
                    }
                    onChange={(e) =>
                      setTypeForm(
                        (c) => ({
                          ...c,
                          requiresBalance:
                            e.target.checked
                        })
                      )
                    }
                  />
                }
                label="تحتاج رصيد"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      typeForm.allowsHalfDay
                    }
                    onChange={(e) =>
                      setTypeForm(
                        (c) => ({
                          ...c,
                          allowsHalfDay:
                            e.target.checked
                        })
                      )
                    }
                  />
                }
                label="تسمح بنصف يوم"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      typeForm.requiresAttachment
                    }
                    onChange={(e) =>
                      setTypeForm(
                        (c) => ({
                          ...c,
                          requiresAttachment:
                            e.target.checked
                        })
                      )
                    }
                  />
                }
                label="المرفق مطلوب"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      typeForm.isActive
                    }
                    onChange={(e) =>
                      setTypeForm(
                        (c) => ({
                          ...c,
                          isActive:
                            e.target.checked
                        })
                      )
                    }
                  />
                }
                label="نشط"
              />
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm:
                    "repeat(4,minmax(0,1fr))"
                },
                gap: 1
              }}
            >
              <TextField
                type="number"
                label="إشعار مسبق - يوم"
                value={
                  typeForm.minNoticeDays
                }
                onChange={(e) =>
                  setTypeForm(
                    (c) => ({
                      ...c,
                      minNoticeDays:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField
                type="number"
                label="حد أقصى للطلب"
                value={
                  typeForm.maxDaysPerRequest
                }
                onChange={(e) =>
                  setTypeForm(
                    (c) => ({
                      ...c,
                      maxDaysPerRequest:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField
                type="number"
                label="استحقاق افتراضي"
                value={
                  typeForm.defaultAnnualEntitlement
                }
                onChange={(e) =>
                  setTypeForm(
                    (c) => ({
                      ...c,
                      defaultAnnualEntitlement:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              <TextField
                type="number"
                label="أقصى ترحيل"
                value={
                  typeForm.maxCarryForwardDays
                }
                onChange={(e) =>
                  setTypeForm(
                    (c) => ({
                      ...c,
                      maxCarryForwardDays:
                        e.target.value
                    })
                  )
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Box>

            <TextField
              multiline
              minRows={2}
              label="ملاحظات"
              value={typeForm.notes}
              onChange={(e) =>
                setTypeForm(
                  (c) => ({
                    ...c,
                    notes: e.target.value
                  })
                )
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setTypeOpen(false)
            }
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={saveType}
            disabled={typeSaving}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Holiday dialog */}
      <Dialog
        sx={RTL_DIALOG_SX}
        open={holidayOpen}
        onClose={() =>
          !holidaySaving &&
          setHolidayOpen(false)
        }
        fullWidth
        maxWidth="sm"
        dir={LEAVES_PAGE_DIRECTION}
      >
        <DialogTitle
          sx={{ fontWeight: 950 }}
        >
          عطلة رسمية
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <TextField
              type="date"
              label="التاريخ"
              value={
                holidayForm.holidayDate
              }
              onChange={(e) =>
                setHolidayForm(
                  (c) => ({
                    ...c,
                    holidayDate:
                      e.target.value
                  })
                )
              }
              InputLabelProps={{
                shrink: true
              }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField
              label="اسم العطلة"
              value={
                holidayForm.holidayName
              }
              onChange={(e) =>
                setHolidayForm(
                  (c) => ({
                    ...c,
                    holidayName:
                      e.target.value
                  })
                )
              }
            />
            <FormControl fullWidth>
              <InputLabel>
                الفرع
              </InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الفرع"
                value={
                  holidayForm.branchGuid
                }
                onChange={(e) =>
                  setHolidayForm(
                    (c) => ({
                      ...c,
                      branchGuid:
                        e.target.value
                    })
                  )
                }
              >
                <MenuItem value="">
                  كل الفروع
                </MenuItem>
                {lookups.branches.map(
                  (branch) => (
                    <MenuItem
                      key={
                        branch.branchGuid
                      }
                      value={
                        branch.branchGuid
                      }
                    >
                      {branch.branchName}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    holidayForm.isActive
                  }
                  onChange={(e) =>
                    setHolidayForm(
                      (c) => ({
                        ...c,
                        isActive:
                          e.target.checked
                      })
                    )
                  }
                />
              }
              label="نشطة"
            />

            <TextField
              multiline
              minRows={2}
              label="ملاحظات"
              value={
                holidayForm.notes
              }
              onChange={(e) =>
                setHolidayForm(
                  (c) => ({
                    ...c,
                    notes: e.target.value
                  })
                )
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setHolidayOpen(false)
            }
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={saveHoliday}
            disabled={holidaySaving}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}
