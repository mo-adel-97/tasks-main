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
  alpha,
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
  Business as BusinessIcon,
  LocationCity as BranchIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  CorporateFare as CorporateIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Sidebar from '../components/Sidebar';

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

const BranchCard = styled(Card)(({ theme, rank }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  background: 'linear-gradient(135deg, #ffffff, #f8fbf9)',
  border: `2px solid ${
    rank === 1 ? '#FFD700' : 
    rank === 2 ? '#C0C0C0' : 
    rank === 3 ? '#CD7F32' : colorPalette.primaryLighter
  }`,
  borderRadius: '16px',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 25px ${alpha(colorPalette.primary, 0.2)}`
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

const RankBadge = styled(Box)(({ rank }) => ({
  position: 'absolute',
  top: -12,
  right: -12,
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '14px',
  background: rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
             rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #A9A9A9)' :
             rank === 3 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' :
             colorPalette.primary,
  boxShadow: `0 4px 12px ${alpha('#000', 0.2)}`,
  zIndex: 1
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

/* =================== Main Component =================== */
const AdminBranchesReports = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  /* ============== State ============== */
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchStats, setBranchStats] = useState({});
  const [branchDetailsDialog, setBranchDetailsDialog] = useState(false);
  const [selectedBranchDetails, setSelectedBranchDetails] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [branchDetailsTab, setBranchDetailsTab] = useState(0);
  
  // New states for trainer students dialog
  const [trainerStudentsDialog, setTrainerStudentsDialog] = useState(false);
  const [selectedTrainerStudents, setSelectedTrainerStudents] = useState([]);
  const [selectedTrainerName, setSelectedTrainerName] = useState('');

  /* ============== Fetch Branches ============== */
  const fetchBranches = async () => {
    try {
      const response = await fetch('https://api1.sstli.com/api/branches/all');
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      setBranches(data);
      return data;
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('فشل في تحميل بيانات الفروع');
      return [];
    }
  };

  /* ============== Fetch Trainers ============== */
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

  /* ============== Fetch Branch Statistics ============== */
  const fetchBranchStatistics = async (branchGuid = 'all') => {
    try {
      setLoading(true);
      
      // Fetch attendance data
      const attendanceResponse = await fetch('https://filesregsiteration.sstli.com/get_attendance.php');
      const attendanceResult = await attendanceResponse.json();

      if (!attendanceResult.success) {
        throw new Error('Failed to fetch attendance data');
      }

      // Fetch students data for all branches or specific branch
      let studentsData = [];
      if (branchGuid === 'all') {
        // Fetch students from all branches
        const studentsPromises = branches.map(branch => 
          fetch(`https://api1.sstli.com/api/StudentStudyInfo/by-branch/${branch.guid}`)
            .then(res => res.json())
            .then(data => data.map(student => ({ ...student, branchGuid: branch.guid, branchName: branch.name })))
        );
        const studentsResults = await Promise.all(studentsPromises);
        studentsData = studentsResults.flat();
      } else {
        // Fetch students from specific branch
        const response = await fetch(`https://api1.sstli.com/api/StudentStudyInfo/by-branch/${branchGuid}`);
        studentsData = await response.json();
      }

      // Calculate statistics
      const stats = calculateBranchStatistics(attendanceResult.data, studentsData, branches);
      setBranchStats(stats);

    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  /* ============== Calculate Branch Statistics ============== */
  const calculateBranchStatistics = (attendanceData, studentsData, branchesList) => {
    const IDEAL_ATTENDANCE_DAYS = 14;
    
    // Filter attendance data by date range
    const filteredAttendance = attendanceData.filter(item => {
      const itemDate = parseISO(item.attendance_date);
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      return isWithinInterval(itemDate, { start, end });
    });

    // Calculate statistics per branch
    const branchStatistics = {};
    
    branchesList.forEach(branch => {
      // Get students for this branch
      const branchStudents = studentsData.filter(student => 
        student.branchGuid === branch.guid || branch.guid === 'all'
      );

      // Get attendance for this branch's students
      const branchStudentIds = branchStudents.map(student => student.nationalId);
      const branchAttendance = filteredAttendance.filter(item => 
        branchStudentIds.includes(item.national_id)
      );

      // Calculate student stats
      const studentStats = branchStudents.map(student => {
        const studentAttendance = branchAttendance.filter(item => item.national_id === student.nationalId);
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

      // Calculate diploma stats
      const diplomaStats = branchStudents.reduce((acc, student) => {
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

      // Calculate trainer stats
      const trainerStats = branchAttendance.reduce((acc, item) => {
        const trainerGuid = item.created_by || 'غير معروف';
        const trainer = trainers.find(t => t.guid === trainerGuid);
        const trainerName = trainer ? trainer.fullName : trainerGuid;
        
        if (!acc[trainerGuid]) {
          acc[trainerGuid] = {
            guid: trainerGuid,
            name: trainerName,
            fullName: trainerName,
            totalRecords: 0,
            uniqueStudents: new Set(),
            studentDetails: [],
            attendanceDates: new Set()
          };
        }
        acc[trainerGuid].totalRecords++;
        acc[trainerGuid].uniqueStudents.add(item.national_id);
        acc[trainerGuid].attendanceDates.add(item.attendance_date);
        
        const student = branchStudents.find(s => s.nationalId === item.national_id);
        if (student) {
          const existingStudent = acc[trainerGuid].studentDetails.find(s => s.nationalId === student.nationalId);
          if (!existingStudent) {
            acc[trainerGuid].studentDetails.push({
              ...student,
              attendanceCount: 1,
              firstAttendance: item.attendance_date,
              lastAttendance: item.attendance_date
            });
          } else {
            existingStudent.attendanceCount++;
            existingStudent.lastAttendance = item.attendance_date;
          }
        }
        
        return acc;
      }, {});

      Object.values(trainerStats).forEach(trainer => {
        trainer.uniqueStudentsCount = trainer.uniqueStudents.size;
        trainer.uniqueStudents = Array.from(trainer.uniqueStudents);
        trainer.attendanceDatesCount = trainer.attendanceDates.size;
        trainer.avgAttendancePerStudent = trainer.uniqueStudentsCount > 0 
          ? Math.round((trainer.totalRecords / trainer.uniqueStudentsCount) * 10) / 10 
          : 0;
        
        // Sort student details by attendance count (descending)
        trainer.studentDetails.sort((a, b) => b.attendanceCount - a.attendanceCount);
        
        // Add top students for this trainer (top 10 by attendance count)
        trainer.topStudents = trainer.studentDetails.slice(0, 10);
      });

      const totalStudents = branchStudents.length;
      const attendedStudents = studentStats.filter(student => student.hasAttended).length;
      const totalAttendanceRecords = branchAttendance.length;
      const avgAttendancePercentage = studentStats.length > 0 ? 
        Math.round(studentStats.reduce((sum, student) => sum + student.attendancePercentage, 0) / studentStats.length) : 0;

      // Top students in this branch
      const topStudents = [...studentStats]
        .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
        .slice(0, 5);

      // Top diplomas in this branch
      const topDiplomas = Object.values(diplomaStats)
        .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
        .slice(0, 5);

      // Top trainers in this branch
      const topTrainers = Object.values(trainerStats)
        .sort((a, b) => b.totalRecords - a.totalRecords)
        .slice(0, 5);

      // All trainers sorted by performance
      const allTrainers = Object.values(trainerStats)
        .sort((a, b) => b.totalRecords - a.totalRecords);

      branchStatistics[branch.guid] = {
        branchInfo: branch,
        totalStudents,
        attendedStudents,
        totalAttendanceRecords,
        avgAttendancePercentage,
        studentStats,
        diplomaStats,
        trainerStats,
        topStudents,
        topDiplomas,
        topTrainers,
        allTrainers,
        attendanceDistribution: {
          excellent: studentStats.filter(s => s.attendancePercentage >= 80).length,
          good: studentStats.filter(s => s.attendancePercentage >= 60 && s.attendancePercentage < 80).length,
          poor: studentStats.filter(s => s.attendancePercentage < 60).length,
          absent: studentStats.filter(s => s.attendancePercentage === 0).length
        }
      };
    });

    return branchStatistics;
  };

  /* ============== Effects ============== */
  useEffect(() => {
    const initializeData = async () => {
      await fetchTrainers();
      const branchesData = await fetchBranches();
      if (branchesData.length > 0) {
        await fetchBranchStatistics('all');
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      fetchBranchStatistics(selectedBranch);
    }
  }, [selectedBranch, startDate, endDate]);

  /* ============== Handlers ============== */
  const handleRefresh = () => {
    fetchBranchStatistics(selectedBranch);
  };

  const handleViewBranchDetails = (branch) => {
    setSelectedBranchDetails(branch);
    setBranchDetailsDialog(true);
    setBranchDetailsTab(0);
  };

  const handleBranchDetailsTabChange = (event, newValue) => {
    setBranchDetailsTab(newValue);
  };

  // New handler for viewing trainer students
  const handleViewTrainerStudents = (trainer, branchData) => {
    setSelectedTrainerStudents(trainer.topStudents || []);
    setSelectedTrainerName(trainer.name);
    setTrainerStudentsDialog(true);
  };

  /* ============== Analytics Calculations ============== */
  const overallStats = useMemo(() => {
    if (!branchStats || Object.keys(branchStats).length === 0) return null;

    const allBranches = Object.values(branchStats);
    
    const totalStudents = allBranches.reduce((sum, branch) => sum + branch.totalStudents, 0);
    const totalAttendedStudents = allBranches.reduce((sum, branch) => sum + branch.attendedStudents, 0);
    const totalAttendanceRecords = allBranches.reduce((sum, branch) => sum + branch.totalAttendanceRecords, 0);
    const overallAvgAttendance = allBranches.length > 0 ? 
      Math.round(allBranches.reduce((sum, branch) => sum + branch.avgAttendancePercentage, 0) / allBranches.length) : 0;

    // Sort branches by attendance percentage (highest to lowest)
    const sortedBranches = allBranches
      .filter(branch => branch.totalStudents > 0)
      .sort((a, b) => b.avgAttendancePercentage - a.avgAttendancePercentage);

    const topBranches = sortedBranches.slice(0, 5);

    // Branch performance distribution
    const performanceDistribution = {
      excellent: allBranches.filter(branch => branch.avgAttendancePercentage >= 80).length,
      good: allBranches.filter(branch => branch.avgAttendancePercentage >= 60 && branch.avgAttendancePercentage < 80).length,
      poor: allBranches.filter(branch => branch.avgAttendancePercentage < 60).length
    };

    return {
      totalStudents,
      totalAttendedStudents,
      totalAttendanceRecords,
      overallAvgAttendance,
      topBranches,
      sortedBranches,
      performanceDistribution,
      totalBranches: allBranches.length
    };
  }, [branchStats]);

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
    }
  };

  // Top Branches Chart Data
  const topBranchesChartData = {
    labels: overallStats?.topBranches.map(branch => branch.branchInfo.name) || [],
    datasets: [
      {
        label: 'نسبة الحضور %',
        data: overallStats?.topBranches.map(branch => branch.avgAttendancePercentage) || [],
        backgroundColor: [
          colorPalette.primary,
          colorPalette.primaryLight,
          colorPalette.success,
          colorPalette.warning,
          colorPalette.error
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  // Performance Distribution Chart Data
  const performanceDistributionChartData = {
    labels: ['ممتاز (80%+)', 'جيد (60-79%)', 'ضعيف (<60%)'],
    datasets: [
      {
        data: overallStats ? [
          overallStats.performanceDistribution.excellent,
          overallStats.performanceDistribution.good,
          overallStats.performanceDistribution.poor
        ] : [0, 0, 0],
        backgroundColor: [
          colorPalette.success,
          colorPalette.warning,
          colorPalette.error
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 15
      }
    ]
  };

  /* ============== Render ============== */
  return (
    <Box sx={{ direction: 'rtl', backgroundColor: colorPalette.background, minHeight: '100vh' }}>
      <Sidebar />

      <Box component="main" sx={{
        flexGrow: 1, 
        p: 4, 
        marginLeft: '280px',
        minHeight: '100vh',
        backgroundColor: colorPalette.background, 
        direction: 'ltr'
      }}>
        
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
                <CorporateIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontFamily: '"Cairo", sans-serif', mb: 1 }}>
                  تقارير الحضور لجميع الفروع
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
                  إدارة عليا - عرض شامل لجميع الفروع
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
            </Box>
          </Box>
        </Paper>

        {/* Filters */}
        <Paper elevation={0} sx={{
          mb: 4, p: 3,
          borderRadius: '16px',
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '& fieldset': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover fieldset': {
                      borderColor: colorPalette.primary,
                    },
                  }
                }}
              />
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '& fieldset': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover fieldset': {
                      borderColor: colorPalette.primary,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  fontFamily: '"Cairo", sans-serif',
                  fontWeight: 600,
                  color: colorPalette.textLight
                }}>
                  اختر الفرع
                </InputLabel>
                <Select
                  value={selectedBranch}
                  label="اختر الفرع"
                  onChange={(e) => setSelectedBranch(e.target.value)}
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
                  <MenuItem value="all" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    جميع الفروع
                  </MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.guid} value={branch.guid} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      {branch.name}
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
              جاري تحميل بيانات الفروع...
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
        ) : !overallStats ? (
          <Paper elevation={0} sx={{
            p: 6, 
            textAlign: 'center',
            border: `2px dashed ${colorPalette.primaryLight}`,
            borderRadius: '16px',
            backgroundColor: colorPalette.background
          }}>
            <BusinessIcon sx={{ 
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
          </Paper>
        ) : (
          <>
            {/* Overall Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={2.4}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 40, color: colorPalette.primary, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {overallStats.totalBranches}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      إجمالي الفروع
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={2.4}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <GroupsIcon sx={{ fontSize: 40, color: colorPalette.success, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {overallStats.totalStudents}
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
                    <PersonIcon sx={{ fontSize: 40, color: colorPalette.primaryDark, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {overallStats.totalAttendedStudents}
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
                    <TodayIcon sx={{ fontSize: 40, color: colorPalette.warning, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {overallStats.totalAttendanceRecords}
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
                    <TrendingUpIcon sx={{ fontSize: 40, color: colorPalette.primaryLight, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {overallStats.overallAvgAttendance}%
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      متوسط الحضور
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Top Branches Chart */}
              <Grid item xs={12} md={8}>
                <ChartCard elevation={3}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrophyIcon sx={{ color: colorPalette.primary, mr: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        أفضل الفروع في نسبة الحضور
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Bar 
                        data={topBranchesChartData} 
                        options={{
                          ...chartOptions,
                          indexAxis: 'y',
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              ...chartOptions.plugins.title,
                              text: 'أعلى 5 فروع في نسبة الحضور'
                            }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>

              {/* Performance Distribution Chart */}
              <Grid item xs={12} md={4}>
                <ChartCard elevation={3}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AnalyticsIcon sx={{ color: colorPalette.primary, mr: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                        توزيع أداء الفروع
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Doughnut 
                        data={performanceDistributionChartData} 
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              ...chartOptions.plugins.title,
                              text: 'توزيع الفروع حسب مستوى الأداء'
                            }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>
            </Grid>

            {/* Top Branches Section */}
            <Typography variant="h5" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              fontWeight: 700,
              color: colorPalette.textDark,
              mb: 3
            }}>
              أفضل الفروع أداءً
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {overallStats.topBranches.map((branch, index) => (
                <Grid item xs={12} md={4} key={branch.branchInfo.guid}>
                  <BranchCard rank={index + 1}>
                    <RankBadge rank={index + 1}>
                      {index + 1}
                    </RankBadge>
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <BranchIcon sx={{ 
                        fontSize: 48, 
                        color: colorPalette.primary,
                        mb: 2 
                      }} />
                      <Typography variant="h6" sx={{ 
                        fontFamily: '"Cairo", sans-serif', 
                        fontWeight: 700,
                        color: colorPalette.textDark,
                        mb: 1
                      }}>
                        {branch.branchInfo.name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontFamily: '"Cairo", sans-serif', 
                        color: colorPalette.textLight,
                        mb: 2
                      }}>
                        {branch.branchInfo.code} - {branch.branchInfo.status}
                      </Typography>
                      
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                            الطلاب
                          </Typography>
                          <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                            {branch.totalStudents}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                            الحاضرين
                          </Typography>
                          <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                            {branch.attendedStudents}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Chip 
                        label={`${branch.avgAttendancePercentage}% نسبة الحضور`}
                        color={
                          branch.avgAttendancePercentage >= 80 ? 'success' :
                          branch.avgAttendancePercentage >= 60 ? 'warning' : 'error'
                        }
                        sx={{ 
                          fontFamily: '"Cairo", sans-serif',
                          fontWeight: 600,
                          mb: 2
                        }}
                      />

                      <StyledButton
                        fullWidth
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewBranchDetails(branch)}
                        sx={{
                          borderColor: colorPalette.primary,
                          color: colorPalette.primary
                        }}
                      >
                        عرض التفاصيل
                      </StyledButton>
                    </CardContent>
                  </BranchCard>
                </Grid>
              ))}
            </Grid>

            {/* All Branches Table - Sorted by Attendance Percentage */}
            <Paper elevation={0} sx={{ 
              borderRadius: '16px', 
              overflow: 'hidden',
              border: `1px solid ${colorPalette.primaryLighter}`,
              background: 'linear-gradient(135deg, #ffffff, #f8fbf9)'
            }}>
              <Box sx={{ 
                p: 3, 
                borderBottom: `1px solid ${colorPalette.primaryLighter}`,
                backgroundColor: colorPalette.primaryLighter
              }}>
                <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, color: colorPalette.textDark }}>
                  جميع الفروع (مرتبة حسب نسبة الحضور من الأعلى إلى الأقل)
                </Typography>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: colorPalette.primaryLighter }}>
                    <TableRow>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>الترتيب</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>اسم الفرع</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>الكود</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>الحالة</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>إجمالي الطلاب</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>الطلبة الحاضرين</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>نسبة الحضور</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>الإجراءات</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overallStats.sortedBranches.map((branch, index) => (
                      <StyledTableRow key={branch.branchInfo.guid}>
                        <StyledTableCell>
                          <Chip 
                            label={index + 1}
                            size="small"
                            color={index < 3 ? 'primary' : 'default'}
                            sx={{ fontFamily: '"Cairo", sans-serif' }}
                          />
                        </StyledTableCell>
                        <StyledTableCell>
                          <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600 }}>
                            {branch.branchInfo.name}
                          </Typography>
                        </StyledTableCell>
                        <StyledTableCell>{branch.branchInfo.code}</StyledTableCell>
                        <StyledTableCell>
                          <Chip 
                            label={branch.branchInfo.status}
                            color={branch.branchInfo.status === 'نشط' ? 'success' : 'default'}
                            size="small"
                            sx={{ fontFamily: '"Cairo", sans-serif' }}
                          />
                        </StyledTableCell>
                        <StyledTableCell>
                          {branch.totalStudents}
                        </StyledTableCell>
                        <StyledTableCell>
                          {branch.attendedStudents}
                        </StyledTableCell>
                        <StyledTableCell>
                          <Chip 
                            label={`${branch.avgAttendancePercentage}%`}
                            color={
                              branch.avgAttendancePercentage >= 80 ? 'success' :
                              branch.avgAttendancePercentage >= 60 ? 'warning' : 'error'
                            }
                            size="small"
                            sx={{ fontFamily: '"Cairo", sans-serif' }}
                          />
                        </StyledTableCell>
                        <StyledTableCell>
                          <StyledButton
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewBranchDetails(branch)}
                            sx={{
                              borderColor: colorPalette.primary,
                              color: colorPalette.primary
                            }}
                          >
                            التفاصيل
                          </StyledButton>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>

      {/* Branch Details Dialog */}
      <BranchDetailsDialog 
        open={branchDetailsDialog}
        onClose={() => setBranchDetailsDialog(false)}
        branchData={selectedBranchDetails}
        colorPalette={colorPalette}
        startDate={startDate}
        endDate={endDate}
        currentTab={branchDetailsTab}
        onTabChange={handleBranchDetailsTabChange}
        onViewTrainerStudents={handleViewTrainerStudents}
      />

      {/* Trainer Students Dialog */}
      <TrainerStudentsDialog 
        open={trainerStudentsDialog}
        onClose={() => setTrainerStudentsDialog(false)}
        students={selectedTrainerStudents}
        trainerName={selectedTrainerName}
        colorPalette={colorPalette}
      />
    </Box>
  );
};

// Branch Details Dialog Component
const BranchDetailsDialog = ({ 
  open, 
  onClose, 
  branchData, 
  colorPalette, 
  startDate, 
  endDate, 
  currentTab, 
  onTabChange,
  onViewTrainerStudents 
}) => {
  if (!branchData) return null;

  // Chart options for branch details
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
      tooltip: {
        titleFont: {
          family: '"Cairo", sans-serif'
        },
        bodyFont: {
          family: '"Cairo", sans-serif'
        },
        rtl: true
      }
    }
  };

  // Attendance distribution chart data
  const attendanceDistributionChartData = {
    labels: ['ممتاز (80%+)', 'جيد (60-79%)', 'ضعيف (<60%)', 'لم يحضر'],
    datasets: [
      {
        data: [
          branchData.attendanceDistribution?.excellent || 0,
          branchData.attendanceDistribution?.good || 0,
          branchData.attendanceDistribution?.poor || 0,
          branchData.attendanceDistribution?.absent || 0
        ],
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

  // Top diplomas chart data
  const topDiplomasChartData = {
    labels: branchData.topDiplomas?.map(diploma => diploma.name) || [],
    datasets: [
      {
        label: 'نسبة الحضور %',
        data: branchData.topDiplomas?.map(diploma => diploma.attendancePercentage) || [],
        backgroundColor: [
          colorPalette.primary,
          colorPalette.primaryLight,
          colorPalette.success,
          colorPalette.warning,
          colorPalette.error
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  // Top trainers chart data
  const topTrainersChartData = {
    labels: branchData.topTrainers?.map(trainer => trainer.name) || [],
    datasets: [
      {
        label: 'عدد السجلات',
        data: branchData.topTrainers?.map(trainer => trainer.totalRecords) || [],
        backgroundColor: colorPalette.primary + '80',
        borderColor: colorPalette.primary,
        borderWidth: 2
      },
      {
        label: 'عدد الطلاب',
        data: branchData.topTrainers?.map(trainer => trainer.uniqueStudentsCount) || [],
        backgroundColor: colorPalette.success + '80',
        borderColor: colorPalette.success,
        borderWidth: 2
      }
    ]
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ffffff, #f8fbf9)',
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: '"Cairo", sans-serif', 
        textAlign: 'center',
        background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
        color: 'white',
        fontWeight: 700,
        py: 3
      }}>
        <BusinessIcon sx={{ mr: 2 }} />
        تفاصيل الفرع: {branchData.branchInfo?.name}
        <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
          {format(new Date(startDate), 'yyyy/MM/dd')} - {format(new Date(endDate), 'yyyy/MM/dd')}
        </Typography>
      </DialogTitle>

      {/* Tabs for Branch Details */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={onTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: colorPalette.primary,
              height: 3,
              borderRadius: '2px'
            }
          }}
        >
          <StyledTab label="نظرة عامة" />
          <StyledTab label="المدربين" />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 3 }}>
        {currentTab === 0 && (
          /* Overview Tab */
          <>
            {/* Branch Overview Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <GroupsIcon sx={{ fontSize: 40, color: colorPalette.primary, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {branchData.totalStudents || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      إجمالي الطلاب
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PersonIcon sx={{ fontSize: 40, color: colorPalette.success, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {branchData.attendedStudents || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      الطلبة الحاضرين
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TodayIcon sx={{ fontSize: 40, color: colorPalette.warning, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {branchData.totalAttendanceRecords || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      سجلات الحضور
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: colorPalette.primaryLight, mb: 2 }} />
                    <Typography variant="h4" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                      {branchData.avgAttendancePercentage || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                      متوسط الحضور
                    </Typography>
                  </CardContent>
                </StatCard>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Attendance Distribution */}
              <Grid item xs={12} md={6}>
                <ChartCard>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, mb: 2, color: colorPalette.textDark }}>
                      توزيع مستوى الحضور
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Doughnut 
                        data={attendanceDistributionChartData} 
                        options={chartOptions} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>

              {/* Top Diplomas */}
              <Grid item xs={12} md={6}>
                <ChartCard>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, mb: 2, color: colorPalette.textDark }}>
                      أفضل البرامج التدريبية
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Bar 
                        data={topDiplomasChartData} 
                        options={{
                          ...chartOptions,
                          indexAxis: 'y'
                        }} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>

              {/* Top Trainers */}
              <Grid item xs={12} md={12}>
                <ChartCard>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, mb: 2, color: colorPalette.textDark }}>
                      أفضل المدربين
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 300 }}>
                      <Bar 
                        data={topTrainersChartData} 
                        options={chartOptions} 
                      />
                    </Box>
                  </CardContent>
                </ChartCard>
              </Grid>
            </Grid>

            {/* Top Performers Section */}
            <Grid container spacing={3}>
              {/* Top Students */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  borderRadius: '16px',
                  border: `1px solid ${colorPalette.primaryLighter}`,
                  background: 'linear-gradient(135deg, #ffffff, #f8fbf9)'
                }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, mb: 3, color: colorPalette.textDark }}>
                    أفضل 5 طلاب
                  </Typography>
                  
                  <Stack spacing={2}>
                    {branchData.topStudents?.map((student, index) => (
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
                  <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, mb: 3, color: colorPalette.textDark }}>
                    أفضل البرامج
                  </Typography>
                  
                  <Stack spacing={2}>
                    {branchData.topDiplomas?.map((diploma, index) => (
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
                        <Chip 
                          label={`${diploma.attendancePercentage}%`}
                          color={diploma.attendancePercentage >= 80 ? 'success' : diploma.attendancePercentage >= 60 ? 'warning' : 'error'}
                          size="small"
                          sx={{ fontFamily: '"Cairo", sans-serif' }}
                        />
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
                  <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600, mb: 3, color: colorPalette.textDark }}>
                    أفضل المدربين
                  </Typography>
                  
                  <Stack spacing={2}>
                    {branchData.topTrainers?.map((trainer, index) => (
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
                        <Chip 
                          label={trainer.totalRecords}
                          color="primary"
                          size="small"
                          sx={{ fontFamily: '"Cairo", sans-serif' }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}

        {currentTab === 1 && (
          /* Trainers Tab */
          <Box>
            <Typography variant="h5" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              fontWeight: 700,
              color: colorPalette.textDark,
              mb: 3
            }}>
              جميع المدربين في الفرع
            </Typography>

            {branchData.allTrainers && branchData.allTrainers.length > 0 ? (
              <Grid container spacing={3}>
                {branchData.allTrainers.map((trainer, index) => (
                  <Grid item xs={12} md={6} key={trainer.guid}>
                    <Paper elevation={0} sx={{ 
                      p: 3, 
                      borderRadius: '16px',
                      border: `1px solid ${colorPalette.primaryLighter}`,
                      background: 'linear-gradient(135deg, #ffffff, #f8fbf9)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px ${alpha(colorPalette.primary, 0.15)}`
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={index + 1}
                            size="small"
                            color={index < 3 ? 'primary' : 'default'}
                            sx={{ mr: 2, fontFamily: '"Cairo", sans-serif' }}
                          />
                          <Box>
                            <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700, color: colorPalette.textDark }}>
                              {trainer.name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              {trainer.fullName}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={`${trainer.totalRecords} سجل`}
                            color="primary"
                            size="small"
                            sx={{ fontFamily: '"Cairo", sans-serif' }}
                          />
                          <Chip 
                            label={`${trainer.uniqueStudentsCount} طالب`}
                            color="secondary"
                            size="small"
                            sx={{ fontFamily: '"Cairo", sans-serif' }}
                          />
                        </Box>
                      </Box>

                      {/* Trainer Statistics */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <TodayIcon sx={{ fontSize: 24, color: colorPalette.primary, mb: 1 }} />
                            <Typography variant="h6" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                              {trainer.totalRecords}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              السجلات
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <PersonIcon sx={{ fontSize: 24, color: colorPalette.success, mb: 1 }} />
                            <Typography variant="h6" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                              {trainer.uniqueStudentsCount}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              الطلاب
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <CalendarIcon sx={{ fontSize: 24, color: colorPalette.warning, mb: 1 }} />
                            <Typography variant="h6" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                              {trainer.attendanceDatesCount}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              الأيام
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <AnalyticsIcon sx={{ fontSize: 24, color: colorPalette.primaryLight, mb: 1 }} />
                            <Typography variant="h6" component="div" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                              {trainer.avgAttendancePerStudent}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: '"Cairo", sans-serif', color: colorPalette.textLight }}>
                              متوسط
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Action Button */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => onViewTrainerStudents(trainer, branchData)}
                          sx={{
                            borderColor: colorPalette.primary,
                            color: colorPalette.primary,
                            fontFamily: '"Cairo", sans-serif',
                            fontWeight: 600,
                            borderRadius: '8px',
                            '&:hover': {
                              backgroundColor: colorPalette.primaryLighter,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.2)}`
                            }
                          }}
                        >
                          عرض تفاصيل الطلاب
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper elevation={0} sx={{ 
                p: 6, 
                textAlign: 'center',
                border: `2px dashed ${colorPalette.primaryLight}`,
                borderRadius: '16px',
                backgroundColor: colorPalette.background
              }}>
                <PersonIcon sx={{ fontSize: 80, mb: 2, color: colorPalette.primaryLight }} />
                <Typography variant="h5" sx={{ 
                  fontFamily: '"Cairo", sans-serif', 
                  color: colorPalette.textLight,
                  fontWeight: 600,
                  mb: 1
                }}>
                  لا توجد بيانات للمدربين
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            fontFamily: '"Cairo", sans-serif',
            borderColor: colorPalette.primary,
            color: colorPalette.primary,
            borderRadius: '10px',
            px: 3
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Trainer Students Dialog Component
const TrainerStudentsDialog = ({ open, onClose, students, trainerName, colorPalette }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ffffff, #f8fbf9)',
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: '"Cairo", sans-serif', 
        textAlign: 'center',
        background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
        color: 'white',
        fontWeight: 700,
        py: 3
      }}>
        <PersonIcon sx={{ mr: 2 }} />
        أفضل الطلاب حضوار - المدرب: {trainerName}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {students && students.length > 0 ? (
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: '12px', border: `1px solid ${colorPalette.primaryLighter}` }}>
            <Table>
              <TableHead sx={{ backgroundColor: colorPalette.primaryLighter }}>
                <TableRow>
                  <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>الترتيب</StyledTableCell>
                  <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>اسم الطالب</StyledTableCell>
                  <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>رقم الهوية</StyledTableCell>
                  <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>الدبلوم</StyledTableCell>
                  <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>مرات الحضور</StyledTableCell>
                  <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>أول حضور</StyledTableCell>
                  <StyledTableCell sx={{ fontWeight: 700, color: colorPalette.textDark }}>آخر حضور</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => (
                  <StyledTableRow key={student.nationalId}>
                    <StyledTableCell>
                      <Chip 
                        label={index + 1}
                        size="small"
                        color={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'primary' : 'default'}
                        sx={{ fontFamily: '"Cairo", sans-serif' }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography variant="body2" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 600 }}>
                        {student.studentName}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>{student.nationalId}</StyledTableCell>
                    <StyledTableCell>{student.diplomName}</StyledTableCell>
                    <StyledTableCell>
                      <Chip 
                        label={student.attendanceCount}
                        color="primary"
                        size="small"
                        sx={{ fontFamily: '"Cairo", sans-serif' }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      {student.firstAttendance ? format(parseISO(student.firstAttendance), 'yyyy/MM/dd') : '-'}
                    </StyledTableCell>
                    <StyledTableCell>
                      {student.lastAttendance ? format(parseISO(student.lastAttendance), 'yyyy/MM/dd') : '-'}
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper elevation={0} sx={{ 
            p: 6, 
            textAlign: 'center',
            border: `2px dashed ${colorPalette.primaryLight}`,
            borderRadius: '16px',
            backgroundColor: colorPalette.background
          }}>
            <GroupsIcon sx={{ fontSize: 80, mb: 2, color: colorPalette.primaryLight }} />
            <Typography variant="h5" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              color: colorPalette.textLight,
              fontWeight: 600,
              mb: 1
            }}>
              لا توجد بيانات للطلاب
            </Typography>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            fontFamily: '"Cairo", sans-serif',
            borderColor: colorPalette.primary,
            color: colorPalette.primary,
            borderRadius: '10px',
            px: 3
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminBranchesReports;