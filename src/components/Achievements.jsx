import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Card, CardContent, TextField,
  Button, IconButton, Paper, Grid, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Tooltip, Fab, Alert, Snackbar,
  FormControl, InputLabel, Select, MenuItem,
  List, ListItem, Checkbox, FormControlLabel,
  Avatar, LinearProgress, CardHeader,
  useTheme, alpha, Modal, Badge, Tabs, Tab,
  CardMedia, ListItemIcon, ListItemText, CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DateRange as DateRangeIcon,
  EmojiEvents as EmojiEventsIcon,
  PhotoCamera as PhotoCameraIcon,
  AttachFile as AttachFileIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Search as SearchIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PictureAsPdfIcon,
  InsertDriveFile as InsertDriveFileIcon,
  VideoLibrary as VideoLibraryIcon,
  ZoomIn as ZoomInIcon,
  GetApp as GetAppIcon,
  CalendarToday as CalendarTodayIcon,
  Category as CategoryIcon,
  Notes as NotesIcon,
  FolderOpen as FolderOpenIcon,
  ArrowBack as ArrowBackIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';

import { format, startOfWeek, endOfWeek, getISOWeek, getISOWeekYear } from 'date-fns';
import arLocale from 'date-fns/locale/ar-SA';




// ✅ api.php
const API_URL = 'https://filesregsiteration.sstli.com/erp/api.php';

// ✅ Base URL للملفات
const FILES_BASE_URL = 'https://filesregsiteration.sstli.com/erp/';

function resolveFileUrl(u) {
  if (!u) return '';
  const s = String(u).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const clean = s.replace(/^\/+/, '');
  return new URL(clean, FILES_BASE_URL).toString();
}

function safeParseLocalStorageUser() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    const raw = localStorage.user;
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function getUserGuidAndBranchGuid() {
  const u = safeParseLocalStorageUser();
  const userGuid = u?.guid || u?.Guid || u?.userGuid || '';
  const branchGuid = u?.branchForWork || u?.BranchForWork || u?.branchGuid || '';
  return { userGuid, branchGuid };
}

function toYMD(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ✅ أسبوع السعودية غالبًا يبدأ الأحد
const WEEK_STARTS_ON = 0; // 0 = Sunday

function getCurrentWeekRange() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
  return { start, end };
}

// Function to get file icon based on type
const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return <ImageIcon color="primary" />;
  if (fileType === 'application/pdf') return <PictureAsPdfIcon sx={{ color: '#f44336' }} />;
  if (fileType?.includes('video')) return <VideoLibraryIcon color="secondary" />;
  if (fileType?.includes('word') || fileType?.includes('document')) return <DescriptionIcon sx={{ color: '#2196f3' }} />;
  if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return <DescriptionIcon sx={{ color: '#4caf50' }} />;
  return <InsertDriveFileIcon color="action" />;
};

const AchievementsPage = () => {
  const theme = useTheme();
  const [achievements, setAchievements] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [tabValue, setTabValue] = useState(0);

  // ✅ NEW: تحكم في "أسبوع واحد فقط"
  const [currentWeekExistingIndex, setCurrentWeekExistingIndex] = useState(null); // index inside achievements OR null
  const [isCurrentWeekAlreadySubmitted, setIsCurrentWeekAlreadySubmitted] = useState(false);

  const [achievementItems, setAchievementItems] = useState([
    {
      id: Date.now(),
      title: '',
      description: '',
      status: 'مكتمل',
      files: [],
      completed: false
    }
  ]);

  const [formData, setFormData] = useState(() => {
    const { start, end } = getCurrentWeekRange();
    return { startDate: start, endDate: end };
  });

  const fileInputRefs = useRef({});

  const statusOptions = useMemo(() => ([
    { value: 'مكتمل', color: 'success', icon: <CheckCircleIcon />, bgColor: '#e8f5e9' }
  ]), []);

  const getStatusColor = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.color : 'default';
  };

  const getStatusBgColor = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.bgColor : '#f5f5f5';
  };

  const formatDate = (date) => format(new Date(date), 'yyyy/MM/dd', { locale: arLocale });

  const getProgressColor = (progress) => {
    if (progress >= 90) return '#4caf50';
    if (progress >= 70) return '#8bc34a';
    if (progress >= 50) return '#ffc107';
    if (progress >= 30) return '#ff9800';
    return '#f44336';
  };

  const calculateProgress = (achievement) => {
    if (achievement?.completionPercentage !== undefined && achievement?.completionPercentage !== null) {
      return Number(achievement.completionPercentage) || 0;
    }
    if (achievement?.items && achievement.items.length > 0) {
      const completed = achievement.items.filter(item => item.completed || item.status === 'مكتمل').length;
      return Math.round((completed / achievement.items.length) * 100);
    }
    return 0;
  };

  const getDisplayTitle = (a) => {
    const s = a?.startDate ? formatDate(a.startDate) : '-';
    const e = a?.endDate ? formatDate(a.endDate) : '-';
    return `الإنتاجية الأسبوعية (${s} - ${e})`;
  };

  const calcOverallStatusFromItems = (items) => {
    const list = items || [];
    if (!list.length) return 'معلق';

    const done = list.filter(x => x.completed || x.status === 'مكتمل').length;
    const canceled = list.filter(x => x.status === 'ملغي').length;

    if (done === list.length) return 'مكتمل';
    if (canceled === list.length) return 'ملغي';
    if (done > 0) return 'قيد التنفيذ';
    return 'معلق';
  };

  const handleOpenDetailModal = (achievement) => {
    setSelectedAchievement(achievement);
    setOpenDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setSelectedAchievement(null);
    setTabValue(0);
  };

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  // ✅ NEW: helper to detect if current week exists
  const computeCurrentWeekLockState = (rows) => {
    const { userGuid } = getUserGuidAndBranchGuid();
    const { start, end } = getCurrentWeekRange();

    const currentStart = toYMD(start);
    const currentEnd = toYMD(end);

    // match same userGuid + same week range
    const idx = (rows || []).findIndex(a => {
      const aUser = String(a.userGuid || '').toLowerCase();
      const u = String(userGuid || '').toLowerCase();
      if (!aUser || !u || aUser !== u) return false;

      const aStart = a.startDate ? toYMD(a.startDate) : '';
      const aEnd = a.endDate ? toYMD(a.endDate) : '';

      return aStart === currentStart && aEnd === currentEnd;
    });

    if (idx >= 0) {
      setCurrentWeekExistingIndex(idx);
      setIsCurrentWeekAlreadySubmitted(true);
    } else {
      setCurrentWeekExistingIndex(null);
      setIsCurrentWeekAlreadySubmitted(false);
    }
  };

  // =========================
  // ✅ API
  // =========================
  const fetchAchievements = async () => {
    const { userGuid, branchGuid } = getUserGuidAndBranchGuid();
    if (!userGuid) {
      setSnackbar({ open: true, message: 'لا يوجد userGuid في localStorage.user', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const url = new URL(API_URL, window.location.origin);
      url.searchParams.set('action', 'list');
      url.searchParams.set('userGuid', userGuid);
      url.searchParams.set('branchGuid', branchGuid);

      const res = await fetch(url.toString(), { method: 'GET' });
      const json = await res.json();

      if (!json.ok) throw new Error(json.error || 'API error');

      const rows = (json.data || []).map(r => ({
        id: r.achievement_id,
        userGuid: r.user_guid,
        branchGuid: r.branch_guid,

        mainTitle: r.main_title,
        category: r.category,
        priority: r.priority,
        overallStatus: r.overall_status,
        notes: r.notes,

        startDate: r.start_date,
        endDate: r.end_date,
        completionPercentage: r.completion_percentage,
        itemCount: r.item_count,
        completedItems: r.completed_items,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        items: Array.isArray(r.items_json) ? r.items_json.map(it => ({
          id: it.id ?? Date.now(),
          title: it.title ?? '',
          description: it.description ?? '',
          status: it.status ?? 'معلق',
          completed: !!it.completed,
          files: Array.isArray(it.files) ? it.files.map(f => {
            const raw = f.url || f.preview || '';
            return {
              id: f.id ?? Date.now(),
              name: f.name ?? 'file',
              type: f.type ?? '',
              size: f.size ?? 0,
              preview: resolveFileUrl(raw),
              url: resolveFileUrl(f.url || raw)
            };
          }) : []
        })) : []
      }));

      setAchievements(rows);

      // ✅ lock state based on current week
      computeCurrentWeekLockState(rows);
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
      setAchievements([]);
      setCurrentWeekExistingIndex(null);
      setIsCurrentWeekAlreadySubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildMultipartPayload = () => {
    const { userGuid, branchGuid } = getUserGuidAndBranchGuid();
    if (!userGuid || !branchGuid) {
      throw new Error('userGuid / branchGuid مش موجودين في localStorage.user');
    }

    const itemsJsonClean = achievementItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      completed: !!item.completed,
      files: (item.files || [])
        .filter(f => !f.file)
        .map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.url || f.preview || ''
        }))
    }));

    const autoMainTitle = `الإنتاجية الأسبوعية`;
    const overallStatus = calcOverallStatusFromItems(achievementItems);

    const fd = new FormData();
    fd.append('userGuid', userGuid);
    fd.append('branchGuid', branchGuid);

    fd.append('mainTitle', autoMainTitle);
    fd.append('category', 'أسبوعي');
    fd.append('priority', 'متوسط');
    fd.append('overallStatus', overallStatus);
    fd.append('notes', '');

    fd.append('startDate', toYMD(formData.startDate));
    fd.append('endDate', toYMD(formData.endDate));
    fd.append('items_json', JSON.stringify(itemsJsonClean));

    achievementItems.forEach((item, index) => {
      (item.files || []).forEach((f) => {
        if (f.file) fd.append(`files[${index}][]`, f.file, f.name);
      });
    });

    return fd;
  };

  const apiCreate = async () => {
    const fd = buildMultipartPayload();
    const url = new URL(API_URL, window.location.origin);
    url.searchParams.set('action', 'create');

    const res = await fetch(url.toString(), { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Create failed');
    return json.id;
  };

  const apiUpdate = async (achievementId) => {
    const fd = buildMultipartPayload();
    const url = new URL(API_URL, window.location.origin);
    url.searchParams.set('action', 'update');
    url.searchParams.set('id', String(achievementId));

    const res = await fetch(url.toString(), { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Update failed');
    return json.id;
  };

  const apiDelete = async (achievementId) => {
    const url = new URL(API_URL, window.location.origin);
    url.searchParams.set('action', 'delete');
    url.searchParams.set('id', String(achievementId));

    const res = await fetch(url.toString(), { method: 'POST' });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Delete failed');
    return true;
  };

  // =========================
  // UI Handlers
  // =========================
  const handleOpenDialog = (index = null) => {
    // ✅ NEW: لو بيحاول يعمل "إضافة جديد" وهو بالفعل مسجل نفس الأسبوع -> حوله لتعديل
    if (index === null && isCurrentWeekAlreadySubmitted && currentWeekExistingIndex !== null) {
      const existing = achievements[currentWeekExistingIndex];

      setSnackbar({
        open: true,
        severity: 'warning',
        message:
          '⚠️ تم تسجيل الإنتاجية الأسبوعية لهذا الأسبوع بالفعل. مش هتقدر تعمل أسبوع جديد. افتح الأسبوع الموجود وعدّل/زوّد البنود داخله.'
      });

      // افتح تعديل الموجود
      index = currentWeekExistingIndex;
    }

    if (index !== null) {
      const achievement = achievements[index];

      setFormData({
        startDate: achievement.startDate ? new Date(achievement.startDate) : getCurrentWeekRange().start,
        endDate: achievement.endDate ? new Date(achievement.endDate) : getCurrentWeekRange().end
      });

      setAchievementItems((achievement.items || []).map(it => ({
        id: it.id ?? Date.now(),
        title: it.title || '',
        description: it.description || '',
        status: it.status || 'معلق',
        completed: !!it.completed,
        files: (it.files || []).map(f => {
          const raw = f.url || f.preview || '';
          return {
            id: f.id ?? Date.now(),
            name: f.name,
            type: f.type,
            size: f.size,
            preview: resolveFileUrl(raw),
            url: resolveFileUrl(f.url || raw)
          };
        })
      })));

      setEditingIndex(index);
    } else {
      // ✅ إنشاء جديد: أسبوع الحالي فقط
      const { start, end } = getCurrentWeekRange();
      setFormData({ startDate: start, endDate: end });

      setAchievementItems([{
        id: Date.now(),
        title: '',
        description: '',
        status: 'مكتمل',
        files: [],
        completed: false
      }]);

      setEditingIndex(null);
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const addAchievementItem = () => {
    setAchievementItems(prev => ([
      ...prev,
      {
        id: Date.now(),
        title: '',
        description: '',
        status: 'مكتمل',
        files: [],
        completed: false
      }
    ]));
  };

  const updateAchievementItem = (id, field, value) => {
    setAchievementItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const removeAchievementItem = (id) => {
    if (achievementItems.length > 1) {
      setAchievementItems(prev => prev.filter(item => item.id !== id));
    } else {
      setSnackbar({ open: true, message: 'لازم بند واحد على الأقل', severity: 'warning' });
    }
  };

  const handleFileSelect = (e, itemId) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      preview: URL.createObjectURL(file),
      file
    }));

    setAchievementItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, files: [...(item.files || []), ...newFiles] }
          : item
      )
    );

    e.target.value = '';
  };

  const removeFile = (itemId, fileId) => {
    setAchievementItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, files: (item.files || []).filter(file => file.id !== fileId) }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    const hasEmptyItems = achievementItems.some(item => !item.title?.trim());
    if (hasEmptyItems) {
      setSnackbar({ open: true, message: 'لازم عنوان لكل بند', severity: 'error' });
      return;
    }

    try {
      setLoading(true);

      if (editingIndex !== null) {
        const achievementId = achievements[editingIndex].id;
        await apiUpdate(achievementId);
        setSnackbar({ open: true, message: 'تم تحديث الإنتاجية الأسبوعية بنجاح ✅', severity: 'success' });
      } else {
        // ✅ NEW: حماية إضافية قبل الإرسال (حتى لو الزر اتقفل)
        if (isCurrentWeekAlreadySubmitted) {
          throw new Error('تم تسجيل إنتاجية هذا الأسبوع بالفعل. افتح الأسبوع الموجود وعدّل البنود.');
        }

        await apiCreate();
        setSnackbar({
          open: true,
          message: 'تم إضافة الإنتاجية الأسبوعية بنجاح ✅. تقدر دلوقتي تضيف/تعدل البنود داخل نفس الأسبوع.',
          severity: 'success'
        });
      }

      handleCloseDialog();
      await fetchAchievements();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإنجاز؟')) return;

    try {
      const achievementId = achievements[index].id;
      await apiDelete(achievementId);
      setSnackbar({ open: true, message: 'تم حذف الإنجاز بنجاح', severity: 'info' });
      await fetchAchievements();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    }
  };

  const handleExpandAchievement = (index) => {
    setExpandedAchievement(expandedAchievement === index ? null : index);
  };

  const filteredAchievements = achievements.filter(achievement => {
    const title = getDisplayTitle(achievement);
    const matchesSearch =
      (title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (achievement.items || []).some(item =>
        (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const stats = useMemo(() => {
    const total = achievements.length;
    const totalItems = achievements.reduce((t, a) => t + (a.itemCount || 0), 0);
    const totalCompletedItems = achievements.reduce((t, a) => t + (a.completedItems || 0), 0);
    const avgProgress = total ? Math.round(achievements.reduce((t, a) => t + calculateProgress(a), 0) / total) : 0;
    return { total, totalItems, totalCompletedItems, avgProgress };
  }, [achievements]);

  const getTotalFiles = (achievement) => {
    if (!achievement?.items) return 0;
    return achievement.items.reduce((total, item) => total + (item.files?.length || 0), 0);
  };

  const computedOverallStatus = (a) => a?.overallStatus || calcOverallStatusFromItems(a?.items);

  // ✅ NEW: نص توضيحي للموظف (بشكل واضح)
  const currentWeekHelpText = useMemo(() => {
    const { start, end } = getCurrentWeekRange();
    const rangeText = `${formatDate(start)} - ${formatDate(end)}`;

    if (!isCurrentWeekAlreadySubmitted) {
      return `أسبوعك الحالي: ${rangeText}. تقدر تضيف إنتاجية أسبوعية واحدة فقط لهذا الأسبوع.`;
    }

    return `✅ أنت بالفعل سجلت إنتاجية الأسبوع الحالي (${rangeText}). مش هتقدر تعمل أسبوع جديد.
لكن تقدر تفتح الأسبوع الموجود وتزوّد/تعدل البنود داخله من زر "تعديل".`;
  }, [isCurrentWeekAlreadySubmitted]);

  return (
    <NavigationShell variant="standard" ><Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          ...navigationContentSx
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ p: 0 }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 1.25,
              mb: 1.25,
              borderRadius: 3,
              background: '#fff',
              color: '#17372b',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(5,117,70,.12)',
              boxShadow: 'none'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Grid container alignItems="center" spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        marginInlineEnd: 1.25,
                        bgcolor: '#edf7f2',
                        color: '#057546'
                      }}
                    >
                      <EmojiEventsIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.25, color: '#034d31', fontSize: '1.15rem' }}>
                        الإنتاجية الأسبوعية
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 650 }}>
                        إضافة بنود أسبوعية + مرفقات + متابعة التقدم
                      </Typography>
                    </Box>
                  </Box>

                  {/* ✅ NEW: رسالة توضيحية واضحة */}
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 0.75,
                      p: 0.75,
                      borderRadius: 2,
                      bgcolor: '#f7fbf9',
                      border: '1px solid rgba(5,117,70,.10)'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {currentWeekHelpText}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}>
                    {/* ✅ NEW: زر الإضافة يتقفل لو الأسبوع موجود */}
                    <Button
                      variant="contained"
                      startIcon={isCurrentWeekAlreadySubmitted ? <EditIcon /> : <AddIcon />}
                      onClick={() => handleOpenDialog(null)}
                      disabled={loading}
                      sx={uiLayout.withUiSx({
                        background: '#057546',
                        color: '#fff',
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.75,
                        minHeight: 40,
                        fontWeight: 800,
                        boxShadow: 'none',
                        '&:hover': {
                          background: '#034d31',
                          boxShadow: 'none'
                        }
                      }, uiLayout.buttonSx)}
                    >
                      {isCurrentWeekAlreadySubmitted
                        ? 'الأسبوع مسجل - افتح للتعديل'
                        : 'إضافة الإنتاجية الأسبوعية'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Stats Cards */}
          <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{
                borderRadius: 3,
                borderTop: '3px solid #057546',
                boxShadow: 'none',
                border: '1px solid rgba(5,117,70,.12)'
              }}>
                <CardContent sx={{ p: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#667eea' }}>
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        إجمالي الأسابيع
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea' }}>
                      <EmojiEventsIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{
                borderRadius: 3,
                borderTop: '3px solid #2e7d32',
                boxShadow: 'none',
                border: '1px solid rgba(5,117,70,.12)'
              }}>
                <CardContent sx={{ p: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#4caf50' }}>
                        {stats.totalCompletedItems}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        بنود مكتملة
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{
                borderRadius: 3,
                borderTop: '3px solid #1976d2',
                boxShadow: 'none',
                border: '1px solid rgba(5,117,70,.12)'
              }}>
                <CardContent sx={{ p: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#2196f3' }}>
                        {stats.totalItems}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        إجمالي البنود
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#2196f3' }}>
                      <BarChartIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{
                borderRadius: 3,
                borderTop: '3px solid #ed9b22',
                boxShadow: 'none',
                border: '1px solid rgba(5,117,70,.12)'
              }}>
                <CardContent sx={{ p: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#ff9800' }}>
                        {stats.avgProgress}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        متوسط التقدم
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }}>
                      <TimelineIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Controls */}
          <Paper elevation={2} sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            bgcolor: 'white'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  placeholder="ابحث في البنود أو الوصف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, bgcolor: '#f8fafc' }
                  }}
                  size="medium"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchAchievements}
                    disabled={loading}
                    sx={uiLayout.withUiSx({ borderRadius: 2 }, uiLayout.buttonSx)}
                  >
                    تحديث
                  </Button>
                  <Box sx={uiLayout.withUiSx({ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 2 }, uiLayout.actionBarSx)}>
                    <Button
                      variant={viewMode === 'grid' ? 'contained' : 'text'}
                      size="small"
                      onClick={() => setViewMode('grid')}
                      sx={uiLayout.withUiSx({ minWidth: 40, borderRadius: '8px 0 0 8px' }, uiLayout.buttonSx)}
                    >
                      <GridViewIcon fontSize="small" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'contained' : 'text'}
                      size="small"
                      onClick={() => setViewMode('list')}
                      sx={uiLayout.withUiSx({ minWidth: 40, borderRadius: '0 8px 8px 0' }, uiLayout.buttonSx)}
                    >
                      <ViewListIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Achievements Grid/List */}
          {filteredAchievements.length === 0 ? (
            <Paper elevation={2} sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'white'
            }}>
              <Box sx={{ mb: 3 }}>
                <EmojiEventsIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
              </Box>
              <Typography variant="h5" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                لا توجد إنجازات أسبوعية
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                {currentWeekHelpText}
              </Typography>

              <Button
                variant="contained"
                startIcon={isCurrentWeekAlreadySubmitted ? <EditIcon /> : <AddIcon />}
                onClick={() => handleOpenDialog(null)}
                sx={uiLayout.withUiSx({
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }, uiLayout.buttonSx)}
              >
                {isCurrentWeekAlreadySubmitted ? 'الأسبوع مسجل - افتح للتعديل' : 'إضافة الإنتاجية الأسبوعية'}
              </Button>
            </Paper>
          ) : viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {filteredAchievements.map((achievement, index) => {
                const progress = calculateProgress(achievement);
                const totalFiles = getTotalFiles(achievement);
                const overall = computedOverallStatus(achievement);

                return (
                  <Grid item xs={12} md={6} lg={4} key={achievement.id}>
                    <Card elevation={3} sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <CardHeader
                        sx={{
                          pb: 0,
                          bgcolor: getStatusBgColor(overall)
                        }}
                        title={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                              {getDisplayTitle(achievement)}
                            </Typography>
                            <IconButton size="small" onClick={() => handleExpandAchievement(index)}>
                              {expandedAchievement === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Box>
                        }
                        subheader={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={overall}
                              color={getStatusColor(overall)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                            {totalFiles > 0 && (
                              <Chip
                                icon={<AttachFileIcon />}
                                label={totalFiles}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                      />

                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        {/* Progress Bar */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="textSecondary">نسبة الإنجاز</Typography>
                            <Typography variant="body2" fontWeight={700} color={getProgressColor(progress)}>
                              {progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: `linear-gradient(90deg, ${getProgressColor(progress)} 0%, ${alpha(getProgressColor(progress), 0.8)} 100%)`
                              }
                            }}
                          />
                        </Box>

                        {/* Info */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <DateRangeIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="textSecondary">
                              {formatDate(achievement.startDate)} - {formatDate(achievement.endDate)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Items Summary */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: '#f8fafc',
                          p: 2,
                          borderRadius: 2,
                          mb: 2
                        }}>
                          <Typography variant="body2" color="textSecondary">
                            البنود: {achievement.completedItems || 0}/{achievement.itemCount || 0}
                          </Typography>
                          {progress === 100 && (
                            <StarIcon sx={{ color: '#ffd700', fontSize: 20 }} />
                          )}
                        </Box>

                        {/* Actions */}
                        <Box sx={uiLayout.withUiSx({ display: 'flex', gap: 1, mt: 'auto' }, uiLayout.actionBarSx)}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleOpenDetailModal(achievement)}
                            sx={uiLayout.withUiSx({ flex: 1, borderRadius: 2 }, uiLayout.buttonSx)}
                          >
                            التفاصيل
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(index)}
                            sx={uiLayout.withUiSx({ borderRadius: 2 }, uiLayout.buttonSx)}
                          >
                            تعديل
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(index)}
                            sx={{
                              color: 'error.main',
                              border: '1px solid',
                              borderColor: 'error.main',
                              '&:hover': {
                                borderColor: 'error.dark',
                                bgcolor: alpha('#f44336', 0.04)
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredAchievements.map((achievement, index) => {
                const progress = calculateProgress(achievement);
                const totalFiles = getTotalFiles(achievement);
                const overall = computedOverallStatus(achievement);

                return (
                  <Paper key={achievement.id} elevation={2} sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
                    }
                  }}>
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                            <Avatar sx={{
                              bgcolor: getStatusBgColor(overall),
                              color: getStatusColor(overall),
                              mt: 0.5
                            }}>
                              <EmojiEventsIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {getDisplayTitle(achievement)}
                                </Typography>
                                <Chip
                                  label={overall}
                                  color={getStatusColor(overall)}
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                                {totalFiles > 0 && (
                                  <Chip
                                    icon={<AttachFileIcon />}
                                    label={totalFiles}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <DateRangeIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="textSecondary">
                                    {formatDate(achievement.startDate)} - {formatDate(achievement.endDate)}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ maxWidth: 400 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" color="textSecondary">التقدم</Typography>
                                  <Typography variant="body2" fontWeight={700} color={getProgressColor(progress)}>
                                    {progress}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      background: `linear-gradient(90deg, ${getProgressColor(progress)} 0%, ${alpha(getProgressColor(progress), 0.8)} 100%)`
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Tooltip title="عرض التفاصيل">
                              <IconButton
                                onClick={() => handleOpenDetailModal(achievement)}
                                sx={{
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  '&:hover': { bgcolor: 'primary.dark' }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="تعديل">
                              <IconButton
                                onClick={() => handleOpenDialog(index)}
                                sx={{
                                  bgcolor: alpha('#2196f3', 0.1),
                                  color: 'info.main',
                                  '&:hover': { bgcolor: alpha('#2196f3', 0.2) }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف">
                              <IconButton
                                onClick={() => handleDelete(index)}
                                sx={{
                                  bgcolor: alpha('#f44336', 0.1),
                                  color: 'error.main',
                                  '&:hover': { bgcolor: alpha('#f44336', 0.2) }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Container>

        {/* FAB */}
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog(null)}
          disabled={loading}
          sx={{
            position: 'fixed',
            bottom: 32,
            left: 32,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: { xs: 'flex', md: 'none' },
            boxShadow: '0 5px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {/* ✅ لو مسجل بالفعل خليه يبقى Edit icon لتفهمهم */}
          {isCurrentWeekAlreadySubmitted ? <EditIcon /> : <AddIcon />}
        </Fab>
      </Box>

      {/* Dialog for Add/Edit */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
              <EmojiEventsIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {editingIndex !== null ? 'تعديل الإنتاجية الأسبوعية' : 'إضافة الإنتاجية الأسبوعية'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {formatDate(formData.startDate)} - {formatDate(formData.endDate)}
              </Typography>

              {/* ✅ NEW: توضيح داخل الديالوج كمان */}
              {editingIndex !== null && (
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
                  ملاحظة: أنت تعدّل الأسبوع الحالي/الموجود. تقدر تزود بنود ومرفقات داخل نفس الأسبوع.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: 700,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <TrendingUpIcon fontSize="small" />
                بنود الأسبوع ({achievementItems.length})
              </Typography>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addAchievementItem}
                sx={uiLayout.withUiSx({ borderRadius: 2 }, uiLayout.buttonSx)}
              >
                إضافة بند
              </Button>
            </Box>

            <Grid container spacing={3}>
              {achievementItems.map((item, index) => (
                <Grid item xs={12} key={item.id}>
                  <Paper elevation={0} sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'divider',
                    bgcolor: '#fafafa',
                    position: 'relative'
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      top: -10,
                      right: 20,
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      البند {index + 1}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => removeAchievementItem(item.id)}
                        sx={{
                          color: 'error.main',
                          '&:hover': { bgcolor: alpha('#f44336', 0.1) }
                        }}
                        disabled={achievementItems.length <= 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField InputLabelProps={{ shrink: true }}
                          fullWidth
                          label="عنوان البند"
                          value={item.title}
                          onChange={(e) => updateAchievementItem(item.id, 'title', e.target.value)}
                          required
                          size="small"
                          sx={uiLayout.withUiSx({ '& .MuiOutlinedInput-root': { borderRadius: 2 } }, uiLayout.formFieldSx)}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField InputLabelProps={{ shrink: true }}
                          fullWidth
                          label="وصف البند"
                          value={item.description}
                          onChange={(e) => updateAchievementItem(item.id, 'description', e.target.value)}
                          multiline
                          rows={2}
                          size="small"
                          sx={uiLayout.withUiSx({ '& .MuiOutlinedInput-root': { borderRadius: 2 } }, uiLayout.formFieldSx)}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                          <InputLabel>حالة البند</InputLabel>
                          <Select
                            value={item.status}
                            onChange={(e) => updateAchievementItem(item.id, 'status', e.target.value)}
                            label="حالة البند"
                            sx={{ borderRadius: 2 }}
                          >
                            {statusOptions.map((status) => (
                              <MenuItem key={status.value} value={status.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  {status.icon}
                                  <Typography variant="body2">{status.value}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={item.completed}
                                onChange={(e) => updateAchievementItem(item.id, 'completed', e.target.checked)}
                                color="success"
                                sx={{ '&.Mui-checked': { color: 'success.main' } }}
                              />
                            }
                            label="تم إكمال البند"
                            sx={{ m: 0 }}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'white',
                          borderStyle: 'dashed'
                        }}>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => handleFileSelect(e, item.id)}
                            ref={el => fileInputRefs.current[item.id] = el}
                            style={{ display: 'none' }}
                          />

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <AttachFileIcon color="primary" />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                مرفقات البند
                              </Typography>
                            </Box>

                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PhotoCameraIcon />}
                              onClick={() => fileInputRefs.current[item.id]?.click()}
                              sx={uiLayout.withUiSx({ borderRadius: 2 }, uiLayout.buttonSx)}
                            >
                              إضافة ملفات
                            </Button>
                          </Box>

                          {item.files && item.files.length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {item.files.map((file) => (
                                <Chip
                                  key={file.id}
                                  icon={(file.type || '').startsWith('image/')
                                    ? <ImageIcon fontSize="small" />
                                    : <DescriptionIcon fontSize="small" />
                                  }
                                  label={`${file.name} (${(Number(file.size || 0) / 1024).toFixed(1)} KB)`}
                                  onDelete={() => removeFile(item.id, file.id)}
                                  onClick={() => {
                                    const u = resolveFileUrl(file.url || file.preview);
                                    if (u) window.open(u, '_blank');
                                  }}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    mb: 1,
                                    cursor: 'pointer',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: alpha('#667eea', 0.1) }
                                  }}
                                />
                              ))}
                            </Stack>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={uiLayout.withUiSx({ p: 3, pt: 2, bgcolor: '#f8fafc' }, uiLayout.dialogActionsSx)}>
          <Box sx={uiLayout.withUiSx({ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }, uiLayout.pageHeaderSx)}>
            <Typography variant="body2" color="textSecondary">
              إجمالي البنود: <strong>{achievementItems.length}</strong>
            </Typography>

            <Box sx={uiLayout.withUiSx({ display: 'flex', gap: 2 }, uiLayout.actionBarSx)}>
              <Button
                onClick={handleCloseDialog}
                startIcon={<CancelIcon />}
                sx={uiLayout.withUiSx({ color: 'text.secondary', borderRadius: 2, px: 3 }, uiLayout.buttonSx)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={uiLayout.withUiSx({
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  px: 4,
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                  }
                }, uiLayout.buttonSx)}
              >
                {editingIndex !== null ? 'تحديث الإنتاجية الأسبوعية' : 'حفظ الإنتاجية الأسبوعية'}
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Detail Modal for Achievement */}
      <Modal
        open={openDetailModal}
        onClose={handleCloseDetailModal}
        aria-labelledby="achievement-detail-modal"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Paper
          sx={{
            width: '95%',
            maxWidth: 1200,
            maxHeight: '90vh',
            overflow: 'hidden',
            borderRadius: 3,
            position: 'relative'
          }}
        >
          {selectedAchievement && (
            <>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 3, position: 'relative' }}>
                <IconButton
                  onClick={handleCloseDetailModal}
                  sx={{ position: 'absolute', left: 16, top: 16, color: 'white' }}
                >
                  <ArrowBackIcon />
                </IconButton>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '3px solid white'
                    }}
                  >
                    <EmojiEventsIcon sx={{ fontSize: 40 }} />
                  </Avatar>

                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    {getDisplayTitle(selectedAchievement)}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                    <Chip
                      label={computedOverallStatus(selectedAchievement)}
                      color={getStatusColor(computedOverallStatus(selectedAchievement))}
                      sx={{ fontWeight: 700, fontSize: '0.9rem' }}
                    />
                    <Chip
                      icon={<CategoryIcon />}
                      label={`${formatDate(selectedAchievement.startDate)} - ${formatDate(selectedAchievement.endDate)}`}
                      variant="outlined"
                      sx={{ color: 'white', borderColor: 'white' }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab icon={<DescriptionIcon />} label="الملخص" />
                  <Tab
                    icon={
                      <Badge badgeContent={selectedAchievement.items?.length || 0} color="primary">
                        <FolderOpenIcon />
                      </Badge>
                    }
                    label="البنود"
                  />
                  <Tab
                    icon={
                      <Badge badgeContent={(selectedAchievement.items || []).reduce((t, it) => t + (it.files?.length || 0), 0)} color="primary">
                        <AttachFileIcon />
                      </Badge>
                    }
                    label="المرفقات"
                  />
                </Tabs>
              </Box>

              <Box sx={{ p: 3, maxHeight: '60vh', overflow: 'auto' }}>
                {/* نفس التاب كونتنت زي ما هو عندك - ما غيرتش فيه */}
                {tabValue === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayIcon color="primary" /> الوقت
                          </Typography>
                          <List disablePadding>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><DateRangeIcon color="action" /></ListItemIcon>
                              <ListItemText
                                primary="الأسبوع"
                                secondary={`${formatDate(selectedAchievement.startDate)} - ${formatDate(selectedAchievement.endDate)}`}
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><ScheduleIcon color="action" /></ListItemIcon>
                              <ListItemText
                                primary="تم الإنشاء"
                                secondary={selectedAchievement.createdAt ? format(new Date(selectedAchievement.createdAt), 'yyyy/MM/dd HH:mm') : '-'}
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><ScheduleIcon color="action" /></ListItemIcon>
                              <ListItemText
                                primary="آخر تحديث"
                                secondary={selectedAchievement.updatedAt ? format(new Date(selectedAchievement.updatedAt), 'yyyy/MM/dd HH:mm') : '-'}
                              />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BarChartIcon color="primary" /> الإحصائيات
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="h3" color="primary" sx={{ fontWeight: 800 }}>
                                  {selectedAchievement.itemCount || 0}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">إجمالي البنود</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="h3" color="success" sx={{ fontWeight: 800 }}>
                                  {selectedAchievement.completedItems || 0}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">بنود مكتملة</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                  نسبة الإنجاز: {calculateProgress(selectedAchievement)}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={calculateProgress(selectedAchievement)}
                                  sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 5,
                                      background: `linear-gradient(90deg, ${getProgressColor(calculateProgress(selectedAchievement))} 0%, ${alpha(getProgressColor(calculateProgress(selectedAchievement)), 0.8)} 100%)`
                                    }
                                  }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                      بنود الأسبوع ({selectedAchievement.items?.length || 0})
                    </Typography>

                    {selectedAchievement.items && selectedAchievement.items.length > 0 ? (
                      <Grid container spacing={3}>
                        {selectedAchievement.items.map((item, index) => (
                          <Grid item xs={12} key={item.id}>
                            <Card elevation={2} sx={{ borderRadius: 2 }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{
                                      bgcolor: getStatusBgColor(item.status),
                                      color: getStatusColor(item.status),
                                      width: 40,
                                      height: 40
                                    }}>
                                      {index + 1}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {item.title}
                                      </Typography>
                                      <Chip
                                        label={item.status}
                                        size="small"
                                        sx={{
                                          mt: 0.5,
                                          bgcolor: getStatusBgColor(item.status),
                                          color: getStatusColor(item.status),
                                          fontWeight: 600
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                  <Checkbox checked={item.completed || item.status === 'مكتمل'} disabled color="success" />
                                </Box>

                                {item.description && (
                                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                    {item.description}
                                  </Typography>
                                )}

                                {item.files && item.files.length > 0 && (
                                  <>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                      مرفقات البند ({item.files.length}):
                                    </Typography>
                                    <Grid container spacing={1}>
                                      {item.files.map((file) => (
                                        <Grid item xs={12} sm={6} md={4} key={file.id}>
                                          <Card
                                            variant="outlined"
                                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                                            onClick={() => {
                                              const u = resolveFileUrl(file.url || file.preview);
                                              if (u) window.open(u, '_blank');
                                            }}
                                          >
                                            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                              {getFileIcon(file.type)}
                                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                                  {file.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                  {(Number(file.size || 0) / 1024).toFixed(1)} KB
                                                </Typography>
                                              </Box>
                                            </CardContent>
                                          </Card>
                                        </Grid>
                                      ))}
                                    </Grid>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
                        <FolderOpenIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                          لا توجد بنود
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                      جميع المرفقات ({getTotalFiles(selectedAchievement)})
                    </Typography>

                    {getTotalFiles(selectedAchievement) > 0 ? (
                      <Grid container spacing={2}>
                        {selectedAchievement.items?.map((item) =>
                          item.files?.map((file) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                              <Card
                                elevation={2}
                                sx={{
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s',
                                  '&:hover': { transform: 'translateY(-4px)' }
                                }}
                                onClick={() => {
                                  const u = resolveFileUrl(file.url || file.preview);
                                  if (u) window.open(u, '_blank');
                                }}
                              >
                                {file.type?.startsWith('image/') ? (
                                  <CardMedia
                                    component="img"
                                    height="140"
                                    image={resolveFileUrl(file.url || file.preview)}
                                    alt={file.name}
                                    sx={{ objectFit: 'cover' }}
                                  />
                                ) : (
                                  <Box sx={{
                                    height: 140,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: alpha('#667eea', 0.1)
                                  }}>
                                    {getFileIcon(file.type)}
                                  </Box>
                                )}

                                <CardContent sx={{ p: 2 }}>
                                  <Typography variant="body2" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" display="block">
                                    {(Number(file.size || 0) / 1024).toFixed(1)} KB
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" display="block">
                                    من: {item.title}
                                  </Typography>
                                </CardContent>

                                <CardActions sx={{ p: 1, justifyContent: 'flex-end' }}>
                                  <IconButton size="small"><GetAppIcon fontSize="small" /></IconButton>
                                  <IconButton size="small"><ZoomInIcon fontSize="small" /></IconButton>
                                </CardActions>
                              </Card>
                            </Grid>
                          ))
                        )}
                      </Grid>
                    ) : (
                      <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
                        <AttachFileIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                          لا توجد مرفقات
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    معرف الإنجاز: {selectedAchievement.id}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {snackbar.message}
          </Typography>
        </Alert>
      </Snackbar>
    </Box></NavigationShell>
  );
};

export default AchievementsPage;
