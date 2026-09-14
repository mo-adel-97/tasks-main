import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useRef, useState } from "react";

import Swal from "sweetalert2";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Avatar,
  LinearProgress,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  TextareaAutosize,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Star,
  StarBorder,
  StarHalf,
  RateReview,
  Comment,
  Recommend,
  Delete,
  Edit,
  Save,
  Cancel,
  History,
  Assessment,
  TrendingUp,
  TrendingDown,
  Equalizer,
  InsertChart,
  BarChart,
  PieChart,
  Timeline,
  ShowChart,
  MultilineChart,
  DonutLarge,
  DonutSmall,
  BubbleChart,
  ScatterPlot,
  StackedLineChart,
} from "@mui/icons-material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import GetAppIcon from "@mui/icons-material/GetApp";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TaskIcon from "@mui/icons-material/Task";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HourglassFullIcon from "@mui/icons-material/HourglassFull";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";



// Users/Branches API
const API_BASE = "https://api1.sstli.com";

// ✅ Trainer payments API (السداد والتحصيل)
const TRAINER_API_BASE = "https://api3.sstli.com";

// ✅ Productivity API (الإنتاجية الأسبوعية)
const PRODUCTIVITY_API = "https://filesregsiteration.sstli.com/erp/api.php";

// ✅ Tasks API (المهام) - جميع الـ APIs المطلوبة
const TASKS_API = {
  PUBLIC_TASKS: "https://api3.sstli.com/api/PuplicTask/GetPuplicTasksByQuery",
  PASSED_TASKS: "https://filesregsiteration.sstli.com/tasks/get_passed_tasks.php",
  EXTERNAL_TASKS: "https://filesregsiteration.sstli.com/tasks/get_ubdated_tasks.php",
  DOWNLOAD: "https://api3.sstli.com/api/PuplicTask/DownloadFile",
  GET_TASK_UPDATES: "https://api3.sstli.com/api/PuplicTask/GetTaskUpdates",
  DOWNLOAD_TASK_ATTACHMENT: "https://api3.sstli.com/api/PuplicTask/DownloadTaskAttachment",
};

// ✅ HR Evaluations API
const HR_EVALUATIONS_API = "https://filesregsiteration.sstli.com/erp/hr_evaluations_api.php";

// Brand
const BRAND = "#80b49e";
const BRAND_DARK = "#6a9a87";
const BRAND_LIGHT = "#9ac9b5";

// Helper function to resolve file URLs
const FILES_BASE_URL = 'https://filesregsiteration.sstli.com/erp/';
const resolveFileUrl = (u) => {
  if (!u) return '';
  const s = String(u).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const clean = s.replace(/^\/+/, '');
  return new URL(clean, FILES_BASE_URL).toString();
};

// Function to get file icon based on type
const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return <ImageIcon color="primary" />;
  if (fileType === 'application/pdf') return <PictureAsPdfIcon sx={{ color: '#f44336' }} />;
  if (fileType?.includes('video')) return <VideoLibraryIcon color="secondary" />;
  if (fileType?.includes('word') || fileType?.includes('document')) return <DescriptionIcon sx={{ color: '#2196f3' }} />;
  if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return <DescriptionIcon sx={{ color: '#4caf50' }} />;
  return <InsertDriveFileIcon color="action" />;
};

/**
 * Period rule للسداد والتحصيل:
 * - لو الشهر = 12/2025 => from 2025-12-15 to 2026-01-14
 * - لو الشهر = 1/2026  => from 2026-01-15 to 2026-02-14
 */
const buildPaymentPeriod = (year, month1to12) => {
  const from = new Date(year, month1to12 - 1, 15);
  const to = new Date(year, month1to12 - 1 + 1, 14);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    fromDate: fmt(from),
    toDate: fmt(to),
  };
};

/**
 * ✅ فترة التسجيلات (من أول الشهر لآخر يوم في الشهر)
 */
const buildRegistrationPeriod = (year, month1to12) => {
  const from = new Date(year, month1to12 - 1, 1);
  const to = new Date(year, month1to12, 0);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    regFromDate: fmt(from),
    regToDate: fmt(to),
  };
};

/**
 * ✅ فترة الإنتاجية (نفس فترة التسجيلات - من أول الشهر لآخر يوم في الشهر)
 */
const buildProductivityPeriod = (year, month1to12) => {
  const from = new Date(year, month1to12 - 1, 1);
  const to = new Date(year, month1to12, 0);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    prodFromDate: fmt(from),
    prodToDate: fmt(to),
  };
};

/**
 * ✅ فترة المهام (نفس فترة التسجيلات - من أول الشهر لآخر يوم في الشهر)
 */
const buildTasksPeriod = (year, month1to12) => {
  const from = new Date(year, month1to12 - 1, 1);
  const to = new Date(year, month1to12, 0);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    tasksFromDate: fmt(from),
    tasksToDate: fmt(to),
  };
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return "غير محدد";
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to generate color from string (for avatars)
function stringToColor(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

// Service for HR Evaluations
class HREvaluationService {
  static async addEvaluation(evaluationData) {
    try {
      const formData = new FormData();
      
      formData.append('employee_guid', evaluationData.employee_guid);
      formData.append('branch_for_work', evaluationData.branch_for_work || '');
      formData.append('evaluation_month', evaluationData.evaluation_month);
      formData.append('evaluation_year', evaluationData.evaluation_year);
      formData.append('rating', evaluationData.rating);
      formData.append('notes', evaluationData.notes || '');
      formData.append('hr_recommendations', evaluationData.hr_recommendations || '');
      formData.append('evaluated_by', evaluationData.evaluated_by);
      
      const response = await fetch(`${HR_EVALUATIONS_API}?action=add`, {
        method: 'POST',
        body: formData
      });
      
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'فشل إضافة التقييم',
        error: error.message
      };
    }
  }
  
  static async updateEvaluation(id, updateData) {
    try {
      const formData = new FormData();
      formData.append('id', id);
      
      if (updateData.rating !== undefined) {
        formData.append('rating', updateData.rating);
      }
      
      if (updateData.notes !== undefined) {
        formData.append('notes', updateData.notes);
      }
      
      if (updateData.hr_recommendations !== undefined) {
        formData.append('hr_recommendations', updateData.hr_recommendations);
      }
      
      const response = await fetch(`${HR_EVALUATIONS_API}?action=update`, {
        method: 'POST',
        body: formData
      });
      
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'فشل تحديث التقييم',
        error: error.message
      };
    }
  }
  
static async getEmployeeEvaluations(employee_guid, year = null, month = null, limit = 1000) {
  try {
    let url = `${HR_EVALUATIONS_API}?action=get_by_employee&employee_guid=${employee_guid}&limit=${limit}`;
    
    // فقط إذا تم تمرير year/month نضيفهم
    if (year) {
      url += `&year=${year}`;
    }
    
    if (month) {
      url += `&month=${month}`;
    }
    
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'فشل جلب التقييمات',
      error: error.message
    };
  }
}
  
  static async getEvaluationById(id) {
    try {
      const response = await fetch(`${HR_EVALUATIONS_API}?action=get_by_id&id=${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'فشل جلب التقييم',
        error: error.message
      };
    }
  }
  
  static async deleteEvaluation(id) {
    try {
      const response = await fetch(`${HR_EVALUATIONS_API}?action=delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'فشل حذف التقييم',
        error: error.message
      };
    }
  }
  
  static async searchEvaluations(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.branch) params.append('branch', filters.branch);
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.min_rating) params.append('min_rating', filters.min_rating);
      if (filters.max_rating) params.append('max_rating', filters.max_rating);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      const response = await fetch(`${HR_EVALUATIONS_API}?action=search&${params.toString()}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'فشل البحث في التقييمات',
        error: error.message
      };
    }
  }
}

const EmployeeEvaluationPage = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getTaskStatusHex = (task) => {
    const key = task?.statusInfo?.color;
    return paletteMain(key);
  };

  const theme = useTheme();

  const paletteMain = (key) => {
    if (!key) return theme.palette.text.primary;
    if (typeof key === "string" && (key.startsWith("#") || key.startsWith("rgb") || key.startsWith("hsl"))) {
      return key;
    }

    const p = theme.palette?.[key];
    if (p?.main) return p.main;

    return theme.palette.text.primary;
  };

  // Filters
  const [q, setQ] = useState("");
  const [branchGuid, setBranchGuid] = useState("all");

  // ✅ Evaluation month/year filter
  const now = new Date();
  const [evalMonth, setEvalMonth] = useState(now.getMonth() + 1);
  const [evalYear, setEvalYear] = useState(now.getFullYear());

  // View mode + paging
  const [viewMode, setViewMode] = useState("cards");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Sorting
  const [sortBy, setSortBy] = useState("registrations");
  const [sortOrder, setSortOrder] = useState("desc");

  // Dialog (evaluation/details)
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogTab, setDialogTab] = useState(0);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // HR Evaluation States
  const [hrEvaluations, setHrEvaluations] = useState([]);
  const [hrStats, setHrStats] = useState({ average_rating: 0, total_evaluations: 0 });
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [hrRecommendations, setHrRecommendations] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [evaluatedBy, setEvaluatedBy] = useState('');
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');
  const [evaluationSuccess, setEvaluationSuccess] = useState('');

  /**
   * ✅ Basic employee info only in cache
   */
  const [payStats, setPayStats] = useState(() => new Map());
  const [regStats, setRegStats] = useState(() => new Map());
  const [productivityStats, setProductivityStats] = useState(() => new Map());
  const [tasksStats, setTasksStats] = useState(() => new Map());
  
  // الفترات
  const { fromDate, toDate } = useMemo(
    () => buildPaymentPeriod(evalYear, evalMonth),
    [evalYear, evalMonth]
  );

  const { regFromDate, regToDate } = useMemo(
    () => buildRegistrationPeriod(evalYear, evalMonth),
    [evalYear, evalMonth]
  );

  const { prodFromDate, prodToDate } = useMemo(
    () => buildProductivityPeriod(evalYear, evalMonth),
    [evalYear, evalMonth]
  );

  const { tasksFromDate, tasksToDate } = useMemo(
    () => buildTasksPeriod(evalYear, evalMonth),
    [evalYear, evalMonth]
  );

  // جلب GUID المستخدم من localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setEvaluatedBy(user.guid || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersRes, branchesRes] = await Promise.all([
        fetch(`${API_BASE}/api/userinfo`),
        fetch(`${API_BASE}/api/branches/all`),
      ]);

      if (!usersRes.ok) throw new Error("فشل تحميل الموظفين");
      if (!branchesRes.ok) throw new Error("فشل تحميل الفروع");

      const usersJson = await usersRes.json();
      const branchesJson = await branchesRes.json();

      setUsers(Array.isArray(usersJson) ? usersJson : []);
      setBranches(Array.isArray(branchesJson) ? branchesJson : []);
    } catch (e) {
      setError(e?.message || "حصل خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Map branch guid -> name
  const branchNameByGuid = useMemo(() => {
    const map = new Map();
    for (const b of branches) {
      if (b?.guid) map.set(String(b.guid).toLowerCase(), b?.name || "—");
    }
    return map;
  }, [branches]);

  const getBranchName = (guid) => {
    const key = String(guid || "").toLowerCase();
    return branchNameByGuid.get(key) || "غير محدد";
  };

  // ✅ Only job 14 + ONLY ACTIVE
  const employees = useMemo(() => {
    return (users || []).filter(
      (u) => Number(u?.userJop) === 14 && Boolean(u?.staut_) === true
    );
  }, [users]);

  // Branch list used in filter
  const branchOptions = useMemo(() => {
    const used = new Set(
      employees
        .map((e) => String(e?.branchForWork || "").toLowerCase())
        .filter(Boolean)
    );

    const opts = branches
      .filter((b) => used.has(String(b?.guid || "").toLowerCase()))
      .map((b) => ({ guid: b.guid, name: b.name }));

    if (opts.length === 0) {
      return branches.map((b) => ({ guid: b.guid, name: b.name }));
    }

    return opts;
  }, [employees, branches]);

  // ========== PAYMENTS ==========
  const buildPayKey = (u) => {
    const b = String(u?.branchForWork || "");
    const t = String(u?.trainerGuid || "");
    return `pay_${t}|${b}|${fromDate}|${toDate}`;
  };

  const fetchPayStatsForUser = async (u) => {
    const trainerGuid = u?.trainerGuid;
    const branchForWork = u?.branchForWork;

    if (!trainerGuid || !branchForWork) {
      const key = buildPayKey(u);
      setPayStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "error",
          message: "بيانات trainerGuid/branchForWork ناقصة",
        });
        return next;
      });
      return;
    }

    const key = buildPayKey(u);

    // cached?
    const cached = payStats.get(key);
    if (cached?.status === "done" || cached?.status === "error") return;

    // set loading
    setPayStats((prev) => {
      const next = new Map(prev);
      next.set(key, { status: "loading" });
      return next;
    });

    try {
      const url =
        `${TRAINER_API_BASE}/api/Trainer/StudentList` +
        `?branchGuid=${encodeURIComponent(branchForWork)}` +
        `&trainerGuid=${encodeURIComponent(trainerGuid)}` +
        `&fromDate=${encodeURIComponent(fromDate)}` +
        `&toDate=${encodeURIComponent(toDate)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("فشل تحميل السداد/التحصيل");

      const json = await res.json();
      const arr = Array.isArray(json?.data) ? json.data : [];

      const total = arr.length;
      const paid = arr.filter((x) => Number(x?.monthpay || 0) > 0).length;
      const percent = total === 0 ? 0 : Math.round((paid / total) * 100);

      setPayStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "done",
          total,
          paid,
          percent,
        });
        return next;
      });
    } catch (e) {
      setPayStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "error",
          message: e?.message || "حصل خطأ",
        });
        return next;
      });
    }
  };

  // ========== REGISTRATIONS ==========
  const buildRegKey = (u) => {
    const sellerGuid = u?.sellerGuid || "";
    return `reg_${sellerGuid}|${regFromDate}|${regToDate}`;
  };

  const fetchRegStatsForUser = async (u) => {
    const sellerGuid = u?.sellerGuid || "";

    if (!sellerGuid) {
      const key = buildRegKey(u);
      setRegStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "no_data",
          message: "الموظف ليس مندوب مبيعات",
        });
        return next;
      });
      return;
    }

    const key = buildRegKey(u);

    // cached?
    const cached = regStats.get(key);
    if (cached?.status === "done" || cached?.status === "error" || cached?.status === "no_data") return;

    // set loading
    setRegStats((prev) => {
      const next = new Map(prev);
      next.set(key, { status: "loading" });
      return next;
    });

    try {
      const url =
        `${API_BASE}/api/UserInfo/sales-report` +
        `?regStartDate=${encodeURIComponent(regFromDate)}` +
        `&regEndDate=${encodeURIComponent(regToDate)}` +
        `&userGuid=${encodeURIComponent(sellerGuid)}`;

      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 404) {
          setRegStats((prev) => {
            const next = new Map(prev);
            next.set(key, {
              status: "no_data",
              message: "لا توجد تسجيلات في الفترة المحددة",
            });
            return next;
          });
          return;
        }
        throw new Error(`فشل تحميل التسجيلات: ${res.status}`);
      }

      const json = await res.json();
      
      let data;
      if (Array.isArray(json)) {
        data = json.length > 0 ? json[0] : {};
      } else {
        data = json || {};
      }

      const civil = Number(data["دبلوم مدني"] || 0);
      const mil = Number(data["دبلوم عسكري"] || 0);
      const qual = Number(data["دورة تأهيلية"] || 0);
      const dev = Number(data["دورة تطويرية"] || 0);

      const totalDiplomas = civil + mil;
      const totalCourses = qual + dev;
      const totalRegistrations = totalDiplomas + totalCourses;

      setRegStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "done",
          totalRegistrations,
          totalDiplomas,
          totalCourses,
          civil,
          mil,
          qual,
          dev,
        });
        return next;
      });
    } catch (e) {
      setRegStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "error",
          message: e?.message || "حصل خطأ في تحميل التسجيلات",
        });
        return next;
      });
    }
  };

  // ========== FETCH DETAILED DATA FOR DIALOG ==========
  const fetchDetailedDataForUser = async (user) => {
    if (!user) return;
    
    setDialogLoading(true);
    setDialogError("");
    
    try {
      // Fetch payments
      await fetchPayStatsForUser(user);
      
      // Fetch registrations
      await fetchRegStatsForUser(user);
      
      // Fetch productivity for the selected month
      await fetchProductivityForUser(user);
      
      // Fetch tasks for the selected month
      await fetchTasksForUser(user);
      
      // Fetch HR evaluations for the selected month
      await loadHREvaluations(user);
      
    } catch (e) {
      setDialogError(e?.message || "حصل خطأ في تحميل البيانات");
    } finally {
      setDialogLoading(false);
    }
  };

  // ========== PRODUCTIVITY (يتم جلبها عند فتح الديالوج فقط) ==========
  const buildProdKey = (u) => {
    const userGuid = u?.guid || u?.userGuid || "";
    return `prod_${userGuid}|${prodFromDate}|${prodToDate}`;
  };

  const fetchProductivityForUser = async (u) => {
    const userGuid = u?.guid || u?.userGuid || "";

    if (!userGuid) {
      const key = buildProdKey(u);
      setProductivityStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "error",
          message: "بيانات userGuid ناقصة",
        });
        return next;
      });
      return;
    }

    const key = buildProdKey(u);

    // set loading
    setProductivityStats((prev) => {
      const next = new Map(prev);
      next.set(key, { status: "loading" });
      return next;
    });

    try {
      const url = new URL(PRODUCTIVITY_API);
      url.searchParams.set('action', 'list');
      url.searchParams.set('userGuid', userGuid);

      const res = await fetch(url.toString(), { method: 'GET' });
      
      if (!res.ok) throw new Error("فشل تحميل الإنتاجية");

      const json = await res.json();
      
      if (!json.ok) {
        throw new Error(json.error || 'API error');
      }

      const allRows = (json.data || []).map(r => ({
        id: r.achievement_id,
        userGuid: r.user_guid,
        mainTitle: r.main_title,
        startDate: r.start_date,
        endDate: r.end_date,
        overallStatus: r.overall_status,
        completionPercentage: r.completion_percentage,
        itemCount: r.item_count,
        completedItems: r.completed_items,
        notes: r.notes,
        items: Array.isArray(r.items_json) ? r.items_json.map(it => ({
          id: it.id ?? Date.now(),
          title: it.title ?? '',
          description: it.description ?? '',
          status: it.status ?? 'معلق',
          completed: !!it.completed,
          files: Array.isArray(it.files) ? it.files.map(f => {
            const raw = f.url || '';
            return {
              id: f.id ?? Date.now(),
              name: f.name ?? 'file',
              type: f.type ?? '',
              size: f.size ?? 0,
              preview: resolveFileUrl(raw),
              url: resolveFileUrl(raw),
              rawUrl: raw
            };
          }) : []
        })) : []
      }));

      // Filter by month
      const filteredRows = allRows.filter(row => {
        if (!row.startDate) return false;
        const rowDate = new Date(row.startDate);
        const rowYear = rowDate.getFullYear();
        const rowMonth = rowDate.getMonth() + 1;
        return rowYear === evalYear && rowMonth === evalMonth;
      });

      // Calculate summary stats for filtered rows
      const totalWeeks = filteredRows.length;
      const totalItems = filteredRows.reduce((sum, r) => sum + (r.itemCount || 0), 0);
      const completedItems = filteredRows.reduce((sum, r) => sum + (r.completedItems || 0), 0);
      const avgProgress = totalWeeks > 0 
        ? Math.round(filteredRows.reduce((sum, r) => sum + (r.completionPercentage || 0), 0) / totalWeeks)
        : 0;
      const totalFiles = filteredRows.reduce((sum, r) => 
        sum + (r.items?.reduce((itemSum, item) => itemSum + (item.files?.length || 0), 0) || 0), 0);

      setProductivityStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "done",
          data: filteredRows,
          allData: allRows,
          summary: {
            totalWeeks,
            totalItems,
            completedItems,
            avgProgress,
            totalFiles,
            recentWeeks: filteredRows.slice(0, 10)
          }
        });
        return next;
      });
    } catch (e) {
      setProductivityStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "error",
          message: e?.message || "حصل خطأ في تحميل الإنتاجية",
        });
        return next;
      });
    }
  };

  // ========== TASKS (يتم جلبها عند فتح الديالوج فقط) ==========
  const buildTasksKey = (u) => {
    const userGuid = u?.guid || u?.userGuid || "";
    return `tasks_${userGuid}|${tasksFromDate}|${tasksToDate}`;
  };

  const fetchTasksForUser = async (u) => {
    const userGuid = u?.guid || u?.userGuid || "";

    if (!userGuid) {
      const key = buildTasksKey(u);
      setTasksStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "error",
          message: "بيانات userGuid ناقصة",
        });
        return next;
      });
      return;
    }

    const key = buildTasksKey(u);

    // set loading
    setTasksStats((prev) => {
      const next = new Map(prev);
      next.set(key, { status: "loading" });
      return next;
    });

    try {
      const publicTasksRes = await fetch(TASKS_API.PUBLIC_TASKS);
      const publicTasks = await publicTasksRes.json();
      
      const passedTasksRes = await fetch(`${TASKS_API.PASSED_TASKS}?userGuid=${userGuid}`);
      const passedTasksData = await passedTasksRes.json();
      
      const externalTasksRes = await fetch(TASKS_API.EXTERNAL_TASKS);
      const externalTasksData = await externalTasksRes.json();
      const externalTasks = externalTasksData.success ? externalTasksData.data : [];

      const filteredTasks = (publicTasks || []).filter(task => {
        const taskDate = new Date(task.createdAt);
        const taskYear = taskDate.getFullYear();
        const taskMonth = taskDate.getMonth() + 1;
        
        if (taskYear !== evalYear || taskMonth !== evalMonth) {
          return false;
        }

        const isModifiedExternally = externalTasks.some(externalTask => 
          parseInt(externalTask.TaskId) === parseInt(task.id)
        );

        if (isModifiedExternally) {
          const externalTask = externalTasks.find(et => parseInt(et.TaskId) === parseInt(task.id));
          if (externalTask && externalTask.AssignedTo) {
            try {
              const externalAssignedTo = typeof externalTask.AssignedTo === 'string' 
                ? JSON.parse(externalTask.AssignedTo) 
                : externalTask.AssignedTo;
              
              const isInExternalAssignedTo = Array.isArray(externalAssignedTo) && 
                externalAssignedTo.some(user => user.guid === userGuid);
              
              return isInExternalAssignedTo;
            } catch (e) {
              console.error("Error parsing external AssignedTo:", e);
            }
          }
          return false;
        }

        try {
          const assignedToString = task.assignedTo?.replace(/\\/g, '') || '[]';
          const assignedUsers = JSON.parse(assignedToString);
          const isDirectlyAssigned = Array.isArray(assignedUsers) && 
            assignedUsers.some(user => user.guid === userGuid);
          
          const isPassedToUser = passedTasksData.success && 
            passedTasksData.data.some(passedTask => 
              passedTask.task_info.task_id === task.id.toString() &&
              passedTask.passing_history[passedTask.passing_history.length - 1].receiver_guid === userGuid
            );
          
          return isDirectlyAssigned || isPassedToUser;
        } catch (e) {
          console.error("Error parsing assignedTo:", e);
          return false;
        }
      });

      const tasksWithUpdates = await Promise.all(
        filteredTasks.map(async (task) => {
          try {
            const updatesRes = await fetch(`${TASKS_API.GET_TASK_UPDATES}/${task.id}`);
            let updates = [];
            if (updatesRes.ok) {
              updates = await updatesRes.json();
            }
            
            const userUpdates = updates.filter(update => update.updatedBy === userGuid);
            const lastUpdate = userUpdates[userUpdates.length - 1];
            
            const passedTaskInfo = passedTasksData.success 
              ? passedTasksData.data.find(pt => pt.task_info.task_id === task.id.toString())
              : null;
            
            const isModifiedExternally = externalTasks.some(externalTask => 
              parseInt(externalTask.TaskId) === parseInt(task.id)
            );
            const externalTaskData = isModifiedExternally ? 
              externalTasks.find(et => parseInt(et.TaskId) === parseInt(task.id)) : null;

            const createdAt = externalTaskData?.ModifiedDate || task.createdAt;
            const created = new Date(createdAt);
            created.setTime(created.getTime() + 3 * 60 * 60 * 1000);
            
            const taskTimeInHours = externalTaskData?.TaskTimeInMinutes || task.taskTimeInMinutes;
            const deadline = created.getTime() + taskTimeInHours * 60 * 60 * 1000;
            const timeLeft = Math.max(0, deadline - Date.now());
            const ended = timeLeft <= 0;

            const finalStatus = lastUpdate ? lastUpdate.status : task.status;
            const finalStatusNote = lastUpdate ? lastUpdate.statusNote : null;
            const finalAttachment = lastUpdate ? lastUpdate.attachmentFilePath : null;

            const getStatusInfo = (status) => {
              switch(status) {
                case 0: return { 
                  label: "معلقة", 
                  color: "warning", 
                  icon: <HourglassEmptyIcon />,
                  description: "لم يبدأ الموظف العمل على المهمة بعد"
                };
                case 1: return { 
                  label: "جاري التنفيذ", 
                  color: "info", 
                  icon: <HourglassFullIcon />,
                  description: "الموظف يعمل حالياً على المهمة"
                };
                case 2: return { 
                  label: "مكتملة", 
                  color: "success", 
                  icon: <CheckCircleOutlineIcon />,
                  description: "أنهى الموظف المهمة بنجاح"
                };
                case 3: return { 
                  label: "مرفوضة", 
                  color: "error", 
                  icon: <CancelIcon />,
                  description: "رفض الموظف المهمة"
                };
                default: return { 
                  label: "غير محددة", 
                  color: "default", 
                  icon: <TaskIcon />,
                  description: "حالة غير محددة"
                };
              }
            };

            return {
              id: task.id,
              name: externalTaskData?.TaskName || task.taskName,
              description: externalTaskData?.TaskDescription || task.taskDescription,
              createdAt: task.createdAt,
              deadline: deadline,
              status: finalStatus,
              originalStatus: task.status,
              statusInfo: getStatusInfo(finalStatus),
              ended: ended,
              taskTimeInHours: taskTimeInHours,
              allowAttach: task.allowAttach,
              attachmentPath: externalTaskData?.AttachFileName || task.attachmentPath,
              
              hasUserResponse: !!lastUpdate,
              lastUpdate: lastUpdate ? {
                status: lastUpdate.status,
                statusNote: lastUpdate.statusNote,
                attachmentFilePath: lastUpdate.attachmentFilePath,
                updatedAt: lastUpdate.updatedAt,
                hasAttachment: !!lastUpdate.attachmentFilePath && 
                              lastUpdate.attachmentFilePath.toLowerCase() !== "fake.txt",
                updatedBy: lastUpdate.updatedBy
              } : null,
              allUpdates: userUpdates,
              updateCount: userUpdates.length,
              
              isModifiedExternally: isModifiedExternally,
              isPassedTask: !!passedTaskInfo,
              passingHistory: passedTaskInfo ? passedTaskInfo.passing_history : null,
              assignedByName: task.assignedBy ? JSON.parse(task.assignedBy).fullName : "غير معروف"
            };
          } catch (error) {
            console.error(`Error fetching updates for task ${task.id}:`, error);
            return null;
          }
        })
      );

      const enhancedTasks = tasksWithUpdates.filter(task => task !== null);

      const totalTasks = enhancedTasks.length;
      const completedTasks = enhancedTasks.filter(t => t.status === 2).length;
      const inProgressTasks = enhancedTasks.filter(t => t.status === 1).length;
      const pendingTasks = enhancedTasks.filter(t => t.status === 0).length;
      const rejectedTasks = enhancedTasks.filter(t => t.status === 3).length;
      const expiredTasks = enhancedTasks.filter(t => t.ended && t.status !== 2).length;
      
      const respondedTasks = enhancedTasks.filter(t => t.hasUserResponse).length;
      const responseRate = totalTasks > 0 ? Math.round((respondedTasks / totalTasks) * 100) : 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setTasksStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "done",
          data: enhancedTasks,
          summary: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            rejectedTasks,
            expiredTasks,
            respondedTasks,
            responseRate,
            completionRate,
            recentTasks: enhancedTasks.slice(0, 10)
          }
        });
        return next;
      });
    } catch (e) {
      setTasksStats((prev) => {
        const next = new Map(prev);
        next.set(key, {
          status: "error",
          message: e?.message || "حصل خطأ في تحميل المهام",
        });
        return next;
      });
    }
  };

  // ========== HR EVALUATIONS ==========
const loadHREvaluations = async (user) => {
  if (!user?.guid) return;
  
  setEvaluationLoading(true);
  setEvaluationError('');
  
  try {
    // جلب كل تقييمات الموظف بدون فلترة بالشهر أو السنة
    const result = await HREvaluationService.getEmployeeEvaluations(
      user.guid,
      null, // سنة = null (تعني كل السنوات)
      null  // شهر = null (تعني كل الشهور)
    );
    
    if (result.success) {
      // حفظ كل التقييمات في state
      setHrEvaluations(result.data.evaluations || []);
      
      // حساب الإحصائيات العامة
      const evaluations = result.data.evaluations || [];
      const totalEvals = evaluations.length;
      const avgRating = totalEvals > 0 
        ? evaluations.reduce((sum, evaluation) => sum + parseFloat(evaluation.rating || 0), 0) / totalEvals
        : 0;
      
      setHrStats({
        average_rating: avgRating.toFixed(1),
        total_evaluations: totalEvals
      });
      
      // البحث عن تقييم الشهر الحالي (إذا وجد)
      const currentMonthEval = evaluations.find(evaluation => 
        parseInt(evaluation.evaluation_month) === parseInt(evalMonth) && 
        parseInt(evaluation.evaluation_year) === parseInt(evalYear)
      );
      
      if (currentMonthEval) {
        setCurrentEvaluation(currentMonthEval);
        setRating(currentMonthEval.rating);
        setNotes(currentMonthEval.notes || '');
        setHrRecommendations(currentMonthEval.hr_recommendations || '');
        setIsEditing(false);
      } else {
        setCurrentEvaluation(null);
        setRating(3);
        setNotes('');
        setHrRecommendations('');
        setIsEditing(true);
      }
    } else {
      setEvaluationError(result.message || 'فشل تحميل التقييمات');
    }
  } catch (err) {
    setEvaluationError('فشل تحميل التقييمات');
    console.error('Error loading HR evaluations:', err);
  } finally {
    setEvaluationLoading(false);
  }
};
const handleSaveEvaluation = async () => {
  if (!selectedUser?.guid || !evaluatedBy) {
    swalErr("بيانات غير كافية", "مش قادر أحفظ التقييم لأن البيانات ناقصة.");
    return;
  }

  if (rating < 1 || rating > 5) {
    swalErr("تقييم غير صحيح", "التقييم لازم يكون بين 1 و 5 نجوم.");
    return;
  }

  setEvaluationLoading(true);

  const evaluationData = {
    employee_guid: selectedUser.guid,
    branch_for_work: selectedUser.branchForWork || "",
    evaluation_month: evalMonth,
    evaluation_year: evalYear,
    rating,
    notes: notes.trim(),
    hr_recommendations: hrRecommendations.trim(),
    evaluated_by: evaluatedBy,
  };

  try {
    let result;

    if (currentEvaluation) {
      result = await HREvaluationService.updateEvaluation(currentEvaluation.id, evaluationData);
    } else {
      result = await HREvaluationService.addEvaluation(evaluationData);
    }

    if (result.success) {
      swalOk(
        currentEvaluation ? "تم تحديث التقييم" : "تم إضافة التقييم",
        "تم حفظ تقييم الموارد البشرية بنجاح."
      );

      await loadHREvaluations(selectedUser);
      setIsEditing(false);
    } else {
      swalErr("فشل حفظ التقييم", result.message || "حصل خطأ أثناء الحفظ.");
    }
  } catch (err) {
    swalErr("خطأ", "حدث خطأ أثناء حفظ التقييم.");
    console.error("Error saving evaluation:", err);
  } finally {
    setEvaluationLoading(false);
  }
};


const handleDeleteEvaluation = async () => {
  if (!currentEvaluation) return;

  const confirm = await Swal.fire({
    icon: "warning",
    title: "حذف التقييم؟",
    text: "هل أنت متأكد؟ مش هتقدر ترجع التقييم بعد الحذف.",
    showCancelButton: true,
    confirmButtonText: "نعم احذف",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#d32f2f",
  });

  if (!confirm.isConfirmed) return;

  setEvaluationLoading(true);

  try {
    const result = await HREvaluationService.deleteEvaluation(currentEvaluation.id);

    if (result.success) {
      swalOk("تم حذف التقييم", "تم حذف تقييم الموارد البشرية بنجاح.");

      setCurrentEvaluation(null);
      setRating(3);
      setNotes("");
      setHrRecommendations("");
      setIsEditing(true);

      await loadHREvaluations(selectedUser);
    } else {
      swalErr("فشل حذف التقييم", result.message || "حصل خطأ أثناء الحذف.");
    }
  } catch (err) {
    swalErr("خطأ", "حدث خطأ أثناء حذف التقييم.");
    console.error("Error deleting evaluation:", err);
  } finally {
    setEvaluationLoading(false);
  }
};


  const handleEditEvaluation = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (currentEvaluation) {
      setRating(currentEvaluation.rating);
      setNotes(currentEvaluation.notes || '');
      setHrRecommendations(currentEvaluation.hr_recommendations || '');
      setIsEditing(false);
    } else {
      setRating(3);
      setNotes('');
      setHrRecommendations('');
    }
  };

  // الحصول على إحصائيات الموظف للترتيب (Basic info only)
  const getEmployeeStats = (u) => {
    return {
      hasTrainerGuid: !!u?.trainerGuid,
      hasSellerGuid: !!u?.sellerGuid,
      hasUserGuid: !!u?.guid || !!u?.userGuid,
    };
  };

  // ترتيب الموظفين بناءً على الفلتر المحدد (Basic sorting by name)
  const filteredAndSorted = useMemo(() => {
    const query = q.trim().toLowerCase();

    let filteredEmployees = employees.filter((u) => {
      const hay = `${u?.fullName || ""} ${u?.userName || ""}`.toLowerCase();
      const matchQ = !query || hay.includes(query);

      const uBranch = String(u?.branchForWork || "").toLowerCase();
      const matchBranch =
        branchGuid === "all" || uBranch === String(branchGuid).toLowerCase();

      return matchQ && matchBranch;
    });

    // ترتيب الموظفين بالاسم
    filteredEmployees.sort((a, b) => {
      const nameA = (a?.fullName || a?.userName || "").toLowerCase();
      const nameB = (b?.fullName || b?.userName || "").toLowerCase();
      return sortOrder === "desc" 
        ? nameB.localeCompare(nameA)
        : nameA.localeCompare(nameB);
    });

    return filteredEmployees;
  }, [employees, q, branchGuid, sortOrder]);

  // Cards pagination
  const pagedCards = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (filteredAndSorted || []).slice(start, start + pageSize);
  }, [filteredAndSorted, page, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, branchGuid, pageSize, viewMode, evalMonth, evalYear, sortBy, sortOrder]);

  const totalPages = useMemo(() => {
    const n = Math.ceil((filteredAndSorted?.length || 0) / pageSize);
    return n <= 0 ? 1 : n;
  }, [filteredAndSorted, pageSize]);

  const resetFilters = () => {
    setQ("");
    setBranchGuid("all");
    setSortBy("registrations");
    setSortOrder("desc");
  };

  const openEmployeeDialog = async (u) => {
    setSelectedUser(u);
    setOpenDialog(true);
    setDialogTab(0);
    setDialogLoading(true);
    
    // Fetch detailed data for this user
    await fetchDetailedDataForUser(u);
  };

  const closeEmployeeDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setDialogTab(0);
    setDialogError("");
    // إعادة تعيين حالة تقييم الموارد البشرية
    setHrEvaluations([]);
    setHrStats({ average_rating: 0, total_evaluations: 0 });
    setCurrentEvaluation(null);
    setRating(3);
    setNotes('');
    setHrRecommendations('');
    setIsEditing(false);
    setEvaluationError('');
    setEvaluationSuccess('');
  };

  const handleDialogTabChange = (event, newValue) => {
    setDialogTab(newValue);
  };

  // Card text clamp helpers
  const clamp1 = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
  };

  const swalToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

const swalOk = (title, text = "") =>
  swalToast.fire({ icon: "success", title, text });

const swalErr = (title, text = "") =>
  swalToast.fire({ icon: "error", title, text });

const swalInfo = (title, text = "") =>
  swalToast.fire({ icon: "info", title, text });

  // helper لعرض chip بتاع نسبة السداد في الكارت
  const renderPayChip = (u) => {
    const key = buildPayKey(u);
    const st = payStats.get(key);

    if (!st || st.status === "loading") {
      return (
        <Chip
          size="small"
          label="السداد..."
          sx={{
            fontWeight: 900,
            bgcolor: alpha(BRAND, 0.12),
            color: BRAND_DARK,
            border: `1px solid ${alpha(BRAND, 0.25)}`,
          }}
        />
      );
    }

    if (st.status === "error") {
      return (
        <Chip
          size="small"
          label="لا يوجد بيانات"
          sx={{
            fontWeight: 900,
            bgcolor: "rgba(0,0,0,0.06)",
            border: `1px solid rgba(0,0,0,0.12)`,
          }}
        />
      );
    }

    // done
    return (
      <Chip
        size="small"
        label={`التحصيل: ${st.percent}%`}
        sx={{
          fontWeight: 900,
          bgcolor: alpha(BRAND, 0.14),
          color: BRAND_DARK,
          border: `1px solid ${alpha(BRAND, 0.25)}`,
        }}
      />
    );
  };

  // helper لعرض chip بتاع التسجيلات في الكارت
  const renderRegChip = (u) => {
    const key = buildRegKey(u);
    const st = regStats.get(key);

    if (!st || st.status === "loading") {
      return (
        <Chip
          size="small"
          label="التسجيلات..."
          sx={{
            fontWeight: 900,
            bgcolor: alpha("#1976d2", 0.12),
            color: "#1976d2",
            border: `1px solid ${alpha("#1976d2", 0.25)}`,
          }}
        />
      );
    }

    if (st.status === "error" || st.status === "no_data") {
      return (
        <Chip
          size="small"
          label="لا يوجد بيانات"
          sx={{
            fontWeight: 900,
            bgcolor: "rgba(0,0,0,0.06)",
            border: `1px solid rgba(0,0,0,0.12)`,
          }}
        />
      );
    }

    // done
    return (
      <Chip
        size="small"
        label={`التسجيلات: ${st.totalRegistrations}`}
        sx={{
          fontWeight: 900,
          bgcolor: alpha("#1976d2", 0.14),
          color: "#1976d2",
          border: `1px solid ${alpha("#1976d2", 0.25)}`,
        }}
      />
    );
  };

  // helper لعرض chip بتاع الإنتاجية في الكارت
  const renderProdChip = (u) => {
    const key = buildProdKey(u);
    const st = productivityStats.get(key);

    if (!st || st.status === "loading") {
      return (
        <Chip
          size="small"
          label="الإنتاجية..."
          sx={{
            fontWeight: 900,
            bgcolor: alpha("#9c27b0", 0.12),
            color: "#9c27b0",
            border: `1px solid ${alpha("#9c27b0", 0.25)}`,
          }}
        />
      );
    }

    if (st.status === "error") {
      return (
        <Chip
          size="small"
          label="لا يوجد بيانات"
          sx={{
            fontWeight: 900,
            bgcolor: "rgba(0,0,0,0.06)",
            border: `1px solid rgba(0,0,0,0.12)`,
          }}
        />
      );
    }

    // done
    const summary = st.summary;
    return (
      <Chip
        size="small"
        label={`الإنتاجية: ${summary?.avgProgress || 0}%`}
        sx={{
          fontWeight: 900,
          bgcolor: alpha("#9c27b0", 0.14),
          color: "#9c27b0",
          border: `1px solid ${alpha("#9c27b0", 0.25)}`,
        }}
      />
    );
  };

  // helper لعرض chip بتاع المهام في الكارت
  const renderTasksChip = (u) => {
    const key = buildTasksKey(u);
    const st = tasksStats.get(key);

    if (!st || st.status === "loading") {
      return (
        <Chip
          size="small"
          label="المهام..."
          sx={{
            fontWeight: 900,
            bgcolor: alpha("#ff9800", 0.12),
            color: "#ff9800",
            border: `1px solid ${alpha("#ff9800", 0.25)}`,
          }}
        />
      );
    }

    if (st.status === "error") {
      return (
        <Chip
          size="small"
          label="لا يوجد بيانات"
          sx={{
            fontWeight: 900,
            bgcolor: "rgba(0,0,0,0.06)",
            border: `1px solid rgba(0,0,0,0.12)`,
          }}
        />
      );
    }

    // done
    const summary = st.summary;
    return (
      <Chip
        size="small"
        label={`المهام: ${summary?.totalTasks || 0}`}
        sx={{
          fontWeight: 900,
          bgcolor: alpha("#ff9800", 0.14),
          color: "#ff9800",
          border: `1px solid ${alpha("#ff9800", 0.25)}`,
        }}
      />
    );
  };

  // Render registration details for dialog
  const renderRegDetails = (u) => {
    const key = buildRegKey(u);
    const st = regStats.get(key);

    if (!st || st.status === "loading") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>جاري تحميل بيانات التسجيلات...</Typography>
        </Box>
      );
    }

    if (st.status === "error" || st.status === "no_data") {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          لا توجد بيانات للتسجيلات في الفترة المحددة
          ({regFromDate} إلى {regToDate})
        </Alert>
      );
    }

    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#1976d2", 0.2)}` }}>
              <CardContent>
                <Typography sx={{ fontWeight: 900, mb: 1, color: "#1976d2" }}>
                  الدبلومات
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight={900}>المجموع:</Typography>
                  <Typography fontWeight={900} color="#1976d2">
                    {st.totalDiplomas}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#4caf50", 0.2)}` }}>
              <CardContent>
                <Typography sx={{ fontWeight: 900, mb: 1, color: "#4caf50" }}>
                  الدورات
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight={900}>المجموع:</Typography>
                  <Typography fontWeight={900} color="#4caf50">
                    {st.totalCourses}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography fontWeight={700}>فترة التسجيلات:</Typography>
              <Typography>{regFromDate} إلى {regToDate}</Typography>
              <Typography variant="caption">(من أول الشهر إلى آخره)</Typography>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render productivity details for dialog
  const renderProdDetails = (u) => {
    const key = buildProdKey(u);
    const st = productivityStats.get(key);

    if (!st || st.status === "loading") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>جاري تحميل بيانات الإنتاجية...</Typography>
        </Box>
      );
    }

    if (st.status === "error") {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          لا توجد بيانات للإنتاجية لهذا الموظف في الفترة المحددة
        </Alert>
      );
    }

    const { summary, data } = st;

    if (!data || data.length === 0) {
      return (
        <Alert severity="info">
          لا توجد بيانات إنتاجية أسبوعية لهذا الموظف في الفترة المحددة
          ({prodFromDate} إلى {prodToDate})
        </Alert>
      );
    }

    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#9c27b0", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#9c27b0" }}>
                  {summary.totalWeeks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  عدد الأسابيع
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#4caf50", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#4caf50" }}>
                  {summary.completedItems}/{summary.totalItems}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  البنود المكتملة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#2196f3", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#2196f3" }}>
                  {summary.avgProgress}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  متوسط التقدم
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#ff9800", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#ff9800" }}>
                  {summary.totalFiles}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  عدد المرفقات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          الأسابيع ({data.length})
        </Typography>
        
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {data.map((week, index) => (
            <Card key={week.id} sx={{ borderRadius: 2, border: `1px solid ${alpha("#e0e0e0", 0.5)}` }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {week.mainTitle || `الأسبوع ${index + 1}`}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {week.startDate} - {week.endDate}
                    </Typography>
                    {week.notes && (
                      <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: alpha("#f5f5f5", 0.5), borderRadius: 1 }}>
                        {week.notes}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={week.overallStatus || "معلق"}
                    size="small"
                    sx={{
                      bgcolor: week.overallStatus === "مكتمل" ? alpha("#4caf50", 0.2) : alpha("#ff9800", 0.2),
                      color: week.overallStatus === "مكتمل" ? "#4caf50" : "#ff9800",
                      fontWeight: 600,
                    }}
                  />
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {week.completedItems}/{week.itemCount} بند مكتمل
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: week.completionPercentage >= 70 ? "#4caf50" : 
                    week.completionPercentage >= 40 ? "#ff9800" : "#f44336" }}>
                    {week.completionPercentage || 0}%
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={week.completionPercentage || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 3,
                    bgcolor: "#e0e0e0",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      bgcolor: week.completionPercentage >= 70 ? "#4caf50" : 
                              week.completionPercentage >= 40 ? "#ff9800" : "#f44336",
                    },
                  }}
                />

                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: "#666" }}>
                  البنود ({week.items?.length || 0}):
                </Typography>
                
                {week.items && week.items.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {week.items.map((item, itemIndex) => (
                      <Paper key={item.id} sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha("#e0e0e0", 0.5)}` }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {itemIndex + 1}. {item.title}
                          </Typography>
                          <Chip
                            label={item.status}
                            size="small"
                            sx={{
                              bgcolor: item.status === "مكتمل" ? alpha("#4caf50", 0.2) : alpha("#ff9800", 0.2),
                              color: item.status === "مكتمل" ? "#4caf50" : "#ff9800",
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                        
                        {item.description && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {item.description}
                          </Typography>
                        )}

                        {item.files && item.files.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#666" }}>
                              المرفقات ({item.files.length}):
                            </Typography>
                            <Grid container spacing={1}>
                              {item.files.map((file) => (
                                <Grid item xs={12} sm={6} md={4} key={file.id || file.name}>
                                  <Card
                                    variant="outlined"
                                    sx={{
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: '#f5f5f5' },
                                      borderRadius: 1,
                                    }}
                                    onClick={() => {
                                      const url = resolveFileUrl(file.url || file.rawUrl);
                                      if (url) window.open(url, '_blank');
                                    }}
                                  >
                                    <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      {getFileIcon(file.type)}
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" noWrap sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                          {file.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                          {(Number(file.size || 0) / 1024).toFixed(1)} KB
                                        </Typography>
                                      </Box>
                                      <IconButton size="small" sx={{ p: 0.5 }}>
                                        <GetAppIcon fontSize="small" />
                                      </IconButton>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        )}
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 2 }}>
                    لا توجد بنود لهذا الأسبوع
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  };

  // Render tasks details for dialog
  const renderTasksDetails = (u) => {
    const key = buildTasksKey(u);
    const st = tasksStats.get(key);

    if (!st || st.status === "loading") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>جاري تحميل بيانات المهام...</Typography>
        </Box>
      );
    }

    if (st.status === "error") {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          لا توجد بيانات للمهام لهذا الموظف في الفترة المحددة
        </Alert>
      );
    }

    const { summary, data } = st;

    if (!data || data.length === 0) {
      return (
        <Alert severity="info">
          لا توجد مهام مخصصة لهذا الموظف في الفترة المحددة
          ({tasksFromDate} إلى {tasksToDate})
        </Alert>
      );
    }

    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#ff9800", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#ff9800" }}>
                  {summary.totalTasks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  إجمالي المهام
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#4caf50", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#4caf50" }}>
                  {summary.respondedTasks}/{summary.totalTasks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  تم الرد عليها
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#2196f3", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#2196f3" }}>
                  {summary.completionRate}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  نسبة الإنجاز
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#f44336", 0.2)}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#f44336" }}>
                  {summary.expiredTasks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  مهام منتهية
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              نسبة الاستجابة: {summary.responseRate}%
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: summary.responseRate >= 80 ? "#4caf50" : 
              summary.responseRate >= 50 ? "#ff9800" : "#f44336" }}>
              {summary.responseRate}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={summary.responseRate}
            sx={{
              height: 10,
              borderRadius: 5,
              mb: 3,
              bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                bgcolor: summary.responseRate >= 80 ? "#4caf50" : 
                        summary.responseRate >= 50 ? "#ff9800" : "#f44336",
              },
            }}
          />
        </Box>

        <Card sx={{ mb: 3, borderRadius: 2, border: `1px solid ${alpha("#e0e0e0", 0.5)}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#ff9800" }}>
              <AssignmentIcon sx={{ marginInlineEnd: 1, verticalAlign: "middle" }} />
              ملخص المهام
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha("#ff9800", 0.1) }}>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>عدد المهام</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>النسبة</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>التفاصيل</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleOutlineIcon sx={{ color: "#4caf50" }} />
                        <span>مكتملة</span>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={summary.completedTasks} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#4caf50', 
                          color: 'white',
                          fontWeight: 700 
                        }} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      {summary.totalTasks > 0 ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="text" onClick={() => {
                        const completedTasks = data.filter(t => t.status === 2);
                        alert(`المهام المكتملة: ${completedTasks.map(t => t.name).join(', ')}`);
                      }}>
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <HourglassFullIcon sx={{ color: "#2196f3" }} />
                        <span>قيد التنفيذ</span>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={summary.inProgressTasks} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#2196f3', 
                          color: 'white',
                          fontWeight: 700 
                        }} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      {summary.totalTasks > 0 ? Math.round((summary.inProgressTasks / summary.totalTasks) * 100) : 0}%
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="text" onClick={() => {
                        const inProgressTasks = data.filter(t => t.status === 1);
                        alert(`المهام قيد التنفيذ: ${inProgressTasks.map(t => t.name).join(', ')}`);
                      }}>
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <HourglassEmptyIcon sx={{ color: "#ff9800" }} />
                        <span>معلقة</span>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={summary.pendingTasks} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#ff9800', 
                          color: 'white',
                          fontWeight: 700 
                        }} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      {summary.totalTasks > 0 ? Math.round((summary.pendingTasks / summary.totalTasks) * 100) : 0}%
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="text" onClick={() => {
                        const pendingTasks = data.filter(t => t.status === 0);
                        alert(`المهام المعلقة: ${pendingTasks.map(t => t.name).join(', ')}`);
                      }}>
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CancelIcon sx={{ color: "#f44336" }} />
                        <span>مرفوضة</span>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={summary.rejectedTasks} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#f44336', 
                          color: 'white',
                          fontWeight: 700 
                        }} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      {summary.totalTasks > 0 ? Math.round((summary.rejectedTasks / summary.totalTasks) * 100) : 0}%
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="text" onClick={() => {
                        const rejectedTasks = data.filter(t => t.status === 3);
                        alert(`المهام المرفوضة: ${rejectedTasks.map(t => t.name).join(', ')}`);
                      }}>
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          تفاصيل المهام ({data.length})
        </Typography>
        
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {data.map((task) => {
            const statusColor = paletteMain(task?.statusInfo?.color);

            return (
              <Card
                key={task.id}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha("#e0e0e0", 0.5)}`,
                  backgroundColor: task.ended ? alpha("#f44336", 0.05) : "white",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: task.ended ? "#f44336" : "inherit",
                        }}
                      >
                        {task.name}
                        {task.isModifiedExternally && (
                          <Chip
                            label="معدلة"
                            size="small"
                            color="secondary"
                            sx={{ ml: 1, fontSize: "0.7rem" }}
                          />
                        )}
                        {task.isPassedTask && (
                          <Chip
                            label="ممررة"
                            size="small"
                            color="primary"
                            sx={{ ml: 1, fontSize: "0.7rem" }}
                          />
                        )}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">
                        من: {task.assignedByName}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mt: 0.5 }}
                      >
                        أنشئت: {formatDate(task.createdAt)}
                      </Typography>

                      {task.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            p: 1.5,
                            bgcolor: alpha("#f5f5f5", 0.5),
                            borderRadius: 1,
                          }}
                        >
                          {task.description}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Chip
                        icon={task.statusInfo.icon}
                        label={task.statusInfo.label}
                        color={task.statusInfo.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />

                      {task.ended && (
                        <Chip
                          label="منتهية"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      )}

                      {task.hasUserResponse && (
                        <Chip
                          label="تم الرد"
                          size="small"
                          color="success"
                          variant="outlined"
                          icon={<CheckCircleOutlineIcon />}
                          sx={{ fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  </Box>

                  {task.hasUserResponse && task.lastUpdate && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: alpha("#4caf50", 0.08),
                        borderRadius: 2,
                        border: `1px solid ${alpha("#4caf50", 0.2)}`,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 700, color: "#2e7d32" }}
                      >
                        رد الموظف على المهمة:
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {task.lastUpdate.statusNote || "لا توجد ملاحظات مكتوبة"}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          آخر تحديث: {formatDate(task.lastUpdate.updatedAt)}
                        </Typography>

                        {task.lastUpdate.hasAttachment && (
                          <Button
                            size="small"
                            startIcon={<AttachFileIcon />}
                            variant="outlined"
                            onClick={() => {
                              const fileName =
                                task.lastUpdate.attachmentFilePath.split("\\").pop();
                              const fileUrl = `${TASKS_API.DOWNLOAD_TASK_ATTACHMENT}?fileName=${fileName}`;
                              window.open(fileUrl, "_blank");
                            }}
                            sx={{
                              fontSize: "0.75rem",
                              color: "#1976d2",
                              borderColor: "#1976d2",
                              "&:hover": {
                                borderColor: "#1565c0",
                                backgroundColor: alpha("#1976d2", 0.08),
                              },
                            }}
                          >
                            عرض مرفق الرد
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )}

                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(statusColor, 0.08),
                      border: `1px solid ${alpha(statusColor, 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: statusColor }}
                    >
                      {task.statusInfo.icon} {task.statusInfo.description}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: alpha("#f5f5f5", 0.5),
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          المدة: <strong>{task.taskTimeInHours} ساعة</strong>
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: alpha("#f5f5f5", 0.5),
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          عدد التحديثات: <strong>{task.updateCount || 0}</strong>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {task.isPassedTask && task.passingHistory && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: alpha("#e3f2fd", 0.5),
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 600, color: "#1976d2" }}
                      >
                        تاريخ تمرير المهمة:
                      </Typography>
                      <Box
                        sx={{
                          maxHeight: 100,
                          overflowY: "auto",
                          p: 1,
                          backgroundColor: "white",
                          borderRadius: 1,
                        }}
                      >
                        {task.passingHistory.slice(-3).map((pass, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="caption" display="block">
                              {formatDate(pass.pass_timestamp)}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ color: "text.secondary" }}
                            >
                              من {pass.sender_name} إلى {pass.receiver_name}
                            </Typography>
                            {index < task.passingHistory.slice(-3).length - 1 && (
                              <Divider sx={{ my: 1 }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {task.allowAttach && task.attachmentPath && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        startIcon={<AttachFileIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const fileName = task.attachmentPath.split("\\").pop();
                          const fileUrl = `${TASKS_API.DOWNLOAD}?fileName=${fileName}`;
                          window.open(fileUrl, "_blank");
                        }}
                        sx={{
                          color: BRAND_DARK,
                          borderColor: BRAND_DARK,
                          "&:hover": {
                            borderColor: BRAND,
                            backgroundColor: alpha(BRAND, 0.08),
                          },
                        }}
                      >
                        عرض المرفق الأصلي
                      </Button>
                    </Box>
                  )}

                  {task.allUpdates && task.allUpdates.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 600, color: "#666" }}
                      >
                        سجل التحديثات ({task.allUpdates.length}):
                      </Typography>
                      <Box
                        sx={{
                          maxHeight: 200,
                          overflowY: "auto",
                          p: 2,
                          backgroundColor: alpha("#f5f5f5", 0.5),
                          borderRadius: 2,
                        }}
                      >
                        {task.allUpdates.map((update, idx) => (
                          <Box
                            key={idx}
                            sx={{ mb: 2, p: 2, backgroundColor: "white", borderRadius: 1 }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              التحديث #{idx + 1}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                              {update.statusNote || "لا توجد ملاحظات"}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 1,
                              }}
                            >
                              <Typography variant="caption" color="textSecondary">
                                {formatDate(update.updatedAt)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                الحالة:{" "}
                                {update.status === 0
                                  ? "معلقة"
                                  : update.status === 1
                                  ? "جاري التنفيذ"
                                  : update.status === 2
                                  ? "مكتملة"
                                  : "مرفوضة"}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Render HR Evaluation details
// Render HR Evaluation details
const renderHREvaluationDetails = () => {
  if (evaluationLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress sx={{ color: BRAND }} />
      </Box>
    );
  }

  // ترتيب التقييمات من الأحدث للأقدم
  const sortedEvaluations = [...hrEvaluations].sort((a, b) => {
    const dateA = new Date(a.evaluation_year, a.evaluation_month - 1);
    const dateB = new Date(b.evaluation_year, b.evaluation_month - 1);
    return dateB - dateA; // من الأحدث للأقدم
  });

  return (
    <Box>
      {/* إحصائيات التقييمات */}
      <Card sx={{ borderRadius: 2, mb: 3, border: `1px solid ${alpha("#9c27b0", 0.2)}` }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#9c27b0" }}>
            <Assessment sx={{ marginInlineEnd: 1, verticalAlign: "middle" }} />
            إحصائيات التقييم العام
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#9c27b0", 0.08), borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#9c27b0" }}>
                  {hrStats.average_rating ? parseFloat(hrStats.average_rating).toFixed(1) : "0.0"}
                </Typography>
                <Typography variant="body2">المعدل العام</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#4caf50", 0.08), borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#4caf50" }}>
                  {hrStats.total_evaluations || 0}
                </Typography>
                <Typography variant="body2">إجمالي التقييمات</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#2196f3", 0.08), borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#2196f3" }}>
                  {evalMonth}/{evalYear}
                </Typography>
                <Typography variant="body2">شهر التقييم الحالي</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#ff9800", 0.08), borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#ff9800" }}>
                  {currentEvaluation ? "✓" : "✗"}
                </Typography>
                <Typography variant="body2">حالة شهر {evalMonth}</Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>ملاحظة:</strong> يتم عرض جميع تقييمات الموظف عبر كل الشهور. 
              التقييم الحالي خاص بشهر {evalMonth}/{evalYear} فقط.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* رسائل الخطأ والنجاح */}
      {evaluationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {evaluationError}
        </Alert>
      )}

      {evaluationSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {evaluationSuccess}
        </Alert>
      )}

      {/* نموذج التقييم الحالي */}
      <Card sx={{ borderRadius: 2, mb: 3, border: `1px solid ${alpha("#4caf50", 0.2)}` }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#4caf50" }}>
              <RateReview sx={{ marginInlineEnd: 1, verticalAlign: "middle" }} />
              {currentEvaluation ? `تقييم شهر ${evalMonth}/${evalYear}` : `إضافة تقييم لشهر ${evalMonth}/${evalYear}`}
            </Typography>
            
            {currentEvaluation && !isEditing && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEditEvaluation}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#2196f3",
                    color: "#2196f3",
                    "&:hover": {
                      borderColor: "#1976d2",
                      bgcolor: alpha("#2196f3", 0.08),
                    },
                  }}
                >
                  تعديل
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Delete />}
                  onClick={handleDeleteEvaluation}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#f44336",
                    color: "#f44336",
                    "&:hover": {
                      borderColor: "#d32f2f",
                      bgcolor: alpha("#f44336", 0.08),
                    },
                  }}
                >
                  حذف
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                  التقييم:
                </Typography>
                <Rating
                  value={rating}
                  onChange={(event, newValue) => {
                    setRating(newValue || 3);
                  }}
                  precision={0.5}
                  size="large"
                  icon={<Star fontSize="inherit" sx={{ color: "#ff9800" }} />}
                  emptyIcon={<StarBorder fontSize="inherit" sx={{ color: "#ddd" }} />}
                  readOnly={!isEditing}
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {rating} من 5 نجوم
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات التقييم"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isEditing}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="توصيات الموارد البشرية"
                multiline
                rows={3}
                value={hrRecommendations}
                onChange={(e) => setHrRecommendations(e.target.value)}
                disabled={!isEditing}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {isEditing && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancelEdit}
                    sx={{
                      borderRadius: 2,
                      borderColor: "#9e9e9e",
                      color: "#616161",
                      "&:hover": {
                        borderColor: "#757575",
                        bgcolor: alpha("#9e9e9e", 0.08),
                      },
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveEvaluation}
                    disabled={evaluationLoading}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      bgcolor: BRAND,
                      "&:hover": { bgcolor: BRAND_DARK },
                      boxShadow: `0 4px 12px ${alpha(BRAND, 0.3)}`,
                    }}
                  >
                    {evaluationLoading ? (
                      <CircularProgress size={20} sx={{ color: "white" }} />
                    ) : currentEvaluation ? (
                      "حفظ التعديلات"
                    ) : (
                      "حفظ التقييم"
                    )}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* تاريخ التقييمات السابقة - كل التقييمات */}
      {sortedEvaluations.length > 0 && (
        <Card sx={{ borderRadius: 2, border: `1px solid ${alpha("#e0e0e0", 0.5)}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#666" }}>
              <History sx={{ marginInlineEnd: 1, verticalAlign: "middle" }} />
              سجل التقييمات الكامل ({sortedEvaluations.length})
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha("#f5f5f5", 0.5) }}>
                    <TableCell sx={{ fontWeight: 700 }}>الشهر/السنة</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>التقييم</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ملاحظات</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>التوصيات</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>تاريخ الإضافة</TableCell>
                    {/* <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedEvaluations.map((evalItem) => {
                    const isCurrentMonth = 
                      parseInt(evalItem.evaluation_month) === parseInt(evalMonth) && 
                      parseInt(evalItem.evaluation_year) === parseInt(evalYear);
                    
                    return (
                      <TableRow
                        key={evalItem.id}
                        sx={{
                          backgroundColor: isCurrentMonth ? alpha("#4caf50", 0.1) : 'transparent',
                          '&:hover': { backgroundColor: alpha("#f5f5f5", 0.3) },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography sx={{ fontWeight: isCurrentMonth ? 800 : 400 }}>
                              {evalItem.evaluation_month}/{evalItem.evaluation_year}
                            </Typography>
                            {isCurrentMonth && (
                              <Chip 
                                label="الحالي" 
                                size="small" 
                                sx={{ 
                                  ml: 1, 
                                  bgcolor: '#4caf50', 
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.6rem'
                                }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Rating
                              value={evalItem.rating}
                              readOnly
                              size="small"
                              icon={<Star fontSize="inherit" sx={{ color: "#ff9800" }} />}
                              emptyIcon={<StarBorder fontSize="inherit" sx={{ color: "#ddd" }} />}
                            />
                            <Typography variant="body2" sx={{ ml: 1, fontWeight: 600 }}>
                              ({evalItem.rating})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={evalItem.notes || "لا توجد ملاحظات"}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 180,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {evalItem.notes || "—"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={evalItem.hr_recommendations || "لا توجد توصيات"}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 180,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {evalItem.hr_recommendations || "—"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {formatDate(evalItem.created_at)}
                        </TableCell>
                        {/* <TableCell>
                          {isCurrentMonth ? (
                            <Chip 
                              label="شهر التقييم" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label="تاريخي" 
                              size="small" 
                              color="default" 
                              variant="outlined"
                            />
                          )}
                        </TableCell> */}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

  const months = [
    { v: 1, n: "يناير" },
    { v: 2, n: "فبراير" },
    { v: 3, n: "مارس" },
    { v: 4, n: "أبريل" },
    { v: 5, n: "مايو" },
    { v: 6, n: "يونيو" },
    { v: 7, n: "يوليو" },
    { v: 8, n: "أغسطس" },
    { v: 9, n: "سبتمبر" },
    { v: 10, n: "أكتوبر" },
    { v: 11, n: "نوفمبر" },
    { v: 12, n: "ديسمبر" },
  ];

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 1, y, y + 1];
  }, [now]);

  return (
    <NavigationShell variant="standard" ><Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f7fb" }}>
      

      <Box
        sx={{
          flex: 1,
          direction: "rtl",
          p: {
            xs: 2,
            md: 3
          },
          "& .ltrText": {
            direction: "ltr",
            textAlign: "left"
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: BRAND
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: BRAND_DARK
          },
          ...navigationContentSx
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
                تقييم الموظفين
              </Typography>
              <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
                الشهر المحدد: {evalMonth}/{evalYear}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${alpha(BRAND, 0.25)}`,
                  "& .MuiToggleButton-root": {
                    border: 0,
                    borderRadius: 0,
                    px: 1.25,
                    fontWeight: 900,
                  },
                  "& .Mui-selected": {
                    bgcolor: alpha(BRAND, 0.14),
                    color: BRAND_DARK,
                  },
                }}
              >
                <ToggleButton value="cards">
                  <ViewModuleIcon sx={{ marginInlineEnd: 0.75, fontSize: 18 }} />
                  Cards
                </ToggleButton>
              </ToggleButtonGroup>

              <Tooltip title="تحديث البيانات">
                <IconButton
                  onClick={fetchAll}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(BRAND, 0.25)}`,
                    "&:hover": { bgcolor: alpha(BRAND, 0.08) },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="مسح الفلاتر">
                <IconButton
                  onClick={resetFilters}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(BRAND, 0.25)}`,
                    "&:hover": { bgcolor: alpha(BRAND, 0.08) },
                  }}
                >
                  <FilterAltOffIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* ✅ Month/Year Filter */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              mb: 2,
              border: `1px solid ${alpha(BRAND, 0.18)}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ direction: "rtl" }}>
                    <InputLabel>شهر التقييم</InputLabel>
                    <Select
                      value={evalMonth}
                      label="شهر التقييم"
                      onChange={(e) => setEvalMonth(Number(e.target.value))}
                      sx={{ borderRadius: 2 }}
                    >
                      {months.map((m) => (
                        <MenuItem key={m.v} value={m.v}>
                          {m.n}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ direction: "rtl" }}>
                    <InputLabel>سنة التقييم</InputLabel>
                    <Select
                      value={evalYear}
                      label="سنة التقييم"
                      onChange={(e) => setEvalYear(Number(e.target.value))}
                      sx={{ borderRadius: 2 }}
                    >
                      {years.map((y) => (
                        <MenuItem key={y} value={y}>
                          {y}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={3}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography fontWeight={700}>السداد والتحصيل:</Typography>
                    <Typography variant="body2">من 15 الشهر إلى 14 الشهر التالي</Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography fontWeight={700}>التسجيلات:</Typography>
                    <Typography variant="body2">من أول الشهر إلى آخره</Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography fontWeight={700}>الإنتاجية:</Typography>
                    <Typography variant="body2">من أول الشهر إلى آخره</Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography fontWeight={700}>المهام:</Typography>
                    <Typography variant="body2">من أول الشهر إلى آخره</Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Filters and Sorting */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              mb: 2,
              border: `1px solid ${alpha(BRAND, 0.18)}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ابحث بالاسم أو اسم المستخدم..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiInputBase-root": { borderRadius: 2 },
                      direction: "rtl",
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth sx={{ direction: "rtl" }}>
                    <InputLabel>الفرع</InputLabel>
                    <Select
                      value={branchGuid}
                      label="الفرع"
                      onChange={(e) => setBranchGuid(e.target.value)}
                      sx={{ borderRadius: 2 }}
                      MenuProps={{ PaperProps: { sx: { borderRadius: 2 } } }}
                    >
                      <MenuItem value="all">كل الفروع</MenuItem>
                      {branchOptions.map((b) => (
                        <MenuItem key={b.guid} value={b.guid}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth sx={{ direction: "rtl" }}>
                    <InputLabel>ترتيب حسب</InputLabel>
                    <Select
                      value={sortBy}
                      label="ترتيب حسب"
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="registrations">الاسم</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth sx={{ direction: "rtl" }}>
                    <InputLabel>الترتيب</InputLabel>
                    <Select
                      value={sortOrder}
                      label="الترتيب"
                      onChange={(e) => setSortOrder(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="desc">تنازلي</MenuItem>
                      <MenuItem value="asc">تصاعدي</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    icon={<PersonIcon />}
                    label={`عدد الموظفين: ${employees.length}`}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    icon={<ApartmentIcon />}
                    label={
                      branchGuid === "all"
                        ? "فرع: الكل"
                        : `فرع: ${getBranchName(branchGuid)}`
                    }
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="الحالة: نشط فقط"
                    sx={{
                      fontWeight: 800,
                      bgcolor: alpha(BRAND, 0.14),
                      color: BRAND_DARK,
                      border: `1px solid ${alpha(BRAND, 0.25)}`,
                    }}
                  />
                  <Chip
                    label={`نتائج: ${filteredAndSorted.length}`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: alpha(BRAND, 0.12),
                      color: BRAND_DARK,
                      border: `1px solid ${alpha(BRAND, 0.25)}`,
                    }}
                  />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>عدد بالصفحة</InputLabel>
                    <Select
                      value={pageSize}
                      label="عدد بالصفحة"
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value={8}>8</MenuItem>
                      <MenuItem value={12}>12</MenuItem>
                      <MenuItem value={16}>16</MenuItem>
                      <MenuItem value={24}>24</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                    sx={{
                      borderRadius: 2,
                      borderColor: alpha(BRAND, 0.5),
                      color: BRAND_DARK,
                      "&:hover": {
                        borderColor: BRAND,
                        bgcolor: alpha(BRAND, 0.08),
                      },
                    }}
                  >
                    إعادة ضبط
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* States */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress sx={{ color: BRAND }} />
            </Box>
          ) : filteredAndSorted.length === 0 ? (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 800 }}>
                  مفيش موظفين مطابقين للفلاتر الحالية.
                </Typography>
                <Typography sx={{ opacity: 0.8, mt: 1 }}>
                  جرّب تغيّر الفرع أو امسح البحث.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cards */}
              <Grid container spacing={2}>
                {pagedCards.map((u) => {
                  const branchName = getBranchName(u?.branchForWork);
                  const stats = getEmployeeStats(u);

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={u.guid || u.id}>
                      <Card
                        sx={{
                          height: "100%",
                          borderRadius: 3,
                          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                          border: `1px solid ${alpha(BRAND, 0.15)}`,
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          display: "flex",
                          flexDirection: "column",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 14px 40px rgba(0,0,0,0.10)",
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 1.5, flexGrow: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{ fontWeight: 900, fontSize: 16, ...clamp1 }}
                                title={u?.fullName || u?.userName || "—"}
                              >
                                {u?.fullName || u?.userName || "—"}
                              </Typography>

                              <Typography
                                sx={{ opacity: 0.75, mt: 0.25, ...clamp1 }}
                                title={`@${u?.userName || "—"}`}
                              >
                                @{u?.userName || "—"}
                              </Typography>
                            </Box>

                            <Chip
                              size="small"
                              icon={<CheckCircleIcon />}
                              label="نشط"
                              sx={{
                                fontWeight: 800,
                                bgcolor: alpha(BRAND, 0.14),
                                color: BRAND_DARK,
                                border: `1px solid ${alpha(BRAND, 0.25)}`,
                                flexShrink: 0,
                              }}
                            />
                          </Box>

                          <Divider sx={{ my: 1.5 }} />

                          <Box sx={{ minHeight: 56 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                              الفرع:{" "}
                              <Typography
                                component="span"
                                sx={{ fontWeight: 700, color: BRAND_DARK }}
                                title={branchName}
                              >
                                {branchName}
                              </Typography>
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              {stats.hasTrainerGuid && (
                                <Chip
                                  size="small"
                                  label="لديه تحصيل"
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha(BRAND, 0.12),
                                    color: BRAND_DARK,
                                    border: `1px solid ${alpha(BRAND, 0.25)}`,
                                  }}
                                />
                              )}
                              {stats.hasSellerGuid && (
                                <Chip
                                  size="small"
                                  label="مندوب مبيعات"
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha("#1976d2", 0.12),
                                    color: "#1976d2",
                                    border: `1px solid ${alpha("#1976d2", 0.25)}`,
                                  }}
                                />
                              )}
                              {stats.hasUserGuid && (
                                <Chip
                                  size="small"
                                  label="لديه إنتاجية"
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: alpha("#9c27b0", 0.12),
                                    color: "#9c27b0",
                                    border: `1px solid ${alpha("#9c27b0", 0.25)}`,
                                  }}
                                />
                              )}
                              <Chip
                                size="small"
                                label="لديه مهام"
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: alpha("#ff9800", 0.12),
                                  color: "#ff9800",
                                  border: `1px solid ${alpha("#ff9800", 0.25)}`,
                                }}
                              />
                            </Box>
                            <Typography variant="caption" color="textSecondary" sx={{ textAlign: "center" }}>
                              اضغط "تقييم شامل" لعرض التفاصيل
                            </Typography>
                          </Box>
                        </CardContent>

                        <CardActions
                          sx={{
                            px: 2,
                            pb: 2,
                            pt: 0,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 900,
                              bgcolor: BRAND,
                              "&:hover": { bgcolor: BRAND_DARK },
                              boxShadow: `0 10px 20px ${alpha(BRAND, 0.25)}`,
                              textTransform: "none",
                            }}
                            onClick={() => openEmployeeDialog(u)}
                            endIcon={<ArrowForwardIosIcon />}
                          >
                            تقييم شامل
                          </Button>

                          <Tooltip title="تفاصيل">
                            <IconButton
                              onClick={() => openEmployeeDialog(u)}
                              sx={{
                                border: `1px solid ${alpha(BRAND, 0.25)}`,
                                borderRadius: 2,
                                "&:hover": { bgcolor: alpha(BRAND, 0.08) },
                              }}
                            >
                              <PersonIcon />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Pagination for cards */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, v) => setPage(v)}
                  shape="rounded"
                />
              </Box>
            </>
          )}

          {/* Dialog (Details + Evaluation container) */}
          <Dialog
            open={openDialog}
            onClose={closeEmployeeDialog}
            fullWidth
            maxWidth="md"
            PaperProps={{ sx: { borderRadius: 3, maxHeight: "90vh" } }}
          >
            <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>تفاصيل الموظف + التقييم</span>
                <Tabs value={dialogTab} onChange={handleDialogTabChange} size="small">
                  <Tab label="الملخص" />
                  <Tab label="السداد" />
                  <Tab label="التسجيلات" />
                  <Tab label="الإنتاجية" />
                  <Tab label="المهام" />
                  <Tab label="تقييم الموارد البشرية" />
                </Tabs>
              </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: 400, maxHeight: "70vh", overflow: "auto" }}>
              {!selectedUser ? (
                <Typography sx={{ opacity: 0.8 }}>—</Typography>
              ) : dialogLoading ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4 }}>
                  <CircularProgress sx={{ color: BRAND, mb: 2 }} />
                  <Typography>جاري تحميل بيانات الموظف...</Typography>
                </Box>
              ) : dialogError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {dialogError}
                </Alert>
              ) : (
                <Box>
                  {/* Tab 0: Summary */}
                  {dialogTab === 0 && (
                    <Box>
                      <Card sx={{ borderRadius: 2, mb: 2, border: `1px solid ${alpha(BRAND, 0.2)}` }}>
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: BRAND, width: 56, height: 56 }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                {selectedUser?.fullName || selectedUser?.userName || "—"}
                              </Typography>
                              <Typography sx={{ opacity: 0.8 }}>
                                @{selectedUser?.userName || "—"}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                الفرع: {getBranchName(selectedUser?.branchForWork)}
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha(BRAND, 0.08), borderRadius: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: BRAND_DARK }}>
                                  {(() => {
                                    const key = buildPayKey(selectedUser);
                                    const st = payStats.get(key);
                                    return st?.status === "done" ? st.percent : 0;
                                  })()}%
                                </Typography>
                                <Typography variant="body2">نسبة التحصيل</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#1976d2", 0.08), borderRadius: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: "#1976d2" }}>
                                  {(() => {
                                    const key = buildRegKey(selectedUser);
                                    const st = regStats.get(key);
                                    return st?.status === "done" ? st.totalRegistrations : 0;
                                  })()}
                                </Typography>
                                <Typography variant="body2">إجمالي التسجيلات</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#9c27b0", 0.08), borderRadius: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: "#9c27b0" }}>
                                  {(() => {
                                    const key = buildProdKey(selectedUser);
                                    const st = productivityStats.get(key);
                                    return st?.status === "done" ? st.summary?.avgProgress || 0 : 0;
                                  })()}%
                                </Typography>
                                <Typography variant="body2">متوسط الإنتاجية</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#ff9800", 0.08), borderRadius: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: "#ff9800" }}>
                                  {(() => {
                                    const key = buildTasksKey(selectedUser);
                                    const st = tasksStats.get(key);
                                    return st?.status === "done" ? st.summary?.totalTasks || 0 : 0;
                                  })()}
                                </Typography>
                                <Typography variant="body2">عدد المهام</Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#4caf50", 0.08), borderRadius: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: "#4caf50" }}>
                                  {hrStats.average_rating ? parseFloat(hrStats.average_rating).toFixed(1) : "0.0"}
                                </Typography>
                                <Typography variant="body2">معدل التقييم</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#2196f3", 0.08), borderRadius: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: "#2196f3" }}>
                                  {hrStats.total_evaluations || 0}
                                </Typography>
                                <Typography variant="body2">عدد التقييمات</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ textAlign: "center", p: 2, bgcolor: alpha("#9c27b0", 0.08), borderRadius: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: "#9c27b0" }}>
                                  {currentEvaluation ? "✓" : "✗"}
                                </Typography>
                                <Typography variant="body2">تقييم الشهر</Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                            <Typography fontWeight={700}>فترة التقييم:</Typography>
                            <Typography>الشهر: {evalMonth}/{evalYear}</Typography>
                            <Typography variant="body2">
                              اضغط على التبويبات لعرض التفاصيل الكاملة لكل قسم
                            </Typography>
                          </Alert>
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                  {/* Tab 1: Payments */}
                  {dialogTab === 1 && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography fontWeight={700}>فترة السداد والتحصيل:</Typography>
                        <Typography>من 15/{evalMonth}/{evalYear} إلى 14/{evalMonth + 1 > 12 ? 1 : evalMonth + 1}/{evalMonth + 1 > 12 ? evalYear + 1 : evalYear}</Typography>
                      </Alert>
                      {renderPayChip(selectedUser)}
                    </Box>
                  )}

                  {/* Tab 2: Registrations */}
                  {dialogTab === 2 && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography fontWeight={700}>فترة التسجيلات:</Typography>
                        <Typography>من أول {evalMonth}/{evalYear} إلى آخر الشهر</Typography>
                      </Alert>
                      {renderRegDetails(selectedUser)}
                    </Box>
                  )}

                  {/* Tab 3: Productivity */}
                  {dialogTab === 3 && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography fontWeight={700}>فترة الإنتاجية:</Typography>
                        <Typography>من أول {evalMonth}/{evalYear} إلى آخر الشهر</Typography>
                      </Alert>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#9c27b0" }}>
                        <EmojiEventsIcon sx={{ marginInlineEnd: 1, verticalAlign: "middle" }} />
                        الإنتاجية الأسبوعية
                      </Typography>
                      {renderProdDetails(selectedUser)}
                    </Box>
                  )}

                  {/* Tab 4: Tasks */}
                  {dialogTab === 4 && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography fontWeight={700}>فترة المهام:</Typography>
                        <Typography>من أول {evalMonth}/{evalYear} إلى آخر الشهر</Typography>
                      </Alert>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#ff9800" }}>
                        <AssignmentIcon sx={{ marginInlineEnd: 1, verticalAlign: "middle" }} />
                        المهام المخصصة
                      </Typography>
                      {renderTasksDetails(selectedUser)}
                    </Box>
                  )}

                  {/* Tab 5: HR Evaluation */}
                  {dialogTab === 5 && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <Typography fontWeight={700}>فترة تقييم الموارد البشرية:</Typography>
                        <Typography>شهر {evalMonth} سنة {evalYear}</Typography>
                        <Typography variant="body2">
                          التقييم من 1 إلى 5 نجوم مع إمكانية إضافة ملاحظات وتوصيات
                        </Typography>
                      </Alert>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#4caf50" }}>
                        <RateReview sx={{ marginInlineEnd: 1, verticalAlign: "middle" }} />
                        تقييم الموارد البشرية
                      </Typography>
                      {renderHREvaluationDetails()}
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={closeEmployeeDialog}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(BRAND, 0.5),
                  color: BRAND_DARK,
                  "&:hover": {
                    borderColor: BRAND,
                    bgcolor: alpha(BRAND, 0.08),
                  },
                }}
              >
                إغلاق
              </Button>

              <Button
                variant="contained"
                sx={{
                  borderRadius: 2,
                  fontWeight: 900,
                  bgcolor: BRAND,
                  "&:hover": { bgcolor: BRAND_DARK },
                  boxShadow: `0 10px 20px ${alpha(BRAND, 0.25)}`,
                }}
                onClick={() => {
                  console.log("Save evaluation for", selectedUser, {
                    evalMonth,
                    evalYear,
                    fromDate,
                    toDate,
                    regFromDate,
                    regToDate,
                    tasksFromDate,
                    tasksToDate,
                  });
                }}
              >
                حفظ التقييم
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box></NavigationShell>
  );
};

export default EmployeeEvaluationPage;