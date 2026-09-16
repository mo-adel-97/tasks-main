import * as uiLayout from './common/uiLayout';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useState, useMemo } from "react";
import PercentIcon from '@mui/icons-material/Percent';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  AppBar,
  Toolbar,
} from "@mui/material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import InfoIcon from '@mui/icons-material/Info';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import BranchesDashboard from "./BranchesDashboard";


// الألوان الأساسية
const PRIMARY_COLOR = '#80b49e';
const PRIMARY_COLOR_DARK = '#6a9a87';
const PRIMARY_COLOR_LIGHT = '#9ac8b5';
const PRIMARY_COLOR_SUPER_LIGHT = '#e8f3ef';

// تعريف الـ API base
const PHP_BASE = 'https://filesregsiteration.sstli.com';

const SpecialComponent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isPhone = useMediaQuery('(max-width:599px)', { noSsr: true });
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`, { noSsr: true });
  const isDark = theme.palette.mode === 'dark';

  const dashboardColors = useMemo(() => ({
    page: isDark ? '#0b110f' : '#f4f7f5',
    surface: isDark ? '#111a16' : '#ffffff',
    surfaceSoft: isDark ? '#16231d' : '#f8fbf9',
    surfaceRaised: isDark ? '#192820' : '#f1f7f4',
    text: isDark ? '#f1f7f4' : '#17372b',
    muted: isDark ? '#9fb4aa' : '#6f8178',
    border: isDark ? 'rgba(128,180,158,.18)' : 'rgba(5,117,70,.11)',
    borderStrong: isDark ? 'rgba(128,180,158,.32)' : 'rgba(5,117,70,.19)',
    shadow: isDark
      ? '0 12px 34px rgba(0,0,0,.28)'
      : '0 12px 34px rgba(29,78,56,.07)',
  }), [isDark]);

  const sectionCardSx = {
    background: dashboardColors.surface,
    border: `1px solid ${dashboardColors.border}`,
    boxShadow: dashboardColors.shadow,
    borderRadius: isDesktop ? 3 : 2,
    backgroundImage: 'none',
  };

  const dateFieldSx = {
    width: '100%',
    minWidth: isDesktop ? 190 : 0,
    '& .MuiOutlinedInput-root': {
      minHeight: isDesktop ? 46 : 40,
      borderRadius: 2.25,
      color: dashboardColors.text,
      backgroundColor: dashboardColors.surfaceSoft,
      '& fieldset': { borderColor: dashboardColors.borderStrong },
      '&:hover fieldset': { borderColor: alpha(PRIMARY_COLOR, .55) },
      '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR_DARK },
    },
    '& .MuiInputLabel-root': { color: dashboardColors.muted },
    '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY_COLOR },
    '& .MuiSvgIcon-root': { color: PRIMARY_COLOR },
  };

  const metricCardSx = (color, featured = false) => ({
    minHeight: isDesktop ? 132 : 96,
    p: isDesktop ? 2.1 : { xs: 1, sm: 1.2 },
    borderRadius: isDesktop ? 2.75 : 2,
    position: 'relative',
    overflow: 'hidden',
    background: featured
      ? `linear-gradient(135deg, ${alpha(color, isDark ? .22 : .11)} 0%, ${dashboardColors.surface} 72%)`
      : dashboardColors.surface,
    border: `1px solid ${featured ? alpha(color, .42) : dashboardColors.border}`,
    boxShadow: featured
      ? `0 14px 32px ${alpha(color, isDark ? .10 : .08)}`
      : (isDark ? '0 8px 24px rgba(0,0,0,.16)' : '0 8px 22px rgba(31,81,59,.045)'),
    transition: 'transform .18s ease, border-color .18s ease, box-shadow .18s ease',
    '&::after': {
      content: '""',
      position: 'absolute',
      insetInlineStart: 0,
      top: 18,
      bottom: 18,
      width: 3,
      borderRadius: 3,
      backgroundColor: color,
      opacity: featured ? 1 : .72,
    },
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: alpha(color, .38),
      boxShadow: `0 14px 30px ${alpha(color, isDark ? .11 : .075)}`,
    },
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [trainerPaginationModel, setTrainerPaginationModel] = useState({
    page: 0,
    pageSize: 30,
  });

  const [studentPaginationModel, setStudentPaginationModel] = useState({
    page: 0,
    pageSize: 30,
  });

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);


  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
  const [toDate, setToDate] = useState(dayjs());

  const [trainers, setTrainers] = useState([]);
  const [fetching, setFetching] = useState(false);

  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerDialogOpen, setTrainerDialogOpen] = useState(false);

  const [trainerStudents, setTrainerStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // حالات جديدة للملاحظات والحالات
  const [rowStatuses, setRowStatuses] = useState({});
  const [rowNotes, setRowNotes] = useState({});
  const [filterStatus, setFilterStatus] = useState('');

  // NEW: قواعد العمولة على مستوى الفرع (مرة واحدة)
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [overallCommissionRate, setOverallCommissionRate] = useState(0); 
  const [overallBonus, setOverallBonus] = useState(0); 

  // القرار الإداري رقم 7 لعام 2025 - على مستوى الفرع
  const calculateBranchPolicy = (percentage) => {
    let commissionRate = 0; 
    let bonus = 0;

    if (percentage < 45) {
      commissionRate = 0;
      bonus = 0;
    } else if (percentage >= 45 && percentage <= 75) {
      commissionRate = 0.5;
      bonus = 0;
    } else if (percentage >= 76 && percentage <= 85) {
      commissionRate = 0.5;
      bonus = 250;
    } else if (percentage >= 86 && percentage <= 100) {
      commissionRate = 0.5;
      bonus = 500;
    }

    return { commissionRate, bonus };
  };

  useEffect(() => {
  const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (user?.guid) {
      fetch(`https://api3.sstli.com/api/Trainer/UserBranchForWork?userGuid=${user.guid}`)
        .then((res) => res.json())
        .then((result) => {
          if (result && result.length > 0) {
            setBranchName(result[0].brEName);
          } else {
            setBranchName("—");
          }
          setLoading(false);
        })
        .catch(() => {
          setBranchName("خطأ في جلب بيانات الفرع");
          setLoading(false);
        });
    } else {
      setBranchName("مستخدم غير معرف");
      setLoading(false);
    }
  }, []);

  // جلب بيانات المدربين + حساب السياسة على مستوى الفرع
  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    const branchGuid = user?.branchForWork;
    if (!branchGuid) return;

    setFetching(true);
    setTrainers([]);

    const from = fromDate.startOf('day').format("YYYY-MM-DD");
    const to = toDate.endOf('day').format("YYYY-MM-DD");

    fetch(`https://api3.sstli.com/api/Trainer/BranchTrainerSummary?fromDate=${from}&toDate=${to}&branchGuid=${branchGuid}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {

          // 1) احسب إجماليات الفرع الأول (قبل ما تعمل map للمدربين)
          const totalStudentsAll = result.data.reduce((sum, r) => sum + (r.عدد_الطلاب || 0), 0);
          const totalUnpaidAll = result.data.reduce((sum, r) => sum + (r.غير_مسددين || 0), 0);
          const totalPaidStudentsAll = totalStudentsAll - totalUnpaidAll;

          const perc = totalStudentsAll > 0
            ? Math.round((totalPaidStudentsAll / totalStudentsAll) * 100)
            : 0;

          const policy = calculateBranchPolicy(perc);

          setOverallPercentage(perc);
          setOverallCommissionRate(policy.commissionRate);
          setOverallBonus(policy.bonus); 

          // 2) طبّق عمولة "النسبة فقط" على كل مدرب (bonus مش هنا)
          const trainersWithCommission = result.data.map((row, idx) => {
            const totalStudents = row.عدد_الطلاب || 0;
            const unpaidStudents = row.غير_مسددين || 0;
            const paidStudents = totalStudents - unpaidStudents;

            const totalPaidAmount = row.إجمالي_التحصيل || 0;

            // عمولة المدرب = تحصيل المدرب × commissionRate (حسب سياسة الفرع)
            const commissionOnly = (totalPaidAmount * policy.commissionRate) / 100;

            // نسبة تحصيل المدرب (للعرض فقط)
            const trainerPerc = totalStudents > 0
              ? Math.round((paidStudents / totalStudents) * 100)
              : 0;

            return {
              ...row,
              id: idx + 1,
              // مهم: العمولة هنا = نسبة فقط (0.5%) بدون مكافأة
              العمولة: Math.round(commissionOnly),
              نسبة_التحصيل: trainerPerc,
            };
          });

          setTrainers(trainersWithCommission);
        } else {
          setTrainers([]);
          setOverallPercentage(0);
          setOverallCommissionRate(0);
          setOverallBonus(0);
        }
        setFetching(false);
      })
      .catch(() => {
        setTrainers([]);
        setOverallPercentage(0);
        setOverallCommissionRate(0);
        setOverallBonus(0);
        setFetching(false);
      });
  }, [fromDate, toDate]);

  // جلب بيانات الحالات والملاحظات لكل طالب
  const fetchStatusesAndNotes = async (branchGuid, trainerGuid) => {
    try {
      const response = await fetch(
        `${PHP_BASE}/getStatusesAndNotes.php?branchGuid=${branchGuid}&trainerGuid=${trainerGuid}`
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const statusesData = await response.json();
      return statusesData || {};
    } catch (error) {
      console.error('❌ Failed to fetch statuses and notes:', error);
      return {};
    }
  };

  // جلب طلاب المدرب مع الحالات والملاحظات
  const fetchTrainerStudents = async (trainerGuid) => {
    if (!trainerGuid) return;

    setStudentsLoading(true);
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    const branchGuid = user?.branchForWork;
    const from = fromDate.startOf('day').format("YYYY-MM-DD");
    const to = toDate.endOf('day').format("YYYY-MM-DD");

    try {
      const response = await fetch(
        `https://api3.sstli.com/api/Trainer/StudentList?branchGuid=${branchGuid}&trainerGuid=${trainerGuid}&fromDate=${from}&toDate=${to}`
      );
      const result = await response.json();

      let studentsData = [];
      if (result.success && Array.isArray(result.data)) {
        studentsData = result.data.map((student, idx) => ({
          ...student,
          id: student.nationalId || idx + 1,
        }));
      }

      const statusesData = await fetchStatusesAndNotes(branchGuid, trainerGuid);

      const updatedStatuses = {};
      const updatedNotes = {};

      studentsData.forEach((student) => {
        const studentId = student.nationalId || student.id;
        const history = statusesData[studentId];

        if (Array.isArray(history) && history.length > 0) {
          const filtered = history.filter((entry) => {
            const entryDate = dayjs(entry.dateRecorded).startOf('day');
            return (
              entryDate.isSame(fromDate, 'day') ||
              entryDate.isSame(toDate, 'day') ||
              (entryDate.isAfter(fromDate) && entryDate.isBefore(toDate))
            );
          });

          if (filtered.length > 0) {
            const latest = filtered[filtered.length - 1];
            updatedStatuses[studentId] = student.monthpay > 0 ? 'paid' : latest.status;
            updatedNotes[studentId] = latest.note;
          } else {
            updatedStatuses[studentId] = student.monthpay > 0 ? 'paid' : '';
            updatedNotes[studentId] = '';
          }
        } else {
          updatedStatuses[studentId] = student.monthpay > 0 ? 'paid' : '';
          updatedNotes[studentId] = '';
        }
      });

      setTrainerStudents(studentsData);
      setRowStatuses(updatedStatuses);
      setRowNotes(updatedNotes);

    } catch (error) {
      console.error('Error fetching trainer students:', error);
      setTrainerStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // فتح ديلوج المدرب
  const handleOpenTrainerDialog = (trainer) => {
    setSelectedTrainer(trainer);
    setTrainerDialogOpen(true);
    setFilterStatus('');
    fetchTrainerStudents(trainer.trainerGuid);
  };

  // فلترة الطلاب حسب الحالة
  const filteredStudents = trainerStudents.filter((student) => {
    const studentId = student.nationalId || student.id;
    const status = rowStatuses[studentId] || '';

    if (!filterStatus) return true;
    if (filterStatus === 'none') return status === '';
    return status === filterStatus;
  });

  // إجماليات الفرع (من بيانات المدربين)
  const totalStudents = useMemo(() => trainers.reduce((sum, t) => sum + (t.عدد_الطلاب || 0), 0), [trainers]);
  const totalCollected = useMemo(() => trainers.reduce((sum, t) => sum + (t.إجمالي_التحصيل || 0), 0), [trainers]);
  const totalCommissionOnly = useMemo(() => trainers.reduce((sum, t) => sum + (t.العمولة || 0), 0), [trainers]); // 0.5% فقط (بدون مكافأة)
  const totalUnpaid = useMemo(() => trainers.reduce((sum, t) => sum + (t.غير_مسددين || 0), 0), [trainers]);

  // الإجمالي النهائي للفرع = عمولة النسبة + مكافأة واحدة
  const totalFinalCommission = totalCommissionOnly + (overallBonus || 0);

  const summaryMetrics = [
    {
      key: 'collected',
      label: 'إجمالي التحصيل',
      value: Number(totalCollected || 0).toLocaleString('ar-EG'),
      unit: 'ر.س',
      helper: 'إجمالي التحصيل خلال الفترة',
      icon: AccountBalanceWalletIcon,
      color: '#14b8a6',
    },
    {
      key: 'commission',
      label: 'عمولة النسبة',
      value: Number(totalCommissionOnly || 0).toLocaleString('ar-EG'),
      unit: 'ر.س',
      helper: `المعدل الحالي ${overallCommissionRate}%`,
      icon: PercentIcon,
      color: '#0ea5e9',
    },
    {
      key: 'bonus',
      label: 'مكافأة الفرع',
      value: Number(overallBonus || 0).toLocaleString('ar-EG'),
      unit: 'ر.س',
      helper: 'تُضاف مرة واحدة للفرع',
      icon: EmojiEventsIcon,
      color: '#d946ef',
    },
    {
      key: 'final',
      label: 'إجمالي العمولة النهائي',
      value: Number(totalFinalCommission || 0).toLocaleString('ar-EG'),
      unit: 'ر.س',
      helper: 'العمولة + مكافأة الفرع',
      icon: AttachMoneyIcon,
      color: '#10b981',
      featured: true,
    },
    {
      key: 'students',
      label: 'إجمالي الطلاب',
      value: Number(totalStudents || 0).toLocaleString('ar-EG'),
      unit: 'طالب',
      helper: 'إجمالي الطلاب لدى المدربين',
      icon: GroupIcon,
      color: '#eab308',
    },
    {
      key: 'unpaid',
      label: 'غير مسددين',
      value: Number(totalUnpaid || 0).toLocaleString('ar-EG'),
      unit: 'طالب',
      helper: 'بحاجة إلى متابعة التحصيل',
      icon: MonetizationOnIcon,
      color: '#ef4444',
    },
    {
      key: 'percentage',
      label: 'نسبة التحصيل الكلية',
      value: `${overallPercentage}%`,
      unit: '',
      helper: 'المعيار الحاكم للعمولة',
      icon: TrendingUpIcon,
      color:
        overallPercentage < 45
          ? '#ef4444'
          : overallPercentage <= 75
            ? '#22c55e'
            : overallPercentage <= 85
              ? '#0ea5e9'
              : '#a855f7',
      featured: true,
    },
  ];

  // إحصائيات الطلاب في الديلوج
  const dialogTotalStudents = filteredStudents.length;
  const dialogPaidStudents = filteredStudents.filter(student => {
    const studentId = student.nationalId || student.id;
    return rowStatuses[studentId] === 'paid';
  }).length;
  const dialogNotedStudents = filteredStudents.filter(student => {
    const studentId = student.nationalId || student.id;
    return rowStatuses[studentId] === 'note';
  }).length;
  const dialogLateStudents = filteredStudents.filter(student => {
    const studentId = student.nationalId || student.id;
    return rowStatuses[studentId] === 'late';
  }).length;

  const getPercentageColor = (percentage) => {
    if (percentage < 45) return '#f44336';
    if (percentage >= 45 && percentage <= 75) return '#4caf50';
    if (percentage >= 76 && percentage <= 85) return '#2196f3';
    if (percentage >= 86 && percentage <= 100) return '#9c27b0';
    return '#757575';
  };

  // القرار الإداري رقم 7 لعام 2025 - عرض مختصر وواضح مع إبراز الشريحة الحالية
  const commissionTiers = [
    {
      min: 0,
      max: 44,
      range: "أقل من 45%",
      title: "بدون عمولة",
      detail: "لا يستحق عمولة",
      color: "#ef4444",
    },
    {
      min: 45,
      max: 75,
      range: "45% - 75%",
      title: "0.5% عمولة",
      detail: "من إجمالي التحصيل",
      color: "#22c55e",
    },
    {
      min: 76,
      max: 85,
      range: "76% - 85%",
      title: "0.5% + 250 ر.س",
      detail: "مكافأة مرة للفرع",
      color: "#0ea5e9",
    },
    {
      min: 86,
      max: 100,
      range: "86% - 100%",
      title: "0.5% + 500 ر.س",
      detail: "مكافأة مرة للفرع",
      color: "#a855f7",
    },
  ];

  const renderCommissionPolicyCard = () => (
    <Card
      elevation={0}
      sx={{
        ...sectionCardSx,
        mb: isDesktop ? 2.2 : { xs: .7, sm: .9 },
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: isDesktop ? 2.2 : { xs: 1, sm: 1.25 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            mb: isDesktop ? 1.8 : 1.15,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.05, minWidth: 0 }}>
            <Box
              sx={{
                width: isDesktop ? 42 : 36,
                height: isDesktop ? 42 : 36,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                color: PRIMARY_COLOR,
                background: alpha(PRIMARY_COLOR, isDark ? .14 : .10),
                border: `1px solid ${alpha(PRIMARY_COLOR, .18)}`,
                flexShrink: 0,
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: isDesktop ? 22 : 19 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: dashboardColors.text,
                  fontWeight: 900,
                  fontSize: isDesktop ? '1rem' : '.84rem',
                  lineHeight: 1.35,
                }}
              >
                نظام العمولة
              </Typography>
              <Typography
                sx={{
                  color: dashboardColors.muted,
                  fontSize: isDesktop ? '.78rem' : '.7rem',
                  mt: .15,
                }}
              >
                القرار الإداري رقم 7 لعام 2025 • يحتسب على مستوى الفرع
              </Typography>
            </Box>
          </Box>

          <Chip
            size="small"
            icon={<TrendingUpIcon />}
            label={`نسبة الفرع الحالية ${overallPercentage}%`}
            sx={{
              height: isDesktop ? 34 : 30,
              px: .45,
              fontWeight: 900,
              color: getPercentageColor(overallPercentage),
              backgroundColor: alpha(getPercentageColor(overallPercentage), isDark ? .13 : .08),
              border: `1px solid ${alpha(getPercentageColor(overallPercentage), .28)}`,
              '& .MuiChip-icon': {
                color: 'inherit',
                fontSize: 17,
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: isDesktop ? 1.2 : .7,
          }}
        >
          {commissionTiers.map((tier) => {
            const active =
              overallPercentage >= tier.min &&
              overallPercentage <= tier.max;

            return (
              <Paper
                key={tier.range}
                elevation={0}
                sx={{
                  p: isDesktop ? 1.45 : .9,
                  borderRadius: 2.2,
                  minHeight: isDesktop ? 96 : 82,
                  position: 'relative',
                  overflow: 'hidden',
                  background: active
                    ? `linear-gradient(135deg, ${alpha(tier.color, isDark ? .18 : .10)}, ${dashboardColors.surfaceSoft})`
                    : dashboardColors.surfaceSoft,
                  border: `1px solid ${
                    active
                      ? alpha(tier.color, .55)
                      : dashboardColors.border
                  }`,
                  boxShadow: active
                    ? `0 8px 20px ${alpha(tier.color, .08)}`
                    : 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    insetInlineStart: 0,
                    insetInlineEnd: 0,
                    height: active ? 3 : 2,
                    backgroundColor: tier.color,
                    opacity: active ? 1 : .35,
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: .7,
                    mb: .55,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: active ? tier.color : dashboardColors.text,
                      fontSize: isDesktop ? '.86rem' : '.74rem',
                    }}
                  >
                    {tier.range}
                  </Typography>

                  {active && (
                    <Chip
                      size="small"
                      label="الحالية"
                      sx={{
                        height: 21,
                        fontSize: '.62rem',
                        fontWeight: 900,
                        color: tier.color,
                        bgcolor: alpha(tier.color, .10),
                      }}
                    />
                  )}
                </Box>

                <Typography
                  sx={{
                    fontWeight: 900,
                    color: dashboardColors.text,
                    fontSize: isDesktop ? '.9rem' : '.75rem',
                    lineHeight: 1.4,
                  }}
                >
                  {tier.title}
                </Typography>

                <Typography
                  sx={{
                    color: dashboardColors.muted,
                    fontSize: isDesktop ? '.72rem' : '.66rem',
                    mt: .25,
                  }}
                >
                  {tier.detail}
                </Typography>
              </Paper>
            );
          })}
        </Box>

        <Box
          sx={{
            mt: isDesktop ? 1.3 : .8,
            px: isDesktop ? 1.35 : 1,
            py: isDesktop ? .9 : .7,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: .8,
            color: isDark ? '#b9d8ca' : '#315e4b',
            backgroundColor: alpha(PRIMARY_COLOR, isDark ? .08 : .055),
            border: `1px solid ${alpha(PRIMARY_COLOR, .13)}`,
          }}
        >
          <InfoIcon sx={{ fontSize: 17, color: PRIMARY_COLOR, flexShrink: 0 }} />
          <Typography sx={{ fontSize: isDesktop ? '.75rem' : '.67rem', fontWeight: 700 }}>
            النسبة والمكافأة تُحسبان على إجمالي الفرع، والعمولة 0.5% تُطبّق على إجمالي التحصيل.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );


  const getCompactName = (fullName) => {
    const parts = String(fullName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length <= 2) return parts.join(' ');
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  // أعمدة الجدول
  const columns = [
    {
      field: "مسؤول_الاتصال",
      headerName: "اسم المدرب",
      flex: 1.8,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box
          display="flex"
          alignItems="center"
          gap={isDesktop ? 1.5 : { xs: 0.35, sm: 0.5 }}
          sx={{
            py: isDesktop ? 1 : 0,
            width: '100%',
            justifyContent: isDesktop ? 'center' : 'flex-start',
            minWidth: 0,
          }}
        >
          {!isPhone && (
            <Box
              sx={{
                p: isDesktop ? 1 : 0.35,
                borderRadius: '50%',
                backgroundColor: alpha(PRIMARY_COLOR, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PersonIcon sx={{ color: PRIMARY_COLOR, fontSize: isDesktop ? 20 : { sm: 14, md: 16 } }} />
            </Box>
          )}

          <Typography
            fontWeight={700}
            title={params.value || ''}
            sx={{
              color: dashboardColors.text,
              fontSize: isDesktop ? '15px' : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {isDesktop ? params.value : getCompactName(params.value)}
          </Typography>
        </Box>
      )
    },
    {
      field: "عدد_الطلاب",
      headerName: "👥 عدد الطلاب",
      flex: 1,
      minWidth: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={1} sx={{ width: '100%' }}>
          <GroupIcon sx={{ color: PRIMARY_COLOR, fontSize: 18 }} />
          <Typography fontWeight={600} fontSize="14px" sx={{ color: params.value > 0 ? PRIMARY_COLOR_DARK : '#a0aec0', minWidth: '30px' }}>
            {params.value || 0}
          </Typography>
        </Box>
      )
    },
    {
      field: "غير_مسددين",
      headerName: "❌ غير مسددين",
      flex: 1,
      minWidth: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography fontWeight={600} fontSize="14px" align="center" sx={{ color: params.value > 0 ? '#f44336' : '#a0aec0', minWidth: '30px' }}>
          {params.value || 0}
        </Typography>
      )
    },
    {
      field: "نسبة_التحصيل",
      headerName: "📊 نسبة تحصيل المدرب",
      flex: 1,
      minWidth: 140,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{
          backgroundColor: alpha(getPercentageColor(params.value), 0.1),
          color: getPercentageColor(params.value),
          padding: '4px 12px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '13px',
          border: `1px solid ${alpha(getPercentageColor(params.value), 0.3)}`
        }}>
          {params.value}%
        </Box>
      )
    },
    {
      field: "actions",
      headerName: "الإجراءات",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleOpenTrainerDialog(params.row)}
          sx={{
            border: `1px solid ${dashboardColors.borderStrong}`,
            color: dashboardColors.text,
            borderRadius: 2,
            '&:hover': { backgroundColor: PRIMARY_COLOR_LIGHT, borderColor: PRIMARY_COLOR }
          }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const responsiveTrainerColumns = isDesktop
    ? columns
    : columns
        .filter((column) =>
          (isPhone
            ? ['مسؤول_الاتصال', 'عدد_الطلاب', 'نسبة_التحصيل', 'actions']
            : ['مسؤول_الاتصال', 'عدد_الطلاب', 'غير_مسددين', 'نسبة_التحصيل', 'actions']
          ).includes(column.field)
        )
        .map((column) => {
          const widths = isPhone
            ? {
                مسؤول_الاتصال: 128,
                عدد_الطلاب: 62,
                نسبة_التحصيل: 76,
                actions: 40,
              }
            : {
                مسؤول_الاتصال: 180,
                عدد_الطلاب: 82,
                غير_مسددين: 90,
                نسبة_التحصيل: 108,
                actions: 48,
              };

          return {
            ...column,
            flex: column.field === 'مسؤول_الاتصال' ? 1 : undefined,
            minWidth: column.field === 'مسؤول_الاتصال' ? widths.مسؤول_الاتصال : undefined,
            width: column.field === 'مسؤول_الاتصال' ? undefined : widths[column.field],
          };
        });

  // أعمدة طلاب المدرب
  const studentColumns = [
    {
      field: "studentName",
      headerName: "اسم الطالب",
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box
          display="flex"
          alignItems="center"
          gap={isDesktop ? 1 : 0.35}
          sx={{ width: '100%', minWidth: 0 }}
        >
          {!isPhone && (
            <PersonIcon
              sx={{
                color: PRIMARY_COLOR,
                fontSize: isDesktop ? 18 : { sm: 14, md: 16 },
                flexShrink: 0,
              }}
            />
          )}
          <Typography
            variant="body2"
            fontWeight="600"
            title={params.value || ''}
            sx={{
              fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {isDesktop ? (params.value || '-') : (getCompactName(params.value) || '-')}
          </Typography>
        </Box>
      ),
    },
    { field: "nationalId", headerName: "رقم الهوية", flex: 1, minWidth: 110 },
    { field: "studentTel", headerName: "الجوال", flex: 1, minWidth: 120 },
    { field: "diplomName", headerName: "البرنامج", flex: 1, minWidth: 150 },
    {
      field: "balance",
      headerName: "الرصيد الحالي",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography fontWeight={600} color={params.value > 0 ? 'error' : 'success'}>
          {Number(params.value || 0).toLocaleString('ar-EG')} ر.س
        </Typography>
      ),
    },
    {
      field: "monthpay",
      headerName: "دفعة الشهر",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography fontWeight={600} color="info.main">
          {Number(params.value || 0).toLocaleString('ar-EG')} ر.س
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 120,
      renderCell: (params) => {
        const studentId = params.row.nationalId || params.row.id;
        const isPaid = params.row.monthpay > 0;
        const status = isPaid ? 'paid' : (rowStatuses[studentId] || '');
        const note = rowNotes[studentId] || '';

        const getStatusChip = () => {
          if (status === 'paid') {
            return <Chip label="مسدد" sx={{ backgroundColor: '#4caf50', color: 'white' }} size="small" />;
          } else if (status === 'note') {
            return (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Chip label="متابعة" sx={{ backgroundColor: '#ff9800', color: 'white' }} size="small" />
                {note && (
                  <InfoIcon
                    sx={{ color: '#ff9800', cursor: 'pointer', fontSize: '18px' }}
                    titleAccess={note}
                  />
                )}
              </Box>
            );
          } else if (status === 'late') {
            return <Chip label="متأخر" sx={{ backgroundColor: '#f44336', color: 'white' }} size="small" />;
          }
          return <Chip label="بدون" variant="outlined" size="small" />;
        };

        return getStatusChip();
      },
    },
    {
      field: "note",
      headerName: "المتابعة",
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => {
        const studentId = params.row.nationalId || params.row.id;
        const note = rowNotes[studentId] || '';

        return (
          <Typography
            variant="body2"
            sx={{
              color: note ? 'text.primary' : 'text.secondary',
              fontStyle: note ? 'normal' : 'italic'
            }}
          >
            {note || 'لا توجد متابعة'}
          </Typography>
        );
      },
    },
  ];

  const responsiveStudentColumns = isDesktop
    ? studentColumns
    : studentColumns
        .filter((column) =>
          (isPhone
            ? ['studentName', 'studentTel', 'monthpay', 'status']
            : ['studentName', 'studentTel', 'balance', 'monthpay', 'status']
          ).includes(column.field)
        )
        .map((column) => {
          const widths = isPhone
            ? {
                studentName: 112,
                studentTel: 86,
                monthpay: 72,
                status: 68,
              }
            : {
                studentName: 160,
                studentTel: 115,
                balance: 105,
                monthpay: 105,
                status: 95,
              };

          return {
            ...column,
            flex: column.field === 'studentName' ? 1 : undefined,
            minWidth: column.field === 'studentName' ? widths.studentName : undefined,
            width: column.field === 'studentName' ? undefined : widths[column.field],
          };
        });

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const branchGuid = user?.userName;

  if (
    branchGuid === "sa" ||
    branchGuid === "admin" ||
    branchGuid === "sa1" ||
    branchGuid === "محمد حسانين"
  ) {
    return <BranchesDashboard />;
  }

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: dashboardColors.page }}>
        {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1401,
            background: isDark ? 'rgba(11,17,15,.94)' : 'rgba(255,255,255,.96)',
            backdropFilter: 'blur(14px)',
            color: dashboardColors.text,
            borderBottom: `1px solid ${dashboardColors.border}`,
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)",
              },
              px: { xs: 0.8, sm: 1.2, md: 1.6 },
              gap: 0.8,
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                color: '#fff',
                background: 'linear-gradient(135deg, #057546, #034d31)',
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22, md: 23 } }} />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isDesktop ? 2.2 : {
              xs: 0.5,
              sm: 0.75,
              md: 1
            },
            pt: isDesktop ? 2.2 : {
              xs: "var(--app-header-height, 56px)",
              sm: "var(--app-header-height, 56px)",
              md: "var(--app-header-height, 56px)"
            },
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            minHeight: '100vh',
            background: dashboardColors.page,
            '& .MuiTypography-h4': {
              fontSize: isDesktop ? undefined : {
                xs: '0.86rem',
                sm: '0.98rem',
                md: '1.1rem'
              },
              lineHeight: 1.2
            },
            '& .MuiTypography-h5': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: '0.82rem',
                md: '0.94rem'
              },
              lineHeight: 1.25
            },
            '& .MuiTypography-h6': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: '0.76rem'
              },
              lineHeight: 1.3
            },
            '& .MuiTypography-body1, & .MuiTypography-body2': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              },
              lineHeight: 1.35
            },
            '& .MuiButton-root': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              },
              minHeight: isDesktop ? undefined : {
                xs: 28,
                sm: 31,
                md: 34
              }
            },
            '& .MuiInputBase-root, & .MuiInputLabel-root': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              }
            },
            '& .MuiChip-root': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              },
              height: isDesktop ? undefined : {
                xs: 18,
                sm: 21,
                md: 24
              }
            },
            ...navigationContentSx
          }}
        >
          {/* الهيدر */}
          <Card
            elevation={0}
            sx={{
              ...sectionCardSx,
              mb: isDesktop ? 2.2 : { xs: .7, sm: .9 },
              position: 'relative',
              overflow: 'hidden',
              background: isDark
                ? `linear-gradient(120deg, #13231c 0%, #172b22 58%, ${alpha(PRIMARY_COLOR, .16)} 100%)`
                : `linear-gradient(120deg, #ffffff 0%, #f8fcfa 58%, ${alpha(PRIMARY_COLOR, .14)} 100%)`,
              '&::before': {
                content: '""',
                position: 'absolute',
                insetInlineStart: 0,
                top: 0,
                bottom: 0,
                width: isDesktop ? 5 : 3,
                background: 'linear-gradient(180deg, #057546, #80b49e)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                width: isDesktop ? 220 : 130,
                height: isDesktop ? 220 : 130,
                borderRadius: '50%',
                insetInlineEnd: isDesktop ? -70 : -50,
                top: isDesktop ? -110 : -65,
                background: alpha(PRIMARY_COLOR, isDark ? .08 : .10),
                pointerEvents: 'none',
              },
            }}
          >
            <CardContent
              sx={{
                p: isDesktop ? '22px 26px' : { xs: '13px 14px', sm: '15px 17px' },
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  flexDirection: { xs: 'column', md: 'row' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: isDesktop ? 48 : 40,
                      height: isDesktop ? 48 : 40,
                      borderRadius: 2.4,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      color: '#fff',
                      background: 'linear-gradient(135deg, #057546, #034d31)',
                      boxShadow: '0 10px 22px rgba(5,117,70,.18)',
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: isDesktop ? 26 : 21 }} />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: dashboardColors.text,
                        fontWeight: 1000,
                        fontSize: isDesktop ? '1.25rem' : { xs: '.92rem', sm: '1rem' },
                        lineHeight: 1.35,
                      }}
                    >
                      لوحة المدربين والتحصيل
                    </Typography>

                    <Box
                      sx={{
                        mt: .45,
                        display: 'flex',
                        alignItems: 'center',
                        gap: .65,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography
                        sx={{
                          color: dashboardColors.muted,
                          fontSize: isDesktop ? '.77rem' : '.68rem',
                          fontWeight: 700,
                        }}
                      >
                        متابعة أداء المدربين والعمولات على مستوى الفرع
                      </Typography>

                      <Box
                        component="span"
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: dashboardColors.muted,
                          opacity: .55,
                          display: { xs: 'none', sm: 'inline-block' },
                        }}
                      />

                      <Chip
                        size="small"
                        label={loading ? 'جاري تحميل الفرع...' : (branchName || 'الفرع غير محدد')}
                        sx={{
                          height: 24,
                          maxWidth: { xs: 190, sm: 260 },
                          color: PRIMARY_COLOR,
                          bgcolor: alpha(PRIMARY_COLOR, isDark ? .10 : .07),
                          border: `1px solid ${alpha(PRIMARY_COLOR, .17)}`,
                          fontWeight: 800,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    minWidth: { xs: '100%', md: 265 },
                    p: isDesktop ? '10px 13px' : '8px 10px',
                    borderRadius: 2.2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: dashboardColors.surfaceSoft,
                    border: `1px solid ${dashboardColors.border}`,
                  }}
                >
                  <Box
                    sx={{
                      width: isDesktop ? 36 : 31,
                      height: isDesktop ? 36 : 31,
                      borderRadius: 1.7,
                      display: 'grid',
                      placeItems: 'center',
                      color: PRIMARY_COLOR,
                      bgcolor: alpha(PRIMARY_COLOR, isDark ? .12 : .08),
                      flexShrink: 0,
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: isDesktop ? 18 : 16 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: dashboardColors.muted,
                        fontSize: isDesktop ? '.67rem' : '.62rem',
                        fontWeight: 700,
                        mb: .1,
                      }}
                    >
                      الفترة الحالية
                    </Typography>
                    <Typography
                      dir="ltr"
                      sx={{
                        color: dashboardColors.text,
                        fontSize: isDesktop ? '.82rem' : '.72rem',
                        fontWeight: 900,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fromDate.format('YYYY/MM/DD')} — {toDate.format('YYYY/MM/DD')}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </CardContent>
          </Card>

          {renderCommissionPolicyCard()}

          {/* إعدادات الفترة */}
          <Card
            elevation={0}
            sx={{
              ...sectionCardSx,
              mb: isDesktop ? 2.2 : { xs: .7, sm: .9 },
            }}
          >
            <CardContent sx={{ p: isDesktop ? 2 : { xs: 1, sm: 1.25 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: isDesktop ? 1.8 : 1,
                }}
              >
                <Box sx={{ minWidth: { xs: '100%', md: 190 } }}>
                  <Typography
                    sx={{
                      color: dashboardColors.text,
                      fontWeight: 900,
                      fontSize: isDesktop ? '.92rem' : '.78rem',
                    }}
                  >
                    إعدادات الفترة
                  </Typography>
                  <Typography
                    sx={{
                      mt: .2,
                      color: dashboardColors.muted,
                      fontSize: isDesktop ? '.7rem' : '.64rem',
                    }}
                  >
                    غيّر النطاق الزمني لتحديث كل مؤشرات الصفحة
                  </Typography>
                </Box>

                <Box
                  sx={uiLayout.withUiSx({
                    flex: 1,
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr)) auto',
                    },
                    alignItems: 'center',
                    gap: isDesktop ? 1 : .7,
                  }, uiLayout.filterBarSx)}
                >
                  <DatePicker
                    label="من تاريخ"
                    value={fromDate}
                    onChange={(v) => v && setFromDate(v)}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        size: 'small',
                        sx: dateFieldSx,
                      },
                    }}
                  />

                  <DatePicker
                    label="إلى تاريخ"
                    value={toDate}
                    onChange={(v) => v && setToDate(v)}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        size: 'small',
                        sx: dateFieldSx,
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={() => {
                      setFromDate(dayjs().startOf('month'));
                      setToDate(dayjs());
                    }}
                    sx={uiLayout.withUiSx({
                      minHeight: isDesktop ? 44 : 39,
                      px: isDesktop ? 2.2 : 1.3,
                      borderRadius: 2.1,
                      whiteSpace: 'nowrap',
                      fontWeight: 900,
                      color: '#fff',
                      background: 'linear-gradient(135deg, #057546, #04633d)',
                      boxShadow: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #04663e, #034d31)',
                        boxShadow: '0 7px 17px rgba(5,117,70,.18)',
                      },
                    }, uiLayout.buttonSx)}
                  >
                    هذا الشهر
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* المؤشرات الرئيسية */}
          <Box
            sx={{
              mb: isDesktop ? 2.2 : { xs: .7, sm: .9 },
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: isDesktop ? 1.25 : .7,
            }}
          >
            {summaryMetrics.map((metric) => {
              const MetricIcon = metric.icon;

              return (
                <Paper
                  key={metric.key}
                  elevation={0}
                  sx={metricCardSx(metric.color, metric.featured)}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: .8,
                      mb: isDesktop ? 1.25 : .75,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: dashboardColors.muted,
                          fontSize: isDesktop ? '.73rem' : '.65rem',
                          fontWeight: 800,
                          lineHeight: 1.35,
                        }}
                      >
                        {metric.label}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: isDesktop ? 36 : 31,
                        height: isDesktop ? 36 : 31,
                        borderRadius: 1.8,
                        display: 'grid',
                        placeItems: 'center',
                        color: metric.color,
                        backgroundColor: alpha(metric.color, isDark ? .13 : .085),
                        border: `1px solid ${alpha(metric.color, .13)}`,
                        flexShrink: 0,
                      }}
                    >
                      <MetricIcon sx={{ fontSize: isDesktop ? 19 : 16 }} />
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      color: dashboardColors.text,
                      fontWeight: 1000,
                      fontSize: isDesktop ? '1.35rem' : { xs: '.92rem', sm: '1rem' },
                      lineHeight: 1.2,
                      letterSpacing: '-.02em',
                    }}
                  >
                    {metric.value}
                    {metric.unit && (
                      <Box
                        component="span"
                        sx={{
                          marginInlineStart: .5,
                          color: metric.color,
                          fontSize: isDesktop ? '.72rem' : '.62rem',
                          fontWeight: 900,
                        }}
                      >
                        {metric.unit}
                      </Box>
                    )}
                  </Typography>

                  <Typography
                    sx={{
                      mt: .55,
                      color: dashboardColors.muted,
                      fontSize: isDesktop ? '.66rem' : '.6rem',
                      fontWeight: 650,
                      lineHeight: 1.35,
                    }}
                  >
                    {metric.helper}
                  </Typography>
                </Paper>
              );
            })}
          </Box>

          {/* الجدول الرئيسي */}
          <Card
            elevation={0}
            sx={{
              ...sectionCardSx,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{
                  px: isDesktop ? 2.2 : 1,
                  py: isDesktop ? 1.7 : .9,
                  borderBottom: `1px solid ${dashboardColors.border}`,
                  background: dashboardColors.surfaceSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: dashboardColors.text,
                      fontWeight: 950,
                      fontSize: isDesktop ? '.98rem' : '.8rem',
                    }}
                  >
                    كشف المدربين وتحصيلاتهم
                  </Typography>
                  <Typography
                    sx={{
                      mt: .15,
                      color: dashboardColors.muted,
                      fontSize: isDesktop ? '.68rem' : '.62rem',
                    }}
                  >
                    اضغط على زر العرض لمراجعة تفاصيل طلاب كل مدرب
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: .6 }}>
                  <Chip
                    size="small"
                    label={`${trainers.length} مدرب`}
                    sx={{
                      fontWeight: 900,
                      color: PRIMARY_COLOR,
                      bgcolor: alpha(PRIMARY_COLOR, isDark ? .11 : .07),
                      border: `1px solid ${alpha(PRIMARY_COLOR, .16)}`,
                    }}
                  />
                  {fetching && (
                    <CircularProgress size={18} sx={{ color: PRIMARY_COLOR }} />
                  )}
                </Box>
              </Box>

              <Box
                sx={uiLayout.withUiSx({
                  width: '100%',
                  height: isDesktop ? 560 : { xs: '72dvh', sm: '74dvh', md: '76dvh' },
                  minWidth: 0,
                  backgroundColor: dashboardColors.surface,
                }, uiLayout.tableContainerSx)}
              >
                <DataGrid
                  rows={trainers}
                  columns={responsiveTrainerColumns}
                  autoHeight={false}
                  disableRowSelectionOnClick
                  disableColumnMenu={!isDesktop}
                  disableColumnFilter={!isDesktop}
                  loading={fetching}
                  rowHeight={isDesktop ? 52 : isPhone ? 36 : 42}
                  columnHeaderHeight={isDesktop ? 50 : isPhone ? 34 : 40}
                  paginationModel={trainerPaginationModel}
                  onPaginationModelChange={setTrainerPaginationModel}
                  sx={uiLayout.withUiSx({
                    fontFamily: "'Tajawal', 'Cairo', sans-serif",
                    color: dashboardColors.text,
                    border: 'none',
                    backgroundColor: dashboardColors.surface,
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: dashboardColors.surfaceRaised,
                      borderBottom: `1px solid ${dashboardColors.borderStrong}`,
                      minHeight: `${isDesktop ? 50 : isPhone ? 34 : 40}px !important`,
                      maxHeight: `${isDesktop ? 50 : isPhone ? 34 : 40}px !important`,
                    },
                    '& .MuiDataGrid-columnHeader': {
                      '&:focus, &:focus-within': { outline: 'none' },
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 900,
                      fontSize: isDesktop ? '13px' : "0.75rem",
                      lineHeight: 1.15,
                      whiteSpace: 'normal',
                      textAlign: 'center',
                      color: isDark ? '#cfe2d8' : '#315e4b',
                    },
                    '& .MuiDataGrid-cell': {
                      color: dashboardColors.text,
                      borderBottom: `1px solid ${dashboardColors.border}`,
                      fontSize: isDesktop ? '13px' : "0.75rem",
                      fontWeight: 600,
                      px: isDesktop ? 1 : { xs: 0.2, sm: 0.45 },
                      '&:focus, &:focus-within': { outline: 'none' },
                    },
                    '& .MuiDataGrid-row': {
                      backgroundColor: dashboardColors.surface,
                      transition: 'background-color .15s ease',
                      '&:nth-of-type(even)': {
                        backgroundColor: isDark ? 'rgba(255,255,255,.012)' : 'rgba(5,117,70,.012)',
                      },
                      '&:hover': {
                        backgroundColor: alpha(PRIMARY_COLOR, isDark ? .07 : .045),
                      },
                    },
                    '& .MuiDataGrid-footerContainer': {
                      color: dashboardColors.text,
                      borderTop: `1px solid ${dashboardColors.border}`,
                      backgroundColor: dashboardColors.surfaceSoft,
                    },
                    '& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      color: dashboardColors.muted,
                    },
                    '& .MuiDataGrid-overlay': {
                      backgroundColor: dashboardColors.surface,
                      color: dashboardColors.muted,
                    },
                  }, uiLayout.dataGridSx)}
                  localeText={{
                    noRowsLabel: "لا توجد بيانات متاحة",
                    noResultsOverlayLabel: "لم يتم العثور على نتائج",
                    errorOverlayDefaultLabel: "حدث خطأ في جلب البيانات",
                    footerTotalRows: "إجمالي الصفوف:",
                  }}
                  pageSizeOptions={[30, 60, 100]}
                />
              </Box>
            </CardContent>
          </Card>

          {/* ديلوج تفاصيل المدرب */}
          <Dialog
            open={trainerDialogOpen}
            onClose={() => setTrainerDialogOpen(false)}
            maxWidth="xl"
            fullWidth
            fullScreen={isPhone}
            sx={uiLayout.withUiSx({
              '& .MuiDialog-paper': {
                borderRadius: isDesktop ? 3 : isPhone ? 0 : 2,
                minHeight: isDesktop ? '80vh' : isPhone ? '100dvh' : '86dvh',
                maxHeight: isPhone ? '100dvh' : '92dvh',
                m: isPhone ? 0 : 1,
              }
            }, uiLayout.dialogLayoutSx)}
          >
            <DialogTitle sx={{
              bgcolor: PRIMARY_COLOR,
              color: 'white',
              py: isDesktop ? 3 : { xs: 0.6, sm: 0.8, md: 1 },
              px: isDesktop ? 3 : { xs: 0.75, sm: 1, md: 1.2 },
              textAlign: 'center',
              fontSize: isDesktop ? '1.5rem' : { xs: "0.75rem", sm: '0.78rem', md: '0.9rem' },
              fontWeight: 'bold',
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={isDesktop ? 2 : 0.45}>
                <PersonIcon fontSize="large" />
                طلاب المدرب - {selectedTrainer?.مسؤول_الاتصال}
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: isDesktop ? 3 : { xs: 0.45, sm: 0.7, md: 0.95 } }}>
              <Grid container spacing={isDesktop ? 2 : 0.35} sx={{ mb: isDesktop ? 3 : 0.5 }}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.35, sm: 0.5, md: 0.65 }, bgcolor: alpha(PRIMARY_COLOR, 0.1) }}>
                    <Typography variant="h6" fontWeight="bold" color={PRIMARY_COLOR_DARK}>{dialogTotalStudents}</Typography>
                    <Typography variant="body2" color="text.secondary">إجمالي الطلاب</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.35, sm: 0.5, md: 0.65 }, bgcolor: alpha('#4caf50', 0.1) }}>
                    <Typography variant="h6" fontWeight="bold" color="#2e7d32">{dialogPaidStudents}</Typography>
                    <Typography variant="body2" color="text.secondary">مسددين</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.35, sm: 0.5, md: 0.65 }, bgcolor: alpha('#ff9800', 0.1) }}>
                    <Typography variant="h6" fontWeight="bold" color="#ed6c02">{dialogNotedStudents}</Typography>
                    <Typography variant="body2" color="text.secondary">متابعة</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.35, sm: 0.5, md: 0.65 }, bgcolor: alpha('#f44336', 0.1) }}>
                    <Typography variant="h6" fontWeight="bold" color="#c62828">{dialogLateStudents}</Typography>
                    <Typography variant="body2" color="text.secondary">متأخرين</Typography>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mb: isDesktop ? 3 : 0.5 }}>
                <FormControl sx={uiLayout.withUiSx({ minWidth: isDesktop ? 200 : 0, width: isDesktop ? 'auto' : '100%' }, uiLayout.formFieldSx)}>
                  <InputLabel>فلتر حسب الحالة</InputLabel>
                  <Select
                    value={filterStatus}
                    label="فلتر حسب الحالة"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">جميع الطلاب</MenuItem>
                    <MenuItem value="paid">مسددين</MenuItem>
                    <MenuItem value="note">متابعة</MenuItem>
                    <MenuItem value="late">متأخرين</MenuItem>
                    <MenuItem value="none">بدون حالة</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {studentsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={40} sx={{ color: PRIMARY_COLOR }} />
                </Box>
              ) : filteredStudents.length === 0 ? (
                <Typography align="center" py={4} color="text.secondary">
                  لا توجد بيانات للطلاب
                </Typography>
              ) : (
                <Box sx={uiLayout.withUiSx({ height: isDesktop ? 500 : { xs: '72dvh', sm: '70dvh', md: '72dvh' }, width: '100%', minWidth: 0 }, uiLayout.tableContainerSx)}>
                  <DataGrid
                    rows={filteredStudents}
                    columns={responsiveStudentColumns}
                    disableRowSelectionOnClick
                    disableColumnMenu={!isDesktop}
                    disableColumnFilter={!isDesktop}
                    rowHeight={isDesktop ? 52 : isPhone ? 36 : 42}
                    columnHeaderHeight={isDesktop ? 56 : isPhone ? 34 : 40}
                    paginationModel={studentPaginationModel}
                    onPaginationModelChange={setStudentPaginationModel}
                    sx={uiLayout.withUiSx({
                      fontFamily: "'Tajawal', 'Cairo', sans-serif",
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: PRIMARY_COLOR_SUPER_LIGHT,
                        borderBottom: `2px solid ${PRIMARY_COLOR}`,
                      },
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 700,
                        color: PRIMARY_COLOR_DARK,
                        fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                        whiteSpace: 'normal',
                        lineHeight: 1.15,
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                        fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                        px: isDesktop ? undefined : { xs: 0.2, sm: 0.45 },
                      },
                      '& .status-paid': { backgroundColor: '#dcfce7 !important' },
                      '& .status-note': { backgroundColor: '#fef9c3 !important' },
                      '& .status-late': { backgroundColor: '#fee2e2 !important' },
                    }, uiLayout.dataGridSx)}
                    getRowClassName={(params) => {
                      const studentId = params.row.nationalId || params.row.id;
                      const status = rowStatuses[studentId];
                      if (params.row.monthpay > 0) return 'status-paid';
                      if (status === 'paid') return 'status-paid';
                      if (status === 'note') return 'status-note';
                      if (status === 'late') return 'status-late';
                      return '';
                    }}
                    pageSizeOptions={[30, 60, 100]}
                    
                  />
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={uiLayout.withUiSx({ p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.8 } }, uiLayout.dialogActionsSx)}>
              <Button
                onClick={() => setTrainerDialogOpen(false)}
                variant="contained"
                sx={uiLayout.withUiSx({ backgroundColor: PRIMARY_COLOR, '&:hover': { backgroundColor: PRIMARY_COLOR_DARK } }, uiLayout.buttonSx)}
              >
                إغلاق
              </Button>
            </DialogActions>
          </Dialog>

          <Box display="flex" justifyContent="center" mt={isDesktop ? 4 : { xs: 0.6, sm: 0.8, md: 1 }}>
            <Button
              sx={uiLayout.withUiSx({
                fontWeight: "bold",
                px: isDesktop ? 6 : { xs: 1.2, sm: 1.6, md: 2 },
                py: isDesktop ? 1.8 : { xs: 0.45, sm: 0.6, md: 0.75 },
                fontSize: isDesktop ? 16 : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                borderRadius: 3,
                bgcolor: PRIMARY_COLOR,
                color: "#fff",
                boxShadow: `0 4px 14px ${alpha(PRIMARY_COLOR, 0.3)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: PRIMARY_COLOR_DARK,
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 20px ${alpha(PRIMARY_COLOR, 0.4)}`,
                },
              }, uiLayout.buttonSx)}
              size="large"
              variant="contained"
              onClick={() => navigate("/dashboard")}
            >
              🏠 الرجوع للرئيسية
            </Button>
          </Box>
        </Box>
      </Box>
    </LocalizationProvider></NavigationShell>
  );
};

export default SpecialComponent;