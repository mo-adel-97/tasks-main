import * as uiLayout from './common/uiLayout';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  AvatarGroup,
  Badge,
  Toolbar,
  useMediaQuery,
  useTheme,
  GlobalStyles
} from "@mui/material";
import {
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CloudDownload as CloudDownloadIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  MenuRounded as MenuRoundedIcon
} from "@mui/icons-material";





// APIs
const NOTES_API = "https://filesregsiteration.sstli.com/erp/student_notes_api.php";
const FILE_BASE = "http://filesregsiteration.sstli.com/erp";
const USERS_API = "https://api1.sstli.com/api/userinfo";
const BRANCHES_API = "https://api1.sstli.com/api/branches/all";
const ADMIN_TOKEN = "PUT_ADMIN_TOKEN_HERE";

// الألوان
const theme = {
  primary: "#80b49e",
  primaryDark: "#6a9a87",
  secondary: "#5d7ca6",
  bg: "#f8fbfa",
  text: "#2c3e50",
  lightText: "#6c757d",
  border: "rgba(128,180,158,0.2)",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336"
};

// مكون Card للبيانات
function NoteCard({ note, usersMap, branchesMap }) {
  const uploaderGuid = String(note.uploader_guid || "").toLowerCase();
  const branchGuid = String(note.branch_guid || "").toLowerCase();
  
  const uploaderName = usersMap.get(uploaderGuid) || note.uploader_guid || "غير معروف";
  const branchName = branchesMap.get(branchGuid) || note.branch_guid || "غير معروف";
  const fileUrl = `${FILE_BASE}/${note.file_path}`;

  // استخراج امتداد الملف
  const fileExt = note.original_filename?.split('.').pop()?.toUpperCase() || "FILE";

  return (
    <Card 
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${theme.border}`,
        background: 'white',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px rgba(128,180,158,0.15)`,
          borderColor: theme.primary
        }
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { p: 1 },
          "@media (max-width:599px)": { p: 0.7 }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                    width: 30,
                    height: 30
                  },
                  "@media (max-width:599px)": {
                    width: 26,
                    height: 26
                  },
                  bgcolor: theme.primary,
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}
              >
                {fileExt.substring(0, 3)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 800,
                    color: theme.text,
                    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                      fontSize: "0.75rem"
                    },
                    "@media (max-width:599px)": {
                      fontSize: "0.75rem"
                    },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {note.original_filename}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.lightText }}>
                  {fileExt} • {new Date(note.created_at).toLocaleDateString('ar-SA')}
                </Typography>
              </Box>
            </Stack>

            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.text,
                mb: 2,
                lineHeight: 1.6,
                minHeight: 48,
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  mb: 0.7,
                  minHeight: 34,
                  fontSize: "0.75rem",
                  lineHeight: 1.45
                },
                "@media (max-width:599px)": {
                  mb: 0.55,
                  minHeight: 30,
                  fontSize: "0.75rem"
                },
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {note.note_text || "لا توجد ملاحظة"}
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon sx={{ fontSize: 16, color: theme.primary }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: theme.lightText, display: 'block' }}>
                      الرافع
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.text }}>
                      {uploaderName}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BusinessIcon sx={{ fontSize: 16, color: theme.secondary }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: theme.lightText, display: 'block' }}>
                      الفرع
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.text }}>
                      {branchName}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarIcon sx={{ fontSize: 16, color: theme.warning }} />
                  <Typography variant="caption" sx={{ color: theme.lightText }}>
                    {new Date(note.created_at).toLocaleDateString('ar-SA')}
                  </Typography>
                </Stack>
              </Grid>
              
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DescriptionIcon sx={{ fontSize: 16, color: theme.success }} />
                  <Typography variant="caption" sx={{ color: theme.lightText }}>
                    {fileExt}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </CardContent>
      
      <Divider />
      
      <CardActions
        sx={{
          p: 1.5,
          pt: 1,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            p: 0.65,
            pt: 0.55
          },
          "@media (max-width:599px)": {
            p: 0.5
          }
        }}
      >
        <Stack direction="row" spacing={1} sx={uiLayout.withUiSx({ width: '100%' }, uiLayout.actionBarSx)}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={() => window.open(fileUrl, "_blank", "noreferrer")}
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              borderColor: theme.border,
              color: theme.primary,
              fontWeight: 600,
              '&:hover': {
                borderColor: theme.primary,
                backgroundColor: 'rgba(128,180,158,0.08)'
              }
            }, uiLayout.buttonSx)}
          >
            فتح
          </Button>
          
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            component="a"
            href={fileUrl}
            download
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.primaryDark} 0%, #5a8875 100%)`,
                boxShadow: `0 4px 12px rgba(128,180,158,0.3)`
              }
            }, uiLayout.buttonSx)}
          >
            تحميل
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}

export default function AdminStudentNotes() {
  const muiTheme = useTheme();

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [usersMap, setUsersMap] = useState(new Map());
  const [branchesMap, setBranchesMap] = useState(new Map());
  const [branchesList, setBranchesList] = useState([]);

  // حالة الفلاتر
  const [filters, setFilters] = useState({
    search: "",
    branch: "all",
    uploader: "all",
    dateFrom: "",
    dateTo: ""
  });

  const isAdmin = useMemo(() => {
    const job = Number(user?.userJop);
    return [0, 1, 2, 3].includes(job);
  }, [user]);

  const fetchUsers = async () => {
    const res = await fetch(USERS_API, {
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    const m = new Map();
    (Array.isArray(data) ? data : []).forEach(u => {
      if (u?.guid) m.set(String(u.guid).toLowerCase(), u.fullName || u.userName || u.guid);
    });
    setUsersMap(m);
  };

  const fetchBranches = async () => {
    const res = await fetch(BRANCHES_API, {
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    const m = new Map();
    const list = [];
    
    (Array.isArray(data) ? data : []).forEach(b => {
      if (b?.guid) {
        const guid = String(b.guid).toLowerCase();
        m.set(guid, b.name || b.guid);
        list.push({
          guid: guid,
          name: b.name || b.guid,
          code: b.code,
          status: b.status
        });
      }
    });
    
    setBranchesMap(m);
    setBranchesList(list);
  };

  const fetchAllNotes = async () => {
    const url = ADMIN_TOKEN
      ? `${NOTES_API}?action=all&adminToken=${encodeURIComponent(ADMIN_TOKEN)}`
      : `${NOTES_API}?action=all`;

    const res = await fetch(url);
    const json = await res.json();
    if (!json.ok) throw new Error(json.message || "Failed to load notes");
    setRows(json.data || []);
  };

  const loadAll = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchBranches(), fetchAllNotes()]);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ في تحميل البيانات. الرجاء التحقق من الاتصال.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // فلترة البيانات
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // فلترة البحث النصي
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          (row.original_filename || "").toLowerCase().includes(searchLower) ||
          (row.note_text || "").toLowerCase().includes(searchLower) ||
          (usersMap.get(String(row.uploader_guid || "").toLowerCase()) || "").toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // فلترة الفرع
      if (filters.branch !== "all") {
        if (String(row.branch_guid || "").toLowerCase() !== filters.branch) return false;
      }

      // فلترة الرافع
      if (filters.uploader !== "all") {
        if (String(row.uploader_guid || "").toLowerCase() !== filters.uploader) return false;
      }

      // فلترة التاريخ
      if (filters.dateFrom) {
        const rowDate = new Date(row.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (rowDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const rowDate = new Date(row.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (rowDate > toDate) return false;
      }

      return true;
    });
  }, [rows, filters, usersMap]);

  // إحصائيات
  const stats = useMemo(() => {
    const total = rows.length;
    const branchesCount = new Set(rows.map(r => r.branch_guid)).size;
    const uploadersCount = new Set(rows.map(r => r.uploader_guid)).size;
    
    // آخر 7 أيام
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentCount = rows.filter(r => new Date(r.created_at) > oneWeekAgo).length;

    return { total, branchesCount, uploadersCount, recentCount };
  }, [rows]);

  const handleClearFilters = () => {
    setFilters({
      search: "",
      branch: "all",
      uploader: "all",
      dateFrom: "",
      dateTo: ""
    });
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3, fontFamily: "Cairo", direction: "rtl" }}>
        <Typography sx={{ fontWeight: 800, color: theme.error }}>
          غير مصرح لك بالدخول لهذه الصفحة.
        </Typography>
      </Box>
    );
  }

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        display: "flex",
        background: theme.bg,
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        direction: "rtl"
      }}
    >
      {!isDesktop && (
        <GlobalStyles
          styles={{
            ".MuiDrawer-root": {
              zIndex: "2100 !important"
            },
            ".MuiDrawer-root .MuiBackdrop-root": {
              zIndex: "2099 !important"
            },
            ".MuiDrawer-root .MuiDrawer-paper": {
              zIndex: "2101 !important"
            }
          }}
        />
      )}

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            zIndex: 1400,
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: theme.text,
            borderBottom: `1px solid ${theme.border}`,
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
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
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                color: "#fff",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 5px 14px rgba(5,117,70,.20)"
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
                fontWeight: 900,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem"
                },
                color: theme.text,
                textAlign: "start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              ملاحظات المتدربين
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          ml: 0,
          p: {
            xs: 0.5,
            sm: 0.8,
            md: 1
          },
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            p: 3,
            mt: 0
          },
          ...navigationContentSx
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.7 : isTablet ? 1 : 3,
            borderRadius: isPhone ? 1.5 : isTablet ? 2 : 4,
            border: `1px solid ${theme.border}`,
            background: 'white',
            mb: isPhone ? 0.65 : isTablet ? 0.9 : 3
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: theme.text,
                  mb: 0.5,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.88rem"
                      : undefined
                }}
              >
                📋 ملاحظات المتدربين
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={isPhone ? 0.45 : isTablet ? 0.65 : 2}
              alignItems="center"
              sx={uiLayout.withUiSx({
                "& .MuiButton-root": {
                  minHeight: isPhone ? 30 : isTablet ? 33 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                  px: isPhone ? 0.7 : isTablet ? 1 : undefined
                }
              }, uiLayout.actionBarSx)}
            >
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleClearFilters}
                disabled={Object.values(filters).every(v => !v || v === "all")}
                sx={uiLayout.withUiSx({
                  borderRadius: 2,
                  borderColor: theme.border,
                  color: theme.text,
                  fontWeight: 600
                }, uiLayout.buttonSx)}
              >
                إعادة الضبط
              </Button>
              
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadAll}
                sx={uiLayout.withUiSx({
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                  fontWeight: 700,
                  px: 3,
                  boxShadow: `0 6px 16px rgba(128,180,158,0.25)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.primaryDark} 0%, #5a8875 100%)`,
                    boxShadow: `0 8px 20px rgba(128,180,158,0.35)`
                  }
                }, uiLayout.buttonSx)}
              >
                تحديث البيانات
              </Button>
            </Stack>
          </Stack>

          {/* Stats Cards */}
          <Grid
            container
            spacing={isPhone ? 0.55 : isTablet ? 0.8 : 2}
            sx={{ mt: isPhone ? 0.7 : isTablet ? 1 : 3 }}
          >
            <Grid item xs={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: isPhone ? 0.6 : isTablet ? 0.85 : 2.5,
                  borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 3,
                  background: `linear-gradient(135deg, rgba(128,180,158,0.1) 0%, rgba(128,180,158,0.05) 100%)`,
                  border: `1px solid ${theme.border}`
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: theme.text }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.lightText }}>
                      إجمالي الملفات
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.primary }}>
                    <DescriptionIcon />
                  </Avatar>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: isPhone ? 0.6 : isTablet ? 0.85 : 2.5,
                  borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 3,
                  background: `linear-gradient(135deg, rgba(93,124,166,0.1) 0%, rgba(93,124,166,0.05) 100%)`,
                  border: `1px solid rgba(93,124,166,0.2)`
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: theme.text }}>
                      {stats.branchesCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.lightText }}>
                      عدد الفروع
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.secondary }}>
                    <BusinessIcon />
                  </Avatar>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: isPhone ? 0.6 : isTablet ? 0.85 : 2.5,
                  borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 3,
                  background: `linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)`,
                  border: `1px solid rgba(76,175,80,0.2)`
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: theme.text }}>
                      {stats.uploadersCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.lightText }}>
                      عدد الرافعين
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.success }}>
                    <PersonIcon />
                  </Avatar>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: isPhone ? 0.6 : isTablet ? 0.85 : 2.5,
                  borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 3,
                  background: `linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)`,
                  border: `1px solid rgba(255,152,0,0.2)`
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: theme.text }}>
                      {stats.recentCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.lightText }}>
                      آخر 7 أيام
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.warning }}>
                    <CalendarIcon />
                  </Avatar>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Filters Section */}
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.7 : isTablet ? 1 : 3,
            borderRadius: isPhone ? 1.5 : isTablet ? 2 : 4,
            border: `1px solid ${theme.border}`,
            background: 'white',
            mb: isPhone ? 0.65 : isTablet ? 0.9 : 3
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <FilterListIcon sx={{ color: theme.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.text }}>
              فلاتر البحث
            </Typography>
          </Stack>

          <Grid
            container
            spacing={isPhone ? 0.75 : isTablet ? 0.95 : 2}
          >
            <Grid item xs={12} md={4}>
              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                label="بحث في الملفات والملاحظات"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                size="small"
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }, uiLayout.formFieldSx)}
              />
            </Grid>
            
            <Grid sm={6} item xs={12} md={2}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                <InputLabel>الفرع</InputLabel>
                <Select
                  value={filters.branch}
                  onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                  label="الفرع"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">جميع الفروع</MenuItem>
                  {branchesList.map(branch => (
                    <MenuItem key={branch.guid} value={branch.guid}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid sm={6} item xs={12} md={2}>
              <TextField
                fullWidth
                label="من تاريخ"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Grid>
            
            <Grid sm={6} item xs={12} md={2}>
              <TextField
                fullWidth
                label="إلى تاريخ"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Grid>
          </Grid>
        </Paper>

        {/* Results Section */}
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.7 : isTablet ? 1 : 3,
            borderRadius: isPhone ? 1.5 : isTablet ? 2 : 4,
            border: `1px solid ${theme.border}`,
            background: 'white',
            minHeight: isPhone ? 300 : isTablet ? 340 : 400
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.text }}>
                الملفات المرفوعة
              </Typography>
              <Typography variant="body2" sx={{ color: theme.lightText }}>
                عرض {filteredRows.length} من {rows.length} ملف
              </Typography>
            </Box>
            
            <Chip
              label={`${filteredRows.length} نتيجة`}
              sx={{
                fontWeight: 800,
                background: `rgba(128,180,158,0.15)`,
                color: theme.primaryDark,
                border: `1px solid ${theme.border}`
              }}
            />
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Stack alignItems="center" spacing={2}>
                <CircularProgress size={40} sx={{ color: theme.primary }} />
                <Typography variant="body2" sx={{ color: theme.lightText }}>
                  جاري تحميل البيانات...
                </Typography>
              </Stack>
            </Box>
          ) : filteredRows.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CloudDownloadIcon sx={{ fontSize: 64, color: theme.border, mb: 2 }} />
              <Typography variant="h6" sx={{ color: theme.lightText, mb: 1 }}>
                لا توجد نتائج
              </Typography>
              <Typography variant="body2" sx={{ color: theme.lightText }}>
                جرب تغيير فلاتر البحث أو تأكد من وجود بيانات
              </Typography>
            </Box>
          ) : (
            <Grid
              container
              spacing={isPhone ? 0.75 : isTablet ? 1 : 3}
            >
              {filteredRows.map((note) => (
                <Grid item xs={12} sm={6} lg={4} key={note.id}>
                  <NoteCard 
                    note={note} 
                    usersMap={usersMap} 
                    branchesMap={branchesMap} 
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Box>
    </Box></NavigationShell>
  );
}