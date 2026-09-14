import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
// RegistrationCommissions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { arSA } from "date-fns/locale";
import { styled } from "@mui/material/styles";

// MUI
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  TextField,
  IconButton,
  Stack,
  Chip,
  Button,
  InputAdornment,
  Tooltip,
  Paper,
} from "@mui/material";

// Icons
import {
  AttachMoney as CommissionIcon,
  School as DiplomaIcon,
  MilitaryTech as MilitaryIcon,
  AssignmentReturned as ReturnIcon,
  Description as RegistrationIcon,
  Event as CalendarIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingIcon,
  Receipt as InvoiceIcon,
  People as UsersIcon,
  CheckCircleOutline,
  WarningAmber,
  VerifiedUser,
  AttachMoney,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Numbers,
  Paid,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
} from "@mui/icons-material";

// Pickers
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Custom


/* ===================== Config ===================== */
const API_BASE =
  import.meta?.env?.VITE_API_BASE?.replace(/\/+$/, "") ||
  "https://api1.sstli.com";

/* ===================== Color Palette ===================== */
const colorPalette = {
  primary: '#80b49e',
  primaryLight: '#a8c9bb',
  primaryDark: '#5a8f7a',
  primaryLighter: '#e1efe9',
  textDark: '#2d4a3e',
  textLight: '#5a7a6a',
  background: '#f8fbf9',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  secondary: '#9c27b0'
};

/* ===================== Styled ===================== */
const DashboardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: colorPalette.background,
  fontFamily: "'Tajawal', sans-serif",
  direction: "rtl",
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(4),
  transition: theme.transitions.create(["margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  [theme.breakpoints.down("lg")]: {
    marginRight: 0,
    padding: theme.spacing(3)
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2)
  },
  ...navigationContentSx
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: "0 6px 24px 0 rgba(128, 180, 158, 0.1)",
  transition: "all 0.25s ease",
  borderInlineStart: `5px solid ${colorPalette.primary}`,
  backgroundColor: 'white',
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 10px 28px 0 rgba(128, 180, 158, 0.15)",
  },
}));

const Panel = ({ children, color = "primary", icon, title, subtitle }) => {
  const getColor = (color) => {
    const colors = {
      primary: colorPalette.primary,
      success: colorPalette.success,
      warning: colorPalette.warning,
      error: colorPalette.error,
      info: colorPalette.info,
      secondary: colorPalette.secondary
    };
    return colors[color] || colorPalette.primary;
  };

  return (
    <StyledCard>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: `${getColor(color)}20`,
                color: getColor(color),
                display: "grid",
                placeItems: "center",
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: colorPalette.textDark }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" sx={{ color: colorPalette.textLight }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mb: 2, borderColor: colorPalette.primaryLighter }} />
        {children}
      </CardContent>
    </StyledCard>
  );
};

const StatCard = ({ title, value, icon, color, hint }) => {
  const getColor = (color) => {
    const colors = {
      primary: colorPalette.primary,
      success: colorPalette.success,
      warning: colorPalette.warning,
      error: colorPalette.error,
      info: colorPalette.info
    };
    return colors[color] || colorPalette.primary;
  };

  const colorValue = getColor(color);

  return (
    <StyledCard sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" sx={{ color: colorPalette.textLight }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: colorValue }}>
              {value}
            </Typography>
            {hint && (
              <Typography variant="caption" sx={{ color: colorPalette.textLight }}>
                {hint}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${colorValue}20`,
              color: colorValue,
              display: "grid",
              placeItems: "center",
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

const Row = ({ label, value, color, isCurrency }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
    <Typography variant="body2" sx={{ color: colorPalette.textLight }}>
      {label}
    </Typography>
    <Typography 
      variant="subtitle1" 
      fontWeight={600} 
      sx={{ color: color || colorPalette.textDark }}
    >
      {isCurrency ? `${Number(value || 0).toLocaleString()} ر.س` : Number(value ?? 0).toLocaleString()}
    </Typography>
  </Box>
);

/* ===================== Arabic Keys Map ===================== */
const K = {
  empName: "اسم الموظف",
  civil: "دبلوم مدني",
  civilNoContract: "بدون اتفاقية مدني",
  civilReturn: "مرتجع مدني",
  civilDeferred: "مرحل مدني",
  civilNet: "صافي مدني",
  civilCommission: "عمولة مدني",
  mil: "دبلوم عسكري",
  milNoContract: "بدون اتفاقية عسكري",
  milReturn: "مرتجع عسكري",
  milDeferred: "مرحل عسكري",
  milNet: "صافي عسكري",
  milCommission: "عمولة عسكري",
  qual: "دورة تأهيلية",
  qualReturn: "مرتجع تأهيلية",
  qualCommission: "عمولة تأهيلية",
  dev: "دورة تطويرية",
  devReturn: "مرتجع تطويرية",
  devCommission: "عمولة تطويرية",
  total: "اجمالي التسجيل",
};

/* ===================== Component ===================== */
const RegistrationCommissions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  const [data, setData] = useState(null); // row object (first record)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // extract userGuid (SellerGuid) from localStorage if exists
  const userGuid = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      // عندك أكتر من احتمال: SellerGuid / sellerGuid / Guid
      return (
        user?.SellerGuid ||
        user?.sellerGuid ||
        user?.Guid ||
        "6534bd86-aa89-4c8f-ac95-8f27be7a08ae"
      );
    } catch {
      return "6534bd86-aa89-4c8f-ac95-8f27be7a08ae";
    }
  }, []);

  const fetchData = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({
        regStartDate: format(startDate, "yyyy-MM-dd"),
        regEndDate: format(endDate, "yyyy-MM-dd"),
        userGuid, // يطابق @UserGuid في الـ SP الجديدة
      }).toString();

      const url = `${API_BASE}/api/UserInfo/sales-report?${qs}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("لا توجد بيانات للمعايير المحددة.");
      const json = await res.json();

      if (!Array.isArray(json) || json.length === 0) {
        setData(null);
        setErr("لا توجد بيانات للفترة المحددة.");
        return;
      }

      // أول صف (بما إنك بتعرض موظف واحد/Guid واحد)
      setData(json[0]);
    } catch (e) {
      setErr(e.message || "خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  /* ====== Derived Metrics for UI Cards ====== */
  const totals = useMemo(() => {
    if (!data) return null;
    const civil = Number(data[K.civil] || 0);
    const mil = Number(data[K.mil] || 0);
    const totalDiplomas = civil + mil;

    const returns =
      Number(data[K.civilReturn] || 0) + Number(data[K.milReturn] || 0);

    const totalCommission =
      Number(data[K.civilCommission] || 0) +
      Number(data[K.milCommission] || 0) +
      Number(data[K.qualCommission] || 0) +
      Number(data[K.devCommission] || 0);

    const totalRegistrations = Number(data[K.total] || 0);

    return {
      totalRegistrations,
      totalDiplomas,
      returns,
      totalCommission,
    };
  }, [data]);

  /* ===================== UI ===================== */
  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          height: "100vh",
          bgcolor: colorPalette.background,
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: colorPalette.primary }} />
      </Box>
    );
  }

  return (
    <NavigationShell variant="standard" ><LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arSA}>
      <DashboardContainer>
        
        <ContentContainer sx={{mb:3}}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: colorPalette.textDark }}>
                لوحة العمولات والإحصائيات
              </Typography>
              <Typography variant="body2" sx={{ color: colorPalette.textLight }}>
                نظرة مركزة على أداء التسجيلات وحساب العمولات للفترة المحددة
              </Typography>
            </Box>

            {/* Filters */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${colorPalette.primaryLighter}`,
                bgcolor: "white",
                minWidth: isMobile ? "100%" : 520,
              }}
            >
              <Stack
                direction={isMobile ? "column" : "row"}
                gap={1.5}
                alignItems="center"
              >
                <DatePicker
                  label="تاريخ البداية"
                  value={startDate}
                  onChange={(v) => setStartDate(v)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" sx={{ color: colorPalette.primary }} />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
                <DatePicker
                  label="تاريخ النهاية"
                  value={endDate}
                  onChange={(v) => setEndDate(v)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" sx={{ color: colorPalette.primary }} />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />

                <Tooltip title="تحديث البيانات">
                  <span>
                    <IconButton
                      sx={{ 
                        color: colorPalette.primary,
                        border: `1px solid ${colorPalette.primaryLighter}`,
                        '&:hover': {
                          backgroundColor: colorPalette.primaryLighter
                        }
                      }}
                      onClick={fetchData}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>

              {/* Quick Range */}
              <Stack direction="row" gap={1} mt={1.5} flexWrap="wrap">
                <Chip
                  icon={<FilterIcon sx={{ color: colorPalette.primary }} />}
                  label="الشهر الحالي"
                  onClick={() => {
                    setStartDate(startOfMonth(new Date()));
                    setEndDate(endOfMonth(new Date()));
                  }}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: colorPalette.primaryLight,
                    color: colorPalette.primary,
                    '&:hover': {
                      backgroundColor: colorPalette.primaryLighter
                    }
                  }}
                />
                <Chip
                  icon={<DateRangeIcon sx={{ color: colorPalette.textLight }} />}
                  label={
                    startDate && endDate
                      ? `${format(startDate, "yyyy/MM/dd")} - ${format(
                          endDate,
                          "yyyy/MM/dd"
                        )}`
                      : "—"
                  }
                  size="small"
                  sx={{ 
                    borderColor: colorPalette.primaryLighter,
                    color: colorPalette.textDark
                  }}
                />
              </Stack>
            </Paper>
          </Box>

          {/* Error */}
          {err && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {err}
            </Alert>
          )}

          {/* Empty State */}
          {!data && !err && (
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                height: "40vh",
                textAlign: "center",
                bgcolor: colorPalette.background,
                borderRadius: 2
              }}
            >
              <Typography variant="h6" sx={{ color: colorPalette.textLight }}>
                اختر نطاق التاريخ ثم اضغط تحديث لعرض البيانات.
              </Typography>
            </Box>
          )}

          {/* Content */}
          {data && totals && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="إجمالي التسجيلات"
                    value={totals.totalRegistrations.toLocaleString()}
                    icon={<RegistrationIcon />}
                    color="primary"
                    hint={data[K.empName]}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="إجمالي الدبلومات"
                    value={totals.totalDiplomas.toLocaleString()}
                    icon={<DiplomaIcon />}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="إجمالي المرتجعات"
                    value={totals.returns.toLocaleString()}
                    icon={<ReturnIcon />}
                    color="error"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="إجمالي العمولة"
                    value={`${totals.totalCommission.toLocaleString()} ر.س`}
                    icon={<CommissionIcon />}
                    color="warning"
                  />
                </Grid>
              </Grid>

              {/* Civil & Military */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Civil */}
                <Grid item xs={12} md={6}>
                  <Panel
                    color="info"
                    icon={<DiplomaIcon />}
                    title="الدبلومات المدنية"
                    subtitle="تفاصيل المدني"
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Row label="الإجمالي" value={data[K.civil]} />
                        <Row
                          label="المرتجعات"
                          value={data[K.civilReturn]}
                          color={colorPalette.error}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Row label="بدون اتفاقية" value={data[K.civilNoContract]} />
                        <Row
                          label="الصافي"
                          value={data[K.civilNet]}
                          color={colorPalette.success}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                        <Row
                          label="العمولة"
                          value={data[K.civilCommission]}
                          color={colorPalette.primary}
                          isCurrency
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: 2,
                            borderColor: colorPalette.primaryLighter,
                            bgcolor: colorPalette.primaryLighter
                          }}
                        >
                          <Typography variant="body2" sx={{ color: colorPalette.textLight }}>
                            المرحلة (مرحل مدني)
                          </Typography>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: colorPalette.textDark }}>
                            {Number(data[K.civilDeferred] || 0).toLocaleString()}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Panel>
                </Grid>

                {/* Military */}
                <Grid item xs={12} md={6}>
                  <Panel
                    color="warning"
                    icon={<MilitaryIcon />}
                    title="الدبلومات العسكرية"
                    subtitle="تفاصيل العسكري"
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Row label="الإجمالي" value={data[K.mil]} />
                        <Row
                          label="المرتجعات"
                          value={data[K.milReturn]}
                          color={colorPalette.error}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Row label="بدون اتفاقية" value={data[K.milNoContract]} />
                        <Row
                          label="الصافي"
                          value={data[K.milNet]}
                          color={colorPalette.success}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                        <Row
                          label="العمولة"
                          value={data[K.milCommission]}
                          color={colorPalette.primary}
                          isCurrency
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: 2,
                            borderColor: colorPalette.primaryLighter,
                            bgcolor: colorPalette.primaryLighter
                          }}
                        >
                          <Typography variant="body2" sx={{ color: colorPalette.textLight }}>
                            المرحلة (مرحل عسكري)
                          </Typography>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: colorPalette.textDark }}>
                            {Number(data[K.milDeferred] || 0).toLocaleString()}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Panel>
                </Grid>
              </Grid>

              {/* Courses */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Panel
                    color="success"
                    icon={<TrendingUpIcon />}
                    title="الدورات التأهيلية"
                    subtitle="عدد وعمولة"
                  >
                    <Row label="عدد الدورات" value={data[K.qual]} />
                    <Row
                      label="المرتجع"
                      value={data[K.qualReturn]}
                      color={colorPalette.error}
                    />
                    <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                    <Row
                      label="العمولة"
                      value={data[K.qualCommission]}
                      color={colorPalette.primary}
                      isCurrency
                    />
                  </Panel>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Panel
                    color="secondary"
                    icon={<GroupsIcon />}
                    title="الدورات التطويرية"
                    subtitle="عدد وعمولة"
                  >
                    <Row label="عدد الدورات" value={data[K.dev]} />
                    <Row
                      label="المرتجع"
                      value={data[K.devReturn]}
                      color={colorPalette.error}
                    />
                    <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                    <Row
                      label="العمولة"
                      value={data[K.devCommission]}
                      color={colorPalette.primary}
                      isCurrency
                    />
                  </Panel>
                </Grid>
              </Grid>
            </>
          )}
        </ContentContainer>
      </DashboardContainer>
    </LocalizationProvider></NavigationShell>
  );
};

export default RegistrationCommissions;