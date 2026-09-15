import { printWhenReady } from '../utils/printReady';
import * as uiLayout from '../components/hrLayout';
import './rtl-forms-fix.css';
import { hrChipSx } from "../components/hrControlStyles";
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import GroupWorkRoundedIcon from "@mui/icons-material/GroupWorkRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

import Swal from "sweetalert2";




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




const PAGE_DIRECTION = "rtl";
const PAGE_TEXT_ALIGN = "right";
const DIALOG_DIRECTION = "rtl";

const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const bg = "#f5f8f6";

const dayOptions = [
  { label: "الأحد", bit: 1 },
  { label: "الإثنين", bit: 2 },
  { label: "الثلاثاء", bit: 4 },
  { label: "الأربعاء", bit: 8 },
  { label: "الخميس", bit: 16 },
  { label: "الجمعة", bit: 32 },
  { label: "السبت", bit: 64 }
];

const statusOptions = [
  ["all", "كل الحالات"],
  ["Present", "حاضر"],
  ["Late", "متأخر"],
  ["Absent", "غائب"],
  ["Pending", "لم يسجل بعد"],
  ["Incomplete", "بصمة غير مكتملة"],
  ["Leave", "إجازة"],
  ["Holiday", "عطلة رسمية"],
  ["Permission", "إذن يوم كامل"],
  ["Remote", "عمل عن بعد"],
  ["Off", "راحة"],
  ["NoSchedule", "بدون وردية"]
];

const statusMeta = (status) => {
  const map = {
    Present: ["حاضر", "success"],
    Late: ["متأخر", "warning"],
    Absent: ["غائب", "error"],
    Pending: ["لم يسجل بعد", "default"],
    Incomplete: ["بصمة غير مكتملة", "warning"],
    Leave: ["إجازة", "info"],
    Holiday: ["عطلة رسمية", "secondary"],
    Permission: ["إذن يوم كامل", "info"],
    Remote: ["عمل عن بعد", "info"],
    Off: ["راحة", "default"],
    NoSchedule: ["بدون وردية", "default"],
    Future: ["تاريخ مستقبلي", "default"]
  };

  const [label, color] =
    map[status] || [status || "غير محدد", "default"];

  return { label, color };
};

const excelBioStatusMeta = (status) => {
  const map = {
    strong: ["مطابق قوي", "success"],
    likely: ["مطابق محتمل قوي", "success"],
    review: ["يحتاج مراجعة", "warning"],
    "employee-conflict": ["تعارض موظف", "warning"],
    "already-linked": ["مربوط بالفعل", "info"],
    "duplicate-code": ["رقم بصمة مكرر", "error"],
    unmatched: ["غير مطابق", "default"]
  };

  const [label, color] =
    map[status] || [status || "غير محدد", "default"];

  return { label, color };
};

const todayValue = () =>
  new Date().toISOString().slice(0, 10);

const toDateInputValue = (value, fallback = "") => {
  if (!value) return fallback;

  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;

  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const formatTime = (value) => {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleTimeString(
      "ar-SA",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  } catch {
    return "-";
  }
};

const formatTimeSpan = (value) => {
  if (!value) return "-";

  const str = String(value);
  const parts = str.split(":");

  if (parts.length < 2) return str;

  return `${parts[0]}:${parts[1]}`;
};

const minutesToText = (minutes) => {
  const value = Number(minutes || 0);

  if (value <= 0) return "-";

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (!hours) return `${mins} د`;

  return mins
    ? `${hours} س ${mins} د`
    : `${hours} س`;
};

const getActor = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    return {
      actorUserGuid:
        user?.guid ||
        user?.Guid ||
        user?.userGuid ||
        user?.UserGuid ||
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

const emptyShift = () => ({
  shiftGuid: "",
  shiftName: "",
  startTime: "08:00",
  endTime: "16:00",
  graceMinutes: 0,
  earlyLeaveGraceMinutes: 0,
  minOvertimeMinutes: 30,
  isActive: true
});

const emptyAttendance = () => ({
  checkInAt: "",
  checkOutAt: "",
  status: "Present",
  notes: "",
  reason: ""
});

const emptyAssignment = () => ({
  shiftGuid: "",
  effectiveFrom: todayValue(),
  effectiveTo: "",
  workDaysMask: 0,
  notes: ""
});

export default function HrAttendancePage() {
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [date, setDate] = useState(todayValue());
  const [search, setSearch] = useState("");
  const [branchGuid, setBranchGuid] = useState("");
  const [departmentGuid, setDepartmentGuid] =
    useState("");
  const [status, setStatus] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selectedEmployeeGuids, setSelectedEmployeeGuids] =
    useState([]);

  const [bulkAssignmentOpen, setBulkAssignmentOpen] =
    useState(false);
  const [bulkAssignmentForm, setBulkAssignmentForm] =
    useState(emptyAssignment());
  const [bulkAssignmentSaving, setBulkAssignmentSaving] =
    useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    pendingCount: 0,
    leaveCount: 0,
    remoteCount: 0,
    offCount: 0,
    noScheduleCount: 0,
    overtimeMinutes: 0
  });

  const [lookups, setLookups] = useState({
    branches: [],
    departments: []
  });

  const [shifts, setShifts] = useState([]);

  const [shiftDialogOpen, setShiftDialogOpen] =
    useState(false);
  const [shiftForm, setShiftForm] =
    useState(emptyShift());
  const [shiftSaving, setShiftSaving] =
    useState(false);

  const [assignmentOpen, setAssignmentOpen] =
    useState(false);
  const [assignmentEmployee, setAssignmentEmployee] =
    useState(null);
  const [assignmentForm, setAssignmentForm] =
    useState(emptyAssignment());
  const [assignmentSaving, setAssignmentSaving] =
    useState(false);

  const [attendanceOpen, setAttendanceOpen] =
    useState(false);
  const [attendanceEmployee, setAttendanceEmployee] =
    useState(null);
  const [attendanceForm, setAttendanceForm] =
    useState(emptyAttendance());
  const [attendanceSaving, setAttendanceSaving] =
    useState(false);

  const [bioDialogOpen, setBioDialogOpen] =
    useState(false);
  const [bioEmployee, setBioEmployee] =
    useState(null);
  const [bioSearch, setBioSearch] =
    useState("");
  const [bioRows, setBioRows] =
    useState([]);
  const [bioLoading, setBioLoading] =
    useState(false);
  const [bioSavingId, setBioSavingId] =
    useState(null);

  const [bioBulkOpen, setBioBulkOpen] = useState(false);
  const [bioBulkLoading, setBioBulkLoading] = useState(false);
  const [bioBulkRefreshing, setBioBulkRefreshing] = useState(false);
  const [bioBulkSaving, setBioBulkSaving] = useState(false);
  const [bioBulkSearch, setBioBulkSearch] = useState("");
  const [bioBulkBranchGuid, setBioBulkBranchGuid] = useState("");
  const [bioBulkPage, setBioBulkPage] = useState(1);
  const [bioBulkPageSize, setBioBulkPageSize] = useState(30);
  const [bioBulkEmployees, setBioBulkEmployees] = useState([]);
  const [bioBulkCandidates, setBioBulkCandidates] = useState([]);
  const [bioBulkSelections, setBioBulkSelections] = useState({});
  const [bioBulkApproved, setBioBulkApproved] = useState({});
  const [bioBulkStats, setBioBulkStats] = useState({
    linkedEmployees: 0,
    unlinkedEmployees: 0,
    cachedBioEmployees: 0,
    cacheLastSync: null
  });
  const [bioBulkTotalCount, setBioBulkTotalCount] = useState(0);
  const [bioBulkPageCount, setBioBulkPageCount] = useState(0);

  const [bioExcelOpen, setBioExcelOpen] = useState(false);
  const [bioExcelFile, setBioExcelFile] = useState(null);
  const [bioExcelLoading, setBioExcelLoading] = useState(false);
  const [bioExcelSaving, setBioExcelSaving] = useState(false);
  const [bioExcelRows, setBioExcelRows] = useState([]);
  const [bioExcelStats, setBioExcelStats] = useState({
    totalRows: 0,
    strongMatches: 0,
    likelyMatches: 0,
    reviewMatches: 0,
    alreadyLinked: 0,
    unmatched: 0,
    duplicateCodes: 0,
    sheetCount: 0
  });
  const [bioExcelSheets, setBioExcelSheets] = useState([]);
  const [bioExcelSelections, setBioExcelSelections] = useState({});
  const [bioExcelApproved, setBioExcelApproved] = useState({});
  const [bioExcelSearch, setBioExcelSearch] = useState("");
  const [bioExcelStatus, setBioExcelStatus] = useState("all");

  const [bioSyncLoading, setBioSyncLoading] =
    useState(false);
  const [bioSyncInfo, setBioSyncInfo] =
    useState(null);
  const bioSyncedDatesRef = useRef(new Set());
  const bioSyncInFlightRef = useRef(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [reportEmployees, setReportEmployees] = useState([]);
  const [reportEmployeeSearch, setReportEmployeeSearch] = useState("");
  const [reportSelectedEmployee, setReportSelectedEmployee] = useState(null);
  const [reportLoadingEmployees, setReportLoadingEmployees] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSyncProgress, setReportSyncProgress] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportForm, setReportForm] = useState({
    employeeGuid: "",
    fromDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 4);
      return d.toISOString().slice(0, 10);
    })(),
    toDate: todayValue()
  });

  const loadLookups = useCallback(async () => {
    try {
      const [lookupResponse, shiftsResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/api/hr/employees/lookups`,
            { cache: "no-store" }
          ),
          fetch(
            `${API_BASE_URL}/api/hr/attendance/shifts`,
            { cache: "no-store" }
          )
        ]);

      const lookupResult =
        await lookupResponse.json();

      const shiftsResult =
        await shiftsResponse.json();

      if (lookupResponse.ok) {
        setLookups({
          branches: Array.isArray(
            lookupResult?.data?.branches
          )
            ? lookupResult.data.branches
            : [],
          departments: Array.isArray(
            lookupResult?.data?.departments
          )
            ? lookupResult.data.departments
            : []
        });
      }

      if (shiftsResponse.ok) {
        setShifts(
          Array.isArray(shiftsResult?.data)
            ? shiftsResult.data
            : []
        );
      }
    } catch {
      // Main grid can still work.
    }
  }, []);

  const loadRows = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        date,
        page: String(pageNumber),
        pageSize: String(pageSize)
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (branchGuid) {
        params.set("branchGuid", branchGuid);
      }

      if (departmentGuid) {
        params.set(
          "departmentGuid",
          departmentGuid
        );
      }

      if (status !== "all") {
        params.set("status", status);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error
            ? `${result?.message || "تعذر تحميل الحضور والانصراف"}: ${result.error}`
            : result?.message ||
              "تعذر تحميل الحضور والانصراف"
        );
      }

      setRows(
        Array.isArray(result?.data)
          ? result.data
          : []
      );

      setTotalCount(
        Number(result?.totalCount || 0)
      );

      setStats({
        totalEmployees:
          Number(result?.stats?.totalEmployees || 0),
        presentCount:
          Number(result?.stats?.presentCount || 0),
        lateCount:
          Number(result?.stats?.lateCount || 0),
        absentCount:
          Number(result?.stats?.absentCount || 0),
        pendingCount:
          Number(result?.stats?.pendingCount || 0),
        leaveCount:
          Number(result?.stats?.leaveCount || 0),
        remoteCount:
          Number(result?.stats?.remoteCount || 0),
        offCount:
          Number(result?.stats?.offCount || 0),
        noScheduleCount:
          Number(result?.stats?.noScheduleCount || 0),
        overtimeMinutes:
          Number(result?.stats?.overtimeMinutes || 0)
      });
    } catch (error) {
      if (!silent) {
        setRows([]);
        setTotalCount(0);

        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text:
            error?.message ||
            "حدث خطأ أثناء تحميل الحضور والانصراف"
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [
    date,
    search,
    branchGuid,
    departmentGuid,
    status,
    pageNumber,
    pageSize
  ]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    const timer = setTimeout(
      loadRows,
      search.trim() ? 300 : 0
    );

    return () => clearTimeout(timer);
  }, [loadRows, search]);

  const pageCount = useMemo(
    () =>
      totalCount > 0
        ? Math.ceil(totalCount / pageSize)
        : 0,
    [totalCount, pageSize]
  );

  const openNewShift = useCallback(() => {
    setShiftForm(emptyShift());
    setShiftDialogOpen(true);
  }, []);

  const openEditShift = useCallback((shift) => {
    setShiftForm({
      shiftGuid: shift?.shiftGuid || "",
      shiftName: shift?.shiftName || "",
      startTime:
        formatTimeSpan(shift?.startTime) || "08:00",
      endTime:
        formatTimeSpan(shift?.endTime) || "16:00",
      graceMinutes:
        Number(shift?.graceMinutes || 0),
      earlyLeaveGraceMinutes:
        Number(
          shift?.earlyLeaveGraceMinutes || 0
        ),
      minOvertimeMinutes:
        Number(shift?.minOvertimeMinutes || 30),
      isActive:
        shift?.isActive !== false
    });

    setShiftDialogOpen(true);
  }, []);

  const saveShift = useCallback(async () => {
    if (!shiftForm.shiftName.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "اسم الوردية مطلوب"
      });
      return;
    }

    setShiftSaving(true);

    try {
      const isEdit =
        Boolean(shiftForm.shiftGuid);

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/hr/attendance/shifts/${encodeURIComponent(
              shiftForm.shiftGuid
            )}`
          : `${API_BASE_URL}/api/hr/attendance/shifts`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            shiftName:
              shiftForm.shiftName.trim(),
            startTime:
              `${shiftForm.startTime}:00`,
            endTime:
              `${shiftForm.endTime}:00`,
            graceMinutes:
              Number(
                shiftForm.graceMinutes || 0
              ),
            earlyLeaveGraceMinutes:
              Number(
                shiftForm
                  .earlyLeaveGraceMinutes || 0
              ),
            minOvertimeMinutes:
              Number(
                shiftForm.minOvertimeMinutes ||
                  0
              ),
            isActive:
              Boolean(shiftForm.isActive),
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
            "تعذر حفظ الوردية"
        );
      }

      setShiftDialogOpen(false);

      await loadLookups();
      await loadRows();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          error?.message ||
          "حدث خطأ أثناء حفظ الوردية"
      });
    } finally {
      setShiftSaving(false);
    }
  }, [
    shiftForm,
    loadLookups,
    loadRows
  ]);

  const openAssignment = useCallback(async (row) => {
    setAssignmentEmployee(row);

    // افتح فورًا بالقيم الظاهرة، ثم حمّل تاريخ بداية التكليف الحقيقي
    // من قاعدة البيانات. لا نرجّع الحقل إلى تاريخ اليوم كل مرة.
    setAssignmentForm({
      ...emptyAssignment(),
      shiftGuid: row?.shiftGuid || "",
      effectiveFrom: date || todayValue(),
      effectiveTo: "",
      workDaysMask: Number(row?.workDaysMask || 0),
      notes: ""
    });

    setAssignmentOpen(true);

    if (!row?.employeeGuid) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/assignment/${encodeURIComponent(
          row.employeeGuid
        )}?date=${encodeURIComponent(date || todayValue())}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل بيانات تكليف الوردية"
        );
      }

      const assignment = result?.data;

      if (assignment) {
        setAssignmentForm({
          shiftGuid: assignment?.shiftGuid || row?.shiftGuid || "",
          effectiveFrom: toDateInputValue(
            assignment?.effectiveFrom,
            date || todayValue()
          ),
          effectiveTo: toDateInputValue(assignment?.effectiveTo, ""),
          workDaysMask: Number(
            assignment?.workDaysMask ?? row?.workDaysMask ?? 0
          ),
          notes: assignment?.notes || ""
        });

        setAssignmentEmployee((current) => ({
          ...current,
          assignmentGuid:
            assignment?.assignmentGuid || current?.assignmentGuid || null
        }));
      }
    } catch (error) {
      // لا نمنع المستخدم من التعيين لو تعذر تحميل التفاصيل؛
      // يبقى النموذج مفتوحًا بالقيم الاحتياطية أعلاه.
      console.error(error);
    }
  }, [date]);

  const toggleWorkDay = useCallback((bit) => {
    setAssignmentForm((current) => ({
      ...current,
      workDaysMask:
        (Number(current.workDaysMask) & bit)
          ? Number(current.workDaysMask) & ~bit
          : Number(current.workDaysMask) | bit
    }));
  }, []);

  const saveAssignment = useCallback(async () => {
    if (
      !assignmentEmployee?.employeeGuid ||
      !assignmentForm.shiftGuid
    ) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "اختر الوردية"
      });
      return;
    }

    if (!Number(assignmentForm.workDaysMask)) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "اختر أيام العمل الأسبوعية"
      });
      return;
    }

    setAssignmentSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/assign-shift`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            employeeGuid:
              assignmentEmployee.employeeGuid,
            shiftGuid:
              assignmentForm.shiftGuid,
            effectiveFrom:
              assignmentForm.effectiveFrom,
            effectiveTo:
              assignmentForm.effectiveTo || null,
            workDaysMask:
              Number(
                assignmentForm.workDaysMask
              ),
            notes:
              assignmentForm.notes.trim() ||
              null,
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
            "تعذر تعيين الوردية"
        );
      }

      setAssignmentOpen(false);

      await Swal.fire({
        icon: "success",
        title: "تم تعيين الوردية",
        text:
          result?.message ||
          "تم الحفظ بنجاح"
      });

      await loadRows();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          error?.message ||
          "حدث خطأ أثناء تعيين الوردية"
      });
    } finally {
      setAssignmentSaving(false);
    }
  }, [
    assignmentEmployee,
    assignmentForm,
    loadRows
  ]);

  const openAttendance = useCallback(
    (row, mode = "edit") => {
      setAttendanceEmployee(row);

      const defaultCheckIn =
        mode === "checkin"
          ? `${date}T${new Date()
              .toTimeString()
              .slice(0, 5)}`
          : toDateTimeLocal(
              row?.checkInAt
            );

      const defaultCheckOut =
        mode === "checkout"
          ? `${date}T${new Date()
              .toTimeString()
              .slice(0, 5)}`
          : toDateTimeLocal(
              row?.checkOutAt
            );

      setAttendanceForm({
        checkInAt: defaultCheckIn,
        checkOutAt: defaultCheckOut,
        status:
          row?.attendanceGuid
            ? row?.status || "Present"
            : "Present",
        notes: row?.notes || "",
        reason:
          mode === "checkin"
            ? "تسجيل حضور"
            : mode === "checkout"
              ? "تسجيل انصراف"
              : ""
      });

      setAttendanceOpen(true);
    },
    [date]
  );

  const saveAttendance = useCallback(async () => {
    if (!attendanceEmployee?.employeeGuid) {
      return;
    }

    if (!attendanceForm.reason.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "سبب العملية مطلوب",
        text:
          "اكتب سبب التسجيل أو التعديل"
      });
      return;
    }

    setAttendanceSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            employeeGuid:
              attendanceEmployee.employeeGuid,
            attendanceDate: date,
            checkInAt:
              attendanceForm.checkInAt ||
              null,
            checkOutAt:
              attendanceForm.checkOutAt ||
              null,
            status:
              attendanceForm.status,
            notes:
              attendanceForm.notes.trim() ||
              null,
            reason:
              attendanceForm.reason.trim(),
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
            "تعذر حفظ الحضور"
        );
      }

      setAttendanceOpen(false);

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text:
          result?.message ||
          "تم حفظ الحضور والانصراف"
      });

      await loadRows();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          error?.message ||
          "حدث خطأ أثناء حفظ الحضور"
      });
    } finally {
      setAttendanceSaving(false);
    }
  }, [
    attendanceEmployee,
    attendanceForm,
    date,
    loadRows
  ]);


  const syncBioTimeAttendance = useCallback(
    async ({ silent = false } = {}) => {
      if (bioSyncInFlightRef.current) return;

      bioSyncInFlightRef.current = true;
      setBioSyncLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/hr/attendance/biotime/sync?date=${encodeURIComponent(date)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(getActor())
          }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error
              ? `${result?.message || "تعذر مزامنة BioTime"}: ${result.error}`
              : result?.message || "تعذر مزامنة BioTime"
          );
        }

        setBioSyncInfo(result?.data || null);
        bioSyncedDatesRef.current.add(date);
        await loadRows({ silent: true });

        if (!silent) {
          const data = result?.data || {};
          await Swal.fire({
            icon: "success",
            title: "تمت مزامنة BioTime",
            html: `
              <div style="text-align:right;line-height:1.9">
                <b>البصمات المستلمة:</b> ${Number(data.received || 0)}<br/>
                <b>الجديدة:</b> ${Number(data.inserted || 0)}<br/>
                <b>موظفو النظام المرتبطون بـ BioTime:</b> ${Number(data.linkedEmployees || 0)}<br/>
                <b>موظفون لهم بصمة اليوم:</b> ${Number(data.employeesWithPunches || 0)}<br/>
                <b>البصمات المربوطة:</b> ${Number(data.mapped || 0)}<br/>
                <b>الموظفون المحدّث حضورهم:</b> ${Number(data.attendanceUpdated || 0)}<br/>
                <b>بصمات غير مربوطة:</b> ${Number(data.unmapped || 0)}
              </div>
            `
          });
        }
      } catch (error) {
        setBioSyncInfo({
          error: error?.message || "تعذر مزامنة BioTime"
        });

        if (!silent) {
          await Swal.fire({
            icon: "error",
            title: "تعذر مزامنة BioTime",
            text: error?.message || "حدث خطأ أثناء مزامنة البصمات"
          });
        }
      } finally {
        bioSyncInFlightRef.current = false;
        setBioSyncLoading(false);
      }
    },
    [date, loadRows]
  );

  // المزامنة مع BioTime تتم الآن داخل BackgroundService في الـ API،
  // وليس من المتصفح. الصفحة هنا تقوم فقط بتحديث الجريد بهدوء
  // حتى تظهر البصمات الجديدة بدون Loading أو إعادة رسم مزعجة.
  useEffect(() => {
    if (!date || date !== todayValue()) {
      return undefined;
    }

    const refreshGrid = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      loadRows({ silent: true });
    };

    const intervalId = window.setInterval(refreshGrid, 10000);

    return () => window.clearInterval(intervalId);
  }, [date, loadRows]);

  const selectedCount = selectedEmployeeGuids.length;

  const isEmployeeSelected = useCallback(
    (employeeGuid) =>
      selectedEmployeeGuids.includes(employeeGuid),
    [selectedEmployeeGuids]
  );

  const toggleEmployeeSelection = useCallback(
    (employeeGuid) => {
      if (!employeeGuid) return;

      setSelectedEmployeeGuids((current) =>
        current.includes(employeeGuid)
          ? current.filter((guid) => guid !== employeeGuid)
          : [...current, employeeGuid]
      );
    },
    []
  );

  const currentPageEmployeeGuids = useMemo(
    () =>
      rows
        .map((row) => row?.employeeGuid)
        .filter(Boolean),
    [rows]
  );

  const currentPageAllSelected =
    currentPageEmployeeGuids.length > 0 &&
    currentPageEmployeeGuids.every((guid) =>
      selectedEmployeeGuids.includes(guid)
    );

  const toggleCurrentPageSelection = useCallback(() => {
    setSelectedEmployeeGuids((current) => {
      const pageSet = new Set(currentPageEmployeeGuids);
      const currentSet = new Set(current);

      const allSelected =
        currentPageEmployeeGuids.length > 0 &&
        currentPageEmployeeGuids.every((guid) =>
          currentSet.has(guid)
        );

      if (allSelected) {
        return current.filter((guid) => !pageSet.has(guid));
      }

      currentPageEmployeeGuids.forEach((guid) =>
        currentSet.add(guid)
      );

      return Array.from(currentSet);
    });
  }, [currentPageEmployeeGuids]);

  const openBulkAssignment = useCallback(() => {
    if (!selectedEmployeeGuids.length) {
      return;
    }

    setBulkAssignmentForm(emptyAssignment());
    setBulkAssignmentOpen(true);
  }, [selectedEmployeeGuids]);

  const toggleBulkWorkDay = useCallback((bit) => {
    setBulkAssignmentForm((current) => ({
      ...current,
      workDaysMask:
        (Number(current.workDaysMask) & bit)
          ? Number(current.workDaysMask) & ~bit
          : Number(current.workDaysMask) | bit
    }));
  }, []);

  const saveBulkAssignment = useCallback(async () => {
    if (
      !selectedEmployeeGuids.length ||
      !bulkAssignmentForm.shiftGuid
    ) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "حدد الموظفين واختر الوردية"
      });
      return;
    }

    if (!Number(bulkAssignmentForm.workDaysMask)) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "اختر أيام العمل الأسبوعية"
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد التوزيع الجماعي",
      text: `سيتم تعيين الوردية إلى ${selectedEmployeeGuids.length} موظف.`,
      showCancelButton: true,
      confirmButtonText: "تعيين الوردية",
      cancelButtonText: "رجوع"
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setBulkAssignmentSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/assign-shift/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            employeeGuids: selectedEmployeeGuids,
            shiftGuid: bulkAssignmentForm.shiftGuid,
            effectiveFrom:
              bulkAssignmentForm.effectiveFrom,
            effectiveTo:
              bulkAssignmentForm.effectiveTo || null,
            workDaysMask:
              Number(bulkAssignmentForm.workDaysMask),
            notes:
              bulkAssignmentForm.notes.trim() || null,
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
            "تعذر تعيين الوردية للمجموعة"
        );
      }

      setBulkAssignmentOpen(false);
      setSelectedEmployeeGuids([]);

      await Swal.fire({
        icon: "success",
        title: "تم التوزيع",
        text:
          result?.message ||
          "تم تعيين الوردية للمجموعة بنجاح"
      });

      await loadRows();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التوزيع",
        text:
          error?.message ||
          "حدث خطأ أثناء تعيين الوردية للمجموعة"
      });
    } finally {
      setBulkAssignmentSaving(false);
    }
  }, [
    selectedEmployeeGuids,
    bulkAssignmentForm,
    loadRows
  ]);

  const loadBioEmployees = useCallback(
    async (value = "", employeeGuid = null) => {
      const cleanValue = value.trim();

      // لا يوجد تحميل أولي ولا تشابه أسماء.
      // اكتب حرفين على الأقل ثم نبحث مباشرة في BioTime.
      if (cleanValue.length < 2) {
        setBioRows([]);
        setBioLoading(false);
        return;
      }

      setBioLoading(true);

      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: "30",
          search: cleanValue
        });

        if (employeeGuid) {
          params.set("employeeGuid", employeeGuid);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/hr/attendance/biotime/employees?${params.toString()}`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error
              ? `${result?.message || "تعذر البحث في BioTime"}: ${result.error}`
              : result?.message ||
                "تعذر البحث في BioTime"
          );
        }

        setBioRows(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        setBioRows([]);

        await Swal.fire({
          icon: "error",
          title: "تعذر البحث في BioTime",
          text:
            error?.message ||
            "راجع اتصال BioTime في الـ API"
        });
      } finally {
        setBioLoading(false);
      }
    },
    []
  );

  const openBioLink = useCallback(
    (row) => {
      setBioEmployee(row);
      setBioSearch("");
      setBioRows([]);
      setBioLoading(false);
      setBioDialogOpen(true);

      // مهم للسرعة:
      // لا نستدعي BioTime عند فتح النافذة.
      // البحث يبدأ فقط بعد أن يكتب المستخدم الاسم/الكود.
    },
    []
  );

  const linkBioEmployee = useCallback(
    async (bio) => {
      if (
        !bioEmployee?.employeeGuid ||
        !bio?.id ||
        !bio?.empCode
      ) {
        return;
      }

      setBioSavingId(bio.id);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/hr/attendance/biotime/link`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              employeeGuid:
                bioEmployee.employeeGuid,
              bioTimeEmployeeId:
                Number(bio.id),
              bioTimeEmpCode:
                String(bio.empCode),
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
              "تعذر ربط موظف BioTime"
          );
        }

        setBioDialogOpen(false);

        const linkedToday =
          Number(result?.data?.linkedPunchesToday || 0);

        await Swal.fire({
          icon: "success",
          title: "تم ربط البصمة",
          text:
            linkedToday > 0
              ? `${bioEmployee.employeeName} مرتبط الآن بـ ${bio.fullName || bio.empCode} وتم ربط ${linkedToday} بصمة موجودة لليوم فورًا.`
              : `${bioEmployee.employeeName} مرتبط الآن بـ ${bio.fullName || bio.empCode}`
        });

        await loadRows();
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "تعذر الربط",
          text:
            error?.message ||
            "حدث خطأ أثناء ربط موظف BioTime"
        });
      } finally {
        setBioSavingId(null);
      }
    },
    [bioEmployee, loadRows]
  );

  const unlinkBioEmployee = useCallback(
    async (row) => {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "إلغاء ربط البصمة؟",
        text:
          `سيتم فصل ${row?.employeeName || "الموظف"} عن BioTime فقط بدون حذف أي بيانات أخرى.`,
        showCancelButton: true,
        confirmButtonText: "إلغاء الربط",
        cancelButtonText: "رجوع"
      });

      if (!confirm.isConfirmed) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/hr/attendance/biotime/unlink`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              employeeGuid:
                row.employeeGuid,
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
              "تعذر إلغاء ربط BioTime"
          );
        }

        await loadRows();
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "تعذر إلغاء الربط",
          text:
            error?.message ||
            "حدث خطأ أثناء إلغاء الربط"
        });
      }
    },
    [loadRows]
  );

  useEffect(() => {
    if (!bioDialogOpen) {
      return undefined;
    }

    const cleanSearch = bioSearch.trim();

    if (cleanSearch.length < 2) {
      setBioRows([]);
      setBioLoading(false);
      return undefined;
    }

    // Debounce بسيط فقط بعد الكتابة؛ لا يوجد تحميل كتالوج أو تشابه.
    const timer = window.setTimeout(
      () =>
        loadBioEmployees(
          cleanSearch,
          bioEmployee?.employeeGuid || null
        ),
      450
    );

    return () => window.clearTimeout(timer);
  }, [
    bioDialogOpen,
    bioSearch,
    bioEmployee?.employeeGuid,
    loadBioEmployees
  ]);


  const loadBioBulkWorkspace = useCallback(
    async ({
      searchValue = bioBulkSearch,
      branchValue = bioBulkBranchGuid,
      pageValue = bioBulkPage,
      pageSizeValue = bioBulkPageSize,
      silent = false
    } = {}) => {
      if (!silent) setBioBulkLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(pageValue || 1),
          pageSize: String(pageSizeValue || 30)
        });

        if (searchValue?.trim()) {
          params.set("search", searchValue.trim());
        }

        if (branchValue) {
          params.set("branchGuid", branchValue);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/hr/attendance/biotime/bulk/workspace?${params.toString()}`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error
              ? `${result?.message || "تعذر تحميل مركز الربط الجماعي"}: ${result.error}`
              : result?.message ||
                "تعذر تحميل مركز الربط الجماعي"
          );
        }

        const employees = Array.isArray(result?.employees)
          ? result.employees
          : [];

        const candidates = Array.isArray(
          result?.availableBioEmployees
        )
          ? result.availableBioEmployees
          : [];

        setBioBulkEmployees(employees);
        setBioBulkCandidates(candidates);
        setBioBulkTotalCount(
          Number(result?.totalCount || 0)
        );
        setBioBulkPageCount(
          Number(result?.pageCount || 0)
        );
        setBioBulkStats({
          linkedEmployees: Number(
            result?.stats?.linkedEmployees || 0
          ),
          unlinkedEmployees: Number(
            result?.stats?.unlinkedEmployees || 0
          ),
          cachedBioEmployees: Number(
            result?.stats?.cachedBioEmployees || 0
          ),
          cacheLastSync:
            result?.stats?.cacheLastSync || null
        });

        // Do not auto-approve anything.
        // We only preselect the strongest suggestion for convenience.
        setBioBulkSelections((current) => {
          const next = { ...current };

          employees.forEach((employee) => {
            if (next[employee.employeeGuid]) return;

            const top =
              Array.isArray(employee?.suggestions) &&
              employee.suggestions.length
                ? employee.suggestions[0]
                : null;

            if (top && Number(top.score || 0) >= 55) {
              next[employee.employeeGuid] = {
                bioTimeEmployeeId:
                  Number(top.bioTimeEmployeeId),
                bioTimeEmpCode:
                  String(top.bioTimeEmpCode || ""),
                fullName: top.fullName || "",
                departmentName:
                  top.departmentName || "",
                areasText: top.areasText || "",
                score: Number(top.score || 0),
                label: top.label || "",
                reasons:
                  Array.isArray(top.reasons)
                    ? top.reasons
                    : []
              };
            }
          });

          return next;
        });
      } catch (error) {
        if (!silent) {
          await Swal.fire({
            icon: "error",
            title: "تعذر تحميل الربط الجماعي",
            text:
              error?.message ||
              "حدث خطأ أثناء تحميل مركز الربط"
          });
        }
      } finally {
        if (!silent) setBioBulkLoading(false);
      }
    },
    [
      bioBulkSearch,
      bioBulkBranchGuid,
      bioBulkPage,
      bioBulkPageSize
    ]
  );

  const openBioBulkCenter = useCallback(async () => {
    setBioBulkOpen(true);
    setBioBulkSearch("");
    setBioBulkBranchGuid("");
    setBioBulkPage(1);
    setBioBulkSelections({});
    setBioBulkApproved({});

    await loadBioBulkWorkspace({
      searchValue: "",
      branchValue: "",
      pageValue: 1,
      pageSizeValue: bioBulkPageSize
    });
  }, [loadBioBulkWorkspace, bioBulkPageSize]);

  const refreshBioBulkCache = useCallback(async () => {
    setBioBulkRefreshing(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/biotime/bulk/cache-refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(getActor())
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error
            ? `${result?.message || "تعذر تحديث موظفي BioTime"}: ${result.error}`
            : result?.message ||
              "تعذر تحديث موظفي BioTime"
        );
      }

      setBioBulkSelections({});
      setBioBulkApproved({});

      await loadBioBulkWorkspace({
        pageValue: 1
      });

      await Swal.fire({
        icon: "success",
        title: "تم تحديث موظفي BioTime",
        text: `تم حفظ ${Number(
          result?.data?.cached || 0
        )} موظف في الكاش المحلي للمراجعة السريعة.`
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحديث BioTime",
        text:
          error?.message ||
          "حدث خطأ أثناء تحديث موظفي BioTime"
      });
    } finally {
      setBioBulkRefreshing(false);
    }
  }, [loadBioBulkWorkspace]);

  const bioBulkApprovedLinks = useMemo(() => {
    return bioBulkEmployees
      .filter(
        (employee) =>
          Boolean(
            bioBulkApproved[employee.employeeGuid]
          ) &&
          Boolean(
            bioBulkSelections[
              employee.employeeGuid
            ]?.bioTimeEmployeeId
          )
      )
      .map((employee) => {
        const selected =
          bioBulkSelections[
            employee.employeeGuid
          ];

        return {
          employeeGuid: employee.employeeGuid,
          bioTimeEmployeeId:
            Number(selected.bioTimeEmployeeId),
          bioTimeEmpCode:
            String(selected.bioTimeEmpCode || "")
        };
      })
      .filter(
        (item) =>
          item.bioTimeEmployeeId > 0 &&
          item.bioTimeEmpCode
      );
  }, [
    bioBulkEmployees,
    bioBulkApproved,
    bioBulkSelections
  ]);

  const saveBioBulkLinks = useCallback(async () => {
    if (!bioBulkApprovedLinks.length) {
      await Swal.fire({
        icon: "warning",
        title: "لا توجد روابط معتمدة",
        text:
          "راجع الموظفين وحدد اعتماد بجانب كل ربط صحيح أولًا."
      });
      return;
    }

    const duplicateBioIds =
      bioBulkApprovedLinks
        .map((x) => x.bioTimeEmployeeId)
        .filter(
          (id, index, arr) =>
            arr.indexOf(id) !== index
        );

    if (duplicateBioIds.length) {
      await Swal.fire({
        icon: "error",
        title: "يوجد تكرار",
        text:
          "نفس موظف BioTime مختار لأكثر من موظف. عدّل الاختيارات قبل الاعتماد."
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "اعتماد الربط الجماعي؟",
      html: `
        <div style="text-align:right;line-height:1.9">
          سيتم ربط <b>${bioBulkApprovedLinks.length}</b> موظف فقط.<br/>
          الموظفون غير المحدد أمامهم <b>اعتماد</b> لن يتم لمسهم.<br/>
          لا يتم الربط التلقائي بدون مراجعتك.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "اعتماد الربط",
      cancelButtonText: "مراجعة أكثر"
    });

    if (!confirm.isConfirmed) return;

    setBioBulkSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/biotime/bulk/link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            links: bioBulkApprovedLinks,
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
            "تعذر تنفيذ الربط الجماعي"
        );
      }

      setBioBulkSelections({});
      setBioBulkApproved({});

      await Promise.all([
        loadBioBulkWorkspace({
          pageValue: 1
        }),
        loadRows({ silent: true })
      ]);

      await Swal.fire({
        icon: "success",
        title: "تم الربط الجماعي",
        text:
          result?.message ||
          "تم حفظ الروابط بنجاح"
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الربط الجماعي",
        text:
          error?.message ||
          "حدث خطأ أثناء الربط الجماعي"
      });
    } finally {
      setBioBulkSaving(false);
    }
  }, [
    bioBulkApprovedLinks,
    loadBioBulkWorkspace,
    loadRows
  ]);

  useEffect(() => {
    if (!bioBulkOpen) return undefined;

    const timer = window.setTimeout(() => {
      setBioBulkPage(1);
      loadBioBulkWorkspace({
        searchValue: bioBulkSearch,
        branchValue: bioBulkBranchGuid,
        pageValue: 1
      });
    }, bioBulkSearch.trim() ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [
    bioBulkOpen,
    bioBulkSearch,
    bioBulkBranchGuid
  ]);

  const previewBioExcel = useCallback(async (file) => {
    if (!file) return;

    if (!String(file.name || "").toLowerCase().endsWith(".xlsx")) {
      await Swal.fire({
        icon: "warning",
        title: "ملف غير مدعوم",
        text: "اختر ملف Excel بصيغة XLSX"
      });
      return;
    }

    setBioExcelLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/biotime/excel/preview`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error
            ? `${result?.message || "تعذر قراءة ملف البصمة"}: ${result.error}`
            : result?.message || "تعذر قراءة ملف البصمة"
        );
      }

      const nextRows = Array.isArray(result?.data)
        ? result.data
        : [];

      const nextSelections = {};
      nextRows.forEach((row) => {
        if (row?.bestMatch?.employeeGuid) {
          nextSelections[row.rowKey] = row.bestMatch;
        }
      });

      setBioExcelFile(file);
      setBioExcelRows(nextRows);
      setBioExcelSheets(
        Array.isArray(result?.sheets) ? result.sheets : []
      );
      setBioExcelStats({
        totalRows: Number(result?.stats?.totalRows || 0),
        strongMatches: Number(result?.stats?.strongMatches || 0),
        likelyMatches: Number(result?.stats?.likelyMatches || 0),
        reviewMatches: Number(result?.stats?.reviewMatches || 0),
        alreadyLinked: Number(result?.stats?.alreadyLinked || 0),
        unmatched: Number(result?.stats?.unmatched || 0),
        duplicateCodes: Number(result?.stats?.duplicateCodes || 0),
        sheetCount: Number(result?.stats?.sheetCount || 0)
      });
      setBioExcelSelections(nextSelections);
      setBioExcelApproved({});
    } catch (error) {
      setBioExcelRows([]);
      setBioExcelSheets([]);
      setBioExcelSelections({});
      setBioExcelApproved({});

      await Swal.fire({
        icon: "error",
        title: "تعذر مطابقة ملف البصمة",
        text:
          error?.message ||
          "حدث خطأ أثناء قراءة ملف Excel"
      });
    } finally {
      setBioExcelLoading(false);
    }
  }, []);

  const bioExcelVisibleRows = useMemo(() => {
    const term = bioExcelSearch.trim().toLowerCase();

    return bioExcelRows.filter((row) => {
      if (
        bioExcelStatus !== "all" &&
        row?.status !== bioExcelStatus
      ) {
        return false;
      }

      if (!term) return true;

      const selected = bioExcelSelections[row.rowKey];

      return [
        row.sheetName,
        row.excelName,
        row.identityNumber,
        row.fingerprintCode,
        row.statusLabel,
        selected?.employeeName,
        selected?.employeeCode,
        selected?.branchName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [
    bioExcelRows,
    bioExcelSearch,
    bioExcelStatus,
    bioExcelSelections
  ]);

  const bioExcelApprovedLinks = useMemo(() => {
    return bioExcelRows
      .filter((row) => Boolean(bioExcelApproved[row.rowKey]))
      .map((row) => {
        const selected = bioExcelSelections[row.rowKey];

        if (!selected?.employeeGuid || !row?.fingerprintCode) {
          return null;
        }

        return {
          rowKey: row.rowKey,
          employeeGuid: selected.employeeGuid,
          fingerprintCode: String(row.fingerprintCode),
          bioTimeEmployeeId:
            Number(row.bioTimeEmployeeId || 0) > 0
              ? Number(row.bioTimeEmployeeId)
              : null
        };
      })
      .filter(Boolean);
  }, [bioExcelRows, bioExcelApproved, bioExcelSelections]);

  const approveStrongBioExcelMatches = useCallback(() => {
    const next = {};

    bioExcelRows.forEach((row) => {
      const selected = bioExcelSelections[row.rowKey];
      const score = Number(selected?.score || 0);

      if (
        row?.canLink &&
        row?.status !== "employee-conflict" &&
        row?.status !== "duplicate-code" &&
        row?.status !== "already-linked" &&
        selected?.employeeGuid &&
        score >= 85
      ) {
        next[row.rowKey] = true;
      }
    });

    setBioExcelApproved(next);
  }, [bioExcelRows, bioExcelSelections]);

  const saveBioExcelLinks = useCallback(async () => {
    if (!bioExcelApprovedLinks.length) {
      await Swal.fire({
        icon: "warning",
        title: "لا توجد روابط معتمدة",
        text: "راجع المطابقات وحدد اعتماد أمام الموظفين الصحيحين أولًا."
      });
      return;
    }

    const employeeGuids = bioExcelApprovedLinks.map(
      (item) => item.employeeGuid
    );
    const fingerprintCodes = bioExcelApprovedLinks.map(
      (item) => String(item.fingerprintCode)
    );

    const hasDuplicateEmployee = employeeGuids.some(
      (value, index) => employeeGuids.indexOf(value) !== index
    );
    const hasDuplicateFingerprint = fingerprintCodes.some(
      (value, index) => fingerprintCodes.indexOf(value) !== index
    );

    if (hasDuplicateEmployee || hasDuplicateFingerprint) {
      await Swal.fire({
        icon: "error",
        title: "يوجد تعارض في الاختيارات",
        text: hasDuplicateEmployee
          ? "نفس موظف النظام مختار لأكثر من صف. عدّل الاختيارات قبل الحفظ."
          : "نفس رقم البصمة مختار أكثر من مرة. عدّل الاختيارات قبل الحفظ."
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "اعتماد ربط ملف البصمة؟",
      html: `
        <div style="text-align:right;line-height:1.9">
          سيتم ربط <b>${bioExcelApprovedLinks.length}</b> موظف فقط.<br/>
          رقم البصمة الموجود في Excel سيُحفظ كـ <b>BioTime EmpCode</b>.<br/>
          الصفوف غير المحدد أمامها اعتماد لن يتم تعديلها.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "اعتماد الربط",
      cancelButtonText: "مراجعة أكثر"
    });

    if (!confirm.isConfirmed) return;

    setBioExcelSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/biotime/excel/link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            links: bioExcelApprovedLinks.map((item) => ({
              employeeGuid: item.employeeGuid,
              fingerprintCode: item.fingerprintCode,
              bioTimeEmployeeId: item.bioTimeEmployeeId
            })),
            ...getActor()
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error
            ? `${result?.message || "تعذر حفظ روابط Excel"}: ${result.error}`
            : result?.message || "تعذر حفظ روابط Excel"
        );
      }

      await loadRows({ silent: true });

      if (bioExcelFile) {
        await previewBioExcel(bioExcelFile);
      }

      await Swal.fire({
        icon: "success",
        title: "تم ربط ملف البصمة",
        text:
          result?.message ||
          "تم حفظ روابط الموظفين بنجاح"
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر ربط ملف البصمة",
        text:
          error?.message ||
          "حدث خطأ أثناء حفظ الروابط"
      });
    } finally {
      setBioExcelSaving(false);
    }
  }, [
    bioExcelApprovedLinks,
    bioExcelFile,
    previewBioExcel,
    loadRows
  ]);

  const loadReportEmployees = useCallback(async (searchValue = "") => {
    setReportLoadingEmployees(true);
    try {
      const params = new URLSearchParams();
      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/report/employees?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "تعذر تحميل الموظفين");
      }

      setReportEmployees(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (error) {
      setReportEmployees([]);
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل الموظفين",
        text: error?.message || "حدث خطأ أثناء تحميل موظفي التقرير"
      });
    } finally {
      setReportLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    if (!reportMode) return undefined;

    const timer = window.setTimeout(() => {
      loadReportEmployees(reportEmployeeSearch);
    }, reportEmployeeSearch.trim() ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [reportMode, reportEmployeeSearch, loadReportEmployees]);

  const openAttendanceReport = useCallback(async () => {
    setReportData(null);
    setReportSyncProgress("");
    setReportMode(true);
    setReportOpen(false);

    if (!reportEmployees.length) {
      await loadReportEmployees("");
    }
  }, [reportEmployees.length, loadReportEmployees]);

  const closeAttendanceReport = useCallback(() => {
    setReportMode(false);
    setReportSyncProgress("");
    setReportData(null);
  }, []);

  const enumerateDates = useCallback((fromDate, toDate) => {
    const result = [];
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return result;
    }
    for (
      let current = new Date(start);
      current <= end;
      current.setDate(current.getDate() + 1)
    ) {
      result.push(current.toISOString().slice(0, 10));
    }
    return result;
  }, []);

  const runAttendanceReport = useCallback(async () => {
    if (!reportForm.employeeGuid) {
      await Swal.fire({
        icon: "warning",
        title: "اختر الموظف",
        text: "اكتب اسم الموظف ثم اختره من النتائج"
      });
      return;
    }

    const dates = enumerateDates(
      reportForm.fromDate,
      reportForm.toDate
    );

    if (!dates.length) {
      await Swal.fire({
        icon: "warning",
        title: "راجع الفترة",
        text: "تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية"
      });
      return;
    }

    if (dates.length > 366) {
      await Swal.fire({
        icon: "warning",
        title: "الفترة كبيرة",
        text: "الحد الأقصى للتقرير سنة واحدة"
      });
      return;
    }

    setReportLoading(true);
    setReportData(null);

    try {
      if (dates.length <= 93) {
        setReportSyncProgress("جاري تحديث بصمات الموظف للفترة المحددة...");

        const syncResponse = await fetch(
          `${API_BASE_URL}/api/hr/attendance/biotime/sync-range`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              employeeGuid: reportForm.employeeGuid,
              fromDate: reportForm.fromDate,
              toDate: reportForm.toDate,
              ...getActor()
            })
          }
        );

        const syncResult = await syncResponse.json().catch(() => null);

        if (!syncResponse.ok) {
          throw new Error(
            syncResult?.error
              ? `${syncResult?.message || "تعذر مزامنة BioTime"}: ${syncResult.error}`
              : syncResult?.message || "تعذر مزامنة BioTime"
          );
        }
      } else {
        setReportSyncProgress(
          "الفترة أكبر من 93 يومًا — سيتم استخدام البيانات المخزنة مباشرة"
        );
      }

      setReportSyncProgress("جاري تجهيز التقرير...");

      const params = new URLSearchParams({
        employeeGuid: reportForm.employeeGuid,
        fromDate: reportForm.fromDate,
        toDate: reportForm.toDate
      });

      const response = await fetch(
        `${API_BASE_URL}/api/hr/attendance/report?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error
            ? `${result?.message || "تعذر إنشاء التقرير"}: ${result.error}`
            : result?.message || "تعذر إنشاء التقرير"
        );
      }

      setReportData(result);
      setReportSyncProgress("");
    } catch (error) {
      setReportSyncProgress("");
      await Swal.fire({
        icon: "error",
        title: "تعذر إنشاء التقرير",
        text: error?.message || "حدث خطأ أثناء تجهيز تقرير الحضور"
      });
    } finally {
      setReportLoading(false);
    }
  }, [reportForm, enumerateDates]);

  const permissionReportText = (row) => {
    const labels = [];
    if (row?.hasLateArrivalPermission) labels.push("إذن تأخير");
    if (row?.hasEarlyLeavePermission) labels.push("إذن انصراف مبكر");
    if (row?.hasDuringWorkPermission) labels.push("إذن أثناء الدوام");
    if (row?.hasFullDayPermission) labels.push("إذن يوم كامل");
    return labels.length ? labels.join(" + ") : "-";
  };

  const exportAttendanceReportCsv = useCallback(() => {
    const rows = Array.isArray(reportData?.data)
      ? reportData.data
      : [];

    if (!rows.length) return;

    const headers = [
      "التاريخ",
      "اليوم",
      "الوردية",
      "الحضور",
      "الانصراف",
      "ساعات العمل بالدقائق",
      "التأخير بالدقائق",
      "الخروج المبكر بالدقائق",
      "الإضافي بالدقائق",
      "الحالة",
      "الأذونات المعتمدة",
      "عدد البصمات"
    ];

    const values = rows.map((row) => [
      row.attendanceDate || "",
      row.dayName || "",
      row.shiftName || "",
      row.checkInAt ? formatTime(row.checkInAt) : "",
      row.checkOutAt ? formatTime(row.checkOutAt) : "",
      Number(row.workedMinutes || 0),
      Number(row.lateMinutes || 0),
      Number(row.earlyLeaveMinutes || 0),
      Number(row.overtimeMinutes || 0),
      statusMeta(row.status).label,
      permissionReportText(row),
      Number(row.punchCount || 0)
    ]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = "\uFEFF" +
      [headers, ...values]
        .map((line) => line.map(escapeCsv).join(","))
        .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-report-${reportForm.fromDate}-${reportForm.toDate}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [reportData, reportForm]);

  const printAttendanceReport = useCallback(() => {
    const rows = Array.isArray(reportData?.data)
      ? reportData.data
      : [];
    if (!rows.length) return;

    const employee = reportData?.employee || {};
    const summary = reportData?.summary || {};

    const htmlRows = rows.map((row) => `
      <tr>
        <td>${row.attendanceDate || ""}</td>
        <td>${row.dayName || ""}</td>
        <td>${row.shiftName || "-"}</td>
        <td>${row.checkInAt ? formatTime(row.checkInAt) : "-"}</td>
        <td>${row.checkOutAt ? formatTime(row.checkOutAt) : "-"}</td>
        <td>${minutesToText(row.workedMinutes)}</td>
        <td>${minutesToText(row.lateMinutes)}</td>
        <td>${minutesToText(row.earlyLeaveMinutes)}</td>
        <td>${minutesToText(row.overtimeMinutes)}</td>
        <td>${statusMeta(row.status).label}</td>
      </tr>
    `).join("");

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;

    win.document.write(`
      <!doctype html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <title>تقرير الحضور والانصراف</title>
        <style>
          body{font-family:Arial,Tahoma,sans-serif;padding:24px;color:#1f2937}
          h1{color:#034d31;margin:0 0 6px}
          .meta{margin-bottom:16px;color:#475569}
          .cards{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
          .card{border:1px solid #dce8e2;border-radius:10px;padding:10px 14px;min-width:120px}
          .card b{display:block;color:#034d31;font-size:18px}
          table{width:100%;border-collapse:collapse;font-size:12px}
          th,td{border:1px solid #dce8e2;padding:7px;text-align:center}
          th{background:#f1f7f4;color:#034d31}
          @media print{body{padding:0}.no-print{display:none}}
        </style>
      </head>
      <body>
        <h1>تقرير الحضور والانصراف</h1>
        <div class="meta">
          <b>${employee.employeeName || ""}</b>
          ${employee.branchName ? ` — ${employee.branchName}` : ""}
          <br/>الفترة: ${reportForm.fromDate} إلى ${reportForm.toDate}
        </div>
        <div class="cards">
          <div class="card">أيام الفترة<b>${summary.totalDays || 0}</b></div>
          <div class="card">حضور<b>${summary.presentDays || 0}</b></div>
          <div class="card">تأخير<b>${summary.lateDays || 0}</b></div>
          <div class="card">غياب<b>${summary.absentDays || 0}</b></div>
          <div class="card">ساعات العمل<b>${minutesToText(summary.workedMinutes)}</b></div>
          <div class="card">إجمالي التأخير<b>${minutesToText(summary.lateMinutes)}</b></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th><th>اليوم</th><th>الوردية</th>
              <th>الحضور</th><th>الانصراف</th><th>ساعات العمل</th>
              <th>التأخير</th><th>خروج مبكر</th><th>إضافي</th><th>الحالة</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    printWhenReady(win);
  }, [reportData, reportForm]);

  const statCards = [
    [
      "الحاضرون",
      stats.presentCount,
      "success"
    ],
    [
      "المتأخرون",
      stats.lateCount,
      "warning"
    ],
    [
      "الغياب",
      stats.absentCount,
      "error"
    ],
    [
      "لم يسجلوا",
      stats.pendingCount,
      "default"
    ],
    [
      "بدون وردية",
      stats.noScheduleCount,
      "default"
    ],
    [
      "إضافي",
      minutesToText(
        stats.overtimeMinutes
      ),
      "info"
    ]
  ];

  const content = (
    <Box
      dir={PAGE_DIRECTION}
      sx={{
        minHeight: "100vh",
        bgcolor: bg,
        p: { xs: 0.8, sm: 1.3, md: 1.8 },
        textAlign: PAGE_TEXT_ALIGN
      }}
    >
      <Box sx={{ maxWidth: "100%", minWidth: 0, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: primaryDark,
            color: "#fff",
            p: { xs: 1.2, sm: 1.25 },
            borderRadius: 3,
            mb: 1.3
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row"
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center"
            }}
            spacing={1}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              {!isDesktop && (
                <IconButton
                  onClick={() =>
                    setMobileSidebarOpen(true)
                  }
                  sx={{ color: "#fff" }}
                >
                  <MenuRoundedIcon />
                </IconButton>
              )}

              <AccessTimeRoundedIcon />

              <Box>
                <Typography className="hr-page-title"
                  sx={{
                    fontWeight: 950,
                    fontSize: {
                      xs: 18,
                      sm: uiLayout.hrTokens.title
                    }
                  }}
                >
                  الحضور والانصراف
                </Typography>

                <Typography
                  sx={{
                    opacity: 0.75,
                    fontSize: 12
                  }}
                >
                  الحضور والتأخير والغياب والساعات الإضافية والورديات
                </Typography>
              </Box>
            </Stack>

            <Stack sx={uiLayout.actionBarSx}
              direction="row"
              spacing={0.6}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                variant="outlined"
                onClick={() =>
                  reportMode
                    ? closeAttendanceReport()
                    : openAttendanceReport()
                }
                sx={uiLayout.withUiSx({
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.45)",
                  fontWeight: 900,
                  bgcolor: reportMode
                    ? "rgba(255,255,255,.12)"
                    : "transparent"
                }, uiLayout.buttonSx)}
              >
                {reportMode ? "العودة للحضور اليومي" : "تقرير الفترة"}
              </Button>

              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => {
                  setBioExcelOpen(true);
                  setBioExcelSearch("");
                  setBioExcelStatus("all");
                }}
                sx={uiLayout.withUiSx({
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.45)",
                  fontWeight: 900
                }, uiLayout.buttonSx)}
              >
                رفع Excel البصمة
              </Button>

              <Button
                variant="outlined"
                startIcon={<GroupWorkRoundedIcon />}
                onClick={openBioBulkCenter}
                sx={uiLayout.withUiSx({
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.45)",
                  fontWeight: 900
                }, uiLayout.buttonSx)}
              >
                ربط جماعي BioTime
              </Button>

              <Button
                variant="outlined"
                startIcon={<SettingsRoundedIcon />}
                onClick={() => {
                  if (shifts.length) {
                    openEditShift(shifts[0]);
                  } else {
                    openNewShift();
                  }
                }}
                sx={uiLayout.withUiSx({
                  color: "#fff",
                  borderColor:
                    "rgba(255,255,255,.45)",
                  fontWeight: 900
                }, uiLayout.buttonSx)}
              >
                إعداد الورديات
              </Button>

              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={openNewShift}
                sx={uiLayout.withUiSx({
                  color: "#fff",
                  borderColor:
                    "rgba(255,255,255,.45)",
                  fontWeight: 900
                }, uiLayout.buttonSx)}
              >
                وردية جديدة
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  bioSyncLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <FingerprintRoundedIcon />
                  )
                }
                onClick={() =>
                  syncBioTimeAttendance({ silent: false })
                }
                disabled={bioSyncLoading}
                sx={uiLayout.withUiSx({
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.45)",
                  fontWeight: 900
                }, uiLayout.buttonSx)}
              >
                {bioSyncLoading
                  ? "جارٍ مزامنة البصمات..."
                  : "مزامنة BioTime"}
              </Button>

              <Button
                variant="contained"
                startIcon={<GroupWorkRoundedIcon />}
                onClick={openBulkAssignment}
                disabled={!selectedCount}
                sx={uiLayout.withUiSx({
                  bgcolor: "#fff",
                  color: primaryDark,
                  fontWeight: 950,
                  "&:hover": {
                    bgcolor: "#f4fff9"
                  },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(255,255,255,.18)",
                    color: "rgba(255,255,255,.55)"
                  }
                }, uiLayout.buttonSx)}
              >
                تعيين للمحدد
                {selectedCount > 0
                  ? ` (${selectedCount})`
                  : ""}
              </Button>

              <Tooltip title="تحديث">
                <IconButton
                  onClick={() => {
                    loadLookups();
                    loadRows();
                  }}
                  sx={{ color: "#fff" }}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {bioSyncInfo && (
          <Alert
            severity={bioSyncInfo?.error ? "warning" : "success"}
            sx={{ mb: 1.1, borderRadius: 2 }}
          >
            {bioSyncInfo?.error
              ? `BioTime: ${bioSyncInfo.error}`
              : `BioTime مباشر كل 10 ثوانٍ • المرتبطون: ${Number(bioSyncInfo.linkedEmployees || 0)} • لهم بصمة اليوم: ${Number(bioSyncInfo.employeesWithPunches || 0)} • آخر دفعة جديدة: ${Number(bioSyncInfo.inserted || 0)} • غير مربوطة: ${Number(bioSyncInfo.unmapped || 0)}`}
          </Alert>
        )}

        {reportMode && (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.2, md: 1.7 },
                borderRadius: 2.8,
                border: `1px solid ${border}`,
                mb: 1.3,
                bgcolor: "#fff"
              }}
            >
              <Stack sx={uiLayout.filterBarSx}
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                  sx={{ flex: 1, minWidth: { md: 360 } }}
                  options={reportEmployees}
                  value={reportSelectedEmployee}
                  loading={reportLoadingEmployees}
                  filterOptions={(options) => options}
                  isOptionEqualToValue={(option, value) =>
                    option?.employeeGuid === value?.employeeGuid
                  }
                  getOptionLabel={(option) =>
                    option
                      ? `${option.employeeName || ""}${
                          option.branchName ? ` — ${option.branchName}` : ""
                        }`
                      : ""
                  }
                  onInputChange={(_event, value, reason) => {
                    if (reason !== "reset") {
                      setReportEmployeeSearch(value);
                    }
                  }}
                  onChange={(_event, value) => {
                    setReportSelectedEmployee(value || null);
                    setReportForm((current) => ({
                      ...current,
                      employeeGuid: value?.employeeGuid || ""
                    }));
                    setReportData(null);
                  }}
                  noOptionsText={
                    reportEmployeeSearch.trim()
                      ? "لا توجد نتائج مطابقة"
                      : "اكتب اسم الموظف"
                  }
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      key={option.employeeGuid}
                      sx={{ py: 1 }}
                    >
                      <Box sx={{ width: "100%" }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                          {option.employeeName}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 12, mt: 0.2 }}
                        >
                          {option.branchName || "فرع غير محدد"}
                          {option.bioTimeEmpCode
                            ? ` • BioTime #${option.bioTimeEmpCode}`
                            : " • غير مربوط بالبصمة"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      {...params}
                      size="small"
                      label="الموظف"
                      placeholder="اكتب اسم الموظف للبحث..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchRoundedIcon fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {reportLoadingEmployees ? (
                              <CircularProgress size={16} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />

                <TextField
                  size="small"
                  type="date"
                  label="من"
                  value={reportForm.fromDate}
                  onChange={(e) => {
                    setReportForm((current) => ({
                      ...current,
                      fromDate: e.target.value
                    }));
                    setReportData(null);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={uiLayout.withUiSx({ width: { xs: "100%", md: 170 } }, uiLayout.formFieldSx)}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <TextField
                  size="small"
                  type="date"
                  label="إلى"
                  value={reportForm.toDate}
                  onChange={(e) => {
                    setReportForm((current) => ({
                      ...current,
                      toDate: e.target.value
                    }));
                    setReportData(null);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={uiLayout.withUiSx({ width: { xs: "100%", md: 170 } }, uiLayout.formFieldSx)}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <Button
                  variant="contained"
                  onClick={runAttendanceReport}
                  disabled={reportLoading || !reportForm.employeeGuid}
                  sx={uiLayout.withUiSx({
                    minWidth: 145,
                    height: 40,
                    bgcolor: primary,
                    fontWeight: 950
                  }, uiLayout.buttonSx)}
                >
                  {reportLoading ? "جاري التجهيز..." : "عرض التقرير"}
                </Button>
              </Stack>

              {reportSyncProgress && (
                <Alert
                  severity="info"
                  icon={<CircularProgress size={16} />}
                  sx={{ mt: 1.1, borderRadius: 2 }}
                >
                  {reportSyncProgress}
                </Alert>
              )}
            </Paper>

            {reportData ? (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.25,
                    borderRadius: 2.8,
                    border: `1px solid ${border}`,
                    mb: 1.1,
                    bgcolor: "#fff"
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                    alignItems={{ xs: "stretch", md: "center" }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                        {reportData?.employee?.employeeName || ""}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12, mt: 0.25 }}
                      >
                        {reportData?.employee?.branchName || ""}
                        {reportData?.employee?.bioTimeEmpCode
                          ? ` • BioTime #${reportData.employee.bioTimeEmpCode}`
                          : ""}
                        {` • ${reportForm.fromDate} إلى ${reportForm.toDate}`}
                      </Typography>
                    </Box>

                    <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.7}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={exportAttendanceReportCsv}
                        sx={uiLayout.withUiSx({ fontWeight: 850 }, uiLayout.buttonSx)}
                      >
                        Excel / CSV
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={printAttendanceReport}
                        sx={uiLayout.withUiSx({ fontWeight: 850 }, uiLayout.buttonSx)}
                      >
                        طباعة
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2,minmax(0,1fr))",
                      md: "repeat(6,minmax(0,1fr))"
                    },
                    gap: 0.9,
                    mb: 1.1
                  }}
                >
                  {[
                    ["أيام الفترة", reportData?.summary?.totalDays || 0],
                    ["الحضور", reportData?.summary?.presentDays || 0],
                    ["التأخير", reportData?.summary?.lateDays || 0],
                    ["الغياب", reportData?.summary?.absentDays || 0],
                    ["ساعات العمل", minutesToText(reportData?.summary?.workedMinutes)],
                    ["إجمالي التأخير", minutesToText(reportData?.summary?.lateMinutes)]
                  ].map(([label, value]) => (
                    <Paper
                      key={label}
                      elevation={0}
                      sx={{
                        p: 1,
                        borderRadius: 2.2,
                        border: `1px solid ${border}`,
                        bgcolor: "#fff"
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12, fontWeight: 800 }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.15,
                          fontSize: 19,
                          fontWeight: 950,
                          color: primaryDark
                        }}
                      >
                        {value}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2.8,
                    border: `1px solid ${border}`,
                    width: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                    bgcolor: "#fff"
                  }}
                >
                  <Box sx={{ width: "100%", minWidth: 0, overflowX: { xs: "auto", lg: "hidden" }, bgcolor: "#fff" }}>
                    <Box
                      sx={{
                        width: "100%",
                        minWidth: { xs: 920, lg: 0 },
                        display: "grid",
                        gridTemplateColumns:
                          "1.05fr 0.75fr 1.2fr 0.85fr 0.85fr 1fr 0.75fr 0.85fr 0.75fr 1fr 1.35fr 0.65fr",
                        px: 1.2,
                        py: 1,
                        bgcolor: "#edf6f1",
                        borderBottom: `1px solid ${border}`,
                        fontSize: 12,
                        fontWeight: 950,
                        color: primaryDark
                      }}
                    >
                      <Box>التاريخ</Box>
                      <Box>اليوم</Box>
                      <Box>الوردية</Box>
                      <Box>الحضور</Box>
                      <Box>الانصراف</Box>
                      <Box>ساعات العمل</Box>
                      <Box>التأخير</Box>
                      <Box>خروج مبكر</Box>
                      <Box>إضافي</Box>
                      <Box>الحالة</Box>
                      <Box>الإذن المعتمد</Box>
                      <Box>البصمات</Box>
                    </Box>

                    {(reportData?.data || []).map((row, index) => {
                      const rowMeta = statusMeta(row.status);
                      return (
                        <Box
                          key={`${row.attendanceDate}-${index}`}
                          sx={{
                            width: "100%",
                            minWidth: { xs: 920, lg: 0 },
                            display: "grid",
                            gridTemplateColumns:
                              "1.05fr 0.75fr 1.2fr 0.85fr 0.85fr 1fr 0.75fr 0.85fr 0.75fr 1fr 1.35fr 0.65fr",
                            px: 1.2,
                            py: 0.9,
                            alignItems: "center",
                            borderBottom:
                              index === (reportData?.data || []).length - 1
                                ? "none"
                                : `1px solid ${border}`,
                            bgcolor:
                              row.status === "Absent"
                                ? "#fff8f8"
                                : index % 2
                                  ? "#fbfdfc"
                                  : "#fff",
                            fontSize: 12
                          }}
                        >
                          <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
                            {row.attendanceDate || "-"}
                          </Typography>
                          <Typography sx={{ fontSize: 12 }}>
                            {row.dayName || "-"}
                          </Typography>
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
                              {row.shiftName || "-"}
                            </Typography>
                            {row.shiftStartTime && row.shiftEndTime && (
                              <Typography
                                color="text.secondary"
                                sx={{ fontSize: 12 }}
                              >
                                {formatTimeSpan(row.shiftStartTime)}
                                {" - "}
                                {formatTimeSpan(row.shiftEndTime)}
                              </Typography>
                            )}
                          </Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
                            {formatTime(row.checkInAt)}
                          </Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
                            {formatTime(row.checkOutAt)}
                          </Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
                            {minutesToText(row.workedMinutes)}
                          </Typography>
                          <Typography sx={{ fontSize: 12 }}>
                            {minutesToText(row.lateMinutes)}
                          </Typography>
                          <Typography sx={{ fontSize: 12 }}>
                            {minutesToText(row.earlyLeaveMinutes)}
                          </Typography>
                          <Typography sx={{ fontSize: 12 }}>
                            {minutesToText(row.overtimeMinutes)}
                          </Typography>
                          <Chip
                            size="small"
                            label={rowMeta.label}
                            color={rowMeta.color}
                            sx={{ height: 23, fontWeight: 900, width: "fit-content" }}
                          />
                          <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
                            {permissionReportText(row)}
                          </Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
                            {Number(row.punchCount || 0)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {!(reportData?.data || []).length && (
                    <Alert severity="info" sx={{ m: 1 }}>
                      لا توجد بيانات لهذه الفترة.
                    </Alert>
                  )}
                </Paper>
              </>
            ) : (
              !reportLoading && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: 2.8,
                    border: `1px dashed ${border}`,
                    bgcolor: "#fff"
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: primaryDark }}>
                    اختر الموظف والفترة ثم اضغط "عرض التقرير"
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.5, fontSize: 12 }}
                  >
                    البحث بالاسم سريع ومباشر، والمزامنة تتم مرة واحدة للفترة المحددة.
                  </Typography>
                </Paper>
              )
            )}
          </Box>
        )}

        {!reportMode && (
          <>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              md: "repeat(6,minmax(0,1fr))"
            },
            gap: 1,
            mb: 1.3
          }}
        >
          {statCards.map(
            ([label, value, tone]) => (
              <Paper
                key={label}
                elevation={0}
                sx={{
                  p: 1.1,
                  borderRadius: 2.4,
                  border:
                    tone === "error"
                      ? "1px solid #efb2b2"
                      : tone === "warning"
                        ? "1px solid #efd29a"
                        : `1px solid ${border}`,
                  bgcolor:
                    tone === "error"
                      ? "#fff8f8"
                      : tone === "warning"
                        ? "#fffaf2"
                        : "#fff"
                }}
              >
                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: 12,
                    fontWeight: 800
                  }}
                >
                  {label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    fontWeight: 950,
                    fontSize: 22,
                    color: primaryDark
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
            borderRadius: 2.4,
            border: `1px solid ${border}`,
            mb: 1.3
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: uiLayout.filterColumns,
              gap: 1
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.formFieldSx}
              size="small"
              type="date"
              label="التاريخ"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPageNumber(1);
              }}
              InputLabelProps={{
                shrink: true
              }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              placeholder="ابحث باسم الموظف أو الكود..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                )
              }}
            />

            <FormControl sx={uiLayout.formFieldSx} size="small">
              <InputLabel>الفرع</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الفرع"
                value={branchGuid}
                onChange={(e) => {
                  setBranchGuid(
                    e.target.value
                  );
                  setPageNumber(1);
                }}
              >
                <MenuItem value="">
                  كل الفروع
                </MenuItem>

                {lookups.branches.map(
                  (item) => (
                    <MenuItem
                      key={item?.guid}
                      value={item?.guid || ""}
                    >
                      {item?.name ||
                        "غير محدد"}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl sx={uiLayout.formFieldSx} size="small">
              <InputLabel>القسم</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="القسم"
                value={departmentGuid}
                onChange={(e) => {
                  setDepartmentGuid(
                    e.target.value
                  );
                  setPageNumber(1);
                }}
              >
                <MenuItem value="">
                  كل الأقسام
                </MenuItem>

                {lookups.departments.map(
                  (item) => (
                    <MenuItem
                      key={
                        item?.guid ||
                        item?.id
                      }
                      value={item?.guid || ""}
                    >
                      {item?.name ||
                        "غير محدد"}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl sx={uiLayout.formFieldSx} size="small">
              <InputLabel>الحالة</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الحالة"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPageNumber(1);
                }}
              >
                {statusOptions.map(
                  ([value, label]) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {label}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl sx={uiLayout.formFieldSx} size="small">
              <InputLabel>الصفوف</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الصفوف"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(
                    Number(e.target.value)
                  );
                  setPageNumber(1);
                }}
              >
                {[10, 20, 50].map(
                  (size) => (
                    <MenuItem
                      key={size}
                      value={size}
                    >
                      {size}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 0.85,
            borderRadius: 2.4,
            border: `1px solid ${border}`,
            mb: 1.3,
            bgcolor: selectedCount
              ? "#f1fbf6"
              : "#fff"
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row"
            }}
            alignItems={{
              xs: "stretch",
              sm: "center"
            }}
            justifyContent="space-between"
            spacing={0.8}
          >
            <Stack
              direction="row"
              spacing={0.8}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    checked={currentPageAllSelected}
                    indeterminate={
                      !currentPageAllSelected &&
                      currentPageEmployeeGuids.some(
                        (guid) =>
                          selectedEmployeeGuids.includes(
                            guid
                          )
                      )
                    }
                    onChange={toggleCurrentPageSelection}
                  />
                }
                label="تحديد الصفحة الحالية"
              />

              <Chip
                size="small"
                label={`المحدد: ${selectedCount}`}
                color={
                  selectedCount
                    ? "success"
                    : "default"
                }
                variant={
                  selectedCount
                    ? "filled"
                    : "outlined"
                }
                sx={{ fontWeight: 900 }}
              />

              {selectedCount > 0 && (
                <Button sx={uiLayout.buttonSx}
                  size="small"
                  onClick={() =>
                    setSelectedEmployeeGuids([])
                  }
                >
                  إلغاء التحديد
                </Button>
              )}
            </Stack>

            <Button
              variant="contained"
              startIcon={<GroupWorkRoundedIcon />}
              disabled={!selectedCount}
              onClick={openBulkAssignment}
              sx={uiLayout.withUiSx({
                bgcolor: primary,
                fontWeight: 950
              }, uiLayout.buttonSx)}
            >
              تعيين وردية للمحدد
            </Button>
          </Stack>
        </Paper>

        {loading ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 320,
              display: "grid",
              placeItems: "center",
              borderRadius: 2.5,
              border: `1px solid ${border}`
            }}
          >
            <CircularProgress />
          </Paper>
        ) : (
          <Stack spacing={0.8}>
            {rows.map((row) => {
              const meta =
                statusMeta(row.status);

              return (
                <Paper
                  key={row.employeeGuid}
                  elevation={0}
                  sx={{
                    p: 1.1,
                    borderRadius: 2.5,
                    border:
                      row.status === "Absent"
                        ? "1px solid #efb0b0"
                        : row.status === "Late"
                          ? "1px solid #eed09a"
                          : `1px solid ${border}`,
                    bgcolor:
                      row.status === "Absent"
                        ? "#fff8f8"
                        : row.status === "Late"
                          ? "#fffaf2"
                          : "#fff"
                  }}
                >
                  <Box
                    sx={{
                      ...uiLayout.attendanceRowSx,

                      // Desktop attendance rows need to prioritize employee identity.
                      // Keep the branch readable instead of squeezing it behind the
                      // attendance/status/action columns.
                      ...(isDesktop
                        ? {
                            gridTemplateColumns:
                              "minmax(340px,2.35fr) minmax(100px,.72fr) minmax(74px,.5fr) minmax(74px,.5fr) minmax(88px,.6fr) minmax(102px,.72fr) minmax(142px,auto)",
                            columnGap: 0.85,
                            rowGap: 0.45,
                            alignItems: "center"
                          }
                        : {})
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={isDesktop ? 0.45 : 0.7}
                        alignItems="flex-start"
                      >
                        <Checkbox
                          checked={isEmployeeSelected(
                            row.employeeGuid
                          )}
                          onChange={() =>
                            toggleEmployeeSelection(
                              row.employeeGuid
                            )
                          }
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                          size="small"
                          sx={{ p: 0.3 }}
                        />

                        <Box
                          sx={{
                            width: isDesktop ? 30 : 34,
                            height: isDesktop ? 30 : 34,
                            flexShrink: 0,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "#edf7f2",
                            color: primary
                          }}
                        >
                          <BadgeRoundedIcon
                            fontSize="small"
                          />
                        </Box>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 950,
                              fontSize: isDesktop ? 12.5 : 14,
                              lineHeight: 1.3,
                              whiteSpace: "normal",
                              overflowWrap: "anywhere"
                            }}
                          >
                            {row.employeeName}
                          </Typography>

                          <Typography
                            color="text.secondary"
                            sx={{
                              mt: 0.1,
                              fontSize: isDesktop ? 10.5 : 12,
                              lineHeight: 1.35,
                              whiteSpace: "normal",
                              overflow: "visible",
                              textOverflow: "clip",
                              overflowWrap: "anywhere"
                            }}
                          >
                            #{row.employeeCode || "-"}
                            {" • "}
                            {row.jobTitle ||
                              "غير محدد"}
                            {" • "}
                            {row.departmentName ||
                              "غير محدد"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.3}
                            alignItems="flex-start"
                            sx={{
                              mt: 0.18,
                              minWidth: 0,
                              color: "text.secondary"
                            }}
                          >
                            <BusinessRoundedIcon
                              sx={{
                                fontSize: isDesktop ? 11 : 13,
                                mt: 0.15,
                                flexShrink: 0
                              }}
                            />
                            <Typography
                              title={row.branchName || "الفرع غير محدد"}
                              sx={{
                                minWidth: 0,
                                fontSize: isDesktop ? 10.5 : 12,
                                lineHeight: 1.35,
                                fontWeight: 850,
                                whiteSpace: "normal",
                                overflow: "visible",
                                textOverflow: "clip",
                                overflowWrap: "anywhere"
                              }}
                            >
                              {row.branchName ||
                                "الفرع غير محدد"}
                            </Typography>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={0.35}
                            alignItems="center"
                            sx={{ mt: isDesktop ? 0.28 : 0.45 }}
                          >
                            <Chip
                              size="small"
                              icon={<FingerprintRoundedIcon />}
                              label={
                                row.bioTimeEnabled &&
                                (row.bioTimeEmployeeId || row.bioTimeEmpCode)
                                  ? `BioTime #${row.bioTimeEmpCode || row.bioTimeEmployeeId}`
                                  : "غير مربوط بالبصمة"
                              }
                              color={
                                row.bioTimeEnabled &&
                                (row.bioTimeEmployeeId || row.bioTimeEmpCode)
                                  ? "success"
                                  : "default"
                              }
                              variant="outlined"
                              sx={[hrChipSx("small"), {
                                height: isDesktop ? 20 : 22,
                                fontSize: isDesktop ? 10 : 12,
                                fontWeight: 850,
                                "& .MuiChip-icon": {
                                  fontSize: isDesktop ? 13 : undefined
                                }
                              }]}
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: isDesktop ? 10.5 : 12 }}
                      >
                        الوردية
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: isDesktop ? 11 : 12,
                          lineHeight: 1.35
                        }}
                      >
                        {row.shiftName ||
                          "غير محدد"}
                      </Typography>

                      {row.shiftGuid && (
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: isDesktop ? 10.5 : 12, lineHeight: 1.3 }}
                        >
                          {formatTimeSpan(
                            row.shiftStartTime
                          )}
                          {" - "}
                          {formatTimeSpan(
                            row.shiftEndTime
                          )}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: isDesktop ? 10.5 : 12 }}
                      >
                        الحضور
                      </Typography>

                      <Typography sx={{ fontWeight: 900, fontSize: isDesktop ? 11.5 : undefined }}>
                        {formatTime(
                          row.checkInAt
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: isDesktop ? 10.5 : 12 }}
                      >
                        الانصراف
                      </Typography>

                      <Typography sx={{ fontWeight: 900, fontSize: isDesktop ? 11.5 : undefined }}>
                        {formatTime(
                          row.checkOutAt
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: isDesktop ? 10.5 : 12 }}
                      >
                        ساعات العمل
                      </Typography>

                      <Typography sx={{ fontWeight: 900, fontSize: isDesktop ? 11.5 : undefined }}>
                        {minutesToText(
                          row.workedMinutes
                        )}
                      </Typography>

                      {Number(
                        row.overtimeMinutes || 0
                      ) > 0 && (
                        <Typography
                          sx={{
                            color: primary,
                            fontSize: isDesktop ? 10.5 : 12,
                            fontWeight: 850
                          }}
                        >
                          إضافي{" "}
                          {minutesToText(
                            row.overtimeMinutes
                          )}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: isDesktop ? 10.5 : 12 }}
                      >
                        الحالة
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.4}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 0.25 }}
                      >
                        <Chip
                          size="small"
                          label={meta.label}
                          color={meta.color}
                          sx={{
                            height: isDesktop ? 21 : 24,
                            fontSize: isDesktop ? 10.5 : undefined,
                            fontWeight: 900
                          }}
                        />

                        {Number(
                          row.lateMinutes || 0
                        ) > 0 && (
                          <Chip
                            size="small"
                            icon={
                              <WarningAmberRoundedIcon />
                            }
                            label={`تأخير ${minutesToText(
                              row.lateMinutes
                            )}`}
                            color="warning"
                            variant="outlined"
                            sx={[hrChipSx("small"), {
                              height: isDesktop ? 21 : 24,
                              fontSize: isDesktop ? 10 : undefined
                            }]}
                          />
                        )}

                        {row.checkInAt &&
                          !row.checkOutAt && (
                            <Chip
                              size="small"
                              label="لم يسجل انصراف"
                              color="info"
                              variant="outlined"
                              sx={{
                                height: isDesktop ? 21 : 24,
                                fontSize: isDesktop ? 10 : undefined
                              }}
                            />
                          )}
                      </Stack>
                    </Box>

                    <Stack
                      sx={{
                        ...uiLayout.actionBarSx,
                        minWidth: 0,
                        "& .MuiIconButton-root": {
                          width: isDesktop ? 30 : undefined,
                          height: isDesktop ? 30 : undefined,
                          p: isDesktop ? 0.45 : undefined
                        },
                        "& .MuiButton-root": {
                          minHeight: isDesktop ? 30 : undefined,
                          px: isDesktop ? 0.8 : undefined,
                          fontSize: isDesktop ? "0.68rem" : undefined,
                          whiteSpace: "nowrap"
                        },
                        "& .MuiButton-startIcon": {
                          ml: isDesktop ? 0.35 : undefined,
                          mr: 0
                        },
                        "& .MuiSvgIcon-root": {
                          fontSize: isDesktop ? "1rem" : undefined
                        }
                      }}
                      direction="row"
                      spacing={isDesktop ? 0.3 : 0.4}
                      justifyContent="flex-start"
                      alignItems="center"
                      flexWrap="nowrap"
                    >
                      {row.bioTimeEnabled &&
                      (row.bioTimeEmployeeId || row.bioTimeEmpCode) ? (
                        <Tooltip
                          title={`BioTime ID: ${row.bioTimeEmployeeId} - كود: ${row.bioTimeEmpCode || "-"}`}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              unlinkBioEmployee(row)
                            }
                            sx={{
                              border: `1px solid ${border}`,
                              borderRadius: 1.5,
                              color: primary
                            }}
                          >
                            <LinkOffRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="ربط الموظف مع BioTime">
                          <IconButton
                            size="small"
                            onClick={() =>
                              openBioLink(row)
                            }
                            sx={{
                              border: `1px solid ${border}`,
                              borderRadius: 1.5,
                              color: primary
                            }}
                          >
                            <FingerprintRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {!row.shiftGuid ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={
                            <ScheduleRoundedIcon />
                          }
                          onClick={() =>
                            openAssignment(row)
                          }
                          sx={uiLayout.withUiSx({
                            minWidth: isDesktop ? 88 : 115,
                            bgcolor: primary,
                            fontWeight: 900
                          }, uiLayout.buttonSx)}
                        >
                          تعيين وردية
                        </Button>
                      ) : (
                        <>
                          {!row.checkInAt && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={
                                <LoginRoundedIcon />
                              }
                              onClick={() =>
                                openAttendance(
                                  row,
                                  "checkin"
                                )
                              }
                              sx={uiLayout.withUiSx({
                                minWidth: isDesktop ? 72 : 95,
                                bgcolor: primary,
                                fontWeight: 900
                              }, uiLayout.buttonSx)}
                            >
                              حضور
                            </Button>
                          )}

                          {row.checkInAt &&
                            !row.checkOutAt && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={
                                  <LogoutRoundedIcon />
                                }
                                onClick={() =>
                                  openAttendance(
                                    row,
                                    "checkout"
                                  )
                                }
                                sx={uiLayout.withUiSx({
                                  minWidth: 95,
                                  bgcolor: primary,
                                  fontWeight: 900
                                }, uiLayout.buttonSx)}
                              >
                                انصراف
                              </Button>
                            )}

                          <Tooltip title="تعديل الحضور">
                            <IconButton
                              size="small"
                              onClick={() =>
                                openAttendance(
                                  row,
                                  "edit"
                                )
                              }
                              sx={{
                                border: `1px solid ${border}`,
                                borderRadius: 1.5
                              }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="تغيير الوردية">
                            <IconButton
                              size="small"
                              onClick={() =>
                                openAssignment(row)
                              }
                              sx={{
                                border: `1px solid ${border}`,
                                borderRadius: 1.5
                              }}
                            >
                              <ScheduleRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </Box>
                </Paper>
              );
            })}

            {!rows.length && (
              <Alert severity="info">
                لا توجد نتائج مطابقة.
              </Alert>
            )}
          </Stack>
        )}

        {pageCount > 1 && (
          <Box
            sx={{
              mt: 1.4,
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Pagination
              count={pageCount}
              page={pageNumber}
              onChange={(_e, value) =>
                setPageNumber(value)
              }
              color="primary"
            />
          </Box>
        )}
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><>
      <Box sx={[navigationContentSx, uiLayout.scopeSx]}>{content}</Box>

      {/* Shift dialog */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={shiftDialogOpen}
        onClose={() =>
          setShiftDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          {shiftForm.shiftGuid
            ? "تعديل الوردية"
            : "إضافة وردية"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.1}>
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="اسم الوردية"
              value={shiftForm.shiftName}
              onChange={(e) =>
                setShiftForm((current) => ({
                  ...current,
                  shiftName: e.target.value
                }))
              }
            />

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 1
              }, uiLayout.formSectionSx)}
            >
              <TextField sx={uiLayout.formFieldSx}
                type="time"
                label="بداية الوردية"
                value={shiftForm.startTime}
                onChange={(e) =>
                  setShiftForm((current) => ({
                    ...current,
                    startTime: e.target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx}
                type="time"
                label="نهاية الوردية"
                value={shiftForm.endTime}
                onChange={(e) =>
                  setShiftForm((current) => ({
                    ...current,
                    endTime: e.target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                type="number"
                label="سماح التأخير - دقيقة"
                value={shiftForm.graceMinutes}
                onChange={(e) =>
                  setShiftForm((current) => ({
                    ...current,
                    graceMinutes:
                      e.target.value
                  }))
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                type="number"
                label="سماح الانصراف المبكر"
                value={
                  shiftForm
                    .earlyLeaveGraceMinutes
                }
                onChange={(e) =>
                  setShiftForm((current) => ({
                    ...current,
                    earlyLeaveGraceMinutes:
                      e.target.value
                  }))
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                type="number"
                label="أقل مدة تحسب إضافي"
                value={
                  shiftForm.minOvertimeMinutes
                }
                onChange={(e) =>
                  setShiftForm((current) => ({
                    ...current,
                    minOvertimeMinutes:
                      e.target.value
                  }))
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Box>

            <FormControlLabel sx={uiLayout.checkboxFieldSx}
              control={
                <Checkbox
                  checked={shiftForm.isActive}
                  onChange={(e) =>
                    setShiftForm((current) => ({
                      ...current,
                      isActive:
                        e.target.checked
                    }))
                  }
                />
              }
              label="الوردية نشطة"
            />

            {shifts.length > 0 && (
              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    mb: 0.6
                  }}
                >
                  الورديات الحالية
                </Typography>

                <Stack spacing={0.5}>
                  {shifts.map((shift) => (
                    <Paper
                      key={shift.shiftGuid}
                      variant="outlined"
                      sx={{
                        p: 0.8,
                        borderRadius: 2,
                        borderColor: border
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography
                            fontWeight={900}
                          >
                            {shift.shiftName}
                          </Typography>

                          <Typography
                            color="text.secondary"
                            sx={{ fontSize: 12 }}
                          >
                            {formatTimeSpan(
                              shift.startTime
                            )}
                            {" - "}
                            {formatTimeSpan(
                              shift.endTime
                            )}
                            {" • سماح "}
                            {shift.graceMinutes}
                            {" د"}
                          </Typography>
                        </Box>

                        <Button sx={uiLayout.buttonSx}
                          size="small"
                          onClick={() =>
                            openEditShift(shift)
                          }
                        >
                          تعديل
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setShiftDialogOpen(false)
            }
            disabled={shiftSaving}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveShift}
            disabled={shiftSaving}
            sx={uiLayout.withUiSx({ bgcolor: primary }, uiLayout.buttonSx)}
          >
            {shiftSaving
              ? "جاري الحفظ..."
              : "حفظ الوردية"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment dialog */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={assignmentOpen}
        onClose={() =>
          setAssignmentOpen(false)
        }
        fullWidth
        maxWidth="sm"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          تعيين وردية للموظف
        </DialogTitle>

        <DialogContent dividers>
          <Stack sx={uiLayout.formSectionSx} spacing={1.1}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderRadius: 2,
                borderColor: border
              }}
            >
              <Typography fontWeight={950}>
                {assignmentEmployee?.employeeName ||
                  "-"}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12 }}
              >
                {assignmentEmployee?.jobTitle ||
                  "غير محدد"}
                {" • "}
                {assignmentEmployee?.branchName ||
                  "الفرع غير محدد"}
              </Typography>
            </Paper>

            <FormControl sx={uiLayout.formFieldSx}>
              <InputLabel>الوردية</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الوردية"
                value={assignmentForm.shiftGuid}
                onChange={(e) =>
                  setAssignmentForm(
                    (current) => ({
                      ...current,
                      shiftGuid:
                        e.target.value
                    })
                  )
                }
              >
                {shifts
                  .filter(
                    (shift) =>
                      shift.isActive !== false
                  )
                  .map((shift) => (
                    <MenuItem
                      key={shift.shiftGuid}
                      value={shift.shiftGuid}
                    >
                      {shift.shiftName} —{" "}
                      {formatTimeSpan(
                        shift.startTime
                      )}
                      {" - "}
                      {formatTimeSpan(
                        shift.endTime
                      )}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 1
              }, uiLayout.formSectionSx)}
            >
              <TextField sx={uiLayout.formFieldSx}
                type="date"
                label="ساري من"
                value={
                  assignmentForm.effectiveFrom
                }
                onChange={(e) =>
                  setAssignmentForm(
                    (current) => ({
                      ...current,
                      effectiveFrom:
                        e.target.value
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx}
                type="date"
                label="ساري حتى"
                value={
                  assignmentForm.effectiveTo
                }
                onChange={(e) =>
                  setAssignmentForm(
                    (current) => ({
                      ...current,
                      effectiveTo:
                        e.target.value
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  mb: 0.6
                }}
              >
                أيام العمل الأسبوعية
              </Typography>

              <Stack
                direction="row"
                spacing={0.5}
                flexWrap="wrap"
                useFlexGap
              >
                {dayOptions.map((day) => {
                  const checked =
                    Boolean(
                      Number(
                        assignmentForm
                          .workDaysMask
                      ) & day.bit
                    );

                  return (
                    <Chip
                      key={day.bit}
                      clickable
                      color={
                        checked
                          ? "success"
                          : "default"
                      }
                      variant={
                        checked
                          ? "filled"
                          : "outlined"
                      }
                      label={day.label}
                      onClick={() =>
                        toggleWorkDay(day.bit)
                      }
                    />
                  );
                })}
              </Stack>
            </Box>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="ملاحظات"
              value={assignmentForm.notes}
              onChange={(e) =>
                setAssignmentForm(
                  (current) => ({
                    ...current,
                    notes: e.target.value
                  })
                )
              }
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setAssignmentOpen(false)
            }
            disabled={assignmentSaving}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveAssignment}
            disabled={assignmentSaving}
            sx={uiLayout.withUiSx({ bgcolor: primary }, uiLayout.buttonSx)}
          >
            {assignmentSaving
              ? "جاري الحفظ..."
              : "تعيين الوردية"}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Bulk shift assignment dialog */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={bulkAssignmentOpen}
        onClose={() =>
          !bulkAssignmentSaving &&
          setBulkAssignmentOpen(false)
        }
        fullWidth
        maxWidth="sm"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          تعيين وردية لمجموعة موظفين
        </DialogTitle>

        <DialogContent dividers>
          <Stack sx={uiLayout.formSectionSx} spacing={1.1}>
            <Alert severity="info">
              تم تحديد{" "}
              <strong>{selectedCount}</strong>
              {" "}موظف. سيتم تطبيق نفس الوردية وأيام
              العمل عليهم جميعًا مع الاحتفاظ بسجل
              التكليفات السابقة.
            </Alert>

            <FormControl sx={uiLayout.formFieldSx}>
              <InputLabel>الوردية</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الوردية"
                value={bulkAssignmentForm.shiftGuid}
                onChange={(e) =>
                  setBulkAssignmentForm(
                    (current) => ({
                      ...current,
                      shiftGuid: e.target.value
                    })
                  )
                }
              >
                {shifts
                  .filter(
                    (shift) =>
                      shift.isActive !== false
                  )
                  .map((shift) => (
                    <MenuItem
                      key={shift.shiftGuid}
                      value={shift.shiftGuid}
                    >
                      {shift.shiftName} —{" "}
                      {formatTimeSpan(
                        shift.startTime
                      )}
                      {" - "}
                      {formatTimeSpan(
                        shift.endTime
                      )}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 1
              }, uiLayout.formSectionSx)}
            >
              <TextField sx={uiLayout.formFieldSx}
                type="date"
                label="ساري من"
                value={
                  bulkAssignmentForm.effectiveFrom
                }
                onChange={(e) =>
                  setBulkAssignmentForm(
                    (current) => ({
                      ...current,
                      effectiveFrom: e.target.value
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx}
                type="date"
                label="ساري حتى"
                value={
                  bulkAssignmentForm.effectiveTo
                }
                onChange={(e) =>
                  setBulkAssignmentForm(
                    (current) => ({
                      ...current,
                      effectiveTo: e.target.value
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  mb: 0.6
                }}
              >
                أيام العمل الأسبوعية
              </Typography>

              <Stack
                direction="row"
                spacing={0.5}
                flexWrap="wrap"
                useFlexGap
              >
                {dayOptions.map((day) => {
                  const checked =
                    Boolean(
                      Number(
                        bulkAssignmentForm
                          .workDaysMask
                      ) & day.bit
                    );

                  return (
                    <Chip
                      key={day.bit}
                      clickable
                      color={
                        checked
                          ? "success"
                          : "default"
                      }
                      variant={
                        checked
                          ? "filled"
                          : "outlined"
                      }
                      label={day.label}
                      onClick={() =>
                        toggleBulkWorkDay(day.bit)
                      }
                    />
                  );
                })}
              </Stack>
            </Box>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="ملاحظات على التوزيع"
              value={bulkAssignmentForm.notes}
              onChange={(e) =>
                setBulkAssignmentForm(
                  (current) => ({
                    ...current,
                    notes: e.target.value
                  })
                )
              }
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setBulkAssignmentOpen(false)
            }
            disabled={bulkAssignmentSaving}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveBulkAssignment}
            disabled={
              bulkAssignmentSaving ||
              !selectedCount
            }
            sx={uiLayout.withUiSx({ bgcolor: primary }, uiLayout.buttonSx)}
          >
            {bulkAssignmentSaving
              ? "جاري التوزيع..."
              : `تعيين لـ ${selectedCount} موظف`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance edit dialog */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={attendanceOpen}
        onClose={() =>
          setAttendanceOpen(false)
        }
        fullWidth
        maxWidth="sm"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          تسجيل / تعديل الحضور
        </DialogTitle>

        <DialogContent dividers>
          <Stack sx={uiLayout.formSectionSx} spacing={1.1}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderRadius: 2,
                borderColor: border
              }}
            >
              <Typography fontWeight={950}>
                {attendanceEmployee?.employeeName ||
                  "-"}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12 }}
              >
                {attendanceEmployee?.shiftName ||
                  "بدون وردية"}
                {" • "}
                {date}
              </Typography>
            </Paper>

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 1
              }, uiLayout.formSectionSx)}
            >
              <TextField sx={uiLayout.formFieldSx}
                type="datetime-local"
                label="وقت الحضور"
                value={attendanceForm.checkInAt}
                onChange={(e) =>
                  setAttendanceForm(
                    (current) => ({
                      ...current,
                      checkInAt:
                        e.target.value
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx}
                type="datetime-local"
                label="وقت الانصراف"
                value={attendanceForm.checkOutAt}
                onChange={(e) =>
                  setAttendanceForm(
                    (current) => ({
                      ...current,
                      checkOutAt:
                        e.target.value
                    })
                  )
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Box>

            <FormControl sx={uiLayout.formFieldSx}>
              <InputLabel>الحالة</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الحالة"
                value={attendanceForm.status}
                onChange={(e) =>
                  setAttendanceForm(
                    (current) => ({
                      ...current,
                      status:
                        e.target.value
                    })
                  )
                }
              >
                <MenuItem value="Present">
                  حاضر
                </MenuItem>
                <MenuItem value="Late">
                  متأخر
                </MenuItem>
                <MenuItem value="Absent">
                  غائب
                </MenuItem>
                <MenuItem value="Leave">
                  إجازة
                </MenuItem>
                <MenuItem value="Remote">
                  عمل عن بعد
                </MenuItem>
                <MenuItem value="Off">
                  راحة
                </MenuItem>
              </Select>
            </FormControl>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="ملاحظات"
              value={attendanceForm.notes}
              onChange={(e) =>
                setAttendanceForm(
                  (current) => ({
                    ...current,
                    notes: e.target.value
                  })
                )
              }
              multiline
              minRows={2}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              required
              label="سبب التسجيل / التعديل"
              value={attendanceForm.reason}
              onChange={(e) =>
                setAttendanceForm(
                  (current) => ({
                    ...current,
                    reason: e.target.value
                  })
                )
              }
              multiline
              minRows={2}
            />

            <Alert severity="info">
              التأخير والانصراف المبكر والساعات الإضافية
              تُحسب تلقائيًا حسب الوردية وسماحها.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setAttendanceOpen(false)
            }
            disabled={attendanceSaving}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveAttendance}
            disabled={attendanceSaving}
            sx={uiLayout.withUiSx({ bgcolor: primary }, uiLayout.buttonSx)}
          >
            {attendanceSaving
              ? "جاري الحفظ..."
              : "حفظ الحضور"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BioTime employee linking dialog */}

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={reportOpen}
        onClose={() => !reportLoading && setReportOpen(false)}
        maxWidth="lg"
        fullWidth
        dir={DIALOG_DIRECTION}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: { xs: "80vh", md: "70vh" }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          تقرير الحضور والانصراف خلال فترة
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Alert severity="info">
              اختر الموظف والفترة. للفترات حتى 31 يومًا سيتم مزامنة BioTime
              تلقائيًا يومًا بيوم قبل تجهيز التقرير، لذلك يمكنك الرجوع 4 أيام
              أو أسبوع أو شهر بدون أي خطوة إضافية.
            </Alert>

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "2fr 1fr 1fr auto"
                },
                gap: 1
              }, uiLayout.filterBarSx)}
            >
              <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                <InputLabel>الموظف</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الموظف"
                  value={reportForm.employeeGuid}
                  disabled={reportLoadingEmployees || reportLoading}
                  onChange={(e) =>
                    setReportForm((current) => ({
                      ...current,
                      employeeGuid: e.target.value
                    }))
                  }
                >
                  {reportEmployees.map((employee) => (
                    <MenuItem
                      key={employee.employeeGuid}
                      value={employee.employeeGuid}
                    >
                      {employee.employeeName}
                      {employee.branchName
                        ? ` — ${employee.branchName}`
                        : ""}
                      {employee.bioTimeEmpCode
                        ? ` — BioTime #${employee.bioTimeEmpCode}`
                        : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField sx={uiLayout.formFieldSx}
                size="small"
                type="date"
                label="من"
                value={reportForm.fromDate}
                disabled={reportLoading}
                onChange={(e) =>
                  setReportForm((current) => ({
                    ...current,
                    fromDate: e.target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx}
                size="small"
                type="date"
                label="إلى"
                value={reportForm.toDate}
                disabled={reportLoading}
                onChange={(e) =>
                  setReportForm((current) => ({
                    ...current,
                    toDate: e.target.value
                  }))
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <Button
                variant="contained"
                disabled={reportLoading || !reportForm.employeeGuid}
                onClick={runAttendanceReport}
                sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 900, minWidth: 130 }, uiLayout.buttonSx)}
              >
                {reportLoading ? "جاري التجهيز..." : "عرض التقرير"}
              </Button>
            </Box>

            {reportLoading && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <CircularProgress size={22} />
                <Typography fontWeight={850}>
                  {reportSyncProgress || "جاري تجهيز التقرير..."}
                </Typography>
              </Paper>
            )}

            {reportData && !reportLoading && (
              <>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.4, borderRadius: 2.5 }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                    spacing={1}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                        {reportData?.employee?.employeeName}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        {reportData?.employee?.branchName || "بدون فرع"}
                        {" • "}
                        {reportForm.fromDate} إلى {reportForm.toDate}
                        {reportData?.employee?.bioTimeEmpCode
                          ? ` • BioTime #${reportData.employee.bioTimeEmpCode}`
                          : ""}
                      </Typography>
                    </Box>

                    <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.7}>
                      <Button sx={uiLayout.buttonSx}
                        size="small"
                        variant="outlined"
                        onClick={exportAttendanceReportCsv}
                      >
                        Excel / CSV
                      </Button>
                      <Button sx={uiLayout.buttonSx}
                        size="small"
                        variant="outlined"
                        onClick={printAttendanceReport}
                      >
                        طباعة
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2,1fr)",
                      md: "repeat(6,1fr)"
                    },
                    gap: 0.8
                  }}
                >
                  {[
                    ["أيام الفترة", reportData?.summary?.totalDays || 0],
                    ["الحضور", reportData?.summary?.presentDays || 0],
                    ["التأخير", reportData?.summary?.lateDays || 0],
                    ["الغياب", reportData?.summary?.absentDays || 0],
                    ["ساعات العمل", minutesToText(reportData?.summary?.workedMinutes)],
                    ["إجمالي التأخير", minutesToText(reportData?.summary?.lateMinutes)]
                  ].map(([label, value]) => (
                    <Paper
                      key={label}
                      variant="outlined"
                      sx={{ p: 1, textAlign: "center", borderRadius: 2 }}
                    >
                      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        {label}
                      </Typography>
                      <Typography sx={{ fontWeight: 950, color: primaryDark }}>
                        {value}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    width: "100%",
                    minWidth: 0,
                    overflowX: { xs: "auto", lg: "hidden" },
                    overflowY: "auto",
                    bgcolor: "#fff",
                    maxHeight: 480
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      minWidth: { xs: 920, lg: 0 },
                      display: "grid",
                      gridTemplateColumns:
                        "1.05fr 0.75fr 1.2fr 0.85fr 0.85fr 1fr 0.75fr 0.85fr 0.75fr 1fr 1.35fr 0.65fr",
                      bgcolor: "#eef6f2",
                      borderBottom: `1px solid ${border}`,
                      p: 1,
                      fontSize: 12,
                      fontWeight: 950,
                      textAlign: "center"
                    }}
                  >
                    <Box>التاريخ</Box><Box>اليوم</Box><Box>الوردية</Box>
                    <Box>الحضور</Box><Box>الانصراف</Box><Box>ساعات العمل</Box>
                    <Box>التأخير</Box><Box>خروج مبكر</Box><Box>إضافي</Box>
                    <Box>الحالة</Box><Box>الإذن المعتمد</Box><Box>البصمات</Box>
                  </Box>

                  {(reportData?.data || []).map((row) => {
                    const meta = statusMeta(row.status);
                    return (
                      <Box
                        key={`${row.attendanceDate}-${row.employeeGuid}`}
                        sx={{
                          width: "100%",
                          minWidth: { xs: 920, lg: 0 },
                          display: "grid",
                          gridTemplateColumns:
                            "1.05fr 0.75fr 1.2fr 0.85fr 0.85fr 1fr 0.75fr 0.85fr 0.75fr 1fr 1.35fr 0.65fr",
                          p: 0.9,
                          alignItems: "center",
                          textAlign: "center",
                          borderBottom: `1px solid ${border}`,
                          fontSize: 12
                        }}
                      >
                        <Box>{row.attendanceDate}</Box>
                        <Box>{row.dayName}</Box>
                        <Box>{row.shiftName || "-"}</Box>
                        <Box sx={{ fontWeight: 900 }}>{formatTime(row.checkInAt)}</Box>
                        <Box sx={{ fontWeight: 900 }}>{formatTime(row.checkOutAt)}</Box>
                        <Box>{minutesToText(row.workedMinutes)}</Box>
                        <Box>{minutesToText(row.lateMinutes)}</Box>
                        <Box>{minutesToText(row.earlyLeaveMinutes)}</Box>
                        <Box>{minutesToText(row.overtimeMinutes)}</Box>
                        <Box>
                          <Chip
                            size="small"
                            label={meta.label}
                            color={meta.color}
                            sx={{ fontWeight: 900, height: 23 }}
                          />
                        </Box>
                        <Box sx={{ fontSize: 12, fontWeight: 850 }}>
                          {permissionReportText(row)}
                        </Box>
                        <Box>{Number(row.punchCount || 0)}</Box>
                      </Box>
                    );
                  })}
                </Paper>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() => setReportOpen(false)}
            disabled={reportLoading}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={bioExcelOpen}
        onClose={() =>
          !bioExcelSaving &&
          !bioExcelLoading &&
          setBioExcelOpen(false)
        }
        fullWidth
        maxWidth="xl"
        dir={DIALOG_DIRECTION}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: "82vh"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            pb: 1
          }}
        >
          مطابقة ملف Excel مع موظفي البصمة
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Alert severity="info">
              ارفع ملف <strong>XLSX</strong> الذي يحتوي على
              الاسم ورقم البصمة. النظام يقرأ كل شيت كفرع،
              يقارن اسم الموظف داخل نفس نطاق الفرع تقريبًا،
              ثم يعرض نسبة التشابه قبل أي حفظ. لا يتم ربط أي
              موظف إلا بعد تحديد <strong>اعتماد</strong>.
            </Alert>

            <Stack sx={uiLayout.actionBarSx}
              direction={{ xs: "column", md: "row" }}
              spacing={0.8}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Button
                component="label"
                variant="contained"
                startIcon={
                  bioExcelLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <UploadFileRoundedIcon />
                  )
                }
                disabled={bioExcelLoading || bioExcelSaving}
                sx={uiLayout.withUiSx({
                  bgcolor: primary,
                  fontWeight: 950,
                  minHeight: 42
                }, uiLayout.buttonSx)}
              >
                {bioExcelLoading
                  ? "جاري قراءة ومطابقة الملف..."
                  : bioExcelFile
                    ? "رفع ملف آخر"
                    : "اختيار ملف Excel"}
                <input
                  hidden
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) {
                      previewBioExcel(file);
                    }
                  }}
                />
              </Button>

              <Paper
                variant="outlined"
                sx={{
                  px: 1.2,
                  py: 0.8,
                  borderRadius: 2,
                  minHeight: 42,
                  flex: 1,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 850,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {bioExcelFile?.name ||
                    "لم يتم اختيار ملف حتى الآن"}
                </Typography>
              </Paper>

              {!!bioExcelRows.length && (
                <Button
                  variant="outlined"
                  onClick={approveStrongBioExcelMatches}
                  disabled={bioExcelSaving}
                  sx={uiLayout.withUiSx({ fontWeight: 900, minHeight: 42 }, uiLayout.buttonSx)}
                >
                  تحديد المطابق القوي
                </Button>
              )}
            </Stack>

            {!!bioExcelRows.length && (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2,minmax(0,1fr))",
                      md: "repeat(4,minmax(0,1fr))",
                      xl: "repeat(8,minmax(0,1fr))"
                    },
                    gap: 0.7
                  }}
                >
                  {[
                    ["إجمالي الصفوف", bioExcelStats.totalRows],
                    ["مطابق قوي", bioExcelStats.strongMatches],
                    ["مطابق محتمل", bioExcelStats.likelyMatches],
                    ["يحتاج مراجعة", bioExcelStats.reviewMatches],
                    ["مربوط بالفعل", bioExcelStats.alreadyLinked],
                    ["غير مطابق", bioExcelStats.unmatched],
                    ["بصمة مكررة", bioExcelStats.duplicateCodes],
                    ["عدد الشيتات", bioExcelStats.sheetCount]
                  ].map(([label, value]) => (
                    <Paper
                      key={label}
                      variant="outlined"
                      sx={{
                        p: 0.9,
                        borderRadius: 2,
                        textAlign: "center"
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12 }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 950,
                          fontSize: 18,
                          color: primaryDark
                        }}
                      >
                        {Number(value || 0)}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                {!!bioExcelSheets.length && (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    {bioExcelSheets.map((sheet) => (
                      <Chip
                        key={sheet.sheetName}
                        size="small"
                        variant="outlined"
                        label={`${sheet.sheetName}: ${sheet.total}`}
                        sx={{ fontWeight: 800 }}
                      />
                    ))}
                  </Stack>
                )}

                <Stack sx={uiLayout.formGridSx}
                  direction={{ xs: "column", md: "row" }}
                  spacing={0.8}
                >
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    size="small"
                    fullWidth
                    value={bioExcelSearch}
                    onChange={(event) =>
                      setBioExcelSearch(event.target.value)
                    }
                    placeholder="بحث بالاسم أو رقم البصمة أو الفرع..."
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
                    sx={uiLayout.withUiSx({ minWidth: 220 }, uiLayout.formFieldSx)}
                  >
                    <InputLabel>حالة المطابقة</InputLabel>
                    <Select
                  MenuProps={RTL_MENU_PROPS}
                      label="حالة المطابقة"
                      value={bioExcelStatus}
                      onChange={(event) =>
                        setBioExcelStatus(event.target.value)
                      }
                    >
                      <MenuItem value="all">كل الحالات</MenuItem>
                      <MenuItem value="strong">مطابق قوي</MenuItem>
                      <MenuItem value="likely">مطابق محتمل قوي</MenuItem>
                      <MenuItem value="review">يحتاج مراجعة</MenuItem>
                      <MenuItem value="employee-conflict">تعارض موظف</MenuItem>
                      <MenuItem value="already-linked">مربوط بالفعل</MenuItem>
                      <MenuItem value="unmatched">غير مطابق</MenuItem>
                      <MenuItem value="duplicate-code">رقم بصمة مكرر</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden"
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "54px minmax(115px,.85fr) minmax(180px,1.25fr) 90px minmax(260px,1.7fr) minmax(125px,.9fr) 90px 110px",
                      gap: 0.7,
                      alignItems: "center",
                      px: 1,
                      py: 0.9,
                      bgcolor: "#eef6f2",
                      color: primaryDark,
                      fontSize: 12,
                      fontWeight: 950,
                      borderBottom: `1px solid ${border}`
                    }}
                  >
                    <Box>اعتماد</Box>
                    <Box>فرع الشيت</Box>
                    <Box>اسم Excel</Box>
                    <Box>رقم البصمة</Box>
                    <Box>موظف النظام المقترح</Box>
                    <Box>فرع النظام</Box>
                    <Box>التشابه</Box>
                    <Box>الحالة</Box>
                  </Box>

                  <Stack
                    sx={{
                      maxHeight: "48vh",
                      overflow: "auto"
                    }}
                  >
                    {bioExcelVisibleRows.map((row) => {
                      const selected =
                        bioExcelSelections[row.rowKey] || null;
                      const meta = excelBioStatusMeta(row.status);
                      const canApprove =
                        Boolean(row.canLink) &&
                        Boolean(selected?.employeeGuid) &&
                        row.status !== "already-linked" &&
                        row.status !== "duplicate-code";

                      return (
                        <Box
                          key={row.rowKey}
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "54px minmax(115px,.85fr) minmax(180px,1.25fr) 90px minmax(260px,1.7fr) minmax(125px,.9fr) 90px 110px",
                            gap: 0.7,
                            alignItems: "center",
                            px: 1,
                            py: 0.75,
                            borderBottom: `1px solid ${border}`,
                            bgcolor:
                              row.status === "duplicate-code"
                                ? "#fff6f6"
                                : row.status === "already-linked"
                                  ? "#f6fbff"
                                  : "#fff"
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={Boolean(
                              bioExcelApproved[row.rowKey]
                            )}
                            disabled={!canApprove || bioExcelSaving}
                            onChange={(event) =>
                              setBioExcelApproved((current) => ({
                                ...current,
                                [row.rowKey]: event.target.checked
                              }))
                            }
                          />

                          <Box>
                            <Typography
                              sx={{ fontSize: 12, fontWeight: 900 }}
                            >
                              {row.sheetName || "-"}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              sx={{ fontSize: 12 }}
                            >
                              صف {row.excelRowNumber || "-"}
                            </Typography>
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 900,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {row.excelName || "-"}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              sx={{ fontSize: 12 }}
                            >
                              الهوية: {row.identityNumber || "-"}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            icon={<FingerprintRoundedIcon />}
                            label={row.fingerprintCode || "-"}
                            variant="outlined"
                            sx={[hrChipSx("small"), { fontWeight: 950 }]}
                          />

                          {row.status === "already-linked" ? (
                            <Box>
                              <Typography
                                sx={{ fontSize: 12, fontWeight: 950 }}
                              >
                                {row.bestMatch?.employeeName || "-"}
                              </Typography>
                              <Typography
                                color="text.secondary"
                                sx={{ fontSize: 12 }}
                              >
                                مربوط بنفس رقم البصمة
                              </Typography>
                            </Box>
                          ) : (
                            <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                              size="small"
                              options={
                                Array.isArray(row.suggestions)
                                  ? row.suggestions
                                  : []
                              }
                              value={selected}
                              disabled={
                                row.status === "duplicate-code" ||
                                bioExcelSaving
                              }
                              isOptionEqualToValue={(option, value) =>
                                option?.employeeGuid === value?.employeeGuid
                              }
                              getOptionLabel={(option) =>
                                `${option?.employeeName || "-"} • ${option?.employeeCode || "-"}`
                              }
                              onChange={(_, value) => {
                                setBioExcelSelections((current) => ({
                                  ...current,
                                  [row.rowKey]: value || null
                                }));
                                setBioExcelApproved((current) => ({
                                  ...current,
                                  [row.rowKey]: false
                                }));
                              }}
                              renderOption={(props, option) => (
                                <li {...props} key={option.employeeGuid}>
                                  <Box sx={{ width: "100%" }}>
                                    <Typography
                                      sx={{ fontSize: 12, fontWeight: 900 }}
                                    >
                                      {option.employeeName}
                                    </Typography>
                                    <Typography
                                      color="text.secondary"
                                      sx={{ fontSize: 12 }}
                                    >
                                      {option.branchName || "بدون فرع"}
                                      {" • "}
                                      تشابه {Number(option.score || 0)}%
                                    </Typography>
                                  </Box>
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                                  {...params}
                                  placeholder="اختر الموظف المطابق..."
                                />
                              )}
                            />
                          )}

                          <Typography
                            sx={{ fontSize: 12, fontWeight: 850 }}
                          >
                            {selected?.branchName ||
                              row.bestMatch?.branchName ||
                              "-"}
                          </Typography>

                          <Chip
                            size="small"
                            label={`${Number(selected?.score || row.bestMatch?.score || 0)}%`}
                            color={
                              Number(selected?.score || row.bestMatch?.score || 0) >= 85
                                ? "success"
                                : Number(selected?.score || row.bestMatch?.score || 0) >= 60
                                  ? "warning"
                                  : "default"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 900 }}
                          />

                          <Tooltip
                            title={
                              Array.isArray(selected?.reasons)
                                ? selected.reasons.join(" • ")
                                : row.statusLabel || ""
                            }
                          >
                            <Chip
                              size="small"
                              color={meta.color}
                              label={row.statusLabel || meta.label}
                              sx={{ fontWeight: 850, maxWidth: 108 }}
                            />
                          </Tooltip>
                        </Box>
                      );
                    })}

                    {!bioExcelVisibleRows.length && (
                      <Alert severity="info" sx={{ m: 1 }}>
                        لا توجد نتائج ضمن الفلتر الحالي.
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() => setBioExcelOpen(false)}
            disabled={bioExcelSaving || bioExcelLoading}
          >
            إغلاق
          </Button>

          <Button
            variant="contained"
            onClick={saveBioExcelLinks}
            disabled={
              bioExcelSaving ||
              bioExcelLoading ||
              !bioExcelApprovedLinks.length
            }
            sx={uiLayout.withUiSx({ bgcolor: primary, fontWeight: 950 }, uiLayout.buttonSx)}
          >
            {bioExcelSaving
              ? "جاري حفظ الربط..."
              : `ربط المحدد (${bioExcelApprovedLinks.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={bioBulkOpen}
        onClose={() =>
          !bioBulkSaving &&
          !bioBulkRefreshing &&
          setBioBulkOpen(false)
        }
        fullWidth
        maxWidth="xl"
        dir={DIALOG_DIRECTION}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: "78vh"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            pb: 1
          }}
        >
          مركز الربط الجماعي مع BioTime
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Alert severity="info">
              الربط هنا للمراجعة الجماعية الدقيقة:
              النظام يقترح من الكاش المحلي فقط، لكنه
              <strong> لا يعتمد أي موظف تلقائيًا</strong>.
              اختر موظف BioTime الصحيح ثم فعّل
              <strong> اعتماد</strong> للصفوف التي راجعتها.
            </Alert>

            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={0.8}
              alignItems={{ xs: "stretch", lg: "center" }}
            >
              <Paper
                variant="outlined"
                sx={{ p: 1, flex: 1, borderRadius: 2 }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: 12 }}
                >
                  مربوطون حاليًا
                </Typography>
                <Typography sx={{ fontWeight: 950, fontSize: 20 }}>
                  {Number(
                    bioBulkStats.linkedEmployees || 0
                  )}
                </Typography>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: 1, flex: 1, borderRadius: 2 }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: 12 }}
                >
                  غير مربوطين
                </Typography>
                <Typography sx={{ fontWeight: 950, fontSize: 20 }}>
                  {Number(
                    bioBulkStats.unlinkedEmployees || 0
                  )}
                </Typography>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: 1, flex: 1, borderRadius: 2 }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: 12 }}
                >
                  موظفو BioTime بالكاش
                </Typography>
                <Typography sx={{ fontWeight: 950, fontSize: 20 }}>
                  {Number(
                    bioBulkStats.cachedBioEmployees || 0
                  )}
                </Typography>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: 1, flex: 1.3, borderRadius: 2 }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: 12 }}
                >
                  آخر تحديث للكاش
                </Typography>
                <Typography
                  sx={{ fontWeight: 850, fontSize: 12 }}
                >
                  {bioBulkStats.cacheLastSync
                    ? new Date(
                        bioBulkStats.cacheLastSync
                      ).toLocaleString("ar-SA")
                    : "لم يتم التحديث بعد"}
                </Typography>
              </Paper>

              <Button
                variant="contained"
                startIcon={
                  bioBulkRefreshing ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <RefreshRoundedIcon />
                  )
                }
                disabled={
                  bioBulkRefreshing || bioBulkSaving
                }
                onClick={refreshBioBulkCache}
                sx={uiLayout.withUiSx({
                  minHeight: 52,
                  bgcolor: primary,
                  fontWeight: 950,
                  px: 2.2
                }, uiLayout.buttonSx)}
              >
                {bioBulkRefreshing
                  ? "تحديث BioTime..."
                  : "تحديث موظفي BioTime"}
              </Button>
            </Stack>

            {!bioBulkStats.cachedBioEmployees && (
              <Alert severity="warning">
                الكاش فارغ. اضغط
                <strong> تحديث موظفي BioTime</strong>
                مرة واحدة، وبعدها تصبح المراجعة والبحث
                والاقتراحات سريعة من قاعدة البيانات.
              </Alert>
            )}

            <Stack sx={uiLayout.formGridSx}
              direction={{ xs: "column", md: "row" }}
              spacing={0.8}
            >
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
                value={bioBulkSearch}
                onChange={(e) =>
                  setBioBulkSearch(e.target.value)
                }
                placeholder="بحث في موظفي النظام بالاسم أو الكود..."
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
                sx={uiLayout.withUiSx({ minWidth: { md: 260 } }, uiLayout.formFieldSx)}
              >
                <InputLabel>الفرع</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الفرع"
                  value={bioBulkBranchGuid}
                  onChange={(e) => {
                    setBioBulkBranchGuid(
                      e.target.value
                    );
                    setBioBulkPage(1);
                  }}
                >
                  <MenuItem value="">
                    كل الفروع
                  </MenuItem>
                  {(lookups.branches || []).map(
                    (branch) => (
                      <MenuItem
                        key={
                          branch.guid ||
                          branch.branchGuid
                        }
                        value={
                          branch.guid ||
                          branch.branchGuid
                        }
                      >
                        {branch.name ||
                          branch.branchName ||
                          branch.brEName ||
                          branch.brName ||
                          "-"}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={uiLayout.withUiSx({ minWidth: 120 }, uiLayout.formFieldSx)}
              >
                <InputLabel>الصفوف</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الصفوف"
                  value={bioBulkPageSize}
                  onChange={(e) => {
                    const value = Number(
                      e.target.value
                    );
                    setBioBulkPageSize(value);
                    setBioBulkPage(1);
                    loadBioBulkWorkspace({
                      pageValue: 1,
                      pageSizeValue: value
                    });
                  }}
                >
                  {[20, 30, 50, 100].map((value) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Alert
              severity={
                bioBulkApprovedLinks.length
                  ? "success"
                  : "info"
              }
              variant="outlined"
            >
              تم اعتماد{" "}
              <strong>
                {bioBulkApprovedLinks.length}
              </strong>{" "}
              ربط في الصفحة الحالية. اختيار الاقتراح
              وحده لا يكفي؛ لازم تحدد
              <strong> اعتماد</strong>.
            </Alert>

            {bioBulkLoading ? (
              <Box
                sx={{
                  minHeight: 320,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  border: `1px solid ${border}`,
                  borderRadius: 2.2,
                  overflow: "hidden"
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "48px minmax(220px,1.1fr) minmax(360px,1.8fr) 120px",
                    gap: 1,
                    p: 1,
                    bgcolor: "#f5f8f6",
                    borderBottom: `1px solid ${border}`,
                    fontWeight: 950,
                    fontSize: 12
                  }}
                >
                  <Box>اعتماد</Box>
                  <Box>موظف النظام</Box>
                  <Box>موظف BioTime</Box>
                  <Box>المراجعة</Box>
                </Box>

                <Stack spacing={0}>
                  {bioBulkEmployees.map((employee) => {
                    const selected =
                      bioBulkSelections[
                        employee.employeeGuid
                      ] || null;

                    const approved =
                      Boolean(
                        bioBulkApproved[
                          employee.employeeGuid
                        ]
                      );

                    const suggestionScore =
                      Number(selected?.score || 0);

                    const rowOptions = [
                      ...(employee?.suggestions || [])
                        .map((item) => ({
                          bioTimeEmployeeId:
                            Number(
                              item.bioTimeEmployeeId
                            ),
                          bioTimeEmpCode:
                            String(
                              item.bioTimeEmpCode || ""
                            ),
                          fullName:
                            item.fullName || "",
                          departmentName:
                            item.departmentName || "",
                          areasText:
                            item.areasText || "",
                          score:
                            Number(item.score || 0),
                          label:
                            item.label || "",
                          reasons:
                            Array.isArray(
                              item.reasons
                            )
                              ? item.reasons
                              : []
                        })),
                      ...bioBulkCandidates
                        .filter(
                          (candidate) =>
                            !(employee?.suggestions || [])
                              .some(
                                (suggestion) =>
                                  Number(
                                    suggestion
                                      .bioTimeEmployeeId
                                  ) ===
                                  Number(
                                    candidate
                                      .bioTimeEmployeeId
                                  )
                              )
                        )
                        .map((candidate) => ({
                          bioTimeEmployeeId:
                            Number(
                              candidate
                                .bioTimeEmployeeId
                            ),
                          bioTimeEmpCode:
                            String(
                              candidate
                                .bioTimeEmpCode || ""
                            ),
                          fullName:
                            candidate.fullName || "",
                          departmentName:
                            candidate.departmentName ||
                            "",
                          areasText:
                            candidate.areasText || "",
                          score: 0,
                          label: "",
                          reasons: []
                        }))
                    ];

                    return (
                      <Box
                        key={employee.employeeGuid}
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "48px minmax(220px,1.1fr) minmax(360px,1.8fr) 120px",
                          gap: 1,
                          alignItems: "center",
                          p: 1,
                          borderBottom:
                            `1px solid ${border}`,
                          bgcolor: approved
                            ? "#f3fff8"
                            : "#fff"
                        }}
                      >
                        <Checkbox
                          checked={approved}
                          disabled={!selected}
                          onChange={(e) =>
                            setBioBulkApproved(
                              (current) => ({
                                ...current,
                                [employee.employeeGuid]:
                                  e.target.checked
                              })
                            )
                          }
                        />

                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 950,
                              fontSize: 12.5
                            }}
                          >
                            {employee.employeeName}
                          </Typography>
                          <Typography
                            color="text.secondary"
                            sx={{ fontSize: 12 }}
                          >
                            #{employee.employeeCode || "-"}
                            {" • "}
                            {employee.branchName ||
                              "بدون فرع"}
                          </Typography>
                        </Box>

                        <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
                          size="small"
                          options={rowOptions}
                          value={selected}
                          isOptionEqualToValue={(
                            option,
                            value
                          ) =>
                            Number(
                              option.bioTimeEmployeeId
                            ) ===
                            Number(
                              value?.bioTimeEmployeeId
                            )
                          }
                          getOptionLabel={(option) =>
                            `${
                              option?.fullName ||
                              "بدون اسم"
                            } • ${
                              option?.bioTimeEmpCode ||
                              "-"
                            }`
                          }
                          filterOptions={(
                            options,
                            state
                          ) => {
                            const term =
                              state.inputValue
                                .trim()
                                .toLowerCase();

                            if (!term) {
                              return options.slice(
                                0,
                                30
                              );
                            }

                            return options
                              .filter((option) =>
                                [
                                  option.fullName,
                                  option.bioTimeEmpCode,
                                  option.departmentName,
                                  option.areasText
                                ]
                                  .filter(Boolean)
                                  .join(" ")
                                  .toLowerCase()
                                  .includes(term)
                              )
                              .slice(0, 40);
                          }}
                          onChange={(_, value) => {
                            setBioBulkSelections(
                              (current) => ({
                                ...current,
                                [employee.employeeGuid]:
                                  value || null
                              })
                            );

                            setBioBulkApproved(
                              (current) => ({
                                ...current,
                                [employee.employeeGuid]:
                                  false
                              })
                            );
                          }}
                          renderOption={(
                            props,
                            option
                          ) => (
                            <li
                              {...props}
                              key={
                                option.bioTimeEmployeeId
                              }
                            >
                              <Box sx={{ width: "100%" }}>
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                >
                                  <Typography
                                    sx={{
                                      fontWeight: 900,
                                      fontSize: 12
                                    }}
                                  >
                                    {option.fullName ||
                                      "بدون اسم"}
                                  </Typography>

                                  {Number(
                                    option.score || 0
                                  ) > 0 && (
                                    <Chip
                                      size="small"
                                      label={`${Number(
                                        option.score
                                      )}%`}
                                      color={
                                        Number(
                                          option.score
                                        ) >= 70
                                          ? "success"
                                          : Number(
                                                option.score
                                              ) >= 50
                                            ? "warning"
                                            : "default"
                                      }
                                      sx={{
                                        height: 19,
                                        fontSize: 12
                                      }}
                                    />
                                  )}
                                </Stack>

                                <Typography
                                  color="text.secondary"
                                  sx={{ fontSize: 12 }}
                                >
                                  BioTime #
                                  {
                                    option.bioTimeEmployeeId
                                  }
                                  {" • "}
                                  Code:{" "}
                                  {option.bioTimeEmpCode ||
                                    "-"}
                                  {" • "}
                                  {option.areasText ||
                                    option.departmentName ||
                                    "-"}
                                </Typography>
                              </Box>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                              {...params}
                              placeholder="اختر أو اكتب اسم BioTime..."
                            />
                          )}
                        />

                        <Stack
                          spacing={0.35}
                          alignItems="flex-start"
                        >
                          {selected ? (
                            <>
                              <Chip
                                size="small"
                                color={
                                  suggestionScore >= 70
                                    ? "success"
                                    : suggestionScore >= 50
                                      ? "warning"
                                      : "default"
                                }
                                variant="outlined"
                                label={
                                  suggestionScore > 0
                                    ? `اقتراح ${suggestionScore}%`
                                    : "اختيار يدوي"
                                }
                                sx={{
                                  fontWeight: 850,
                                  fontSize: 12
                                }}
                              />
                              <Typography
                                color="text.secondary"
                                sx={{
                                  fontSize: 12,
                                  lineHeight: 1.35
                                }}
                              >
                                {selected.areasText ||
                                  selected.departmentName ||
                                  "راجع الاسم والكود"}
                              </Typography>
                            </>
                          ) : (
                            <Chip
                              size="small"
                              label="غير محدد"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>
                    );
                  })}

                  {!bioBulkEmployees.length && (
                    <Alert
                      severity="success"
                      sx={{ m: 1 }}
                    >
                      لا يوجد موظفون غير مربوطين ضمن
                      الفلتر الحالي.
                    </Alert>
                  )}
                </Stack>
              </Box>
            )}

            {bioBulkPageCount > 1 && (
              <Stack
                direction="row"
                justifyContent="center"
              >
                <Pagination
                  count={bioBulkPageCount}
                  page={bioBulkPage}
                  onChange={(_, value) => {
                    setBioBulkPage(value);
                    loadBioBulkWorkspace({
                      pageValue: value
                    });
                  }}
                  color="primary"
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            justifyContent: "space-between",
            px: 2
          }, uiLayout.dialogActionsSx)}
        >
          <Button sx={uiLayout.buttonSx}
            onClick={() => setBioBulkOpen(false)}
            disabled={
              bioBulkSaving || bioBulkRefreshing
            }
          >
            إغلاق
          </Button>

          <Button
            variant="contained"
            startIcon={<GroupWorkRoundedIcon />}
            disabled={
              bioBulkSaving ||
              !bioBulkApprovedLinks.length
            }
            onClick={saveBioBulkLinks}
            sx={uiLayout.withUiSx({
              bgcolor: primary,
              fontWeight: 950,
              minWidth: 190
            }, uiLayout.buttonSx)}
          >
            {bioBulkSaving
              ? "جاري اعتماد الربط..."
              : `اعتماد المحدد (${bioBulkApprovedLinks.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={bioDialogOpen}
        onClose={() =>
          !bioSavingId &&
          setBioDialogOpen(false)
        }
        fullWidth
        maxWidth="md"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          ربط موظف BioTime
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Alert severity="info">
              سيتم ربط موظف النظام {" "}
              <strong>
                {bioEmployee?.employeeName || "-"}
              </strong>
              {" "}بموظف واحد من BioTime.
              اكتب الاسم الإنجليزي أو كود BioTime للبحث السريع.
              لا يوجد تحميل تلقائي ولا مقارنة أسماء.
              <br />
              الفرع في النظام:{" "}
              <strong>
                {bioEmployee?.branchName ||
                  "غير محدد"}
              </strong>
            </Alert>

            {bioEmployee?.bioTimeEmployeeId && (
              <Alert severity="success">
                الربط الحالي: BioTime ID {" "}
                {bioEmployee.bioTimeEmployeeId}
                {" "}/ كود {" "}
                {bioEmployee.bioTimeEmpCode || "-"}
              </Alert>
            )}

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
              value={bioSearch}
              onChange={(e) =>
                setBioSearch(e.target.value)
              }
              placeholder="اكتب الاسم الإنجليزي أو كود BioTime (حرفان على الأقل)..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                )
              }}
            />


            {bioSearch.trim().length < 2 && (
              <Alert severity="info" variant="outlined">
                اكتب حرفين على الأقل من الاسم الإنجليزي أو كود BioTime.
                لن يتم الاتصال بـ BioTime قبل ذلك، وده يسرّع فتح نافذة الربط جدًا.
              </Alert>
            )}

            {!bioLoading &&
              bioSearch.trim().length >= 2 &&
              bioRows.length === 0 && (
                <Alert severity="warning" variant="outlined">
                  لا توجد نتائج مطابقة. جرّب جزءًا آخر من الاسم أو كود BioTime.
                </Alert>
              )}

            {bioLoading ? (
              <Box
                sx={{
                  minHeight: 180,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Stack
                spacing={0.7}
                sx={{
                  maxHeight: 460,
                  overflowY: "auto"
                }}
              >
                {bioRows.map((bio) => (
                  <Paper
                    key={bio.id}
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row"
                      }}
                      alignItems={{
                        xs: "stretch",
                        sm: "center"
                      }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 950,
                            fontSize: 13
                          }}
                        >
                          {bio.fullName ||
                            "بدون اسم"}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.4}
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mt: 0.35 }}
                        >


                          {bio.isLinkedToAnother && (
                            <Chip
                              size="small"
                              color="error"
                              variant="outlined"
                              label={`مرتبط بـ ${
                                bio.linkedEmployeeName ||
                                "موظف آخر"
                              }`}
                              sx={{
                                height: 22,
                                fontSize: 12,
                                fontWeight: 850
                              }}
                            />
                          )}
                        </Stack>

                        <Typography
                          color="text.secondary"
                          sx={{
                            mt: 0.25,
                            fontSize: 12
                          }}
                        >
                          BioTime ID: {bio.id}
                          {" • "}
                          Code: {bio.empCode || "-"}
                          {" • "}
                          {bio.department ||
                            "بدون قسم"}
                        </Typography>

                        {!!bio.areas?.length && (
                          <Typography
                            color="text.secondary"
                            sx={{
                              mt: 0.2,
                              fontSize: 12
                            }}
                          >
                            {bio.areas.join(" • ")}
                          </Typography>
                        )}

                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          <FingerprintRoundedIcon />
                        }
                        disabled={
                          Boolean(bioSavingId) ||
                          Boolean(bio.isLinkedToAnother)
                        }
                        onClick={() =>
                          linkBioEmployee(bio)
                        }
                        sx={uiLayout.withUiSx({
                          minWidth: 110,
                          bgcolor: primary,
                          fontWeight: 900
                        }, uiLayout.buttonSx)}
                      >
                        {bioSavingId === bio.id
                          ? "جاري الربط..."
                          : "ربط"}
                      </Button>
                    </Stack>
                  </Paper>
                ))}

                {!bioRows.length && (
                  <Alert severity="warning">
                    لا توجد نتائج من BioTime.
                  </Alert>
                )}
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setBioDialogOpen(false)
            }
            disabled={Boolean(bioSavingId)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </></NavigationShell>
  );
}

