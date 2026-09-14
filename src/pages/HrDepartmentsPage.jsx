import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
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
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddIcon from "@mui/icons-material/Add";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";


import HrOrganizationDesigner from "./components/HrOrganizationDesigner";




/* ============================================================
   الاتجاهات - عدل القيم الثلاث فقط لو احتجت
   ============================================================ */
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

const PAGE_DIRECTION = "rtl"; // اتجاه الصفحة الرئيسية
const PAGE_TEXT_ALIGN = "right"; // محاذاة نصوص الصفحة الرئيسية
const CENTER_TEXT_ALIGN = "center";

// ============================================================
// اتجاهات الديالوج مستقلة تمامًا عن الصفحة
// غيّر القيم دي فقط لو عايز تعكس الديالوجات بدون لمس الصفحة
// ============================================================
const DIALOG_DIRECTION = "rtl"; // عكس اتجاه الصفحة عندك بصريًا
const DIALOG_TEXT_ALIGN = "right";
const DIALOG_CENTER_TEXT_ALIGN = "center";

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

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";

const emptyForm = {
  departmentName: "",
  managerGuid: "",
  description: "",
  notes: "",
  isActive: true
};

const getCurrentUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.guid || user?.Guid || null;
  } catch {
    return null;
  }
};

const HrDepartmentsPage = () => {
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isPhone = useMediaQuery("(max-width:599px)");
  const isCompact = !isDesktop;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  // خيارات مدير القسم: موظفو نفس القسم فقط
  const [departmentManagers, setDepartmentManagers] = useState([]);
  const [departmentManagersLoading, setDepartmentManagersLoading] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [error, setError] = useState("");

  const [orgOpen, setOrgOpen] = useState(false);
  const [orgTab, setOrgTab] = useState(0);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgLookups, setOrgLookups] = useState({
    branches: [], departments: [], jobTitles: [], employees: []
  });
  const [orgAssignments, setOrgAssignments] = useState([]);
  const [orgRules, setOrgRules] = useState([]);
  const [orgAssignmentForm, setOrgAssignmentForm] = useState({
    scopeType: 1, scopeGuid: "", managerUserGuid: "",
    managerKind: "BRANCH_SUPERVISOR", priority: 10,
    isPrimary: false, canApproveLeaves: true, notes: ""
  });
  const [orgRuleForm, setOrgRuleForm] = useState({
    ruleName: "", sourceLegacyJobCode: "", sourceDepartmentGuid: "",
    managerSourceType: "BRANCH_MANAGERS", targetDepartmentGuid: "",
    priority: 100, isActive: true, notes: ""
  });
  const [orgPreviewEmployeeGuid, setOrgPreviewEmployeeGuid] = useState("");
  const [orgPreview, setOrgPreview] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    isActive: ""
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    isActive: ""
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [employeesDepartment, setEmployeesDepartment] = useState(null);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // نقل الموظفين بين الأقسام
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeGuids, setSelectedEmployeeGuids] = useState([]);
  const [transferTargetGuid, setTransferTargetGuid] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferringEmployees, setTransferringEmployees] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  // منع تعطيل قسم به موظفون نشطون
  const [deactivateBlockedOpen, setDeactivateBlockedOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDepartment, setHistoryDepartment] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (appliedFilters.search.trim()) {
        params.set("search", appliedFilters.search.trim());
      }

      if (appliedFilters.isActive !== "") {
        params.set("isActive", String(appliedFilters.isActive));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments${
          params.toString() ? `?${params}` : ""
        }`,
        {
          headers: { Accept: "application/json" }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر تحميل الأقسام");
      }

      setDepartments(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setDepartments([]);
      setError(err?.message || "حدث خطأ أثناء تحميل الأقسام");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  const loadLookups = useCallback(async () => {
    try {
      setLookupsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/lookups`,
        { headers: { Accept: "application/json" } }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر تحميل القوائم");
      }

      setManagers(
        Array.isArray(result?.data?.managers)
          ? result.data.managers
          : []
      );
    } catch (err) {
      console.error("Department lookups error:", err);
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d?.isActive === true).length;
    const inactive = total - active;
    const employees = departments.reduce(
      (sum, d) => sum + Number(d?.employeeCount || 0),
      0
    );

    return { total, active, inactive, employees };
  }, [departments]);

  const filteredDepartmentEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();

    if (!q) return departmentEmployees;

    return departmentEmployees.filter((employee) => {
      const values = [
        employee?.fullName,
        employee?.employeeCode,
        employee?.mobile,
        employee?.email,
        employee?.jobTitle
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(q)
      );
    });
  }, [departmentEmployees, employeeSearch]);

  const transferTargetDepartment = useMemo(
    () =>
      departments.find(
        (department) =>
          String(department?.departmentGuid || "").toLowerCase() ===
          String(transferTargetGuid || "").toLowerCase()
      ) || null,
    [departments, transferTargetGuid]
  );

  const loadDepartmentManagers = useCallback(
    async (departmentGuid, currentManagerGuid = "") => {
      if (!departmentGuid) {
        setDepartmentManagers([]);
        return;
      }

      try {
        setDepartmentManagersLoading(true);
        setDepartmentManagers([]);

        const response = await fetch(
          `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(
            departmentGuid
          )}/employees`,
          { headers: { Accept: "application/json" } }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "تعذر تحميل موظفي القسم"
          );
        }

        const employees = Array.isArray(result?.data)
          ? result.data
          : [];

        const currentGuid = String(currentManagerGuid || "")
          .trim()
          .toLowerCase();

        const options = employees
          .filter((employee) => {
            const guid = String(
              employee?.employeeGuid ||
              employee?.guid ||
              ""
            )
              .trim()
              .toLowerCase();

            return employee?.isActive === true || guid === currentGuid;
          })
          .sort((a, b) =>
            String(a?.fullName || "").localeCompare(
              String(b?.fullName || ""),
              "ar"
            )
          );

        setDepartmentManagers(options);
      } catch (err) {
        console.error("Department managers error:", err);
        setDepartmentManagers([]);
        setFormError(
          err?.message || "حدث خطأ أثناء تحميل موظفي القسم"
        );
      } finally {
        setDepartmentManagersLoading(false);
      }
    },
    []
  );

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setDepartmentManagers([]);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEditDialog = async (department) => {
    setEditingDepartment(department);
    setDepartmentManagers([]);
    setForm({
      departmentName: department?.departmentName || "",
      managerGuid: department?.managerGuid || "",
      description: department?.description || "",
      notes: department?.notes || "",
      isActive: department?.isActive === true
    });
    setFormError("");
    setFormOpen(true);

    await loadDepartmentManagers(
      department?.departmentGuid,
      department?.managerGuid
    );
  };

  const saveDepartment = async () => {
    if (!form.departmentName.trim()) {
      setFormError("اسم القسم مطلوب");
      return;
    }

    if (
      editingDepartment?.departmentGuid &&
      editingDepartment?.isActive === true &&
      form.isActive === false &&
      Number(editingDepartment?.activeEmployeeCount || 0) > 0
    ) {
      setDeactivateBlockedOpen(true);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        departmentName: form.departmentName.trim(),
        managerGuid: form.managerGuid || null,
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        isActive: form.isActive === true,
        changedByUserGuid: getCurrentUserGuid()
      };

      const isEdit = !!editingDepartment?.departmentGuid;
      const url = isEdit
        ? `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(
            editingDepartment.departmentGuid
          )}`
        : `${API_BASE_URL}/api/hr/departments`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر حفظ القسم");
      }

      setFormOpen(false);
      await loadDepartments();
    } catch (err) {
      setFormError(err?.message || "حدث خطأ أثناء حفظ القسم");
    } finally {
      setSaving(false);
    }
  };

  const openEmployees = async (department) => {
    try {
      setEmployeesDepartment(department);
      setEmployeesOpen(true);
      setEmployeesLoading(true);
      setDepartmentEmployees([]);
      setEmployeeSearch("");
      setSelectedEmployeeGuids([]);
      setTransferTargetGuid("");
      setTransferError("");

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(
          department.departmentGuid
        )}/employees`,
        { headers: { Accept: "application/json" } }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل الموظفين");

      setDepartmentEmployees(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.message || "حدث خطأ أثناء تحميل موظفي القسم");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeGuid) => {
    const guid = String(employeeGuid || "");
    if (!guid) return;

    setSelectedEmployeeGuids((current) =>
      current.includes(guid)
        ? current.filter((item) => item !== guid)
        : [...current, guid]
    );
  };

  const toggleSelectAllVisibleEmployees = () => {
    const visibleGuids = filteredDepartmentEmployees
      .map((employee) => String(employee?.employeeGuid || ""))
      .filter(Boolean);

    const allSelected =
      visibleGuids.length > 0 &&
      visibleGuids.every((guid) =>
        selectedEmployeeGuids.includes(guid)
      );

    if (allSelected) {
      setSelectedEmployeeGuids((current) =>
        current.filter((guid) => !visibleGuids.includes(guid))
      );
      return;
    }

    setSelectedEmployeeGuids((current) =>
      Array.from(new Set([...current, ...visibleGuids]))
    );
  };

  const requestTransferEmployees = () => {
    setTransferError("");

    if (selectedEmployeeGuids.length === 0) {
      setTransferError("حدد موظفًا واحدًا على الأقل للنقل");
      return;
    }

    if (!transferTargetGuid) {
      setTransferError("اختر القسم المنقول إليه");
      return;
    }

    if (
      String(transferTargetGuid).toLowerCase() ===
      String(employeesDepartment?.departmentGuid || "").toLowerCase()
    ) {
      setTransferError("القسم الجديد يجب أن يكون مختلفًا عن القسم الحالي");
      return;
    }

    setTransferConfirmOpen(true);
  };

  const executeTransferEmployees = async () => {
    try {
      setTransferringEmployees(true);
      setTransferError("");

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/transfer-employees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            employeeGuids: selectedEmployeeGuids,
            targetDepartmentGuid: transferTargetGuid,
            changedByUserGuid: getCurrentUserGuid()
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر نقل الموظفين"
        );
      }

      setTransferConfirmOpen(false);

      const currentDepartment = employeesDepartment;

      await loadDepartments();

      if (currentDepartment?.departmentGuid) {
        await openEmployees(currentDepartment);
      }
    } catch (err) {
      setTransferConfirmOpen(false);
      setTransferError(
        err?.message || "حدث خطأ أثناء نقل الموظفين"
      );
    } finally {
      setTransferringEmployees(false);
    }
  };

  const openHistory = async (department) => {
    try {
      setHistoryDepartment(department);
      setHistoryOpen(true);
      setHistoryLoading(true);
      setHistory([]);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(
          department.departmentGuid
        )}/history`,
        { headers: { Accept: "application/json" } }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل السجل");

      setHistory(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.message || "حدث خطأ أثناء تحميل سجل القسم");
    } finally {
      setHistoryLoading(false);
    }
  };

  const syncLeaveRoutesWithHierarchy = useCallback(async () => {
    const actor = getCurrentUserGuid();

    if (!actor) return null;

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/workflow/sync-active`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Guid": actor
          },
          body: JSON.stringify({
            actorUserGuid: actor,
            actorName:
              currentUser?.fullName ||
              currentUser?.FullName ||
              currentUser?.userName ||
              "تحديث الهيكل الإداري"
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.warn(
          "Leave route hierarchy sync failed:",
          result?.message || result?.error
        );
        return null;
      }

      return result;
    } catch (syncError) {
      console.warn(
        "Leave route hierarchy sync failed:",
        syncError
      );
      return null;
    }
  }, []);

  const loadOrgStructure = useCallback(async () => {
    try {
      setOrgLoading(true);
      setError("");

      const actor = getCurrentUserGuid();

      const requestOptions = {
        cache: "no-store",
        headers: actor
          ? { "X-User-Guid": actor }
          : {}
      };

      const [lookupsResponse, assignmentsResponse, rulesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/hr/org/lookups`, requestOptions),
          fetch(`${API_BASE_URL}/api/hr/org/assignments`, requestOptions),
          fetch(`${API_BASE_URL}/api/hr/org/rules`, requestOptions)
        ]);

      const [lookups, assignments, rules] = await Promise.all([
        lookupsResponse.json().catch(() => null),
        assignmentsResponse.json().catch(() => null),
        rulesResponse.json().catch(() => null)
      ]);

      const getApiError = (payload, fallback) => {
        const message = payload?.message || fallback;
        const detail = payload?.error || payload?.detail || "";

        return detail
          ? `${message} — ${detail}`
          : message;
      };

      if (!lookupsResponse.ok) {
        throw new Error(
          getApiError(
            lookups,
            "تعذر تحميل إعدادات الهيكل الإداري"
          )
        );
      }

      if (!assignmentsResponse.ok) {
        throw new Error(
          getApiError(
            assignments,
            "تعذر تحميل مديري الهيكل"
          )
        );
      }

      if (!rulesResponse.ok) {
        throw new Error(
          getApiError(
            rules,
            "تعذر تحميل قواعد المدير المباشر"
          )
        );
      }

      setOrgLookups({
        branches: Array.isArray(lookups?.branches)
          ? lookups.branches
          : [],
        departments: Array.isArray(lookups?.departments)
          ? lookups.departments
          : [],
        jobTitles: Array.isArray(lookups?.jobTitles)
          ? lookups.jobTitles
          : [],
        employees: Array.isArray(lookups?.employees)
          ? lookups.employees
          : []
      });

      setOrgAssignments(
        Array.isArray(assignments?.data)
          ? assignments.data
          : []
      );

      setOrgRules(
        Array.isArray(rules?.data)
          ? rules.data
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
        "تعذر تحميل الهيكل الإداري"
      );
    } finally {
      setOrgLoading(false);
    }
  }, []);

  const openOrgStructure = async () => {
    setOrgOpen(true);
    await loadOrgStructure();
  };

  const saveOrgAssignment = async () => {
    if (!orgAssignmentForm.scopeGuid || !orgAssignmentForm.managerUserGuid) {
      setError("اختر الفرع/القسم والمدير");
      return;
    }
    try {
      setOrgLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/hr/org/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orgAssignmentForm,
          scopeType: Number(orgAssignmentForm.scopeType),
          priority: Number(orgAssignmentForm.priority || 100),
          actorUserGuid: getCurrentUserGuid()
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر حفظ المدير");
      setOrgAssignmentForm((c) => ({ ...c, managerUserGuid: "", notes: "" }));
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر حفظ المدير");
    } finally {
      setOrgLoading(false);
    }
  };

  const removeOrgAssignment = async (guid) => {
    try {
      setOrgLoading(true);
      const actor = getCurrentUserGuid() || "";
      const response = await fetch(
        `${API_BASE_URL}/api/hr/org/assignments/${encodeURIComponent(guid)}?actorUserGuid=${encodeURIComponent(actor)}`,
        { method: "DELETE" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر إيقاف المدير");
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر إيقاف المدير");
    } finally {
      setOrgLoading(false);
    }
  };

  const saveOrgRule = async () => {
    if (!orgRuleForm.ruleName.trim()) {
      setError("اسم قاعدة المدير المباشر مطلوب");
      return;
    }
    try {
      setOrgLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/hr/org/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orgRuleForm,
          sourceLegacyJobCode: orgRuleForm.sourceLegacyJobCode === ""
            ? null : Number(orgRuleForm.sourceLegacyJobCode),
          sourceDepartmentGuid: orgRuleForm.sourceDepartmentGuid || null,
          targetDepartmentGuid: orgRuleForm.targetDepartmentGuid || null,
          priority: Number(orgRuleForm.priority || 100),
          actorUserGuid: getCurrentUserGuid()
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر حفظ القاعدة");
      setOrgRuleForm({
        ruleName: "", sourceLegacyJobCode: "", sourceDepartmentGuid: "",
        managerSourceType: "BRANCH_MANAGERS", targetDepartmentGuid: "",
        priority: 100, isActive: true, notes: ""
      });
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر حفظ القاعدة");
    } finally {
      setOrgLoading(false);
    }
  };

  const removeOrgRule = async (guid) => {
    try {
      setOrgLoading(true);
      const actor = getCurrentUserGuid() || "";
      const response = await fetch(
        `${API_BASE_URL}/api/hr/org/rules/${encodeURIComponent(guid)}?actorUserGuid=${encodeURIComponent(actor)}`,
        { method: "DELETE" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر إيقاف القاعدة");
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر إيقاف القاعدة");
    } finally {
      setOrgLoading(false);
    }
  };

  const previewOrgManager = async () => {
    if (!orgPreviewEmployeeGuid) return;
    try {
      setOrgLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/hr/org/manager-chain/${encodeURIComponent(orgPreviewEmployeeGuid)}`,
        { cache: "no-store" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر تحديد المدير المباشر");
      setOrgPreview(result);
    } catch (err) {
      setError(err?.message || "تعذر تحديد المدير المباشر");
      setOrgPreview(null);
    } finally {
      setOrgLoading(false);
    }
  };

  const applyFilters = () => setAppliedFilters({ ...filters });

  const clearFilters = () => {
    const empty = { search: "", isActive: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const renderMobileDepartment = (department) => (
    <Paper
      key={department?.departmentGuid}
      elevation={0}
      sx={{
        p: { xs: 1, sm: 1.2 },
        borderRadius: 2.6,
        border: "1px solid rgba(5,117,70,.10)",
        background: "#fff"
      }}
    >
      <Stack spacing={0.8}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="center"
                      sx={{ direction: DIALOG_DIRECTION }}
                    >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: primaryLight,
                color: primaryColor
              }}
            >
              <BusinessCenterIcon sx={{ fontSize: 20 }} />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: { xs: ".78rem", sm: ".9rem" },
                  textAlign: PAGE_TEXT_ALIGN
                }}
              >
                {department?.departmentName || "بدون اسم"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#748078",
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  textAlign: PAGE_TEXT_ALIGN
                }}
              >
                مدير القسم: {department?.managerName || "غير محدد"}
              </Typography>
            </Box>
          </Stack>

          <Chip
            size="small"
            label={department?.isActive ? "نشط" : "غير نشط"}
            color={department?.isActive ? "success" : "default"}
            sx={{ fontFamily: "Cairo", fontWeight: 900 }}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 0.55
          }}
        >
          <MiniStat label="الموظفون" value={department?.employeeCount || 0} />
          <MiniStat label="النشطون" value={department?.activeEmployeeCount || 0} />
          <MiniStat label="غير النشطين" value={department?.inactiveEmployeeCount || 0} />
          <MiniStat label="المسميات" value={department?.jobTitleCount || 0} />
        </Box>

        <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.5}>
          <Button
            size="small"
            fullWidth
            variant="outlined"
            startIcon={<GroupsIcon />}
            onClick={() => openEmployees(department)}
            sx={uiLayout.withUiSx(buttonSx, uiLayout.buttonSx)}
          >
            الموظفون
          </Button>
          <Button
            size="small"
            fullWidth
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => openEditDialog(department)}
            sx={uiLayout.withUiSx(buttonSx, uiLayout.buttonSx)}
          >
            تعديل
          </Button>
          <IconButton
            size="small"
            onClick={() => openHistory(department)}
            sx={{ color: primaryColor, bgcolor: primaryLight }}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box
      dir={PAGE_DIRECTION}
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background: "linear-gradient(180deg,#f7fbf9 0%,#ffffff 100%)",
        fontFamily: "Cairo, Arial, sans-serif",
        textAlign: PAGE_TEXT_ALIGN
      }}
    >
      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: 1250,
            height: { xs: 50, sm: 56 },
            justifyContent: "center",
            bgcolor: "#fff",
            color: primaryDark,
            borderBottom: "1px solid rgba(5,117,70,.12)"
          }}
        >
          <Toolbar
            disableGutters
            sx={{ minHeight: { xs: "var(--app-header-height, 56px)", sm: "var(--app-header-height, 56px)" }, px: 1 }}
          >
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              sx={{
                width: 36,
                height: 36,
                color: "#fff",
                background: `linear-gradient(135deg,${primaryColor},${primaryDark})`
              }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: { xs: ".78rem", sm: ".9rem" },
                textAlign: PAGE_TEXT_ALIGN
              }}
            >
              الموارد البشرية - الأقسام
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <PageContainer
        component="main"
        sx={{
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          minWidth: 0,
          
          
          boxSizing: "border-box",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            px: 1.5,
            py: 1.5
          },
          ...navigationContentSx
        }}
      >
        <Stack spacing={{ xs: 1, sm: 1.3, md: 1.6 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.2, sm: 1.5, md: 2 },
              borderRadius: 3.5,
              color: "#fff",
              background: `linear-gradient(135deg,${primaryColor},${primaryDark})`
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: { xs: "1rem", md: "1.35rem" } }}>
                  إدارة الأقسام
                </Typography>
                <Typography sx={{ mt: 0.25, opacity: 0.9, fontFamily: "Cairo", fontSize: { xs: "0.75rem", md: ".82rem" } }}>
                  إدارة هيكل الأقسام ومديريها ومتابعة الموظفين بدون المساس ببيانات النظام القديمة
                </Typography>
              </Box>

              <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.6}>
                <Tooltip title="تحديث">
                  <IconButton
                    onClick={() => {
                      loadDepartments();
                      loadLookups();
                    }}
                    sx={{ color: "#fff", bgcolor: "rgba(255,255,255,.12)" }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<AccountTreeRoundedIcon />}
                  onClick={openOrgStructure}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo", fontWeight: 900,
                    borderColor: "rgba(255,255,255,.75)", color: "#fff",
                    "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,.10)" }
                  }, uiLayout.buttonSx)}
                >
                  الهيكل الإداري
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateDialog}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    bgcolor: "#fff",
                    color: primaryDark,
                    "&:hover": { bgcolor: "#f2f7f4" }
                  }, uiLayout.buttonSx)}
                >
                  إضافة قسم
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(4,minmax(0,1fr))"
              },
              gap: { xs: 0.6, sm: 0.9 }
            }}
          >
            <StatCard title="إجمالي الأقسام" value={stats.total} icon={<AccountTreeIcon />} />
            <StatCard title="الأقسام النشطة" value={stats.active} icon={<CheckCircleIcon />} />
            <StatCard title="غير النشطة" value={stats.inactive} icon={<BusinessCenterIcon />} />
            <StatCard title="الموظفون داخل الأقسام" value={stats.employees} icon={<GroupsIcon />} />
          </Box>

          <Paper elevation={0} sx={sectionSx}>
            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1fr auto auto" },
                gap: 0.8,
                alignItems: "center"
              }, uiLayout.filterBarSx)}
            >
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                size="small"
                label="بحث"
                placeholder="اسم القسم أو الكود أو المدير"
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: primaryColor }} />
                    </InputAdornment>
                  )
                }}
              />

              <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الحالة"
                  value={filters.isActive}
                  onChange={(e) => setFilters((p) => ({ ...p, isActive: e.target.value }))}
                >
                  <MenuItem value="">كل الحالات</MenuItem>
                  <MenuItem value={true}>نشط</MenuItem>
                  <MenuItem value={false}>غير نشط</MenuItem>
                </Select>
              </FormControl>

              <Button variant="contained" onClick={applyFilters} startIcon={<SearchIcon />} sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}>
                تطبيق
              </Button>
              <Button variant="outlined" onClick={clearFilters} sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}>
                مسح
              </Button>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...sectionSx, p: 0, overflow: "hidden" }}>
            <Box sx={{ p: { xs: 1, sm: 1.3 }, borderBottom: "1px solid rgba(5,117,70,.10)" }}>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark }}>
                قائمة الأقسام
              </Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#7a8580" }}>
                عدد النتائج: {departments.length}
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ py: 7, display: "grid", placeItems: "center" }}>
                <CircularProgress sx={{ color: primaryColor }} />
              </Box>
            ) : departments.length === 0 ? (
              <Box sx={{ py: 7, textAlign: CENTER_TEXT_ALIGN }}>
                <Typography sx={{ fontFamily: "Cairo", fontWeight: 800 }}>لا توجد أقسام</Typography>
              </Box>
            ) : isCompact ? (
              <Box
                sx={{
                  p: 0.7,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" },
                  gap: 0.65
                }}
              >
                {departments.map(renderMobileDepartment)}
              </Box>
            ) : (
              <TableContainer sx={uiLayout.tableContainerSx}>
                <Table size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      {["الكود", "القسم", "مدير القسم", "الموظفون", "المسميات", "نشط", "غير نشط", "الحالة", "الإجراءات"].map((h) => (
                        <TableCell key={h} align="right" sx={headCellSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((department) => (
                      <TableRow key={department?.departmentGuid} hover>
                        <TableCell align="center">{department?.departmentCode ?? "-"}</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: ".78rem" }}>
                            {department?.departmentName || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{department?.managerName || "غير محدد"}</TableCell>
                        <TableCell align="center">{department?.employeeCount || 0}</TableCell>
                        <TableCell align="center">{department?.jobTitleCount || 0}</TableCell>
                        <TableCell align="center">{department?.activeEmployeeCount || 0}</TableCell>
                        <TableCell align="center">{department?.inactiveEmployeeCount || 0}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={department?.isActive ? "نشط" : "غير نشط"}
                            color={department?.isActive ? "success" : "default"}
                            sx={{ fontFamily: "Cairo", fontWeight: 900 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.4} justifyContent="center">
                            <Tooltip title="موظفو القسم">
                              <IconButton size="small" onClick={() => openEmployees(department)} sx={actionIconSx}>
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="تعديل">
                              <IconButton size="small" onClick={() => openEditDialog(department)} sx={actionIconSx}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="سجل التعديلات">
                              <IconButton size="small" onClick={() => openHistory(department)} sx={actionIconSx}>
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      </PageContainer>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={formOpen}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setDepartmentManagers([]);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid rgba(5,117,70,.10)",
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ direction: DIALOG_DIRECTION }}
          >
            <Box sx={{ textAlign: DIALOG_TEXT_ALIGN }}>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, textAlign: DIALOG_TEXT_ALIGN }}>
                {editingDepartment ? "تعديل القسم" : "إضافة قسم جديد"}
              </Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#7a8580" }}>
                لا يتم تعديل ID أو Code أو Guid القديمة
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setFormOpen(false);
                setDepartmentManagers([]);
              }}
              disabled={saving}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            pt: "16px !important",
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN,

            "& .MuiInputBase-root": {
              direction: DIALOG_DIRECTION,
              textAlign: DIALOG_TEXT_ALIGN
            },

            "& .MuiInputBase-input": {
              direction: DIALOG_DIRECTION,
              textAlign: DIALOG_TEXT_ALIGN
            },

            "& textarea": {
              direction: DIALOG_DIRECTION,
              textAlign: DIALOG_TEXT_ALIGN
            },

            "& .MuiInputLabel-root": {
              direction: DIALOG_DIRECTION,
              textAlign: DIALOG_TEXT_ALIGN,
              transformOrigin:
                DIALOG_TEXT_ALIGN === "right"
                  ? "top right"
                  : "top left"
            },

            "& .MuiSelect-select": {
              direction: DIALOG_DIRECTION,
              textAlign: DIALOG_TEXT_ALIGN
            }
          }}
        >
          <Stack sx={uiLayout.formGridSx} spacing={1.1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="اسم القسم"
              fullWidth
              value={form.departmentName}
              onChange={(e) => setForm((p) => ({ ...p, departmentName: e.target.value }))}
            />

            <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
              fullWidth
              options={departmentManagers}
              loading={departmentManagersLoading}
              disabled={!editingDepartment}
              value={
                departmentManagers.find((employee) => {
                  const optionGuid = String(
                    employee?.employeeGuid ||
                    employee?.guid ||
                    ""
                  )
                    .trim()
                    .toLowerCase();

                  return (
                    optionGuid ===
                    String(form.managerGuid || "")
                      .trim()
                      .toLowerCase()
                  );
                }) || null
              }
              onChange={(_, employee) => {
                setForm((current) => ({
                  ...current,
                  managerGuid:
                    employee?.employeeGuid ||
                    employee?.guid ||
                    ""
                }));
              }}
              isOptionEqualToValue={(option, value) => {
                const optionGuid = String(
                  option?.employeeGuid ||
                  option?.guid ||
                  ""
                )
                  .trim()
                  .toLowerCase();

                const valueGuid = String(
                  value?.employeeGuid ||
                  value?.guid ||
                  ""
                )
                  .trim()
                  .toLowerCase();

                return optionGuid === valueGuid;
              }}
              getOptionLabel={(employee) => {
                const name =
                  employee?.fullName ||
                  employee?.name ||
                  "غير محدد";

                const jobTitle =
                  employee?.jobTitle || "";

                return jobTitle
                  ? `${name} - ${jobTitle}`
                  : name;
              }}
              noOptionsText="لا يوجد موظفون مطابقون داخل القسم"
              loadingText="جاري تحميل موظفي القسم..."
              clearText="مسح"
              openText="فتح"
              closeText="إغلاق"
              renderOption={(props, employee) => (
                <Box
                  component="li"
                  {...props}
                  key={
                    employee?.employeeGuid ||
                    employee?.guid
                  }
                  sx={{
                    display: "flex !important",
                    alignItems: "center",
                    gap: 1,
                    direction: DIALOG_DIRECTION,
                    textAlign: DIALOG_TEXT_ALIGN,
                    fontFamily: "Cairo"
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: primaryLight,
                      color: primaryColor,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: ".75rem"
                    }}
                  >
                    {String(
                      employee?.fullName ||
                      employee?.name ||
                      "م"
                    )
                      .trim()
                      .charAt(0)}
                  </Avatar>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      textAlign: DIALOG_TEXT_ALIGN
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        fontSize: "0.75rem"
                      }}
                    >
                      {employee?.fullName ||
                        employee?.name ||
                        "غير محدد"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.15,
                        fontFamily: "Cairo",
                        color: "#748078",
                        fontSize: "0.75rem"
                      }}
                    >
                      {employee?.jobTitle || "غير محدد"}
                      {employee?.isActive === false
                        ? " - غير نشط"
                        : ""}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField InputLabelProps={{ shrink: true }}
                  {...params}
                  label="مدير القسم"
                  placeholder={
                    editingDepartment
                      ? "اكتب اسم الموظف للبحث داخل القسم"
                      : "احفظ القسم أولاً ثم عيّن المدير"
                  }
                  helperText={
                    editingDepartment
                      ? "البحث يتم داخل موظفي هذا القسم فقط"
                      : "بعد إنشاء القسم وإضافة الموظفين إليه يمكنك تعيين مدير القسم"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {departmentManagersLoading ? (
                          <CircularProgress
                            color="inherit"
                            size={18}
                          />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                  sx={uiLayout.withUiSx({
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Cairo",
                      textAlign: DIALOG_TEXT_ALIGN
                    }
                  }, uiLayout.formFieldSx)}
                />
              )}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="وصف القسم"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="ملاحظات"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />

            {editingDepartment && (
              <FormControl sx={uiLayout.formFieldSx} fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الحالة"
                  value={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value }))}
                >
                  <MenuItem value={true}>نشط</MenuItem>
                  <MenuItem value={false}>غير نشط</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            p: 1.5,
            direction: DIALOG_DIRECTION,
            justifyContent:
              DIALOG_TEXT_ALIGN === "right"
                ? "flex-end"
                : "flex-start"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={() => {
              setFormOpen(false);
              setDepartmentManagers([]);
            }}
            disabled={saving}
            sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button onClick={saveDepartment} disabled={saving} variant="contained" sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}>
            {saving ? <CircularProgress size={20} color="inherit" /> : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={employeesOpen}
        onClose={() => setEmployeesOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ direction: DIALOG_DIRECTION }}
          >
            <Box sx={{ textAlign: DIALOG_TEXT_ALIGN }}>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, textAlign: DIALOG_TEXT_ALIGN }}>
                موظفو {employeesDepartment?.departmentName || "القسم"}
              </Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#7a8580" }}>
                {departmentEmployees.length} موظف
              </Typography>
            </Box>
            <IconButton onClick={() => setEmployeesOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          {employeesLoading ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : departmentEmployees.length === 0 ? (
            <Typography sx={{ py: 5, textAlign: DIALOG_CENTER_TEXT_ALIGN, fontFamily: "Cairo" }}>
              لا يوجد موظفون في هذا القسم
            </Typography>
          ) : (
            <Stack spacing={1}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 2.2,
                  bgcolor: "#f8fbf9",
                  border: "1px solid rgba(5,117,70,.10)"
                }}
              >
                <Box
                  sx={uiLayout.withUiSx({
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "minmax(220px,1.5fr) minmax(200px,1fr) auto"
                    },
                    gap: 0.7,
                    alignItems: "center"
                  }, uiLayout.filterBarSx)}
                >
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    size="small"
                    label="بحث داخل موظفي القسم"
                    placeholder="الاسم، الكود، الجوال أو المسمى"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: primaryColor }} />
                        </InputAdornment>
                      )
                    }}
                  />

                  <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                    <InputLabel>نقل إلى قسم</InputLabel>
                    <Select
                  MenuProps={RTL_MENU_PROPS}
                      label="نقل إلى قسم"
                      value={transferTargetGuid}
                      onChange={(event) => {
                        setTransferTargetGuid(event.target.value);
                        setTransferError("");
                      }}
                    >
                      <MenuItem value="">اختر القسم</MenuItem>
                      {departments
                        .filter(
                          (department) =>
                            department?.isActive === true &&
                            String(department?.departmentGuid || "").toLowerCase() !==
                              String(employeesDepartment?.departmentGuid || "").toLowerCase()
                        )
                        .map((department) => (
                          <MenuItem
                            key={department?.departmentGuid}
                            value={department?.departmentGuid || ""}
                          >
                            {department?.departmentName || "غير محدد"}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<SwapHorizIcon />}
                    onClick={requestTransferEmployees}
                    disabled={
                      transferringEmployees ||
                      selectedEmployeeGuids.length === 0
                    }
                    sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}
                  >
                    نقل المحددين ({selectedEmployeeGuids.length})
                  </Button>
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{ mt: 0.7 }}
                >
                  <Checkbox
                    size="small"
                    checked={
                      filteredDepartmentEmployees.length > 0 &&
                      filteredDepartmentEmployees.every((employee) =>
                        selectedEmployeeGuids.includes(
                          String(employee?.employeeGuid || "")
                        )
                      )
                    }
                    indeterminate={
                      filteredDepartmentEmployees.some((employee) =>
                        selectedEmployeeGuids.includes(
                          String(employee?.employeeGuid || "")
                        )
                      ) &&
                      !filteredDepartmentEmployees.every((employee) =>
                        selectedEmployeeGuids.includes(
                          String(employee?.employeeGuid || "")
                        )
                      )
                    }
                    onChange={toggleSelectAllVisibleEmployees}
                    sx={{ color: primaryColor }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontSize: "0.75rem",
                      color: "#66756e",
                      textAlign: DIALOG_TEXT_ALIGN
                    }}
                  >
                    تحديد كل النتائج الظاهرة ({filteredDepartmentEmployees.length})
                  </Typography>
                </Stack>

                {transferError && (
                  <Alert severity="error" sx={{ mt: 0.7 }}>
                    {transferError}
                  </Alert>
                )}
              </Paper>

              {filteredDepartmentEmployees.length === 0 ? (
                <Typography
                  sx={{
                    py: 4,
                    textAlign: DIALOG_CENTER_TEXT_ALIGN,
                    fontFamily: "Cairo"
                  }}
                >
                  لا توجد نتائج مطابقة للبحث
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2,minmax(0,1fr))"
                    },
                    gap: 0.7
                  }}
                >
                  {filteredDepartmentEmployees.map((employee) => {
                    const employeeGuid = String(
                      employee?.employeeGuid || ""
                    );
                    const selected =
                      selectedEmployeeGuids.includes(employeeGuid);

                    return (
                      <Paper
                        key={employee?.employeeGuid}
                        elevation={0}
                        onClick={() =>
                          toggleEmployeeSelection(employeeGuid)
                        }
                        sx={{
                          p: 0.8,
                          border: selected
                            ? "1px solid rgba(5,117,70,.38)"
                            : "1px solid rgba(5,117,70,.10)",
                          borderRadius: 2.2,
                          bgcolor: selected ? "#f0f9f5" : "#fff",
                          cursor: "pointer"
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.7}
                          alignItems="center"
                          sx={{ direction: DIALOG_DIRECTION }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() =>
                              toggleEmployeeSelection(employeeGuid)
                            }
                            sx={{ color: primaryColor }}
                          />

                          <Avatar sx={{ width: 36, height: 36, bgcolor: primaryLight, color: primaryColor }}>
                            {(employee?.fullName || "م").trim().charAt(0)}
                          </Avatar>

                          <Box sx={{ minWidth: 0, flex: 1, textAlign: DIALOG_TEXT_ALIGN }}>
                            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: ".75rem" }}>
                              {employee?.fullName || "بدون اسم"}
                            </Typography>
                            <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#728078" }}>
                              {employee?.jobTitle || "غير محدد"}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={employee?.isActive ? "نشط" : "غير نشط"}
                            color={employee?.isActive ? "success" : "default"}
                          />
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={transferConfirmOpen}
        onClose={() =>
          !transferringEmployees &&
          setTransferConfirmOpen(false)
        }
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={0.7} alignItems="center">
            <SwapHorizIcon sx={{ color: primaryColor }} />
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark }}>
              تأكيد نقل الموظفين
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Cairo", fontSize: ".75rem", lineHeight: 1.8, textAlign: DIALOG_TEXT_ALIGN }}>
            سيتم نقل {selectedEmployeeGuids.length} موظف من
            {` ${employeesDepartment?.departmentName || "القسم الحالي"} `}
            إلى
            {` ${transferTargetDepartment?.departmentName || "القسم المحدد"}.`}
          </Typography>
          <Alert severity="warning" sx={{ mt: 1 }}>
            سيتم تحديث القسم في User_Info مع الحفاظ على UserDepart القديم متوافقًا مع Department.ID.
          </Alert>
        </DialogContent>
        <DialogActions sx={uiLayout.withUiSx({ direction: DIALOG_DIRECTION }, uiLayout.dialogActionsSx)}>
          <Button
            onClick={() => setTransferConfirmOpen(false)}
            disabled={transferringEmployees}
            sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button
            onClick={executeTransferEmployees}
            disabled={transferringEmployees}
            variant="contained"
            sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}
          >
            {transferringEmployees ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "تأكيد النقل"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={orgOpen}
        onClose={() => setOrgOpen(false)}
        maxWidth="xl"
        fullWidth
        dir={DIALOG_DIRECTION}
        PaperProps={{ sx: {
          borderRadius: 3,
          direction: DIALOG_DIRECTION,
          textAlign: DIALOG_TEXT_ALIGN,
          minHeight: { xs: "90vh", md: "82vh" }
        }}}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 950, fontSize: 19 }}>
                الهيكل الإداري المرن
              </Typography>
              <Typography color="text.secondary" sx={{ fontFamily: "Cairo", fontSize: 12 }}>
                المصدر الموحد للرؤية الإدارية والمدير المباشر ومسارات الإجازات والأذونات
              </Typography>
            </Box>
            <IconButton onClick={() => setOrgOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <HrOrganizationDesigner />
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}><Button sx={uiLayout.buttonSx} onClick={() => setOrgOpen(false)}>إغلاق</Button></DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={deactivateBlockedOpen}
        onClose={() => setDeactivateBlockedOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={0.7} alignItems="center">
            <WarningAmberRoundedIcon sx={{ color: accentColor }} />
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark }}>
              لا يمكن تعطيل القسم الآن
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Cairo", fontSize: ".75rem", lineHeight: 1.8, textAlign: DIALOG_TEXT_ALIGN }}>
            القسم يحتوي على {editingDepartment?.activeEmployeeCount || 0} موظف نشط.
            انقل الموظفين النشطين إلى قسم آخر أولًا، وبعدها تقدر تعطّل القسم بأمان.
          </Typography>
        </DialogContent>
        <DialogActions sx={uiLayout.withUiSx({ direction: DIALOG_DIRECTION }, uiLayout.dialogActionsSx)}>
          <Button
            onClick={() => setDeactivateBlockedOpen(false)}
            sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            startIcon={<GroupsIcon />}
            onClick={() => {
              const department = editingDepartment;
              setDeactivateBlockedOpen(false);
              setFormOpen(false);
              setDepartmentManagers([]);
              if (department) openEmployees(department);
            }}
            sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}
          >
            فتح الموظفين ونقلهم
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ direction: DIALOG_DIRECTION }}
          >
            <Box sx={{ textAlign: DIALOG_TEXT_ALIGN }}>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, textAlign: DIALOG_TEXT_ALIGN }}>
                سجل تعديلات {historyDepartment?.departmentName || "القسم"}
              </Typography>
            </Box>
            <IconButton onClick={() => setHistoryOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          {historyLoading ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : history.length === 0 ? (
            <Typography sx={{ py: 5, textAlign: DIALOG_CENTER_TEXT_ALIGN, fontFamily: "Cairo" }}>
              لا توجد تعديلات مسجلة
            </Typography>
          ) : (
            <Stack spacing={0.7}>
              {history.map((item) => (
                <Paper key={item?.id} elevation={0} sx={{ p: 1, borderRadius: 2, border: "1px solid rgba(5,117,70,.09)" }}>
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: "0.75rem", color: primaryDark, textAlign: DIALOG_TEXT_ALIGN }}>
                    {item?.fieldLabel || item?.fieldName}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontFamily: "Cairo", fontSize: "0.75rem", textAlign: DIALOG_TEXT_ALIGN }}>
                    من: {item?.oldValue || "-"} ← إلى: {item?.newValue || "-"}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontFamily: "Cairo", fontSize: "0.75rem", color: "#7b8781", textAlign: DIALOG_TEXT_ALIGN }}>
                    {item?.changedByName || "مستخدم غير محدد"}
                    {item?.changedAt ? ` - ${new Date(item.changedAt).toLocaleString("ar-EG")}` : ""}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box></NavigationShell>
  );
};

const MiniStat = ({ label, value }) => (
  <Box sx={{ p: 0.55, borderRadius: 1.8, bgcolor: "#f6faf8", textAlign: CENTER_TEXT_ALIGN }}>
    <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, fontSize: "0.75rem" }}>{value}</Typography>
    <Typography sx={{ fontFamily: "Cairo", color: "#728078", fontSize: "0.75rem" }}>{label}</Typography>
  </Box>
);

const StatCard = ({ title, value, icon }) => (
  <Paper elevation={0} sx={{ p: { xs: 0.8, sm: 1.1 }, borderRadius: 2.7, border: "1px solid rgba(5,117,70,.10)" }}>
    <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
      <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: primaryLight, color: primaryColor }}>
        {icon}
      </Box>
      <Box sx={{ textAlign: CENTER_TEXT_ALIGN }}>
        <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, fontSize: { xs: ".9rem", sm: "1.05rem" } }}>{value}</Typography>
        <Typography sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: { xs: "0.75rem", sm: "0.75rem" } }}>{title}</Typography>
      </Box>
    </Stack>
  </Paper>
);

const sectionSx = {
  p: { xs: 0.9, sm: 1.2, md: 1.5 },
  borderRadius: 3,
  border: "1px solid rgba(5,117,70,.10)",
  boxShadow: "0 4px 16px rgba(5,117,70,.04)"
};

const headCellSx = {
  bgcolor: "#f6faf8",
  color: primaryDark,
  fontFamily: "Cairo",
  fontWeight: 900,
  fontSize: ".72rem",
  whiteSpace: "nowrap"
};

const actionIconSx = {
  color: primaryColor,
  bgcolor: primaryLight,
  border: "1px solid rgba(5,117,70,.10)",
  "&:hover": { bgcolor: "#d9eee5" }
};

const buttonSx = {
  fontFamily: "Cairo",
  fontWeight: 900,
  fontSize: ".6rem",
  color: primaryColor,
  borderColor: "rgba(5,117,70,.25)"
};

const primaryButtonSx = {
  fontFamily: "Cairo",
  fontWeight: 900,
  bgcolor: primaryColor,
  "&:hover": { bgcolor: primaryDark }
};

const dangerButtonSx = {
  fontFamily: "Cairo",
  fontWeight: 900,
  color: accentColor,
  borderColor: "rgba(174,30,33,.35)"
};

export default HrDepartmentsPage;