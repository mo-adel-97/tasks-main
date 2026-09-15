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

  // عرض تفاصيل القرار الإداري (محدث: المكافأة للفرع مرة واحدة)
  const renderCommissionPolicyCard = () => (
    <Card
      sx={{
        mb: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.9 },
        borderRadius: isDesktop ? 3 : 1.5,
        boxShadow: isDesktop ? 3 : 1,
        border: `${isDesktop ? 2 : 1}px solid ${PRIMARY_COLOR}`,
      }}
    >
      <CardContent sx={{ p: isDesktop ? 2.2 : { xs: 0.45, sm: 0.65, md: 0.9 } }}>
        <Box display="flex" alignItems="center" gap={isDesktop ? 1 : 0.35} mb={isDesktop ? 2 : 0.45}>
          <EmojiEventsIcon sx={{ color: PRIMARY_COLOR_DARK, fontSize: isDesktop ? 24 : { xs: 14, sm: 16, md: 18 } }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR_DARK }}>
            📋 القرار الإداري رقم 7 لعام 2025 - نظام العمولة (على مستوى الفرع)
          </Typography>
        </Box>

        <Grid container spacing={isDesktop ? 2 : { xs: 0.35, sm: 0.5, md: 0.7 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: isDesktop ? 1.5 : { xs: 0.35, sm: 0.5, md: 0.65 }, minHeight: isDesktop ? undefined : { xs: 72, sm: 82, md: 90 }, bgcolor: alpha('#f44336', 0.1) }}>
              <Typography variant="h4" sx={{ mb: 1, color: '#f44336' }}>❌</Typography>
              <Typography variant="h6" fontWeight="bold" color="#f44336">أقل من 45%</Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 1, color: '#f44336' }}>لا عمولة</Typography>
              {isDesktop && (
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#f44336' }}>
                لا يستحق عمولة حسب القرار الإداري
              </Typography>
            )}
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: isDesktop ? 1.5 : { xs: 0.35, sm: 0.5, md: 0.65 }, minHeight: isDesktop ? undefined : { xs: 72, sm: 82, md: 90 }, bgcolor: alpha('#4caf50', 0.1) }}>
              <Typography variant="h4" sx={{ mb: 1, color: '#4caf50' }}>💰</Typography>
              <Typography variant="h6" fontWeight="bold" color="#4caf50">45% - 75%</Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 1, color: '#4caf50' }}>0.5% عمولة</Typography>
              {isDesktop && (
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#4caf50' }}>
                نصف في المية من إجمالي التحصيل
              </Typography>
            )}
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: isDesktop ? 1.5 : { xs: 0.35, sm: 0.5, md: 0.65 }, minHeight: isDesktop ? undefined : { xs: 72, sm: 82, md: 90 }, bgcolor: alpha('#2196f3', 0.1) }}>
              <Typography variant="h4" sx={{ mb: 1, color: '#2196f3' }}>🎯</Typography>
              <Typography variant="h6" fontWeight="bold" color="#2196f3">76% - 85%</Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 1, color: '#2196f3' }}>0.5% + 250﷼</Typography>
              {isDesktop && (
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#2196f3' }}>
                مكافأة 250 ريال (مرة واحدة للفرع)
              </Typography>
            )}
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: isDesktop ? 1.5 : { xs: 0.35, sm: 0.5, md: 0.65 }, minHeight: isDesktop ? undefined : { xs: 72, sm: 82, md: 90 }, bgcolor: alpha('#9c27b0', 0.1) }}>
              <Typography variant="h4" sx={{ mb: 1, color: '#9c27b0' }}>🏆</Typography>
              <Typography variant="h6" fontWeight="bold" color="#9c27b0">86% - 100%</Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 1, color: '#9c27b0' }}>0.5% + 500﷼</Typography>
              {isDesktop && (
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#9c27b0' }}>
                مكافأة 500 ريال (مرة واحدة للفرع)
              </Typography>
            )}
            </Card>
          </Grid>
        </Grid>

        {isDesktop && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }} icon={<InfoIcon />}>
            <Typography variant="body2" fontWeight="bold">
              النسبة والـ Bonus يتم حسابهم على إجمالي الفرع، والعمولة (0.5%) تطبق على إجمالي التحصيل.
            </Typography>
          </Alert>
        )}
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
              color: '#2d3748',
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
            border: '1px solid #e0e0e0',
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
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1401,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(14px)',
            color: '#17372b',
            borderBottom: '1px solid rgba(5,117,70,0.12)',
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
            p: isDesktop ? 4 : {
              xs: 0.35,
              sm: 0.6,
              md: 0.9
            },
            pt: isDesktop ? 4 : {
              xs: "var(--app-header-height, 56px)",
              sm: "var(--app-header-height, 56px)",
              md: "var(--app-header-height, 56px)"
            },
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
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
            sx={{
              mb: isDesktop ? 4 : { xs: 0.45, sm: 0.7, md: 1 },
              borderRadius: isDesktop ? 4 : { xs: 1.5, sm: 1.8, md: 2.2 },
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_COLOR_DARK} 100%)`,
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #80b49e, #9ac8b5, #80b49e)',
              }
            }}
          >
            <CardContent sx={{ p: isDesktop ? 4 : { xs: 0.65, sm: 0.9, md: 1.2 }, position: 'relative', zIndex: 1 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={isDesktop ? 3 : { xs: 0.5, sm: 0.8, md: 1 }}
              >
                <Box display="flex" alignItems="center" gap={isDesktop ? 2 : { xs: 0.45, sm: 0.65, md: 0.8 }}>
                  <Box sx={{
                    p: isDesktop ? 2 : { xs: 0.5, sm: 0.65, md: 0.8 },
                    borderRadius: isDesktop ? 3 : 1.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <BusinessIcon sx={{ color: 'white', fontSize: isDesktop ? 32 : { xs: 17, sm: 20, md: 22 } }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color="white"
                      sx={{
                        mb: isDesktop ? 0.5 : 0,
                        fontSize: isDesktop ? undefined : { xs: '0.8rem', sm: '0.92rem', md: '1.04rem' },
                      }}
                    >
                      لوحة التحكم - المدربين
                    </Typography>
                  </Box>
                </Box>

                <Box
                  display="flex"
                  gap={2}
                  alignItems="center"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    p: isDesktop ? 2 : { xs: 0.45, sm: 0.6, md: 0.75 },
                    borderRadius: isDesktop ? 3 : 1.5
                  }}
                >
                  <CalendarTodayIcon sx={{ color: 'white', fontSize: isDesktop ? 24 : { xs: 14, sm: 16, md: 18 } }} />
                  <Typography variant="body1" color="white" fontWeight="500">
                    {fromDate.format('YYYY/MM/DD')} - {toDate.format('YYYY/MM/DD')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {renderCommissionPolicyCard()}

          {/* الفلاتر */}
          <Card
            sx={{
              mb: isDesktop ? 4 : { xs: 0.45, sm: 0.65, md: 0.9 },
              borderRadius: isDesktop ? 3 : 1.5,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
              background: 'white'
            }}
          >
            <CardContent sx={{ p: isDesktop ? 3 : { xs: 0.5, sm: 0.7, md: 0.95 } }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: isDesktop ? 3 : 0.55, color: PRIMARY_COLOR_DARK }}>
                ⚙️ إعدادات الفلترة
              </Typography>
              <Box
                sx={uiLayout.withUiSx({
                  display: 'grid',
                  gridTemplateColumns: isDesktop
                    ? 'repeat(3, max-content)'
                    : isPhone
                      ? 'repeat(2, minmax(0, 1fr))'
                      : 'repeat(3, minmax(0, 1fr))',
                  gap: isDesktop ? 3 : { xs: 0.35, sm: 0.5, md: 0.7 },
                  alignItems: 'center',
                  width: '100%',
                }, uiLayout.filterBarSx)}
              >
                <DatePicker
                  label="من تاريخ"
                  value={fromDate}
                  onChange={(v) => v && setFromDate(v)}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      size: "medium",
                      sx: {
                        minWidth: isDesktop ? 180 : 0,
                        width: '100%',
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }
                    },
                  }}
                />
                <DatePicker
                  label="إلى تاريخ"
                  value={toDate}
                  onChange={(v) => v && setToDate(v)}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      size: "medium",
                      sx: {
                        minWidth: isDesktop ? 180 : 0,
                        width: '100%',
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }
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
                    px: isDesktop ? 4 : { xs: 0.7, sm: 1, md: 1.2 },
                    py: isDesktop ? 1.2 : { xs: 0.45, sm: 0.55, md: 0.7 },
                    width: isDesktop ? 'auto' : '100%',
                    gridColumn: isPhone ? '1 / -1' : 'auto',
                    borderRadius: 2,
                    backgroundColor: PRIMARY_COLOR_LIGHT,
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: PRIMARY_COLOR,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(PRIMARY_COLOR, 0.3)}`,
                    },
                    transition: 'all 0.2s ease'
                  }, uiLayout.buttonSx)}
                >
                  🔄 هذا الشهر
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* الإحصائيات */}
          <Grid
            container
            spacing={isDesktop ? 3 : { xs: 0.35, sm: 0.5, md: 0.7 }}
            sx={{ mb: isDesktop ? 4 : { xs: 0.5, sm: 0.75, md: 1 } }}
          >
            {/* إجمالي التحصيل */}
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.85 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: isDesktop ? 3 : 1.5,
                minHeight: isDesktop ? undefined : { xs: 78, sm: 88, md: 96 },
                background: `linear-gradient(135deg, ${PRIMARY_COLOR_SUPER_LIGHT} 0%, ${alpha(PRIMARY_COLOR, 0.2)} 100%)`,
                border: `1px solid ${alpha(PRIMARY_COLOR, 0.2)}`, height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha(PRIMARY_COLOR, 0.15)}` }
              }}>
                <Box sx={{
                  p: isDesktop ? 2 : { xs: 0.35, sm: 0.45, md: 0.55 },
                  borderRadius: '50%', backgroundColor: alpha(PRIMARY_COLOR, 0.1),
                  mb: isDesktop ? 2 : { xs: 0.25, sm: 0.35, md: 0.45 },
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AccountBalanceWalletIcon sx={{ color: PRIMARY_COLOR, fontSize: isDesktop ? 32 : { xs: 16, sm: 19, md: 21 } }} />
                </Box>
                <Typography variant="h6" fontWeight="600" color="text.secondary" textAlign="center">
                  إجمالي التحصيل
                </Typography>
                <Typography variant="h4" fontWeight="bold" color={PRIMARY_COLOR_DARK} mt={1} textAlign="center">
                  {Number(totalCollected || 0).toLocaleString("ar-EG")}
                  <span style={{ fontSize: isDesktop ? 18 : 12, marginRight: isDesktop ? 6 : 2, color: PRIMARY_COLOR }}>ر.س</span>
                </Typography>
              </Paper>
            </Grid>

            {/* عمولة النسبة فقط */}
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.85 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: isDesktop ? 3 : 1.5,
                minHeight: isDesktop ? undefined : { xs: 78, sm: 88, md: 96 },
                background: `linear-gradient(135deg, #f0f9ff 0%, ${alpha('#0ea5e9', 0.1)} 100%)`,
                border: `1px solid ${alpha('#0ea5e9', 0.2)}`, height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha('#0ea5e9', 0.15)}` }
              }}>
                <Box sx={{
                  p: isDesktop ? 2 : { xs: 0.35, sm: 0.45, md: 0.55 },
                  borderRadius: '50%', backgroundColor: alpha('#0ea5e9', 0.1),
                  mb: isDesktop ? 2 : { xs: 0.25, sm: 0.35, md: 0.45 },
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <PercentIcon sx={{ color: '#0ea5e9', fontSize: isDesktop ? 32 : { xs: 16, sm: 19, md: 21 } }} />
                </Box>
                <Typography variant="h6" fontWeight="600" color="text.secondary" textAlign="center">
                  إجمالي العمولة (0.5% فقط)
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="#0c4a6e" mt={1} textAlign="center">
                  {Number(totalCommissionOnly || 0).toLocaleString("ar-EG")}
                  <span style={{ fontSize: isDesktop ? 18 : 12, marginRight: isDesktop ? 6 : 2, color: '#0ea5e9' }}>ر.س</span>
                </Typography>
                {isDesktop && (
                  <Typography variant="body2" color="#0ea5e9" sx={{ mt: 1, textAlign: 'center' }}>
                    معدل الفرع الحالي: {overallCommissionRate}% | نسبة الفرع: {overallPercentage}%
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* مكافأة الفرع (مرة واحدة) */}
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.85 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: isDesktop ? 3 : 1.5,
                minHeight: isDesktop ? undefined : { xs: 78, sm: 88, md: 96 },
                background: `linear-gradient(135deg, #fdf2f8 0%, ${alpha('#db2777', 0.08)} 100%)`,
                border: `1px solid ${alpha('#db2777', 0.18)}`, height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha('#db2777', 0.12)}` }
              }}>
                <Box sx={{
                  p: isDesktop ? 2 : { xs: 0.35, sm: 0.45, md: 0.55 },
                  borderRadius: '50%', backgroundColor: alpha('#db2777', 0.1),
                  mb: isDesktop ? 2 : { xs: 0.25, sm: 0.35, md: 0.45 },
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <EmojiEventsIcon sx={{ color: '#db2777', fontSize: isDesktop ? 32 : { xs: 16, sm: 19, md: 21 } }} />
                </Box>
                <Typography variant="h6" fontWeight="600" color="text.secondary" textAlign="center">
                  مكافأة الفرع
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="#9d174d" mt={1} textAlign="center">
                  {Number(overallBonus || 0).toLocaleString("ar-EG")}
                  <span style={{ fontSize: isDesktop ? 18 : 12, marginRight: isDesktop ? 6 : 2, color: '#db2777' }}>ر.س</span>
                </Typography>
                {isDesktop && (
                  <Typography variant="body2" color="#db2777" sx={{ mt: 1, textAlign: 'center' }}>
                    حسب نسبة الفرع الكلية
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* الإجمالي النهائي */}
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.85 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: isDesktop ? 3 : 1.5,
                minHeight: isDesktop ? undefined : { xs: 78, sm: 88, md: 96 },
                background: `linear-gradient(135deg, #ecfdf5 0%, ${alpha('#10b981', 0.1)} 100%)`,
                border: `1px solid ${alpha('#10b981', 0.2)}`, height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha('#10b981', 0.15)}` }
              }}>
                <Box sx={{
                  p: isDesktop ? 2 : { xs: 0.35, sm: 0.45, md: 0.55 },
                  borderRadius: '50%', backgroundColor: alpha('#10b981', 0.1),
                  mb: isDesktop ? 2 : { xs: 0.25, sm: 0.35, md: 0.45 },
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AttachMoneyIcon sx={{ color: '#10b981', fontSize: isDesktop ? 32 : { xs: 16, sm: 19, md: 21 } }} />
                </Box>
                <Typography variant="h6" fontWeight="600" color="text.secondary" textAlign="center">
                  إجمالي العمولة النهائي
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="#065f46" mt={1} textAlign="center">
                  {Number(totalFinalCommission || 0).toLocaleString("ar-EG")}
                  <span style={{ fontSize: isDesktop ? 18 : 12, marginRight: isDesktop ? 6 : 2, color: '#10b981' }}>ر.س</span>
                </Typography>
                {isDesktop && (
                  <Typography variant="body2" color="#059669" sx={{ mt: 1, textAlign: 'center', fontWeight: 'bold' }}>
                    (0.5% من التحصيل) + مكافأة الفرع
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* إجمالي الطلاب */}
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.85 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: isDesktop ? 3 : 1.5,
                minHeight: isDesktop ? undefined : { xs: 78, sm: 88, md: 96 },
                background: `linear-gradient(135deg, #fefce8 0%, ${alpha('#eab308', 0.1)} 100%)`,
                border: `1px solid ${alpha('#eab308', 0.2)}`, height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha('#eab308', 0.15)}` }
              }}>
                <Box sx={{
                  p: isDesktop ? 2 : { xs: 0.35, sm: 0.45, md: 0.55 },
                  borderRadius: '50%', backgroundColor: alpha('#eab308', 0.1),
                  mb: isDesktop ? 2 : { xs: 0.25, sm: 0.35, md: 0.45 },
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <GroupIcon sx={{ color: '#eab308', fontSize: isDesktop ? 32 : { xs: 16, sm: 19, md: 21 } }} />
                </Box>
                <Typography variant="h6" fontWeight="600" color="text.secondary" textAlign="center">
                  إجمالي الطلاب
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="#713f12" mt={1} textAlign="center">
                  {totalStudents}
                  <span style={{ fontSize: isDesktop ? 18 : 12, marginRight: isDesktop ? 6 : 2, color: '#eab308' }}>طالب</span>
                </Typography>
              </Paper>
            </Grid>

            {/* غير مسددين */}
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.85 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: isDesktop ? 3 : 1.5,
                minHeight: isDesktop ? undefined : { xs: 78, sm: 88, md: 96 },
                background: `linear-gradient(135deg, #fee2e2 0%, ${alpha('#ef4444', 0.1)} 100%)`,
                border: `1px solid ${alpha('#ef4444', 0.2)}`, height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha('#ef4444', 0.15)}` }
              }}>
                <Box sx={{
                  p: isDesktop ? 2 : { xs: 0.35, sm: 0.45, md: 0.55 },
                  borderRadius: '50%', backgroundColor: alpha('#ef4444', 0.1),
                  mb: isDesktop ? 2 : { xs: 0.25, sm: 0.35, md: 0.45 },
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MonetizationOnIcon sx={{ color: '#ef4444', fontSize: isDesktop ? 32 : { xs: 16, sm: 19, md: 21 } }} />
                </Box>
                <Typography variant="h6" fontWeight="600" color="text.secondary" textAlign="center">
                  غير مسددين
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="#dc2626" mt={1} textAlign="center">
                  {totalUnpaid}
                  <span style={{ fontSize: isDesktop ? 18 : 12, marginRight: isDesktop ? 6 : 2, color: '#ef4444' }}>طالب</span>
                </Typography>
              </Paper>
            </Grid>

            {/* نسبة التحصيل الكلية */}
            <Grid item xs={6} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.85 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: isDesktop ? 3 : 1.5,
                minHeight: isDesktop ? undefined : { xs: 78, sm: 88, md: 96 },
                background: `linear-gradient(135deg, #ecfdf5 0%, ${alpha('#10b981', 0.1)} 100%)`,
                border: `1px solid ${alpha('#10b981', 0.2)}`, height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha('#10b981', 0.15)}` }
              }}>
                <Box sx={{
                  p: isDesktop ? 2 : { xs: 0.35, sm: 0.45, md: 0.55 },
                  borderRadius: '50%', backgroundColor: alpha('#10b981', 0.1),
                  mb: isDesktop ? 2 : { xs: 0.25, sm: 0.35, md: 0.45 },
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <TrendingUpIcon sx={{ color: '#10b981', fontSize: isDesktop ? 32 : { xs: 16, sm: 19, md: 21 } }} />
                </Box>
                <Typography variant="h6" fontWeight="600" color="text.secondary" textAlign="center">
                  📈 نسبة التحصيل الكلية
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="#065f46" mt={1} textAlign="center">
                  {overallPercentage}%
                </Typography>
                {isDesktop && (
                  <Typography variant="body2" color="#10b981" sx={{ mt: 1, textAlign: 'center' }}>
                    (المعيار الحاكم للعمولة والمكافأة)
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* الجدول الرئيسي */}
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
            background: 'white',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{
                p: isDesktop ? 3 : { xs: 0.45, sm: 0.6, md: 0.8 },
                borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                background: `linear-gradient(135deg, ${PRIMARY_COLOR_SUPER_LIGHT} 0%, ${alpha(PRIMARY_COLOR, 0.05)} 100%)`
              }}>
                <Typography variant="h5" fontWeight="bold" align="center" sx={{ color: PRIMARY_COLOR_DARK }}>
                  📊 كشف المدربين وتحصيلاتهم
                </Typography>
              </Box>

              <Box
                sx={uiLayout.withUiSx({
                  width: '100%',
                  height: isDesktop ? 600 : { xs: '72dvh', sm: '74dvh', md: '76dvh' },
                  minWidth: 0,
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
                  columnHeaderHeight={isDesktop ? 60 : isPhone ? 34 : 40}
                  paginationModel={trainerPaginationModel}
                  onPaginationModelChange={setTrainerPaginationModel}
                  sx={uiLayout.withUiSx({
                    fontFamily: "'Tajawal', 'Cairo', sans-serif",
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: PRIMARY_COLOR_SUPER_LIGHT,
                      borderBottom: `2px solid ${PRIMARY_COLOR}`,
                      minHeight: `${isDesktop ? 60 : isPhone ? 34 : 40}px !important`,
                      maxHeight: `${isDesktop ? 60 : isPhone ? 34 : 40}px !important`,
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 800,
                      fontSize: isDesktop ? '14px' : isPhone ? "0.75rem" : "0.75rem",
                      lineHeight: 1.15,
                      whiteSpace: 'normal',
                      textAlign: 'center',
                      color: PRIMARY_COLOR_DARK,
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                      fontSize: isDesktop ? '14px' : isPhone ? "0.75rem" : "0.75rem",
                      fontWeight: 500,
                      px: isDesktop ? undefined : { xs: 0.2, sm: 0.45 },
                    },
                    '& .MuiDataGrid-row': {
                      transition: 'all 0.2s ease',
                      '&:hover': { backgroundColor: alpha(PRIMARY_COLOR, 0.03), transform: 'scale(1.002)' },
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
                      backgroundColor: PRIMARY_COLOR_SUPER_LIGHT,
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