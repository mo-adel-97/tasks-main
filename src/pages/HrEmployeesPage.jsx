import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/hrLayout';
import './rtl-forms-fix.css';
import { hrChipSx, hrEmployeeFieldSx, hrTabIconSx } from "../components/hrControlStyles";
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GlobalStyles,
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
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
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BusinessIcon from "@mui/icons-material/Business";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import BadgeIcon from "@mui/icons-material/Badge";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import WorkIcon from "@mui/icons-material/Work";
import ApartmentIcon from "@mui/icons-material/Apartment";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ContactEmergencyOutlinedIcon from "@mui/icons-material/ContactEmergencyOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
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
  "https://api4.sstli.com";


const DARK_BORDER = "#67C99D";
const DARK_TEXT = "#9BE0C1";
const EMPLOYEE_IMAGE_API =
  "https://filesregsiteration.sstli.com/erp/image_api.php";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const EDUCATION_LEVEL_OPTIONS = [
  { value: 1, label: "ثانوي أو أقل" },
  { value: 2, label: "دبلوم" },
  { value: 3, label: "بكالوريوس" },
  { value: 4, label: "ماجستير" },
  { value: 5, label: "دكتوراه" },
  { value: 6, label: "زمالة / بورد" },
  { value: 7, label: "أخرى" },
  { value: 8, label: "دبلوم عالي" },
  { value: 9, label: "بدون مؤهل" }
];

const getEducationLevelName = (value) =>
  EDUCATION_LEVEL_OPTIONS.find(
    (item) => Number(item.value) === Number(value)
  )?.label || "غير محدد";

// ============================================================
// إعدادات الاتجاه والمحاذاة - غيّر من هنا فقط
// ============================================================
const PAGE_DIRECTION = "rtl"; // "rtl" أو "ltr"
const PAGE_TEXT_ALIGN = "right"; // "right" أو "left"
const CENTER_TEXT_ALIGN = "center";
const IS_RTL = PAGE_DIRECTION === "rtl";

// ============================================================
// إعدادات اتجاه ملف الموظف فقط - مستقلة تمامًا عن اتجاه الصفحة
// غيّر السطرين دول فقط لو أردت قلب Dialog الموظف بدون لمس الصفحة.
// ============================================================
const EMPLOYEE_DIALOG_DIRECTION = "rtl"; // "rtl" أو "ltr"
const EMPLOYEE_DIALOG_TEXT_ALIGN = "right"; // "right" أو "left"
const EMPLOYEE_DIALOG_IS_RTL = EMPLOYEE_DIALOG_DIRECTION === "rtl";

// تبويبا المسار الوظيفي والحضور فقط - مستقلة عن باقي اتجاه ملف الموظف.
const CAREER_TAB_DIRECTION = "rtl";
const CAREER_TAB_TEXT_ALIGN = "right";

// ============================================================
// اتجاهات تبويب الحضور فقط - مستقلة تمامًا عن ملف الموظف وباقي التبويبات
// أي تغيير في الاتجاه يتم من هنا فقط.
// ============================================================
const ATTENDANCE_TAB_DIRECTION = "rtl";
const ATTENDANCE_TAB_TEXT_ALIGN = "right";

const ATTENDANCE_FILTER_DIRECTION = "rtl";
const ATTENDANCE_FILTER_TEXT_ALIGN = "right";

const ATTENDANCE_GRID_DIRECTION = "rtl";
const ATTENDANCE_GRID_TEXT_ALIGN = "right";

const LEAVES_TAB_DIRECTION = "rtl";
const LEAVES_TAB_TEXT_ALIGN = "right";

// اتجاه التاريخ فقط داخل تبويب الحضور.
// نخليه LTR حتى يظهر: من 01-09-2026 إلى 05-09-2026 بدون قلب بصري.
const ATTENDANCE_DATE_DIRECTION = "ltr";
const ATTENDANCE_DATE_TEXT_ALIGN = "center";

// ============================================================
// هندسة حقول ملف الموظف - مشتركة بين الصفحة وكل نوافذ ملف الموظف.
// تضمن أن يكون لعنوان الحقل (label) مساحة رأسية كافية داخل الحقل
// فلا يتراكب العنوان مع نص الحقل أو مع الحقل الذي فوقه.
// ============================================================
const EMPLOYEE_PAGE_FIELD_SX = hrEmployeeFieldSx({
  height: { xs: 36, sm: 38, lg: 40 },
  inputSize: { xs: 0.68, sm: 0.73, lg: 0.82 },
  radius: 2
});

const EMPLOYEE_DIALOG_FIELD_SX = hrEmployeeFieldSx({
  height: { xs: 42, sm: 44 },
  inputSize: { xs: 0.74, sm: 0.8 },
  radius: 2
});

// مسافات شبكة الحقول في الصفحة (أعمدة ضيقة وصفوف واسعة لعنوان الحقل العائم).
const EMPLOYEE_PAGE_FIELD_GAP = {
  columnGap: { xs: .65, sm: .8, lg: 1.3 },
  rowGap: { xs: 1.5, sm: 1.6, lg: 1.8 }
};

// مسافات شبكة الحقول داخل نوافذ ملف الموظف.
const EMPLOYEE_DIALOG_FIELD_GAP = {
  columnGap: { xs: .85, sm: 1.1, lg: 1.25 },
  rowGap: { xs: 1.5, sm: 1.7, lg: 1.8 }
};

// أقل مسافة رأسية بين أي عنصرين يحتويان حقولًا داخل النوافذ.
const EMPLOYEE_DIALOG_STACK_GAP = { xs: 1.6, sm: 1.8 };
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx"
];


const normalizeResponseArray = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
};

// Keep the employee's current assignment visible even if it is no longer
// offered for new assignments. MUI Select requires an exact matching value.
const withCurrentEmployeeOption = (options, key, value, name) => {
  if (value === null || value === undefined || value === "") return options;
  const match = options.find((option) =>
    String(option?.[key] ?? "").toLowerCase() === String(value).toLowerCase()
  );
  if (match) {
    return options.map((option) => option === match ? { ...option, [key]: value } : option);
  }
  return [...options, { [key]: value, name: name || String(value) }];
};


const toLocalDateInputValue = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const currentMonthAttendanceRange = () => {
  const today = new Date();
  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  return {
    fromDate: toLocalDateInputValue(firstDay),
    toDate: toLocalDateInputValue(today)
  };
};

const previousDaysAttendanceRange = (days) => {
  const today = new Date();
  const from = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  from.setDate(from.getDate() - Math.max(0, Number(days || 1) - 1));

  return {
    fromDate: toLocalDateInputValue(from),
    toDate: toLocalDateInputValue(today)
  };
};

const formatAttendanceDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("ar-SA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const formatAttendanceTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatMinutesAsHours = (minutes) => {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (!hours) return `${rest} د`;
  if (!rest) return `${hours} س`;

  return `${hours} س ${rest} د`;
};

const HrEmployeesPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surfaces = theme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isMobile = !isDesktop;
  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const [employees, setEmployees] = useState([]);
  const [lookups, setLookups] = useState({
    branches: [],
    departments: [],
    jobs: [],
    statuses: [],
    documentTypes: [],
    genders: [],
    maritalStatuses: []
  });

  const [loading, setLoading] = useState(true);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    branchGuid: "",
    departmentGuid: "",
    jobCode: "",
    isActive: ""
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    branchGuid: "",
    departmentGuid: "",
    jobCode: "",
    isActive: ""
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [employeeCardOpen, setEmployeeCardOpen] =
    useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  const [editMode, setEditMode] = useState(false);
  const [savingEmployee, setSavingEmployee] =
    useState(false);
  const [employeeSaveError, setEmployeeSaveError] =
    useState("");
  const [employeeSaveSuccess, setEmployeeSaveSuccess] =
    useState("");

  const [editForm, setEditForm] = useState({
    fullName: "",
    nationalId: "",
    mobile: "",
    mobile2: "",
    email: "",
    iban: "",
    workType: "",
    dailyWorkingHours: "",
    branchGuid: "",
    departmentGuid: "",
    jobCode: "",
    educationLevel: "",
    specialization: "",
    isActive: true
  });

  const [profileTab, setProfileTab] = useState(0);

  const employeeEditLookups = useMemo(() => ({
    branches: withCurrentEmployeeOption(lookups.branches, "guid", selectedEmployee?.branchGuid, selectedEmployee?.branchName),
    departments: withCurrentEmployeeOption(lookups.departments, "guid", selectedEmployee?.departmentGuid, selectedEmployee?.departmentName),
    jobs: withCurrentEmployeeOption(lookups.jobs, "code", selectedEmployee?.jobCode, selectedEmployee?.jobTitle)
  }), [lookups, selectedEmployee]);

  const [profileLoading, setProfileLoading] =
    useState(false);
  const [profileSaving, setProfileSaving] =
    useState(false);
  const [profileEditMode, setProfileEditMode] =
    useState(false);
  const [profileData, setProfileData] =
    useState(null);
  const [profileForm, setProfileForm] = useState({
    birthDate: "",
    nationality: "",
    gender: "",
    maritalStatus: "",
    educationLevel: "",
    specialization: "",
    address: "",
    city: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    notes: ""
  });

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] =
    useState(false);
  const [documentUploading, setDocumentUploading] =
    useState(false);
  const [documentUploadOpen, setDocumentUploadOpen] =
    useState(false);
  const [documentForm, setDocumentForm] = useState({
    file: null,
    documentTypeCode: "",
    issueDate: "",
    expiryDate: "",
    notes: ""
  });

  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState("");
  const [documentPreviewItem, setDocumentPreviewItem] = useState(null);
  const [documentPreviewKind, setDocumentPreviewKind] = useState("document");
  const [documentPreviewError, setDocumentPreviewError] = useState("");

  const [employeeContract, setEmployeeContract] = useState(null);
  const [contractHistory, setContractHistory] = useState([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractUploading, setContractUploading] = useState(false);
  const [contractUploadOpen, setContractUploadOpen] = useState(false);
  const [contractForm, setContractForm] = useState({
    file: null,
    contractNumber: "",
    startDate: "",
    endDate: "",
    basicSalary: "",
    notes: ""
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] =
    useState(false);


  // ============================================================
  // المسار الوظيفي / الترقيات / المسميات السابقة
  // ============================================================
  const [careerData, setCareerData] = useState({
    current: null,
    history: [],
    promotionPlans: []
  });
  const [careerLoading, setCareerLoading] =
    useState(false);

  const [careerActionOpen, setCareerActionOpen] =
    useState(false);
  const [careerActionMode, setCareerActionMode] =
    useState("promotion");
  const [careerTargetJobGuid, setCareerTargetJobGuid] =
    useState("");
  const [careerActionDate, setCareerActionDate] =
    useState(() => new Date().toISOString().slice(0, 10));
  const [careerActionReason, setCareerActionReason] =
    useState("");
  const [careerActionNotes, setCareerActionNotes] =
    useState("");
  const [careerActionSaving, setCareerActionSaving] =
    useState(false);


  const [employeeAttendance, setEmployeeAttendance] =
    useState([]);
  const [employeeAttendanceSummary, setEmployeeAttendanceSummary] =
    useState({
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      leaveCount: 0,
      remoteCount: 0,
      overtimeMinutes: 0
    });
  const [employeeAttendanceShift, setEmployeeAttendanceShift] =
    useState(null);
  const [employeeAttendanceLoading, setEmployeeAttendanceLoading] =
    useState(false);

  const [employeeAttendanceRange, setEmployeeAttendanceRange] =
    useState(() => currentMonthAttendanceRange());
  const [employeeAttendanceAppliedRange, setEmployeeAttendanceAppliedRange] =
    useState(() => currentMonthAttendanceRange());
  const [employeeAttendanceTotalCount, setEmployeeAttendanceTotalCount] =
    useState(0);
  const [employeeAttendanceError, setEmployeeAttendanceError] =
    useState("");

  const [employeeLeavesYear, setEmployeeLeavesYear] =
    useState(() => new Date().getFullYear());
  const [employeeLeaveBalances, setEmployeeLeaveBalances] =
    useState([]);
  const [employeeLeaveRequests, setEmployeeLeaveRequests] =
    useState([]);
  const [employeeLeavesLoading, setEmployeeLeavesLoading] =
    useState(false);
  const [employeeLeavesError, setEmployeeLeavesError] =
    useState("");

  const getCurrentActor = () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      return {
        changedByUserGuid:
          currentUser?.guid ||
          currentUser?.Guid ||
          null,
        changedByName:
          currentUser?.fullName ||
          currentUser?.FullName ||
          currentUser?.userName ||
          currentUser?.UserName ||
          "مستخدم النظام"
      };
    } catch {
      return {
        changedByUserGuid: null,
        changedByName: "مستخدم النظام"
      };
    }
  };

  const fillProfileForm = (profile) => {
    const dateValue = profile?.birthDate
      ? String(profile.birthDate).slice(0, 10)
      : "";

    setProfileForm({
      birthDate: dateValue,
      nationality: profile?.nationality || "",
      gender:
        profile?.gender === null ||
        profile?.gender === undefined
          ? ""
          : profile.gender,
      maritalStatus:
        profile?.maritalStatus === null ||
        profile?.maritalStatus === undefined
          ? ""
          : profile.maritalStatus,
      educationLevel:
        profile?.educationLevel === null ||
        profile?.educationLevel === undefined
          ? ""
          : profile.educationLevel,
      specialization: profile?.specialization || "",
      address: profile?.address || "",
      city: profile?.city || "",
      emergencyContactName:
        profile?.emergencyContactName || "",
      emergencyContactPhone:
        profile?.emergencyContactPhone || "",
      emergencyContactRelation:
        profile?.emergencyContactRelation || "",
      notes: profile?.notes || ""
    });
  };

  const fillEditForm = (employee) => {
    setEditForm({
      fullName: employee?.fullName || "",
      nationalId: employee?.nationalId || "",
      mobile: employee?.mobile || "",
      mobile2: employee?.mobile2 || "",
      email: employee?.email || "",
      iban: employee?.iban || "",
      workType:
        employee?.workType === null ||
        employee?.workType === undefined
          ? ""
          : employee.workType,
      dailyWorkingHours:
        employee?.dailyWorkingHours === null ||
        employee?.dailyWorkingHours === undefined
          ? ""
          : employee.dailyWorkingHours,
      branchGuid: employee?.branchGuid || "",
      departmentGuid: employee?.departmentGuid || "",
      jobCode:
        employee?.jobCode === null ||
        employee?.jobCode === undefined
          ? ""
          : employee.jobCode,
      educationLevel:
        employee?.educationLevel === null ||
        employee?.educationLevel === undefined
          ? ""
          : employee.educationLevel,
      specialization: employee?.specialization || "",
      isActive: employee?.isActive === true
    });
  };

  const openEmployeeCard = (employee) => {
    setSelectedEmployee(employee);
    fillEditForm(employee);
    setProfileTab(0);
    setEditMode(false);
    setProfileEditMode(false);
    setEmployeeSaveError("");
    setEmployeeSaveSuccess("");
    setEmployeeCardOpen(true);

    if (employee?.employeeGuid) {
      loadEmployeeProfile(employee.employeeGuid);
      loadEmployeeDocuments(employee.employeeGuid);
      loadEmployeeContract(employee.employeeGuid);
      loadEmployeeAudit(employee.employeeGuid);
      loadEmployeeCareer(employee.employeeGuid);
    }
  };

  const closeEmployeeCard = () => {
    if (savingEmployee || profileSaving || documentUploading) return;

    setEmployeeCardOpen(false);
    setEditMode(false);
    setProfileEditMode(false);
    setDocumentUploadOpen(false);
    setContractUploadOpen(false);
    setCareerActionOpen(false);
    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
    }
    setDocumentPreviewUrl("");
    setDocumentPreviewItem(null);
    setDocumentPreviewKind("document");
    setDocumentPreviewError("");
    setDocumentPreviewOpen(false);
    setEmployeeSaveError("");
    setEmployeeSaveSuccess("");
  };

  const handleEditField = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const startEditingEmployee = () => {
    if (!selectedEmployee) return;

    fillEditForm(selectedEmployee);
    setEmployeeSaveError("");
    setEmployeeSaveSuccess("");
    setEditMode(true);
  };

  const cancelEditingEmployee = () => {
    if (selectedEmployee) {
      fillEditForm(selectedEmployee);
    }

    setEmployeeSaveError("");
    setEditMode(false);
  };

  const showEmployeeAlert = (icon, title, text) => {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: "حسنًا",
      confirmButtonColor:
        icon === "success" ? primaryColor : accentColor,
      background: isDark ? darkCard : "#ffffff",
      color: "#17372b",
      buttonsStyling: true,
      customClass: {
        popup: "hr-swal-popup",
        title: "hr-swal-title",
        htmlContainer: "hr-swal-text",
        confirmButton: "hr-swal-confirm"
      },
      didOpen: (popup) => {
        popup.style.borderRadius = "24px";
        popup.style.fontFamily = "Cairo";
        popup.style.boxShadow =
          "0 24px 80px rgba(15,45,32,.22)";

        popup.querySelectorAll(
          ".swal2-title, .swal2-html-container, .swal2-confirm"
        ).forEach((element) => {
          element.style.fontFamily = "Cairo";
        });
      }
    });
  };

  const saveEmployeeChanges = async () => {
    if (!selectedEmployee?.employeeGuid) {
      const message = "تعذر تحديد الموظف";
      setEmployeeSaveError(message);
      showEmployeeAlert("error", "تعذر الحفظ", message);
      return;
    }

    if (!editForm.fullName.trim()) {
      const message = "اسم الموظف مطلوب";
      setEmployeeSaveError(message);
      showEmployeeAlert("warning", "بيانات غير مكتملة", message);
      return;
    }

    if (
      editForm.dailyWorkingHours !== "" &&
      (
        Number(editForm.dailyWorkingHours) <= 0 ||
        Number(editForm.dailyWorkingHours) > 24
      )
    ) {
      const message =
        "عدد ساعات الدوام يجب أن يكون أكبر من صفر ولا يتجاوز 24 ساعة";
      setEmployeeSaveError(message);
      showEmployeeAlert("warning", "بيانات غير صحيحة", message);
      return;
    }

    try {
      setSavingEmployee(true);
      setEmployeeSaveError("");
      setEmployeeSaveSuccess("");

      const payload = {
        fullName: editForm.fullName.trim(),
        nationalId: editForm.nationalId.trim() || null,
        mobile: editForm.mobile.trim() || null,
        mobile2: editForm.mobile2.trim() || null,
        email: editForm.email.trim() || null,
        iban: editForm.iban.trim() || null,
        workType:
          editForm.workType === ""
            ? null
            : Number(editForm.workType),
        dailyWorkingHours:
          editForm.dailyWorkingHours === ""
            ? null
            : Number(editForm.dailyWorkingHours),
        branchGuid: editForm.branchGuid || null,
        departmentGuid: editForm.departmentGuid || null,
        jobCode:
          editForm.jobCode === ""
            ? null
            : Number(editForm.jobCode),
        educationLevel:
          editForm.educationLevel === ""
            ? null
            : Number(editForm.educationLevel),
        specialization:
          editForm.specialization.trim() || null,
        isActive: editForm.isActive === true,
        ...getCurrentActor()
      };

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حفظ بيانات الموظف"
        );
      }

      const selectedBranch =
        lookups.branches.find(
          (item) =>
            String(item?.guid || "").toLowerCase() ===
            String(editForm.branchGuid || "").toLowerCase()
        );

      const selectedDepartment =
        lookups.departments.find(
          (item) =>
            String(item?.guid || "").toLowerCase() ===
            String(editForm.departmentGuid || "").toLowerCase()
        );

      const selectedJob =
        lookups.jobs.find(
          (item) =>
            Number(item?.code) ===
            Number(editForm.jobCode)
        );

      const updatedEmployee = {
        ...selectedEmployee,
        ...payload,
        branchName:
          selectedBranch?.name ||
          selectedEmployee?.branchName ||
          "غير محدد",
        departmentName:
          selectedDepartment?.name ||
          selectedEmployee?.departmentName ||
          "غير محدد",
        jobTitle:
          selectedJob?.name ||
          selectedEmployee?.jobTitle ||
          "غير محدد",
        educationLevelName:
          getEducationLevelName(payload.educationLevel),
        specialization:
          payload.specialization,
        statusName:
          payload.isActive ? "نشط" : "غير نشط",
        workTypeName:
          payload.workType === 1
            ? "دوام كلي"
            : payload.workType === 2
              ? "دوام جزئي"
              : "غير محدد"
      };

      setSelectedEmployee(updatedEmployee);

      setEmployees((current) =>
        current.map((item) =>
          String(item?.employeeGuid || "").toLowerCase() ===
          String(selectedEmployee.employeeGuid).toLowerCase()
            ? updatedEmployee
            : item
        )
      );

      const successMessage =
        result?.message ||
        "تم تحديث بيانات الموظف بنجاح";

      setEmployeeSaveSuccess(successMessage);
      await showEmployeeAlert(
        "success",
        "تم الحفظ بنجاح",
        successMessage
      );

      setEditMode(false);

      // إعادة التحميل لضمان أن الواجهة مطابقة تمامًا لقاعدة البيانات.
      await Promise.all([
        loadEmployees(),
        loadEmployeeProfile(
          selectedEmployee.employeeGuid
        ),
        loadEmployeeAudit(
          selectedEmployee.employeeGuid
        )
      ]);
    } catch (error) {
      console.error(
        "Update employee error:",
        error
      );

      const errorMessage =
        error?.message ||
        "حدث خطأ أثناء تحديث بيانات الموظف";

      setEmployeeSaveError(errorMessage);
      await showEmployeeAlert(
        "error",
        "فشل حفظ البيانات",
        errorMessage
      );
    } finally {
      setSavingEmployee(false);
    }
  };

  const loadEmployeeProfile = async (employeeGuid) => {
    if (!employeeGuid) return;

    try {
      setProfileLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          employeeGuid
        )}/profile`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل البيانات الشخصية"
        );
      }

      const profile = result?.data || {};
      setProfileData(profile);
      fillProfileForm(profile);
    } catch (error) {
      console.error("Employee profile error:", error);
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const saveEmployeeProfile = async () => {
    if (!selectedEmployee?.employeeGuid) return;

    try {
      setProfileSaving(true);

      const actor = getCurrentActor();

      const payload = {
        birthDate: profileForm.birthDate || null,
        nationality:
          profileForm.nationality.trim() || null,
        gender:
          profileForm.gender === ""
            ? null
            : Number(profileForm.gender),
        maritalStatus:
          profileForm.maritalStatus === ""
            ? null
            : Number(profileForm.maritalStatus),
        educationLevel:
          profileForm.educationLevel === ""
            ? null
            : Number(profileForm.educationLevel),
        specialization:
          profileForm.specialization.trim() || null,
        address:
          profileForm.address.trim() || null,
        city:
          profileForm.city.trim() || null,
        emergencyContactName:
          profileForm.emergencyContactName.trim() || null,
        emergencyContactPhone:
          profileForm.emergencyContactPhone.trim() || null,
        emergencyContactRelation:
          profileForm.emergencyContactRelation.trim() || null,
        notes:
          profileForm.notes.trim() || null,
        ...actor
      };

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}/profile`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حفظ البيانات الشخصية"
        );
      }

      await Promise.all([
        loadEmployeeProfile(
          selectedEmployee.employeeGuid
        ),
        loadEmployeeAudit(
          selectedEmployee.employeeGuid
        )
      ]);

      setProfileEditMode(false);

      await showEmployeeAlert(
        "success",
        "تم الحفظ",
        result?.message ||
          "تم حفظ البيانات الشخصية بنجاح"
      );
    } catch (error) {
      console.error("Save profile error:", error);

      await showEmployeeAlert(
        "error",
        "تعذر الحفظ",
        error?.message ||
          "حدث خطأ أثناء حفظ البيانات الشخصية"
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const loadEmployeeDocuments = async (employeeGuid) => {
    if (!employeeGuid) return;

    try {
      setDocumentsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          employeeGuid
        )}/documents`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل المرفقات"
        );
      }

      setDocuments(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error("Documents error:", error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const uploadEmployeeDocument = async () => {
    if (!selectedEmployee?.employeeGuid) return;

    if (!documentForm.file) {
      await showEmployeeAlert(
        "warning",
        "اختر ملفًا",
        "يجب اختيار الملف قبل الرفع"
      );
      return;
    }

    const selectedFile = documentForm.file;
    const selectedExtension =
      `.${String(selectedFile.name || "")
        .split(".")
        .pop()
        .toLowerCase()}`;

    if (selectedFile.size > MAX_DOCUMENT_SIZE) {
      await showEmployeeAlert(
        "warning",
        "حجم الملف كبير",
        "الحد الأقصى المسموح به هو 20 ميجابايت"
      );
      return;
    }

    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(selectedExtension)) {
      await showEmployeeAlert(
        "warning",
        "امتداد غير مسموح",
        "الامتدادات المسموحة: PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX"
      );
      return;
    }

    try {
      setDocumentUploading(true);

      const actor = getCurrentActor();
      const formData = new FormData();

      formData.append("file", documentForm.file);

      if (documentForm.documentTypeCode !== "") {
        formData.append(
          "documentTypeCode",
          String(documentForm.documentTypeCode)
        );
      }

      if (documentForm.issueDate) {
        formData.append(
          "issueDate",
          documentForm.issueDate
        );
      }

      if (documentForm.expiryDate) {
        formData.append(
          "expiryDate",
          documentForm.expiryDate
        );
      }

      if (documentForm.notes.trim()) {
        formData.append(
          "notes",
          documentForm.notes.trim()
        );
      }

      if (actor.changedByUserGuid) {
        formData.append(
          "changedByUserGuid",
          actor.changedByUserGuid
        );
      }

      formData.append(
        "changedByName",
        actor.changedByName
      );

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}/documents`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر رفع المرفق"
        );
      }

      setDocumentUploadOpen(false);
      setDocumentForm({
        file: null,
        documentTypeCode: "",
        issueDate: "",
        expiryDate: "",
        notes: ""
      });

      await Promise.all([
        loadEmployeeDocuments(
          selectedEmployee.employeeGuid
        ),
        loadEmployeeAudit(
          selectedEmployee.employeeGuid
        )
      ]);

      await showEmployeeAlert(
        "success",
        "تم الرفع",
        result?.message ||
          "تم رفع المرفق بنجاح"
      );
    } catch (error) {
      console.error("Upload document error:", error);

      await showEmployeeAlert(
        "error",
        "تعذر رفع الملف",
        error?.message ||
          "حدث خطأ أثناء رفع المرفق"
      );
    } finally {
      setDocumentUploading(false);
    }
  };

  const deleteEmployeeDocument = async (document) => {
    if (
      !selectedEmployee?.employeeGuid ||
      !document?.documentGuid
    ) {
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "حذف المرفق؟",
      text:
        document?.originalFileName ||
        "سيتم حذف هذا المرفق",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: accentColor,
      cancelButtonColor: "#78847e",
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    try {
      const actor = getCurrentActor();
      const params = new URLSearchParams();

      if (actor.changedByUserGuid) {
        params.set(
          "changedByUserGuid",
          actor.changedByUserGuid
        );
      }

      params.set(
        "changedByName",
        actor.changedByName
      );

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}/documents/${encodeURIComponent(
          document.documentGuid
        )}?${params.toString()}`,
        {
          method: "DELETE"
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حذف المرفق"
        );
      }

      await Promise.all([
        loadEmployeeDocuments(
          selectedEmployee.employeeGuid
        ),
        loadEmployeeAudit(
          selectedEmployee.employeeGuid
        )
      ]);
    } catch (error) {
      await showEmployeeAlert(
        "error",
        "تعذر الحذف",
        error?.message ||
          "حدث خطأ أثناء حذف المرفق"
      );
    }
  };

  const openEmployeeDocument = (document) => {
    if (
      !selectedEmployee?.employeeGuid ||
      !document?.documentGuid
    ) {
      return;
    }

    const url =
      `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
        selectedEmployee.employeeGuid
      )}/documents/${encodeURIComponent(
        document.documentGuid
      )}/download`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };


  const closeEmployeeDocumentPreview = () => {
    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
    }
    setDocumentPreviewUrl("");
    setDocumentPreviewItem(null);
    setDocumentPreviewError("");
    setDocumentPreviewOpen(false);
  };

  const previewEmployeeDocument = async (document) => {
    if (
      !selectedEmployee?.employeeGuid ||
      !document?.documentGuid
    ) {
      return;
    }

    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
    }

    setDocumentPreviewItem(document);
    setDocumentPreviewKind("document");
    setDocumentPreviewUrl("");
    setDocumentPreviewError("");
    setDocumentPreviewOpen(true);

    const fileName = String(document?.originalFileName || "").toLowerCase();
    const extension = fileName.includes(".")
      ? `.${fileName.split(".").pop()}`
      : "";
    const previewable = [
      ".pdf", ".jpg", ".jpeg", ".png", ".webp"
    ].includes(extension);

    if (!previewable) {
      setDocumentPreviewError(
        "هذا النوع لا يدعم المعاينة المباشرة داخل المتصفح، ويمكن فتحه أو تحميله من زر فتح الملف."
      );
      return;
    }

    try {
      setDocumentPreviewLoading(true);

      const url =
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}/documents/${encodeURIComponent(
          document.documentGuid
        )}/download`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("تعذر تحميل معاينة المرفق");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setDocumentPreviewUrl(objectUrl);
    } catch (error) {
      setDocumentPreviewError(
        error?.message || "تعذر عرض معاينة المرفق"
      );
    } finally {
      setDocumentPreviewLoading(false);
    }
  };

  const loadEmployeeContract = async (employeeGuid) => {
    if (!employeeGuid) return;

    try {
      setContractLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          employeeGuid
        )}/contract?includeHistory=true`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل العقد الوظيفي"
        );
      }

      setEmployeeContract(result?.data?.current || null);
      setContractHistory(
        Array.isArray(result?.data?.history)
          ? result.data.history
          : []
      );
    } catch (error) {
      console.error("Employee contract error:", error);
      setEmployeeContract(null);
      setContractHistory([]);
    } finally {
      setContractLoading(false);
    }
  };

  const uploadEmployeeContract = async () => {
    if (!selectedEmployee?.employeeGuid) return;

    if (!contractForm.file) {
      await showEmployeeAlert(
        "warning",
        "اختر ملف العقد",
        "يجب اختيار ملف العقد قبل الرفع"
      );
      return;
    }

    const selectedFile = contractForm.file;
    const selectedExtension =
      `.${String(selectedFile.name || "")
        .split(".")
        .pop()
        .toLowerCase()}`;

    if (selectedFile.size > MAX_DOCUMENT_SIZE) {
      await showEmployeeAlert(
        "warning",
        "حجم الملف كبير",
        "الحد الأقصى المسموح به هو 20 ميجابايت"
      );
      return;
    }

    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(selectedExtension)) {
      await showEmployeeAlert(
        "warning",
        "امتداد غير مسموح",
        "الامتدادات المسموحة: PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX"
      );
      return;
    }

    if (
      contractForm.startDate &&
      contractForm.endDate &&
      new Date(contractForm.endDate) < new Date(contractForm.startDate)
    ) {
      await showEmployeeAlert(
        "warning",
        "تاريخ العقد غير صحيح",
        "تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية"
      );
      return;
    }

    try {
      setContractUploading(true);

      const actor = getCurrentActor();
      const formData = new FormData();

      formData.append("file", contractForm.file);

      if (contractForm.contractNumber.trim()) {
        formData.append(
          "contractNumber",
          contractForm.contractNumber.trim()
        );
      }

      if (contractForm.startDate) {
        formData.append("startDate", contractForm.startDate);
      }

      if (contractForm.endDate) {
        formData.append("endDate", contractForm.endDate);
      }

      if (contractForm.basicSalary !== "") {
        formData.append(
          "basicSalary",
          String(contractForm.basicSalary)
        );
      }

      if (contractForm.notes.trim()) {
        formData.append("notes", contractForm.notes.trim());
      }

      if (actor.changedByUserGuid) {
        formData.append(
          "changedByUserGuid",
          actor.changedByUserGuid
        );
      }

      formData.append(
        "changedByName",
        actor.changedByName
      );

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}/contract`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر رفع العقد الوظيفي"
        );
      }

      setContractUploadOpen(false);
      setContractForm({
        file: null,
        contractNumber: "",
        startDate: "",
        endDate: "",
        basicSalary: "",
        notes: ""
      });

      await Promise.all([
        loadEmployeeContract(
          selectedEmployee.employeeGuid
        ),
        loadEmployeeAudit(
          selectedEmployee.employeeGuid
        )
      ]);

      await showEmployeeAlert(
        "success",
        "تم رفع العقد",
        result?.message ||
        "تم حفظ العقد الوظيفي بنجاح"
      );
    } catch (error) {
      console.error("Upload contract error:", error);

      await showEmployeeAlert(
        "error",
        "تعذر رفع العقد",
        error?.message ||
        "حدث خطأ أثناء رفع العقد الوظيفي"
      );
    } finally {
      setContractUploading(false);
    }
  };

  const openEmployeeContractExternal = (contract = employeeContract) => {
    if (
      !selectedEmployee?.employeeGuid ||
      !contract?.contractGuid
    ) {
      return;
    }

    const url =
      `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
        selectedEmployee.employeeGuid
      )}/contract/${encodeURIComponent(
        contract.contractGuid
      )}/download`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openEmployeeContract = async (contract = employeeContract) => {
    if (
      !selectedEmployee?.employeeGuid ||
      !contract?.contractGuid
    ) {
      return;
    }

    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
    }

    setDocumentPreviewItem(contract);
    setDocumentPreviewKind("contract");
    setDocumentPreviewUrl("");
    setDocumentPreviewError("");
    setDocumentPreviewOpen(true);

    const fileName = String(contract?.originalFileName || "").toLowerCase();
    const extension = fileName.includes(".")
      ? `.${fileName.split(".").pop()}`
      : "";
    const previewable = [
      ".pdf", ".jpg", ".jpeg", ".png", ".webp"
    ].includes(extension);

    if (!previewable) {
      setDocumentPreviewLoading(false);
      setDocumentPreviewError(
        "نوع ملف العقد الحالي لا يدعم المعاينة المباشرة، ويمكن فتحه من زر فتح في نافذة مستقلة."
      );
      return;
    }

    try {
      setDocumentPreviewLoading(true);

      const url =
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}/contract/${encodeURIComponent(
          contract.contractGuid
        )}/download`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("تعذر تحميل معاينة العقد");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setDocumentPreviewUrl(objectUrl);
    } catch (error) {
      setDocumentPreviewError(
        error?.message || "تعذر عرض معاينة العقد"
      );
    } finally {
      setDocumentPreviewLoading(false);
    }
  };

  const openPreviewFileExternally = () => {
    if (!documentPreviewItem) return;

    if (documentPreviewKind === "contract") {
      openEmployeeContractExternal(documentPreviewItem);
      return;
    }

    openEmployeeDocument(documentPreviewItem);
  };

  const deleteEmployeeContract = async () => {
    if (
      !selectedEmployee?.employeeGuid ||
      !employeeContract?.contractGuid
    ) {
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "حذف العقد الحالي؟",
      text: employeeContract?.originalFileName ||
        "سيتم أرشفة العقد الحالي",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: accentColor,
      cancelButtonColor: "#78847e",
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    try {
      const actor = getCurrentActor();
      const params = new URLSearchParams();

      if (actor.changedByUserGuid) {
        params.set(
          "changedByUserGuid",
          actor.changedByUserGuid
        );
      }

      params.set("changedByName", actor.changedByName);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          selectedEmployee.employeeGuid
        )}/contract/${encodeURIComponent(
          employeeContract.contractGuid
        )}?${params.toString()}`,
        {
          method: "DELETE"
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر حذف العقد"
        );
      }

      await Promise.all([
        loadEmployeeContract(
          selectedEmployee.employeeGuid
        ),
        loadEmployeeAudit(
          selectedEmployee.employeeGuid
        )
      ]);

      await showEmployeeAlert(
        "success",
        "تم الحذف",
        result?.message ||
        "تم حذف العقد الوظيفي بنجاح"
      );
    } catch (error) {
      await showEmployeeAlert(
        "error",
        "تعذر الحذف",
        error?.message ||
        "حدث خطأ أثناء حذف العقد"
      );
    }
  };

  const loadEmployeeCareer = async (employeeGuid) => {
    if (!employeeGuid) return;

    try {
      setCareerLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          employeeGuid
        )}/career`,
        {
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل المسار الوظيفي"
        );
      }

      const next = {
        current: result?.data?.current || null,
        history: Array.isArray(result?.data?.history)
          ? result.data.history
          : [],
        promotionPlans: Array.isArray(
          result?.data?.promotionPlans
        )
          ? result.data.promotionPlans
          : []
      };

      setCareerData(next);

      if (next.current) {
        setSelectedEmployee((current) => {
          if (!current) return current;

          return {
            ...current,
            jobCode:
              next.current.currentLegacyJobCode ??
              current.jobCode,
            jobTitle:
              next.current.currentJobTitleName ||
              current.jobTitle
          };
        });

        setEditForm((current) => ({
          ...current,
          jobCode:
            next.current.currentLegacyJobCode ??
            current.jobCode
        }));
      }
    } catch (error) {
      console.error("Career error:", error);
      setCareerData({
        current: null,
        history: [],
        promotionPlans: []
      });
    } finally {
      setCareerLoading(false);
    }
  };

  const openCareerAction = (mode) => {
    setCareerActionMode(mode);
    setCareerTargetJobGuid("");
    setCareerActionDate(
      new Date().toISOString().slice(0, 10)
    );
    setCareerActionReason("");
    setCareerActionNotes("");
    setCareerActionOpen(true);
  };

  const loadEmployeeAttendance = useCallback(
    async (
      employeeGuid,
      range = currentMonthAttendanceRange()
    ) => {
      if (!employeeGuid) return;

      const fromDate = range?.fromDate || "";
      const toDate = range?.toDate || "";

      if (!fromDate || !toDate) {
        setEmployeeAttendanceError(
          "حدد تاريخ البداية والنهاية"
        );
        return;
      }

      const from = new Date(`${fromDate}T00:00:00`);
      const to = new Date(`${toDate}T00:00:00`);

      if (
        Number.isNaN(from.getTime()) ||
        Number.isNaN(to.getTime())
      ) {
        setEmployeeAttendanceError(
          "الفترة المحددة غير صحيحة"
        );
        return;
      }

      if (to < from) {
        setEmployeeAttendanceError(
          "تاريخ النهاية يجب أن يكون بعد أو مساويًا لتاريخ البداية"
        );
        return;
      }

      const daysCount =
        Math.floor(
          (to.getTime() - from.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      if (daysCount > 366) {
        setEmployeeAttendanceError(
          "يمكن عرض فترة حتى سنة واحدة في المرة الواحدة"
        );
        return;
      }

      try {
        setEmployeeAttendanceLoading(true);
        setEmployeeAttendanceError("");

        const pageSize = 100;

        const buildUrl = (pageNumber) => {
          const params = new URLSearchParams({
            fromDate,
            toDate,
            page: String(pageNumber),
            pageSize: String(pageSize)
          });

          return `${API_BASE_URL}/api/hr/attendance/employee/${encodeURIComponent(
            employeeGuid
          )}?${params.toString()}`;
        };

        const firstResponse = await fetch(
          buildUrl(1),
          {
            headers: {
              Accept: "application/json"
            },
            cache: "no-store"
          }
        );

        const firstResult = await firstResponse
          .json()
          .catch(() => null);

        if (!firstResponse.ok) {
          throw new Error(
            firstResult?.message ||
            "تعذر تحميل سجل الحضور والانصراف"
          );
        }

        const totalCount =
          Number(firstResult?.totalCount || 0);

        let rows = Array.isArray(firstResult?.data)
          ? firstResult.data
          : [];

        const totalPages = Math.ceil(
          totalCount / pageSize
        );

        if (totalPages > 1) {
          const requests = [];

          for (
            let pageNumber = 2;
            pageNumber <= totalPages;
            pageNumber += 1
          ) {
            requests.push(
              fetch(buildUrl(pageNumber), {
                headers: {
                  Accept: "application/json"
                },
                cache: "no-store"
              }).then(async (response) => {
                const result = await response
                  .json()
                  .catch(() => null);

                if (!response.ok) {
                  throw new Error(
                    result?.message ||
                    "تعذر تحميل باقي سجلات الحضور"
                  );
                }

                return Array.isArray(result?.data)
                  ? result.data
                  : [];
              })
            );
          }

          const remainingPages =
            await Promise.all(requests);

          rows = [
            ...rows,
            ...remainingPages.flat()
          ];
        }

        rows.sort((a, b) => {
          const left = new Date(
            a?.attendanceDate || 0
          ).getTime();
          const right = new Date(
            b?.attendanceDate || 0
          ).getTime();

          return right - left;
        });

        setEmployeeAttendance(rows);
        setEmployeeAttendanceTotalCount(totalCount);

        setEmployeeAttendanceSummary({
          presentCount:
            Number(
              firstResult?.summary?.presentCount || 0
            ),
          lateCount:
            Number(
              firstResult?.summary?.lateCount || 0
            ),
          absentCount:
            Number(
              firstResult?.summary?.absentCount || 0
            ),
          leaveCount:
            Number(
              firstResult?.summary?.leaveCount || 0
            ),
          remoteCount:
            Number(
              firstResult?.summary?.remoteCount || 0
            ),
          overtimeMinutes:
            Number(
              firstResult?.summary?.overtimeMinutes || 0
            )
        });

        setEmployeeAttendanceShift(
          firstResult?.shift || null
        );

        setEmployeeAttendanceAppliedRange({
          fromDate,
          toDate
        });
      } catch (error) {
        setEmployeeAttendance([]);
        setEmployeeAttendanceTotalCount(0);
        setEmployeeAttendanceShift(null);
        setEmployeeAttendanceError(
          error?.message ||
          "تعذر تحميل سجل الحضور والانصراف"
        );
      } finally {
        setEmployeeAttendanceLoading(false);
      }
    },
    []
  );

  const employeeAttendanceMetrics = useMemo(() => {
    return employeeAttendance.reduce(
      (result, item) => {
        result.workedMinutes += Number(
          item?.workedMinutes || 0
        );
        result.lateMinutes += Number(
          item?.lateMinutes || 0
        );
        result.earlyLeaveMinutes += Number(
          item?.earlyLeaveMinutes || 0
        );
        result.overtimeMinutes += Number(
          item?.overtimeMinutes || 0
        );

        if (item?.checkInAt) {
          result.daysWithCheckIn += 1;
        }

        if (item?.checkOutAt) {
          result.daysWithCheckOut += 1;
        }

        return result;
      },
      {
        workedMinutes: 0,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        daysWithCheckIn: 0,
        daysWithCheckOut: 0
      }
    );
  }, [employeeAttendance]);

  const applyEmployeeAttendanceRange = useCallback(
    (range) => {
      const nextRange = range || employeeAttendanceRange;

      setEmployeeAttendanceRange(nextRange);

      if (selectedEmployee?.employeeGuid) {
        loadEmployeeAttendance(
          selectedEmployee.employeeGuid,
          nextRange
        );
      }
    },
    [
      employeeAttendanceRange,
      selectedEmployee?.employeeGuid,
      loadEmployeeAttendance
    ]
  );

  useEffect(() => {
    if (
      profileTab !== 5 ||
      !selectedEmployee?.employeeGuid
    ) {
      return;
    }

    const currentMonth =
      currentMonthAttendanceRange();

    setEmployeeAttendanceRange(currentMonth);

    loadEmployeeAttendance(
      selectedEmployee.employeeGuid,
      currentMonth
    );
  }, [
    profileTab,
    selectedEmployee?.employeeGuid,
    loadEmployeeAttendance
  ]);

  const loadEmployeeLeaves = useCallback(
    async (
      employeeGuid,
      year = new Date().getFullYear()
    ) => {
      if (!employeeGuid) return;

      try {
        setEmployeeLeavesLoading(true);
        setEmployeeLeavesError("");

        const response = await fetch(
          `${API_BASE_URL}/api/hr/leaves/employee/${encodeURIComponent(
            employeeGuid
          )}?year=${encodeURIComponent(year)}`,
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

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل إجازات الموظف"
          );
        }

        setEmployeeLeaveBalances(
          Array.isArray(result?.balances)
            ? result.balances
            : []
        );

        setEmployeeLeaveRequests(
          Array.isArray(result?.requests)
            ? result.requests
            : []
        );

        setEmployeeLeavesYear(
          Number(
            result?.year ||
              year ||
              new Date().getFullYear()
          )
        );
      } catch (error) {
        setEmployeeLeaveBalances([]);
        setEmployeeLeaveRequests([]);
        setEmployeeLeavesError(
          error?.message ||
          "تعذر تحميل إجازات الموظف"
        );
      } finally {
        setEmployeeLeavesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (
      profileTab !== 6 ||
      !selectedEmployee?.employeeGuid
    ) {
      return;
    }

    loadEmployeeLeaves(
      selectedEmployee.employeeGuid,
      employeeLeavesYear
    );
  }, [
    profileTab,
    selectedEmployee?.employeeGuid,
    employeeLeavesYear,
    loadEmployeeLeaves
  ]);

  const careerTargetJobs = lookups.jobs.filter(
    (job) =>
      job?.jobTitleGuid &&
      Number(job?.code) !==
        Number(
          careerData?.current?.currentLegacyJobCode ??
            selectedEmployee?.jobCode
        ) &&
      Number(job?.code) !== 12
  );

  const saveCareerAction = async () => {
    if (!selectedEmployee?.employeeGuid) return;

    if (!careerTargetJobGuid) {
      await showEmployeeAlert(
        "warning",
        "اختر المسمى",
        "يجب اختيار المسمى الوظيفي المستهدف"
      );
      return;
    }

    if (!careerActionReason.trim()) {
      await showEmployeeAlert(
        "warning",
        "اكتب السبب",
        careerActionMode === "plan"
          ? "سبب خطة الترقية مطلوب"
          : "سبب النقل أو الترقية مطلوب"
      );
      return;
    }

    try {
      setCareerActionSaving(true);

      const actor = getCurrentActor();
      const isPlan = careerActionMode === "plan";

      const response = await fetch(
        isPlan
          ? `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
              selectedEmployee.employeeGuid
            )}/career/promotion-plan`
          : `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
              selectedEmployee.employeeGuid
            )}/career/change`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            isPlan
              ? {
                  targetJobTitleGuid:
                    careerTargetJobGuid,
                  plannedDate: careerActionDate,
                  reason: careerActionReason.trim(),
                  notes:
                    careerActionNotes.trim() || null,
                  ...actor
                }
              : {
                  targetJobTitleGuid:
                    careerTargetJobGuid,
                  movementType:
                    careerActionMode === "promotion"
                      ? "Promotion"
                      : "Transfer",
                  effectiveDate: careerActionDate,
                  reason: careerActionReason.trim(),
                  notes:
                    careerActionNotes.trim() || null,
                  ...actor
                }
          )
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تنفيذ العملية"
        );
      }

      setCareerActionOpen(false);

      await Promise.all([
        loadEmployeeCareer(
          selectedEmployee.employeeGuid
        ),
        loadEmployeeAudit(
          selectedEmployee.employeeGuid
        ),
        loadEmployees()
      ]);

      await showEmployeeAlert(
        "success",
        isPlan
          ? "تمت إضافة خطة الترقية"
          : careerActionMode === "promotion"
            ? "تمت الترقية"
            : "تم النقل",
        result?.message || "تمت العملية بنجاح"
      );
    } catch (error) {
      await showEmployeeAlert(
        "error",
        "تعذر تنفيذ العملية",
        error?.message ||
          "حدث خطأ أثناء تنفيذ العملية"
      );
    } finally {
      setCareerActionSaving(false);
    }
  };

  const executeEmployeePromotionPlan =
    async (plan) => {
      if (
        !selectedEmployee?.employeeGuid ||
        !plan?.planGuid
      ) {
        return;
      }

      const confirm = await Swal.fire({
        icon: "question",
        title: "تنفيذ الترقية؟",
        html: `
          <div style="font-family:Cairo;text-align:right">
            من <b>${plan?.fromJobTitleName || "غير محدد"}</b>
            إلى <b>${plan?.toJobTitleName || "غير محدد"}</b>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "تنفيذ الترقية",
        cancelButtonText: "رجوع",
        confirmButtonColor: primaryColor
      });

      if (!confirm.isConfirmed) return;

      try {
        const actor = getCurrentActor();

        const response = await fetch(
          `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
            selectedEmployee.employeeGuid
          )}/career/promotion-plans/${encodeURIComponent(
            plan.planGuid
          )}/execute`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(actor)
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تنفيذ خطة الترقية"
          );
        }

        await Promise.all([
          loadEmployeeCareer(
            selectedEmployee.employeeGuid
          ),
          loadEmployeeAudit(
            selectedEmployee.employeeGuid
          ),
          loadEmployees()
        ]);

        await showEmployeeAlert(
          "success",
          "تمت الترقية",
          result?.message ||
            "تم تنفيذ خطة الترقية بنجاح"
        );
      } catch (error) {
        await showEmployeeAlert(
          "error",
          "تعذر التنفيذ",
          error?.message ||
            "حدث خطأ أثناء تنفيذ خطة الترقية"
        );
      }
    };

  const cancelEmployeePromotionPlan =
    async (plan) => {
      if (
        !selectedEmployee?.employeeGuid ||
        !plan?.planGuid
      ) {
        return;
      }

      const result = await Swal.fire({
        title: "إلغاء خطة الترقية",
        input: "textarea",
        inputPlaceholder:
          "اكتب سبب إلغاء خطة الترقية...",
        showCancelButton: true,
        confirmButtonText: "إلغاء الخطة",
        cancelButtonText: "رجوع",
        confirmButtonColor: accentColor,
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب الإلغاء مطلوب"
            : undefined
      });

      if (!result.isConfirmed) return;

      try {
        const actor = getCurrentActor();

        const response = await fetch(
          `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
            selectedEmployee.employeeGuid
          )}/career/promotion-plans/${encodeURIComponent(
            plan.planGuid
          )}/cancel`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              cancelReason:
                String(result.value).trim(),
              ...actor
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "تعذر إلغاء خطة الترقية"
          );
        }

        await Promise.all([
          loadEmployeeCareer(
            selectedEmployee.employeeGuid
          ),
          loadEmployeeAudit(
            selectedEmployee.employeeGuid
          )
        ]);

        await showEmployeeAlert(
          "success",
          "تم إلغاء الخطة",
          data?.message ||
            "تم إلغاء خطة الترقية"
        );
      } catch (error) {
        await showEmployeeAlert(
          "error",
          "تعذر الإلغاء",
          error?.message ||
            "حدث خطأ أثناء إلغاء خطة الترقية"
        );
      }
    };

  const loadEmployeeAudit = async (employeeGuid) => {
    if (!employeeGuid) return;

    try {
      setAuditLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees/${encodeURIComponent(
          employeeGuid
        )}/audit?take=250`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل سجل التعديلات"
        );
      }

      setAuditLogs(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error("Audit error:", error);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    const value = Number(bytes || 0);

    if (!value) return "0 KB";
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${(
      value /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString(
        "ar-EG",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );
    } catch {
      return String(value);
    }
  };

  const loadLookups = useCallback(async () => {
    try {
      setLookupsLoading(true);

      /*
       * باقي القوائم تأتي من HR Employees،
       * أما المسميات الوظيفية فتأتي من مصدرها المركزي الجديد.
       */
      const [employeeLookupsResponse, jobTitlesResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/api/hr/employees/lookups`,
            {
              method: "GET",
              headers: {
                Accept: "application/json"
              }
            }
          ),
          fetch(
            `${API_BASE_URL}/api/hr/job-titles/lookups`,
            {
              method: "GET",
              headers: {
                Accept: "application/json"
              },
              cache: "no-store"
            }
          )
        ]);

      const employeeLookupsResult =
        await employeeLookupsResponse.json();

      const jobTitlesResult =
        await jobTitlesResponse.json();

      if (!employeeLookupsResponse.ok) {
        throw new Error(
          employeeLookupsResult?.message ||
          "تعذر تحميل بيانات الفلاتر"
        );
      }

      if (!jobTitlesResponse.ok) {
        throw new Error(
          jobTitlesResult?.message ||
          "تعذر تحميل المسميات الوظيفية"
        );
      }

      const dynamicJobs = Array.isArray(
        jobTitlesResult?.data
      )
        ? jobTitlesResult.data
            .filter(
              (job) =>
                job?.isActive === true &&
                job?.showInUserSelection === true &&
                job?.legacyJobCode !== null &&
                job?.legacyJobCode !== undefined &&
                Number(job?.legacyJobCode) !== 12
            )
            .map((job) => ({
              code: Number(job.legacyJobCode),
              name: job.jobTitleName || "غير محدد",
              jobTitleGuid: job.jobTitleGuid || "",
              isActive: job.isActive === true,
              showInUserSelection:
                job.showInUserSelection === true
            }))
            .sort(
              (a, b) =>
                Number(a.code) - Number(b.code)
            )
        : [];

      setLookups({
        branches: Array.isArray(
          employeeLookupsResult?.data?.branches
        )
          ? employeeLookupsResult.data.branches
          : [],
        departments: Array.isArray(
          employeeLookupsResult?.data?.departments
        )
          ? employeeLookupsResult.data.departments
          : [],
        jobs: dynamicJobs,
        statuses: Array.isArray(
          employeeLookupsResult?.data?.statuses
        )
          ? employeeLookupsResult.data.statuses
          : [],
        documentTypes: Array.isArray(
          employeeLookupsResult?.data?.documentTypes
        )
          ? employeeLookupsResult.data.documentTypes
          : [],
        genders: Array.isArray(
          employeeLookupsResult?.data?.genders
        )
          ? employeeLookupsResult.data.genders
          : [],
        maritalStatuses: Array.isArray(
          employeeLookupsResult?.data?.maritalStatuses
        )
          ? employeeLookupsResult.data.maritalStatuses
          : []
      });
    } catch (err) {
      console.error("HR lookups error:", err);
      setError(
        err?.message ||
        "حدث خطأ أثناء تحميل بيانات الفلاتر"
      );
    } finally {
      setLookupsLoading(false);
    }
  }, []);
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (appliedFilters.search?.trim()) {
        params.set("search", appliedFilters.search.trim());
      }

      if (appliedFilters.branchGuid) {
        params.set(
          "branchGuid",
          appliedFilters.branchGuid
        );
      }

      if (appliedFilters.departmentGuid) {
        params.set(
          "departmentGuid",
          appliedFilters.departmentGuid
        );
      }

      if (
        appliedFilters.jobCode !== "" &&
        appliedFilters.jobCode !== null &&
        appliedFilters.jobCode !== undefined
      ) {
        params.set(
          "jobCode",
          String(appliedFilters.jobCode)
        );
      }

      if (
        appliedFilters.isActive !== "" &&
        appliedFilters.isActive !== null &&
        appliedFilters.isActive !== undefined
      ) {
        params.set(
          "isActive",
          String(appliedFilters.isActive)
        );
      }

      const query = params.toString();

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees${
          query ? `?${query}` : ""
        }`,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل بيانات الموظفين"
        );
      }

      setEmployees(normalizeResponseArray(result));
    } catch (err) {
      console.error("HR employees error:", err);
      setEmployees([]);
      setError(
        err?.message || "حدث خطأ أثناء تحميل بيانات الموظفين"
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(
      (employee) => employee?.isActive === true
    ).length;
    const inactive = total - active;

    const branchCount = new Set(
      employees
        .map((employee) => employee?.branchGuid)
        .filter(Boolean)
    ).size;

    const departmentCount = new Set(
      employees
        .map((employee) => employee?.departmentGuid)
        .filter(Boolean)
    ).size;

    return {
      total,
      active,
      inactive,
      branchCount,
      departmentCount
    };
  }, [employees]);

  const pageCount = Math.max(
    1,
    Math.ceil(employees.length / pageSize)
  );

  const pagedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return employees.slice(start, start + pageSize);
  }, [employees, page, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  };

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const resetFilters = () => {
    const emptyFilters = {
      search: "",
      branchGuid: "",
      departmentGuid: "",
      jobCode: "",
      isActive: ""
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const statCards = [
    {
      title: "إجمالي الموظفين",
      value: stats.total,
      icon: <GroupsIcon />,
      description: "حسب الفلاتر الحالية"
    },
    {
      title: "الموظفون النشطون",
      value: stats.active,
      icon: <CheckCircleIcon />,
      description: "حالتهم نشط"
    },
    {
      title: "غير النشطين",
      value: stats.inactive,
      icon: <CancelIcon />,
      description: "حالتهم غير نشط"
    },
    {
      title: "الفروع",
      value: stats.branchCount,
      icon: <BusinessIcon />,
      description: "الموجودة في النتائج"
    },
    {
      title: "الأقسام",
      value: stats.departmentCount,
      icon: <AccountTreeIcon />,
      description: "الموجودة في النتائج"
    }
  ];

  const renderMobileEmployee = (employee) => (
    <Paper
      key={
        employee?.employeeGuid ||
        employee?.employeeId
      }
      elevation={0}
      onClick={() =>
        openEmployeeCard(employee)
      }
      sx={{
        width: "100%",
        minHeight: {
          xs: 54,
          sm: 62
        },
        px: {
          xs: .7,
          sm: .9
        },
        py: {
          xs: .55,
          sm: .7
        },
        borderRadius: {
          xs: 2,
          sm: 2.3
        },
        border:
          "1px solid rgba(5,117,70,0.10)",
        boxShadow:
          "0 2px 8px rgba(5,117,70,0.035)",
        bgcolor: isDark ? darkCard : "#fff",
        cursor: "pointer",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        transition:
          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        "&:hover": {
          transform:
            "translateY(-1px)",
          borderColor:
            "rgba(5,117,70,0.20)",
          boxShadow:
            "0 5px 14px rgba(5,117,70,0.07)"
        },
        "&:active": {
          transform:
            "scale(.997)"
        }
      }}
    >
      {/* الصورة - الاتجاه المعكوس في مشروعك */}
      <Box
        sx={{
          position: "absolute",
          insetInlineStart: {
            xs: 7,
            sm: 9
          },
          top: "50%",
          transform:
            "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <EmployeeAvatar
          employee={employee}
          size={
            isPhone
              ? 38
              : 44
          }
        />
      </Box>

      {/* العين - الناحية المقابلة */}
      <Box
        sx={{
          position: "absolute",
          insetInlineEnd: {
            xs: 7,
            sm: 9
          },
          top: "50%",
          transform:
            "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Tooltip title="بطاقة الموظف">
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              openEmployeeCard(employee);
            }}
            size="small"
            sx={{
              width: {
                xs: 29,
                sm: 33
              },
              height: {
                xs: 29,
                sm: 33
              },
              color: primaryColor,
              bgcolor: "#eef8f3",
              border:
                "1px solid rgba(5,117,70,0.10)",
              "&:hover": {
                bgcolor:
                  "#dcefe7"
              }
            }}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize: {
                  xs: 15,
                  sm: 17
                }
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* الاسم والوظيفة بين الصورة والعين */}
      <Box
        sx={{
          paddingInlineStart: {
            xs: "48px",
            sm: "55px"
          },
          paddingInlineEnd: {
            xs: "38px",
            sm: "44px"
          },
          minWidth: 0,
          direction: PAGE_DIRECTION,
          textAlign: PAGE_TEXT_ALIGN
        }}
      >
        <Typography
          sx={{
            width: "100%",
            minWidth: 0,
            fontFamily: "Cairo",
            fontWeight: 900,
            fontSize: {
              xs: "0.75rem",
              sm: ".80rem"
            },
            lineHeight: 1.4,
            color: "#13231c",
            textAlign: PAGE_TEXT_ALIGN,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {employee?.fullName ||
            "بدون اسم"}
        </Typography>

        <Typography
          sx={{
            mt: {
              xs: .2,
              sm: .3
            },
            width: "100%",
            minWidth: 0,
            fontFamily: "Cairo",
            fontSize: {
              xs: "0.75rem",
              sm: "0.75rem"
            },
            fontWeight: 500,
            color: "#6f8179",
            lineHeight: 1.3,
            textAlign: PAGE_TEXT_ALIGN,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {employee?.jobTitle ||
            "غير محدد"}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box className="sstli-hr-dark-root"
      dir={PAGE_DIRECTION}
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background:
          theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : "linear-gradient(180deg, #f7fbf9 0%, #ffffff 100%)",
        fontFamily:
          'Cairo, Arial, "Noto Sans Arabic", sans-serif',

        "@keyframes pageReveal": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        },
        "@keyframes cardReveal": {
          from: { opacity: 0, transform: "translateY(9px) scale(.985)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" }
        },
        "@keyframes fadeSlide": {
          from: { opacity: 0, transform: "translateY(5px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        },
        "@keyframes dialogPop": {
          from: { opacity: 0, transform: "translateY(14px) scale(.975)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" }
        },
        "& .hr-swal-popup": {
          borderRadius: "24px !important",
          fontFamily: "Cairo !important",
          boxShadow: "0 24px 80px rgba(15,45,32,.22) !important"
        },
        "& .hr-swal-title, & .hr-swal-text, & .hr-swal-confirm": {
          fontFamily: "Cairo !important"
        }
      }}
    >

      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".sstli-hr-dark-root": {
                  color: `${theme.palette.text.primary} !important`
                },

                ".sstli-hr-dark-root .MuiPaper-root:not(.print-preview):not(.document-preview):not(.a4-page), .sstli-hr-dark-root .MuiCard-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: `${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-hr-dark-root .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".sstli-hr-dark-root .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important",
                  borderColor: `${DARK_BORDER} !important`,
                  boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
                },
                ".sstli-hr-dark-root .MuiButton-root.Mui-disabled, .MuiDialog-paper .MuiButton-root.Mui-disabled": {
                  backgroundColor: "transparent !important",
                  color: "rgba(155,224,193,.42) !important",
                  borderColor: "rgba(103,201,157,.34) !important"
                },

                ".sstli-hr-dark-root .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".sstli-hr-dark-root .MuiIconButton-root:hover, .MuiDialog-paper .MuiIconButton-root:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },

                ".sstli-hr-dark-root .MuiChip-root, .MuiDialog-paper .MuiChip-root, .sstli-hr-dark-root .MuiBadge-badge": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-hr-dark-root .MuiTabs-root, .MuiDialog-paper .MuiTabs-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  border: `1px solid ${DARK_BORDER} !important`,
                  borderRadius: "10px !important",
                  minHeight: "38px !important"
                },
                ".sstli-hr-dark-root .MuiTab-root, .MuiDialog-paper .MuiTab-root": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.secondary} !important`,
                  minHeight: "36px !important"
                },
                ".sstli-hr-dark-root .MuiTab-root.Mui-selected, .MuiDialog-paper .MuiTab-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`
                },
                ".sstli-hr-dark-root .MuiTabs-indicator, .MuiDialog-paper .MuiTabs-indicator": {
                  backgroundColor: `${DARK_BORDER} !important`,
                  height: "2px !important"
                },

                ".sstli-hr-dark-root .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".sstli-hr-dark-root .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                  borderColor: `${DARK_BORDER} !important`
                },
                ".sstli-hr-dark-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .sstli-hr-dark-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: `${DARK_BORDER} !important`,
                  borderWidth: "1px !important"
                },
                ".sstli-hr-dark-root .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root": {
                  color: `${theme.palette.text.secondary} !important`
                },
                ".sstli-hr-dark-root .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                  color: `${DARK_TEXT} !important`
                },
                ".sstli-hr-dark-root .MuiInputAdornment-root, .sstli-hr-dark-root .MuiInputAdornment-root .MuiSvgIcon-root, .sstli-hr-dark-root .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                  color: `${DARK_TEXT} !important`
                },
                ".sstli-hr-dark-root .MuiFormHelperText-root, .MuiDialog-paper .MuiFormHelperText-root": {
                  color: `${theme.palette.text.secondary} !important`
                },

                ".sstli-hr-dark-root .MuiCheckbox-root, .MuiDialog-paper .MuiCheckbox-root": {
                  color: `${DARK_BORDER} !important`
                },
                ".sstli-hr-dark-root .MuiCheckbox-root.Mui-checked, .MuiDialog-paper .MuiCheckbox-root.Mui-checked": {
                  color: `${DARK_BORDER} !important`
                },

                ".sstli-hr-dark-root .MuiAlert-root, .MuiDialog-paper .MuiAlert-root": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".sstli-hr-dark-root .MuiAlert-icon, .MuiDialog-paper .MuiAlert-icon, .sstli-hr-dark-root .MuiCircularProgress-root, .MuiDialog-paper .MuiCircularProgress-root": {
                  color: `${DARK_BORDER} !important`
                },

                ".sstli-hr-dark-root .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                  borderColor: `${DARK_BORDER} !important`
                },

                ".sstli-hr-dark-root .MuiAppBar-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-hr-dark-root .MuiTableContainer-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  borderColor: `${DARK_BORDER} !important`
                },
                ".sstli-hr-dark-root .MuiTableHead-root .MuiTableCell-root, .MuiDialog-paper .MuiTableHead-root .MuiTableCell-root": {
                  backgroundColor: `${darkNested} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: `${DARK_BORDER} !important`
                },
                ".sstli-hr-dark-root .MuiTableBody-root .MuiTableCell-root, .MuiDialog-paper .MuiTableBody-root .MuiTableCell-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".sstli-hr-dark-root .MuiTableRow-root:hover .MuiTableCell-root, .MuiDialog-paper .MuiTableRow-root:hover .MuiTableCell-root": {
                  backgroundColor: `${darkHover} !important`
                },

                ".sstli-hr-dark-root .MuiPaginationItem-root": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`
                },
                ".sstli-hr-dark-root .MuiPaginationItem-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },

                ".MuiDialog-paper": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                },
                ".MuiDialogTitle-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderBottom: `1px solid ${DARK_BORDER} !important`
                },
                ".MuiDialogContent-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiDialogActions-root": {
                  backgroundColor: `${darkSection} !important`,
                  borderTop: `1px solid ${DARK_BORDER} !important`
                },
                ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiCard-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  borderColor: `${DARK_BORDER} !important`
                },

                ".MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 14px 34px rgba(3,20,13,.28) !important"
                },
                ".MuiMenuItem-root, .MuiAutocomplete-option": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover, .MuiAutocomplete-option:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".MuiMenuItem-root.Mui-selected, .MuiAutocomplete-option[aria-selected='true']": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`,
                  borderInlineStart: `2px solid ${DARK_BORDER} !important`
                },

                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${theme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".swal2-input, .swal2-textarea, .swal2-select": {
                  backgroundColor: "transparent !important",
                  color: `${theme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },

                ".sstli-hr-dark-root input[type='date'], .MuiDialog-paper input[type='date'], .sstli-hr-dark-root input[type='datetime-local'], .MuiDialog-paper input[type='datetime-local'], .sstli-hr-dark-root input[type='time'], .MuiDialog-paper input[type='time']": {
                  colorScheme: "dark"
                },

                ".sstli-hr-dark-root .print-preview, .sstli-hr-dark-root .document-preview, .sstli-hr-dark-root .a4-page": {
                  backgroundColor: "#fff !important",
                  color: "#111 !important",
                  borderColor: "#ddd !important"
                }
              }
            : {})
        }}
      />

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: 1250,
            height: { xs: 50, sm: 56 },
            justifyContent: "center",
            background: isDark ? darkSection : "linear-gradient(135deg, #ffffff 0%, #f4fbf7 100%)",
            borderBottom:
              "1px solid rgba(5,117,70,0.12)",
            color: primaryDark,
            boxShadow:
              "0 4px 16px rgba(5,117,70,0.08)"
          }}
        >
          <Toolbar
            disableGutters
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)"
              },
              px: { xs: 0.75, sm: 1 },
              gap: 0.8
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen(
                  (current) => !current
                );
              }}
              aria-label="فتح القائمة"
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                color: "#fff",
                background: isDark ? darkSection : "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 5px 14px rgba(5,117,70,.20)",
                "&:hover": {
                  background: isDark ? darkSection : "linear-gradient(135deg,#034d31,#057546)"
                }
              }}
            >
              <MenuRoundedIcon
                sx={{
                  fontSize: { xs: 20, sm: 22 }
                }}
              />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: {
                  xs: ".76rem",
                  sm: ".88rem"
                },
                textAlign: PAGE_TEXT_ALIGN,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              الموارد البشرية - ملفات الموظفين
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
          maxWidth: "100%",
          minWidth: 0,
          minHeight: "100dvh",
          
          
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            px: 1.5,
            py: 1.5
          },
          ...navigationContentSx, ...uiLayout.scopeSx
        }}
      >
        <Stack
          spacing={{
            xs: 1.2,
            sm: 1.5,
            md: 1.8
          }}
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0
          }}
        >
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 1.35,
              sm: 1.7,
              md: 2
            },
            borderRadius: 4,
            color: "#fff",
            background: isDark ? darkSection : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            boxShadow:
              "0 12px 30px rgba(5,117,70,0.18)",
            animation: "pageReveal .55s cubic-bezier(.2,.8,.2,1) both",
            transition: "transform .28s ease, box-shadow .28s ease",
            "&:hover": {
              transform: isDesktop ? "translateY(-2px)" : "none",
              boxShadow: isDesktop
                ? "0 18px 42px rgba(5,117,70,0.22)"
                : "0 12px 30px rgba(5,117,70,0.18)"
            }
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row"
            }}
            alignItems={{
              xs: "stretch",
              md: "center"
            }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography className="hr-page-title"
                variant="h5"
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                ملفات الموظفين
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  opacity: 0.9,
                  fontFamily: "Cairo",
                  fontSize: { xs: "0.82rem", md: "0.95rem" }
                }}
              >
                إدارة وعرض بيانات الموظفين والفروع والأقسام والمسميات الوظيفية
              </Typography>
            </Box>

            <Tooltip title="تحديث البيانات">
              <span>
                <IconButton
                  onClick={() => {
                    loadLookups();
                    loadEmployees();
                  }}
                  disabled={loading || lookupsLoading}
                  sx={{
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,0.12)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.20)"
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Paper>

        {error && (
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              fontFamily: "Cairo"
            }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)"
            },
            gap: { xs: .65, sm: .8, lg: 1 }
          }}
        >
          {statCards.map((card) => (
            <StatCard
              key={card.title}
              {...card}
            />
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: .85, sm: 1, md: 1.25, lg: 2 },
            borderRadius: { xs: 2.4, sm: 2.7, lg: 4 },
            border: "1px solid rgba(5,117,70,0.10)",
            boxShadow:
              "0 5px 18px rgba(5,117,70,0.05)",
            animation: "cardReveal .62s .08s cubic-bezier(.2,.8,.2,1) both",
            transition: "box-shadow .25s ease, border-color .25s ease",
            "&:hover": {
              borderColor: isDesktop
                ? "rgba(5,117,70,.18)"
                : "rgba(5,117,70,.10)",
              boxShadow: isDesktop
                ? "0 10px 28px rgba(5,117,70,.08)"
                : "0 5px 18px rgba(5,117,70,0.05)"
            }
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: { xs: .75, sm: .9, lg: 1.5 } }}
          >
            <Typography
              sx={{
                fontFamily: "Cairo",
                fontSize: { xs: ".76rem", sm: ".84rem", lg: "1rem" },
                fontWeight: 900,
                color: primaryDark
              }}
            >
              البحث والتصفية
            </Typography>

            {!isDesktop && (
              <Button
                size="small"
                variant={advancedFiltersOpen ? "contained" : "outlined"}
                startIcon={<TuneRoundedIcon />}
                endIcon={
                  <KeyboardArrowDownRoundedIcon
                    sx={{
                      transition: "transform .28s ease",
                      transform: advancedFiltersOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)"
                    }}
                  />
                }
                onClick={() =>
                  setAdvancedFiltersOpen((current) => !current)
                }
                sx={uiLayout.withUiSx({
                  minHeight: 32,
                  borderRadius: 2.2,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  color: advancedFiltersOpen ? "#fff" : primaryColor,
                  bgcolor: advancedFiltersOpen ? primaryColor : "#fff",
                  borderColor: "rgba(5,117,70,.22)",
                  boxShadow: advancedFiltersOpen
                    ? "0 5px 14px rgba(5,117,70,.16)"
                    : "none",
                  "&:hover": {
                    bgcolor: advancedFiltersOpen
                      ? primaryDark
                      : primaryLight
                  }
                }, uiLayout.buttonSx)}
              >
                الفلاتر المتقدمة
              </Button>
            )}
          </Stack>

          <TextField InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
            label="بحث"
            placeholder="الاسم، الهوية، الجوال، البريد أو الكود"
            value={filters.search}
            onChange={(event) =>
              handleFilterChange("search", event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyFilters();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: primaryColor }} />
                </InputAdornment>
              )
            }}
            sx={uiLayout.withUiSx([EMPLOYEE_PAGE_FIELD_SX, {
              mb: { xs: 1.5, lg: 1.3 },
              "& .MuiInputBase-root": {
                transition: "box-shadow .2s ease, border-color .2s ease"
              },
              "& .MuiInputBase-root.Mui-focused": {
                boxShadow: "0 0 0 4px rgba(5,117,70,.07)"
              }
            }], uiLayout.formFieldSx)}
          />

          <Collapse
            in={isDesktop || advancedFiltersOpen}
            timeout={320}
            unmountOnExit={!isDesktop}
          >
            <Box
              sx={uiLayout.withUiSx([EMPLOYEE_PAGE_FIELD_GAP, EMPLOYEE_PAGE_FIELD_SX, {
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))"
                },
                mt: isDesktop ? 0 : 1.6,
                "& .MuiInputBase-root": {
                  transition: "box-shadow .2s ease"
                },
                "& .MuiInputBase-root.Mui-focused": {
                  boxShadow: "0 0 0 4px rgba(5,117,70,.06)"
                }
              }], uiLayout.formSectionSx)}
            >
              <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                <InputLabel>الفرع</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الفرع"
                  value={filters.branchGuid}
                  onChange={(event) =>
                    handleFilterChange("branchGuid", event.target.value)
                  }
                >
                  <MenuItem value="">كل الفروع</MenuItem>
                  {lookups.branches.map((branch) => (
                    <MenuItem key={branch?.guid} value={branch?.guid || ""}>
                      {branch?.name || "غير محدد"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                <InputLabel>القسم</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="القسم"
                  value={filters.departmentGuid}
                  onChange={(event) =>
                    handleFilterChange("departmentGuid", event.target.value)
                  }
                >
                  <MenuItem value="">كل الأقسام</MenuItem>
                  {lookups.departments.map((department) => (
                    <MenuItem
                      key={department?.guid || department?.id}
                      value={department?.guid || ""}
                    >
                      {department?.name || "غير محدد"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                <InputLabel>الوظيفة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الوظيفة"
                  value={filters.jobCode}
                  onChange={(event) =>
                    handleFilterChange("jobCode", event.target.value)
                  }
                >
                  <MenuItem value="">كل الوظائف</MenuItem>
                  {lookups.jobs.map((job) => (
                    <MenuItem key={job?.code} value={job?.code}>
                      {job?.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الحالة"
                  value={filters.isActive}
                  onChange={(event) =>
                    handleFilterChange("isActive", event.target.value)
                  }
                >
                  <MenuItem value="">كل الحالات</MenuItem>
                  <MenuItem value={true}>نشط</MenuItem>
                  <MenuItem value={false}>غير نشط</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Collapse>

          <Stack
            direction="row"
            spacing={0.7}
            sx={uiLayout.withUiSx({
              mt: { xs: .8, sm: 1, lg: 1.6 },
              width: { xs: "100%", lg: "auto" },
              "& .MuiButton-root": {
                flex: { xs: 1, lg: "initial" },
                minHeight: { xs: 34, sm: 36 },
                borderRadius: 2.2,
                fontSize: { xs: "0.75rem", sm: "0.75rem", lg: ".78rem" },
                px: { xs: .7, sm: 1, lg: 2 },
                transition: "transform .2s ease, box-shadow .2s ease"
              }
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={applyFilters}
              disabled={loading}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800,
                bgcolor: primaryColor,
                boxShadow: "0 6px 16px rgba(5,117,70,.15)",
                "&:hover": {
                  bgcolor: primaryDark,
                  transform: isDesktop ? "translateY(-1px)" : "none",
                  boxShadow: "0 9px 20px rgba(5,117,70,.20)"
                }
              }, uiLayout.buttonSx)}
            >
              تطبيق
            </Button>

            <Button
              variant="outlined"
              onClick={resetFilters}
              disabled={loading}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800,
                color: accentColor,
                borderColor: "rgba(174,30,33,0.35)",
                "&:hover": {
                  transform: isDesktop ? "translateY(-1px)" : "none",
                  borderColor: accentColor,
                  bgcolor: "rgba(174,30,33,.035)"
                }
              }, uiLayout.buttonSx)}
            >
              مسح الفلاتر
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid rgba(5,117,70,0.10)",
            boxShadow:
              "0 5px 18px rgba(5,117,70,0.05)",
            animation: "cardReveal .68s .14s cubic-bezier(.2,.8,.2,1) both"
          }}
        >
          <Stack
            direction={{
              xs: "row",
              sm: "row"
            }}
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ p: { xs: .85, sm: 1, lg: 2 } }}
          >
            <Box
              sx={{
                textAlign: PAGE_TEXT_ALIGN,
                marginInlineEnd: "auto"
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: primaryDark,
                  fontSize: { xs: ".78rem", sm: ".86rem", lg: "1rem" }
                }}
              >
                قائمة الموظفين
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontFamily: "Cairo",
                  fontSize: { xs: "0.75rem", sm: "0.75rem", lg: "0.75rem" }
                }}
              >
                عدد النتائج: {employees.length}
              </Typography>
            </Box>

            <FormControl
              size="small"
              sx={uiLayout.withUiSx([EMPLOYEE_PAGE_FIELD_SX, {
                minWidth: { xs: 96, sm: 104, lg: 132 }
              }], uiLayout.formFieldSx)}
            >
              <InputLabel>عدد الصفوف</InputLabel>
              <Select
                  MenuProps={RTL_MENU_PROPS}
                label="عدد الصفوف"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(
                    Number(event.target.value)
                  );
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <MenuItem
                    key={size}
                    value={size}
                  >
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          {loading ? (
            <Box
              sx={{
                py: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Stack
                spacing={1.5}
                alignItems="center"
              >
                <CircularProgress
                  sx={{ color: primaryColor }}
                />
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    color: "text.secondary"
                  }}
                >
                  جاري تحميل الموظفين...
                </Typography>
              </Stack>
            </Box>
          ) : employees.length === 0 ? (
            <Box
              sx={{
                py: 8,
                textAlign: CENTER_TEXT_ALIGN
              }}
            >
              <GroupsIcon
                sx={{
                  fontSize: 48,
                  color: "text.disabled"
                }}
              />
              <Typography
                sx={{
                  mt: 1,
                  fontFamily: "Cairo",
                  fontWeight: 800
                }}
              >
                لا توجد نتائج
              </Typography>
            </Box>
          ) : isMobile ? (
            <Box
              dir={PAGE_DIRECTION}
              sx={{
                p: { xs: .5, sm: .7 },
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))"
                },
                gap: {
                  xs: .45,
                  sm: .65
                },
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {pagedEmployees.map(
                renderMobileEmployee
              )}
            </Box>
          ) : (
            <TableContainer
              sx={uiLayout.withUiSx({
                width: "100%",
                maxWidth: "100%",
                overflowX: "hidden"
              }, uiLayout.tableContainerSx)}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  width: "100%",
                  maxWidth: "100%",
                  tableLayout: "fixed",

                  "& .MuiTableCell-root": {
                    textAlign: PAGE_TEXT_ALIGN,
                    verticalAlign: "middle",
                    px: { lg: .75, xl: 1 },
                    py: .7,
                    boxSizing: "border-box"
                  },

                  /* الصورة */
                  "& th:nth-of-type(1), & td:nth-of-type(1)": {
                    width: "5%"
                  },

                  /* اسم الموظف */
                  "& th:nth-of-type(2), & td:nth-of-type(2)": {
                    width: "17%"
                  },

                  /* رقم الهوية */
                  "& th:nth-of-type(3), & td:nth-of-type(3)": {
                    width: "11%"
                  },

                  /* الجوال */
                  "& th:nth-of-type(4), & td:nth-of-type(4)": {
                    width: "10%"
                  },

                  /* الفرع */
                  "& th:nth-of-type(5), & td:nth-of-type(5)": {
                    width: "19%"
                  },

                  /* القسم */
                  "& th:nth-of-type(6), & td:nth-of-type(6)": {
                    width: "12%"
                  },

                  /* المسمى الوظيفي */
                  "& th:nth-of-type(7), & td:nth-of-type(7)": {
                    width: "14%"
                  },

                  /* الحالة */
                  "& th:nth-of-type(8), & td:nth-of-type(8)": {
                    width: "6%"
                  },

                  /* بطاقة الموظف */
                  "& th:nth-of-type(9), & td:nth-of-type(9)": {
                    width: "6%"
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    {[
                      "الصورة",
                      "اسم الموظف",
                      "رقم الهوية",
                      "الجوال",
                      "الفرع",
                      "القسم",
                      "المسمى الوظيفي",
                      "الحالة",
                      "بطاقة الموظف"
                    ].map((header) => (
                      <TableCell
                        key={header}
                        align="right"
                        sx={{
                          bgcolor: "#f6faf8",
                          color: primaryDark,
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          fontSize: "0.75rem",
                          lineHeight: 1.3,
                          whiteSpace: "normal",
                          borderBottom:
                            "1px solid rgba(5,117,70,0.14)"
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {pagedEmployees.map((employee) => (
                    <TableRow
                      key={
                        employee?.employeeGuid ||
                        employee?.employeeId
                      }
                      hover
                      sx={{
                        "&:last-child td": {
                          borderBottom: 0
                        }
                      }}
                    >
                      <TableCell align="center">
                        <EmployeeAvatar
                          employee={employee}
                          size={38}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 800,
                            fontSize: ".76rem",
                            lineHeight: 1.45,
                            color: "#17261f",
                            width: "100%",
                            whiteSpace: "normal",
                            overflowWrap: "anywhere"
                          }}
                        >
                          {employee?.fullName || "بدون اسم"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <bdi dir="ltr">{employee?.nationalId || "-"}</bdi>
                      </TableCell>

                      <TableCell align="center">
                        <bdi dir="ltr">{employee?.mobile || "-"}</bdi>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          sx={{
                            width: "100%",
                            fontFamily: "Cairo",
                            fontSize: "0.75rem",
                            lineHeight: 1.45,
                            textAlign: PAGE_TEXT_ALIGN,
                            mx: "auto",
                            whiteSpace: "normal",
                            overflowWrap: "anywhere"
                          }}
                        >
                          {employee?.branchName ||
                            "غير محدد"}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          sx={{
                            width: "100%",
                            fontFamily: "Cairo",
                            fontSize: "0.75rem",
                            lineHeight: 1.45,
                            whiteSpace: "normal",
                            overflowWrap: "anywhere"
                          }}
                        >
                          {employee?.departmentName ||
                            "غير محدد"}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          size="small"
                          icon={<BadgeIcon />}
                          label={
                            employee?.jobTitle ||
                            "غير محدد"
                          }
                          sx={[hrChipSx("small"), {
                            maxWidth: "100%",
                            height: "auto",
                            fontFamily: "Cairo",
                            bgcolor: "#f5f7f6",
                            "& .MuiChip-label": {
                              display: "block",
                              px: .7,
                              py: .25,
                              whiteSpace: "normal",
                              lineHeight: 1.35,
                              fontSize: "0.75rem"
                            },
                            "& .MuiChip-icon": {
                              fontSize: 15
                            }
                          }]}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={
                            employee?.statusName ||
                            (employee?.isActive
                              ? "نشط"
                              : "غير نشط")
                          }
                          color={
                            employee?.isActive
                              ? "success"
                              : "default"
                          }
                          variant={
                            employee?.isActive
                              ? "filled"
                              : "outlined"
                          }
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 800
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="بطاقة الموظف">
                          <IconButton
                            size="small"
                            onClick={() =>
                              openEmployeeCard(employee)
                            }
                            sx={{
                              color: primaryColor,
                              bgcolor: primaryLight,
                              border:
                                "1px solid rgba(5,117,70,0.10)",
                              "&:hover": {
                                bgcolor: "#d9eee5"
                              }
                            }}
                          >
                            <VisibilityOutlinedIcon
                              sx={{ fontSize: 18 }}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && employees.length > 0 && (
            <>
              <Divider />

              <Stack
                direction={{
                  xs: "column",
                  sm: "row"
                }}
                spacing={1.5}
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 2 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontFamily: "Cairo"
                  }}
                >
                  عرض{" "}
                  {(page - 1) * pageSize + 1}
                  {" - "}
                  {Math.min(
                    page * pageSize,
                    employees.length
                  )}{" "}
                  من {employees.length}
                </Typography>

                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, value) =>
                    setPage(value)
                  }
                  color="primary"
                  shape="rounded"
                  siblingCount={isMobile ? 0 : 1}
                />
              </Stack>
            </>
          )}
        </Paper>


        <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
          disablePortal
          disableEnforceFocus
          dir={EMPLOYEE_DIALOG_DIRECTION}
          open={employeeCardOpen}
          onClose={closeEmployeeCard}
          maxWidth={false}
          fullWidth
          TransitionProps={{ timeout: 300 }}
          PaperProps={{
            dir: EMPLOYEE_DIALOG_DIRECTION,
            sx: {
              direction: EMPLOYEE_DIALOG_DIRECTION,
              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
              width: {
                xs: "calc(100% - 4px)",
                sm: "calc(100% - 14px)",
                md: "min(98vw, 1560px)"
              },
              maxWidth: {
                xs: "calc(100% - 4px)",
                sm: "calc(100% - 14px)",
                md: "1560px"
              },
              height: {
                xs: "98dvh",
                sm: "96dvh"
              },
              maxHeight: {
                xs: "98dvh",
                sm: "96dvh"
              },
              m: { xs: .35, sm: .8 },
              borderRadius: {
                xs: 2.4,
                sm: 3.6
              },
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: "#f8fcfa",
              boxShadow:
                "0 28px 90px rgba(9,45,31,.30)",
              animation:
                "dialogPop .38s cubic-bezier(.16,1,.3,1) both",
              transition:
                "width .28s ease, height .28s ease, border-radius .28s ease, box-shadow .28s ease",
              [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
                width: "min(98vw, 1680px)",
                maxWidth: "1680px",
                height: "96vh",
                maxHeight: "96vh",
                borderRadius: 4.4
              }
            }
          }}
        >
          {/* رأس البروفايل */}
          <DialogTitle
            sx={{
              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
              px: {
                xs: 1,
                sm: 1.6,
                lg: 2.2
              },
              py: {
                xs: .9,
                sm: 1.2,
                lg: 1.5
              },
              background: isDark ? darkSection : "linear-gradient(135deg,#ffffff,#f2faf6)",
              borderBottom:
                "1px solid rgba(5,117,70,.09)"
            }}
          >
            <Box
              dir={EMPLOYEE_DIALOG_DIRECTION}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.2,
                width: "100%",
                direction: EMPLOYEE_DIALOG_DIRECTION
              }}
            >
              {/* عنوان ملف الموظف يتبع اتجاه Dialog الموظف */}
              <Box
                sx={{
                  minWidth: 0,
                  textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 1000,
                    color: primaryDark,
                    fontSize: {
                      xs: ".92rem",
                      sm: "1.08rem",
                      lg: "1.22rem"
                    },
                    textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                  }}
                >
                  ملف الموظف
                </Typography>

                <Typography
                  sx={{
                    mt: .1,
                    fontFamily: "Cairo",
                    color: "#78877f",
                    fontSize: {
                      xs: "0.75rem",
                      sm: "0.75rem",
                      lg: "0.75rem"
                    },
                    textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                  }}
                >
                  الملف الوظيفي والبيانات الشخصية والمرفقات وسجل التعديلات
                </Typography>
              </Box>

              {/* زر الإغلاق في الجهة المقابلة وفق اتجاه Dialog الموظف */}
              <IconButton
                onClick={closeEmployeeCard}
                disabled={
                  savingEmployee ||
                  profileSaving ||
                  documentUploading
                }
                sx={{
                  width: {
                    xs: 34,
                    sm: 39
                  },
                  height: {
                    xs: 34,
                    sm: 39
                  },
                  bgcolor: "#eff4f1",
                  color: "#738079",
                  "&:hover": {
                    bgcolor: "#e5ece8",
                    transform: "rotate(5deg)"
                  },
                  transition: "all .2s ease"
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent
            dir={EMPLOYEE_DIALOG_DIRECTION}
            sx={{
              direction: EMPLOYEE_DIALOG_DIRECTION,
              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              p: {
                xs: .55,
                sm: .8,
                lg: 1.05
              },
              background: isDark ? darkSection : "radial-gradient(circle at 15% 0%, rgba(5,117,70,.045), transparent 28%), linear-gradient(180deg,#f7fbf9 0%,#f2f8f5 100%)",
              "& .MuiButton-root": {
                fontFamily: "Cairo",
                textTransform: "none"
              },
              "& .MuiInputBase-root": {
                fontFamily: "Cairo"
              },
              "& .MuiInputBase-input, & .MuiSelect-select, & .MuiInputLabel-root": {
                textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
              }
            }}
          >
            {selectedEmployee && (
              <Stack spacing={{ xs: .8, sm: 1 }}>
                {/* Hero */}
                <Paper
                  elevation={0}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: {
                      xs: 2.8,
                      sm: 3.5
                    },
                    px: {
                      xs: 1,
                      sm: 1.6,
                      lg: 2
                    },
                    py: {
                      xs: 1,
                      sm: 1.35,
                      lg: 1.6
                    },
                    color: "#fff",
                    background: isDark ? darkSection : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                    boxShadow:
                      "0 18px 46px rgba(5,117,70,.20)",
                    animation: "cardReveal .42s cubic-bezier(.16,1,.3,1) both",
                    "&:before": {
                      content: '""',
                      position: "absolute",
                      width: 180,
                      height: 180,
                      borderRadius: "50%",
                      top: -110,
                      insetInlineStart: -45,
                      background:
                        "rgba(255,255,255,.09)"
                    },
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      width: 130,
                      height: 130,
                      borderRadius: "50%",
                      bottom: -85,
                      insetInlineEnd: -25,
                      background:
                        "rgba(255,255,255,.055)"
                    }
                  }}
                >
                  <Stack
                    dir={EMPLOYEE_DIALOG_DIRECTION}
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    spacing={{ xs: .75, sm: 1.2 }}
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      direction: EMPLOYEE_DIALOG_DIRECTION
                    }}
                  >
                    {/* هوية الموظف تتبع اتجاه Dialog الموظف */}
                    <Stack
                      direction="row"
                      spacing={{ xs: .8, sm: 1.1 }}
                      alignItems="center"
                      sx={{
                        minWidth: 0,
                        flex: 1,
                        direction: EMPLOYEE_DIALOG_DIRECTION
                      }}
                    >
                      <EmployeeAvatar
                        employee={selectedEmployee}
                        size={
                          isPhone
                            ? 50
                            : 70
                        }
                        ring
                      />

                                            <Box
                        sx={{
                          minWidth: 0,
                          textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 1000,
                            fontSize: {
                              xs: ".92rem",
                              sm: "1.05rem",
                              lg: "1.12rem"
                            },
                            lineHeight: 1.45
                          }}
                        >
                          {selectedEmployee?.fullName ||
                            "بدون اسم"}
                        </Typography>

                        <Typography
                          sx={{
                            mt: .18,
                            fontFamily: "Cairo",
                            fontSize: {
                              xs: "0.75rem",
                              sm: "0.75rem"
                            },
                            fontWeight: 700,
                            opacity: .9
                          }}
                        >
                          {selectedEmployee?.jobTitle ||
                            "غير محدد"}
                          {" • "}
                          {selectedEmployee?.departmentName ||
                            "غير محدد"}
                        </Typography>

                        <Typography
                          sx={{
                            mt: .15,
                            fontFamily: "Cairo",
                            fontSize: {
                              xs: "0.75rem",
                              sm: "0.75rem"
                            },
                            opacity: .76,
                            maxWidth: {
                              xs: 260,
                              sm: 440
                            }
                          }}
                        >
                          {selectedEmployee?.branchName ||
                            "غير محدد"}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* الحالة والكود في الجهة المقابلة وفق اتجاه Dialog الموظف */}
                    <Stack
                      direction="row"
                      spacing={.55}
                      alignItems="center"
                      sx={{
                        alignSelf: { xs: "flex-start", sm: "center" },
                        direction: EMPLOYEE_DIALOG_DIRECTION
                      }}
                    >
                      <Chip
                        label={
                          selectedEmployee?.isActive
                            ? "موظف نشط"
                            : "غير نشط"
                        }
                        size="small"
                        sx={{
                          height: 25,
                          bgcolor:
                            "rgba(255,255,255,.15)",
                          color: "#fff",
                          border:
                            "1px solid rgba(255,255,255,.18)",
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          fontSize: "0.75rem"
                        }}
                      />

                      <Chip
                        label={
                          selectedEmployee?.employeeCode
                            ? `#${selectedEmployee.employeeCode}`
                            : "بدون كود"
                        }
                        size="small"
                        sx={{
                          height: 25,
                          bgcolor:
                            "rgba(255,255,255,.10)",
                          color: "#fff",
                          fontFamily: "Cairo",
                          fontWeight: 800,
                          fontSize: "0.75rem"
                        }}
                      />
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      mt: { xs: .9, sm: 1.2 },
                      pt: { xs: .8, sm: 1 },
                      borderTop: "1px solid rgba(255,255,255,.13)",
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(2,minmax(0,1fr))",
                        sm: "repeat(4,minmax(0,1fr))"
                      },
                      gap: { xs: .55, sm: .8 }
                    }}
                  >
                    {[
                      { label: "كود الموظف", value: selectedEmployee?.employeeCode || "-" },
                      { label: "الجوال", value: selectedEmployee?.mobile || "-" },
                      { label: "القسم", value: selectedEmployee?.departmentName || "-" },
                      { label: "الفرع", value: selectedEmployee?.branchName || "-" }
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          minWidth: 0,
                          px: { xs: .7, sm: .9 },
                          py: { xs: .55, sm: .7 },
                          borderRadius: 2.2,
                          bgcolor: "rgba(255,255,255,.09)",
                          border: "1px solid rgba(255,255,255,.12)",
                          backdropFilter: "blur(4px)",
                          transition: "transform .2s ease, background .2s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            bgcolor: "rgba(255,255,255,.13)"
                          }
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontSize: { xs: "0.75rem", sm: "0.75rem" },
                            opacity: .72,
                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            mt: .12,
                            fontFamily: "Cairo",
                            fontSize: { xs: "0.75rem", sm: "0.75rem" },
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Tabs */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2.7,
                    border:
                      "1px solid rgba(5,117,70,.09)",
                    overflow: "hidden",
                    bgcolor: "rgba(255,255,255,.96)",
                    position: "sticky",
                    top: 0,
                    zIndex: 12,
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 24px rgba(9,45,31,.06)"
                  }}
                >
                  <Tabs
                    dir={EMPLOYEE_DIALOG_DIRECTION}
                    value={profileTab}
                    onChange={(_, value) => {
                      setProfileTab(value);
                      setEditMode(false);
                      setProfileEditMode(false);
                    }}
                    variant={isPhone ? "scrollable" : "fullWidth"}
                    scrollButtons={isPhone ? "auto" : false}
                    sx={{
                      direction: EMPLOYEE_DIALOG_DIRECTION,
                      minHeight: { xs: 40, sm: 44 },
                      "& .MuiTabs-indicator": {
                        height: 3,
                        borderRadius: "3px 3px 0 0",
                        bgcolor: primaryColor
                      },
                      "& .MuiTab-root": {
                        minHeight: { xs: 40, sm: 44 },
                        minWidth: isPhone ? 94 : 0,
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.75rem"
                        },
                        color: "#697870",
                        gap: .5
                      },
                      "& .Mui-selected": {
                        color:
                          `${primaryColor} !important`
                      }
                    }}
                  >
                    <Tab sx={hrTabIconSx}
                      icon={
                        <InfoOutlinedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label="البيانات الأساسية"
                    />
                    <Tab sx={hrTabIconSx}
                      icon={
                        <PersonOutlineRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label="البيانات الشخصية"
                    />
                    <Tab sx={hrTabIconSx}
                      icon={
                        <FolderOpenRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label={`المرفقات (${documents.length})`}
                    />
                    <Tab sx={hrTabIconSx}
                      icon={
                        <DescriptionOutlinedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label="العقد الوظيفي"
                    />
                    <Tab sx={hrTabIconSx}
                      icon={
                        <TrendingUpRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label="الترقيات والمسميات السابقة"
                    />
                    <Tab sx={hrTabIconSx}
                      icon={
                        <AccessTimeRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label="الحضور والانصراف"
                    />
                    <Tab sx={hrTabIconSx}
                      icon={
                        <EventNoteRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label="الإجازات"
                    />
                    <Tab sx={hrTabIconSx}
                      icon={
                        <HistoryRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      }
                      iconPosition="start"
                      label="سجل التعديلات"
                    />
                  </Tabs>
                </Paper>

                {/* =========================
                    TAB 0 - البيانات الأساسية
                ========================== */}
                {profileTab === 0 && (
                  <Box
                    sx={{
                      animation:
                        "fadeSlide .25s ease both"
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: {
                          xs: .8,
                          sm: 1.1,
                          lg: 1.3
                        },
                        borderRadius: 3,
                        border:
                          "1px solid rgba(5,117,70,.09)",
                        bgcolor: isDark ? darkCard : "#fff"
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1, direction: EMPLOYEE_DIALOG_DIRECTION }}
                      >
                        {/* العنوان في جهة البداية (يمين) والإجراء في أقصى اليسار */}
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 1000,
                            color: primaryDark,
                            fontSize: {
                              xs: ".78rem",
                              sm: ".9rem"
                            },
                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                          }}
                        >
                          البيانات الأساسية
                        </Typography>

                        {!editMode ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={
                              <EditOutlinedIcon />
                            }
                            onClick={startEditingEmployee}
                            sx={uiLayout.withUiSx({
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              color: primaryColor,
                              borderColor:
                                "rgba(5,117,70,.25)",
                              borderRadius: 2.2
                            }, uiLayout.buttonSx)}
                          >
                            تعديل البيانات
                          </Button>
                        ) : (
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontSize: "0.75rem",
                              color: "#718078",
                              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                            }}
                          >
                            عدّل البيانات ثم اضغط حفظ
                          </Typography>
                        )}
                      </Stack>

                      {employeeSaveError && (
                        <Alert
                          severity="error"
                          sx={{
                            mb: 1,
                            borderRadius: 2,
                            fontFamily: "Cairo"
                          }}
                        >
                          {employeeSaveError}
                        </Alert>
                      )}

                      {editMode ? (
                        <>
                          <Box
                            sx={uiLayout.withUiSx([EMPLOYEE_DIALOG_FIELD_GAP, EMPLOYEE_DIALOG_FIELD_SX, {
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm:
                                  "repeat(2,minmax(0,1fr))"
                              },
                              "& .MuiInputBase-input": {
                                textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                              },
                              "& .MuiSelect-select": {
                                textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                              }
                            }], uiLayout.formSectionSx)}
                          >
                            <TextField InputLabelProps={{ shrink: true }}
                              size="small"
                              label="اسم الموظف"
                              value={editForm.fullName}
                              onChange={(event) =>
                                handleEditField(
                                  "fullName",
                                  event.target.value
                                )
                              }
                              sx={uiLayout.withUiSx({
                                gridColumn: "1 / -1"
                              }, uiLayout.formFieldSx)}
                            />

                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                              size="small"
                              label="رقم الهوية"
                              value={editForm.nationalId}
                              onChange={(event) =>
                                handleEditField(
                                  "nationalId",
                                  event.target.value
                                )
                              }
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                              size="small"
                              label="الجوال"
                              value={editForm.mobile}
                              onChange={(event) =>
                                handleEditField(
                                  "mobile",
                                  event.target.value
                                )
                              }
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                              size="small"
                              label="الجوال الإضافي"
                              value={editForm.mobile2}
                              onChange={(event) =>
                                handleEditField(
                                  "mobile2",
                                  event.target.value
                                )
                              }
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                              size="small"
                              label="البريد الإلكتروني"
                              value={editForm.email}
                              onChange={(event) =>
                                handleEditField(
                                  "email",
                                  event.target.value
                                )
                              }
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <TextField InputLabelProps={{ shrink: true }}
                              size="small"
                              label="IBAN"
                              value={editForm.iban}
                              onChange={(event) =>
                                handleEditField(
                                  "iban",
                                  event.target.value
                                )
                              }
                              sx={uiLayout.withUiSx({
                                gridColumn: "1 / -1"
                              }, uiLayout.formFieldSx)}
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <FormControl sx={uiLayout.formFieldSx}
                              size="small"
                              fullWidth
                            >
                              <InputLabel>
                                المؤهل
                              </InputLabel>
                              <Select
                                MenuProps={RTL_MENU_PROPS}
                                label="المؤهل"
                                value={editForm.educationLevel}
                                onChange={(event) =>
                                  handleEditField(
                                    "educationLevel",
                                    event.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  غير محدد
                                </MenuItem>
                                {EDUCATION_LEVEL_OPTIONS.map((item) => (
                                  <MenuItem
                                    key={item.value}
                                    value={item.value}
                                  >
                                    {item.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <TextField
                              sx={uiLayout.formFieldSx}
                              InputLabelProps={{ shrink: true }}
                              size="small"
                              label="التخصص"
                              placeholder="اكتب التخصص"
                              value={editForm.specialization}
                              onChange={(event) =>
                                handleEditField(
                                  "specialization",
                                  event.target.value
                                )
                              }
                              inputProps={{
                                dir: "rtl",
                                maxLength: 200
                              }}
                            />

                            <FormControl sx={uiLayout.formFieldSx}
                              size="small"
                              fullWidth
                            >
                              <InputLabel>
                                نوع الدوام
                              </InputLabel>
                              <Select
                  MenuProps={RTL_MENU_PROPS}
                                label="نوع الدوام"
                                value={editForm.workType}
                                onChange={(event) =>
                                  handleEditField(
                                    "workType",
                                    event.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  غير محدد
                                </MenuItem>
                                <MenuItem value={1}>
                                  دوام كلي
                                </MenuItem>
                                <MenuItem value={2}>
                                  دوام جزئي
                                </MenuItem>
                              </Select>
                            </FormControl>

                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                              size="small"
                              type="number"
                              label="ساعات الدوام اليومية"
                              value={editForm.dailyWorkingHours}
                              onChange={(event) =>
                                handleEditField(
                                  "dailyWorkingHours",
                                  event.target.value
                                )
                              }
                              inputProps={{
                                min: 0.5,
                                max: 24,
                                step: 0.5
                              , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                            />

                            <FormControl
                              size="small"
                              fullWidth
                              sx={uiLayout.withUiSx({
                                gridColumn: {
                                  xs: "auto",
                                  sm: "1 / -1"
                                }
                              }, uiLayout.formFieldSx)}
                            >
                              <InputLabel>
                                الفرع
                              </InputLabel>
                              <Select
                  MenuProps={RTL_MENU_PROPS}
                                label="الفرع"
                                value={editForm.branchGuid}
                                onChange={(event) =>
                                  handleEditField(
                                    "branchGuid",
                                    event.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  غير محدد
                                </MenuItem>
                                {employeeEditLookups.branches.map(
                                  (branch) => (
                                    <MenuItem
                                      key={branch?.guid}
                                      value={
                                        branch?.guid || ""
                                      }
                                    >
                                      {branch?.name ||
                                        "غير محدد"}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            </FormControl>

                            <FormControl sx={uiLayout.formFieldSx}
                              size="small"
                              fullWidth
                            >
                              <InputLabel>
                                القسم
                              </InputLabel>
                              <Select
                  MenuProps={RTL_MENU_PROPS}
                                label="القسم"
                                value={
                                  editForm.departmentGuid
                                }
                                onChange={(event) =>
                                  handleEditField(
                                    "departmentGuid",
                                    event.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  غير محدد
                                </MenuItem>
                                {employeeEditLookups.departments.map(
                                  (department) => (
                                    <MenuItem
                                      key={
                                        department?.guid ||
                                        department?.id
                                      }
                                      value={
                                        department?.guid ||
                                        ""
                                      }
                                    >
                                      {department?.name ||
                                        "غير محدد"}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            </FormControl>

                            <FormControl sx={uiLayout.formFieldSx}
                              size="small"
                              fullWidth
                            >
                              <InputLabel>
                                المسمى الوظيفي
                              </InputLabel>
                              <Select
                  MenuProps={RTL_MENU_PROPS}
                                label="المسمى الوظيفي"
                                value={editForm.jobCode}
                                onChange={(event) =>
                                  handleEditField(
                                    "jobCode",
                                    event.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  غير محدد
                                </MenuItem>
                                {employeeEditLookups.jobs.map(
                                  (job) => (
                                    <MenuItem
                                      key={job?.code}
                                      value={job?.code}
                                    >
                                      {job?.name}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            </FormControl>

                            <FormControl sx={uiLayout.formFieldSx}
                              size="small"
                              fullWidth
                            >
                              <InputLabel>
                                الحالة
                              </InputLabel>
                              <Select
                  MenuProps={RTL_MENU_PROPS}
                                label="الحالة"
                                value={
                                  editForm.isActive
                                    ? "true"
                                    : "false"
                                }
                                onChange={(event) =>
                                  handleEditField(
                                    "isActive",
                                    event.target.value ===
                                      "true"
                                  )
                                }
                              >
                                <MenuItem value="true">
                                  نشط
                                </MenuItem>
                                <MenuItem value="false">
                                  غير نشط
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Box>

                          <Stack
                            direction="row"
                            spacing={.8}
                            justifyContent="flex-start"
                            sx={uiLayout.withUiSx({
                              mt: {
                                xs: 1,
                                sm: 1.4
                              },
                              pt: 1,
                              borderTop:
                                "1px solid rgba(5,117,70,.08)"
                            }, uiLayout.actionBarSx)}
                          >
                            <Button
                              variant="contained"
                              startIcon={
                                savingEmployee
                                  ? (
                                    <CircularProgress
                                      size={15}
                                      sx={{
                                        color: "#fff"
                                      }}
                                    />
                                  )
                                  : (
                                    <SaveOutlinedIcon />
                                  )
                              }
                              onClick={
                                saveEmployeeChanges
                              }
                              disabled={savingEmployee}
                              sx={uiLayout.withUiSx({
                                minHeight: 40,
                                px: 2,
                                borderRadius: 2.2,
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                bgcolor: primaryColor,
                                "&:hover": {
                                  bgcolor: primaryDark
                                }
                              }, uiLayout.buttonSx)}
                            >
                              {savingEmployee
                                ? "جاري الحفظ..."
                                : "حفظ التعديلات"}
                            </Button>

                            <Button
                              variant="outlined"
                              startIcon={
                                <CancelOutlinedIcon />
                              }
                              onClick={
                                cancelEditingEmployee
                              }
                              disabled={savingEmployee}
                              sx={uiLayout.withUiSx({
                                minHeight: 40,
                                borderRadius: 2.2,
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                color: accentColor,
                                borderColor:
                                  "rgba(174,30,33,.28)"
                              }, uiLayout.buttonSx)}
                            >
                              إلغاء
                            </Button>
                          </Stack>
                        </>
                      ) : (
                        <Box
                          sx={{
                            display: "grid",
                            direction: EMPLOYEE_DIALOG_DIRECTION,
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "repeat(2,minmax(0,1fr))",
                              md: "repeat(3,minmax(0,1fr))"
                            },
                            gap: {
                              xs: .55,
                              sm: .7
                            }
                          }}
                        >
                          <EmployeeDetail ltr
                            label="كود الموظف"
                            value={
                              selectedEmployee?.employeeCode
                            }
                          />
                          <EmployeeDetail ltr
                            label="رقم الهوية"
                            value={
                              selectedEmployee?.nationalId
                            }
                          />
                          <EmployeeDetail ltr
                            label="الجوال"
                            value={
                              selectedEmployee?.mobile
                            }
                          />
                          <EmployeeDetail ltr
                            label="الجوال الإضافي"
                            value={
                              selectedEmployee?.mobile2
                            }
                          />
                          <EmployeeDetail ltr
                            label="البريد الإلكتروني"
                            value={
                              selectedEmployee?.email
                            }
                          />
                          <EmployeeDetail ltr
                            label="IBAN"
                            value={
                              selectedEmployee?.iban
                            }
                          />
                          <EmployeeDetail
                            label="المؤهل"
                            value={
                              selectedEmployee?.educationLevelName ||
                              getEducationLevelName(
                                selectedEmployee?.educationLevel
                              )
                            }
                          />
                          <EmployeeDetail
                            label="التخصص"
                            value={
                              selectedEmployee?.specialization ||
                              "غير محدد"
                            }
                          />
                          <EmployeeDetail
                            label="نوع الدوام"
                            value={
                              selectedEmployee?.workTypeName ||
                              (
                                selectedEmployee?.workType === 1
                                  ? "دوام كلي"
                                  : selectedEmployee?.workType === 2
                                    ? "دوام جزئي"
                                    : "غير محدد"
                              )
                            }
                          />
                          <EmployeeDetail
                            label="ساعات الدوام اليومية"
                            value={
                              selectedEmployee?.dailyWorkingHours !== null &&
                              selectedEmployee?.dailyWorkingHours !== undefined
                                ? `${selectedEmployee.dailyWorkingHours} ساعة`
                                : "غير محدد"
                            }
                          />
                          <EmployeeDetail
                            label="الفرع"
                            value={
                              selectedEmployee?.branchName
                            }
                            wide
                          />
                          <EmployeeDetail
                            label="القسم"
                            value={
                              selectedEmployee?.departmentName
                            }
                          />
                          <EmployeeDetail
                            label="المسمى الوظيفي"
                            value={
                              selectedEmployee?.jobTitle
                            }
                          />
                        </Box>
                      )}
                    </Paper>
                  </Box>
                )}

                {/* =========================
                    TAB 1 - البيانات الشخصية
                ========================== */}
                {profileTab === 1 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: {
                        xs: .8,
                        sm: 1.1,
                        lg: 1.3
                      },
                      borderRadius: 3,
                      border:
                        "1px solid rgba(5,117,70,.09)",
                      bgcolor: isDark ? darkCard : "#fff",
                      animation:
                        "fadeSlide .25s ease both"
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 1, direction: EMPLOYEE_DIALOG_DIRECTION }}
                    >
                      {/* العنوان في جهة البداية (يمين) والإجراء في أقصى اليسار */}
                      <Stack
                        direction="row"
                        spacing={.5}
                        alignItems="center"
                      >
                        <ContactEmergencyOutlinedIcon
                          sx={{
                            color: primaryColor,
                            fontSize: 19
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 1000,
                            color: primaryDark,
                            fontSize: {
                              xs: ".78rem",
                              sm: ".9rem"
                            },
                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                          }}
                        >
                          البيانات الشخصية
                        </Typography>
                      </Stack>

                      {!profileEditMode ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={
                            <EditOutlinedIcon />
                          }
                          onClick={() => {
                            fillProfileForm(
                              profileData || {}
                            );
                            setProfileEditMode(true);
                          }}
                          disabled={profileLoading}
                          sx={uiLayout.withUiSx({
                            fontFamily: "Cairo",
                            fontWeight: 900,
                            color: primaryColor,
                            borderColor:
                              "rgba(5,117,70,.25)"
                          }, uiLayout.buttonSx)}
                        >
                          تعديل البيانات
                        </Button>
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontSize: "0.75rem",
                            color: "#718078",
                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                          }}
                        >
                          البيانات هنا امتداد لملف الموظف
                        </Typography>
                      )}
                    </Stack>

                    {profileLoading ? (
                      <Box
                        sx={{
                          minHeight: 220,
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        <CircularProgress
                          size={34}
                          sx={{
                            color: primaryColor
                          }}
                        />
                      </Box>
                    ) : profileEditMode ? (
                      <>
                        <Box
                          sx={uiLayout.withUiSx([EMPLOYEE_DIALOG_FIELD_GAP, EMPLOYEE_DIALOG_FIELD_SX, {
                            display: "grid",
                            direction: EMPLOYEE_DIALOG_DIRECTION,
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm:
                                "repeat(2,minmax(0,1fr))"
                            },
                            "& .MuiInputBase-input": {
                              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                            },
                            "& .MuiSelect-select": {
                              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                            }
                          }], uiLayout.formSectionSx)}
                        >
                          <TextField sx={uiLayout.formFieldSx}
                            size="small"
                            type="date"
                            label="تاريخ الميلاد"
                            value={profileForm.birthDate}
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                birthDate:
                                  e.target.value
                              }))
                            }
                            InputLabelProps={{
                              shrink: true
                            }}
                           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                            size="small"
                            label="الجنسية"
                            value={
                              profileForm.nationality
                            }
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                nationality:
                                  e.target.value
                              }))
                            }
                          />

                          <FormControl sx={uiLayout.formFieldSx}
                            size="small"
                            fullWidth
                          >
                            <InputLabel>
                              الجنس
                            </InputLabel>
                            <Select
                  MenuProps={RTL_MENU_PROPS}
                              label="الجنس"
                              value={profileForm.gender}
                              onChange={(e) =>
                                setProfileForm((c) => ({
                                  ...c,
                                  gender:
                                    e.target.value
                                }))
                              }
                            >
                              <MenuItem value="">
                                غير محدد
                              </MenuItem>
                              {(lookups.genders.length
                                ? lookups.genders
                                : [
                                    {
                                      value: 1,
                                      name: "ذكر"
                                    },
                                    {
                                      value: 2,
                                      name: "أنثى"
                                    }
                                  ]
                              ).map((item) => (
                                <MenuItem
                                  key={item.value}
                                  value={item.value}
                                >
                                  {item.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl sx={uiLayout.formFieldSx}
                            size="small"
                            fullWidth
                          >
                            <InputLabel>
                              الحالة الاجتماعية
                            </InputLabel>
                            <Select
                  MenuProps={RTL_MENU_PROPS}
                              label="الحالة الاجتماعية"
                              value={
                                profileForm.maritalStatus
                              }
                              onChange={(e) =>
                                setProfileForm((c) => ({
                                  ...c,
                                  maritalStatus:
                                    e.target.value
                                }))
                              }
                            >
                              <MenuItem value="">
                                غير محدد
                              </MenuItem>
                              {(lookups.maritalStatuses
                                .length
                                ? lookups.maritalStatuses
                                : []
                              ).map((item) => (
                                <MenuItem
                                  key={item.value}
                                  value={item.value}
                                >
                                  {item.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                            size="small"
                            label="مدينة السكن"
                            value={profileForm.city}
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                city: e.target.value
                              }))
                            }
                          />

                          <TextField InputLabelProps={{ shrink: true }}
                            size="small"
                            label="العنوان"
                            value={profileForm.address}
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                address:
                                  e.target.value
                              }))
                            }
                            sx={uiLayout.withUiSx({
                              gridColumn: {
                                xs: "auto",
                                sm: "1 / -1"
                              }
                            }, uiLayout.formFieldSx)}
                          />

                          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                            size="small"
                            label="اسم شخص الطوارئ"
                            value={
                              profileForm.emergencyContactName
                            }
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                emergencyContactName:
                                  e.target.value
                              }))
                            }
                          />

                          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                            size="small"
                            label="جوال الطوارئ"
                            value={
                              profileForm.emergencyContactPhone
                            }
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                emergencyContactPhone:
                                  e.target.value
                              }))
                            }
                          />

                          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                            size="small"
                            label="صلة القرابة"
                            value={
                              profileForm.emergencyContactRelation
                            }
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                emergencyContactRelation:
                                  e.target.value
                              }))
                            }
                          />

                          <TextField InputLabelProps={{ shrink: true }}
                            size="small"
                            multiline
                            minRows={2}
                            label="ملاحظات"
                            value={profileForm.notes}
                            onChange={(e) =>
                              setProfileForm((c) => ({
                                ...c,
                                notes: e.target.value
                              }))
                            }
                            sx={uiLayout.withUiSx({
                              gridColumn: "1 / -1"
                            }, uiLayout.formFieldSx)}
                          />
                        </Box>

                        <Stack
                          direction="row"
                          spacing={.8}
                          sx={uiLayout.withUiSx({
                            mt: 1.2,
                            pt: 1,
                            borderTop:
                              "1px solid rgba(5,117,70,.08)"
                          }, uiLayout.actionBarSx)}
                        >
                          <Button
                            variant="contained"
                            startIcon={
                              profileSaving
                                ? (
                                  <CircularProgress
                                    size={15}
                                    sx={{
                                      color: "#fff"
                                    }}
                                  />
                                )
                                : (
                                  <SaveOutlinedIcon />
                                )
                            }
                            onClick={
                              saveEmployeeProfile
                            }
                            disabled={profileSaving}
                            sx={uiLayout.withUiSx({
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              bgcolor: primaryColor,
                              "&:hover": {
                                bgcolor: primaryDark
                              }
                            }, uiLayout.buttonSx)}
                          >
                            {profileSaving
                              ? "جاري الحفظ..."
                              : "حفظ البيانات"}
                          </Button>

                          <Button
                            variant="outlined"
                            onClick={() => {
                              fillProfileForm(
                                profileData || {}
                              );
                              setProfileEditMode(false);
                            }}
                            disabled={profileSaving}
                            sx={uiLayout.withUiSx({
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              color: accentColor,
                              borderColor:
                                "rgba(174,30,33,.28)"
                            }, uiLayout.buttonSx)}
                          >
                            إلغاء
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <Box
                        sx={{
                          display: "grid",
                          direction: EMPLOYEE_DIALOG_DIRECTION,
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2,minmax(0,1fr))",
                            md: "repeat(3,minmax(0,1fr))"
                          },
                          gap: {
                            xs: .55,
                            sm: .7
                          }
                        }}
                      >
                        <EmployeeDetail
                          label="تاريخ الميلاد"
                          value={
                            profileData?.birthDate
                              ? String(
                                  profileData.birthDate
                                ).slice(0, 10)
                              : "-"
                          }
                        />
                        <EmployeeDetail
                          label="الجنسية"
                          value={
                            profileData?.nationality
                          }
                        />
                        <EmployeeDetail
                          label="الجنس"
                          value={
                            lookups.genders.find(
                              (x) =>
                                Number(x.value) ===
                                Number(
                                  profileData?.gender
                                )
                            )?.name || "غير محدد"
                          }
                        />
                        <EmployeeDetail
                          label="الحالة الاجتماعية"
                          value={
                            lookups.maritalStatuses.find(
                              (x) =>
                                Number(x.value) ===
                                Number(
                                  profileData?.maritalStatus
                                )
                            )?.name || "غير محدد"
                          }
                        />
                        <EmployeeDetail
                          label="مدينة السكن"
                          value={profileData?.city}
                        />
                        <EmployeeDetail
                          label="العنوان"
                          value={profileData?.address}
                          wide
                        />
                        <EmployeeDetail
                          label="شخص الطوارئ"
                          value={
                            profileData?.emergencyContactName
                          }
                        />
                        <EmployeeDetail ltr
                          label="جوال الطوارئ"
                          value={
                            profileData?.emergencyContactPhone
                          }
                        />
                        <EmployeeDetail
                          label="صلة القرابة"
                          value={
                            profileData?.emergencyContactRelation
                          }
                        />
                        <EmployeeDetail
                          label="ملاحظات"
                          value={profileData?.notes}
                          wide
                        />
                      </Box>
                    )}
                  </Paper>
                )}

                {/* =========================
                    TAB 2 - المرفقات
                ========================== */}
                {profileTab === 2 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: {
                        xs: .8,
                        sm: 1.1,
                        lg: 1.3
                      },
                      borderRadius: 3,
                      border:
                        "1px solid rgba(5,117,70,.09)",
                      bgcolor: isDark ? darkCard : "#fff",
                      animation:
                        "fadeSlide .25s ease both"
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >

                        
                      <Box
                        sx={{
                          textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 1000,
                            color: primaryDark,
                            fontSize: ".88rem"
                          }}
                        >
                          مرفقات الموظف
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontSize: "0.75rem",
                            color: "#7b8982"
                          }}
                        >
                          مرفقات عامة فقط — العقد الوظيفي له مرفقاته المستقلة
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          <CloudUploadOutlinedIcon />
                        }
                        onClick={() =>
                          setDocumentUploadOpen(
                            (value) => !value
                          )
                        }
                        sx={uiLayout.withUiSx({
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          bgcolor: primaryColor,
                          "&:hover": {
                            bgcolor: primaryDark
                          }
                        }, uiLayout.buttonSx)}
                      >
                        إضافة مرفق
                      </Button>

                    </Stack>

                    <Collapse
                      in={documentUploadOpen}
                      timeout={250}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: {
                            xs: .8,
                            sm: 1
                          },
                          mb: 1,
                          borderRadius: 2.5,
                          bgcolor: "#f7fbf9",
                          border:
                            "1px dashed rgba(5,117,70,.24)"
                        }}
                      >
                        <Box
                          sx={uiLayout.withUiSx([EMPLOYEE_DIALOG_FIELD_GAP, EMPLOYEE_DIALOG_FIELD_SX, {
                            display: "grid",
                            direction: EMPLOYEE_DIALOG_DIRECTION,
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm:
                                "repeat(2,minmax(0,1fr))"
                            },
                            "& .MuiInputBase-input": {
                              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                            },
                            "& .MuiSelect-select": {
                              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                            }
                          }], uiLayout.filterBarSx)}
                        >
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={
                              <CloudUploadOutlinedIcon />
                            }
                            sx={uiLayout.withUiSx({
                              gridColumn: "1 / -1",
                              minHeight: 48,
                              justifyContent:
                                "space-between",
                              borderStyle: "dashed",
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              color: documentForm.file
                                ? primaryDark
                                : primaryColor,
                              borderColor:
                                "rgba(5,117,70,.28)"
                            }, uiLayout.buttonSx)}
                          >
                            {documentForm.file
                              ? documentForm.file.name
                              : "اختيار الملف من الجهاز"}

                            <input
                              hidden
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                              onChange={(event) =>
                                setDocumentForm(
                                  (current) => ({
                                    ...current,
                                    file:
                                      event.target
                                        .files?.[0] ||
                                      null
                                  })
                                )
                              }
                            />
                          </Button>

                          <FormControl sx={uiLayout.formFieldSx}
                            size="small"
                            fullWidth
                          >
                            <InputLabel>
                              نوع المرفق
                            </InputLabel>
                            <Select
                  MenuProps={RTL_MENU_PROPS}
                              label="نوع المرفق"
                              value={
                                documentForm.documentTypeCode
                              }
                              onChange={(e) =>
                                setDocumentForm(
                                  (current) => ({
                                    ...current,
                                    documentTypeCode:
                                      e.target.value
                                  })
                                )
                              }
                            >
                              <MenuItem value="">
                                مرفق عام
                              </MenuItem>
                              {lookups.documentTypes.map(
                                (type) => (
                                  <MenuItem
                                    key={type.code}
                                    value={type.code}
                                  >
                                    {type.name}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>

                          <TextField sx={uiLayout.formFieldSx}
                            size="small"
                            type="date"
                            label="تاريخ الإصدار"
                            value={
                              documentForm.issueDate
                            }
                            onChange={(e) =>
                              setDocumentForm(
                                (current) => ({
                                  ...current,
                                  issueDate:
                                    e.target.value
                                })
                              )
                            }
                            InputLabelProps={{
                              shrink: true
                            }}
                           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                          <TextField sx={uiLayout.formFieldSx}
                            size="small"
                            type="date"
                            label="تاريخ الانتهاء"
                            value={
                              documentForm.expiryDate
                            }
                            onChange={(e) =>
                              setDocumentForm(
                                (current) => ({
                                  ...current,
                                  expiryDate:
                                    e.target.value
                                })
                              )
                            }
                            InputLabelProps={{
                              shrink: true
                            }}
                           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                            size="small"
                            label="ملاحظات"
                            value={documentForm.notes}
                            onChange={(e) =>
                              setDocumentForm(
                                (current) => ({
                                  ...current,
                                  notes:
                                    e.target.value
                                })
                              )
                            }
                          />
                        </Box>

                        <Stack
                          direction="row"
                          spacing={.7}
                          sx={uiLayout.withUiSx({ mt: .9 }, uiLayout.actionBarSx)}
                        >
                          <Button
                            variant="contained"
                            onClick={
                              uploadEmployeeDocument
                            }
                            disabled={
                              documentUploading ||
                              !documentForm.file
                            }
                            startIcon={
                              documentUploading
                                ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{
                                      color: "#fff"
                                    }}
                                  />
                                )
                                : (
                                  <CloudUploadOutlinedIcon />
                                )
                            }
                            sx={uiLayout.withUiSx({
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              bgcolor: primaryColor,
                              "&:hover": {
                                bgcolor: primaryDark
                              }
                            }, uiLayout.buttonSx)}
                          >
                            {documentUploading
                              ? "جاري الرفع..."
                              : "رفع المرفق"}
                          </Button>

                          <Button
                            variant="text"
                            onClick={() =>
                              setDocumentUploadOpen(
                                false
                              )
                            }
                            sx={uiLayout.withUiSx({
                              fontFamily: "Cairo",
                              fontWeight: 800,
                              color: "#748079"
                            }, uiLayout.buttonSx)}
                          >
                            إلغاء
                          </Button>
                        </Stack>
                      </Paper>
                    </Collapse>

                    {documentsLoading ? (
                      <Box
                        sx={{
                          py: 6,
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        <CircularProgress
                          size={32}
                          sx={{ color: primaryColor }}
                        />
                      </Box>
                    ) : documents.length === 0 ? (
                      <Box
                        sx={{
                          minHeight: { xs: 230, sm: 300 },
                          display: "grid",
                          placeItems: "center",
                          textAlign: CENTER_TEXT_ALIGN,
                          borderRadius: 3,
                          background: isDark ? darkSection : "linear-gradient(180deg,#fbfefc,#f4faf7)",
                          border:
                            "1px dashed rgba(5,117,70,.16)"
                        }}
                      >
                        <Box>
                          <FolderOpenRoundedIcon
                            sx={{
                              fontSize: { xs: 46, sm: 58 },
                              color: "rgba(5,117,70,.22)"
                            }}
                          />
                          <Typography
                            sx={{
                              mt: .6,
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              color: "#58675f",
                              fontSize: { xs: ".76rem", sm: ".86rem" }
                            }}
                          >
                            لا توجد مرفقات للموظف
                          </Typography>
                          <Typography
                            sx={{
                              mt: .2,
                              fontFamily: "Cairo",
                              color: "#8a9790",
                              fontSize: "0.75rem"
                            }}
                          >
                            أضف مستندات الموظف لتظهر هنا بشكل منظم
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "grid",
                          direction: EMPLOYEE_DIALOG_DIRECTION,
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2,minmax(0,1fr))",
                            lg: "repeat(3,minmax(0,1fr))"
                          },
                          gap: { xs: .8, sm: 1, lg: 1.15 }
                        }}
                      >
                        {documents.map((document, index) => {
                          const fileName = String(
                            document?.originalFileName || ""
                          );
                          const extension = fileName.includes(".")
                            ? fileName.split(".").pop().toUpperCase()
                            : "FILE";
                          const canPreview = [
                            "PDF", "JPG", "JPEG", "PNG", "WEBP"
                          ].includes(extension);

                          return (
                            <Paper
                              key={document.documentGuid}
                              elevation={0}
                              onClick={() => previewEmployeeDocument(document)}
                              sx={{
                                position: "relative",
                                overflow: "hidden",
                                minHeight: { xs: 150, sm: 168 },
                                p: { xs: 1, sm: 1.15 },
                                borderRadius: 3,
                                border:
                                  "1px solid rgba(5,117,70,.10)",
                                background: isDark ? darkSection : "linear-gradient(145deg,#ffffff 0%,#fbfefc 68%,#f2faf6 100%)",
                                cursor: "pointer",
                                animation:
                                  `cardReveal .3s ease ${Math.min(index * 35, 280)}ms both`,
                                transition:
                                  "transform .22s ease, box-shadow .22s ease, border-color .22s ease",
                                "&:before": {
                                  content: '\"\"',
                                  position: "absolute",
                                  width: 96,
                                  height: 96,
                                  borderRadius: "50%",
                                  insetInlineEnd: -38,
                                  top: -42,
                                  background:
                                    "rgba(5,117,70,.045)"
                                },
                                "&:hover": {
                                  transform: "translateY(-4px)",
                                  borderColor:
                                    "rgba(5,117,70,.24)",
                                  boxShadow:
                                    "0 14px 34px rgba(5,117,70,.10)"
                                }
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="flex-start"
                                justifyContent="space-between"
                                spacing={1}
                              >
                                <Stack
                                  direction="row"
                                  spacing={.45}
                                  sx={{ flexShrink: 0 }}
                                >
                                  <Tooltip title="فتح في نافذة جديدة">
                                    <IconButton
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openEmployeeDocument(document);
                                      }}
                                      sx={{
                                        color: primaryColor,
                                        bgcolor: "#eef8f3",
                                        border:
                                          "1px solid rgba(5,117,70,.08)"
                                      }}
                                    >
                                      <OpenInNewRoundedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="حذف المرفق">
                                    <IconButton
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteEmployeeDocument(document);
                                      }}
                                      sx={{
                                        color: accentColor,
                                        bgcolor: "#fff4f4",
                                        border:
                                          "1px solid rgba(174,30,33,.08)"
                                      }}
                                    >
                                      <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>

                                <Box
                                  sx={{
                                    width: 46,
                                    height: 52,
                                    borderRadius: 2.4,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: primaryLight,
                                    color: primaryColor,
                                    border:
                                      "1px solid rgba(5,117,70,.08)",
                                    flexShrink: 0
                                  }}
                                >
                                  <DescriptionOutlinedIcon sx={{ fontSize: 25 }} />
                                </Box>
                              </Stack>

                              <Box
                                sx={{
                                  mt: 1,
                                  minWidth: 0,
                                  textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={.55}
                                  alignItems="center"
                                >
                                  <Chip
                                    size="small"
                                    label={extension}
                                    sx={{
                                      height: 20,
                                      fontFamily: "Cairo",
                                      fontWeight: 900,
                                      fontSize: "0.75rem",
                                      bgcolor: canPreview ? "#e9f6f0" : "#f2f4f3",
                                      color: canPreview ? primaryColor : "#6f7974"
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 1000,
                                      fontSize: { xs: "0.75rem", sm: "0.75rem" },
                                      color: "#17352a",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      minWidth: 0
                                    }}
                                  >
                                    {document.documentTypeName || "مرفق عام"}
                                  </Typography>
                                </Stack>

                                <Typography
                                  title={fileName}
                                  sx={{
                                    mt: .45,
                                    fontFamily: "Cairo",
                                    fontSize: "0.75rem",
                                    color: "#718078",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                  }}
                                >
                                  {fileName || "ملف بدون اسم"}
                                </Typography>

                                <Stack
                                  direction="row"
                                  spacing={.8}
                                  alignItems="center"
                                  sx={{ mt: .7, flexWrap: "wrap", rowGap: .35 }}
                                >
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontSize: "0.75rem",
                                      color: "#87938d"
                                    }}
                                  >
                                    {formatFileSize(document.fileSize)}
                                  </Typography>
                                  {document.issueDate && (
                                    <Typography
                                      sx={{
                                        fontFamily: "Cairo",
                                        fontSize: "0.75rem",
                                        color: "#87938d"
                                      }}
                                    >
                                      إصدار: {String(document.issueDate).slice(0, 10)}
                                    </Typography>
                                  )}
                                  {document.expiryDate && (
                                    <Typography
                                      sx={{
                                        fontFamily: "Cairo",
                                        fontSize: "0.75rem",
                                        color: "#9b6635"
                                      }}
                                    >
                                      انتهاء: {String(document.expiryDate).slice(0, 10)}
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>

                              <Button
                                fullWidth
                                size="small"
                                variant="text"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  previewEmployeeDocument(document);
                                }}
                                startIcon={<VisibilityOutlinedIcon />}
                                sx={uiLayout.withUiSx({
                                  mt: 1,
                                  borderRadius: 2,
                                  fontFamily: "Cairo",
                                  fontWeight: 900,
                                  fontSize: "0.75rem",
                                  color: primaryColor,
                                  bgcolor: "rgba(5,117,70,.045)",
                                  "&:hover": {
                                    bgcolor: "rgba(5,117,70,.09)"
                                  }
                                }, uiLayout.buttonSx)}
                              >
                                {canPreview ? "معاينة داخل البرنامج" : "تفاصيل المرفق"}
                              </Button>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Paper>
                )}

                {/* =========================
                    TAB 3 - العقد الوظيفي
                ========================== */}
                {profileTab === 3 && (
                  <Box
                    sx={{
                      animation: "fadeSlide .25s ease both"
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: {
                          xs: .9,
                          sm: 1.3,
                          lg: 1.8
                        },
                        borderRadius: 3,
                        border:
                          "1px solid rgba(5,117,70,.10)",
                        bgcolor: isDark ? darkCard : "#fff",
                        boxShadow:
                          "0 8px 24px rgba(5,117,70,.055)"
                      }}
                    >
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row"
                        }}
                        spacing={1.2}
                        alignItems={{
                          xs: "stretch",
                          sm: "center"
                        }}
                        justifyContent="space-between"
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius: 2.5,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: primaryLight,
                              color: primaryColor,
                              flexShrink: 0
                            }}
                          >
                            <DescriptionOutlinedIcon />
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                fontSize: {
                                  xs: ".84rem",
                                  sm: "1rem"
                                },
                                color: primaryDark,
                                textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                              }}
                            >
                              العقد الوظيفي
                            </Typography>

                            <Typography
                              sx={{
                                mt: .15,
                                fontFamily: "Cairo",
                                fontSize: {
                                  xs: "0.75rem",
                                  sm: "0.75rem"
                                },
                                color: "#718078",
                                textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                              }}
                            >
                              رفع العقد وعرض بياناته والنسخ السابقة
                            </Typography>
                          </Box>
                        </Stack>

                        <Button
                          variant="contained"
                          startIcon={<CloudUploadOutlinedIcon />}
                          onClick={() =>
                            setContractUploadOpen(
                              (current) => !current
                            )
                          }
                          disabled={contractUploading}
                          sx={uiLayout.withUiSx({
                            fontFamily: "Cairo",
                            fontWeight: 900,
                            bgcolor: primaryColor,
                            borderRadius: 2.4,
                            px: 2,
                            "&:hover": {
                              bgcolor: primaryDark
                            }
                          }, uiLayout.buttonSx)}
                        >
                          {employeeContract
                            ? "رفع عقد جديد"
                            : "رفع العقد"}
                        </Button>
                      </Stack>

                      <Collapse
                        in={contractUploadOpen}
                        timeout={260}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            mt: 1.4,
                            p: {
                              xs: .9,
                              sm: 1.2,
                              lg: 1.5
                            },
                            borderRadius: 2.8,
                            bgcolor: "#f7fbf9",
                            border:
                              "1px dashed rgba(5,117,70,.25)"
                          }}
                        >
                          <Box
                            sx={uiLayout.withUiSx({
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2,minmax(0,1fr))",
                                lg: "repeat(3,minmax(0,1fr))"
                              },
                              gap: 1
                            }, uiLayout.filterBarSx)}
                          >
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={
                                <CloudUploadOutlinedIcon />
                              }
                              sx={uiLayout.withUiSx({
                                gridColumn: "1 / -1",
                                minHeight: 54,
                                justifyContent: "space-between",
                                borderStyle: "dashed",
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                color: contractForm.file
                                  ? primaryDark
                                  : primaryColor,
                                borderColor:
                                  "rgba(5,117,70,.30)"
                              }, uiLayout.buttonSx)}
                            >
                              {contractForm.file
                                ? contractForm.file.name
                                : "اختيار ملف العقد من الجهاز"}

                              <input
                                hidden
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                                onChange={(event) =>
                                  setContractForm(
                                    (current) => ({
                                      ...current,
                                      file:
                                        event.target.files?.[0] ||
                                        null
                                    })
                                  )
                                }
                              />
                            </Button>

                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }}
                              size="small"
                              label="رقم العقد"
                              value={contractForm.contractNumber}
                              onChange={(event) =>
                                setContractForm(
                                  (current) => ({
                                    ...current,
                                    contractNumber:
                                      event.target.value
                                  })
                                )
                              }
                            />

                            <TextField sx={uiLayout.formFieldSx}
                              size="small"
                              type="date"
                              label="تاريخ بداية العقد"
                              value={contractForm.startDate}
                              onChange={(event) =>
                                setContractForm(
                                  (current) => ({
                                    ...current,
                                    startDate:
                                      event.target.value
                                  })
                                )
                              }
                              InputLabelProps={{ shrink: true }}
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <TextField sx={uiLayout.formFieldSx}
                              size="small"
                              type="date"
                              label="تاريخ نهاية العقد"
                              value={contractForm.endDate}
                              onChange={(event) =>
                                setContractForm(
                                  (current) => ({
                                    ...current,
                                    endDate:
                                      event.target.value
                                  })
                                )
                              }
                              InputLabelProps={{ shrink: true }}
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                              size="small"
                              type="number"
                              label="الراتب الأساسي"
                              value={contractForm.basicSalary}
                              onChange={(event) =>
                                setContractForm(
                                  (current) => ({
                                    ...current,
                                    basicSalary:
                                      event.target.value
                                  })
                                )
                              }
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <TextField InputLabelProps={{ shrink: true }}
                              size="small"
                              label="ملاحظات"
                              value={contractForm.notes}
                              onChange={(event) =>
                                setContractForm(
                                  (current) => ({
                                    ...current,
                                    notes:
                                      event.target.value
                                  })
                                )
                              }
                              sx={uiLayout.withUiSx({
                                gridColumn: {
                                  xs: "1 / -1",
                                  lg: "span 2"
                                }
                              }, uiLayout.formFieldSx)}
                            />
                          </Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            sx={uiLayout.withUiSx({ mt: 1.2 }, uiLayout.actionBarSx)}
                          >
                            <Button
                              variant="outlined"
                              onClick={() =>
                                setContractUploadOpen(false)
                              }
                              disabled={contractUploading}
                              sx={uiLayout.withUiSx({
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                color: accentColor,
                                borderColor:
                                  "rgba(174,30,33,.28)"
                              }, uiLayout.buttonSx)}
                            >
                              إلغاء
                            </Button>

                            <Button
                              variant="contained"
                              onClick={uploadEmployeeContract}
                              disabled={contractUploading}
                              startIcon={
                                contractUploading
                                  ? (
                                    <CircularProgress
                                      size={16}
                                      sx={{ color: "#fff" }}
                                    />
                                  )
                                  : (
                                    <SaveOutlinedIcon />
                                  )
                              }
                              sx={uiLayout.withUiSx({
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                bgcolor: primaryColor,
                                "&:hover": {
                                  bgcolor: primaryDark
                                }
                              }, uiLayout.buttonSx)}
                            >
                              {contractUploading
                                ? "جاري رفع العقد..."
                                : "حفظ العقد"}
                            </Button>
                          </Stack>
                        </Paper>
                      </Collapse>

                      <Divider sx={{ my: 1.5 }} />

                      {contractLoading ? (
                        <Box
                          sx={{
                            py: 5,
                            display: "grid",
                            placeItems: "center"
                          }}
                        >
                          <CircularProgress
                            size={34}
                            sx={{ color: primaryColor }}
                          />
                        </Box>
                      ) : employeeContract ? (
                        <Box
                          sx={{
                            display: "grid",
                            direction: EMPLOYEE_DIALOG_DIRECTION,
                            gridTemplateColumns: {
                              xs: "1fr",
                              md: "minmax(0,1.35fr) minmax(300px,.65fr)"
                            },
                            gap: 1.4
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: {
                                xs: 1.1,
                                sm: 1.4
                              },
                              borderRadius: 2.8,
                              border:
                                "1px solid rgba(5,117,70,.11)",
                              bgcolor: "#fbfefc"
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={1}
                              sx={{ mb: 1.2 }}
                            >
                              <Box>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 900,
                                    color: primaryDark,
                                    textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                  }}
                                >
                                  العقد الحالي
                                </Typography>
                                <Typography
                                  sx={{
                                    mt: .15,
                                    fontFamily: "Cairo",
                                    fontSize: "0.75rem",
                                    color: "#7b8982",
                                    textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                  }}
                                >
                                  آخر عقد مرفوع ومعتمد في ملف الموظف
                                </Typography>
                              </Box>

                              <Chip
                                size="small"
                                label="حالي"
                                color="success"
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 900
                                }}
                              />
                            </Stack>

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "repeat(2,minmax(0,1fr))",
                                  lg: "repeat(4,minmax(0,1fr))"
                                },
                                gap: .9
                              }}
                            >
                              <EmployeeDetail ltr
                                label="رقم العقد"
                                value={
                                  employeeContract?.contractNumber ||
                                  "-"
                                }
                              />
                              <EmployeeDetail
                                label="تاريخ البداية"
                                value={
                                  employeeContract?.startDate
                                    ? String(
                                        employeeContract.startDate
                                      ).slice(0, 10)
                                    : "-"
                                }
                              />
                              <EmployeeDetail
                                label="تاريخ النهاية"
                                value={
                                  employeeContract?.endDate
                                    ? String(
                                        employeeContract.endDate
                                      ).slice(0, 10)
                                    : "-"
                                }
                              />
                              <EmployeeDetail
                                label="الراتب الأساسي"
                                value={
                                  employeeContract?.basicSalary !==
                                    null &&
                                  employeeContract?.basicSalary !==
                                    undefined
                                    ? Number(
                                        employeeContract.basicSalary
                                      ).toLocaleString("ar-SA")
                                    : "-"
                                }
                              />
                            </Box>

                            <Paper
                              elevation={0}
                              sx={{
                                mt: 1.1,
                                p: 1.1,
                                borderRadius: 2.5,
                                bgcolor: "#f5faf7",
                                border:
                                  "1px solid rgba(5,117,70,.08)"
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
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 900,
                                      fontSize: ".76rem",
                                      color: "#253a31",
                                      textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
                                      overflowWrap: "anywhere"
                                    }}
                                  >
                                    {employeeContract.originalFileName ||
                                      "ملف العقد"}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      mt: .2,
                                      fontFamily: "Cairo",
                                      fontSize: "0.75rem",
                                      color: "#7a8982",
                                      textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                    }}
                                  >
                                    {formatFileSize(
                                      employeeContract.fileSize
                                    )}
                                    {" • "}
                                    {formatDateTime(
                                      employeeContract.uploadedAt
                                    )}
                                  </Typography>
                                </Box>

                                <Stack
                                  direction="row"
                                  spacing={.7}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={
                                      <OpenInNewRoundedIcon />
                                    }
                                    onClick={() =>
                                      openEmployeeContract()
                                    }
                                    sx={uiLayout.withUiSx({
                                      fontFamily: "Cairo",
                                      fontWeight: 900,
                                      color: primaryColor,
                                      borderColor:
                                        "rgba(5,117,70,.25)"
                                    }, uiLayout.buttonSx)}
                                  >
                                    معاينة العقد
                                  </Button>

                                  <IconButton
                                    size="small"
                                    onClick={deleteEmployeeContract}
                                    sx={{
                                      color: accentColor,
                                      bgcolor:
                                        "rgba(174,30,33,.055)"
                                    }}
                                  >
                                    <DeleteOutlineRoundedIcon />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            </Paper>

                            {employeeContract?.notes && (
                              <Typography
                                sx={{
                                  mt: 1,
                                  fontFamily: "Cairo",
                                  fontSize: "0.75rem",
                                  color: "#67776f",
                                  textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                }}
                              >
                                {employeeContract.notes}
                              </Typography>
                            )}
                          </Paper>

                          <Paper
                            elevation={0}
                            sx={{
                              p: {
                                xs: 1.1,
                                sm: 1.4
                              },
                              borderRadius: 2.8,
                              border:
                                "1px solid rgba(5,117,70,.09)",
                              bgcolor: isDark ? darkCard : "#fff"
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                color: primaryDark,
                                textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                              }}
                            >
                              العقود السابقة
                            </Typography>

                            <Stack
                              spacing={.7}
                              sx={{ mt: 1 }}
                            >
                              {contractHistory.length === 0 ? (
                                <Typography
                                  sx={{
                                    py: 2,
                                    fontFamily: "Cairo",
                                    fontSize: "0.75rem",
                                    color: "#85918b",
                                    textAlign: CENTER_TEXT_ALIGN
                                  }}
                                >
                                  لا توجد عقود سابقة
                                </Typography>
                              ) : (
                                contractHistory.map((contract) => (
                                  <Paper
                                    key={contract.contractGuid}
                                    elevation={0}
                                    sx={{
                                      p: .9,
                                      borderRadius: 2.2,
                                      bgcolor: "#f8fbf9",
                                      border:
                                        "1px solid rgba(5,117,70,.07)"
                                    }}
                                  >
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      justifyContent="space-between"
                                      spacing={1}
                                    >
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                          sx={{
                                            fontFamily: "Cairo",
                                            fontWeight: 800,
                                            fontSize: "0.75rem",
                                            color: "#32463d",
                                            textAlign:
                                              EMPLOYEE_DIALOG_TEXT_ALIGN,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                          }}
                                        >
                                          {contract.originalFileName ||
                                            contract.contractNumber ||
                                            "عقد سابق"}
                                        </Typography>
                                        <Typography
                                          sx={{
                                            mt: .1,
                                            fontFamily: "Cairo",
                                            fontSize: "0.75rem",
                                            color: "#839088",
                                            textAlign:
                                              EMPLOYEE_DIALOG_TEXT_ALIGN
                                          }}
                                        >
                                          {formatDateTime(
                                            contract.uploadedAt
                                          )}
                                        </Typography>
                                      </Box>

                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          openEmployeeContract(
                                            contract
                                          )
                                        }
                                        sx={{
                                          color: primaryColor,
                                          bgcolor: primaryLight
                                        }}
                                      >
                                        <OpenInNewRoundedIcon
                                          sx={{ fontSize: 18 }}
                                        />
                                      </IconButton>
                                    </Stack>
                                  </Paper>
                                ))
                              )}
                            </Stack>
                          </Paper>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            py: {
                              xs: 4,
                              sm: 6
                            },
                            display: "grid",
                            placeItems: "center",
                            textAlign: CENTER_TEXT_ALIGN
                          }}
                        >
                          <DescriptionOutlinedIcon
                            sx={{
                              fontSize: 52,
                              color: "rgba(5,117,70,.18)"
                            }}
                          />
                          <Typography
                            sx={{
                              mt: 1,
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              color: "#41554c"
                            }}
                          >
                            لا يوجد عقد وظيفي مرفوع
                          </Typography>
                          <Typography
                            sx={{
                              mt: .35,
                              fontFamily: "Cairo",
                              fontSize: "0.75rem",
                              color: "#849089"
                            }}
                          >
                            اضغط «رفع العقد» لإضافة العقد إلى ملف الموظف
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                )}

                {/* =========================
                    TAB 4 - الترقيات والمسميات السابقة
                ========================== */}
                {profileTab === 4 && (
                  <Box
                    dir={CAREER_TAB_DIRECTION}
                    sx={{
                      animation: "fadeSlide .25s ease both",
                      textAlign: CAREER_TAB_TEXT_ALIGN
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: .85, sm: 1.2, lg: 1.4 },
                        borderRadius: 3,
                        border:
                          "1px solid rgba(5,117,70,.09)",
                        bgcolor: isDark ? darkCard : "#fff"
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
                        sx={{ mb: 1.2 }}
                      >
                        <Box
                          sx={{
                            textAlign:
                              CAREER_TAB_TEXT_ALIGN
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 1000,
                              color: primaryDark,
                              fontSize: {
                                xs: ".8rem",
                                sm: ".95rem"
                              }
                            }}
                          >
                            الترقيات والمسميات السابقة
                          </Typography>

                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontSize: "0.75rem",
                              color: "#718078",
                              mt: .15
                            }}
                          >
                            المسار الوظيفي الكامل وخطط الترقية للموظف
                          </Typography>
                        </Box>

                        <Stack sx={uiLayout.actionBarSx}
                          direction="row"
                          spacing={.65}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              <SwapHorizRoundedIcon />
                            }
                            onClick={() =>
                              openCareerAction("transfer")
                            }
                            sx={uiLayout.withUiSx({
                              fontFamily: "Cairo",
                              fontWeight: 900
                            }, uiLayout.buttonSx)}
                          >
                            نقل وظيفي
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            startIcon={
                              <TrendingUpRoundedIcon />
                            }
                            onClick={() =>
                              openCareerAction("promotion")
                            }
                            sx={uiLayout.withUiSx({
                              bgcolor: primaryColor,
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              "&:hover": {
                                bgcolor: primaryDark
                              }
                            }, uiLayout.buttonSx)}
                          >
                            ترقية
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              <EventNoteRoundedIcon />
                            }
                            onClick={() =>
                              openCareerAction("plan")
                            }
                            sx={uiLayout.withUiSx({
                              fontFamily: "Cairo",
                              fontWeight: 900
                            }, uiLayout.buttonSx)}
                          >
                            خطة ترقية
                          </Button>
                        </Stack>
                      </Stack>

                      {careerLoading ? (
                        <Box
                          sx={{
                            py: 5,
                            display: "grid",
                            placeItems: "center"
                          }}
                        >
                          <CircularProgress size={28} />
                        </Box>
                      ) : (
                        <>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.1,

                              mb: 1.15,
                              borderRadius: 2.4,
                              borderColor:
                                "rgba(5,117,70,.13)",
                              bgcolor:
                                "rgba(5,117,70,.035)"
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontSize: "0.75rem",
                                textAlign: "start",
                                color: "#718078"
                              }}
                            >
                              المسمى الوظيفي الحالي
                            </Typography>

                            <Typography
                              sx={{
                                mt: .15,
                                fontFamily: "Cairo",
                                fontWeight: 1000,
                                textAlign: "start",
                                color: primaryDark,
                                fontSize: ".92rem"
                              }}
                            >
                              {careerData?.current
                                ?.currentJobTitleName ||
                                selectedEmployee?.jobTitle ||
                                "غير محدد"}
                            </Typography>
                          </Paper>

                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 1000,
                              textAlign: "start",
                              color: primaryDark,
                              fontSize: ".78rem",
                              mb: .7
                            }}
                          >
                            خطط الترقيات
                          </Typography>

                          <Stack
                            spacing={.7}
                            sx={{ mb: 1.4 }}
                          >
                            {careerData.promotionPlans.map(
                              (plan) => (
                                <Paper
                                  key={plan.planGuid}
                                  variant="outlined"
                                  sx={{
                                    p: 1,
                                    borderRadius: 2.2,
                                    borderColor:
                                      "rgba(5,117,70,.11)"
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
                                    spacing={.8}
                                  >
                                    <Box>
                                      <Stack
                                        direction="row"
                                        spacing={.5}
                                        alignItems="center"
                                        flexWrap="wrap"
                                        useFlexGap
                                      >
                                        <Typography
                                          sx={{
                                            fontFamily: "Cairo",
                                            fontWeight: 950,
                                            fontSize: ".75rem"
                                          }}
                                        >
                                          {plan.fromJobTitleName ||
                                            "غير محدد"}
                                          {"  ←  "}
                                          {plan.toJobTitleName ||
                                            "غير محدد"}
                                        </Typography>

                                        <Chip
                                          size="small"
                                          label={
                                            plan.status ===
                                            "Pending"
                                              ? "معلقة"
                                              : plan.status ===
                                                  "Executed"
                                                ? "تم تنفيذها"
                                                : "ملغاة"
                                          }
                                          color={
                                            plan.status ===
                                            "Pending"
                                              ? "warning"
                                              : plan.status ===
                                                  "Executed"
                                                ? "success"
                                                : "default"
                                          }
                                        />
                                      </Stack>

                                      <Typography
                                        sx={{
                                          mt: .25,
                                          fontFamily: "Cairo",
                                          fontSize: "0.75rem",
                                          color: "#718078"
                                        }}
                                      >
                                        التاريخ المخطط:{" "}
                                        {plan.plannedDate
                                          ? new Date(
                                              plan.plannedDate
                                            ).toLocaleDateString(
                                              "ar-EG"
                                            )
                                          : "-"}
                                        {" • "}
                                        السبب:{" "}
                                        {plan.reason || "-"}
                                      </Typography>

                                      {plan.cancelReason && (
                                        <Typography
                                          sx={{
                                            mt: .2,
                                            fontFamily: "Cairo",
                                            fontSize: "0.75rem",
                                            color: accentColor
                                          }}
                                        >
                                          سبب الإلغاء:{" "}
                                          {plan.cancelReason}
                                        </Typography>
                                      )}
                                    </Box>

                                    {plan.status ===
                                      "Pending" && (
                                      <Stack sx={uiLayout.actionBarSx}
                                        direction="row"
                                        spacing={.5}
                                      >
                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={() =>
                                            executeEmployeePromotionPlan(
                                              plan
                                            )
                                          }
                                          sx={uiLayout.withUiSx({
                                            bgcolor:
                                              primaryColor,
                                            fontFamily:
                                              "Cairo",
                                            fontWeight: 900
                                          }, uiLayout.buttonSx)}
                                        >
                                          تنفيذ
                                        </Button>

                                        <Button
                                          size="small"
                                          color="error"
                                          onClick={() =>
                                            cancelEmployeePromotionPlan(
                                              plan
                                            )
                                          }
                                          sx={uiLayout.withUiSx({
                                            fontFamily:
                                              "Cairo",
                                            fontWeight: 900
                                          }, uiLayout.buttonSx)}
                                        >
                                          إلغاء
                                        </Button>
                                      </Stack>
                                    )}
                                  </Stack>
                                </Paper>
                              )
                            )}

                            {!careerData.promotionPlans
                              .length && (
                              <Alert
                                severity="info"
                                sx={{
                                  fontFamily: "Cairo",
                                  borderRadius: 2
                                }}
                              >
                                لا توجد خطط ترقيات لهذا الموظف.
                              </Alert>
                            )}
                          </Stack>

                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 1000,
                              textAlign: "start",
                              color: primaryDark,
                              fontSize: ".78rem",
                              mb: .7
                            }}
                          >
                            المسميات السابقة والحركات الوظيفية
                          </Typography>

                          <Stack spacing={.7}>
                            {careerData.history.map(
                              (movement) => (
                                <Paper
                                  key={
                                    movement.movementGuid ||
                                    `${movement.changedAt}-${movement.toLegacyJobCode}`
                                  }
                                  variant="outlined"
                                  sx={{
                                    p: 1,
                                    borderRadius: 2.2,
                                    borderColor:
                                      "rgba(5,117,70,.11)"
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={.7}
                                    alignItems="flex-start"
                                  >
                                    <Box
                                      sx={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "50%",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                        bgcolor:
                                          movement.movementType ===
                                          "Promotion"
                                            ? "rgba(5,117,70,.10)"
                                            : "rgba(20,86,156,.08)",
                                        color:
                                          movement.movementType ===
                                          "Promotion"
                                            ? primaryColor
                                            : "#14569c"
                                      }}
                                    >
                                      {movement.movementType ===
                                      "Promotion" ? (
                                        <TrendingUpRoundedIcon
                                          sx={{
                                            fontSize: 18
                                          }}
                                        />
                                      ) : (
                                        <SwapHorizRoundedIcon
                                          sx={{
                                            fontSize: 18
                                          }}
                                        />
                                      )}
                                    </Box>

                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography
                                        sx={{
                                          fontFamily: "Cairo",
                                          fontWeight: 950,
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        {movement.fromJobTitleName ||
                                          "غير محدد"}
                                        {"  ←  "}
                                        {movement.toJobTitleName ||
                                          "غير محدد"}
                                      </Typography>

                                      <Typography
                                        sx={{
                                          mt: .2,
                                          fontFamily: "Cairo",
                                          fontSize: "0.75rem",
                                          color: "#718078"
                                        }}
                                      >
                                        {movement.movementType ===
                                        "Promotion"
                                          ? "ترقية"
                                          : movement.movementType ===
                                              "DirectChange"
                                            ? "تغيير مسمى من ملف الموظف"
                                            : "نقل وظيفي"}
                                        {" • "}
                                        {movement.effectiveDate
                                          ? new Date(
                                              movement.effectiveDate
                                            ).toLocaleDateString(
                                              "ar-EG"
                                            )
                                          : "-"}
                                        {movement.changedByName
                                          ? ` • بواسطة ${movement.changedByName}`
                                          : ""}
                                      </Typography>

                                      {movement.reason && (
                                        <Typography
                                          sx={{
                                            mt: .28,
                                            fontFamily: "Cairo",
                                            fontSize: "0.75rem",
                                            color: "#526159"
                                          }}
                                        >
                                          {movement.reason}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Stack>
                                </Paper>
                              )
                            )}

                            {!careerData.history.length && (
                              <Alert
                                severity="info"
                                sx={{
                                  fontFamily: "Cairo",
                                  borderRadius: 2
                                }}
                              >
                                لا توجد تغييرات سابقة في المسمى الوظيفي.
                              </Alert>
                            )}
                          </Stack>
                        </>
                      )}
                    </Paper>
                  </Box>
                )}

                {/* =========================
                    TAB 5 - الحضور والانصراف
                    اتجاه هذا الجزء مستقل من:
                    ATTENDANCE_TAB_DIRECTION
                    ATTENDANCE_FILTER_DIRECTION
                    ATTENDANCE_GRID_DIRECTION
                ========================== */}
                {profileTab === 5 && (
                  <Box
                    dir={ATTENDANCE_TAB_DIRECTION}
                    sx={{
                      animation: "fadeSlide .25s ease both",
                      textAlign: "start"
                    }}
                  >
                    <Stack spacing={1.1}>
                      {/* Header */}
                      <Paper
                        elevation={0}
                        sx={{
                          overflow: "hidden",
                          borderRadius: 3.2,
                          border:
                            "1px solid rgba(5,117,70,.10)",
                          bgcolor: isDark ? darkCard : "#fff"
                        }}
                      >
                        <Box
                          sx={{
                            px: { xs: 1.2, sm: 1.6 },
                            py: { xs: 1.2, sm: 1.45 },
                            background: isDark ? darkSection : "linear-gradient(135deg, #f4fbf7 0%, #ffffff 72%)",
                            borderBottom:
                              "1px solid rgba(5,117,70,.08)"
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
                              spacing={.8}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 2.2,
                                  display: "grid",
                                  placeItems: "center",
                                  color: primaryColor,
                                  bgcolor: "#e8f5ee",
                                  border:
                                    "1px solid rgba(5,117,70,.10)"
                                }}
                              >
                                <AccessTimeRoundedIcon
                                  sx={{ fontSize: 21 }}
                                />
                              </Box>

                              <Box>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 1000,
                                    color: primaryDark,
                                    fontSize: {
                                      xs: ".9rem",
                                      sm: "1.02rem"
                                    }
                                  }}
                                >
                                  سجل الحضور والانصراف
                                </Typography>

                                <Typography
                                  color="text.secondary"
                                  sx={{
                                    mt: .1,
                                    fontSize: {
                                      xs: "0.75rem",
                                      sm: "0.75rem"
                                    }
                                  }}
                                >
                                  الشهر الحالي يظهر تلقائيًا، ويمكنك اختيار أي فترة من وإلى
                                </Typography>
                              </Box>
                            </Stack>

                            <Chip
                              icon={<EventNoteRoundedIcon />}
                              label={
                                <Stack
                                  direction="row"
                                  spacing={.45}
                                  alignItems="center"
                                >
                                  <Box
                                    component="span"
                                    sx={{
                                      direction: "rtl",
                                      unicodeBidi: "isolate"
                                    }}
                                  >
                                    الفترة:
                                  </Box>
                                  <Box
                                    component="span"
                                    dir={ATTENDANCE_DATE_DIRECTION}
                                    sx={{
                                      direction:
                                        ATTENDANCE_DATE_DIRECTION,
                                      unicodeBidi: "isolate",
                                      textAlign:
                                        ATTENDANCE_DATE_TEXT_ALIGN,
                                      fontVariantNumeric:
                                        "tabular-nums"
                                    }}
                                  >
                                    {employeeAttendanceAppliedRange.fromDate || "-"}
                                    {" → "}
                                    {employeeAttendanceAppliedRange.toDate || "-"}
                                  </Box>
                                </Stack>
                              }
                              variant="outlined"
                              sx={[hrChipSx(), {
                                alignSelf: {
                                  xs: "flex-start",
                                  md: "center"
                                },
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                fontSize: "0.75rem",
                                bgcolor: isDark ? darkCard : "#fff",
                                borderColor:
                                  "rgba(5,117,70,.16)"
                              }]}
                            />
                          </Stack>
                        </Box>

                        {/* Date filters - independent direction */}
                        <Box
                          dir={ATTENDANCE_FILTER_DIRECTION}
                          sx={{
                            p: { xs: 1.1, sm: 1.35 },
                            textAlign:
                              ATTENDANCE_FILTER_TEXT_ALIGN
                          }}
                        >
                          <Stack spacing={.9}>
                            <Stack sx={uiLayout.filterBarSx}
                              direction={{
                                xs: "column",
                                md: "row"
                              }}
                              spacing={.75}
                              alignItems={{
                                xs: "stretch",
                                md: "center"
                              }}
                            >
                              <TextField
                                size="small"
                                type="date"
                                label="من تاريخ"
                                value={
                                  employeeAttendanceRange.fromDate
                                }
                                onChange={(e) =>
                                  setEmployeeAttendanceRange(
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
                                sx={uiLayout.withUiSx({
                                  minWidth: {
                                    md: 185
                                  },
                                  "& .MuiInputBase-root": {
                                    borderRadius: 2
                                  },
                                  "& input": {
                                    direction:
                                      ATTENDANCE_DATE_DIRECTION,
                                    textAlign:
                                      ATTENDANCE_DATE_TEXT_ALIGN,
                                    fontVariantNumeric:
                                      "tabular-nums"
                                  }
                                }, uiLayout.formFieldSx)}
                               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                              <TextField
                                size="small"
                                type="date"
                                label="إلى تاريخ"
                                value={
                                  employeeAttendanceRange.toDate
                                }
                                onChange={(e) =>
                                  setEmployeeAttendanceRange(
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
                                sx={uiLayout.withUiSx({
                                  minWidth: {
                                    md: 185
                                  },
                                  "& .MuiInputBase-root": {
                                    borderRadius: 2
                                  },
                                  "& input": {
                                    direction:
                                      ATTENDANCE_DATE_DIRECTION,
                                    textAlign:
                                      ATTENDANCE_DATE_TEXT_ALIGN,
                                    fontVariantNumeric:
                                      "tabular-nums"
                                  }
                                }, uiLayout.formFieldSx)}
                               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                              <Button
                                variant="contained"
                                startIcon={
                                  employeeAttendanceLoading ? (
                                    <CircularProgress
                                      size={15}
                                      color="inherit"
                                    />
                                  ) : (
                                    <SearchIcon />
                                  )
                                }
                                onClick={() =>
                                  applyEmployeeAttendanceRange()
                                }
                                disabled={
                                  employeeAttendanceLoading
                                }
                                sx={uiLayout.withUiSx({
                                  minHeight: 40,
                                  px: 2.2,
                                  borderRadius: 2,
                                  bgcolor: primaryColor,
                                  fontFamily: "Cairo",
                                  fontWeight: 950,
                                  whiteSpace: "nowrap",
                                  "&:hover": {
                                    bgcolor: primaryDark
                                  }
                                }, uiLayout.buttonSx)}
                              >
                                عرض الفترة
                              </Button>

                              <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() =>
                                  loadEmployeeAttendance(
                                    selectedEmployee?.employeeGuid,
                                    employeeAttendanceAppliedRange
                                  )
                                }
                                disabled={
                                  employeeAttendanceLoading
                                }
                                sx={uiLayout.withUiSx({
                                  minHeight: 40,
                                  borderRadius: 2,
                                  fontFamily: "Cairo",
                                  fontWeight: 900,
                                  whiteSpace: "nowrap"
                                }, uiLayout.buttonSx)}
                              >
                                تحديث
                              </Button>
                            </Stack>

                            <Stack sx={uiLayout.actionBarSx}
                              direction="row"
                              spacing={.55}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  applyEmployeeAttendanceRange(
                                    currentMonthAttendanceRange()
                                  )
                                }
                                sx={uiLayout.withUiSx({
                                  borderRadius: 999,
                                  fontFamily: "Cairo",
                                  fontWeight: 900,
                                  fontSize: "0.75rem"
                                }, uiLayout.buttonSx)}
                              >
                                الشهر الحالي
                              </Button>

                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  applyEmployeeAttendanceRange(
                                    previousDaysAttendanceRange(7)
                                  )
                                }
                                sx={uiLayout.withUiSx({
                                  borderRadius: 999,
                                  fontFamily: "Cairo",
                                  fontWeight: 850,
                                  fontSize: "0.75rem"
                                }, uiLayout.buttonSx)}
                              >
                                آخر 7 أيام
                              </Button>

                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  applyEmployeeAttendanceRange(
                                    previousDaysAttendanceRange(30)
                                  )
                                }
                                sx={uiLayout.withUiSx({
                                  borderRadius: 999,
                                  fontFamily: "Cairo",
                                  fontWeight: 850,
                                  fontSize: "0.75rem"
                                }, uiLayout.buttonSx)}
                              >
                                آخر 30 يوم
                              </Button>
                            </Stack>

                            {employeeAttendanceError && (
                              <Alert
                                severity="error"
                                sx={{
                                  borderRadius: 2,
                                  fontSize: "0.75rem"
                                }}
                              >
                                {employeeAttendanceError}
                              </Alert>
                            )}
                          </Stack>
                        </Box>
                      </Paper>

                      {employeeAttendanceLoading ? (
                        <Paper
                          elevation={0}
                          sx={{
                            minHeight: 300,
                            borderRadius: 3,
                            display: "grid",
                            placeItems: "center",
                            border:
                              "1px solid rgba(5,117,70,.09)"
                          }}
                        >
                          <Stack
                            alignItems="center"
                            spacing={1}
                          >
                            <CircularProgress size={30} />
                            <Typography
                              color="text.secondary"
                              sx={{ fontSize: "0.75rem" }}
                            >
                              جاري تحميل حضور الفترة...
                            </Typography>
                          </Stack>
                        </Paper>
                      ) : (
                        <>
                          {/* Shift */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.15,
                              borderRadius: 2.7,
                              border:
                                "1px solid rgba(5,117,70,.10)",
                              bgcolor: "#fbfdfc"
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
                              spacing={.8}
                            >
                              <Box>
                                <Typography
                                  color="text.secondary"
                                  sx={{ fontSize: "0.75rem" }}
                                >
                                  الوردية الحالية
                                </Typography>
                                <Typography
                                  sx={{
                                    mt: .1,
                                    fontWeight: 1000,
                                    color: primaryDark,
                                    fontSize: ".78rem"
                                  }}
                                >
                                  {employeeAttendanceShift?.shiftName ||
                                    "لم يتم تعيين وردية"}
                                </Typography>
                              </Box>

                              {employeeAttendanceShift?.startTime && (
                                <Stack
                                  direction="row"
                                  spacing={.45}
                                  flexWrap="wrap"
                                  useFlexGap
                                >
                                  <Chip
                                    size="small"
                                    label={`${String(
                                      employeeAttendanceShift.startTime
                                    ).slice(0, 5)} - ${String(
                                      employeeAttendanceShift.endTime
                                    ).slice(0, 5)}`}
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: 850
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`سماح ${Number(
                                      employeeAttendanceShift.graceMinutes || 0
                                    )} د`}
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: 850
                                    }}
                                  />
                                </Stack>
                              )}
                            </Stack>
                          </Paper>

                          {/* Summary */}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs:
                                  "repeat(2,minmax(0,1fr))",
                                sm:
                                  "repeat(3,minmax(0,1fr))",
                                lg:
                                  "repeat(6,minmax(0,1fr))"
                              },
                              gap: .7
                            }}
                          >
                            {[
                              [
                                "سجلات الفترة",
                                employeeAttendanceTotalCount
                              ],
                              [
                                "حضور",
                                employeeAttendanceSummary.presentCount
                              ],
                              [
                                "تأخير",
                                employeeAttendanceSummary.lateCount
                              ],
                              [
                                "غياب",
                                employeeAttendanceSummary.absentCount
                              ],
                              [
                                "ساعات العمل",
                                formatMinutesAsHours(
                                  employeeAttendanceMetrics.workedMinutes
                                )
                              ],
                              [
                                "إضافي",
                                formatMinutesAsHours(
                                  employeeAttendanceSummary.overtimeMinutes
                                )
                              ]
                            ].map(
                              ([label, value], index) => (
                                <Paper
                                  key={label}
                                  elevation={0}
                                  sx={{
                                    p: .9,
                                    borderRadius: 2.4,
                                    border:
                                      "1px solid rgba(5,117,70,.10)",
                                    bgcolor:
                                      index === 0
                                        ? "#f5faf7"
                                        : "#fff"
                                  }}
                                >
                                  <Typography
                                    color="text.secondary"
                                    sx={{
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    {label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      mt: .15,
                                      fontWeight: 1000,
                                      color:
                                        primaryDark,
                                      fontSize: ".78rem"
                                    }}
                                  >
                                    {value}
                                  </Typography>
                                </Paper>
                              )
                            )}
                          </Box>

                          {/* Extra range metrics */}
                          <Stack
                            direction="row"
                            spacing={.55}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`إجمالي التأخير: ${formatMinutesAsHours(
                                employeeAttendanceMetrics.lateMinutes
                              )}`}
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 850
                              }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`الخروج المبكر: ${formatMinutesAsHours(
                                employeeAttendanceMetrics.earlyLeaveMinutes
                              )}`}
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 850
                              }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`أيام بها حضور: ${employeeAttendanceMetrics.daysWithCheckIn}`}
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 850
                              }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`أيام بها انصراف: ${employeeAttendanceMetrics.daysWithCheckOut}`}
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 850
                              }}
                            />
                          </Stack>

                          {/* Attendance grid */}
                          <Paper
                            elevation={0}
                            dir={ATTENDANCE_GRID_DIRECTION}
                            sx={{
                              borderRadius: 3,
                              overflow: "hidden",
                              border:
                                "1px solid rgba(5,117,70,.10)",
                              textAlign:
                                ATTENDANCE_GRID_TEXT_ALIGN
                            }}
                          >
                            <Box
                              sx={{
                                display: {
                                  xs: "none",
                                  md: "grid"
                                },
                                gridTemplateColumns:
                                  "minmax(145px,1.25fr) minmax(115px,.8fr) minmax(115px,.8fr) minmax(105px,.7fr) minmax(120px,.9fr) minmax(170px,1.4fr)",
                                gap: .7,
                                px: 1.1,
                                py: .75,
                                bgcolor: "#f3f8f5",
                                borderBottom:
                                  "1px solid rgba(5,117,70,.09)"
                              }}
                            >
                              {[
                                "التاريخ",
                                "الحضور",
                                "الانصراف",
                                "الحالة",
                                "ساعات العمل",
                                "التفاصيل"
                              ].map((title) => (
                                <Typography
                                  key={title}
                                  sx={{
                                    fontWeight: 950,
                                    color: primaryDark,
                                    fontSize: "0.75rem"
                                  }}
                                >
                                  {title}
                                </Typography>
                              ))}
                            </Box>

                            <Stack spacing={0}>
                              {employeeAttendance.map(
                                (item, index) => {
                                  const attendanceStatus =
                                    item.status === "Present"
                                      ? "حاضر"
                                      : item.status === "Late"
                                        ? "متأخر"
                                        : item.status === "Absent"
                                          ? "غائب"
                                          : item.status === "Leave"
                                            ? "إجازة"
                                            : item.status === "Remote"
                                              ? "عمل عن بعد"
                                              : item.status === "Off"
                                                ? "راحة"
                                                : item.status === "Incomplete"
                                                  ? "بصمة غير مكتملة"
                                                  : item.status ||
                                                    "غير محدد";

                                  const statusColor =
                                    item.status === "Absent"
                                      ? "error"
                                      : item.status === "Late"
                                        ? "warning"
                                        : item.status === "Present"
                                          ? "success"
                                          : "default";

                                  const details = [
                                    Number(
                                      item.lateMinutes || 0
                                    ) > 0
                                      ? `تأخير ${formatMinutesAsHours(
                                          item.lateMinutes
                                        )}`
                                      : "",
                                    Number(
                                      item.earlyLeaveMinutes || 0
                                    ) > 0
                                      ? `خروج مبكر ${formatMinutesAsHours(
                                          item.earlyLeaveMinutes
                                        )}`
                                      : "",
                                    Number(
                                      item.overtimeMinutes || 0
                                    ) > 0
                                      ? `إضافي ${formatMinutesAsHours(
                                          item.overtimeMinutes
                                        )}`
                                      : "",
                                    item.shiftName
                                      ? `وردية: ${item.shiftName}`
                                      : "",
                                    item.notes || ""
                                  ].filter(Boolean);

                                  return (
                                    <Box
                                      key={
                                        item.attendanceGuid ||
                                        item.attendanceDate ||
                                        index
                                      }
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                          xs:
                                            "repeat(2,minmax(0,1fr))",
                                          md:
                                            "minmax(145px,1.25fr) minmax(115px,.8fr) minmax(115px,.8fr) minmax(105px,.7fr) minmax(120px,.9fr) minmax(170px,1.4fr)"
                                        },
                                        gap: {
                                          xs: .8,
                                          md: .7
                                        },
                                        alignItems: "center",
                                        px: 1.1,
                                        py: .85,
                                        bgcolor:
                                          index % 2 === 0
                                            ? "#fff"
                                            : "#fcfdfc",
                                        borderBottom:
                                          index ===
                                          employeeAttendance.length - 1
                                            ? "none"
                                            : "1px solid rgba(5,117,70,.07)",
                                        "&:hover": {
                                          bgcolor: "#f7fbf8"
                                        }
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          textAlign:
                                            ATTENDANCE_DATE_TEXT_ALIGN
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            display: {
                                              xs: "block",
                                              md: "none"
                                            },
                                            color:
                                              "text.secondary",
                                            fontSize: "0.75rem",
                                            direction: "rtl",
                                            textAlign:
                                              ATTENDANCE_DATE_TEXT_ALIGN
                                          }}
                                        >
                                          التاريخ
                                        </Typography>
                                        <Typography
                                          dir="rtl"
                                          sx={{
                                            fontWeight: 950,
                                            fontSize: "0.75rem",
                                            unicodeBidi: "isolate",
                                            textAlign:
                                              ATTENDANCE_DATE_TEXT_ALIGN
                                          }}
                                        >
                                          {formatAttendanceDate(
                                            item.attendanceDate
                                          )}
                                        </Typography>
                                      </Box>

                                      <Box>
                                        <Typography
                                          sx={{
                                            display: {
                                              xs: "block",
                                              md: "none"
                                            },
                                            color:
                                              "text.secondary",
                                            fontSize: "0.75rem"
                                          }}
                                        >
                                          الحضور
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontWeight: 950,
                                            fontSize: "0.75rem",
                                            color:
                                              item.checkInAt
                                                ? primaryDark
                                                : "#9aa6a0"
                                          }}
                                        >
                                          {formatAttendanceTime(
                                            item.checkInAt
                                          )}
                                        </Typography>
                                      </Box>

                                      <Box>
                                        <Typography
                                          sx={{
                                            display: {
                                              xs: "block",
                                              md: "none"
                                            },
                                            color:
                                              "text.secondary",
                                            fontSize: "0.75rem"
                                          }}
                                        >
                                          الانصراف
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontWeight: 950,
                                            fontSize: "0.75rem",
                                            color:
                                              item.checkOutAt
                                                ? primaryDark
                                                : "#9aa6a0"
                                          }}
                                        >
                                          {formatAttendanceTime(
                                            item.checkOutAt
                                          )}
                                        </Typography>
                                      </Box>

                                      <Box>
                                        <Typography
                                          sx={{
                                            display: {
                                              xs: "block",
                                              md: "none"
                                            },
                                            color:
                                              "text.secondary",
                                            fontSize: "0.75rem",
                                            mb: .2
                                          }}
                                        >
                                          الحالة
                                        </Typography>
                                        <Chip
                                          size="small"
                                          label={
                                            attendanceStatus
                                          }
                                          color={
                                            statusColor
                                          }
                                          sx={{
                                            height: 23,
                                            minWidth: 72,
                                            fontSize: "0.75rem",
                                            fontWeight: 950
                                          }}
                                        />
                                      </Box>

                                      <Box>
                                        <Typography
                                          sx={{
                                            display: {
                                              xs: "block",
                                              md: "none"
                                            },
                                            color:
                                              "text.secondary",
                                            fontSize: "0.75rem"
                                          }}
                                        >
                                          ساعات العمل
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontWeight: 900,
                                            fontSize: "0.75rem"
                                          }}
                                        >
                                          {Number(
                                            item.workedMinutes || 0
                                          ) > 0
                                            ? formatMinutesAsHours(
                                                item.workedMinutes
                                              )
                                            : "-"}
                                        </Typography>
                                      </Box>

                                      <Box
                                        sx={{
                                          gridColumn: {
                                            xs: "1 / -1",
                                            md: "auto"
                                          }
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            display: {
                                              xs: "block",
                                              md: "none"
                                            },
                                            color:
                                              "text.secondary",
                                            fontSize: "0.75rem"
                                          }}
                                        >
                                          التفاصيل
                                        </Typography>

                                        {details.length ? (
                                          <Typography
                                            color="text.secondary"
                                            sx={{
                                              fontSize: "0.75rem",
                                              lineHeight: 1.7
                                            }}
                                          >
                                            {details.join(
                                              " • "
                                            )}
                                          </Typography>
                                        ) : (
                                          <Typography
                                            color="text.secondary"
                                            sx={{
                                              fontSize: "0.75rem"
                                            }}
                                          >
                                            لا توجد ملاحظات
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  );
                                }
                              )}

                              {!employeeAttendance.length && (
                                <Box sx={{ p: 1.2 }}>
                                  <Alert
                                    severity="info"
                                    sx={{
                                      borderRadius: 2,
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    لا توجد سجلات حضور محفوظة للموظف خلال الفترة من{" "}
                                    <Box
                                      component="strong"
                                      dir={ATTENDANCE_DATE_DIRECTION}
                                      sx={{
                                        display: "inline-block",
                                        direction:
                                          ATTENDANCE_DATE_DIRECTION,
                                        unicodeBidi: "isolate"
                                      }}
                                    >
                                      {employeeAttendanceAppliedRange.fromDate}
                                    </Box>{" "}
                                    إلى{" "}
                                    <Box
                                      component="strong"
                                      dir={ATTENDANCE_DATE_DIRECTION}
                                      sx={{
                                        display: "inline-block",
                                        direction:
                                          ATTENDANCE_DATE_DIRECTION,
                                        unicodeBidi: "isolate"
                                      }}
                                    >
                                      {employeeAttendanceAppliedRange.toDate}
                                    </Box>.
                                  </Alert>
                                </Box>
                              )}
                            </Stack>
                          </Paper>
                        </>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* =========================
                    TAB 6 - الإجازات
                    اتجاه مستقل تمامًا عن ملف الموظف
                ========================== */}
                {profileTab === 6 && (
                  <Box
                    dir="rtl"
                    sx={{
                      animation:
                        "fadeSlide .25s ease both",
                      textAlign: "start"
                    }}
                  >
                    <Stack spacing={1}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1, sm: 1.2 },
                          borderRadius: 3,
                          border:
                            "1px solid rgba(5,117,70,.09)",
                          bgcolor: isDark ? darkCard : "#fff"
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
                          <Box>
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontWeight: 1000,
                                color: primaryDark,
                                fontSize: {
                                  xs: ".85rem",
                                  sm: ".98rem"
                                }
                              }}
                            >
                              الإجازات والأرصدة
                            </Typography>
                            <Typography
                              color="text.secondary"
                              sx={{
                                mt: .1,
                                fontSize: "0.75rem"
                              }}
                            >
                              رصيد الموظف وطلبات الإجازات خلال السنة المحددة
                            </Typography>
                          </Box>

                          <Stack sx={uiLayout.filterBarSx}
                            direction="row"
                            spacing={.6}
                            alignItems="center"
                          >
                            <TextField
                              size="small"
                              type="number"
                              label="السنة"
                              value={
                                employeeLeavesYear
                              }
                              onChange={(e) =>
                                setEmployeeLeavesYear(
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              InputLabelProps={{
                                shrink: true
                              }}
                              sx={uiLayout.withUiSx({ width: 110 }, uiLayout.formFieldSx)}
                             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <RefreshIcon />
                              }
                              onClick={() =>
                                loadEmployeeLeaves(
                                  selectedEmployee?.employeeGuid,
                                  employeeLeavesYear
                                )
                              }
                              disabled={
                                employeeLeavesLoading
                              }
                              sx={uiLayout.withUiSx({
                                fontFamily: "Cairo",
                                fontWeight: 900
                              }, uiLayout.buttonSx)}
                            >
                              تحديث
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>

                      {employeeLeavesError && (
                        <Alert
                          severity="error"
                          sx={{ borderRadius: 2 }}
                        >
                          {employeeLeavesError}
                        </Alert>
                      )}

                      {employeeLeavesLoading ? (
                        <Paper
                          elevation={0}
                          sx={{
                            minHeight: 250,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 3,
                            border:
                              "1px solid rgba(5,117,70,.09)"
                          }}
                        >
                          <CircularProgress size={28} />
                        </Paper>
                      ) : (
                        <>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs:
                                  "repeat(2,minmax(0,1fr))",
                                sm:
                                  "repeat(3,minmax(0,1fr))",
                                lg:
                                  "repeat(4,minmax(0,1fr))"
                              },
                              gap: .7
                            }}
                          >
                            {employeeLeaveBalances
                              .filter(
                                (balance) =>
                                  balance.requiresBalance
                              )
                              .map((balance) => (
                                <Paper
                                  key={
                                    balance.leaveTypeGuid
                                  }
                                  elevation={0}
                                  sx={{
                                    p: .9,
                                    borderRadius: 2.4,
                                    border:
                                      "1px solid rgba(5,117,70,.10)",
                                    bgcolor: isDark ? darkCard : "#fff"
                                  }}
                                >
                                  <Typography
                                    color="text.secondary"
                                    sx={{
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    {balance.leaveTypeName}
                                  </Typography>

                                  <Typography
                                    sx={{
                                      mt: .15,
                                      fontWeight: 1000,
                                      color:
                                        Number(
                                          balance.availableDays ||
                                            0
                                        ) > 0
                                          ? primaryDark
                                          : "#a33",
                                      fontSize: ".9rem"
                                    }}
                                  >
                                    {balance.availableDays} يوم متاح
                                  </Typography>

                                  <Typography
                                    color="text.secondary"
                                    sx={{
                                      mt: .2,
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    المستخدم:{" "}
                                    {balance.usedDays || 0}
                                    {" • "}
                                    الافتتاحي:{" "}
                                    {balance.openingBalance ||
                                      0}
                                  </Typography>
                                </Paper>
                              ))}

                            {!employeeLeaveBalances.some(
                              (x) =>
                                x.requiresBalance
                            ) && (
                              <Alert
                                severity="info"
                                sx={{
                                  gridColumn: "1 / -1"
                                }}
                              >
                                لا توجد أنواع إجازات مرتبطة برصيد لهذا الموظف.
                              </Alert>
                            )}
                          </Box>

                          <Paper
                            elevation={0}
                            sx={{
                              borderRadius: 3,
                              overflow: "hidden",
                              border:
                                "1px solid rgba(5,117,70,.10)"
                            }}
                          >
                            <Box
                              sx={{
                                display: {
                                  xs: "none",
                                  md: "grid"
                                },
                                gridTemplateColumns:
                                  "90px minmax(150px,1fr) minmax(180px,1.2fr) 90px 100px minmax(180px,1.2fr)",
                                gap: .7,
                                px: 1,
                                py: .7,
                                bgcolor: "#f3f8f5",
                                fontWeight: 950
                              }}
                            >
                              {[
                                "رقم الطلب",
                                "النوع",
                                "الفترة",
                                "الأيام",
                                "الحالة",
                                "الملاحظات"
                              ].map((title) => (
                                <Typography
                                  key={title}
                                  sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: 950,
                                    color: primaryDark
                                  }}
                                >
                                  {title}
                                </Typography>
                              ))}
                            </Box>

                            <Stack spacing={0}>
                              {employeeLeaveRequests.map(
                                (item, index) => {
                                  const label =
                                    item.status ===
                                    "Pending"
                                      ? "معلق"
                                      : item.status ===
                                          "Approved"
                                        ? "معتمد"
                                        : item.status ===
                                            "Rejected"
                                          ? "مرفوض"
                                          : item.status ===
                                              "Cancelled"
                                            ? "ملغي"
                                            : item.status ||
                                              "-";

                                  const color =
                                    item.status ===
                                    "Approved"
                                      ? "success"
                                      : item.status ===
                                          "Pending"
                                        ? "warning"
                                        : item.status ===
                                            "Rejected"
                                          ? "error"
                                          : "default";

                                  return (
                                    <Box
                                      key={
                                        item.leaveRequestGuid ||
                                        index
                                      }
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                          xs:
                                            "repeat(2,minmax(0,1fr))",
                                          md:
                                            "90px minmax(150px,1fr) minmax(180px,1.2fr) 90px 100px minmax(180px,1.2fr)"
                                        },
                                        gap: .7,
                                        alignItems:
                                          "center",
                                        p: .85,
                                        bgcolor:
                                          index % 2 === 0
                                            ? "#fff"
                                            : "#fcfdfc",
                                        borderBottom:
                                          index ===
                                          employeeLeaveRequests.length -
                                            1
                                            ? "none"
                                            : "1px solid rgba(5,117,70,.07)"
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          fontWeight: 950,
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        #
                                        {item.requestNumber}
                                      </Typography>

                                      <Typography
                                        sx={{
                                          fontWeight: 900,
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        {item.leaveTypeName}
                                      </Typography>

                                      <Typography
                                        dir="ltr"
                                        sx={{
                                          fontSize: "0.75rem",
                                          fontWeight: 850,
                                          textAlign: "center"
                                        }}
                                      >
                                        {item.fromDate
                                          ? String(
                                              item.fromDate
                                            ).slice(
                                              0,
                                              10
                                            )
                                          : "-"}
                                        {" → "}
                                        {item.toDate
                                          ? String(
                                              item.toDate
                                            ).slice(
                                              0,
                                              10
                                            )
                                          : "-"}
                                      </Typography>

                                      <Typography
                                        sx={{
                                          fontWeight: 950,
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        {item.requestedDays}
                                      </Typography>

                                      <Chip
                                        size="small"
                                        label={label}
                                        color={color}
                                        sx={{
                                          height: 22,
                                          fontSize: "0.75rem",
                                          fontWeight: 900
                                        }}
                                      />

                                      <Typography
                                        color="text.secondary"
                                        sx={{
                                          fontSize: "0.75rem",
                                          gridColumn: {
                                            xs: "1 / -1",
                                            md: "auto"
                                          }
                                        }}
                                      >
                                        {item.status ===
                                          "Rejected"
                                          ? item.rejectionReason ||
                                            item.reason ||
                                            "-"
                                          : item.status ===
                                              "Cancelled"
                                            ? item.cancellationReason ||
                                              item.reason ||
                                              "-"
                                            : item.approvalNotes ||
                                              item.reason ||
                                              "-"}
                                      </Typography>
                                    </Box>
                                  );
                                }
                              )}

                              {!employeeLeaveRequests.length && (
                                <Box sx={{ p: 1 }}>
                                  <Alert severity="info">
                                    لا توجد طلبات إجازة للموظف في سنة{" "}
                                    {employeeLeavesYear}.
                                  </Alert>
                                </Box>
                              )}
                            </Stack>
                          </Paper>
                        </>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* =========================
                    TAB 7 - سجل التعديلات
                ========================== */}
                {profileTab === 7 && (
                  <Paper
                    dir={EMPLOYEE_DIALOG_DIRECTION}
                    elevation={0}
                    sx={{
                      p: { xs: .75, sm: 1.05, lg: 1.2 },
                      borderRadius: 3,
                      border: "1px solid rgba(5,117,70,.08)",
                      bgcolor: isDark ? darkCard : "#fff",
                      direction: EMPLOYEE_DIALOG_DIRECTION,
                      animation: "fadeSlide .25s ease both"
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: { xs: .8, sm: 1.1 }, direction: EMPLOYEE_DIALOG_DIRECTION }}
                    >
                      <Box sx={{ minWidth: 0, textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN }}>
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 1000,
                            color: primaryDark,
                            fontSize: { xs: ".78rem", sm: ".92rem" },
                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                          }}
                        >
                          سجل التعديلات
                        </Typography>
                        <Typography
                          sx={{
                            mt: .08,
                            fontFamily: "Cairo",
                            fontSize: { xs: "0.75rem", sm: "0.75rem" },
                            color: "#7d8b84",
                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                          }}
                        >
                          تاريخ واضح لكل تعديل على بيانات الموظف ومرفقاته وعقده
                        </Typography>
                      </Box>

                      <Tooltip title="تحديث السجل">
                        <span>
                          <IconButton
                            size="small"
                            disabled={auditLoading}
                            onClick={() =>
                              loadEmployeeAudit(selectedEmployee.employeeGuid)
                            }
                            sx={{
                              width: { xs: 32, sm: 36 },
                              height: { xs: 32, sm: 36 },
                              color: primaryColor,
                              bgcolor: "#edf7f2",
                              border: "1px solid rgba(5,117,70,.09)"
                            }}
                          >
                            <RefreshIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>

                    {auditLoading ? (
                      <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                        <CircularProgress size={30} sx={{ color: primaryColor }} />
                      </Box>
                    ) : auditLogs.length === 0 ? (
                      <Box
                        sx={{
                          py: { xs: 3.5, sm: 4.5 },
                          textAlign: CENTER_TEXT_ALIGN,
                          borderRadius: 2.5,
                          bgcolor: "#f8fbf9",
                          border: "1px dashed rgba(5,117,70,.12)"
                        }}
                      >
                        <HistoryRoundedIcon
                          sx={{ fontSize: { xs: 36, sm: 42 }, color: "rgba(5,117,70,.18)" }}
                        />
                        <Typography
                          sx={{
                            mt: .4,
                            fontFamily: "Cairo",
                            fontWeight: 900,
                            color: "#68766f",
                            fontSize: { xs: "0.75rem", sm: ".76rem" }
                          }}
                        >
                          لا يوجد سجل تعديلات حتى الآن
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2,minmax(0,1fr))"
                          },
                          gap: { xs: .65, sm: .8 },
                          direction: EMPLOYEE_DIALOG_DIRECTION
                        }}
                      >
                        {auditLogs.map((item, index) => {
                          const action = String(
                            item?.actionType || ""
                          ).toUpperCase();

                          const isDelete =
                            action.includes("DELETE");
                          const isUpload =
                            action.includes("UPLOAD") ||
                            action.includes("ADD");
                          const isPromotion =
                            action.includes("PROMOTION") &&
                            !action.includes("PLAN");
                          const isTransfer =
                            action.includes("JOBTRANSFER");
                          const isPlanCreated =
                            action.includes(
                              "PROMOTIONPLANCREATED"
                            );
                          const isPlanExecuted =
                            action.includes(
                              "PROMOTIONPLANEXECUTED"
                            );
                          const isPlanCancelled =
                            action.includes(
                              "PROMOTIONPLANCANCELLED"
                            );

                          const actionLabel =
                            isPromotion
                              ? "ترقية"
                              : isTransfer
                                ? "نقل وظيفي"
                                : isPlanCreated
                                  ? "خطة ترقية"
                                  : isPlanExecuted
                                    ? "تنفيذ خطة ترقية"
                                    : isPlanCancelled
                                      ? "إلغاء خطة ترقية"
                                      : isDelete
                                        ? "حذف"
                                        : isUpload
                                          ? "إضافة / رفع"
                                          : "تعديل";

                          return (
                            <Paper
                              key={item.auditGuid || `${item.changedAt}-${index}`}
                              elevation={0}
                              sx={{
                                p: { xs: .72, sm: .9 },
                                borderRadius: 2.4,
                                border: index === 0
                                  ? "1px solid rgba(5,117,70,.18)"
                                  : "1px solid rgba(5,117,70,.075)",
                                bgcolor: index === 0 ? "#fbfefd" : "#fff",
                                boxShadow: index === 0
                                  ? "0 6px 18px rgba(5,117,70,.055)"
                                  : "none",
                                direction: EMPLOYEE_DIALOG_DIRECTION
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="flex-start"
                                spacing={.7}
                                sx={{ direction: EMPLOYEE_DIALOG_DIRECTION }}
                              >
                                <Box
                                  sx={{
                                    width: { xs: 30, sm: 34 },
                                    height: { xs: 30, sm: 34 },
                                    borderRadius: 2,
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                    bgcolor:
                                      isPromotion ||
                                      isTransfer ||
                                      isPlanCreated ||
                                      isPlanExecuted ||
                                      isPlanCancelled
                                        ? "rgba(5,117,70,.08)"
                                        : isDelete
                                          ? "#fff1f1"
                                          : isUpload
                                            ? "#eef4ff"
                                            : "#eaf6f0",
                                    color:
                                      isPlanCancelled
                                        ? accentColor
                                        : isDelete
                                          ? accentColor
                                          : isUpload
                                            ? "#315b9a"
                                            : primaryColor
                                  }}
                                >
                                  {isPromotion ||
                                  isPlanExecuted ? (
                                    <TrendingUpRoundedIcon
                                      sx={{ fontSize: 17 }}
                                    />
                                  ) : isTransfer ? (
                                    <SwapHorizRoundedIcon
                                      sx={{ fontSize: 17 }}
                                    />
                                  ) : isPlanCreated ||
                                    isPlanCancelled ? (
                                    <EventNoteRoundedIcon
                                      sx={{ fontSize: 17 }}
                                    />
                                  ) : isDelete ? (
                                    <DeleteOutlineRoundedIcon
                                      sx={{ fontSize: 17 }}
                                    />
                                  ) : isUpload ? (
                                    <CloudUploadOutlinedIcon
                                      sx={{ fontSize: 17 }}
                                    />
                                  ) : (
                                    <HistoryRoundedIcon
                                      sx={{ fontSize: 17 }}
                                    />
                                  )}
                                </Box>

                                <Box sx={{ minWidth: 0, flex: 1, textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN }}>
                                  <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "stretch", sm: "flex-start" }}
                                    spacing={{ xs: .25, sm: .7 }}
                                    sx={{ direction: EMPLOYEE_DIALOG_DIRECTION }}
                                  >
                                    <Box sx={{ minWidth: 0 }}>
                                      <Stack
                                        direction="row"
                                        spacing={.45}
                                        alignItems="center"
                                        sx={{ flexWrap: "wrap", rowGap: .3, direction: EMPLOYEE_DIALOG_DIRECTION }}
                                      >
                                        <Typography
                                          sx={{
                                            fontFamily: "Cairo",
                                            fontWeight: 1000,
                                            fontSize: { xs: "0.75rem", sm: "0.75rem" },
                                            color: "#183228",
                                            textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                          }}
                                        >
                                          {item.fieldDisplayName || item.description || "تعديل"}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          label={actionLabel}
                                          sx={{
                                            height: 20,
                                            fontFamily: "Cairo",
                                            fontWeight: 800,
                                            fontSize: "0.75rem",
                                            bgcolor: isDelete ? "#fff1f1" : isUpload ? "#eef4ff" : "#eaf6f0",
                                            color: isDelete ? accentColor : isUpload ? "#315b9a" : primaryDark
                                          }}
                                        />
                                      </Stack>
                                      <Typography
                                        sx={{
                                          mt: .12,
                                          fontFamily: "Cairo",
                                          fontSize: { xs: "0.75rem", sm: "0.75rem" },
                                          color: "#75827b",
                                          textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                        }}
                                      >
                                        بواسطة {item.changedByName || "مستخدم النظام"}
                                      </Typography>
                                    </Box>

                                    <Typography
                                      sx={{
                                        flexShrink: 0,
                                        fontFamily: "Cairo",
                                        fontSize: { xs: "0.75rem", sm: "0.75rem" },
                                        color: "#8a958f",
                                        textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                      }}
                                    >
                                      {formatDateTime(item.changedAt)}
                                    </Typography>
                                  </Stack>

                                  {(item.oldValue || item.newValue) && (
                                    <Box
                                      sx={{
                                        mt: .6,
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" },
                                        gridTemplateAreas: {
                                          xs: '"old" "new"',
                                          sm: '"old new"'
                                        },
                                        gap: .48,
                                        direction: EMPLOYEE_DIALOG_DIRECTION
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          gridArea: "old",
                                          p: .58,
                                          borderRadius: 1.6,
                                          bgcolor: "#f5f7f6",
                                          border: "1px solid rgba(28,50,40,.04)",
                                          direction: EMPLOYEE_DIALOG_DIRECTION,
                                          textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                        }}
                                      >
                                        <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#8b9690", textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN }}>
                                          السابق
                                        </Typography>
                                        <Typography sx={{ mt: .08, fontFamily: "Cairo", fontSize: { xs: "0.75rem", sm: "0.75rem" }, fontWeight: 800, color: "#58655f", wordBreak: "break-word", textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN }}>
                                          {item.oldValue || "-"}
                                        </Typography>
                                      </Box>

                                      <Box
                                        sx={{
                                          gridArea: "new",
                                          p: .58,
                                          borderRadius: 1.6,
                                          bgcolor: "#edf8f2",
                                          border: "1px solid rgba(5,117,70,.05)",
                                          direction: EMPLOYEE_DIALOG_DIRECTION,
                                          textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
                                        }}
                                      >
                                        <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#6f897c", textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN }}>
                                          الجديد
                                        </Typography>
                                        <Typography sx={{ mt: .08, fontFamily: "Cairo", fontSize: { xs: "0.75rem", sm: "0.75rem" }, fontWeight: 900, color: primaryDark, wordBreak: "break-word", textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN }}>
                                          {item.newValue || "-"}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </Stack>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Paper>
                )}
              </Stack>
            )}
          </DialogContent>
        </Dialog>

        {/* =====================================================
            Dialog - نقل / ترقية / خطة ترقية من ملف الموظف
        ====================================================== */}
        <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
          open={careerActionOpen}
          onClose={() => {
            if (!careerActionSaving) {
              setCareerActionOpen(false);
            }
          }}
          fullWidth
          maxWidth="sm"
          dir={EMPLOYEE_DIALOG_DIRECTION}
          disableEnforceFocus
          PaperProps={{
            sx: {
              borderRadius: 3,
              fontFamily: "Cairo"
            }
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 1000,
              color: primaryDark,
              textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
            }}
          >
            {careerActionMode === "transfer"
              ? "نقل الموظف إلى مسمى وظيفي آخر"
              : careerActionMode === "promotion"
                ? "ترقية الموظف"
                : "إضافة خطة ترقية"}
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              direction: EMPLOYEE_DIALOG_DIRECTION
            }}
          >
            <Stack sx={uiLayout.formSectionSx} spacing={1.1}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 2,
                  borderColor:
                    "rgba(5,117,70,.12)",
                  bgcolor: "#f8fbf9"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    textAlign:
                      EMPLOYEE_DIALOG_TEXT_ALIGN
                  }}
                >
                  {selectedEmployee?.fullName || "-"}
                </Typography>

                <Typography
                  sx={{
                    mt: .2,
                    fontFamily: "Cairo",
                    fontSize: "0.75rem",
                    color: "#718078",
                    textAlign:
                      EMPLOYEE_DIALOG_TEXT_ALIGN
                  }}
                >
                  المسمى الحالي:{" "}
                  {careerData?.current
                    ?.currentJobTitleName ||
                    selectedEmployee?.jobTitle ||
                    "غير محدد"}
                </Typography>
              </Paper>

              <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                <InputLabel>
                  المسمى الوظيفي المستهدف
                </InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="المسمى الوظيفي المستهدف"
                  value={careerTargetJobGuid}
                  onChange={(event) =>
                    setCareerTargetJobGuid(
                      event.target.value
                    )
                  }
                >
                  {careerTargetJobs.map((job) => (
                    <MenuItem
                      key={
                        job.jobTitleGuid ||
                        job.code
                      }
                      value={job.jobTitleGuid}
                    >
                      {job.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField sx={uiLayout.formFieldSx}
                size="small"
                type="date"
                label={
                  careerActionMode === "plan"
                    ? "تاريخ الترقية المخطط"
                    : "تاريخ السريان"
                }
                value={careerActionDate}
                onChange={(event) =>
                  setCareerActionDate(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                size="small"
                label={
                  careerActionMode === "plan"
                    ? "سبب خطة الترقية"
                    : careerActionMode === "promotion"
                      ? "سبب الترقية"
                      : "سبب النقل"
                }
                value={careerActionReason}
                onChange={(event) =>
                  setCareerActionReason(
                    event.target.value
                  )
                }
                multiline
                minRows={2}
                required
              />

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                size="small"
                label="ملاحظات"
                value={careerActionNotes}
                onChange={(event) =>
                  setCareerActionNotes(
                    event.target.value
                  )
                }
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>

          <Box
            sx={uiLayout.withUiSx({
              p: 1.2,
              display: "flex",
              gap: .7,
                        borderTop:
                "1px solid rgba(5,117,70,.08)"
            }, uiLayout.actionBarSx)}
          >
            <Button
              variant="contained"
              onClick={saveCareerAction}
              disabled={careerActionSaving}
              sx={uiLayout.withUiSx({
                bgcolor: primaryColor,
                fontFamily: "Cairo",
                fontWeight: 900,
                "&:hover": {
                  bgcolor: primaryDark
                }
              }, uiLayout.buttonSx)}
            >
              {careerActionSaving
                ? "جاري الحفظ..."
                : careerActionMode === "transfer"
                  ? "تنفيذ النقل"
                  : careerActionMode === "promotion"
                    ? "تنفيذ الترقية"
                    : "إضافة للخطة"}
            </Button>

            <Button
              onClick={() =>
                setCareerActionOpen(false)
              }
              disabled={careerActionSaving}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              إلغاء
            </Button>
          </Box>
        </Dialog>

        <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
          open={documentPreviewOpen}
          onClose={closeEmployeeDocumentPreview}
          maxWidth={false}
          fullWidth
          PaperProps={{
            sx: {
              width: { xs: "calc(100% - 6px)", sm: "min(96vw, 1380px)" },
              maxWidth: { xs: "calc(100% - 6px)", sm: "1380px" },
              height: { xs: "94dvh", sm: "92vh" },
              maxHeight: { xs: "94dvh", sm: "92vh" },
              borderRadius: { xs: 2.5, sm: 4 },
              overflow: "hidden",
              bgcolor: "#f6faf8",
              boxShadow: "0 28px 90px rgba(9,45,31,.32)",
              animation: "dialogPop .3s cubic-bezier(.16,1,.3,1) both"
            }
          }}
        >
          <DialogTitle
            sx={{
              px: { xs: 1, sm: 1.5 },
              py: { xs: .85, sm: 1.05 },
              borderBottom: "1px solid rgba(5,117,70,.09)",
              bgcolor: isDark ? darkCard : "#fff"
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <IconButton
                onClick={closeEmployeeDocumentPreview}
                sx={{ bgcolor: "#f0f4f2", color: "#718078" }}
              >
                <CloseIcon />
              </IconButton>

              <Box sx={{ minWidth: 0, textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN }}>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 1000,
                    color: primaryDark,
                    fontSize: { xs: ".8rem", sm: ".95rem" },
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {documentPreviewKind === "contract" ? "معاينة العقد الوظيفي" : "معاينة المرفق"}
                </Typography>
                <Typography
                  sx={{
                    mt: .1,
                    fontFamily: "Cairo",
                    color: "#7c8983",
                    fontSize: "0.75rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {documentPreviewItem?.originalFileName || (documentPreviewKind === "contract" ? "العقد الوظيفي" : "مرفق الموظف")}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>

          <DialogContent
            sx={{
              p: { xs: .7, sm: 1 },
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              bgcolor: "#f4f8f6"
            }}
          >
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minHeight: 0,
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid rgba(5,117,70,.10)",
                bgcolor: isDark ? darkCard : "#fff",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{
                  px: { xs: .8, sm: 1.1 },
                  py: .7,
                  borderBottom: "1px solid rgba(5,117,70,.07)",
                  bgcolor: "#fbfefc"
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<OpenInNewRoundedIcon />}
                  onClick={openPreviewFileExternally}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: primaryColor,
                    borderColor: "rgba(5,117,70,.22)"
                  }, uiLayout.buttonSx)}
                >
                  فتح الملف
                </Button>

                <Typography
                  sx={{
                    minWidth: 0,
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: "#51645b",
                    fontSize: "0.75rem",
                    textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {documentPreviewKind === "contract"
                    ? "العقد الوظيفي"
                    : (documentPreviewItem?.documentTypeName || "مرفق عام")}
                  {documentPreviewItem?.fileSize
                    ? ` • ${formatFileSize(documentPreviewItem.fileSize)}`
                    : ""}
                </Typography>
              </Stack>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
                  bgcolor: "#edf3f0"
                }}
              >
                {documentPreviewLoading ? (
                  <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                    <Box sx={{ textAlign: CENTER_TEXT_ALIGN }}>
                      <CircularProgress size={34} sx={{ color: primaryColor }} />
                      <Typography
                        sx={{
                          mt: .8,
                          fontFamily: "Cairo",
                          fontWeight: 800,
                          color: "#687970",
                          fontSize: "0.75rem"
                        }}
                      >
                        جاري تجهيز المعاينة...
                      </Typography>
                    </Box>
                  </Box>
                ) : documentPreviewError ? (
                  <Box sx={{ height: "100%", display: "grid", placeItems: "center", p: 2 }}>
                    <Box sx={{ maxWidth: 520, textAlign: CENTER_TEXT_ALIGN }}>
                      <DescriptionOutlinedIcon
                        sx={{ fontSize: 56, color: "rgba(5,117,70,.24)" }}
                      />
                      <Typography
                        sx={{
                          mt: .8,
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: "#42564d",
                          fontSize: ".76rem"
                        }}
                      >
                        المعاينة غير متاحة لهذا الملف
                      </Typography>
                      <Typography
                        sx={{
                          mt: .35,
                          fontFamily: "Cairo",
                          color: "#7b8982",
                          fontSize: "0.75rem",
                          lineHeight: 1.8
                        }}
                      >
                        {documentPreviewError}
                      </Typography>
                    </Box>
                  </Box>
                ) : documentPreviewUrl ? (
                  String(documentPreviewItem?.originalFileName || "").toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? (
                    <Box
                      component="img"
                      src={documentPreviewUrl}
                      alt={documentPreviewItem?.originalFileName || "معاينة المرفق"}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        bgcolor: "#18211d"
                      }}
                    />
                  ) : (
                    <Box
                      component="iframe"
                      title={documentPreviewKind === "contract" ? "معاينة العقد الوظيفي" : "معاينة المرفق"}
                      src={documentPreviewUrl}
                      sx={{
                        width: "100%",
                        height: "100%",
                        border: 0,
                        display: "block",
                        bgcolor: isDark ? darkCard : "#fff"
                      }}
                    />
                  )
                ) : null}
              </Box>
            </Paper>
          </DialogContent>
        </Dialog>


        </Stack>
      </PageContainer>
    </Box></NavigationShell>
  );
};

const EmployeeAvatar = ({
  employee,
  size = 40,
  ring = false
}) => {
  const [imageUrl, setImageUrl] =
    useState(null);
  const [directUrl, setDirectUrl] =
    useState(null);
  const [imageFailed, setImageFailed] =
    useState(false);
  const [imageLoading, setImageLoading] =
    useState(true);

  const employeeGuid = String(
    employee?.employeeGuid ||
    employee?.EmployeeGuid ||
    employee?.guid ||
    employee?.Guid ||
    ""
  ).trim();

  const displayName =
    employee?.fullName ||
    employee?.FullName ||
    "موظف";

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;

    setImageUrl(null);
    setDirectUrl(null);
    setImageFailed(false);
    setImageLoading(Boolean(employeeGuid));

    if (!employeeGuid) {
      setImageLoading(false);
      return () => {};
    }

    const loadImage = async () => {
      const timestamp = Date.now();

      const url =
        `${EMPLOYEE_IMAGE_API}?action=get&userGuid=${encodeURIComponent(employeeGuid)}&t=${timestamp}`;

      try {
        const response = await fetch(
          url,
          {
            method: "GET",
            cache: "no-store"
          }
        );

        if (!response.ok) {
          throw new Error(
            `Image HTTP ${response.status}`
          );
        }

        const blob =
          await response.blob();

        if (!blob || blob.size <= 0) {
          throw new Error(
            "Empty image"
          );
        }

        objectUrl =
          URL.createObjectURL(blob);

        if (mounted) {
          setImageUrl(objectUrl);
          setDirectUrl(null);
        }
      } catch {
        if (mounted) {
          setDirectUrl(url);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [employeeGuid]);

  const firstLetter =
    String(displayName)
      .trim()
      .charAt(0) || "م";

  const src =
    imageUrl ||
    (!imageFailed
      ? directUrl
      : undefined);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        minWidth: size,
        position: "relative",
        borderRadius: "50%",
        p: ring ? "3px" : 0,
        background: ring
          ? "rgba(255,255,255,.25)"
          : "transparent",
        border: ring
          ? "1px solid rgba(255,255,255,.35)"
          : "none",
        display: "grid",
        placeItems: "center"
      }}
    >
      <Avatar
        key={`${employeeGuid}-${src || "fallback"}`}
        src={src || undefined}
        alt={displayName}
        imgProps={{
          onLoad: () => {
            setImageLoading(false);
          },
          onError: () => {
            if (
              imageUrl &&
              !directUrl
            ) {
              setImageUrl(null);
              setDirectUrl(
                `${EMPLOYEE_IMAGE_API}?action=get&userGuid=${encodeURIComponent(employeeGuid)}&t=${Date.now()}`
              );
              setImageLoading(true);
            } else {
              setImageFailed(true);
              setDirectUrl(null);
              setImageUrl(null);
              setImageLoading(false);
            }
          }
        }}
        sx={{
          width: ring
            ? size - 6
            : size,
          height: ring
            ? size - 6
            : size,
          bgcolor: "#e6f3ee",
          color: primaryColor,
          fontFamily: "Cairo",
          fontWeight: 900,
          fontSize:
            `${Math.max(
              14,
              size * .38
            )}px`,
          border: ring
            ? "2px solid rgba(255,255,255,.88)"
            : "1px solid rgba(5,117,70,.10)",
          overflow: "hidden",
          opacity:
            imageLoading && src
              ? .35
              : 1,
          transition:
            "opacity .25s ease, transform .25s ease",
          "& img": {
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }
        }}
      >
        {!src && !imageLoading
          ? firstLetter
          : null}
      </Avatar>

      {imageLoading && (
        <Box
          sx={{
            position: "absolute",
            inset: ring
              ? 3
              : 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor:
              "rgba(255,255,255,.68)",
            backdropFilter:
              "blur(2px)"
          }}
        >
          <CircularProgress
            size={Math.max(
              15,
              size * .32
            )}
            thickness={4.5}
            sx={{
              color: primaryColor
            }}
          />
        </Box>
      )}
    </Box>
  );
};

const EmployeeDetail = ({
  label,
  value,
  ltr = false,
  wide = false
}) => (
  <Paper
    dir={EMPLOYEE_DIALOG_DIRECTION}
    elevation={0}
    sx={{
      position: "relative",
      overflow: "hidden",
      p: { xs: .82, sm: 1.05 },
      minHeight: { xs: 58, sm: 68 },
      borderRadius: 2.2,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      border: "1px solid rgba(5,117,70,0.075)",
      background: "linear-gradient(145deg,#ffffff 0%,#f8fcfa 100%)",
      direction: EMPLOYEE_DIALOG_DIRECTION,
      textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
      transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
      "&:before": {
        content: '""',
        position: "absolute",
        insetInlineStart: 0,
        top: 10,
        bottom: 10,
        width: 3,
        borderRadius: 3,
        bgcolor: "rgba(5,117,70,.22)"
      },
      "&:hover": {
        transform: "translateY(-1px)",
        borderColor: "rgba(5,117,70,.16)",
        boxShadow: "0 5px 14px rgba(5,117,70,.055)"
      },
      gridColumn: wide ? { xs: "1 / -1", sm: "1 / -1" } : "auto"
    }}
  >
    <Typography
      sx={{
        fontFamily: "Cairo",
        fontSize: { xs: "0.75rem", sm: "0.75rem" },
        fontWeight: 800,
        color: "#7b8982",
        mb: .28,
        textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        fontFamily: "Cairo",
        fontWeight: 900,
        fontSize: { xs: ".76rem", sm: ".9rem" },
        color: "#18241f",
        textAlign: EMPLOYEE_DIALOG_TEXT_ALIGN,
        wordBreak: "break-word",
        lineHeight: 1.55
      }}
    >
      {ltr ? <bdi dir="ltr">{value || "-"}</bdi> : value || "-"}
    </Typography>
  </Paper>
);

const StatCard = ({
  title,
  value,
  icon,
  description
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 1, sm: 1.25, md: 1.5 },
      borderRadius: { xs: 2.3, sm: 2.8, md: 3.2 },
      border: "1px solid rgba(5,117,70,0.10)",
      boxShadow:
        "0 4px 15px rgba(5,117,70,0.05)"
    }}
  >
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="center"
      justifyContent="center"
      sx={{ textAlign: CENTER_TEXT_ALIGN }}
    >
      <Box
        sx={{
          width: { xs: 34, sm: 38, md: 42 },
          height: { xs: 34, sm: 38, md: 42 },
          borderRadius: { xs: 2, sm: 2.2, md: 2.5 },
          display: "grid",
          placeItems: "center",
          bgcolor: primaryLight,
          color: primaryColor,
          flexShrink: 0
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900,
            fontSize: {
              xs: ".95rem",
              sm: "1.08rem",
              md: "1.25rem"
            },
            color: primaryDark
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            fontFamily: "Cairo",
            fontWeight: 800,
            fontSize: {
              xs: "0.75rem",
              sm: "0.75rem",
              md: ".75rem"
            }
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontFamily: "Cairo",
            display: {
              xs: "none",
              md: "block"
            }
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const InfoLine = ({
  icon,
  label,
  value
}) => (
  <Stack
    direction="row"
    spacing={1}
    alignItems="flex-start"
  >
    <Box
      sx={{
        color: primaryColor,
        mt: "2px",
        "& svg": {
          fontSize: "1rem"
        }
      }}
    >
      {icon}
    </Box>

    <Typography
      variant="body2"
      sx={{
        fontFamily: "Cairo",
        wordBreak: "break-word"
      }}
    >
      <Box
        component="span"
        sx={{ fontWeight: 900 }}
      >
        {label}:{" "}
      </Box>
      {value || "غير محدد"}
    </Typography>
  </Stack>
);

export default HrEmployeesPage;
