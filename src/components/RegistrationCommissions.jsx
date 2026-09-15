import * as uiLayout from './common/uiLayout';
import PageContainer from './common/PageContainer';
import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
// RegistrationCommissions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { arSA } from "date-fns/locale";
import { styled } from "@mui/material/styles";

// MUI
import {
  AppBar,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  GlobalStyles,
  useTheme,
  useMediaQuery,
  IconButton,
  Stack,
  Toolbar,
  Chip,
  InputAdornment,
  Tooltip,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Badge,
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
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  RemoveCircleOutline as DiscountIcon,
  AddCircleOutline as BonusIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  SwapHoriz as SwapIcon,
  MenuRounded as MenuRoundedIcon,
} from "@mui/icons-material";

// Pickers
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Custom


/* ===================== Config ===================== */
const API_BASE =
  import.meta?.env?.VITE_API_BASE?.replace(/\/+$/, "") || "https://api1.sstli.com";




/* ===================== Color Palette ===================== */
const colorPalette = {
  primary: "#80b49e",
  primaryLight: "#a8c9bb",
  primaryDark: "#5a8f7a",
  primaryLighter: "#e1efe9",
  textDark: "#2d4a3e",
  textLight: "#5a7a6a",
  background: "#f8fbf9",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  secondary: "#9c27b0",
};

/* ===================== Styled ===================== */
const DashboardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  minHeight: "100dvh",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
  backgroundColor: colorPalette.background,
  fontFamily: "'Tajawal', sans-serif",
  direction: "rtl",
}));

const ContentContainer = styled(PageContainer)(() => ({
  flex: 1,
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  overflowX: "hidden"
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,

  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
    borderRadius: 11,
  },

  "@media (max-width:599px)": {
    borderRadius: 9,
  },
  boxShadow: "0 6px 24px 0 rgba(128, 180, 158, 0.1)",
  transition: "all 0.25s ease",
  borderInlineStart: `5px solid ${colorPalette.primary}`,
  backgroundColor: "white",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 10px 28px 0 rgba(128, 180, 158, 0.15)",
  },
}));

const Panel = ({ children, color = "primary", icon, title, subtitle, actions }) => {
  const getColor = (c) => {
    const colors = {
      primary: colorPalette.primary,
      success: colorPalette.success,
      warning: colorPalette.warning,
      error: colorPalette.error,
      info: colorPalette.info,
      secondary: colorPalette.secondary,
    };
    return colors[c] || colorPalette.primary;
  };

  return (
    <StyledCard>
      <CardContent
        sx={{
          p: 3,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { p: 1.1 },
          "@media (max-width:599px)": { p: 0.75 }
        }}
      >
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
          gap={2}
          sx={{
            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { mb: 0.75, gap: 0.7 },
            "@media (max-width:599px)": { mb: 0.5, gap: 0.45 }
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  width: 30,
                  height: 30
                },
                "@media (max-width:599px)": {
                  width: 26,
                  height: 26
                },
                borderRadius: 2,
                bgcolor: `${getColor(color)}20`,
                color: getColor(color),
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: colorPalette.textDark,
                  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
                  "@media (max-width:599px)": { fontSize: "0.75rem" }
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: colorPalette.textLight,
                    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
                    "@media (max-width:599px)": { fontSize: "0.75rem" }
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {actions ? <Box>{actions}</Box> : null}
        </Box>

        <Divider
          sx={{
            mb: 2,
            borderColor: colorPalette.primaryLighter,
            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { mb: 0.65 }
          }}
        />
        {children}
      </CardContent>
    </StyledCard>
  );
};

const StatCard = ({ title, value, icon, color, hint }) => {
  const getColor = (c) => {
    const colors = {
      primary: colorPalette.primary,
      success: colorPalette.success,
      warning: colorPalette.warning,
      error: colorPalette.error,
      info: colorPalette.info,
    };
    return colors[c] || colorPalette.primary;
  };

  const colorValue = getColor(color);

  return (
    <StyledCard sx={{ height: "100%" }}>
      <CardContent
        sx={{
          p: 2.5,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { p: 0.85 },
          "@media (max-width:599px)": { p: 0.6 }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: colorPalette.textLight,
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
                "@media (max-width:599px)": { fontSize: "0.75rem" }
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                color: colorValue,
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "1rem" },
                "@media (max-width:599px)": { fontSize: "0.82rem" }
              }}
            >
              {value}
            </Typography>
            {hint && (
              <Typography
                variant="caption"
                sx={{
                  color: colorPalette.textLight,
                  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
                  "@media (max-width:599px)": { fontSize: "0.75rem" }
                }}
              >
                {hint}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                width: 31,
                height: 31
              },
              "@media (max-width:599px)": {
                width: 27,
                height: 27
              },
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
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    py={0.5}
    sx={{
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { py: 0.2, gap: 0.5 },
      "@media (max-width:599px)": { py: 0.15 }
    }}
  >
    <Typography
      variant="body2"
      sx={{
        color: colorPalette.textLight,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="subtitle1"
      fontWeight={600}
      sx={{
        color: color || colorPalette.textDark,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {isCurrency ? `${Number(value || 0).toLocaleString()} ر.س` : Number(value ?? 0).toLocaleString()}
    </Typography>
  </Box>
);

const MiniStat = ({ label, value, icon, tone = "neutral" }) => {
  const tones = {
    neutral: { fg: colorPalette.textDark, bg: "#ffffff" },
    discount: { fg: colorPalette.error, bg: "rgba(244,67,54,0.08)" },
    bonus: { fg: colorPalette.success, bg: "rgba(76,175,80,0.10)" },
  };
  const t = tones[tone] || tones.neutral;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.2,
        borderRadius: 2,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          p: 0.55,
          borderRadius: 1.4
        },
        "@media (max-width:599px)": {
          p: 0.4,
          borderRadius: 1.2
        },
        borderColor: colorPalette.primaryLighter,
        bgcolor: t.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Box
          sx={{
            width: 32,
            height: 32,
            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
              width: 24,
              height: 24
            },
            "@media (max-width:599px)": {
              width: 21,
              height: 21
            },
            borderRadius: 2,
            bgcolor: "rgba(128, 180, 158, 0.15)",
            color: colorPalette.primaryDark,
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: colorPalette.textLight,
            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
            "@media (max-width:599px)": { fontSize: "0.75rem" }
          }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        variant="subtitle1"
        fontWeight={800}
        sx={{
          color: t.fg,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
          "@media (max-width:599px)": { fontSize: "0.75rem" }
        }}
      >
        {Number(value ?? 0).toLocaleString()}
      </Typography>
    </Paper>
  );
};

/* ===================== Arabic Keys Map ===================== */
const K = {
  empName: "اسم الموظف",

  civil: "دبلوم مدني",
  civilNoContract: "بدون اتفاقية مدني",
  civilReturn: "مرتجع مدني",
  civilNet: "صافي مدني",
  civilCommission: "عمولة مدني",

  civilSharedDiscount: "مشترك مدني (خصم)",
  civilSharedBonus: "مشترك مدني (إضافة)",

  mil: "دبلوم عسكري",
  milNoContract: "بدون اتفاقية عسكري",
  milReturn: "مرتجع عسكري",
  milNet: "صافي عسكري",
  milCommission: "عمولة عسكري",

  milSharedDiscount: "مشترك عسكري (خصم)",
  milSharedBonus: "مشترك عسكري (إضافة)",

  qual: "دورة تأهيلية",
  qualReturn: "مرتجع تأهيلية",
  qualCommission: "عمولة تأهيلية",

  dev: "دورة تطويرية",
  devReturn: "مرتجع تطويرية",
  devCommission: "عمولة تطويرية",

  total: "اجمالي التسجيل",
};

/* ===================== Helpers ===================== */
const safeStr = (v) => (v == null ? "" : String(v));
const normalizeName = (v) =>
  safeStr(v).trim().toLowerCase().replace(/\s+/g, " ");

const isHamzaName = (name) => {
  const n = normalizeName(name);
  return n === "hamza" || n === "حمزة";
};

const zeroizeForHamza = (row) => {
  if (!row) return row;
  if (!isHamzaName(row?.[K.empName])) return row;

  return {
    ...row,
    [K.civil]: 0,
    [K.civilNoContract]: 0,
    [K.civilReturn]: 0,
    [K.civilNet]: 0,
    [K.civilSharedDiscount]: 0,
    [K.civilSharedBonus]: 0,
    [K.civilCommission]: 0,

    [K.mil]: 0,
    [K.milNoContract]: 0,
    [K.milReturn]: 0,
    [K.milNet]: 0,
    [K.milSharedDiscount]: 0,
    [K.milSharedBonus]: 0,
    [K.milCommission]: 0,

    [K.qual]: 0,
    [K.qualReturn]: 0,
    [K.qualCommission]: 0,

    [K.dev]: 0,
    [K.devReturn]: 0,
    [K.devCommission]: 0,

    [K.total]: 0,
  };
};

const normalizeEffect = (v) => {
  const s = safeStr(v).trim();
  // نتعامل مع أي اختلاف في الهمزة/الكتابة
  if (s.includes("خصم")) return "خصم";
  if (s.includes("إضافة") || s.includes("اضافة") || s.includes("إضافه")) return "إضافة";
  return s || "-";
};
const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    // عرض لطيف بدون تعقيد
    return `${format(d, "yyyy/MM/dd")} - ${format(d, "HH:mm")}`;
  } catch {
    return safeStr(iso);
  }
};

/* ===================== Component ===================== */
const RegistrationCommissions = () => {
  const theme = useTheme();

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

  const isCompact = isPhone || isTablet;
  const isMobile = isCompact;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Dialog state
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsErr, setDetailsErr] = useState(null);
  const [sharedDetails, setSharedDetails] = useState([]);

  // Dialog filters
  const [tab, setTab] = useState(0); // 0=الكل,1=خصم,2=إضافة
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const userGuid = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.SellerGuid || user?.sellerGuid || user?.Guid || "6534bd86-aa89-4c8f-ac95-8f27be7a08ae";
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
        userGuid,
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

setData(zeroizeForHamza(json[0]));
    } catch (e) {
      setErr(e?.message || "خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedDetails = async () => {
    setDetailsLoading(true);
    setDetailsErr(null);

    try {
      const qs = new URLSearchParams({
        regStartDate: format(startDate, "yyyy-MM-dd"),
        regEndDate: format(endDate, "yyyy-MM-dd"),
        sellerGuid: userGuid,
      }).toString();

      const url = `${API_BASE}/api/UserInfo/shared-details?${qs}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("فشل تحميل تفاصيل الخصم/الإضافة.");

      const json = await res.json();
      if (isHamzaName(data?.[K.empName])) {
  setSharedDetails([]);
  return;
}

      setSharedDetails(Array.isArray(json) ? json : []);
    } catch (e) {
      setSharedDetails([]);
      setDetailsErr(e?.message || "خطأ غير متوقع.");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const totals = useMemo(() => {
    if (!data) return null;

    const civil = Number(data[K.civil] || 0);
    const mil = Number(data[K.mil] || 0);
    const totalDiplomas = civil + mil;

    const returns = Number(data[K.civilReturn] || 0) + Number(data[K.milReturn] || 0);

    const totalCommission =
      Number(data[K.civilCommission] || 0) +
      Number(data[K.milCommission] || 0) +
      Number(data[K.qualCommission] || 0) +
      Number(data[K.devCommission] || 0);

    const totalRegistrations = Number(data[K.total] || 0);

    const sharedDiscount = Number(data[K.civilSharedDiscount] || 0) + Number(data[K.milSharedDiscount] || 0);
    const sharedBonus = Number(data[K.civilSharedBonus] || 0) + Number(data[K.milSharedBonus] || 0);

    return { totalRegistrations, totalDiplomas, returns, totalCommission, sharedDiscount, sharedBonus };
  }, [data]);

  // Counters for dialog chips/tabs
  const detailsCounts = useMemo(() => {
    const rows = sharedDetails || [];
    let discount = 0;
    let bonus = 0;
    for (const r of rows) {
      const eff = normalizeEffect(r?.Effect);
      if (eff === "خصم") discount++;
      else if (eff === "إضافة") bonus++;
    }
    return { total: rows.length, discount, bonus };
  }, [sharedDetails]);

  const filteredDetails = useMemo(() => {
    let rows = (sharedDetails || []).map((r) => ({
      StudentName: r?.StudentName,
      NationalId: r?.NationalId,
      RegDate: r?.RegDate,
      StudentSeller: r?.StudentSeller,
      FormSeller: r?.FormSeller,
      Effect: normalizeEffect(r?.Effect),
    }));

    if (tab === 1) rows = rows.filter((x) => x.Effect === "خصم");
    if (tab === 2) rows = rows.filter((x) => x.Effect === "إضافة");

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((x) => {
        return (
          safeStr(x.StudentName).toLowerCase().includes(q) ||
          safeStr(x.NationalId).toLowerCase().includes(q) ||
          safeStr(x.StudentSeller).toLowerCase().includes(q) ||
          safeStr(x.FormSeller).toLowerCase().includes(q)
        );
      });
    }

    // ترتيب: الأحدث فوق
    rows.sort((a, b) => new Date(b.RegDate).getTime() - new Date(a.RegDate).getTime());
    return rows;
  }, [sharedDetails, tab, search]);

  const openDetailsDialog = async () => {
    setOpenDetails(true);
    setTab(0);
    setSearch("");
    // load on open
    await fetchSharedDetails();
  };

  const closeDetailsDialog = () => {
    setOpenDetails(false);
    setDetailsErr(null);
  };

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arSA}>
      <DashboardContainer>
        {!isDesktop && (
          <GlobalStyles
            styles={{
              ".MuiDrawer-root, .MuiModal-root.MuiDrawer-root": {
                zIndex: "2100 !important"
              },
              ".MuiDrawer-root .MuiBackdrop-root, .MuiModal-root.MuiDrawer-root .MuiBackdrop-root": {
                zIndex: "2099 !important"
              },
              ".MuiDrawer-root .MuiDrawer-paper, .MuiModal-root.MuiDrawer-root .MuiDrawer-paper": {
                zIndex: "2101 !important",
                position: "fixed !important"
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
              zIndex: 1100,
              background: "rgba(255,255,255,.97)",
              backdropFilter: "blur(14px)",
              color: colorPalette.textDark,
              borderBottom: `1px solid ${colorPalette.primaryLighter}`,
              direction: "rtl"
            }}
          >
            <Toolbar
              sx={{
                direction: "rtl",
                minHeight: {
                  xs: "var(--app-header-height, 56px)",
                  sm: "var(--app-header-height, 56px)",
                  md: "var(--app-header-height, 56px)"
                },
                px: {
                  xs: 0.75,
                  sm: 1,
                  md: 1.25
                },
                gap: {
                  xs: 0.75,
                  sm: 1
                }
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
                aria-label={
                  mobileSidebarOpen
                    ? "إغلاق القائمة"
                    : "فتح القائمة"
                }
                aria-expanded={mobileSidebarOpen}
                sx={{
                  width: {
                    xs: 36,
                    sm: 40
                  },
                  height: {
                    xs: 36,
                    sm: 40
                  },
                  flexShrink: 0,
                  color: "#fff",
                  background:
                    "linear-gradient(135deg,#057546,#034d31)",
                  boxShadow:
                    "0 5px 14px rgba(5,117,70,.20)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg,#034d31,#057546)"
                  }
                }}
              >
                <MenuRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 20,
                      sm: 22
                    }
                  }}
                />
              </IconButton>

              <Typography
                sx={{
                  flex: 1,
                  fontFamily: "Tajawal",
                  fontWeight: 900,
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.8rem"
                  },
                  color: colorPalette.textDark,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "start"
                }}
              >
                العمولات والإحصائيات
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        

        <ContentContainer
          component="main"
          sx={{
            mt: isDesktop ? 0 : "var(--app-header-height, 56px)"
          }}
        >
          {loading && (
            <Box
              sx={{
                position: "fixed",
                inset: 0,
                top: isDesktop
                  ? 0
                  : "var(--app-header-height, 56px)",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(248,251,249,.88)",
                backdropFilter: "blur(2px)",
                zIndex: 1050,
                pointerEvents: "none"
              }}
            >
              <CircularProgress
                size={isPhone ? 30 : isTablet ? 36 : 52}
                thickness={4}
                sx={{ color: colorPalette.primary }}
              />
            </Box>
          )}

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isCompact ? "column" : "row",
              alignItems: isCompact ? "stretch" : "center",
              justifyContent: "space-between",
              gap: isPhone ? 0.6 : isTablet ? 0.9 : 2,
              mb: isPhone ? 0.7 : isTablet ? 1 : 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  color: colorPalette.textDark,
                  fontSize: isPhone ? "0.85rem" : isTablet ? "1rem" : undefined
                }}
              >
                لوحة العمولات والإحصائيات
              </Typography>
            </Box>

            {/* Filters */}
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.55 : isTablet ? 0.8 : 2,
                borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 2,
                border: `1px solid ${colorPalette.primaryLighter}`,
                bgcolor: "white",
                minWidth: isCompact ? "100%" : 560,
              }}
            >
              <Box
                sx={uiLayout.withUiSx({
                  display: isCompact ? "grid" : "flex",
                  gridTemplateColumns: isCompact
                    ? "repeat(2,minmax(0,1fr))"
                    : undefined,
                  gap: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
                  alignItems: "center"
                }, uiLayout.formSectionSx)}
              >
                <DatePicker
                  label="تاريخ البداية"
                  value={startDate}
                  onChange={(v) => setStartDate(v)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        "& .MuiInputLabel-root": {
                          fontSize: isPhone ? "0.42rem" : isTablet ? "0.5rem" : undefined
                        },
                        "& .MuiInputBase-input": {
                          fontSize: isPhone ? "0.46rem" : isTablet ? "0.54rem" : undefined,
                          py: isPhone ? 0.45 : isTablet ? 0.55 : undefined
                        },
                        "& .MuiOutlinedInput-root": {
                          minHeight: isPhone ? 31 : isTablet ? 34 : undefined
                        },
                        "& .MuiSvgIcon-root": {
                          fontSize: isPhone ? 15 : isTablet ? 17 : undefined
                        }
                      },
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
                      sx: {
                        "& .MuiInputLabel-root": {
                          fontSize: isPhone ? "0.42rem" : isTablet ? "0.5rem" : undefined
                        },
                        "& .MuiInputBase-input": {
                          fontSize: isPhone ? "0.46rem" : isTablet ? "0.54rem" : undefined,
                          py: isPhone ? 0.45 : isTablet ? 0.55 : undefined
                        },
                        "& .MuiOutlinedInput-root": {
                          minHeight: isPhone ? 31 : isTablet ? 34 : undefined
                        },
                        "& .MuiSvgIcon-root": {
                          fontSize: isPhone ? 15 : isTablet ? 17 : undefined
                        }
                      },
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
                        width: isPhone ? 31 : isTablet ? 34 : undefined,
                        height: isPhone ? 31 : isTablet ? 34 : undefined,
                        "&:hover": { backgroundColor: colorPalette.primaryLighter },
                      }}
                      onClick={fetchData}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="عرض تفاصيل الخصم/الإضافة">
                  <span>
                    <Button
                      onClick={openDetailsDialog}
                      startIcon={<ViewIcon />}
                      variant="contained"
                      sx={uiLayout.withUiSx({
                        bgcolor: colorPalette.primary,
                        "&:hover": { bgcolor: colorPalette.primaryDark },
                        borderRadius: isCompact ? 1.2 : 2,
                        whiteSpace: "nowrap",
                        gridColumn: isCompact ? "1 / -1" : undefined,
                        minHeight: isPhone ? 31 : isTablet ? 34 : undefined,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      }, uiLayout.buttonSx)}
                      disabled={!startDate || !endDate}
                    >
                      عرض التفاصيل
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              {/* Quick Range */}
              <Stack
                direction="row"
                gap={isPhone ? 0.45 : isTablet ? 0.65 : 1}
                mt={isPhone ? 0.6 : isTablet ? 0.8 : 1.5}
                flexWrap="wrap"
                alignItems="center"
                sx={{
                  "& .MuiChip-root": {
                    height: isPhone ? 24 : isTablet ? 27 : undefined,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  },
                  "& .MuiChip-icon": {
                    fontSize: isPhone ? 14 : isTablet ? 16 : undefined
                  }
                }}
              >
                <Chip
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
                    "&:hover": { backgroundColor: colorPalette.primaryLighter },
                  }}
                />
                <Chip
                  label={
                    startDate && endDate
                      ? `${format(startDate, "yyyy/MM/dd")} - ${format(endDate, "yyyy/MM/dd")}`
                      : "—"
                  }
                  size="small"
                  sx={{ borderColor: colorPalette.primaryLighter, color: colorPalette.textDark }}
                />

                {/* quick counters (optional) */}
                {data && totals && (
                  <>
                    <Chip
                      icon={<DiscountIcon sx={{ color: colorPalette.error }} />}
                      label={`خصم: ${totals.sharedDiscount.toLocaleString()}`}
                      size="small"
                      sx={{ bgcolor: "rgba(244,67,54,0.08)", borderColor: "rgba(244,67,54,0.25)" }}
                      variant="outlined"
                    />
                    <Chip
                      icon={<BonusIcon sx={{ color: colorPalette.success }} />}
                      label={`إضافة: ${totals.sharedBonus.toLocaleString()}`}
                      size="small"
                      sx={{ bgcolor: "rgba(76,175,80,0.10)", borderColor: "rgba(76,175,80,0.25)" }}
                      variant="outlined"
                    />
                  </>
                )}
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
            <Box sx={{ display: "grid", placeItems: "center", height: "40vh", textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: colorPalette.textLight }}>
                اختر نطاق التاريخ ثم اضغط تحديث لعرض البيانات.
              </Typography>
            </Box>
          )}

          {/* Content */}
          {data && totals && (
            <>
              {/* Summary Cards */}
              <Grid
                container
                spacing={isPhone ? 0.55 : isTablet ? 0.8 : 2}
                sx={{ mb: isPhone ? 0.75 : isTablet ? 1 : 3 }}
              >
                <Grid item xs={6} sm={3} md={3}>
                  <StatCard
                    title="إجمالي التسجيل"
                    value={totals.totalRegistrations.toLocaleString()}
                    icon={<RegistrationIcon />}
                    color="primary"
                    hint={data[K.empName]}
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={3}>
                  <StatCard
                    title="إجمالي الدبلومات"
                    value={totals.totalDiplomas.toLocaleString()}
                    icon={<DiplomaIcon />}
                    color="success"
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={3}>
                  <StatCard
                    title="إجمالي المرتجعات"
                    value={totals.returns.toLocaleString()}
                    icon={<ReturnIcon />}
                    color="error"
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={3}>
                  <StatCard
                    title="إجمالي العمولة"
                    value={`${totals.totalCommission.toLocaleString()} ر.س`}
                    icon={<CommissionIcon />}
                    color="warning"
                  />
                </Grid>
              </Grid>

              {/* Civil & Military */}
              <Grid
                container
                spacing={isPhone ? 0.65 : isTablet ? 0.9 : 2}
                sx={{ mb: isPhone ? 0.75 : isTablet ? 1 : 3 }}
              >
                {/* Civil */}
                <Grid item xs={12} md={6}>
                  <Panel
                    color="info"
                    icon={<DiplomaIcon />}
                    title="الدبلومات المدنية"
                    subtitle="تفاصيل المدني + المشترك"
                  >
                    <Grid container spacing={isPhone ? 0.6 : isTablet ? 0.8 : 2}>
                      <Grid item xs={6}>
                        <Row label="الإجمالي" value={data[K.civil]} />
                        <Row label="المرتجعات" value={data[K.civilReturn]} color={colorPalette.error} />
                      </Grid>

                      <Grid item xs={6}>
                        <Row label="بدون اتفاقية" value={data[K.civilNoContract]} />
                        <Row label="الصافي" value={data[K.civilNet]} color={colorPalette.success} />
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                        <Typography variant="subtitle2" sx={{ color: colorPalette.textDark, mb: 1 }}>
                          المشترك (مدني)
                        </Typography>
                        <Grid container spacing={isPhone ? 0.45 : isTablet ? 0.65 : 1.5}>
                          <Grid item xs={6} sm={6}>
                            <MiniStat
                              label="خصم"
                              value={data[K.civilSharedDiscount]}
                              icon={<DiscountIcon fontSize="small" />}
                              tone="discount"
                            />
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <MiniStat
                              label="إضافة"
                              value={data[K.civilSharedBonus]}
                              icon={<BonusIcon fontSize="small" />}
                              tone="bonus"
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                        <Row
                          label="العمولة (بعد الخصم/الإضافة)"
                          value={data[K.civilCommission]}
                          color={colorPalette.primary}
                          isCurrency
                        />
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
                    subtitle="تفاصيل العسكري + المشترك"
                  >
                    <Grid container spacing={isPhone ? 0.6 : isTablet ? 0.8 : 2}>
                      <Grid item xs={6}>
                        <Row label="الإجمالي" value={data[K.mil]} />
                        <Row label="المرتجعات" value={data[K.milReturn]} color={colorPalette.error} />
                      </Grid>

                      <Grid item xs={6}>
                        <Row label="بدون اتفاقية" value={data[K.milNoContract]} />
                        <Row label="الصافي" value={data[K.milNet]} color={colorPalette.success} />
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                        <Typography variant="subtitle2" sx={{ color: colorPalette.textDark, mb: 1 }}>
                          المشترك (عسكري)
                        </Typography>
                        <Grid container spacing={isPhone ? 0.45 : isTablet ? 0.65 : 1.5}>
                          <Grid item xs={6} sm={6}>
                            <MiniStat
                              label="خصم"
                              value={data[K.milSharedDiscount]}
                              icon={<DiscountIcon fontSize="small" />}
                              tone="discount"
                            />
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <MiniStat
                              label="إضافة"
                              value={data[K.milSharedBonus]}
                              icon={<BonusIcon fontSize="small" />}
                              tone="bonus"
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                        <Row
                          label="العمولة (بعد الخصم/الإضافة)"
                          value={data[K.milCommission]}
                          color={colorPalette.primary}
                          isCurrency
                        />
                      </Grid>
                    </Grid>
                  </Panel>
                </Grid>
              </Grid>

              {/* Courses */}
              <Grid container spacing={isPhone ? 0.65 : isTablet ? 0.9 : 2}>
                <Grid item xs={12} md={6}>
                  <Panel color="success" icon={<TrendingUpIcon />} title="الدورات التأهيلية" subtitle="عدد وعمولة">
                    <Row label="عدد الدورات" value={data[K.qual]} />
                    <Row label="المرتجع" value={data[K.qualReturn]} color={colorPalette.error} />
                    <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                    <Row label="العمولة" value={data[K.qualCommission]} color={colorPalette.primary} isCurrency />
                  </Panel>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Panel color="secondary" icon={<GroupsIcon />} title="الدورات التطويرية" subtitle="عدد وعمولة">
                    <Row label="عدد الدورات" value={data[K.dev]} />
                    <Row label="المرتجع" value={data[K.devReturn]} color={colorPalette.error} />
                    <Divider sx={{ my: 1, borderColor: colorPalette.primaryLighter }} />
                    <Row label="العمولة" value={data[K.devCommission]} color={colorPalette.primary} isCurrency />
                  </Panel>
                </Grid>
              </Grid>
            </>
          )}

          {/* ===================== Details Dialog ===================== */}
          <Dialog
            open={openDetails}
            onClose={closeDetailsDialog}
            fullWidth
            fullScreen={isPhone}
            maxWidth="lg"
            sx={uiLayout.withUiSx({
              "& .MuiDialog-container": {
                pt: isPhone ? "52px" : isTablet ? "62px" : 0,
                px: isPhone ? 0 : isTablet ? 0.6 : undefined,
                alignItems: isPhone ? "stretch" : "center"
              }
            }, uiLayout.dialogLayoutSx)}
            PaperProps={{
              sx: {
                borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
                overflow: "hidden",
                width: isPhone ? "100vw" : isTablet ? "95vw" : undefined,
                maxWidth: isPhone ? "100vw" : isTablet ? "1050px" : undefined,
                height: isPhone ? "calc(100dvh - 52px)" : undefined,
                maxHeight: isPhone ? "calc(100dvh - 52px)" : isTablet ? "90dvh" : undefined,
                m: isPhone ? 0 : undefined,
                border: `1px solid ${colorPalette.primaryLighter}`,
              },
            }}
          >
            <DialogTitle
              sx={{
                bgcolor: "white",
                borderBottom: `1px solid ${colorPalette.primaryLighter}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: isPhone ? 0.5 : isTablet ? 0.75 : 2,
                px: isPhone ? 0.7 : isTablet ? 1 : 3,
                py: isPhone ? 0.55 : isTablet ? 0.75 : 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{
                    color: colorPalette.textDark,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.78rem" : undefined
                  }}
                >
                  تفاصيل الخصم / الإضافة
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: colorPalette.textLight,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  }}
                >
                  {startDate && endDate
                    ? `الفترة: ${format(startDate, "yyyy/MM/dd")} - ${format(endDate, "yyyy/MM/dd")}`
                    : ""}
                </Typography>
              </Box>

              <IconButton onClick={closeDetailsDialog} sx={{ color: colorPalette.textLight }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent
              sx={{
                bgcolor: "white",
                px: isPhone ? 0.65 : isTablet ? 1 : 3,
                py: isPhone ? 0.55 : isTablet ? 0.8 : 2
              }}
            >
              {/* top controls */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: isCompact ? "column" : "row",
                    alignItems: isCompact ? "stretch" : "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <TextField InputLabelProps={{ shrink: true }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث بالاسم / الهوية / مندوب الطالب / مندوب الاستمارة"
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={uiLayout.withUiSx({
                      "& .MuiOutlinedInput-root": {
                        borderRadius: isCompact ? 1.2 : 2,
                        minHeight: isPhone ? 31 : isTablet ? 34 : undefined
                      },
                      "& .MuiInputBase-input": {
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                      },
                    }, uiLayout.formFieldSx)}
                  />

                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button
                      onClick={fetchSharedDetails}
                      startIcon={<RefreshIcon />}
                      variant="outlined"
                      sx={uiLayout.withUiSx({
                        borderRadius: isCompact ? 1.2 : 2,
                  minHeight: isPhone ? 30 : isTablet ? 33 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                        borderColor: colorPalette.primaryLight,
                        color: colorPalette.primaryDark,
                      }, uiLayout.buttonSx)}
                      disabled={detailsLoading}
                    >
                      تحديث
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: isCompact ? "column" : "row",
                    alignItems: isCompact ? "stretch" : "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant={isCompact ? "scrollable" : "standard"}
                    sx={{
                      minHeight: isPhone ? 31 : isTablet ? 35 : 42,
                      "& .MuiTab-root": {
                        minHeight: isPhone ? 31 : isTablet ? 35 : 42,
                        borderRadius: isCompact ? 1.2 : 2,
                        minWidth: isPhone ? 72 : isTablet ? 90 : undefined,
                        px: isPhone ? 0.55 : isTablet ? 0.8 : undefined,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                      },
                      "& .MuiSvgIcon-root": {
                        fontSize: isPhone ? 14 : isTablet ? 16 : undefined
                      },
                    }}
                  >
                    <Tab
                      label={
                        <Badge badgeContent={detailsCounts.total} color="primary">
                          <Box display="flex" alignItems="center" gap={1}>
                            <SwapIcon fontSize="small" />
                            الكل
                          </Box>
                        </Badge>
                      }
                    />
                    <Tab
                      label={
                        <Badge badgeContent={detailsCounts.discount} color="error">
                          <Box display="flex" alignItems="center" gap={1}>
                            <DiscountIcon fontSize="small" />
                            خصم
                          </Box>
                        </Badge>
                      }
                    />
                    <Tab
                      label={
                        <Badge badgeContent={detailsCounts.bonus} color="success">
                          <Box display="flex" alignItems="center" gap={1}>
                            <BonusIcon fontSize="small" />
                            إضافة
                          </Box>
                        </Badge>
                      }
                    />
                  </Tabs>

                  <Box
                    display={isPhone ? "none" : "flex"}
                    gap={1}
                    flexWrap="wrap"
                    justifyContent="flex-end"
                    sx={{
                      "& .MuiChip-root": {
                        height: isTablet ? 25 : undefined,
                        fontSize: isTablet ? "0.75rem" : undefined
                      }
                    }}
                  >
                    <Chip
                      icon={<DiscountIcon sx={{ color: colorPalette.error }} />}
                      label={`خصم: ${detailsCounts.discount}`}
                      size="small"
                      variant="outlined"
                      sx={{ bgcolor: "rgba(244,67,54,0.08)", borderColor: "rgba(244,67,54,0.25)" }}
                    />
                    <Chip
                      icon={<BonusIcon sx={{ color: colorPalette.success }} />}
                      label={`إضافة: ${detailsCounts.bonus}`}
                      size="small"
                      variant="outlined"
                      sx={{ bgcolor: "rgba(76,175,80,0.10)", borderColor: "rgba(76,175,80,0.25)" }}
                    />
                  </Box>
                </Box>

                {detailsErr && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {detailsErr}
                  </Alert>
                )}

                {detailsLoading && (
                  <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                    <CircularProgress sx={{ color: colorPalette.primary }} />
                    <Typography variant="body2" sx={{ mt: 1, color: colorPalette.textLight }}>
                      جاري تحميل التفاصيل...
                    </Typography>
                  </Box>
                )}

                {!detailsLoading && filteredDetails.length === 0 && (
                  <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                    <Typography variant="h6" sx={{ color: colorPalette.textLight }}>
                      لا توجد تفاصيل مطابقة.
                    </Typography>
                    <Typography
                variant="caption"
                sx={{
                  color: colorPalette.textLight,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                }}
              >
                      جرّب تغيير الفلتر أو البحث.
                    </Typography>
                  </Box>
                )}

                {!detailsLoading && filteredDetails.length > 0 && (
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={uiLayout.withUiSx({
                      mt: 1,
                      borderRadius: 2,
                      borderColor: colorPalette.primaryLighter,
                      overflow: "hidden",
                    }, uiLayout.tableContainerSx)}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: colorPalette.primaryLighter }}>
                          <TableCell
                            sx={{
                              fontWeight: 800,
                              color: colorPalette.textDark,
                              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                              px: isPhone ? 0.45 : isTablet ? 0.65 : 2
                            }}
                          >
                            الطالب
                          </TableCell>

                          <TableCell
                            sx={{
                              fontWeight: 800,
                              color: colorPalette.textDark,
                              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                              px: isPhone ? 0.45 : isTablet ? 0.65 : 2
                            }}
                          >
                            الهوية
                          </TableCell>

                          {!isPhone && (
                            <TableCell
                              sx={{
                                fontWeight: 800,
                                color: colorPalette.textDark,
                                fontSize: isTablet ? "0.75rem" : undefined,
                                px: isTablet ? 0.65 : 2
                              }}
                            >
                              التاريخ
                            </TableCell>
                          )}

                          {!isCompact && (
                            <>
                              <TableCell sx={{ fontWeight: 800, color: colorPalette.textDark }}>
                                مندوب الطالب
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800, color: colorPalette.textDark }}>
                                مندوب الاستمارة
                              </TableCell>
                            </>
                          )}

                          <TableCell
                            sx={{
                              fontWeight: 900,
                              color: colorPalette.textDark,
                              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                              px: isPhone ? 0.45 : isTablet ? 0.65 : 2
                            }}
                          >
                            التأثير
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredDetails.map((r, idx) => {
                          const eff = r.Effect;
                          const isDiscount = eff === "خصم";
                          return (
                            <TableRow key={`${r.NationalId}-${r.RegDate}-${idx}`} hover>
                              <TableCell
                                sx={{
                                  fontWeight: 700,
                                  color: colorPalette.textDark,
                                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                                  px: isPhone ? 0.45 : isTablet ? 0.65 : 2,
                                  maxWidth: isPhone ? 105 : isTablet ? 150 : undefined,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {safeStr(r.StudentName)}
                              </TableCell>

                              <TableCell
                                sx={{
                                  color: colorPalette.textLight,
                                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                                  px: isPhone ? 0.45 : isTablet ? 0.65 : 2
                                }}
                              >
                                {safeStr(r.NationalId)}
                              </TableCell>

                              {!isPhone && (
                                <TableCell
                                  sx={{
                                    color: colorPalette.textLight,
                                    fontSize: isTablet ? "0.75rem" : undefined,
                                    px: isTablet ? 0.65 : 2
                                  }}
                                >
                                  {formatDateTime(r.RegDate)}
                                </TableCell>
                              )}

                              {!isCompact && (
                                <>
                                  <TableCell sx={{ color: colorPalette.textDark }}>
                                    {safeStr(r.StudentSeller)}
                                  </TableCell>
                                  <TableCell sx={{ color: colorPalette.textDark }}>
                                    {safeStr(r.FormSeller)}
                                  </TableCell>
                                </>
                              )}

                              <TableCell
                                sx={{
                                  px: isPhone ? 0.35 : isTablet ? 0.55 : 2
                                }}
                              >
                                <Chip
                                  icon={isDiscount ? <DiscountIcon /> : <BonusIcon />}
                                  label={eff}
                                  size="small"
                                  sx={{
                                    fontWeight: 900,
                                    height: isPhone ? 22 : isTablet ? 25 : undefined,
                                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                                    "& .MuiChip-icon": {
                                      fontSize: isPhone ? 13 : isTablet ? 15 : undefined
                                    },
                                    bgcolor: isDiscount ? "rgba(244,67,54,0.10)" : "rgba(76,175,80,0.12)",
                                    color: isDiscount ? colorPalette.error : colorPalette.success,
                                    borderRadius: 2,
                                  }}
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </DialogContent>

            <DialogActions
              sx={uiLayout.withUiSx({
                bgcolor: "white",
                borderTop: `1px solid ${colorPalette.primaryLighter}`,
                p: isPhone ? 0.5 : isTablet ? 0.75 : 2,
                justifyContent: "space-between",
                gap: isPhone ? 0.5 : isTablet ? 0.75 : 2,
              }, uiLayout.dialogActionsSx)}
            >
              <Typography variant="caption" sx={{ color: colorPalette.textLight }}>
                عدد الصفوف المعروضة: {filteredDetails.length.toLocaleString()}
              </Typography>

              <Button
                onClick={closeDetailsDialog}
                variant="contained"
                startIcon={<CloseIcon />}
                sx={uiLayout.withUiSx({
                  bgcolor: colorPalette.primary,
                  "&:hover": { bgcolor: colorPalette.primaryDark },
                  borderRadius: 2,
                }, uiLayout.buttonSx)}
              >
                إغلاق
              </Button>
            </DialogActions>
          </Dialog>
        </ContentContainer>
      </DashboardContainer>
    </LocalizationProvider></NavigationShell>
  );
};

export default RegistrationCommissions;
