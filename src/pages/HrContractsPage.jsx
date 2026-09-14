import { hrChipSx } from "../components/hrControlStyles";
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
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
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

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
  "http://localhost:5258";




const PAGE_DIRECTION = "rtl";
const PAGE_TEXT_ALIGN = "right";
const DIALOG_DIRECTION = "rtl";

const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const bg = "#f5f8f6";

const emptyForm = () => ({
  contractNumber: "",
  startDate: "",
  endDate: "",
  basicSalary: "",
  contractType: 1,
  probationDays: "",
  autoRenew: false,
  notes: "",
  editReason: "",
  file: null
});

const getActor = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    return {
      changedByUserGuid:
        user?.guid ||
        user?.Guid ||
        user?.userGuid ||
        user?.UserGuid ||
        null,
      changedByName:
        user?.fullName ||
        user?.FullName ||
        user?.userName ||
        user?.UserName ||
        "مستخدم النظام"
    };
  } catch {
    return {
      changedByUserGuid: null,
      changedByName: "مستخدم النظام"
    };
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ar-SA");
};

const formatMoney = (value) => {
  if (value === null || value === undefined) return "-";

  return Number(value).toLocaleString("ar-SA", {
    maximumFractionDigits: 2
  });
};

const getStatusMeta = (status) => {
  const map = {
    Active: ["ساري", "success"],
    ExpiringSoon: ["ينتهي قريبًا", "warning"],
    Expired: ["منتهي", "error"],
    Upcoming: ["لم يبدأ بعد", "info"],
    Terminated: ["تم إنهاؤه", "default"],
    NoContract: ["بدون عقد", "default"]
  };

  const [label, color] =
    map[status] || ["بدون عقد", "default"];

  return { label, color };
};

const getContractTypeName = (value) => {
  if (Number(value) === 1) return "محدد المدة";
  if (Number(value) === 2) return "غير محدد المدة";
  return "غير محدد";
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getRemainingText = (row) => {
  if (!row?.contractGuid) return "لا يوجد عقد";
  if (row?.isTerminated) return "تم إنهاء العقد";

  const days = Number(row?.daysToExpiry);

  if (
    row?.daysToExpiry === null ||
    row?.daysToExpiry === undefined ||
    Number.isNaN(days)
  ) {
    return "بدون تاريخ نهاية";
  }

  if (days < 0) {
    return `منتهي منذ ${Math.abs(days)} يوم`;
  }

  if (days === 0) {
    return "ينتهي اليوم";
  }

  return `متبقي ${days} يوم`;
};

export default function HrContractsPage() {
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    activeContracts: 0,
    expiringWithin7Days: 0,
    expiringWithin30Days: 0,
    expiredContracts: 0,
    withoutContract: 0,
    terminatedContracts: 0
  });

  const [lookups, setLookups] = useState({
    branches: [],
    departments: []
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [branchGuid, setBranchGuid] = useState("");
  const [departmentGuid, setDepartmentGuid] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [contractOpen, setContractOpen] =
    useState(false);
  const [contractMode, setContractMode] =
    useState("create");
  const [selectedEmployee, setSelectedEmployee] =
    useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [historyOpen, setHistoryOpen] =
    useState(false);
  const [historyEmployee, setHistoryEmployee] =
    useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);


  const [previewOpen, setPreviewOpen] =
    useState(false);
  const [previewRow, setPreviewRow] =
    useState(null);
  const [previewUrl, setPreviewUrl] =
    useState("");
  const [previewLoading, setPreviewLoading] =
    useState(false);
  const [previewError, setPreviewError] =
    useState("");


  const [alertsOpen, setAlertsOpen] =
    useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] =
    useState(false);
  const [alertLevel, setAlertLevel] =
    useState("all");
  const [alertSearch, setAlertSearch] =
    useState("");
  const [notificationCount, setNotificationCount] =
    useState(0);

  const loadLookups = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/lookups`,
        {
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) return;

      setLookups({
        branches: Array.isArray(
          result?.data?.branches
        )
          ? result.data.branches
          : [],
        departments: Array.isArray(
          result?.data?.departments
        )
          ? result.data.departments
          : []
      });
    } catch {
      setLookups({
        branches: [],
        departments: []
      });
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/contracts/stats`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (response.ok && result?.data) {
        setStats(result.data);
      }
    } catch {
      // لا نوقف الصفحة لو الإحصائيات فقط فشلت.
    }
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        pageSize: String(pageSize)
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "all") {
        params.set("status", status);
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

      const response = await fetch(
        `${API_BASE_URL}/api/hr/contracts?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل العقود الوظيفية"
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
    } catch (error) {
      setRows([]);
      setTotalCount(0);

      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text:
          error?.message ||
          "حدث خطأ أثناء تحميل العقود"
      });
    } finally {
      setLoading(false);
    }
  }, [
    search,
    status,
    branchGuid,
    departmentGuid,
    pageNumber,
    pageSize
  ]);

  useEffect(() => {
    const timer = setTimeout(
      loadRows,
      search.trim() ? 300 : 0
    );

    return () => clearTimeout(timer);
  }, [loadRows, search]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);


  const pageCount = useMemo(
    () =>
      totalCount > 0
        ? Math.ceil(totalCount / pageSize)
        : 0,
    [totalCount, pageSize]
  );

  const openContract = useCallback((row) => {
    setSelectedEmployee(row);
    setContractMode(
      row?.contractGuid ? "renew" : "create"
    );

    setForm({
      ...emptyForm(),
      contractType: row?.contractType || 1,
      probationDays:
        row?.probationDays ?? "",
      autoRenew: Boolean(row?.autoRenew),
      basicSalary:
        row?.basicSalary ?? ""
    });

    setContractOpen(true);
  }, []);

  const openEditContract = useCallback((row) => {
    if (!row?.contractGuid) return;

    setSelectedEmployee(row);
    setContractMode("edit");

    setForm({
      ...emptyForm(),
      contractNumber:
        row?.contractNumber || "",
      startDate: toDateInputValue(row?.startDate),
      endDate: toDateInputValue(row?.endDate),
      basicSalary:
        row?.basicSalary ?? "",
      contractType: row?.contractType || 1,
      probationDays:
        row?.probationDays ?? "",
      autoRenew: Boolean(row?.autoRenew),
      notes: row?.notes || "",
      editReason: "",
      file: null
    });

    setContractOpen(true);
  }, []);

  const saveContract = useCallback(async () => {
    if (!selectedEmployee?.employeeGuid) return;

    const isEdit = contractMode === "edit";

    if (!isEdit && !form.file) {
      await Swal.fire({
        icon: "warning",
        title: "ملف العقد مطلوب",
        text: "اختر ملف العقد قبل الحفظ"
      });
      return;
    }

    if (isEdit && !form.editReason.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "سبب التعديل مطلوب",
        text: "اكتب سبب تعديل بيانات العقد الحالي"
      });
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) <
        new Date(form.startDate)
    ) {
      await Swal.fire({
        icon: "warning",
        title: "راجع التواريخ",
        text:
          "تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية"
      });
      return;
    }

    setSaving(true);

    try {
      const actor = getActor();
      const data = new FormData();

      if (form.file) {
        data.append("file", form.file);
      }

      data.append(
        "contractNumber",
        form.contractNumber.trim()
      );

      if (form.startDate) {
        data.append("startDate", form.startDate);
      }

      if (
        Number(form.contractType) === 1 &&
        form.endDate
      ) {
        data.append("endDate", form.endDate);
      }

      if (form.basicSalary !== "") {
        data.append(
          "basicSalary",
          String(form.basicSalary)
        );
      }

      data.append(
        "contractType",
        String(form.contractType)
      );

      if (form.probationDays !== "") {
        data.append(
          "probationDays",
          String(form.probationDays)
        );
      }

      data.append(
        "autoRenew",
        String(form.autoRenew)
      );

      data.append(
        "notes",
        form.notes.trim()
      );

      if (isEdit) {
        data.append(
          "editReason",
          form.editReason.trim()
        );
      }

      if (actor.changedByUserGuid) {
        data.append(
          "changedByUserGuid",
          actor.changedByUserGuid
        );
      }

      data.append(
        "changedByName",
        actor.changedByName
      );

      const url = isEdit
        ? `${API_BASE_URL}/api/hr/contracts/${encodeURIComponent(
            selectedEmployee.contractGuid
          )}`
        : `${API_BASE_URL}/api/hr/contracts/employee/${encodeURIComponent(
            selectedEmployee.employeeGuid
          )}`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: data
      });

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            (isEdit
              ? "تعذر تعديل العقد"
              : "تعذر حفظ العقد")
        );
      }

      setContractOpen(false);

      await Swal.fire({
        icon: "success",
        title: isEdit
          ? "تم تعديل العقد"
          : contractMode === "renew"
            ? "تم تجديد العقد"
            : "تم إنشاء العقد",
        text: result?.message || "تم الحفظ"
      });

      await Promise.all([
        loadRows(),
        loadStats()
      ]);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          error?.message ||
          "حدث خطأ أثناء حفظ العقد"
      });
    } finally {
      setSaving(false);
    }
  }, [
    selectedEmployee,
    contractMode,
    form,
    loadRows,
    loadStats
  ]);

  const terminate = useCallback(
    async (row) => {
      if (!row?.contractGuid) return;

      const prompt = await Swal.fire({
        title: "إنهاء العقد الوظيفي",
        input: "textarea",
        inputPlaceholder:
          "اكتب سبب إنهاء العقد...",
        showCancelButton: true,
        confirmButtonText: "إنهاء العقد",
        cancelButtonText: "رجوع",
        confirmButtonColor: "#ae1e21",
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب الإنهاء مطلوب"
            : undefined
      });

      if (!prompt.isConfirmed) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/hr/contracts/${encodeURIComponent(
            row.contractGuid
          )}/terminate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              terminationReason:
                String(prompt.value).trim(),
              terminatedAt:
                new Date().toISOString(),
              ...getActor()
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر إنهاء العقد"
          );
        }

        await Promise.all([
          loadRows(),
          loadStats()
        ]);
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "تعذر الإنهاء",
          text:
            error?.message ||
            "حدث خطأ أثناء إنهاء العقد"
        });
      }
    },
    [loadRows, loadStats]
  );

  const openHistory = useCallback(async (row) => {
    setHistoryEmployee(row);
    setHistory([]);
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/contracts/employee/${encodeURIComponent(
          row.employeeGuid
        )}/history`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل سجل العقود"
        );
      }

      setHistory(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);


  const loadAutomaticContractNotifications =
    useCallback(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/hr/contracts/alerts`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) return;

        const items = Array.isArray(result?.data)
          ? result.data
          : [];

        setNotificationCount(items.length);

        const expired = items.filter(
          (item) => item?.alertLevel === "Expired"
        ).length;

        const critical = items.filter(
          (item) => item?.alertLevel === "Critical"
        ).length;

        const warning = items.filter(
          (item) => item?.alertLevel === "Warning"
        ).length;

        if (!items.length) return;

        const todayKey =
          new Date().toISOString().slice(0, 10);
        const storageKey =
          "hr_contract_alerts_last_seen";
        const lastSeen =
          sessionStorage.getItem(storageKey);

        if (lastSeen !== todayKey) {
          sessionStorage.setItem(
            storageKey,
            todayKey
          );

          await Swal.fire({
            icon:
              expired > 0 || critical > 0
                ? "warning"
                : "info",
            title: "تنبيهات العقود",
            html: `
              <div style="text-align:right;line-height:1.9">
                ${expired ? `<div><b>${expired}</b> عقد منتهي</div>` : ""}
                ${critical ? `<div><b>${critical}</b> عقد ينتهي خلال 7 أيام</div>` : ""}
                ${warning ? `<div><b>${warning}</b> عقد ينتهي خلال 8 إلى 30 يوم</div>` : ""}
              </div>
            `,
            confirmButtonText:
              "عرض تنبيهات العقود",
            showCancelButton: true,
            cancelButtonText: "لاحقًا"
          }).then((result) => {
            if (result.isConfirmed) {
              setAlertLevel("all");
              setAlertSearch("");
              setAlertsOpen(true);
            }
          });
        }

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification.permission ===
            "granted"
        ) {
          const browserKey =
            `hr_contract_browser_alert_${todayKey}`;

          if (
            localStorage.getItem(browserKey) !==
            "1"
          ) {
            localStorage.setItem(
              browserKey,
              "1"
            );

            new window.Notification(
              "تنبيهات العقود الوظيفية",
              {
                body: `لديك ${items.length} عقد يحتاج متابعة.`,
                tag: "hr-contract-alerts"
              }
            );
          }
        }
      } catch {
        // التنبيهات لا توقف الصفحة لو حصل خطأ.
      }
    }, []);

  const enableBrowserNotifications =
    useCallback(async () => {
      if (!("Notification" in window)) {
        await Swal.fire({
          icon: "info",
          title: "غير مدعوم",
          text:
            "المتصفح الحالي لا يدعم إشعارات سطح المكتب."
        });
        return;
      }

      const permission =
        await window.Notification.requestPermission();

      if (permission === "granted") {
        await Swal.fire({
          icon: "success",
          title: "تم تفعيل الإشعارات",
          text:
            "ستظهر لك تنبيهات العقود عند فتح النظام طالما الإذن مفعل."
        });

        await loadAutomaticContractNotifications();
      } else {
        await Swal.fire({
          icon: "info",
          title: "لم يتم التفعيل",
          text:
            "يمكنك السماح بالإشعارات لاحقًا من إعدادات المتصفح."
        });
      }
    }, [loadAutomaticContractNotifications]);

  useEffect(() => {
    loadAutomaticContractNotifications();
  }, [loadAutomaticContractNotifications]);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);

    try {
      const params = new URLSearchParams();

      if (alertSearch.trim()) {
        params.set(
          "search",
          alertSearch.trim()
        );
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

      if (alertLevel !== "all") {
        params.set(
          "alertLevel",
          alertLevel
        );
      }

      const query = params.toString();

      const response = await fetch(
        `${API_BASE_URL}/api/hr/contracts/alerts${
          query ? `?${query}` : ""
        }`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل تنبيهات العقود"
        );
      }

      setAlerts(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      setAlerts([]);

      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل التنبيهات",
        text:
          error?.message ||
          "حدث خطأ أثناء تحميل تنبيهات العقود"
      });
    } finally {
      setAlertsLoading(false);
    }
  }, [
    alertSearch,
    alertLevel,
    branchGuid,
    departmentGuid
  ]);

  useEffect(() => {
    if (!alertsOpen) return;

    const timer = setTimeout(
      loadAlerts,
      alertSearch.trim() ? 300 : 0
    );

    return () => clearTimeout(timer);
  }, [
    alertsOpen,
    alertSearch,
    alertLevel,
    branchGuid,
    departmentGuid,
    loadAlerts
  ]);

  const closePreview = useCallback(() => {
    setPreviewUrl("");
    setPreviewError("");
    setPreviewRow(null);
    setPreviewLoading(false);
    setPreviewOpen(false);
  }, []);

  const previewContract = useCallback(
    (row) => {
      if (!row?.contractGuid) return;

      setPreviewRow(row);
      setPreviewUrl("");
      setPreviewError("");
      setPreviewOpen(true);
      setPreviewLoading(false);

      const fileName = String(
        row?.originalFileName || ""
      ).toLowerCase();

      const extension = fileName.includes(".")
        ? `.${fileName.split(".").pop()}`
        : String(row?.fileExtension || "")
            .toLowerCase();

      const previewable = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
      ].includes(extension);

      if (!previewable) {
        setPreviewError(
          "نوع الملف لا يدعم المعاينة المباشرة داخل الصفحة. استخدم زر فتح / تحميل."
        );
        return;
      }

      setPreviewUrl(
        `${API_BASE_URL}/api/hr/contracts/${encodeURIComponent(
          row.contractGuid
        )}/preview`
      );
    },
    []
  );

  const openFile = useCallback((contractGuid) => {
    if (!contractGuid) return;

    window.open(
      `${API_BASE_URL}/api/hr/contracts/${encodeURIComponent(
        contractGuid
      )}/download`,
      "_blank",
      "noopener,noreferrer"
    );
  }, []);

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
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: primaryDark,
            color: "#fff",
            p: { xs: 1.2, sm: 1.8 },
            borderRadius: 3,
            mb: 1.3
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
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

              <ArticleOutlinedIcon />

              <Box>
                <Typography
                  sx={{
                    fontWeight: 950,
                    fontSize: {
                      xs: 18,
                      sm: 24
                    }
                  }}
                >
                  العقود الوظيفية
                </Typography>

                <Typography
                  sx={{
                    opacity: 0.75,
                    fontSize: 11
                  }}
                >
                  إدارة العقود والتجديدات والتنبيهات وسجل العقود السابق
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
            >
              <Badge
                badgeContent={notificationCount}
                color="error"
                max={99}
                overlap="rectangular"
              >
                <Button
                  variant="outlined"
                  startIcon={
                    <NotificationsActiveRoundedIcon />
                  }
                  onClick={() => {
                    setAlertLevel("all");
                    setAlertSearch("");
                    setAlertsOpen(true);
                  }}
                  sx={{
                    color: "#fff",
                    borderColor:
                      "rgba(255,255,255,.45)",
                    fontWeight: 900,
                    "&:hover": {
                      borderColor: "#fff",
                      bgcolor:
                        "rgba(255,255,255,.08)"
                    }
                  }}
                >
                  تنبيهات العقود
                </Button>
              </Badge>

              <Tooltip title="تحديث">
                <IconButton
                  onClick={() => {
                    loadRows();
                    loadStats();
                  }}
                  sx={{ color: "#fff" }}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
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
            gap: 1,
            mb: 1.3
          }}
        >
          {[
            [
              "العقود السارية",
              stats.activeContracts,
              "normal"
            ],
            [
              "عاجلة خلال 7 أيام",
              stats.expiringWithin7Days,
              "critical"
            ],
            [
              "تنتهي خلال 30 يوم",
              stats.expiringWithin30Days,
              "warning"
            ],
            [
              "العقود المنتهية",
              stats.expiredContracts,
              "expired"
            ],
            [
              "بدون عقد",
              stats.withoutContract
            ],
            [
              "تم إنهاؤها",
              stats.terminatedContracts
            ]
          ].map(([label, value, tone]) => (
            <Paper
              key={label}
              elevation={0}
              sx={{
                p: 1.1,
                borderRadius: 2.4,
                border:
                  tone === "critical"
                    ? "1px solid #f0a3a3"
                    : tone === "warning"
                      ? "1px solid #f3cf91"
                      : tone === "expired"
                        ? "1px solid #e6b3b3"
                        : `1px solid ${border}`,
                bgcolor:
                  tone === "critical"
                    ? "#fff3f3"
                    : tone === "warning"
                      ? "#fffaf0"
                      : tone === "expired"
                        ? "#fff7f7"
                        : "#fff"
              }}
            >
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: 10.5,
                  fontWeight: 800
                }}
              >
                {label}
              </Typography>

              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: 23,
                  color: primaryDark
                }}
              >
                {Number(value || 0)}
              </Typography>
            </Paper>
          ))}
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
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm:
                  "minmax(260px,1.4fr) 180px 180px 180px 110px"
              },
              gap: 1
            }}
          >
            <TextField
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              placeholder="بحث باسم الموظف أو رقم العقد..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                )
              }}
            />

            <FormControl size="small">
              <InputLabel>حالة العقد</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="حالة العقد"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPageNumber(1);
                }}
              >
                <MenuItem value="all">
                  كل الحالات
                </MenuItem>
                <MenuItem value="Active">
                  ساري
                </MenuItem>
                <MenuItem value="ExpiringSoon">
                  ينتهي قريبًا
                </MenuItem>
                <MenuItem value="Expired">
                  منتهي
                </MenuItem>
                <MenuItem value="NoContract">
                  بدون عقد
                </MenuItem>
                <MenuItem value="Upcoming">
                  لم يبدأ بعد
                </MenuItem>
                <MenuItem value="Terminated">
                  تم إنهاؤه
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
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
                  (branch) => (
                    <MenuItem
                      key={branch?.guid}
                      value={branch?.guid || ""}
                    >
                      {branch?.name ||
                        "غير محدد"}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl size="small">
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
                  (department) => (
                    <MenuItem
                      key={
                        department?.guid ||
                        department?.id
                      }
                      value={
                        department?.guid || ""
                      }
                    >
                      {department?.name ||
                        "غير محدد"}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl size="small">
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
                {[10, 20, 50].map((size) => (
                  <MenuItem
                    key={size}
                    value={size}
                  >
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
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
          <Stack spacing={1}>
            {rows.map((row) => {
              const meta =
                getStatusMeta(
                  row.contractStatus
                );

              return (
                <Paper
                  key={row.employeeGuid}
                  elevation={0}
                  sx={{
                    border:
                      row.contractStatus === "Expired"
                        ? "1px solid #e6a5a5"
                        : row.daysToExpiry !== null &&
                            row.daysToExpiry !== undefined &&
                            Number(row.daysToExpiry) >= 0 &&
                            Number(row.daysToExpiry) <= 7
                          ? "1px solid #ef9a9a"
                          : row.contractStatus ===
                              "ExpiringSoon"
                            ? "1px solid #f0ca83"
                            : `1px solid ${border}`,
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor:
                      row.contractStatus === "Expired"
                        ? "#fff8f8"
                        : row.daysToExpiry !== null &&
                            row.daysToExpiry !== undefined &&
                            Number(row.daysToExpiry) >= 0 &&
                            Number(row.daysToExpiry) <= 7
                          ? "#fff5f5"
                          : row.contractStatus ===
                              "ExpiringSoon"
                            ? "#fffdf7"
                            : "#fff",
                    transition:
                      "box-shadow .18s ease, transform .18s ease",
                    "&:hover": {
                      boxShadow:
                        "0 8px 22px rgba(3,77,49,.08)",
                      transform:
                        "translateY(-1px)"
                    }
                  }}
                >
                  <Box
                    sx={{
                      px: 1.4,
                      py: 1.15,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        lg:
                          "minmax(290px,1.65fr) minmax(165px,.9fr) minmax(220px,1.05fr) minmax(145px,.75fr) minmax(190px,.9fr) 315px"
                      },
                      columnGap: 1.25,
                      rowGap: 1,
                      alignItems: "center"
                    }}
                  >
                    {/* Employee */}
                    <Box
                      sx={{
                        minWidth: 0,
                        width: "100%"
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.7}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "#edf7f2",
                            color: primary,
                            flexShrink: 0
                          }}
                        >
                          <PersonRoundedIcon
                            fontSize="small"
                          />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 950,
                              fontSize: 14.5,
                              lineHeight: 1.25
                            }}
                          >
                            {row.employeeName}
                          </Typography>

                          <Typography
                            color="text.secondary"
                            sx={{
                              mt: 0.2,
                              fontSize: 10.5,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis"
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
                        </Box>
                      </Stack>
                    </Box>

                    {/* Contract number/type */}
                    <Box
                      sx={{
                        minWidth: 0,
                        width: "100%"
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        sx={{
                          fontSize: 9.8,
                          mb: 0.25
                        }}
                      >
                        العقد
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 12.5
                        }}
                      >
                        {row.contractNumber ||
                          "بدون رقم"}
                      </Typography>

                      {row.contractGuid && (
                        <Typography
                          color="text.secondary"
                          sx={{
                            mt: 0.15,
                            fontSize: 10
                          }}
                        >
                          {getContractTypeName(
                            row.contractType
                          )}
                        </Typography>
                      )}
                    </Box>

                    {/* Dates */}
                    <Box
                      sx={{
                        minWidth: 0,
                        width: "100%"
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.45}
                        alignItems="center"
                        sx={{ mb: 0.25 }}
                      >
                        <CalendarMonthRoundedIcon
                          sx={{
                            fontSize: 16,
                            color: primary
                          }}
                        />

                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 9.8 }}
                        >
                          مدة العقد
                        </Typography>
                      </Stack>

                      <Typography
                        sx={{
                          fontWeight: 850,
                          fontSize: 11.5
                        }}
                      >
                        {row.contractGuid
                          ? `${formatDate(
                              row.startDate
                            )} ← ${formatDate(
                              row.endDate
                            )}`
                          : "-"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.2,
                          fontSize: 10.3,
                          fontWeight: 800,
                          color:
                            row.contractStatus ===
                            "ExpiringSoon"
                              ? "#b36b00"
                              : row.contractStatus ===
                                  "Expired"
                                ? "#b42318"
                                : "text.secondary"
                        }}
                      >
                        {getRemainingText(row)}
                      </Typography>
                    </Box>

                    {/* Salary */}
                    <Box
                      sx={{
                        minWidth: 0,
                        width: "100%"
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.4}
                        alignItems="center"
                        sx={{ mb: 0.25 }}
                      >
                        <PaidRoundedIcon
                          sx={{
                            fontSize: 16,
                            color: primary
                          }}
                        />

                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 9.8 }}
                        >
                          الراتب الأساسي
                        </Typography>
                      </Stack>

                      <Typography
                        sx={{
                          fontWeight: 950,
                          fontSize: 13
                        }}
                      >
                        {formatMoney(
                          row.basicSalary
                        )}
                        {row.basicSalary !== null &&
                        row.basicSalary !== undefined
                          ? " ر.س"
                          : ""}
                      </Typography>
                    </Box>

                    {/* Status */}
                    <Box
                      sx={{
                        minWidth: 0,
                        width: "100%"
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        sx={{
                          fontSize: 9.8,
                          mb: 0.35
                        }}
                      >
                        الحالة
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.45}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          size="small"
                          label={meta.label}
                          color={meta.color}
                          sx={{
                            height: 24,
                            fontWeight: 850
                          }}
                        />

                        {row.contractGuid &&
                          !row.isTerminated &&
                          row.daysToExpiry !== null &&
                          row.daysToExpiry !== undefined &&
                          Number(row.daysToExpiry) >= 0 &&
                          Number(row.daysToExpiry) <= 7 && (
                            <Chip
                              size="small"
                              icon={
                                <WarningAmberRoundedIcon />
                              }
                              label="إجراء عاجل"
                              color="error"
                              sx={[hrChipSx("small"), {
                                height: 24,
                                fontWeight: 900
                              }]}
                            />
                          )}

                        {row.autoRenew && (
                          <Chip
                            size="small"
                            label="تجديد تلقائي"
                            variant="outlined"
                            sx={{
                              height: 24,
                              fontSize: 9.5
                            }}
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Actions */}
                    <Stack
                      direction="row"
                      spacing={0.4}
                      justifyContent="flex-start"
                      alignItems="center"
                      flexWrap="nowrap"
                      useFlexGap
                      sx={{
                        width: "315px",
                        minWidth: "315px"
                      }}
                    >
                      <Button
                        size="small"
                        variant={
                          row.contractGuid
                            ? "outlined"
                            : "contained"
                        }
                        startIcon={
                          row.contractGuid
                            ? <UpdateRoundedIcon />
                            : <AddRoundedIcon />
                        }
                        onClick={() =>
                          openContract(row)
                        }
                        sx={{
                          width: 100,
                          minWidth: 100,
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          ...(row.contractGuid
                            ? {}
                            : {
                                bgcolor: primary,
                                "&:hover": {
                                  bgcolor:
                                    primaryDark
                                }
                              })
                        }}
                      >
                        {row.contractGuid
                          ? "تجديد"
                          : "إضافة عقد"}
                      </Button>

                      {row.contractGuid && (
                        <Tooltip title="معاينة العقد داخل الصفحة">
                          <IconButton
                            size="small"
                            onClick={() =>
                              previewContract(row)
                            }
                            sx={{
                              border: `1px solid ${border}`,
                              borderRadius: 1.5
                            }}
                          >
                            <VisibilityRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {row.contractGuid &&
                        !row.isTerminated && (
                          <Tooltip title="تعديل بيانات العقد الحالي">
                            <IconButton
                              size="small"
                              onClick={() =>
                                openEditContract(row)
                              }
                              sx={{
                                border: `1px solid ${border}`,
                                borderRadius: 1.5
                              }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                      <Tooltip title="سجل العقود">
                        <IconButton
                          size="small"
                          onClick={() =>
                            openHistory(row)
                          }
                          sx={{
                            border: `1px solid ${border}`,
                            borderRadius: 1.5
                          }}
                        >
                          <HistoryRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {row.contractGuid && (
                        <Tooltip title="تحميل العقد">
                          <IconButton
                            size="small"
                            onClick={() =>
                              openFile(
                                row.contractGuid
                              )
                            }
                            sx={{
                              border: `1px solid ${border}`,
                              borderRadius: 1.5
                            }}
                          >
                            <DownloadRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {row.contractGuid &&
                        !row.isTerminated && (
                          <Tooltip title="إنهاء العقد">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                terminate(row)
                              }
                              sx={{
                                border:
                                  "1px solid rgba(211,47,47,.25)",
                                borderRadius: 1.5
                              }}
                            >
                              <EventBusyRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                    </Stack>
                  </Box>
                </Paper>
              );
            })}

            {!rows.length && (
              <Paper
                elevation={0}
                sx={{
                  py: 5,
                  px: 2,
                  textAlign: "center",
                  borderRadius: 3,
                  border: `1px solid ${border}`
                }}
              >
                <DescriptionRoundedIcon
                  sx={{
                    fontSize: 44,
                    color: "#9bb5a8",
                    mb: 0.6
                  }}
                />

                <Typography fontWeight={900}>
                  لا توجد عقود مطابقة
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.3,
                    fontSize: 11
                  }}
                >
                  جرّب تغيير البحث أو حالة العقد.
                </Typography>
              </Paper>
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
      </Box>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><>
      <Box sx={navigationContentSx}>{content}</Box>

      <Dialog
        sx={RTL_DIALOG_SX}
        open={alertsOpen}
        onClose={() =>
          setAlertsOpen(false)
        }
        fullWidth
        maxWidth="lg"
        dir={DIALOG_DIRECTION}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh"
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom:
              `1px solid ${border}`,
            py: 1.2
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: 17
                }}
              >
                تنبيهات العقود
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.2,
                  fontSize: 10.5
                }}
              >
                العقود المنتهية أو التي تنتهي خلال 30 يومًا
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setAlertsOpen(false)
              }
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(240px,1fr) 190px"
              },
              gap: 1,
              mb: 1.2
            }}
          >
            <TextField
              size="small"
              value={alertSearch}
              onChange={(e) =>
                setAlertSearch(
                  e.target.value
                )
              }
              placeholder="بحث باسم الموظف أو رقم العقد..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                )
              }}
            />

            <FormControl size="small">
              <InputLabel>
                مستوى التنبيه
              </InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="مستوى التنبيه"
                value={alertLevel}
                onChange={(e) =>
                  setAlertLevel(
                    e.target.value
                  )
                }
              >
                <MenuItem value="all">
                  كل التنبيهات
                </MenuItem>
                <MenuItem value="Expired">
                  عقود منتهية
                </MenuItem>
                <MenuItem value="Critical">
                  عاجل - 7 أيام
                </MenuItem>
                <MenuItem value="Warning">
                  تنبيه - 8 إلى 30 يوم
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              mb: 1.2,
              display: "flex",
              justifyContent: "flex-end"
            }}
          >
            <Button
              size="small"
              variant="text"
              startIcon={
                <NotificationsActiveRoundedIcon />
              }
              onClick={enableBrowserNotifications}
              sx={{ fontWeight: 850 }}
            >
              تفعيل إشعارات المتصفح
            </Button>
          </Box>

          {alertsLoading ? (
            <Box
              sx={{
                py: 7,
                display: "grid",
                placeItems: "center"
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={0.8}>
              {alerts.map((item) => {
                const expired =
                  item.alertLevel ===
                  "Expired";

                const critical =
                  item.alertLevel ===
                  "Critical";

                return (
                  <Paper
                    key={item.contractGuid}
                    elevation={0}
                    sx={{
                      p: 1.1,
                      borderRadius: 2.3,
                      border:
                        expired ||
                        critical
                          ? "1px solid #efaaaa"
                          : "1px solid #f0cf8c",
                      bgcolor:
                        expired ||
                        critical
                          ? "#fff6f6"
                          : "#fffaf1"
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md:
                            "minmax(220px,1.4fr) minmax(180px,1fr) 140px 130px auto"
                        },
                        gap: 1,
                        alignItems: "center"
                      }}
                    >
                      <Box>
                        <Typography
                          fontWeight={950}
                        >
                          {item.employeeName}
                        </Typography>

                        <Typography
                          color="text.secondary"
                          sx={{
                            mt: 0.2,
                            fontSize: 10.5
                          }}
                        >
                          #{item.employeeCode ||
                            "-"}
                          {" • "}
                          {item.jobTitle ||
                            "غير محدد"}
                          {" • "}
                          {item.departmentName ||
                            "غير محدد"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 9.8 }}
                        >
                          العقد / الفرع
                        </Typography>

                        <Typography
                          fontWeight={850}
                          sx={{ fontSize: 11.5 }}
                        >
                          {item.contractNumber ||
                            "بدون رقم"}
                        </Typography>

                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 9.8 }}
                        >
                          {item.branchName ||
                            "غير محدد"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: 9.8 }}
                        >
                          تاريخ الانتهاء
                        </Typography>

                        <Typography
                          fontWeight={850}
                          sx={{ fontSize: 11.5 }}
                        >
                          {formatDate(
                            item.endDate
                          )}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        color={
                          expired ||
                          critical
                            ? "error"
                            : "warning"
                        }
                        label={
                          expired
                            ? `منتهي منذ ${Math.abs(
                                Number(
                                  item.daysToExpiry ||
                                    0
                                )
                              )} يوم`
                            : critical
                              ? `عاجل - متبقي ${Number(
                                  item.daysToExpiry ||
                                    0
                                )} يوم`
                              : `متبقي ${Number(
                                  item.daysToExpiry ||
                                    0
                                )} يوم`
                        }
                        sx={{
                          fontWeight: 900
                        }}
                      />

                      <Stack
                        direction="row"
                        spacing={0.4}
                        justifyContent="flex-end"
                      >
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={
                            <UpdateRoundedIcon />
                          }
                          onClick={() => {
                            setAlertsOpen(
                              false
                            );
                            openContract(
                              item
                            );
                          }}
                          sx={{
                            bgcolor: primary,
                            fontWeight: 900,
                            whiteSpace:
                              "nowrap",
                            "&:hover": {
                              bgcolor:
                                primaryDark
                            }
                          }}
                        >
                          تجديد
                        </Button>

                        <Tooltip title="تعديل بيانات العقد">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAlertsOpen(false);
                              openEditContract(item);
                            }}
                          >
                            <EditRoundedIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="معاينة العقد">
                          <IconButton
                            size="small"
                            onClick={() =>
                              previewContract(
                                item
                              )
                            }
                          >
                            <VisibilityRoundedIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}

              {!alerts.length && (
                <Alert severity="success">
                  لا توجد عقود تحتاج إجراء ضمن الفلاتر الحالية.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        sx={RTL_DIALOG_SX}
        open={previewOpen}
        onClose={closePreview}
        fullWidth
        maxWidth="lg"
        dir={DIALOG_DIRECTION}
        PaperProps={{
          sx: {
            height: {
              xs: "92vh",
              md: "88vh"
            },
            borderRadius: 3,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            py: 1.1,
            px: 1.5,
            borderBottom: `1px solid ${border}`
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: 16
                }}
              >
                معاينة العقد الوظيفي
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.15,
                  fontSize: 10.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {previewRow?.employeeName || ""}
                {previewRow?.contractNumber
                  ? ` • عقد رقم ${previewRow.contractNumber}`
                  : ""}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
            >
              {previewRow?.contractGuid && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    <DownloadRoundedIcon />
                  }
                  onClick={() =>
                    openFile(
                      previewRow.contractGuid
                    )
                  }
                >
                  فتح / تحميل
                </Button>
              )}

              <IconButton
                onClick={closePreview}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            bgcolor: "#edf3f0",
            display: "flex",
            minHeight: 0
          }}
        >
          {previewLoading ? (
            <Box
              sx={{
                width: "100%",
                display: "grid",
                placeItems: "center"
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <CircularProgress />
                <Typography
                  sx={{
                    mt: 1,
                    fontWeight: 800,
                    fontSize: 11
                  }}
                >
                  جاري تجهيز المعاينة...
                </Typography>
              </Box>
            </Box>
          ) : previewError ? (
            <Box
              sx={{
                width: "100%",
                display: "grid",
                placeItems: "center",
                p: 3
              }}
            >
              <Box
                sx={{
                  maxWidth: 520,
                  textAlign: "center"
                }}
              >
                <DescriptionRoundedIcon
                  sx={{
                    fontSize: 64,
                    color: "#98ada2"
                  }}
                />

                <Typography
                  sx={{
                    mt: 0.8,
                    fontWeight: 950
                  }}
                >
                  المعاينة غير متاحة
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    fontSize: 11.5,
                    lineHeight: 1.8
                  }}
                >
                  {previewError}
                </Typography>
              </Box>
            </Box>
          ) : previewUrl ? (
            String(
              previewRow?.originalFileName || ""
            )
              .toLowerCase()
              .match(/\.(jpg|jpeg|png|webp)$/) ? (
              <Box
                component="img"
                src={previewUrl}
                alt="معاينة العقد"
                onError={() =>
                  setPreviewError(
                    "تعذر عرض صورة العقد داخل الصفحة."
                  )
                }
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  bgcolor: "#1d2421"
                }}
              />
            ) : (
              <Box
                component="iframe"
                title="معاينة العقد الوظيفي"
                src={previewUrl}
                onLoad={() =>
                  setPreviewLoading(false)
                }
                sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: "72vh",
                  border: 0,
                  bgcolor: "#fff"
                }}
              />
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        sx={RTL_DIALOG_SX}
        open={contractOpen}
        onClose={() => {
          if (!saving) {
            setContractOpen(false);
          }
        }}
        fullWidth
        maxWidth="md"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          {contractMode === "edit"
            ? "تعديل بيانات العقد الحالي"
            : contractMode === "renew"
              ? "تجديد العقد الوظيفي"
              : "إضافة عقد وظيفي"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderRadius: 2,
                borderColor: border
              }}
            >
              <Typography fontWeight={950}>
                {selectedEmployee?.employeeName ||
                  "-"}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 10.5 }}
              >
                {selectedEmployee?.jobTitle ||
                  "غير محدد"}
                {" • "}
                {selectedEmployee?.branchName ||
                  "غير محدد"}
              </Typography>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))"
                },
                gap: 1
              }}
            >
              <TextField inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                label="رقم العقد"
                value={form.contractNumber}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    contractNumber:
                      e.target.value
                  }))
                }
              />

              <FormControl>
                <InputLabel>نوع العقد</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="نوع العقد"
                  value={form.contractType}
                  onChange={(e) =>
                    setForm((x) => ({
                      ...x,
                      contractType:
                        Number(e.target.value)
                    }))
                  }
                >
                  <MenuItem value={1}>
                    محدد المدة
                  </MenuItem>
                  <MenuItem value={2}>
                    غير محدد المدة
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="تاريخ بداية العقد"
                value={form.startDate}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    startDate: e.target.value
                  }))
                }
                InputLabelProps={{
                  shrink: true
                }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField
                type="date"
                label="تاريخ نهاية العقد"
                value={form.endDate}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    endDate: e.target.value
                  }))
                }
                InputLabelProps={{
                  shrink: true
                }}
                disabled={
                  Number(form.contractType) === 2
                }
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField
                type="number"
                label="الراتب الأساسي"
                value={form.basicSalary}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    basicSalary:
                      e.target.value
                  }))
                }
                inputProps={{ min: 0 , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />

              <TextField
                type="number"
                label="فترة التجربة - يوم"
                value={form.probationDays}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    probationDays:
                      e.target.value
                  }))
                }
                inputProps={{
                  min: 0,
                  max: 365
                , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.autoRenew}
                  onChange={(e) =>
                    setForm((x) => ({
                      ...x,
                      autoRenew:
                        e.target.checked
                    }))
                  }
                />
              }
              label="تجديد تلقائي"
            />

            <TextField
              label="ملاحظات"
              value={form.notes}
              onChange={(e) =>
                setForm((x) => ({
                  ...x,
                  notes: e.target.value
                }))
              }
              multiline
              minRows={2}
            />

            {contractMode === "edit" && (
              <TextField
                label="سبب التعديل"
                value={form.editReason}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    editReason: e.target.value
                  }))
                }
                placeholder="مثال: تصحيح تاريخ نهاية العقد أو الراتب"
                multiline
                minRows={2}
                required
              />
            )}

            <Button
              component="label"
              variant="outlined"
              startIcon={
                <ArticleOutlinedIcon />
              }
              sx={{
                            fontWeight: 850
              }}
            >
              {form.file
                ? form.file.name
                : contractMode === "edit"
                  ? "استبدال ملف العقد - اختياري"
                  : "اختر ملف العقد"}

              <input
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    file:
                      e.target.files?.[0] ||
                      null
                  }))
                }
              />
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setContractOpen(false)
            }
            disabled={saving}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveContract}
            disabled={saving}
            sx={{
              bgcolor: primary,
              "&:hover": {
                bgcolor: primaryDark
              }
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : contractMode === "edit"
                ? "حفظ التعديلات"
                : contractMode === "renew"
                  ? "تجديد العقد"
                  : "حفظ العقد"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={RTL_DIALOG_SX}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="md"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography fontWeight={950}>
                سجل العقود
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 10.5 }}
              >
                {historyEmployee?.employeeName ||
                  ""}
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setHistoryOpen(false)
              }
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {historyLoading ? (
            <Box
              sx={{
                py: 5,
                display: "grid",
                placeItems: "center"
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={0.8}>
              {history.map((item) => (
                <Paper
                  key={item.contractGuid}
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    borderColor: border
                  }}
                >
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row"
                    }}
                    justifyContent="space-between"
                    spacing={1}
                    alignItems={{
                      xs: "stretch",
                      sm: "center"
                    }}
                  >
                    <Box>
                      <Typography fontWeight={900}>
                        {item.contractNumber ||
                          "بدون رقم"}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 10 }}
                      >
                        {item.isCurrent
                          ? "العقد الحالي"
                          : "عقد سابق"}
                        {" • "}
                        {formatDate(item.startDate)}
                        {" ← "}
                        {formatDate(item.endDate)}
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.4}
                      alignItems="center"
                    >
                      {item.isTerminated && (
                        <Chip
                          size="small"
                          label="تم إنهاؤه"
                        />
                      )}

                      <Typography fontWeight={900}>
                        {formatMoney(
                          item.basicSalary
                        )}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() =>
                          openFile(
                            item.contractGuid
                          )
                        }
                      >
                        <DownloadRoundedIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {item.terminationReason && (
                    <Typography
                      color="error"
                      sx={{
                        mt: 0.6,
                        fontSize: 10.5
                      }}
                    >
                      سبب الإنهاء:{" "}
                      {item.terminationReason}
                    </Typography>
                  )}
                </Paper>
              ))}

              {!history.length && (
                <Alert severity="info">
                  لا يوجد سجل عقود لهذا الموظف.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </></NavigationShell>
  );
}
