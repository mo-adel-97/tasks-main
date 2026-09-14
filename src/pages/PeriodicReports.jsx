import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  styled,
  Divider,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Badge,
  alpha
} from '@mui/material';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  BarChart as ChartIcon,
  EmojiEvents as TrophyIcon,
  Block as BlockIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Document, Paragraph, Packer, AlignmentType, HeadingLevel, Table as DocxTable, TableRow as DocxRow, TableCell as DocxCell, WidthType, BorderStyle } from 'docx';


// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Color palette based on #80b49e
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
  error: '#f44336'
};

/* =================== Styled Components =================== */
const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  background: 'linear-gradient(135deg, #ffffff, #f8fbf9)',
  border: `1px solid ${colorPalette.primaryLighter}`,
  borderRadius: '16px',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 25px ${alpha(colorPalette.primary, 0.15)}`
  }
}));

const ChartCard = styled(Card)(({ theme }) => ({
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  background: 'linear-gradient(135deg, #ffffff, #f8fbf9)',
  border: `1px solid ${colorPalette.primaryLighter}`,
  borderRadius: '16px',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha(colorPalette.primary, 0.1)}`
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: colorPalette.primaryLighter,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: alpha(colorPalette.primary, 0.08),
    transform: 'translateY(-1px)',
    transition: 'all 0.2s ease',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 500,
  borderColor: colorPalette.primaryLighter,
}));

const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  borderTop: `2px solid ${colorPalette.primaryLighter}`,
  backgroundColor: colorPalette.background,
  '& .MuiTablePagination-selectLabel': {
    marginTop: '1.5px',
    marginBottom: 0,
    fontSize: '0.875rem',
    color: colorPalette.textLight,
    fontWeight: 600
  },
  '& .MuiTablePagination-displayedRows': {
    marginTop: '1.5px',
    marginBottom: 0,
    fontSize: '0.875rem',
    color: colorPalette.textDark,
    fontWeight: 600
  },
  '& .MuiTablePagination-actions': {
    marginRight: '8px',
    '& button': {
      padding: '6px',
      margin: '0 4px',
      border: `1px solid ${colorPalette.primaryLight}`,
      borderRadius: '8px',
      color: colorPalette.primary,
      '&:hover': { 
        backgroundColor: colorPalette.primaryLighter,
        borderColor: colorPalette.primary,
      },
      '&.Mui-disabled': {
        borderColor: colorPalette.primaryLighter,
        color: colorPalette.primaryLight,
      }
    }
  },
  '& .MuiSelect-select': {
    padding: '8px 12px 8px 32px',
    borderRadius: '8px',
    border: `1px solid ${colorPalette.primaryLight}`,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colorPalette.textDark,
    '&:focus': {
      borderColor: colorPalette.primary,
      backgroundColor: colorPalette.primaryLighter,
    }
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 600,
  fontSize: '1rem',
  margin: '0 8px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  '&.Mui-selected': {
    backgroundColor: colorPalette.primaryLighter,
    color: colorPalette.primaryDark,
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.2)}`,
  },
  '&:hover': {
    backgroundColor: alpha(colorPalette.primary, 0.1),
    transform: 'translateY(-1px)',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 700,
  borderRadius: '10px',
  padding: '10px 24px',
  transition: 'all 0.3s ease',
  textTransform: 'none',
  fontSize: '0.95rem',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha(colorPalette.primary, 0.3)}`,
  }
}));

const ProgressBar = styled(Box)(({ theme, value }) => ({
  width: '100%',
  height: 8,
  backgroundColor: colorPalette.primaryLighter,
  borderRadius: 4,
  overflow: 'hidden',
  '&::after': {
    content: '""',
    display: 'block',
    height: '100%',
    width: `${value}%`,
    backgroundColor: value >= 80 ? colorPalette.success :
                   value >= 60 ? colorPalette.warning :
                   colorPalette.error,
    transition: 'width 0.5s ease',
    borderRadius: '4px'
  }
}));

const ViewMoreButton = styled(Button)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 600,
  marginTop: theme.spacing(1),
  fontSize: '0.875rem',
  color: colorPalette.primary,
  '&:hover': {
    backgroundColor: colorPalette.primaryLighter,
  }
}));

/* =================== Main Component =================== */
const PeriodicReports = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  /* Screen access is centralized in Form_Name + User_Premision via PrivateRoute. */

  /* ============== Tabs ============== */
  const [selectedTab, setSelectedTab] = useState(0);
  const handleTabChange = (event, newValue) => {
    setTimeout(() => {
      switch(newValue) {
        case 0:
          navigate('/periodic-reports');
          break;
        case 1:
          navigate('/monthly');
          break;
        case 2:
          navigate('/daily');
          break;
        case 3:
          navigate('/attendance');
          break;
        default:
          break;
      }
    }, 100);
  };

  /* ============== State ============== */
  const [data, setData] = useState([]);
  const [students, setStudents] = useState([]);
  const [branchName, setBranchName] = useState('جارٍ التحميل...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [diplomaFilter, setDiplomaFilter] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('');
  const [trainers, setTrainers] = useState([]);

  /* ============== Dialogs State ============== */
  const [allTrainersDialog, setAllTrainersDialog] = useState(false);
  const [allDiplomasDialog, setAllDiplomasDialog] = useState(false);
  const [diplomaDetailsDialog, setDiplomaDetailsDialog] = useState(false);
  const [trainerDetailsDialog, setTrainerDetailsDialog] = useState(false);
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const fetchTrainers = async () => {
    try {
      const response = await fetch('https://api1.sstli.com/api/userinfo');
      if (!response.ok) throw new Error('Failed to fetch trainers');
      const data = await response.json();
      setTrainers(data);
      return data;
    } catch (err) {
      console.error('Error fetching trainers:', err);
      return [];
    }
  };

  /* ============== Fetchers ============== */
  const fetchBranchName = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.guid) throw new Error('User GUID not found');

      const response = await fetch(`https://api3.sstli.com/api/Trainer/UserBranchForWork?userGuid=${user.guid}`);
      if (!response.ok) throw new Error('Failed to fetch branch name');
      const data = await response.json();
      setBranchName(data?.[0]?.brEName ?? 'غير محدد');
    } catch (err) {
      console.error('Error fetching branch name:', err);
      setBranchName('غير محدد');
    }
  };

  const fetchStudents = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.branchForWork) throw new Error('Branch information not found');

      const response = await fetch(`https://api1.sstli.com/api/StudentStudyInfo/by-branch/${user.branchForWork}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchBranchName();
      const studentsData = await fetchStudents();

      const response = await fetch('https://filesregsiteration.sstli.com/get_attendance.php');
      const result = await response.json();

      if (result.success && studentsData.length > 0) {
        const branchStudentIds = studentsData.map(student => student.nationalId);
        const periodData = result.data
          .filter(item => {
            const itemDate = parseISO(item.attendance_date);
            const start = startOfDay(new Date(startDate));
            const end = endOfDay(new Date(endDate));
            return isWithinInterval(itemDate, { start, end }) && 
                   branchStudentIds.includes(item.national_id);
          });

        setData(periodData);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await fetchBranchName();
        await fetchTrainers();
        await fetchStudents();
        
        const response = await fetch('https://filesregsiteration.sstli.com/get_attendance.php');
        const result = await response.json();

        if (result.success && students.length > 0) {
          const branchStudentIds = students.map(student => student.nationalId);
          const periodData = result.data
            .filter(item => {
              const itemDate = parseISO(item.attendance_date);
              const start = startOfDay(new Date(startDate));
              const end = endOfDay(new Date(endDate));
              return isWithinInterval(itemDate, { start, end }) && 
                     branchStudentIds.includes(item.national_id);
            });

          setData(periodData);
        } else {
          setData([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [startDate, endDate]);

  const getTrainerName = (trainerGuid) => {
    if (!trainerGuid || trainerGuid === 'غير معروف') return 'غير معروف';
    
    const trainer = trainers.find(t => t.guid === trainerGuid);
    return trainer ? trainer.fullName : trainerGuid;
  };

  /* ============== Handlers ============== */
  const handleRefresh = () => { fetchData(); setPage(0); };
  const handleSearch = (e) => { setSearchTerm(e.target.value); setPage(0); };
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { 
    setRowsPerPage(parseInt(event.target.value, 10)); 
    setPage(0); 
  };
  const clearFilters = () => { 
    setDiplomaFilter(''); 
    setTrainerFilter(''); 
    setPage(0); 
  };

  /* ============== Dialog Handlers ============== */
  const handleViewAllTrainers = () => {
    setAllTrainersDialog(true);
  };

  const handleViewAllDiplomas = () => {
    setAllDiplomasDialog(true);
  };

  const handleViewDiplomaDetails = (diploma) => {
    setSelectedDiploma(diploma);
    setDiplomaDetailsDialog(true);
  };

  const handleViewTrainerDetails = (trainer) => {
    setSelectedTrainer(trainer);
    setTrainerDetailsDialog(true);
  };

  const handleFilterByDiploma = (diplomaName) => {
    setDiplomaFilter(diplomaName);
    setAllDiplomasDialog(false);
    setPage(0);
  };

  const handleFilterByTrainer = (trainerGuid) => {
    setTrainerFilter(trainerGuid);
    setAllTrainersDialog(false);
    setPage(0);
  };

  /* ============== Analytics Calculations ============== */
  const analytics = useMemo(() => {
    if (!data.length || !students.length) return null;

    const IDEAL_ATTENDANCE_DAYS = 14;

    const studentStats = students.map(student => {
      const studentAttendance = data.filter(item => item.national_id === student.nationalId);
      const attendedDays = [...new Set(studentAttendance.map(item => item.attendance_date))].length;
      const attendancePercentage = Math.round((attendedDays / IDEAL_ATTENDANCE_DAYS) * 100);
      const finalPercentage = Math.min(attendancePercentage, 100);
      
      return {
        ...student,
        attendedDays,
        idealDays: IDEAL_ATTENDANCE_DAYS,
        attendancePercentage: finalPercentage,
        totalRecords: studentAttendance.length,
        hasAttended: attendedDays > 0
      };
    });

    const diplomaStats = students.reduce((acc, student) => {
      const diploma = student.diplomName || 'غير محدد';
      if (!acc[diploma]) {
        acc[diploma] = {
          name: diploma,
          totalStudents: 0,
          attendedStudents: 0,
          attendancePercentage: 0,
          students: []
        };
      }
      acc[diploma].totalStudents++;
      
      const studentStat = studentStats.find(s => s.nationalId === student.nationalId);
      if (studentStat) {
        acc[diploma].students.push(studentStat);
        if (studentStat.hasAttended) {
          acc[diploma].attendedStudents++;
        }
      }
      return acc;
    }, {});

    Object.values(diplomaStats).forEach(diploma => {
      diploma.attendancePercentage = diploma.totalStudents > 0 
        ? Math.round((diploma.attendedStudents / diploma.totalStudents) * 100)
        : 0;
    });

    const trainerStats = data.reduce((acc, item) => {
      const trainerGuid = item.created_by || 'غير معروف';
      const trainerName = getTrainerName(trainerGuid);
      
      if (!acc[trainerGuid]) {
        acc[trainerGuid] = {
          guid: trainerGuid,
          name: trainerName,
          fullName: trainerName,
          totalRecords: 0,
          uniqueStudents: new Set(),
          studentDetails: []
        };
      }
      acc[trainerGuid].totalRecords++;
      acc[trainerGuid].uniqueStudents.add(item.national_id);
      
      const student = students.find(s => s.nationalId === item.national_id);
      if (student) {
        const existingStudent = acc[trainerGuid].studentDetails.find(s => s.nationalId === student.nationalId);
        if (!existingStudent) {
          acc[trainerGuid].studentDetails.push({
            ...student,
            attendanceCount: 1
          });
        } else {
          existingStudent.attendanceCount++;
        }
      }
      
      return acc;
    }, {});

    Object.values(trainerStats).forEach(trainer => {
      trainer.uniqueStudentsCount = trainer.uniqueStudents.size;
      trainer.uniqueStudents = Array.from(trainer.uniqueStudents);
      trainer.avgAttendancePerStudent = trainer.uniqueStudentsCount > 0 
        ? Math.round((trainer.totalRecords / trainer.uniqueStudentsCount) * 10) / 10 
        : 0;
    });

    const totalStudents = students.length;
    const totalAttendanceRecords = data.length;
    const avgAttendancePercentage = Object.values(diplomaStats).length > 0 
      ? Math.round(Object.values(diplomaStats).reduce((sum, diploma) => sum + diploma.attendancePercentage, 0) / Object.values(diplomaStats).length)
      : 0;

    const attendedStudents = studentStats.filter(student => student.hasAttended).length;
    const overallAttendanceRate = totalStudents > 0 
      ? Math.round((attendedStudents / totalStudents) * 100)
      : 0;

    const topStudents = [...studentStats]
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
      .slice(0, 5);

    const topDiplomas = Object.values(diplomaStats)
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
      .slice(0, 5);

    const topTrainers = Object.values(trainerStats)
      .sort((a, b) => b.totalRecords - a.totalRecords)
      .slice(0, 5);

    const allTrainers = Object.values(trainerStats)
      .sort((a, b) => b.totalRecords - a.totalRecords);

    const allDiplomas = Object.values(diplomaStats)
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage);

    const allDates = eachDayOfInterval({
      start: startOfDay(new Date(startDate)),
      end: endOfDay(new Date(endDate))
    });

    const dailyAttendance = allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayAttendance = data.filter(item => 
        format(parseISO(item.attendance_date), 'yyyy-MM-dd') === dateStr
      );
      return {
        date: dateStr,
        count: dayAttendance.length,
        formattedDate: format(date, 'MMM dd', { locale: arSA })
      };
    });

    const attendanceDistribution = {
      excellent: studentStats.filter(s => s.attendancePercentage >= 80).length,
      good: studentStats.filter(s => s.attendancePercentage >= 60 && s.attendancePercentage < 80).length,
      poor: studentStats.filter(s => s.attendancePercentage < 60).length,
      absent: studentStats.filter(s => s.attendancePercentage === 0).length
    };

    return {
      totalStudents,
      attendedStudents,
      totalAttendanceRecords,
      avgAttendancePercentage,
      overallAttendanceRate,
      idealDays: IDEAL_ATTENDANCE_DAYS,
      totalDays: IDEAL_ATTENDANCE_DAYS,
      studentStats,
      diplomaStats,
      trainerStats,
      topStudents,
      topDiplomas,
      topTrainers,
      allTrainers,
      allDiplomas,
      dailyAttendance,
      attendanceDistribution
    };
  }, [data, students, startDate, endDate]);

  /* ============== Chart Configurations ============== */
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: true,
        labels: {
          font: {
            family: '"Cairo", sans-serif',
            size: 12
          },
          color: colorPalette.textDark
        }
      },
      title: {
        display: true,
        font: {
          family: '"Cairo", sans-serif',
          size: 16,
          weight: 'bold'
        },
        color: colorPalette.textDark
      },
      tooltip: {
        titleFont: {
          family: '"Cairo", sans-serif'
        },
        bodyFont: {
          family: '"Cairo", sans-serif'
        },
        rtl: true
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: '"Cairo", sans-serif',
            size: 11
          },
          color: colorPalette.textLight
        },
        grid: {
          color: colorPalette.primaryLighter
        }
      },
      y: {
        ticks: {
          font: {
            family: '"Cairo", sans-serif',
            size: 11
          },
          color: colorPalette.textLight
        },
        grid: {
          color: colorPalette.primaryLighter
        }
      }
    }
  };

  const pieChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: 'bottom',
        rtl: true,
        labels: {
          font: {
            family: '"Cairo", sans-serif',
            size: 11
          },
          color: colorPalette.textDark,
          usePointStyle: true
        }
      }
    }
  };

  const dailyAttendanceChartData = {
    labels: analytics?.dailyAttendance.map(day => day.formattedDate) || [],
    datasets: [
      {
        label: 'عدد الحضور اليومي',
        data: analytics?.dailyAttendance.map(day => day.count) || [],
        backgroundColor: colorPalette.primary + '80',
        borderColor: colorPalette.primary,
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const diplomaPerformanceChartData = {
    labels: analytics ? Object.values(analytics.diplomaStats)
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
      .map(diploma => diploma.name) : [],
    datasets: [
      {
        label: 'نسبة الحضور %',
        data: analytics ? Object.values(analytics.diplomaStats)
          .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
          .map(diploma => diploma.attendancePercentage) : [],
        backgroundColor: [
          colorPalette.primary,
          colorPalette.primaryLight,
          colorPalette.success,
          colorPalette.warning,
          colorPalette.error,
          '#9c27b0',
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const attendanceDistributionChartData = {
    labels: ['ممتاز (80%+)', 'جيد (60-79%)', 'ضعيف (<60%)', 'لم يحضر'],
    datasets: [
      {
        data: analytics ? [
          analytics.attendanceDistribution.excellent,
          analytics.attendanceDistribution.good,
          analytics.attendanceDistribution.poor,
          analytics.attendanceDistribution.absent
        ] : [0, 0, 0, 0],
        backgroundColor: [
          colorPalette.success,
          colorPalette.warning,
          colorPalette.error,
          colorPalette.textLight,
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 15
      }
    ]
  };

  const trainerPerformanceChartData = {
    labels: analytics?.topTrainers.map(trainer => trainer.name) || [],
    datasets: [
      {
        label: 'عدد سجلات الحضور',
        data: analytics?.topTrainers.map(trainer => trainer.totalRecords) || [],
        backgroundColor: colorPalette.primary + '80',
        borderColor: colorPalette.primary,
        borderWidth: 2
      },
      {
        label: 'عدد الطلاب المميزين',
        data: analytics?.topTrainers.map(trainer => trainer.uniqueStudentsCount) || [],
        backgroundColor: colorPalette.success + '80',
        borderColor: colorPalette.success,
        borderWidth: 2
      }
    ]
  };

  /* ============== Filtering ============== */
  const filteredStudentStats = useMemo(() => {
    if (!analytics) return [];
    
    let filtered = analytics.studentStats;
    
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nationalId?.includes(searchTerm)
      );
    }
    
    if (diplomaFilter) {
      filtered = filtered.filter(student => student.diplomName === diplomaFilter);
    }
    
    if (trainerFilter) {
      const trainerStudents = analytics.trainerStats[trainerFilter]?.uniqueStudents || [];
      filtered = filtered.filter(student => trainerStudents.includes(student.nationalId));
    }
    
    return filtered;
  }, [analytics, searchTerm, diplomaFilter, trainerFilter]);

  /* ============== Pagination ============== */
  const paginatedStats = useMemo(() => {
    return filteredStudentStats.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredStudentStats, page, rowsPerPage]);

  /* ============== Export HTML ============== */
  const handleExportHTML = () => {
    if (!analytics) return;

    const diplomaChartData = analytics.allDiplomas
      .slice(0, 8)
      .map(diploma => ({
        name: diploma.name.length > 15 ? diploma.name.substring(0, 15) + '...' : diploma.name,
        percentage: diploma.attendancePercentage
      }));

    const trainerChartData = analytics.allTrainers
      .slice(0, 8)
      .map(trainer => ({
        name: trainer.name.length > 15 ? trainer.name.substring(0, 15) + '...' : trainer.name,
        records: trainer.totalRecords,
        students: trainer.uniqueStudentsCount
      }));

    const distributionData = [
      analytics.attendanceDistribution.excellent,
      analytics.attendanceDistribution.good,
      analytics.attendanceDistribution.poor,
      analytics.attendanceDistribution.absent
    ];

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير الحضور الدوري</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Cairo', sans-serif;
          }
          
          body {
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
            padding: 20px;
          }
          
          .report-container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .report-header {
            background: linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark});
            color: white;
            padding: 30px;
            text-align: center;
          }
          
          .report-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
          }
          
          .report-header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          
          .report-header .period {
            font-size: 1rem;
            opacity: 0.8;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
          }
          
          .stat-card {
            background: white;
            padding: 25px 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-left: 4px solid ${colorPalette.primary};
            transition: transform 0.3s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .stat-card .number {
            font-size: 2.2rem;
            font-weight: 700;
            color: ${colorPalette.primary};
            margin-bottom: 8px;
          }
          
          .stat-card .label {
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
          }
          
          .section {
            padding: 30px;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: ${colorPalette.primary};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${colorPalette.primaryLighter};
          }
          
          .table-container {
            overflow-x: auto;
            margin-top: 20px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th {
            background: ${colorPalette.primary};
            color: white;
            padding: 15px 12px;
            text-align: right;
            font-weight: 600;
            font-size: 0.9rem;
          }
          
          td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
            text-align: right;
          }
          
          tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          tr:hover {
            background: ${colorPalette.primaryLighter};
          }
          
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
          }
          
          .badge-excellent { background: ${colorPalette.success}; color: white; }
          .badge-good { background: ${colorPalette.warning}; color: white; }
          .badge-poor { background: ${colorPalette.error}; color: white; }
          .badge-absent { background: #9e9e9e; color: white; }
          
          .badge-gold { background: linear-gradient(135deg, #FFD700, #FFA500); color: white; }
          .badge-silver { background: linear-gradient(135deg, #C0C0C0, #A9A9A9); color: white; }
          .badge-bronze { background: linear-gradient(135deg, #CD7F32, #8B4513); color: white; }
          .badge-normal { background: ${colorPalette.primary}; color: white; }
          
          .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-top: 20px;
          }
          
          .chart-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            height: 400px;
            position: relative;
          }
          
          .chart-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            text-align: center;
          }
          
          .top-performers {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          
          .performer-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-right: 4px solid ${colorPalette.primary};
          }
          
          .performer-card h4 {
            color: ${colorPalette.primary};
            margin-bottom: 15px;
            font-size: 1.1rem;
          }
          
          .performer-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .performer-item:last-child {
            border-bottom: none;
          }
          
          .rank {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: ${colorPalette.primary};
            color: white;
            border-radius: 50%;
            font-size: 0.8rem;
            font-weight: 600;
            margin-left: 10px;
          }
          
          .rank-1 { background: linear-gradient(135deg, #FFD700, #FFA500); }
          .rank-2 { background: linear-gradient(135deg, #C0C0C0, #A9A9A9); }
          .rank-3 { background: linear-gradient(135deg, #CD7F32, #8B4513); }
          
          .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9rem;
            border-top: 1px solid #e0e0e0;
          }
          
          .medal {
            font-size: 1.2rem;
            margin-left: 5px;
          }
          
          @media print {
            body { padding: 0; }
            .report-container { box-shadow: none; }
            .stat-card { break-inside: avoid; }
            .chart-container { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1>تقرير الحضور الدوري</h1>
            <div class="subtitle">نظام إدارة الحضور - الفرع: ${branchName}</div>
            <div class="period">${format(new Date(startDate), 'yyyy/MM/dd')} - ${format(new Date(endDate), 'yyyy/MM/dd')}</div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="number">${analytics.totalStudents}</div>
              <div class="label">إجمالي الطلاب</div>
            </div>
            <div class="stat-card">
              <div class="number">${analytics.attendedStudents}</div>
              <div class="label">الطلبة الحاضرين</div>
            </div>
            <div class="stat-card">
              <div class="number">${analytics.totalAttendanceRecords}</div>
              <div class="label">سجلات الحضور</div>
            </div>
            <div class="stat-card">
              <div class="number">${analytics.avgAttendancePercentage}%</div>
              <div class="label">متوسط الحضور</div>
            </div>
            <div class="stat-card">
              <div class="number">${analytics.idealDays}</div>
              <div class="label">الأيام المثالية</div>
            </div>
          </div>
          
          <!-- Charts Section -->
          <div class="section">
            <h2 class="section-title">الرسوم البيانية</h2>
            <div class="charts-grid">
              <div class="chart-container">
                <div class="chart-title">توزيع مستوى الحضور</div>
                <canvas id="distributionChart"></canvas>
              </div>
              <div class="chart-container">
                <div class="chart-title">أفضل البرامج التدريبية</div>
                <canvas id="diplomaChart"></canvas>
              </div>
              <div class="chart-container">
                <div class="chart-title">أفضل المدربين</div>
                <canvas id="trainerChart"></canvas>
              </div>
            </div>
          </div>
          
          <!-- Top Students Section -->
          <div class="section">
            <h2 class="section-title">أفضل 5 طلاب في الحضور</h2>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>الترتيب</th>
                    <th>اسم الطالب</th>
                    <th>رقم الهوية</th>
                    <th>الدبلوم</th>
                    <th>أيام الحضور</th>
                    <th>نسبة الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.topStudents.map((student, index) => `
                    <tr>
                      <td>
                        <span class="rank ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}">
                          ${index + 1}
                          ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                        </span>
                      </td>
                      <td><strong>${student.studentName}</strong></td>
                      <td>${student.nationalId}</td>
                      <td>${student.diplomName}</td>
                      <td>${student.attendedDays}/${student.idealDays}</td>
                      <td>
                        <span class="badge ${
                          student.attendancePercentage >= 80 ? 'badge-excellent' :
                          student.attendancePercentage >= 60 ? 'badge-good' : 'badge-poor'
                        }">
                          ${student.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- All Diplomas Section -->
          <div class="section">
            <h2 class="section-title">جميع البرامج التدريبية</h2>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>الترتيب</th>
                    <th>اسم الدبلوم</th>
                    <th>عدد الطلاب</th>
                    <th>الطلبة الحاضرين</th>
                    <th>نسبة الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.allDiplomas.map((diploma, index) => `
                    <tr>
                      <td>
                        <span class="rank ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}">
                          ${index + 1}
                          ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                        </span>
                      </td>
                      <td><strong>${diploma.name}</strong></td>
                      <td>${diploma.totalStudents}</td>
                      <td>${diploma.attendedStudents}</td>
                      <td>
                        <span class="badge ${
                          diploma.attendancePercentage >= 80 ? 'badge-excellent' :
                          diploma.attendancePercentage >= 60 ? 'badge-good' : 'badge-poor'
                        }">
                          ${diploma.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- All Trainers Section -->
          <div class="section">
            <h2 class="section-title">جميع المدربين</h2>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>الترتيب</th>
                    <th>اسم المدرب</th>
                    <th>عدد السجلات</th>
                    <th>الطلاب المميزين</th>
                    <th>متوسط الحضور</th>
                    <th>الأداء</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.allTrainers.map((trainer, index) => `
                    <tr>
                      <td>
                        <span class="rank ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}">
                          ${index + 1}
                          ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                        </span>
                      </td>
                      <td><strong>${trainer.name}</strong></td>
                      <td>${trainer.totalRecords}</td>
                      <td>${trainer.uniqueStudentsCount}</td>
                      <td>${trainer.avgAttendancePerStudent}</td>
                      <td>
                        <span class="badge ${
                          trainer.totalRecords >= 100 ? 'badge-gold' :
                          trainer.totalRecords >= 50 ? 'badge-silver' :
                          trainer.totalRecords >= 20 ? 'badge-bronze' : 'badge-normal'
                        }">
                          ${trainer.totalRecords >= 100 ? 'متميز' :
                            trainer.totalRecords >= 50 ? 'جيد جداً' :
                            trainer.totalRecords >= 20 ? 'جيد' : 'مقبول'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="footer">
            تم إنشاء هذا التقرير في ${format(new Date(), 'yyyy/MM/dd HH:mm')} |
            نظام إدارة الحضور - جميع الحقوق محفوظة
          </div>
        </div>

        <script>
          // Chart colors
          const colors = {
            primary: '${colorPalette.primary}',
            secondary: '${colorPalette.primaryLight}',
            success: '${colorPalette.success}',
            warning: '${colorPalette.warning}',
            error: '${colorPalette.error}',
            info: '${colorPalette.primaryDark}',
            grey: '${colorPalette.textLight}'
          };

          // Distribution Chart
          const distributionCtx = document.getElementById('distributionChart').getContext('2d');
          new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
              labels: ['ممتاز (80%+)', 'جيد (60-79%)', 'ضعيف (<60%)', 'لم يحضر'],
              datasets: [{
                data: [${distributionData.join(',')}],
                backgroundColor: [
                  colors.success,
                  colors.warning,
                  colors.error,
                  colors.grey
                ],
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 15
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  rtl: true,
                  labels: {
                    font: {
                      family: 'Cairo',
                      size: 12
                    },
                    color: '#333'
                  }
                },
                tooltip: {
                  rtl: true,
                  titleFont: { family: 'Cairo' },
                  bodyFont: { family: 'Cairo' }
                }
              }
            }
          });

          // Diploma Chart
          const diplomaCtx = document.getElementById('diplomaChart').getContext('2d');
          new Chart(diplomaCtx, {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(diplomaChartData.map(d => d.name))},
              datasets: [{
                label: 'نسبة الحضور %',
                data: ${JSON.stringify(diplomaChartData.map(d => d.percentage))},
                backgroundColor: [
                  colors.primary,
                  colors.secondary,
                  colors.success,
                  colors.warning,
                  colors.error,
                  colors.info,
                  '#9c27b0',
                  '#795548'
                ],
                borderColor: '#fff',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  rtl: true,
                  titleFont: { family: 'Cairo' },
                  bodyFont: { family: 'Cairo' }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    font: {
                      family: 'Cairo',
                      size: 11
                    }
                  }
                },
                y: {
                  ticks: {
                    font: {
                      family: 'Cairo',
                      size: 11
                    }
                  }
                }
              }
            }
          });

          // Trainer Chart
          const trainerCtx = document.getElementById('trainerChart').getContext('2d');
          new Chart(trainerCtx, {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(trainerChartData.map(t => t.name))},
              datasets: [
                {
                  label: 'عدد السجلات',
                  data: ${JSON.stringify(trainerChartData.map(t => t.records))},
                  backgroundColor: colors.primary + '80',
                  borderColor: colors.primary,
                  borderWidth: 2
                },
                {
                  label: 'عدد الطلاب',
                  data: ${JSON.stringify(trainerChartData.map(t => t.students))},
                  backgroundColor: colors.success + '80',
                  borderColor: colors.success,
                  borderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  rtl: true,
                  labels: {
                    font: {
                      family: 'Cairo',
                      size: 12
                    }
                  }
                },
                tooltip: {
                  rtl: true,
                  titleFont: { family: 'Cairo' },
                  bodyFont: { family: 'Cairo' }
                }
              },
              scales: {
                x: {
                  ticks: {
                    font: {
                      family: 'Cairo',
                      size: 11
                    }
                  }
                },
                y: {
                  ticks: {
                    font: {
                      family: 'Cairo',
                      size: 11
                    }
                  }
                }
              }
            }
          });
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_حضور_دوري_${format(new Date(startDate), 'yyyy-MM-dd')}_إلى_${format(new Date(endDate), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ============== Dialog Components ============== */
  const AllTrainersDialog = () => {
    const rows = analytics?.allTrainers || [];

    return (
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={allTrainersDialog}
        onClose={() => setAllTrainersDialog(false)}
        fullWidth
        maxWidth="md"
        dir="rtl"
      >
        <DialogTitle sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700, color: colorPalette.textDark }}>
          جميع المدربين
        </DialogTitle>
        <DialogContent dividers>
          {!rows.length ? (
            <Alert severity="info" sx={{ fontFamily: '"Cairo", sans-serif' }}>
              لا توجد بيانات مدربين ضمن الفترة المحددة.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={uiLayout.withUiSx({ border: `1px solid ${colorPalette.primaryLighter}` }, uiLayout.tableContainerSx)}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: colorPalette.primaryLighter }}>
                    <StyledTableCell align="right">المدرب</StyledTableCell>
                    <StyledTableCell align="center">الطلاب</StyledTableCell>
                    <StyledTableCell align="center">سجلات الحضور</StyledTableCell>
                    <StyledTableCell align="center">متوسط السجلات/طالب</StyledTableCell>
                    <StyledTableCell align="center">إجراء</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((trainer) => (
                    <StyledTableRow key={trainer.guid || trainer.name}>
                      <StyledTableCell align="right">{trainer.name || 'غير معروف'}</StyledTableCell>
                      <StyledTableCell align="center">{trainer.uniqueStudentsCount || 0}</StyledTableCell>
                      <StyledTableCell align="center">{trainer.totalRecords || 0}</StyledTableCell>
                      <StyledTableCell align="center">{trainer.avgAttendancePerStudent || 0}</StyledTableCell>
                      <StyledTableCell align="center">
                        <Stack sx={uiLayout.actionBarSx} direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleFilterByTrainer(trainer.guid)}
                            sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}
                          >
                            تصفية
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setAllTrainersDialog(false);
                              handleViewTrainerDetails(trainer);
                            }}
                            sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif', backgroundColor: colorPalette.primary }, uiLayout.buttonSx)}
                          >
                            التفاصيل
                          </Button>
                        </Stack>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button onClick={() => setAllTrainersDialog(false)} sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const AllDiplomasDialog = () => {
    const rows = analytics?.allDiplomas || [];

    return (
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={allDiplomasDialog}
        onClose={() => setAllDiplomasDialog(false)}
        fullWidth
        maxWidth="md"
        dir="rtl"
      >
        <DialogTitle sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700, color: colorPalette.textDark }}>
          جميع البرامج التدريبية
        </DialogTitle>
        <DialogContent dividers>
          {!rows.length ? (
            <Alert severity="info" sx={{ fontFamily: '"Cairo", sans-serif' }}>
              لا توجد بيانات برامج ضمن الفترة المحددة.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={uiLayout.withUiSx({ border: `1px solid ${colorPalette.primaryLighter}` }, uiLayout.tableContainerSx)}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: colorPalette.primaryLighter }}>
                    <StyledTableCell align="right">البرنامج</StyledTableCell>
                    <StyledTableCell align="center">إجمالي الطلاب</StyledTableCell>
                    <StyledTableCell align="center">طلاب لديهم حضور</StyledTableCell>
                    <StyledTableCell align="center">نسبة الحضور</StyledTableCell>
                    <StyledTableCell align="center">إجراء</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((diploma) => (
                    <StyledTableRow key={diploma.name}>
                      <StyledTableCell align="right">{diploma.name}</StyledTableCell>
                      <StyledTableCell align="center">{diploma.totalStudents || 0}</StyledTableCell>
                      <StyledTableCell align="center">{diploma.attendedStudents || 0}</StyledTableCell>
                      <StyledTableCell align="center">
                        <Chip
                          size="small"
                          label={`${diploma.attendancePercentage || 0}%`}
                          color={diploma.attendancePercentage >= 80 ? 'success' : diploma.attendancePercentage >= 60 ? 'warning' : 'error'}
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Stack sx={uiLayout.actionBarSx} direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleFilterByDiploma(diploma.name)}
                            sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}
                          >
                            تصفية
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setAllDiplomasDialog(false);
                              handleViewDiplomaDetails(diploma);
                            }}
                            sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif', backgroundColor: colorPalette.primary }, uiLayout.buttonSx)}
                          >
                            التفاصيل
                          </Button>
                        </Stack>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button onClick={() => setAllDiplomasDialog(false)} sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const DiplomaDetailsDialog = () => {
    const diploma = selectedDiploma;
    const diplomaStudents = diploma?.students || [];

    return (
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={diplomaDetailsDialog}
        onClose={() => setDiplomaDetailsDialog(false)}
        fullWidth
        maxWidth="md"
        dir="rtl"
      >
        <DialogTitle sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700, color: colorPalette.textDark }}>
          تفاصيل البرنامج{diploma?.name ? `: ${diploma.name}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {diploma && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption">إجمالي الطلاب</Typography>
                    <Typography variant="h6">{diploma.totalStudents || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption">طلاب لديهم حضور</Typography>
                    <Typography variant="h6">{diploma.attendedStudents || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption">نسبة الحضور</Typography>
                    <Typography variant="h6">{diploma.attendancePercentage || 0}%</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {!diplomaStudents.length ? (
                <Alert severity="info">لا توجد بيانات طلاب لهذا البرنامج.</Alert>
              ) : (
                <TableContainer sx={uiLayout.tableContainerSx} component={Paper} elevation={0} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: colorPalette.primaryLighter }}>
                        <StyledTableCell align="right">الطالب</StyledTableCell>
                        <StyledTableCell align="center">رقم الهوية</StyledTableCell>
                        <StyledTableCell align="center">أيام الحضور</StyledTableCell>
                        <StyledTableCell align="center">النسبة</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diplomaStudents.map((student) => (
                        <StyledTableRow key={student.nationalId || student.studentName}>
                          <StyledTableCell align="right">{student.studentName || 'غير محدد'}</StyledTableCell>
                          <StyledTableCell align="center">{student.nationalId || '-'}</StyledTableCell>
                          <StyledTableCell align="center">{student.attendedDays || 0}</StyledTableCell>
                          <StyledTableCell align="center">{student.attendancePercentage || 0}%</StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          {diploma?.name && (
            <Button
              variant="outlined"
              onClick={() => {
                handleFilterByDiploma(diploma.name);
                setDiplomaDetailsDialog(false);
              }}
              sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}
            >
              عرض طلاب البرنامج
            </Button>
          )}
          <Button onClick={() => setDiplomaDetailsDialog(false)} sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const TrainerDetailsDialog = () => {
    const trainer = selectedTrainer;
    const trainerStudents = trainer?.studentDetails || [];

    return (
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={trainerDetailsDialog}
        onClose={() => setTrainerDetailsDialog(false)}
        fullWidth
        maxWidth="md"
        dir="rtl"
      >
        <DialogTitle sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700, color: colorPalette.textDark }}>
          تفاصيل المدرب{trainer?.name ? `: ${trainer.name}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {trainer && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption">عدد الطلاب</Typography>
                    <Typography variant="h6">{trainer.uniqueStudentsCount || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption">سجلات الحضور</Typography>
                    <Typography variant="h6">{trainer.totalRecords || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption">متوسط السجلات/طالب</Typography>
                    <Typography variant="h6">{trainer.avgAttendancePerStudent || 0}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {!trainerStudents.length ? (
                <Alert severity="info">لا توجد بيانات طلاب لهذا المدرب.</Alert>
              ) : (
                <TableContainer sx={uiLayout.tableContainerSx} component={Paper} elevation={0} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: colorPalette.primaryLighter }}>
                        <StyledTableCell align="right">الطالب</StyledTableCell>
                        <StyledTableCell align="center">رقم الهوية</StyledTableCell>
                        <StyledTableCell align="right">البرنامج</StyledTableCell>
                        <StyledTableCell align="center">عدد سجلات الحضور</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trainerStudents.map((student) => (
                        <StyledTableRow key={student.nationalId || student.studentName}>
                          <StyledTableCell align="right">{student.studentName || 'غير محدد'}</StyledTableCell>
                          <StyledTableCell align="center">{student.nationalId || '-'}</StyledTableCell>
                          <StyledTableCell align="right">{student.diplomName || 'غير محدد'}</StyledTableCell>
                          <StyledTableCell align="center">{student.attendanceCount || 0}</StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          {trainer?.guid && (
            <Button
              variant="outlined"
              onClick={() => {
                handleFilterByTrainer(trainer.guid);
                setTrainerDetailsDialog(false);
              }}
              sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}
            >
              عرض طلاب المدرب
            </Button>
          )}
          <Button onClick={() => setTrainerDetailsDialog(false)} sx={uiLayout.withUiSx({ fontFamily: '"Cairo", sans-serif' }, uiLayout.buttonSx)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <NavigationShell variant="standard" ><Box sx={{ direction: 'rtl', backgroundColor: colorPalette.background, minHeight: '100vh' }}>
      

      <Box component="main" sx={{
        flexGrow: 1,
        p: 4,
        minHeight: '100vh',
        backgroundColor: colorPalette.background,
        direction: "rtl",
        ...navigationContentSx
      }}>
        
        {/* Navigation Bar */}
        <AppBar position="static" sx={{ 
          backgroundColor: 'white', 
          direction: 'rtl', 
          color: colorPalette.textDark, 
          boxShadow: `0 2px 12px ${alpha(colorPalette.primary, 0.15)}`,
          width: '100%', 
          left: 0, 
          right: 'auto',
          borderRadius: '12px 12px 0 0'
        }}>
          <Toolbar sx={{ justifyContent: 'space-between', paddingLeft: '16px' }}>
            <Tabs 
              value={selectedTab} 
              onChange={handleTabChange}
              textColor="inherit"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: colorPalette.primary,
                  height: 3,
                  borderRadius: '2px'
                }
              }}
            >
              <StyledTab label="التقارير الدورية" />
              <StyledTab label="التقرير الشهري" />
              <StyledTab label="التقرير اليومي" />
              <StyledTab label="الحضور" />
            </Tabs>
            
            <Typography variant="h6" component="div" sx={{ 
              fontFamily: '"Cairo", sans-serif',
              fontWeight: 700,
              color: colorPalette.textDark
            }}>
              نظام إدارة الحضور
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Header */}
        <Paper elevation={0} sx={{
          mb: 4, mt: 2, p: 4,
          background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
          color: 'white',
          borderRadius: '16px',
          boxShadow: `0 8px 32px ${alpha(colorPalette.primary, 0.3)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle, ${alpha('#fff', 0.1)} 0%, ${alpha(colorPalette.primary, 0)} 70%)`,
            borderRadius: '50%',
            transform: 'translate(30%, -30%)'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                backgroundColor: alpha('#fff', 0.2),
                borderRadius: '50%',
                p: 2,
                mr: 3,
                backdropFilter: 'blur(10px)'
              }}>
                <ChartIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontFamily: '"Cairo", sans-serif', mb: 1 }}>
                  التقارير الدورية للحضور
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', opacity: 0.9, mb: 1 }}>
                  {format(new Date(startDate), 'EEEE, d MMMM yyyy', { locale: arSA })} - {format(new Date(endDate), 'EEEE, d MMMM yyyy', { locale: arSA })}
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontFamily: '"Cairo", sans-serif', 
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box component="span" sx={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: alpha('#fff', 0.8),
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                  الفرع: {branchName}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton onClick={handleRefresh} sx={{
                backgroundColor: alpha('#fff', 0.2),
                color: 'white',
                '&:hover': { 
                  backgroundColor: alpha('#fff', 0.3),
                  transform: 'rotate(180deg)',
                  transition: 'all 0.5s ease'
                },
                transition: 'all 0.3s ease'
              }}>
                <RefreshIcon />
              </IconButton>

              <StyledButton
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportHTML}
                disabled={!analytics || analytics.totalStudents === 0}
                sx={{
                  backgroundColor: alpha('#fff', 0.2),
                  color: 'white',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.3),
                    border: `1px solid ${alpha('#fff', 0.5)}`,
                  },
                  '&.Mui-disabled': {
                    backgroundColor: alpha('#fff', 0.1),
                    color: alpha('#fff', 0.5),
                  }
                }}
              >
                تصدير كملف HTML
              </StyledButton>
            </Box>
          </Box>
        </Paper>

        {/* Date Range & Filters */}
        <Paper elevation={0} sx={{
          mb: 4, p: 3, borderRadius: '16px',
          border: `1px solid ${colorPalette.primaryLighter}`,
          backgroundColor: 'white',
          boxShadow: `0 4px 20px ${alpha(colorPalette.primary, 0.08)}`
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="من تاريخ"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ 
                  shrink: true, 
                  sx: { fontFamily: '"Cairo", sans-serif', fontWeight: 600 } 
                }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ color: colorPalette.primary }} />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: '"Cairo", sans-serif' }
                }}
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '& fieldset': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover fieldset': {
                      borderColor: colorPalette.primary,
                    },
                  }
                }, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                label="إلى تاريخ"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ 
                  shrink: true, 
                  sx: { fontFamily: '"Cairo", sans-serif', fontWeight: 600 } 
                }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ color: colorPalette.primary }} />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: '"Cairo", sans-serif' }
                }}
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '& fieldset': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover fieldset': {
                      borderColor: colorPalette.primary,
                    },
                  }
                }, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                variant="outlined"
                label="ابحث بالاسم أو رقم الهوية"
                value={searchTerm}
                onChange={handleSearch}
                InputLabelProps={{ 
                  sx: { fontFamily: '"Cairo", sans-serif', fontWeight: 600 } 
                , shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: colorPalette.primary }} />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: '"Cairo", sans-serif' }
                }}
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '& fieldset': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover fieldset': {
                      borderColor: colorPalette.primary,
                    },
                  }
                }, uiLayout.formFieldSx)}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth>
                <InputLabel sx={{ 
                  fontFamily: '"Cairo", sans-serif',
                  fontWeight: 600,
                  color: colorPalette.textLight
                }}>
                  الدبلوم
                </InputLabel>
                <Select
                  value={diplomaFilter}
                  label="الدبلوم"
                  onChange={(e) => { setDiplomaFilter(e.target.value); setPage(0); }}
                  sx={{ 
                    fontFamily: '"Cairo", sans-serif',
                    borderRadius: '10px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorPalette.primary,
                    },
                  }}
                >
                  <MenuItem value=""><em>الكل</em></MenuItem>
                  {analytics && Object.keys(analytics.diplomaStats).map(diploma => (
                    <MenuItem key={diploma} value={diploma} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      {diploma}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth>
                <InputLabel sx={{ 
                  fontFamily: '"Cairo", sans-serif',
                  fontWeight: 600,
                  color: colorPalette.textLight
                }}>
                  المدرب
                </InputLabel>
                <Select
                  value={trainerFilter}
                  label="المدرب"
                  onChange={(e) => { setTrainerFilter(e.target.value); setPage(0); }}
                  sx={{ 
                    fontFamily: '"Cairo", sans-serif',
                    borderRadius: '10px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorPalette.primary,
                    },
                  }}
                >
                  <MenuItem value=""><em>الكل</em></MenuItem>
                  {analytics && Object.values(analytics.trainerStats).map(trainer => (
                    <MenuItem key={trainer.guid} value={trainer.guid} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      {trainer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '300px',
            flexDirection: 'column',
            gap: 3
          }}>
            <CircularProgress 
              size={60} 
              sx={{ color: colorPalette.primary }} 
            />
            <Typography variant="h6" sx={{ 
              fontFamily: '"Cairo", sans-serif',
              color: colorPalette.textLight,
              fontWeight: 600
            }}>
              جاري تحميل البيانات...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ 
            mb: 3, 
            fontFamily: '"Cairo", sans-serif', 
            '& .MuiAlert-message': { py: 1 },
            borderRadius: '12px',
            border: `1px solid ${colorPalette.error}20`,
            backgroundColor: `${colorPalette.error}08`
          }}>
            {error}
          </Alert>
        ) : !analytics || analytics.totalStudents === 0 ? (
          <Paper elevation={0} sx={{
            p: 6, 
            textAlign: 'center',
            border: `2px dashed ${colorPalette.primaryLight}`,
            borderRadius: '16px',
            backgroundColor: colorPalette.background
          }}>
            <ChartIcon sx={{ 
              fontSize: 80, 
              mb: 2, 
              color: colorPalette.primaryLight 
            }} />
            <Typography variant="h5" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              color: colorPalette.textLight,
              fontWeight: 600,
              mb: 1
            }}>
              لا توجد بيانات متاحة للفترة المحددة
            </Typography>
            <Typography variant="body1" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              color: colorPalette.textLight,
              opacity: 0.8
            }}>
              حاول تغيير نطاق التاريخ أو الفلاتر المطبقة
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={2.4}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <GroupsIcon sx={{ fontSize: 40, color: colorPalette.primary, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {analytics.totalStudents}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      إجمالي الطلاب
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={2.4}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PersonIcon sx={{ fontSize: 40, color: colorPalette.success, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {analytics.attendedStudents}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      الطلبة الحاضرين
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={2.4}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TodayIcon sx={{ fontSize: 40, color: colorPalette.primaryDark, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {analytics.totalAttendanceRecords}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      سجلات الحضور
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={2.4}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: colorPalette.warning, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {analytics.avgAttendancePercentage}%
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      متوسط الحضور
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={2.4}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CalendarIcon sx={{ fontSize: 40, color: colorPalette.primaryLight, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {analytics.idealDays}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      الأيام المثالية
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Daily Attendance Trend */}
              <Grid item xs={12} md={8}>
                <ChartCard elevation={3}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LineChartIcon sx={{ color: colorPalette.primary, marginInlineEnd: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        اتجاه الحضور اليومي
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Line 
                        data={dailyAttendanceChartData} 
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              ...chartOptions.plugins.title,
                              text: 'تطور الحضور خلال الفترة المحددة'
                            }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>

              {/* Attendance Distribution */}
              <Grid item xs={12} md={4}>
                <ChartCard elevation={3}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PieChartIcon sx={{ color: colorPalette.primary, marginInlineEnd: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        توزيع مستوى الحضور
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Doughnut 
                        data={attendanceDistributionChartData} 
                        options={{
                          ...pieChartOptions,
                          plugins: {
                            ...pieChartOptions.plugins,
                            title: {
                              ...pieChartOptions.plugins.title,
                              text: 'توزيع الطلاب حسب مستوى الحضور'
                            }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>

              {/* Diploma Performance */}
              <Grid item xs={12} md={6}>
                <ChartCard elevation={3}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SchoolIcon sx={{ color: colorPalette.primary, marginInlineEnd: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        أداء البرامج التدريبية
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Bar 
                        data={diplomaPerformanceChartData} 
                        options={{
                          ...chartOptions,
                          indexAxis: 'y',
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              ...chartOptions.plugins.title,
                              text: 'نسبة الحضور حسب البرنامج التدريبي'
                            }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>

              {/* Trainer Performance */}
              <Grid item xs={12} md={6}>
                <ChartCard elevation={3}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AnalyticsIcon sx={{ color: colorPalette.primary, marginInlineEnd: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        أداء المدربين
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Bar 
                        data={trainerPerformanceChartData} 
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              ...chartOptions.plugins.title,
                              text: 'أفضل المدربين في تسجيل الحضور'
                            }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>
            </Grid>

            {/* Top Performers Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Top Students */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  borderRadius: '16px',
                  border: `1px solid ${colorPalette.primaryLighter}`,
                  background: 'linear-gradient(135deg, #ffffff, #f8fbf9)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrophyIcon sx={{ color: colorPalette.warning, marginInlineEnd: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        أفضل 5 طلاب في الحضور
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Stack spacing={2}>
                    {analytics.topStudents.map((student, index) => (
                      <Box key={student.nationalId} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: '8px',
                        border: `1px solid ${colorPalette.primaryLighter}`,
                        '&:hover': {
                          backgroundColor: colorPalette.primaryLighter
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={index + 1}
                            size="small"
                            color={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'primary' : 'default'}
                            sx={{ mr: 2, fontFamily: '"Cairo", sans-serif' }}
                          />
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                              {student.studentName}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              {student.diplomName}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={`${student.attendancePercentage}%`}
                          color={student.attendancePercentage >= 80 ? 'success' : student.attendancePercentage >= 60 ? 'warning' : 'error'}
                          size="small"
                          sx={{ fontFamily: '"Cairo", sans-serif' }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* Top Diplomas */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  borderRadius: '16px',
                  border: `1px solid ${colorPalette.primaryLighter}`,
                  background: 'linear-gradient(135deg, #ffffff, #f8fbf9)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SchoolIcon sx={{ color: colorPalette.primary, marginInlineEnd: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        أفضل 5 برامج تدريبية
                      </Typography>
                    </Box>
                    <ViewMoreButton
                      size="small"
                      endIcon={<ExpandMoreIcon />}
                      onClick={handleViewAllDiplomas}
                    >
                      عرض المزيد
                    </ViewMoreButton>
                  </Box>
                  
                  <Stack spacing={2}>
                    {analytics.topDiplomas.map((diploma, index) => (
                      <Box key={diploma.name} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: '8px',
                        border: `1px solid ${colorPalette.primaryLighter}`,
                        '&:hover': {
                          backgroundColor: colorPalette.primaryLighter
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={index + 1}
                            size="small"
                            color={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'primary' : 'default'}
                            sx={{ mr: 2, fontFamily: '"Cairo", sans-serif' }}
                          />
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                              {diploma.name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              {diploma.attendedStudents} من {diploma.totalStudents}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={`${diploma.attendancePercentage}%`}
                            color={diploma.attendancePercentage >= 80 ? 'success' : diploma.attendancePercentage >= 60 ? 'warning' : 'error'}
                            size="small"
                            sx={{ fontFamily: '"Cairo", sans-serif' }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDiplomaDetails(diploma)}
                            sx={{ color: colorPalette.primary }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* Top Trainers */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  borderRadius: '16px',
                  border: `1px solid ${colorPalette.primaryLighter}`,
                  background: 'linear-gradient(135deg, #ffffff, #f8fbf9)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ color: colorPalette.success, marginInlineEnd: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        أفضل المدربين
                      </Typography>
                    </Box>
                    <ViewMoreButton
                      size="small"
                      endIcon={<ExpandMoreIcon />}
                      onClick={handleViewAllTrainers}
                    >
                      عرض المزيد
                    </ViewMoreButton>
                  </Box>
                  
                  <Stack spacing={2}>
                    {analytics.topTrainers.map((trainer, index) => (
                      <Box key={trainer.guid} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: '8px',
                        border: `1px solid ${colorPalette.primaryLighter}`,
                        '&:hover': {
                          backgroundColor: colorPalette.primaryLighter
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={index + 1}
                            size="small"
                            color={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'primary' : 'default'}
                            sx={{ mr: 2, fontFamily: '"Cairo", sans-serif' }}
                          />
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                              {trainer.name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              {trainer.uniqueStudentsCount} طالب
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={trainer.totalRecords}
                            color="primary"
                            size="small"
                            sx={{ fontFamily: '"Cairo", sans-serif' }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewTrainerDetails(trainer)}
                            sx={{ color: colorPalette.primary }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      {/* Dialogs */}
      <AllTrainersDialog />
      <AllDiplomasDialog />
      <DiplomaDetailsDialog />
      <TrainerDetailsDialog />
    </Box></NavigationShell>
  );
};

export default PeriodicReports;