import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Paper,
  Grid,
  Chip,
  Stack,
  InputAdornment,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  Checkbox,
  Collapse,
  Alert,
  Snackbar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Badge,
  alpha,
  useTheme,
  Fab,
} from "@mui/material";

import {
  DateRange as DateRangeIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  Search as SearchIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon2,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Apartment as ApartmentIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  TableChart as TableIcon,
  GridView as GridIcon,
  List as ListIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Lightbulb as LightbulbIcon,
  Task as TaskIcon,
  AttachFile as AttachFileIcon,
  Folder as FolderIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
} from "@mui/icons-material";

import { format } from "date-fns";
import arLocale from "date-fns/locale/ar-SA";

// ✅ api.php
const API_URL = "https://filesregsiteration.sstli.com/erp/api.php";

// ✅ Base URL للملفات
const FILES_BASE_URL = "https://filesregsiteration.sstli.com/erp/";

// ✅ branches endpoint (داخلي)
const BRANCHES_URL = "https://api1.sstli.com/api/branches/all";

// ✅ users endpoint (داخلي)
const USERINFO_URL = "https://api1.sstli.com/api/userinfo";

// ✅ Admin theme
const ADMIN_ACCENT = "#80b49e";


// ✅ View modes
const VIEW_MODES = {
  TABLE: 'table',
  CARD: 'card',
};

function resolveFileUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const clean = s.replace(/^\/+/, "");
  return new URL(clean, FILES_BASE_URL).toString();
}

function safeParseLocalStorageUser() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    const raw = localStorage.user;
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function formatDate(date) {
  try {
    return format(new Date(date), "yyyy/MM/dd", { locale: arLocale });
  } catch {
    return "-";
  }
}

function formatDateTime(date) {
  try {
    return format(new Date(date), "yyyy/MM/dd HH:mm", { locale: arLocale });
  } catch {
    return "-";
  }
}

/**
 * تحويل أي تاريخ إلى رقم (ms) مع دعم "yyyy-MM-dd" و ISO وغيره
 * - لو empty => null
 */
function toMs(d) {
  if (!d) return null;
  const dt = new Date(d);
  const ms = dt.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * فلترة بالمدى: "تداخل" بين فترة الإنجاز وفترة الفلتر
 */
function isInRangeByOverlap({ aStart, aEnd, from, to }) {
  if (!from && !to) return true;

  const start = aStart ?? null;
  const end = aEnd ?? start ?? null;

  if (!start && !end) return false;

  if (from && !to) return (end ?? start) >= from;
  if (!from && to) return (start ?? end) <= to;

  return (start ?? end) <= to && (end ?? start) >= from;
}

export default function AdminAchievementsPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [viewMode, setViewMode] = useState(VIEW_MODES.TABLE);

  const [branches, setBranches] = useState([]);
  const [branchGuidFilter, setBranchGuidFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  
  // ✅ Table states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [starredAchievements, setStarredAchievements] = useState(new Set());

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const statusOptions = useMemo(
    () => [
      { value: "مكتمل", color: "success", icon: <CheckCircleIcon /> },
      { value: "قيد التنفيذ", color: "warning", icon: <TimelineIcon /> },
      { value: "معلق", color: "info", icon: <ScheduleIcon /> },
      { value: "ملغي", color: "error", icon: <CancelIcon /> },
    ],
    []
  );

  const priorities = useMemo(
    () => [
      { value: "عالي", color: "error", icon: <FlagIcon /> },
      { value: "متوسط", color: "warning", icon: <ScheduleIcon /> },
      { value: "منخفض", color: "success", icon: <AssessmentIcon /> },
    ],
    []
  );

  const getStatusColor = (status) => statusOptions.find((s) => s.value === status)?.color || "default";
  const getPriorityColor = (priority) => priorities.find((p) => p.value === priority)?.color || "default";

  // ✅ map: branchGuid -> branch name
  const branchNameByGuid = useMemo(() => {
    const m = new Map();
    branches.forEach((b) => m.set(String(b.guid).toLowerCase(), b.name));
    return m;
  }, [branches]);

  const resolveBranchName = (guid) => {
    if (!guid) return "—";
    return branchNameByGuid.get(String(guid).toLowerCase()) || guid;
  };

  // ✅ map: userGuid -> user info
  const userByGuid = useMemo(() => {
    const m = new Map();
    users.forEach((u) => {
      m.set(String(u.guid).toLowerCase(), {
        fullName: u.fullName || u.userName || "—",
        userName: u.userName || "—",
        branchForWork: u.branchForWork || null,
      });
    });
    return m;
  }, [users]);

  const resolveOwnerName = (userGuid) => {
    if (!userGuid) return "—";
    return userByGuid.get(String(userGuid).toLowerCase())?.fullName || "—";
  };

  const resolveAchievementBranchGuid = (a) => {
    if (a?.branchGuid) return a.branchGuid;
    const u = userByGuid.get(String(a?.userGuid || "").toLowerCase());
    return u?.branchForWork || null;
  };

  const calculateProgress = (achievement) => achievement.completionPercentage || 0;

  // ✅ Calculate total files count
  const calculateTotalFiles = (achievement) => {
    if (!achievement.items) return 0;
    return achievement.items.reduce((total, item) => total + (item.files?.length || 0), 0);
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch(BRANCHES_URL, { method: "GET" });
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("Branches API returned invalid data");
      setBranches(json);
    } catch (e) {
      setSnackbar({ open: true, message: `فشل تحميل الفروع: ${e.message}`, severity: "error" });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(USERINFO_URL, { method: "GET" });
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("UserInfo API returned invalid data");
      setUsers(json);
    } catch (e) {
      setSnackbar({ open: true, message: `فشل تحميل بيانات الموظفين: ${e.message}`, severity: "error" });
    }
  };

  const mapRow = (r) => ({
    id: r.achievement_id ?? r.id,
    userGuid: r.user_guid,
    branchGuid: r.branch_guid,
    mainTitle: r.main_title,
    category: r.category,
    priority: r.priority,
    overallStatus: r.overall_status,
    startDate: r.start_date,
    endDate: r.end_date,
    notes: r.notes,
    completionPercentage: r.completion_percentage,
    itemCount: r.item_count,
    completedItems: r.completed_items,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: Array.isArray(r.items_json)
      ? r.items_json.map((it) => ({
          id: it.id ?? Math.random(),
          title: it.title ?? "",
          description: it.description ?? "",
          status: it.status ?? "معلق",
          completed: !!it.completed,
          files: Array.isArray(it.files)
            ? it.files.map((f) => {
                const raw = f.url || f.preview || "";
                return {
                  id: f.id ?? Math.random(),
                  name: f.name ?? "file",
                  type: f.type ?? "",
                  size: f.size ?? 0,
                  preview: resolveFileUrl(raw),
                  url: resolveFileUrl(f.url || raw),
                };
              })
            : [],
        }))
      : [],
  });

  const fetchAllAchievements = async () => {
    setLoading(true);
    try {
      const tryActions = ["admin_list", "list_all", "list"];

      let lastError = "";
      for (const action of tryActions) {
        const url = new URL(API_URL, window.location.origin);
        url.searchParams.set("action", action);

        if (branchGuidFilter !== "all") {
          url.searchParams.set("branchGuid", branchGuidFilter);
        }

        const res = await fetch(url.toString(), { method: "GET" });
        const json = await res.json();

        if (json?.ok) {
          const rows = (json.data || []).map(mapRow);
          setAchievements(rows);
          return;
        }

        lastError = json?.error || `action=${action} failed`;
      }

      throw new Error(lastError || "API error");
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchGuidFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setBranchGuidFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const fromMs = useMemo(() => {
    const ms = toMs(dateFrom);
    if (!ms) return null;
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [dateFrom]);

  const toMsEnd = useMemo(() => {
    const ms = toMs(dateTo);
    if (!ms) return null;
    const d = new Date(ms);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [dateTo]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      const computedBranchGuid = resolveAchievementBranchGuid(a);

      const matchesBranch =
        branchGuidFilter === "all" ||
        String(computedBranchGuid || "").toLowerCase() === String(branchGuidFilter).toLowerCase();

      const matchesStatus = filterStatus === "all" || a.overallStatus === filterStatus;

      const q = searchTerm.toLowerCase();
      const ownerName = resolveOwnerName(a.userGuid).toLowerCase();
      const branchName = resolveBranchName(computedBranchGuid).toLowerCase();

      const matchesSearch =
        (a.mainTitle || "").toLowerCase().includes(q) ||
        (a.notes || "").toLowerCase().includes(q) ||
        ownerName.includes(q) ||
        branchName.includes(q) ||
        (a.items || []).some(
          (it) => (it.title || "").toLowerCase().includes(q) || (it.description || "").toLowerCase().includes(q)
        );

      const aStartMs = toMs(a.startDate) ?? toMs(a.createdAt);
      const aEndMs = toMs(a.endDate) ?? aStartMs;

      const matchesDateRange = isInRangeByOverlap({
        aStart: aStartMs,
        aEnd: aEndMs,
        from: fromMs,
        to: toMsEnd,
      });

      return matchesBranch && matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [achievements, branchGuidFilter, filterStatus, searchTerm, fromMs, toMsEnd, branchNameByGuid, userByGuid]);

  const sortedAchievements = useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      const isAsc = order === 'asc';
      if (orderBy === 'createdAt') {
        return isAsc ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (orderBy === 'completionPercentage') {
        return isAsc ? a.completionPercentage - b.completionPercentage : b.completionPercentage - a.completionPercentage;
      }
      if (orderBy === 'priority') {
        const priorityOrder = { "عالي": 3, "متوسط": 2, "منخفض": 1 };
        return isAsc ? priorityOrder[a.priority] - priorityOrder[b.priority] : priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });
  }, [filteredAchievements, orderBy, order]);

  const paginatedAchievements = useMemo(() => {
    return sortedAchievements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedAchievements, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (achievement) => {
    setSelectedAchievement(achievement);
    setDetailsDialogOpen(true);
  };

  const handleOpenImageViewer = (file) => {
    setSelectedImage(file);
    setImageViewerOpen(true);
  };

  const toggleStar = (achievementId) => {
    const newStarred = new Set(starredAchievements);
    if (newStarred.has(achievementId)) {
      newStarred.delete(achievementId);
    } else {
      newStarred.add(achievementId);
    }
    setStarredAchievements(newStarred);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(sortedAchievements, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'achievements.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const adminUser = safeParseLocalStorageUser();
  const adminName = adminUser?.userName || adminUser?.UserName || "—";

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'عالي': return <FlagIcon sx={{ color: '#ef4444', fontSize: 14 }} />;
      case 'متوسط': return <FlagIcon sx={{ color: '#f59e0b', fontSize: 14 }} />;
      case 'منخفض': return <FlagIcon sx={{ color: '#10b981', fontSize: 14 }} />;
      default: return <FlagIcon sx={{ fontSize: 14 }} />;
    }
  };

  const getStatusIcon = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? React.cloneElement(option.icon, { sx: { fontSize: 14 } }) : null;
  };

  return (
    <NavigationShell variant="standard" ><Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      

      <Box sx={{
        minHeight: "100vh",
        ...navigationContentSx
      }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Top Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: alpha(ADMIN_ACCENT, 0.1),
              }}
            />
            
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} flexWrap="wrap">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    bgcolor: ADMIN_ACCENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(128,180,158,0.4)',
                  }}
                >
                  <EmojiEventsIcon sx={{ color: "white", fontSize: 28 }} />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 24, color: "#0f172a", letterSpacing: -0.5 }}>
                    لوحة التحكم — الإنتاجية الأسبوعية
                  </Typography>
                  <Typography sx={{ color: "#64748b", fontSize: 14, mt: 0.5 }}>
                    المستخدم: <b style={{ color: ADMIN_ACCENT }}>{adminName}</b> • 
                    {loading ? " جاري التحميل..." : ` ${filteredAchievements.length} إنجاز`}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Button
                  variant={viewMode === VIEW_MODES.TABLE ? "contained" : "outlined"}
                  startIcon={<TableIcon />}
                  onClick={() => setViewMode(VIEW_MODES.TABLE)}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    ...(viewMode === VIEW_MODES.TABLE && {
                      bgcolor: ADMIN_ACCENT,
                      '&:hover': { bgcolor: '#6aa992' }
                    })
                  }}
                >
                  جدول
                </Button>
                
                <Button
                  variant={viewMode === VIEW_MODES.CARD ? "contained" : "outlined"}
                  startIcon={<GridIcon />}
                  onClick={() => setViewMode(VIEW_MODES.CARD)}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    ...(viewMode === VIEW_MODES.CARD && {
                      bgcolor: ADMIN_ACCENT,
                      '&:hover': { bgcolor: '#6aa992' }
                    })
                  }}
                >
                  بطاقات
                </Button>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />

                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={fetchAllAchievements}
                  disabled={loading}
                  sx={{
                    bgcolor: ADMIN_ACCENT,
                    "&:hover": { bgcolor: "#6aa992" },
                    borderRadius: 2,
                    px: 2,
                  }}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  sx={{
                    borderColor: "#cbd5e1",
                    color: "#334155",
                    "&:hover": { borderColor: ADMIN_ACCENT, bgcolor: alpha(ADMIN_ACCENT, 0.05) },
                    borderRadius: 2,
                    px: 2,
                  }}
                >
                  مسح الفلاتر
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                  sx={{
                    borderColor: "#cbd5e1",
                    color: "#334155",
                    "&:hover": { borderColor: ADMIN_ACCENT, bgcolor: alpha(ADMIN_ACCENT, 0.05) },
                    borderRadius: 2,
                    px: 2,
                  }}
                >
                  تصدير
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Filters */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="بحث في الإنتاجية الأسبوعية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: ADMIN_ACCENT }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>الحالة</InputLabel>
                  <Select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)} 
                    label="الحالة"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">كل الحالات</MenuItem>
                    {statusOptions.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {s.icon}
                          <span>{s.value}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>الفرع</InputLabel>
                  <Select 
                    value={branchGuidFilter} 
                    onChange={(e) => setBranchGuidFilter(e.target.value)} 
                    label="الفرع"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">كل الفروع</MenuItem>
                    {branches.map((b) => (
                      <MenuItem key={b.guid} value={b.guid}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="من تاريخ"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ borderRadius: 2 }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="إلى تاريخ"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ borderRadius: 2 }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>

              <Grid item xs={12} md={1}>
                <Tooltip title="إعادة تعيين">
                  <IconButton
                    onClick={clearFilters}
                    sx={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      width: '100%',
                      height: 56,
                      bgcolor: '#f8fafc',
                      '&:hover': { bgcolor: '#f1f5f9' }
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>

          {/* Data Grid / Table */}
          {viewMode === VIEW_MODES.TABLE ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                overflow: 'hidden',
                mb: 3,
              }}
            >
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <StarIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
                          <span>الإنجاز</span>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <Button
                          size="small"
                          endIcon={<SortIcon />}
                          onClick={() => handleSort('priority')}
                          sx={{ color: '#334155', fontWeight: 800 }}
                        >
                          الأولوية
                        </Button>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <Button
                          size="small"
                          endIcon={<SortIcon />}
                          onClick={() => handleSort('completionPercentage')}
                          sx={{ color: '#334155', fontWeight: 800 }}
                        >
                          التقدم
                        </Button>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>الحالة</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>الفرع</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>الموظف</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <Button
                          size="small"
                          endIcon={<SortIcon />}
                          onClick={() => handleSort('createdAt')}
                          sx={{ color: '#334155', fontWeight: 800 }}
                        >
                          التاريخ
                        </Button>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>المرفقات</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAchievements.map((a) => {
                      const ownerName = resolveOwnerName(a.userGuid);
                      const computedBranchGuid = resolveAchievementBranchGuid(a);
                      const branchName = resolveBranchName(computedBranchGuid);
                      const progress = calculateProgress(a);
                      const totalFiles = calculateTotalFiles(a);
                      const hasFiles = totalFiles > 0;

                      return (
                        <TableRow
                          key={a.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: '#f8fafc' },
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStar(a.id);
                                }}
                              >
                                {starredAchievements.has(a.id) ? (
                                  <StarIcon sx={{ color: '#fbbf24' }} />
                                ) : (
                                  <StarBorderIcon sx={{ color: '#cbd5e1' }} />
                                )}
                              </IconButton>
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                                  {a.mainTitle}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                                  {a.category} • {a.itemCount || 0} بند
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getPriorityIcon(a.priority)}
                              label={a.priority}
                              size="small"
                              color={getPriorityColor(a.priority)}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ width: 120 }}>
                              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                  {progress}%
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                                  {a.completedItems || 0}/{a.itemCount || 0}
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: progress >= 100 ? '#10b981' : ADMIN_ACCENT,
                                    borderRadius: 3,
                                  }
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(a.overallStatus)}
                              label={a.overallStatus}
                              size="small"
                              color={getStatusColor(a.overallStatus)}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <ApartmentIcon sx={{ fontSize: 16, color: '#64748b' }} />
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                                {branchName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                                {ownerName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                {formatDate(a.startDate)} - {formatDate(a.endDate)}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                                {formatDateTime(a.createdAt)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {hasFiles ? (
                              <Badge badgeContent={totalFiles} color="primary">
                                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28 } }}>
                                  {a.items?.flatMap(item => item.files || []).slice(0, 3).map((file, idx) => (
                                    <Avatar
                                      key={idx}
                                      src={file.type?.startsWith('image/') ? file.preview : null}
                                      sx={{ bgcolor: file.type?.startsWith('image/') ? '#dbeafe' : '#f0f9ff' }}
                                    >
                                      {file.type?.startsWith('image/') ? (
                                        <ImageIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                                      ) : file.type === 'application/pdf' ? (
                                        <PdfIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                                      ) : (
                                        <FileIcon sx={{ fontSize: 14, color: '#64748b' }} />
                                      )}
                                    </Avatar>
                                  ))}
                                </AvatarGroup>
                              </Badge>
                            ) : (
                              <Typography sx={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                                لا توجد مرفقات
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="عرض التفاصيل">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(a)}
                                  sx={{
                                    border: '1px solid #e2e8f0',
                                    bgcolor: '#f8fafc',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                  }}
                                >
                                  <VisibilityIcon sx={{ fontSize: 18, color: ADMIN_ACCENT }} />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="المزيد">
                                <IconButton
                                  size="small"
                                  sx={{
                                    border: '1px solid #e2e8f0',
                                    bgcolor: '#f8fafc',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                  }}
                                >
                                  <MoreVertIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredAchievements.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="عدد الصفوف:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
                sx={{
                  borderTop: '1px solid #e2e8f0',
                  bgcolor: '#f8fafc'
                }}
              />
            </Paper>
          ) : (
            // Card View
            <Grid container spacing={3}>
              {paginatedAchievements.map((a) => {
                const ownerName = resolveOwnerName(a.userGuid);
                const computedBranchGuid = resolveAchievementBranchGuid(a);
                const branchName = resolveBranchName(computedBranchGuid);
                const progress = calculateProgress(a);
                const totalFiles = calculateTotalFiles(a);

                return (
                  <Grid item xs={12} md={6} lg={4} key={a.id}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                          borderColor: ADMIN_ACCENT
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            height: 6,
                            bgcolor: progress >= 100 ? '#10b981' : ADMIN_ACCENT,
                            borderTopLeftRadius: 3,
                            borderTopRightRadius: 3,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => toggleStar(a.id)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(4px)',
                            '&:hover': { bgcolor: 'white' }
                          }}
                        >
                          {starredAchievements.has(a.id) ? (
                            <StarIcon sx={{ color: '#fbbf24' }} />
                          ) : (
                            <StarBorderIcon sx={{ color: '#cbd5e1' }} />
                          )}
                        </IconButton>
                      </Box>

                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography sx={{ fontWeight: 900, fontSize: 16, color: '#0f172a', mb: 0.5 }}>
                                {a.mainTitle}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                                {a.category}
                              </Typography>
                            </Box>
                            <Chip
                              label={a.overallStatus}
                              color={getStatusColor(a.overallStatus)}
                              size="small"
                              sx={{ fontWeight: 800 }}
                            />
                          </Stack>

                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontSize: 12, color: '#64748b' }}>التقدم</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                                {progress}% ({a.completedItems || 0}/{a.itemCount || 0})
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: progress >= 100 ? '#10b981' : ADMIN_ACCENT,
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Stack>

                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              {getPriorityIcon(a.priority)}
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                                {a.priority}
                              </Typography>
                            </Stack>
                            
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <AttachFileIcon sx={{ fontSize: 14, color: '#64748b' }} />
                              <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                                {totalFiles} ملف
                              </Typography>
                            </Stack>
                          </Stack>

                          <Divider sx={{ my: 1 }} />

                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                              <Typography sx={{ fontSize: 13, color: '#334155' }}>
                                {ownerName}
                              </Typography>
                            </Stack>
                            
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <ApartmentIcon sx={{ fontSize: 16, color: '#64748b' }} />
                              <Typography sx={{ fontSize: 13, color: '#334155' }}>
                                {branchName}
                              </Typography>
                            </Stack>
                            
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <DateRangeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                                {formatDate(a.startDate)} - {formatDate(a.endDate)}
                              </Typography>
                            </Stack>
                          </Stack>

                          {a.notes && (
                            <Box sx={{ mt: 1 }}>
                              <Typography sx={{ fontSize: 11, color: '#94a3b8', mb: 0.5 }}>
                                الملاحظات:
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                                {a.notes.length > 100 ? `${a.notes.substring(0, 100)}...` : a.notes}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>

                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(a)}
                          sx={{
                            bgcolor: ADMIN_ACCENT,
                            '&:hover': { bgcolor: '#6aa992' },
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 700
                          }}
                        >
                          عرض التفاصيل
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {filteredAchievements.length === 0 && !loading && (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                textAlign: 'center',
                borderRadius: 3,
                border: '2px dashed #e2e8f0',
                bgcolor: '#f8fafc'
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 700, mb: 1 }}>
                لا توجد إنجازات
              </Typography>
              <Typography sx={{ color: '#94a3b8', maxWidth: 400, mx: 'auto' }}>
                لم يتم العثور على إنجازات تطابق معايير البحث. جرب تغيير الفلاتر أو إنشاء إنجاز جديد.
              </Typography>
            </Paper>
          )}

          {/* Details Dialog */}
          <Dialog
            open={detailsDialogOpen}
            onClose={() => setDetailsDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                maxHeight: '90vh'
              }
            }}
          >
            {selectedAchievement && (
              <>
                <DialogTitle sx={{ 
                  bgcolor: '#f8fafc', 
                  borderBottom: '1px solid #e2e8f0',
                  pb: 2 
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                      {selectedAchievement.mainTitle}
                    </Typography>
                    <IconButton onClick={() => setDetailsDialogOpen(false)}>
                      <CancelIcon />
                    </IconButton>
                  </Stack>
                  
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                    <Chip
                      label={selectedAchievement.overallStatus}
                      color={getStatusColor(selectedAchievement.overallStatus)}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                    <Chip
                      label={selectedAchievement.priority}
                      color={getPriorityColor(selectedAchievement.priority)}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={<PersonIcon />}
                      label={resolveOwnerName(selectedAchievement.userGuid)}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </DialogTitle>
                
                <DialogContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    {/* Basic Info */}
                    <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                              <ApartmentIcon sx={{ fontSize: 14, marginInlineEnd: 0.5 }} />
                              الفرع
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
                              {resolveBranchName(resolveAchievementBranchGuid(selectedAchievement))}
                            </Typography>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                              <DateRangeIcon sx={{ fontSize: 14, marginInlineEnd: 0.5 }} />
                              الفترة الزمنية
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
                              {formatDate(selectedAchievement.startDate)} - {formatDate(selectedAchievement.endDate)}
                            </Typography>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                              <TimelineIcon sx={{ fontSize: 14, marginInlineEnd: 0.5 }} />
                              الفئة
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
                              {selectedAchievement.category}
                            </Typography>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                              <TaskIcon sx={{ fontSize: 14, marginInlineEnd: 0.5 }} />
                              عدد البنود
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
                              {selectedAchievement.completedItems || 0} / {selectedAchievement.itemCount || 0}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Progress */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                          نسبة الإنجاز
                        </Typography>
                        <Typography sx={{ fontWeight: 800, color: ADMIN_ACCENT, fontSize: 18 }}>
                          {calculateProgress(selectedAchievement)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={calculateProgress(selectedAchievement)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: calculateProgress(selectedAchievement) >= 100 ? '#10b981' : ADMIN_ACCENT,
                            borderRadius: 5,
                          }
                        }}
                      />
                    </Box>

                    {/* Notes */}
                    {selectedAchievement.notes && (
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                          الملاحظات
                        </Typography>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                          <Typography sx={{ color: '#475569', lineHeight: 1.6 }}>
                            {selectedAchievement.notes}
                          </Typography>
                        </Paper>
                      </Box>
                    )}

                    {/* Items */}
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                        البنود ({selectedAchievement.items?.length || 0})
                      </Typography>
                      
                      <Stack spacing={2}>
                        {selectedAchievement.items?.map((item, idx) => (
                          <Paper
                            key={item.id}
                            elevation={0}
                            sx={{
                              p: 2.5,
                              border: '1px solid #e2e8f0',
                              borderRadius: 2,
                              bgcolor: '#ffffff',
                            }}
                          >
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  <Checkbox
                                    checked={item.completed || item.status === 'مكتمل'}
                                    disabled
                                    sx={{ p: 0 }}
                                  />
                                  <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                                    {item.title}
                                  </Typography>
                                </Stack>
                                <Chip
                                  label={item.status}
                                  size="small"
                                  color={getStatusColor(item.status)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </Stack>

                              {item.description && (
                                <Typography sx={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
                                  {item.description}
                                </Typography>
                              )}

                              {item.files?.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600, mb: 1 }}>
                                    المرفقات ({item.files.length})
                                  </Typography>
                                  <Grid container spacing={1}>
                                    {item.files.map((file) => (
                                      <Grid item xs={12} sm={6} md={4} key={file.id}>
                                        <Card
                                          variant="outlined"
                                          sx={{
                                            borderRadius: 2,
                                            borderColor: '#e2e8f0',
                                            '&:hover': { borderColor: ADMIN_ACCENT, cursor: 'pointer' }
                                          }}
                                          onClick={() => {
                                            if (file.type?.startsWith('image/')) {
                                              handleOpenImageViewer(file);
                                            } else {
                                              window.open(file.url || file.preview, '_blank');
                                            }
                                          }}
                                        >
                                          <CardContent sx={{ p: 2 }}>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                              {file.type?.startsWith('image/') ? (
                                                <Box
                                                  sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 1,
                                                    bgcolor: '#f0f9ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                  }}
                                                >
                                                  <img
                                                    src={file.preview || file.url}
                                                    alt={file.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                  />
                                                </Box>
                                              ) : file.type === 'application/pdf' ? (
                                                <Box
                                                  sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 1,
                                                    bgcolor: '#fef2f2',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                  }}
                                                >
                                                  <PdfIcon sx={{ fontSize: 24, color: '#ef4444' }} />
                                                </Box>
                                              ) : (
                                                <Box
                                                  sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 1,
                                                    bgcolor: '#f8fafc',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                  }}
                                                >
                                                  <FileIcon sx={{ fontSize: 24, color: '#64748b' }} />
                                                </Box>
                                              )}
                                              
                                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                  sx={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#0f172a',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                  }}
                                                >
                                                  {file.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                                                  {file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                </Typography>
                                              </Box>
                                              
                                              <IconButton size="small">
                                                {file.type?.startsWith('image/') ? (
                                                  <ZoomInIcon sx={{ fontSize: 18, color: ADMIN_ACCENT }} />
                                                ) : (
                                                  <DownloadIcon sx={{ fontSize: 18, color: ADMIN_ACCENT }} />
                                                )}
                                              </IconButton>
                                            </Stack>
                                          </CardContent>
                                        </Card>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                              )}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>

                    {/* Timeline */}
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                        السجل الزمني
                      </Typography>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                              تاريخ الإنشاء
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                              {formatDateTime(selectedAchievement.createdAt)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                              آخر تحديث
                            </Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                              {formatDateTime(selectedAchievement.updatedAt)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Box>
                  </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
                  <Button
                    onClick={() => setDetailsDialogOpen(false)}
                    sx={{
                      color: '#64748b',
                      '&:hover': { bgcolor: '#f1f5f9' }
                    }}
                  >
                    إغلاق
                  </Button>
                  {/* <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      // Handle download logic
                    }}
                    sx={{
                      bgcolor: ADMIN_ACCENT,
                      '&:hover': { bgcolor: '#6aa992' },
                      fontWeight: 700
                    }}
                  >
                    تصدير التقرير
                  </Button> */}
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Image Viewer Dialog */}
          <Dialog
            open={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
            maxWidth="lg"
            PaperProps={{
              sx: {
                borderRadius: 3,
                bgcolor: 'transparent',
                boxShadow: 'none'
              }
            }}
          >
            {selectedImage && (
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  onClick={() => setImageViewerOpen(false)}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                  }}
                >
                  <CancelIcon />
                </IconButton>
                
                <img
                  src={selectedImage.preview || selectedImage.url}
                  alt={selectedImage.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    borderRadius: 8,
                    display: 'block',
                    margin: 'auto'
                  }}
                />
              </Box>
            )}
          </Dialog>

          {/* Floating Action Button */}
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 32,
              left: 32,
              bgcolor: ADMIN_ACCENT,
              '&:hover': { bgcolor: '#6aa992' },
              width: 56,
              height: 56
            }}
            onClick={() => {
              // Handle add new achievement
            }}
          >
            <EmojiEventsIcon />
          </Fab>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4500}
            onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <Alert
              severity={snackbar.severity}
              sx={{ 
                width: "100%",
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box></NavigationShell>
  );
}