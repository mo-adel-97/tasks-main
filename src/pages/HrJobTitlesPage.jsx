import * as uiLayout from '../components/hrLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import HistoryIcon from "@mui/icons-material/History";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import WorkIcon from "@mui/icons-material/Work";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";

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
const CENTER_TEXT_ALIGN = "center";

const DIALOG_DIRECTION = "rtl";
const DIALOG_TEXT_ALIGN = "right";
const DIALOG_CENTER_TEXT_ALIGN = "center";

const primary = "#057546";
const primaryDark = "#034d31";
const soft = "#f7fbf9";
const border = "#dce8e2";
const ZERO_GUID = "00000000-0000-0000-0000-000000000000";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = () => {
  const user = readUser();

  return String(
    user?.guid ||
      user?.Guid ||
      user?.userGuid ||
      user?.UserGuid ||
      ""
  ).trim();
};

const norm = (value) =>
  String(value ?? "").trim().toLowerCase();

const emptyForm = () => ({
  jobTitleGuid: "",
  jobTitleCode: "",
  jobTitleName: "",
  legacyJobCode: null,
  departmentGuid: "",
  departmentName: "",
  jobLevel: "",
  description: "",
  responsibilities: "",
  requirements: "",
  isManager: false,
  isActive: true,
  isLegacy: false,
  showInUserSelection: true,
  employeeCount: 0,
  activeEmployeeCount: 0,
  inactiveEmployeeCount: 0
});

const normalizeJobTitle = (row) => ({
  ...emptyForm(),
  ...(row || {}),
  jobTitleGuid: row?.jobTitleGuid || "",
  departmentGuid: row?.departmentGuid || "",
  jobLevel:
    row?.jobLevel === null ||
    row?.jobLevel === undefined
      ? ""
      : row.jobLevel,
  legacyJobCode:
    row?.legacyJobCode === null ||
    row?.legacyJobCode === undefined
      ? null
      : Number(row.legacyJobCode),
  isManager: Boolean(row?.isManager),
  isActive: Boolean(row?.isActive),
  isLegacy: Boolean(row?.isLegacy),
  showInUserSelection: Boolean(
    row?.showInUserSelection
  )
});

export default function HrJobTitlesPage() {
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const userGuid = useMemo(() => getUserGuid(), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [permissionLoading, setPermissionLoading] =
    useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("create");
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [employeesOpen, setEmployeesOpen] =
    useState(false);
  const [employeesTitle, setEmployeesTitle] =
    useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] =
    useState("");
  const [employeePage, setEmployeePage] =
    useState(1);
  const [employeePageSize, setEmployeePageSize] =
    useState(20);
  const [employeeTotal, setEmployeeTotal] =
    useState(0);
  const [employeeLoading, setEmployeeLoading] =
    useState(false);

  const [jobMoveOpen, setJobMoveOpen] =
    useState(false);
  const [jobMoveEmployee, setJobMoveEmployee] =
    useState(null);
  const [jobMoveMode, setJobMoveMode] =
    useState("transfer");
  const [jobMoveTargetGuid, setJobMoveTargetGuid] =
    useState("");
  const [jobMoveDate, setJobMoveDate] =
    useState(() => new Date().toISOString().slice(0, 10));
  const [jobMoveReason, setJobMoveReason] =
    useState("");
  const [jobMoveNotes, setJobMoveNotes] =
    useState("");
  const [jobMoveSaving, setJobMoveSaving] =
    useState(false);

  const [promotionPlansOpen, setPromotionPlansOpen] =
    useState(false);
  const [promotionPlans, setPromotionPlans] =
    useState([]);
  const [promotionPlansLoading, setPromotionPlansLoading] =
    useState(false);
  const [promotionPlansStatus, setPromotionPlansStatus] =
    useState("Pending");
  const [promotionPlansSearch, setPromotionPlansSearch] =
    useState("");

  const [historyOpen, setHistoryOpen] =
    useState(false);
  const [historyTitle, setHistoryTitle] =
    useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);

  // ============================================================
  // Permission
  // ============================================================
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!userGuid) {
          if (alive) {
            setAuthorized(false);
          }
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(
            userGuid
          )}`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        const data = result?.data || {};

        const direct =
          data?.humanResources?.canView === true &&
          data?.humanResources?.screens?.jobTitles ===
            true;

        const hasForm =
          Array.isArray(data?.forms) &&
          data.forms.some(
            (item) =>
              norm(item?.code) === "202" ||
              norm(item?.name) ===
                norm("الوظائف والمسميات الوظيفية")
          );

        if (alive) {
          setAuthorized(
            response.ok && (direct || hasForm)
          );
        }
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setPermissionLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  // ============================================================
  // Load departments
  // ============================================================
  const loadDepartments = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/job-titles/departments`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل الأقسام"
        );
      }

      setDepartments(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch {
      setDepartments([]);
    }
  }, []);

  // ============================================================
  // Main list
  // ============================================================
  const loadRows = useCallback(async () => {
    if (!authorized) return;

    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter === "active") {
        params.set("isActive", "true");
      }

      if (statusFilter === "inactive") {
        params.set("isActive", "false");
      }

      const suffix = params.toString()
        ? `?${params.toString()}`
        : "";

      const response = await fetch(
        `${API_BASE_URL}/api/hr/job-titles${suffix}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل الوظائف والمسميات الوظيفية"
        );
      }

      setRows(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (e) {
      setRows([]);

      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text:
          e?.message ||
          "تعذر تحميل الوظائف والمسميات الوظيفية"
      });
    } finally {
      setLoading(false);
    }
  }, [authorized, search, statusFilter]);

  useEffect(() => {
    if (!authorized) return;

    const timer = setTimeout(() => {
      loadRows();
    }, search.trim() ? 300 : 0);

    return () => clearTimeout(timer);
  }, [authorized, search, statusFilter, loadRows]);

  useEffect(() => {
    if (!authorized) return;
    loadDepartments();
  }, [authorized, loadDepartments]);

  // ============================================================
  // Statistics
  // ============================================================
  // Legacy index 12 محفوظ للتوافق مع النظام القديم فقط،
  // ولا يظهر في شاشة الموارد البشرية.
  const visibleRows = useMemo(
    () =>
      rows.filter(
        (item) => Number(item?.legacyJobCode) !== 12
      ),
    [rows]
  );

  const stats = useMemo(() => {
    const total = visibleRows.length;

    const active = visibleRows.filter(
      (item) => item.isActive
    ).length;

    const inactive = visibleRows.filter(
      (item) => !item.isActive
    ).length;

    const employees = visibleRows.reduce(
      (sum, item) =>
        sum + Number(item.employeeCount || 0),
      0
    );

    return {
      total,
      active,
      inactive,
      employees
    };
  }, [visibleRows]);

  // ============================================================
  // Create / Edit
  // ============================================================
  const openCreate = useCallback(() => {
    setEditMode("create");
    setForm(emptyForm());
    setEditOpen(true);
  }, []);

  const openEdit = useCallback((row) => {
    setEditMode("edit");
    setForm(normalizeJobTitle(row));
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    if (saving) return;
    setEditOpen(false);
  }, [saving]);

  const setFormField = useCallback((field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const save = useCallback(async () => {
    const name = String(
      form.jobTitleName || ""
    ).trim();

    if (!name) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "اسم المسمى الوظيفي مطلوب"
      });
      return;
    }

    let reason = "";

    if (editMode === "edit") {
      const result = await Swal.fire({
        title: "سبب التعديل",
        input: "textarea",
        inputPlaceholder:
          "اكتب سبب تعديل المسمى الوظيفي...",
        inputAttributes: {
          dir: "rtl",
          rows: "5"
        },
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        focusConfirm: false,
        didOpen: () => {
          const input = Swal.getInput();
          if (input) {
            input.style.direction = "rtl";
            input.style.textAlign = "right";
            input.style.position = "relative";
            input.style.zIndex = "1";
            setTimeout(() => input.focus(), 0);
          }
        },
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب التعديل مطلوب"
            : undefined
      });

      if (!result.isConfirmed) return;

      reason = String(
        result.value || ""
      ).trim();
    }

    const payload = {
      jobTitleName: name,
      departmentGuid:
        form.departmentGuid &&
        form.departmentGuid !== ZERO_GUID
          ? form.departmentGuid
          : null,
      jobLevel:
        form.jobLevel === "" ||
        form.jobLevel === null ||
        form.jobLevel === undefined
          ? null
          : Number(form.jobLevel),
      description:
        String(form.description || "").trim() ||
        null,
      responsibilities:
        String(
          form.responsibilities || ""
        ).trim() || null,
      requirements:
        String(form.requirements || "").trim() ||
        null,
      isManager: Boolean(form.isManager),
      showInUserSelection:
        Number(form.legacyJobCode) === 12
          ? false
          : Boolean(form.showInUserSelection),
      actorUserGuid: userGuid || null
    };

    if (editMode === "edit") {
      payload.isActive = Boolean(form.isActive);

      /*
       * Legacy 12 is always hidden.
       * Non-legacy titles cannot be exposed to UserJop until a safe
       * migration gives them a supported legacy index.
       */
      payload.showInUserSelection =
        Number(form.legacyJobCode) === 12
          ? false
          : Boolean(form.showInUserSelection);

      payload.reason = reason;
    }

    setSaving(true);

    try {
      const url =
        editMode === "edit"
          ? `${API_BASE_URL}/api/hr/job-titles/${encodeURIComponent(
              form.jobTitleGuid
            )}`
          : `${API_BASE_URL}/api/hr/job-titles`;

      const response = await fetch(url, {
        method:
          editMode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر حفظ المسمى الوظيفي"
        );
      }

      setEditOpen(false);

      await Swal.fire({
        icon: "success",
        title:
          editMode === "edit"
            ? "تم تعديل المسمى"
            : "تم إنشاء المسمى",
        text:
          editMode === "edit"
            ? "تم حفظ التعديلات بنجاح"
            : "تم إنشاء المسمى الوظيفي بنجاح"
      });

      await loadRows();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          e?.message ||
          "تعذر حفظ المسمى الوظيفي"
      });
    } finally {
      setSaving(false);
    }
  }, [
    form,
    editMode,
    userGuid,
    loadRows
  ]);

  // ============================================================
  // Employees
  // ============================================================
  const openEmployees = useCallback((row) => {
    setEmployeesTitle(row);
    setEmployeeSearch("");
    setEmployeePage(1);
    setEmployeePageSize(20);
    setEmployeeTotal(0);
    setEmployees([]);
    setEmployeesOpen(true);
  }, []);

  const loadEmployees = useCallback(async () => {
    if (
      !employeesOpen ||
      !employeesTitle?.jobTitleGuid
    ) {
      return;
    }

    setEmployeeLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(employeePage),
        pageSize: String(employeePageSize)
      });

      if (employeeSearch.trim()) {
        params.set(
          "search",
          employeeSearch.trim()
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr/job-titles/${encodeURIComponent(
          employeesTitle.jobTitleGuid
        )}/employees?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل الموظفين"
        );
      }

      setEmployees(
        Array.isArray(result?.data)
          ? result.data
          : []
      );

      setEmployeeTotal(
        Number(result?.totalCount || 0)
      );
    } catch (e) {
      setEmployees([]);
      setEmployeeTotal(0);

      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل الموظفين",
        text:
          e?.message ||
          "حدث خطأ أثناء تحميل الموظفين"
      });
    } finally {
      setEmployeeLoading(false);
    }
  }, [
    employeesOpen,
    employeesTitle,
    employeeSearch,
    employeePage,
    employeePageSize
  ]);

  useEffect(() => {
    if (!employeesOpen) return;

    const timer = setTimeout(() => {
      loadEmployees();
    }, employeeSearch.trim() ? 350 : 0);

    return () => clearTimeout(timer);
  }, [
    employeesOpen,
    employeeSearch,
    employeePage,
    employeePageSize,
    loadEmployees
  ]);

  const employeePageCount =
    employeeTotal > 0
      ? Math.ceil(
          employeeTotal / employeePageSize
        )
      : 0;

  // ============================================================
  // Employee job movement / promotion plan
  // ============================================================
  const availableTargetJobTitles = useMemo(
    () =>
      rows.filter(
        (item) =>
          item?.isActive === true &&
          item?.showInUserSelection === true &&
          item?.legacyJobCode !== null &&
          item?.legacyJobCode !== undefined &&
          Number(item?.legacyJobCode) !== 12 &&
          Number(item?.legacyJobCode) !==
            Number(employeesTitle?.legacyJobCode)
      ),
    [rows, employeesTitle]
  );

  const openJobMove = useCallback(
    (employee, mode = "transfer") => {
      setJobMoveEmployee(employee);
      setJobMoveMode(mode);
      setJobMoveTargetGuid("");
      setJobMoveDate(
        new Date().toISOString().slice(0, 10)
      );
      setJobMoveReason("");
      setJobMoveNotes("");
      setJobMoveOpen(true);
    },
    []
  );

  const saveJobMove = useCallback(async () => {
    if (!jobMoveEmployee?.employeeGuid) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "تعذر تحديد الموظف"
      });
      return;
    }

    if (!jobMoveTargetGuid) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: "اختر المسمى الوظيفي المستهدف"
      });
      return;
    }

    if (!jobMoveReason.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text:
          jobMoveMode === "plan"
            ? "سبب خطة الترقية مطلوب"
            : "سبب النقل أو الترقية مطلوب"
      });
      return;
    }

    setJobMoveSaving(true);

    try {
      const isPlan = jobMoveMode === "plan";

      const response = await fetch(
        isPlan
          ? `${API_BASE_URL}/api/hr/job-titles/promotion-plans`
          : `${API_BASE_URL}/api/hr/job-titles/change-employee-job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            isPlan
              ? {
                  employeeGuid:
                    jobMoveEmployee.employeeGuid,
                  targetJobTitleGuid:
                    jobMoveTargetGuid,
                  plannedDate: jobMoveDate,
                  reason: jobMoveReason.trim(),
                  notes:
                    jobMoveNotes.trim() || null,
                  actorUserGuid:
                    userGuid || null
                }
              : {
                  employeeGuid:
                    jobMoveEmployee.employeeGuid,
                  targetJobTitleGuid:
                    jobMoveTargetGuid,
                  movementType:
                    jobMoveMode === "promotion"
                      ? "Promotion"
                      : "Transfer",
                  effectiveDate: jobMoveDate,
                  reason: jobMoveReason.trim(),
                  notes:
                    jobMoveNotes.trim() || null,
                  actorUserGuid:
                    userGuid || null
                }
          )
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر حفظ العملية"
        );
      }

      setJobMoveOpen(false);

      await Swal.fire({
        icon: "success",
        title:
          isPlan
            ? "تمت إضافة خطة الترقية"
            : jobMoveMode === "promotion"
              ? "تمت الترقية"
              : "تم النقل",
        text:
          result?.message || "تمت العملية بنجاح"
      });

      if (!isPlan) {
        const remainingAfterMove =
          Math.max(0, employeeTotal - 1);

        if (
          remainingAfterMove > 0 &&
          employees.length === 1 &&
          employeePage > 1
        ) {
          setEmployeePage((current) =>
            Math.max(1, current - 1)
          );
        } else {
          await loadEmployees();
        }

        await loadRows();
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تنفيذ العملية",
        text:
          error?.message ||
          "حدث خطأ أثناء حفظ العملية"
      });
    } finally {
      setJobMoveSaving(false);
    }
  }, [
    jobMoveEmployee,
    jobMoveMode,
    jobMoveTargetGuid,
    jobMoveDate,
    jobMoveReason,
    jobMoveNotes,
    userGuid,
    employeeTotal,
    employees.length,
    employeePage,
    loadEmployees,
    loadRows
  ]);

  const loadPromotionPlans =
    useCallback(async () => {
      setPromotionPlansLoading(true);

      try {
        const params = new URLSearchParams();

        if (
          promotionPlansStatus &&
          promotionPlansStatus !== "all"
        ) {
          params.set(
            "status",
            promotionPlansStatus
          );
        }

        if (promotionPlansSearch.trim()) {
          params.set(
            "search",
            promotionPlansSearch.trim()
          );
        }

        const query = params.toString();

        const response = await fetch(
          `${API_BASE_URL}/api/hr/job-titles/promotion-plans${
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
              "تعذر تحميل خطط الترقيات"
          );
        }

        setPromotionPlans(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        setPromotionPlans([]);

        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text:
            error?.message ||
            "تعذر تحميل خطط الترقيات"
        });
      } finally {
        setPromotionPlansLoading(false);
      }
    }, [
      promotionPlansStatus,
      promotionPlansSearch
    ]);

  useEffect(() => {
    if (!promotionPlansOpen) return;

    const timer = setTimeout(() => {
      loadPromotionPlans();
    }, promotionPlansSearch.trim() ? 300 : 0);

    return () => clearTimeout(timer);
  }, [
    promotionPlansOpen,
    promotionPlansStatus,
    promotionPlansSearch,
    loadPromotionPlans
  ]);

  const executePromotionPlan =
    useCallback(
      async (plan) => {
        const confirm = await Swal.fire({
          icon: "question",
          title: "تنفيذ الترقية الآن؟",
          html: `
            <div style="font-family:Cairo;text-align:right">
              <b>${plan?.employeeName || ""}</b><br/>
              ${plan?.fromJobTitleName || "غير محدد"}
              ←
              ${plan?.toJobTitleName || "غير محدد"}
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "تنفيذ الترقية",
          cancelButtonText: "إلغاء"
        });

        if (!confirm.isConfirmed) return;

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/hr/job-titles/promotion-plans/${encodeURIComponent(
              plan.planGuid
            )}/execute`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                actorUserGuid:
                  userGuid || null
              })
            }
          );

          const result = await response
            .json()
            .catch(() => null);

          if (!response.ok) {
            throw new Error(
              result?.message ||
                "تعذر تنفيذ خطة الترقية"
            );
          }

          await Swal.fire({
            icon: "success",
            title: "تم التنفيذ",
            text:
              result?.message ||
              "تم تنفيذ خطة الترقية"
          });

          await Promise.all([
            loadPromotionPlans(),
            loadRows()
          ]);

          if (employeesOpen) {
            await loadEmployees();
          }
        } catch (error) {
          await Swal.fire({
            icon: "error",
            title: "تعذر التنفيذ",
            text:
              error?.message ||
              "حدث خطأ أثناء تنفيذ خطة الترقية"
          });
        }
      },
      [
        userGuid,
        loadPromotionPlans,
        loadRows,
        employeesOpen,
        loadEmployees
      ]
    );

  const cancelPromotionPlan =
    useCallback(
      async (plan) => {
        const result = await Swal.fire({
          title: "إلغاء خطة الترقية",
          input: "textarea",
          inputPlaceholder:
            "اكتب سبب إلغاء الخطة...",
          showCancelButton: true,
          confirmButtonText: "إلغاء الخطة",
          cancelButtonText: "رجوع",
          inputValidator: (value) =>
            !String(value || "").trim()
              ? "سبب الإلغاء مطلوب"
              : undefined
        });

        if (!result.isConfirmed) return;

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/hr/job-titles/promotion-plans/${encodeURIComponent(
              plan.planGuid
            )}/cancel`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                cancelReason:
                  String(result.value).trim(),
                actorUserGuid:
                  userGuid || null
              })
            }
          );

          const data = await response
            .json()
            .catch(() => null);

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "تعذر إلغاء خطة الترقية"
            );
          }

          await loadPromotionPlans();
        } catch (error) {
          await Swal.fire({
            icon: "error",
            title: "تعذر الإلغاء",
            text:
              error?.message ||
              "حدث خطأ أثناء إلغاء الخطة"
          });
        }
      },
      [userGuid, loadPromotionPlans]
    );

  // ============================================================
  // History
  // ============================================================
  const openHistory = useCallback(async (row) => {
    setHistoryTitle(row);
    setHistoryRows([]);
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/job-titles/${encodeURIComponent(
          row.jobTitleGuid
        )}/history`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل سجل التعديلات"
        );
      }

      setHistoryRows(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (e) {
      setHistoryRows([]);

      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل السجل",
        text:
          e?.message ||
          "حدث خطأ أثناء تحميل سجل التعديلات"
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ============================================================
  // Render states
  // ============================================================
  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          لا توجد لديك صلاحية شاشة الوظائف والمسميات الوظيفية.
        </Alert>
      </Box>
    );
  }

  const content = (
    <Box
      dir={PAGE_DIRECTION}
      sx={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        bgcolor: "#f4f7f5",
        p: { xs: 0.8, sm: 1.2, md: 1.8 },
        textAlign: PAGE_TEXT_ALIGN
      }}
    >
      <Box
        sx={{
          maxWidth: "100%",
          mx: "auto"
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            mb: 1.5,
            border: `1px solid ${border}`
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              bgcolor: primaryDark,
              color: "#fff",
              px: { xs: 1.3, sm: 2.2 },
              py: { xs: 1.25, sm: 1.7 },
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
              justifyContent: "space-between"
            }, uiLayout.mobileHeaderSx)}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ minWidth: 0 }}
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

              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,.12)",
                  flexShrink: 0
                }}
              >
                <WorkIcon />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography className="hr-page-title"
                  sx={{
                    fontWeight: 950,
                    fontSize: { xs: 18, sm: 24 },
                    lineHeight: 1.2
                  }}
                >
                  الوظائف والمسميات الوظيفية
                </Typography>

                <Typography
                  sx={{
                    opacity: 0.78,
                    fontSize: { xs: 12, sm: 12.5 },
                    mt: 0.25
                  }}
                >
                  إدارة المسميات الوظيفية والموظفين المرتبطين بها
                </Typography>
              </Box>
            </Stack>

            <Stack sx={uiLayout.actionBarSx}
              direction="row"
              spacing={0.8}
              alignItems="center"
            >
              <Tooltip title="تحديث البيانات">
                <IconButton
                  onClick={loadRows}
                  sx={{
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,.08)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,.16)"
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Button
                variant="outlined"
                startIcon={<EventNoteRoundedIcon />}
                onClick={() => {
                  setPromotionPlansSearch("");
                  setPromotionPlansStatus("Pending");
                  setPromotionPlansOpen(true);
                }}
                sx={uiLayout.withUiSx({
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.42)",
                  fontWeight: 900,
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,.08)"
                  }
                }, uiLayout.buttonSx)}
              >
                خطة الترقيات
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={uiLayout.withUiSx({
                  bgcolor: "#fff",
                  color: primaryDark,
                  fontWeight: 900,
                  borderRadius: 2,
                  px: 2,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#eef8f3",
                    boxShadow: "none"
                  }
                }, uiLayout.buttonSx)}
              >
                مسمى جديد
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Summary */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              md: "repeat(4,minmax(0,1fr))"
            },
            gap: 1,
            mb: 1.5
          }}
        >
          {[
            ["إجمالي المسميات", stats.total],
            ["المسميات النشطة", stats.active],
            ["المسميات غير النشطة", stats.inactive],
            ["إجمالي الموظفين", stats.employees]
          ].map(([label, value]) => (
            <Paper
              key={label}
              elevation={0}
              sx={{
                border: `1px solid ${border}`,
                borderRadius: 2.5,
                px: { xs: 1, sm: 1.4 },
                py: { xs: 1, sm: 1.25 },
                bgcolor: "#fff"
              }}
            >
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: { xs: 12, sm: 12 },
                  fontWeight: 800,
                  mb: 0.2
                }}
              >
                {label}
              </Typography>

              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: { xs: 20, sm: 24 },
                  color: primaryDark,
                  lineHeight: 1.2
                }}
              >
                {value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Search / filter */}
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${border}`,
            borderRadius: 2.5,
            p: 1,
            mb: 1.5,
            bgcolor: "#fff"
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(260px,1fr) 180px"
              },
              gap: 1
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="ابحث باسم المسمى أو القسم..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <FormControl sx={uiLayout.formFieldSx} size="small">
              <InputLabel>الحالة</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الحالة"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <MenuItem value="all">الكل</MenuItem>
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="inactive">غير نشط</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Job titles */}
        {loading ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${border}`,
              borderRadius: 2.5
            }}
          >
            <CircularProgress />
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2,minmax(0,1fr))",
                xl: "repeat(3,minmax(0,1fr))"
              },
              gap: 1.1
            }}
          >
            {visibleRows.map((row) => (
              <Paper
                key={row.jobTitleGuid}
                elevation={0}
                sx={{
                  border: `1px solid ${border}`,
                  borderRadius: 2.5,
                  bgcolor: "#fff",
                  p: 1.35,
                  transition:
                    "transform .15s ease, box-shadow .15s ease, border-color .15s ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow:
                      "0 8px 22px rgba(15, 77, 49, .08)",
                    borderColor: "#b8d5c7"
                  }
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    alignItems: "flex-start"
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={0.6}
                      alignItems="center"
                      sx={{
                        mb: 0.35,
                        flexWrap: "wrap",
                        rowGap: 0.5
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 950,
                          fontSize: 16.5,
                          lineHeight: 1.3
                        }}
                      >
                        {row.jobTitleName}
                      </Typography>

                      <Chip
                        size="small"
                        label={
                          row.isActive
                            ? "نشط"
                            : "غير نشط"
                        }
                        color={
                          row.isActive
                            ? "success"
                            : "default"
                        }
                        sx={{
                          height: 22,
                          fontWeight: 800,
                          fontSize: 12
                        }}
                      />
                    </Stack>

                    <Typography
                      color="text.secondary"
                      sx={{
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        minWidth: 0
                      }}
                    >
                      <span>
                        {row.departmentName || "بدون قسم محدد"}
                      </span>
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={0.2}
                    sx={{ flexShrink: 0 }}
                  >
                    <Tooltip title="تعديل المسمى">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(row)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="عرض الموظفين">
                      <IconButton
                        size="small"
                        onClick={() =>
                          openEmployees(row)
                        }
                      >
                        <GroupIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="سجل التعديلات">
                      <IconButton
                        size="small"
                        onClick={() =>
                          openHistory(row)
                        }
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3,minmax(0,1fr))",
                    gap: 0.6,
                    mb: 0.8
                  }}
                >
                  {[
                    [
                      "الموظفون",
                      Number(row.employeeCount || 0)
                    ],
                    [
                      "نشط",
                      Number(row.activeEmployeeCount || 0)
                    ],
                    [
                      "غير نشط",
                      Number(row.inactiveEmployeeCount || 0)
                    ]
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        bgcolor: "#f7faf8",
                        borderRadius: 1.5,
                        px: 0.7,
                        py: 0.55,
                        textAlign: CENTER_TEXT_ALIGN
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
                          fontWeight: 900,
                          fontSize: 14
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Stack
                  direction="row"
                  spacing={0.6}
                  alignItems="center"
                  sx={{
                    flexWrap: "wrap",
                    rowGap: 0.5
                  }}
                >
                  <Chip
                    size="small"
                    label={
                      row.isManager
                        ? "إداري / إشرافي"
                        : "وظيفي"
                    }
                    variant="outlined"
                    sx={{
                      height: 24,
                      fontSize: 12
                    }}
                  />

                  <Chip
                    size="small"
                    label={
                      row.showInUserSelection
                        ? "متاح عند إضافة مستخدم"
                        : "غير متاح عند إضافة مستخدم"
                    }
                    variant="outlined"
                    sx={{
                      height: 24,
                      fontSize: 12
                    }}
                  />

                  {row.jobLevel !== null &&
                    row.jobLevel !== undefined &&
                    row.jobLevel !== "" && (
                      <Chip
                        size="small"
                        label={`المستوى ${row.jobLevel}`}
                        variant="outlined"
                        sx={{
                          height: 24,
                          fontSize: 12
                        }}
                      />
                    )}
                </Stack>

                {row.description && (
                  <Typography
                    color="text.secondary"
                    sx={{
                      mt: 0.9,
                      fontSize: 12,
                      lineHeight: 1.65,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {row.description}
                  </Typography>
                )}
              </Paper>
            ))}

            {!visibleRows.length && (
              <Paper
                elevation={0}
                sx={{
                  gridColumn: "1 / -1",
                  p: 2,
                  border: `1px solid ${border}`,
                  borderRadius: 2.5
                }}
              >
                <Alert severity="info">
                  لا توجد مسميات مطابقة للبحث.
                </Alert>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><>
      <Box sx={{ ...navigationContentSx, ...uiLayout.scopeSx, bgcolor: soft, minHeight: "100vh" }}>{content}</Box>

      {/* =======================================================
          Create / Edit dialog
          ======================================================= */}
      <Dialog
        sx={[uiLayout.dialogLayoutSx, RTL_DIALOG_SX]}
        open={editOpen}
        onClose={closeEdit}
        fullWidth
        maxWidth={false}
        dir={DIALOG_DIRECTION}
        disableEnforceFocus
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 16px)",
              sm: "min(900px, calc(100% - 32px))"
            },
            maxWidth: "900px !important",
            m: { xs: 1, sm: 2 },
            borderRadius: { xs: 2.5, sm: 3 },
            overflow: "hidden",
            backgroundImage: "none"
          }
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 1.5, sm: 2.25 },
            py: { xs: 1.15, sm: 1.35 },
            borderBottom: `1px solid ${border}`,
            bgcolor: "#fff"
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Box sx={{ minWidth: 0, textAlign: DIALOG_TEXT_ALIGN }}>
              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: { xs: "1rem", sm: "1.08rem" },
                  color: primaryDark,
                  lineHeight: 1.35
                }}
              >
                {editMode === "edit"
                  ? "تعديل المسمى الوظيفي"
                  : "إضافة مسمى وظيفي جديد"}
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  fontSize: "0.72rem",
                  lineHeight: 1.6,
                  color: "text.secondary"
                }}
              >
                {editMode === "edit"
                  ? "حدّث بيانات المسمى الوظيفي ثم احفظ التغييرات."
                  : "أدخل بيانات المسمى الوظيفي وحدد القسم التابع له."}
              </Typography>
            </Box>
            <IconButton onClick={closeEdit} disabled={saving} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 1.25, sm: 2.25 },
            py: { xs: 1.25, sm: 1.7 },
            bgcolor: "#fbfdfc",
            overflowX: "hidden"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))"
              },
              gap: { xs: 1.1, sm: 1.25 },
              width: "100%",
              minWidth: 0,
              alignItems: "start",
              textAlign: DIALOG_TEXT_ALIGN,
              "& > *": {
                minWidth: 0,
                width: "100%"
              }
            }}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="اسم المسمى الوظيفي"
              value={form.jobTitleName}
              onChange={(e) =>
                setFormField(
                  "jobTitleName",
                  e.target.value
                )
              }
              required
            />

            <FormControl sx={uiLayout.formFieldSx} fullWidth>
              <InputLabel>القسم</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="القسم"
                value={
                  form.departmentGuid || ""
                }
                onChange={(e) =>
                  setFormField(
                    "departmentGuid",
                    e.target.value
                  )
                }
              >
                <MenuItem value="">
                  بدون قسم محدد
                </MenuItem>

                {departments.map(
                  (department) => (
                    <MenuItem
                      key={
                        department.departmentGuid
                      }
                      value={
                        department.departmentGuid
                      }
                    >
                      {department.departmentName}
                      {!department.isActive
                        ? " — غير نشط"
                        : ""}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
            <TextField InputLabelProps={{ shrink: true }}
              label="الوصف"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) =>
                setFormField(
                  "description",
                  e.target.value
                )
              }
              sx={uiLayout.withUiSx({
                gridColumn: {
                  sm: "1 / -1"
                }
              }, uiLayout.formFieldSx)}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="المهام والمسؤوليات"
              multiline
              minRows={2}
              value={form.responsibilities}
              onChange={(e) =>
                setFormField(
                  "responsibilities",
                  e.target.value
                )
              }
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="المتطلبات"
              multiline
              minRows={2}
              value={form.requirements}
              onChange={(e) =>
                setFormField(
                  "requirements",
                  e.target.value
                )
              }
            />
          </Box>

          <Box
            sx={{
              mt: 1.25,
              p: { xs: 1, sm: 1.1 },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              flexWrap: "wrap",
              gap: { xs: 0.25, sm: 1.25 },
              border: `1px solid ${border}`,
              borderRadius: 2,
              bgcolor: "#fff",
              textAlign: DIALOG_TEXT_ALIGN,
              "& .MuiFormControlLabel-root": {
                m: 0,
                minHeight: 34
              },
              "& .MuiFormControlLabel-label": {
                fontSize: "0.78rem",
                fontWeight: 700
              }
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isManager}
                  onChange={(e) =>
                    setFormField(
                      "isManager",
                      e.target.checked
                    )
                  }
                />
              }
              label="مسمى إداري / إشرافي"
            />

            {Number(form.legacyJobCode) !== 12 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.showInUserSelection}
                    onChange={(e) =>
                      setFormField(
                        "showInUserSelection",
                        e.target.checked
                      )
                    }
                  />
                }
                label="يظهر في خيارات المستخدم عند الإضافة"
              />
            )}

            {editMode === "edit" && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isActive}
                    onChange={(e) =>
                      setFormField(
                        "isActive",
                        e.target.checked
                      )
                    }
                  />
                }
                label="نشط"
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: { xs: 1.25, sm: 2.25 },
            py: { xs: 1.05, sm: 1.2 },
            justifyContent: "flex-start",
            gap: 0.75,
            bgcolor: "#fff"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={uiLayout.withUiSx({
              minWidth: 104,
              bgcolor: primary,
              "&:hover": {
                bgcolor: primaryDark
              }
            }, uiLayout.buttonSx)}
          >
            {saving
              ? "جاري الحفظ..."
              : "حفظ"}
          </Button>

          <Button
            sx={uiLayout.buttonSx}
            onClick={closeEdit}
            disabled={saving}
          >
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          Employees dialog
          ======================================================= */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={employeesOpen}
        onClose={() =>
          setEmployeesOpen(false)
        }
        fullWidth
        maxWidth="md"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 1,
              alignItems: "center"
            }}
          >
            <Box>
              <Typography fontWeight={950}>
                موظفو{" "}
                {employeesTitle?.jobTitleName ||
                  ""}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12 }}
              >
                إجمالي الموظفين:{" "}
                {employeeTotal}
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setEmployeesOpen(false)
              }
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {employeesTitle?.legacyJobCode ===
            null ||
          employeesTitle?.legacyJobCode ===
            undefined ? (
            <Alert severity="info">
              لا يوجد موظفون مرتبطون بهذا المسمى حالياً.
            </Alert>
          ) : (
            <>
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 130px"
                  },
                  gap: 1,
                  mb: 1.2
                }, uiLayout.formSectionSx)}
              >
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  size="small"
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(
                      e.target.value
                    );
                    setEmployeePage(1);
                  }}
                  placeholder="بحث بالاسم أو الكود أو الجوال..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />

                <FormControl sx={uiLayout.formFieldSx} size="small">
                  <InputLabel>
                    عدد الصفوف
                  </InputLabel>
                  <Select
                  MenuProps={RTL_MENU_PROPS}
                    label="عدد الصفوف"
                    value={employeePageSize}
                    onChange={(e) => {
                      setEmployeePageSize(
                        Number(e.target.value)
                      );
                      setEmployeePage(1);
                    }}
                  >
                    {[10, 20, 30, 50].map(
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

              {employeeLoading ? (
                <Box
                  sx={{
                    py: 6,
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={0.8}>
                  {employees.map(
                    (employee) => (
                      <Paper
                        key={
                          employee.employeeGuid ||
                          employee.employeeCode
                        }
                        variant="outlined"
                        sx={{
                          p: 1,
                          borderColor: border
                        }}
                      >
                        <Box
                          sx={uiLayout.withUiSx({
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm:
                                "90px minmax(0,1fr) 100px 210px"
                            },
                            gap: 0.8,
                            alignItems: "center",
                            textAlign:
                              DIALOG_TEXT_ALIGN
                          }, uiLayout.pageHeaderSx)}
                        >
                          <Typography
                            fontWeight={900}
                          >
                            {employee.employeeCode ||
                              "-"}
                          </Typography>

                          <Box
                            sx={{
                              minWidth: 0
                            }}
                          >
                            <Typography
                              noWrap
                              fontWeight={900}
                            >
                              {employee.employeeName ||
                                "-"}
                            </Typography>

                            <Typography
                              color="text.secondary"
                              sx={{
                                fontSize: 12
                              }}
                            >
                              {employee.departmentName ||
                                "بدون قسم"}
                              {" • "}
                              {employee.branchName ||
                                "غير محدد"}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={
                              employee.isActive
                                ? "نشط"
                                : "غير نشط"
                            }
                            color={
                              employee.isActive
                                ? "success"
                                : "default"
                            }
                          />

                          <Stack sx={uiLayout.actionBarSx}
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <SwapHorizRoundedIcon />
                              }
                              onClick={() =>
                                openJobMove(
                                  employee,
                                  "transfer"
                                )
                              }
                              sx={uiLayout.withUiSx({
                                fontWeight: 800,
                                whiteSpace: "nowrap"
                              }, uiLayout.buttonSx)}
                            >
                              نقل
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <TrendingUpRoundedIcon />
                              }
                              onClick={() =>
                                openJobMove(
                                  employee,
                                  "promotion"
                                )
                              }
                              sx={uiLayout.withUiSx({
                                fontWeight: 800,
                                whiteSpace: "nowrap"
                              }, uiLayout.buttonSx)}
                            >
                              ترقية
                            </Button>
                          </Stack>
                        </Box>
                      </Paper>
                    )
                  )}

                  {!employees.length && (
                    <Alert severity="info">
                      لا توجد نتائج.
                    </Alert>
                  )}
                </Stack>
              )}

              {employeePageCount > 1 && (
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    justifyContent: "center"
                  }}
                >
                  <Pagination
                    count={
                      employeePageCount
                    }
                    page={employeePage}
                    onChange={(
                      _event,
                      value
                    ) =>
                      setEmployeePage(
                        value
                      )
                    }
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setEmployeesOpen(false)
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          Employee movement / promotion dialog
          ======================================================= */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={jobMoveOpen}
        onClose={() => {
          if (!jobMoveSaving) {
            setJobMoveOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          {jobMoveMode === "plan"
            ? "إضافة إلى خطة الترقيات"
            : jobMoveMode === "promotion"
              ? "ترقية موظف"
              : "نقل موظف لمسمى آخر"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack sx={uiLayout.filterBarSx} spacing={1.2}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.2,
                borderRadius: 2,
                borderColor: border,
                bgcolor: "#f8fbf9"
              }}
            >
              <Typography fontWeight={950}>
                {jobMoveEmployee?.employeeName || "-"}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: 12 }}
              >
                المسمى الحالي:{" "}
                {employeesTitle?.jobTitleName ||
                  "غير محدد"}
              </Typography>
            </Paper>

            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))"
                },
                gap: 1
              }, uiLayout.formSectionSx)}
            >
              <FormControl sx={uiLayout.formFieldSx} fullWidth>
                <InputLabel>
                  المسمى الوظيفي الجديد
                </InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="المسمى الوظيفي الجديد"
                  value={jobMoveTargetGuid}
                  onChange={(event) =>
                    setJobMoveTargetGuid(
                      event.target.value
                    )
                  }
                >
                  {availableTargetJobTitles.map(
                    (job) => (
                      <MenuItem
                        key={job.jobTitleGuid}
                        value={job.jobTitleGuid}
                      >
                        {job.jobTitleName}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField sx={uiLayout.formFieldSx}
                type="date"
                label={
                  jobMoveMode === "plan"
                    ? "تاريخ الترقية المخطط"
                    : "تاريخ السريان"
                }
                value={jobMoveDate}
                onChange={(event) =>
                  setJobMoveDate(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Box>

            {jobMoveMode !== "transfer" && (
              <FormControl sx={uiLayout.formFieldSx} fullWidth>
                <InputLabel>نوع الإجراء</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="نوع الإجراء"
                  value={jobMoveMode}
                  onChange={(event) =>
                    setJobMoveMode(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="promotion">
                    ترقية وتنفيذ الآن
                  </MenuItem>
                  <MenuItem value="plan">
                    إضافة لخطة الترقيات
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label={
                jobMoveMode === "plan"
                  ? "سبب خطة الترقية"
                  : "سبب الإجراء"
              }
              value={jobMoveReason}
              onChange={(event) =>
                setJobMoveReason(
                  event.target.value
                )
              }
              multiline
              minRows={2}
              required
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="ملاحظات"
              value={jobMoveNotes}
              onChange={(event) =>
                setJobMoveNotes(
                  event.target.value
                )
              }
              multiline
              minRows={2}
            />

            {jobMoveMode === "promotion" && (
              <Button
                variant="text"
                startIcon={<EventNoteRoundedIcon />}
                onClick={() =>
                  setJobMoveMode("plan")
                }
                sx={uiLayout.withUiSx({
                  alignSelf: "flex-start",
                  fontWeight: 900
                }, uiLayout.buttonSx)}
              >
                بدل التنفيذ الآن، أضفها لخطة الترقيات
              </Button>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setJobMoveOpen(false)
            }
            disabled={jobMoveSaving}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={saveJobMove}
            disabled={jobMoveSaving}
            sx={uiLayout.withUiSx({
              bgcolor: primary,
              "&:hover": {
                bgcolor: primaryDark
              }
            }, uiLayout.buttonSx)}
          >
            {jobMoveSaving
              ? "جاري الحفظ..."
              : jobMoveMode === "plan"
                ? "إضافة للخطة"
                : jobMoveMode === "promotion"
                  ? "تنفيذ الترقية"
                  : "نقل الموظف"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          Promotion plans dialog
          ======================================================= */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={promotionPlansOpen}
        onClose={() =>
          setPromotionPlansOpen(false)
        }
        fullWidth
        maxWidth="lg"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1
            }}
          >
            <Box>
              <Typography fontWeight={950}>
                خطة الترقيات
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: 12 }}
              >
                الترقيات المخططة ومتابعة تنفيذها
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setPromotionPlansOpen(false)
              }
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(260px,1fr) 180px"
              },
              gap: 1,
              mb: 1.2
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              size="small"
              value={promotionPlansSearch}
              onChange={(event) =>
                setPromotionPlansSearch(
                  event.target.value
                )
              }
              placeholder="بحث باسم الموظف أو المسمى..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <FormControl sx={uiLayout.formFieldSx} size="small">
              <InputLabel>الحالة</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="الحالة"
                value={promotionPlansStatus}
                onChange={(event) =>
                  setPromotionPlansStatus(
                    event.target.value
                  )
                }
              >
                <MenuItem value="Pending">
                  معلقة
                </MenuItem>
                <MenuItem value="Executed">
                  تم تنفيذها
                </MenuItem>
                <MenuItem value="Cancelled">
                  ملغاة
                </MenuItem>
                <MenuItem value="all">
                  الكل
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {promotionPlansLoading ? (
            <Box
              sx={{
                py: 6,
                display: "grid",
                placeItems: "center"
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={0.8}>
              {promotionPlans.map((plan) => (
                <Paper
                  key={plan.planGuid}
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    borderColor: border
                  }}
                >
                  <Box
                    sx={uiLayout.withUiSx({
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md:
                          "minmax(180px,1fr) minmax(220px,1.3fr) 125px 120px auto"
                      },
                      gap: 1,
                      alignItems: "center"
                    }, uiLayout.pageHeaderSx)}
                  >
                    <Box>
                      <Typography fontWeight={950}>
                        {plan.employeeName}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12 }}
                      >
                        كود الموظف:{" "}
                        {plan.employeeCode || "-"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        sx={{ fontSize: 12 }}
                      >
                        {plan.fromJobTitleName ||
                          "غير محدد"}
                        {"  ←  "}
                        <b>
                          {plan.toJobTitleName}
                        </b>
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12 }}
                      >
                        {plan.reason}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 800
                      }}
                    >
                      {plan.plannedDate
                        ? new Date(
                            plan.plannedDate
                          ).toLocaleDateString(
                            "ar-SA"
                          )
                        : "-"}
                    </Typography>

                    <Chip
                      size="small"
                      label={
                        plan.status === "Pending"
                          ? "معلقة"
                          : plan.status ===
                              "Executed"
                            ? "تم التنفيذ"
                            : "ملغاة"
                      }
                      color={
                        plan.status === "Pending"
                          ? "warning"
                          : plan.status ===
                              "Executed"
                            ? "success"
                            : "default"
                      }
                    />

                    {plan.status === "Pending" && (
                      <Stack sx={uiLayout.actionBarSx}
                        direction="row"
                        spacing={0.5}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            executePromotionPlan(
                              plan
                            )
                          }
                          sx={uiLayout.withUiSx({
                            bgcolor: primary,
                            whiteSpace: "nowrap"
                          }, uiLayout.buttonSx)}
                        >
                          تنفيذ
                        </Button>

                        <Button sx={uiLayout.buttonSx}
                          size="small"
                          color="error"
                          onClick={() =>
                            cancelPromotionPlan(
                              plan
                            )
                          }
                        >
                          إلغاء
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Paper>
              ))}

              {!promotionPlans.length && (
                <Alert severity="info">
                  لا توجد خطط ترقيات مطابقة.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setPromotionPlansOpen(false)
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          History dialog
          ======================================================= */}
      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={historyOpen}
        onClose={() =>
          setHistoryOpen(false)
        }
        fullWidth
        maxWidth="md"
        dir={DIALOG_DIRECTION}
      >
        <DialogTitle>
          سجل تعديلات{" "}
          {historyTitle?.jobTitleName || ""}
        </DialogTitle>

        <DialogContent dividers>
          {historyLoading ? (
            <Box
              sx={{
                py: 6,
                display: "grid",
                placeItems: "center"
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={0.8}>
              {historyRows.map((item) => (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderColor: border,
                    textAlign:
                      DIALOG_TEXT_ALIGN
                  }}
                >
                  <Typography
                    fontWeight={900}
                  >
                    {item.fieldLabel ||
                      item.fieldName ||
                      item.changeType}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 12,
                      mt: 0.4
                    }}
                  >
                    من:{" "}
                    {item.oldValue ?? "-"}
                    {"  →  "}
                    إلى:{" "}
                    {item.newValue ?? "-"}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{
                      fontSize: 12,
                      mt: 0.4
                    }}
                  >
                    بواسطة:{" "}
                    {item.changedByName ||
                      "غير محدد"}
                    {item.reason
                      ? ` • السبب: ${item.reason}`
                      : ""}
                    {item.changedAt
                      ? ` • ${new Date(
                          item.changedAt
                        ).toLocaleString(
                          "ar-SA"
                        )}`
                      : ""}
                  </Typography>
                </Paper>
              ))}

              {!historyRows.length && (
                <Alert severity="info">
                  لا يوجد سجل تعديلات بعد.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setHistoryOpen(false)
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </></NavigationShell>
  );
}
