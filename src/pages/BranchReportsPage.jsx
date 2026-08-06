import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  CircularProgress,
  Alert,
  Button,
  Divider,
  TextField,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  Card,
  CardContent,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Pagination,
  alpha
} from '@mui/material';
import {List,ListItem,ListItemText} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import TodayIcon from '@mui/icons-material/Today';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Sidebar from '../components/Sidebar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ExportReportsDialog from "../components/ExportReportsDialog";


// Create custom theme with #80b49e as primary color
const customTheme = createTheme({
  palette: {
    primary: {
      main: '#80b49e',
      light: '#a8d5c1',
      dark: '#5a8f7d',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ffb74d',
      light: '#ffe97d',
      dark: '#c88719',
    },
    background: {
      default: '#f8fbfa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
  },
  typography: {
    fontFamily: '"Cairo", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const BranchReportsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exportOpen, setExportOpen] = useState(false);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchesWithReports, setBranchesWithReports] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [dateLoading, setDateLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState('all'); // 'all', 'with', 'without'
  const [stats, setStats] = useState({
    totalBranches: 0,
    withReports: 0,
    withoutReports: 0,
    percentageSubmitted: 0
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch all branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setBranchLoading(true);
        const response = await fetch('https://api1.sstli.com/api/branches/all');
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch branches');
        setBranches(data);
        
        // Check which branches have reports for the current date
        await fetchBranchesWithReports();
      } catch (err) {
        setError(err.message);
      } finally {
        setBranchLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Update stats when branches or branchesWithReports change
  useEffect(() => {
    if (branches.length > 0) {
      const withReportsCount = branchesWithReports.length;
      const withoutReportsCount = branches.length - withReportsCount;
      const percentage = Math.round((withReportsCount / branches.length) * 100);
      
      setStats({
        totalBranches: branches.length,
        withReports: withReportsCount,
        withoutReports: withoutReportsCount,
        percentageSubmitted: percentage
      });
    }
  }, [branches, branchesWithReports]);

  // Fetch branches that have reports for the selected date
  const fetchBranchesWithReports = async (dateObj) => {
    if (!dateObj || isNaN(dateObj)) {
      console.error("Invalid date object received:", dateObj);
      return;
    }

    try {
      const formattedDate = format(dateObj, 'yyyy-MM-dd');
      console.log("Fetching reports for:", formattedDate);
      
      setDateLoading(true);
      const response = await fetch(
        `https://filesregsiteration.sstli.com/get_all_reports_by_day.php?report_date=${formattedDate}`
      );
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch reports');
      }
      
      setBranchesWithReports(data.branch_guids || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setBranchesWithReports([]);
    } finally {
      setDateLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = async (date) => {
    if (!date || isNaN(date)) {
      console.error("Invalid date selected:", date);
      return;
    }

    console.log("Raw selected date:", date);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log("Formatted date:", formattedDate);
      
      setSelectedDate(date);
      setReportData(null);
      setSelectedBranch(null);
      await fetchBranchesWithReports(date);
    } catch (err) {
      console.error("Date formatting error:", err);
    }
  };

  // Fetch reports when branch is selected
  const fetchReports = async (branchGuid) => {
    if (!branchGuid) return;

    try {
      setLoading(true);
      setError(null);
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const url = `https://filesregsiteration.sstli.com/get_reports_by_branch.php?branch_guid=${branchGuid}&report_date=${formattedDate}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch reports');
      }

      setReportData(data);
      setSelectedBranch(branchGuid);
    } catch (err) {
      setError(err.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedBranch(null);
    setReportData(null);
  };

  const handleReportFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setReportFilter(newFilter);
      setPage(0); // Reset to first page when filter changes
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderStatusChip = (status) => {
    const statusMap = {
      present: { label: 'حاضر', color: 'success' },
      absent: { label: 'غائب', color: 'error' },
      permission: { label: 'استئذان', color: 'warning' },
      leave: { label: 'إجازة', color: 'info' }
    };

    return (
      <Chip 
        label={statusMap[status]?.label || 'غير محدد'} 
        color={statusMap[status]?.color || 'default'} 
        size="small"
        sx={{ 
          fontWeight: 600,
          minWidth: 80,
          borderRadius: 1
        }}
      />
    );
  };

  const renderListSection = (title, items = []) => (
    <Box sx={{ mb: 4, p: 3, backgroundColor: theme.palette.background.paper, borderRadius: 2, boxShadow: theme.shadows[1] }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
        {title}
        <Chip label={items.length} size="small" sx={{ ml: 1 }} />
      </Typography>
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        <List dense>
          {items.map((item, index) => (
            <ListItem 
              key={index}
              sx={{ 
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <ListItemText 
                primary={`${index + 1}. ${item.item_text || item.visit_text || item.task_text || item.complaint_text || item.suggestion_text}`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  const renderDiplomaSection = (title, items = []) => (
    <Box sx={{ mb: 4, p: 3, backgroundColor: theme.palette.background.paper, borderRadius: 2, boxShadow: theme.shadows[1] }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
        {title}
        <Chip label={items.length} size="small" sx={{ ml: 1 }} />
      </Typography>
      <TableContainer sx={{ maxHeight: 300 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>اسم الدبلوم</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100], textAlign: 'center' }}>العدد</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100], textAlign: 'center' }}>الدفعة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: theme.palette.action.hover } }}>
                <TableCell>{item.diploma_name}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{item.count}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{item.batch}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Filter branches based on search text and report filter
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      branch.name.toLowerCase().includes(searchText.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchText.toLowerCase());
    
    const hasReport = branchesWithReports.includes(branch.guid);
    
    if (reportFilter === 'all') return matchesSearch;
    if (reportFilter === 'with') return matchesSearch && hasReport;
    if (reportFilter === 'without') return matchesSearch && !hasReport;
    
    return matchesSearch;
  });

  // Paginate branches
  const paginatedBranches = filteredBranches.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const hasReportData = reportData && reportData.reports && reportData.reports.length > 0;
  const currentReport = hasReportData ? reportData.reports[0] : null;
  const selectedBranchName = branches.find(b => b.guid === selectedBranch)?.name || '';

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ minHeight: '100vh', backgroundColor: customTheme.palette.background.default }}>
        <Sidebar />
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            pr: isMobile ? 2 : 3,
            pl: isMobile ? 2 : 3,
            marginLeft: isMobile ? 0 : '240px',
            transition: customTheme.transitions.create('margin', {
              easing: customTheme.transitions.easing.sharp,
              duration: customTheme.transitions.duration.leavingScreen,
            }),
            backgroundColor: customTheme.palette.background.default,
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
            <Container maxWidth="xl" sx={{ py: 2 }}>
              <Paper 
                elevation={isMobile ? 0 : 1} 
                sx={{ 
                  p: isMobile ? 2 : 3, 
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: isMobile ? 'none' : customTheme.shadows[3],
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%)',
                  border: `1px solid ${alpha(customTheme.palette.primary.light, 0.3)}`,
                  overflow: 'hidden'
                }}
              >
                {/* Header Section - Compact */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? 2 : 0,
                    mb: 2
                  }}>
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      component="h1" 
                      fontWeight="bold"
                      sx={{ 
                        color: customTheme.palette.primary.dark,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -8,
                          left: 0,
                          width: 60,
                          height: 4,
                          backgroundColor: customTheme.palette.primary.main,
                          borderRadius: 2
                        }
                      }}
                    >
                      تقارير الفروع
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: 2,
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      <Button
  variant="contained"
  startIcon={<CloudDownloadIcon />}
  onClick={() => setExportOpen(true)}
  sx={{
    backgroundColor: customTheme.palette.primary.main,
    "&:hover": { backgroundColor: customTheme.palette.primary.dark },
    borderRadius: 2,
    height: isMobile ? "48px" : "44px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  }}
>
  تصدير التقارير PDF
</Button>

                      <DatePicker
                        label="اختر تاريخ التقرير"
                        value={selectedDate}
                        onChange={(newValue) => {
                          if (newValue && !isNaN(newValue)) {
                            handleDateChange(newValue);
                          } else {
                            console.error("Invalid date selection");
                          }
                        }}
                        renderInput={(params) => (
                          <TextField 
                            {...params}
                            sx={{
                              '& .MuiInputBase-root': { 
                                height: isMobile ? '48px' : '44px',
                                fontSize: isMobile ? '14px' : '13px',
                                borderRadius: 2
                              },
                              minWidth: isMobile ? '100%' : 200,
                              maxWidth: isMobile ? '100%' : 220,
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: customTheme.palette.primary.main,
                                },
                              }
                            }}
                            size="small"
                          />
                        )}
                        inputFormat="dd/MM/yyyy"
                      />
                      
                      {!selectedBranch && (
                        <TextField
                          variant="outlined"
                          placeholder="ابحث عن فرع..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          InputProps={{
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                            sx: { 
                              height: isMobile ? '48px' : '44px',
                              fontSize: isMobile ? '14px' : '13px',
                              borderRadius: 2
                            }
                          }}
                          sx={{
                            minWidth: isMobile ? '100%' : 220,
                            maxWidth: isMobile ? '100%' : 220,
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: customTheme.palette.primary.main,
                              },
                            }
                          }}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ 
                    mt: 1, 
                    mb: 2,
                    borderColor: alpha(customTheme.palette.primary.light, 0.3),
                    borderBottomWidth: 2 
                  }} />
                </Box>
                
                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 2,
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      border: `1px solid ${customTheme.palette.error.light}`,
                      backgroundColor: alpha(customTheme.palette.error.light, 0.1)
                    }}
                  >
                    {error}
                  </Alert>
                )}
                
                {selectedBranch ? (
                  <Box>
                    {hasReportData ? (
                      <>
                        <Box sx={{ mb: 3 }}>
                          <Button
                            variant="outlined"
                            onClick={handleBackToList}
                            sx={{ 
                              mb: 2,
                              borderRadius: 2,
                              borderColor: customTheme.palette.primary.main,
                              color: customTheme.palette.primary.main,
                              '&:hover': {
                                borderColor: customTheme.palette.primary.dark,
                                backgroundColor: alpha(customTheme.palette.primary.light, 0.1)
                              }
                            }}
                            startIcon={<ArrowBackIosIcon sx={{ fontSize: '1rem' }} />}
                            size="small"
                          >
                            العودة إلى قائمة الفروع
                          </Button>
                          
                          <Typography 
                            variant="h5" 
                            gutterBottom 
                            sx={{ 
                              fontWeight: 600,
                              color: customTheme.palette.primary.dark,
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              fontSize: isMobile ? '1.25rem' : '1.5rem'
                            }}
                          >
                            <DescriptionIcon sx={{ ml: 1, color: customTheme.palette.primary.main }} />
                            تقرير {selectedBranchName}
                            {selectedDate && (
                              <Typography 
                                component="span" 
                                sx={{ 
                                  color: customTheme.palette.text.secondary,
                                  fontSize: isMobile ? '0.875rem' : '1rem',
                                  ml: 1,
                                  fontWeight: 500
                                }}
                              >
                                بتاريخ {format(selectedDate, 'yyyy-MM-dd')}
                              </Typography>
                            )}
                          </Typography>
                          
                          <Typography 
                            variant="subtitle1" 
                            color="text.secondary" 
                            gutterBottom
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              backgroundColor: alpha(customTheme.palette.primary.light, 0.1),
                              p: 1.5,
                              borderRadius: 2,
                              width: 'fit-content',
                              fontSize: '0.875rem',
                              border: `1px solid ${alpha(customTheme.palette.primary.light, 0.3)}`
                            }}
                          >
                            <TodayIcon sx={{ ml: 1, fontSize: '1rem', color: customTheme.palette.primary.main }} />
                            <Box component="span" sx={{ ml: 1 }}>
                              تاريخ الإنشاء:
                            </Box>
                            {format(parseISO(currentReport.report_info.created_at), 'yyyy-MM-dd HH:mm')}
                          </Typography>
                          
                          <Divider sx={{ 
                            my: 2, 
                            borderColor: alpha(customTheme.palette.primary.light, 0.3),
                            borderBottomWidth: 2 
                          }} />
                        </Box>
                        
                        {/* Employee Attendance */}
                        <Box sx={{ mb: 3, p: 2, backgroundColor: customTheme.palette.background.paper, borderRadius: 2, boxShadow: customTheme.shadows[1], border: `1px solid ${alpha(customTheme.palette.primary.light, 0.2)}` }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', color: customTheme.palette.primary.dark }}>
                            حضور الموظفين
                            <Chip label={currentReport.employee_attendance.length} size="small" sx={{ ml: 1, backgroundColor: customTheme.palette.primary.light, color: customTheme.palette.primary.dark }} />
                          </Typography>
                          <TableContainer sx={{ maxHeight: 400, borderRadius: 1 }}>
                            <Table stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: customTheme.palette.primary.light, color: customTheme.palette.primary.dark }}>اسم الموظف</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: customTheme.palette.primary.light, color: customTheme.palette.primary.dark, textAlign: 'center' }}>حالة الحضور</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {currentReport.employee_attendance.map((employee, index) => (
                                  <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: alpha(customTheme.palette.primary.light, 0.05) } }}>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ 
                                          width: 8, 
                                          height: 8, 
                                          borderRadius: '50%', 
                                          backgroundColor: customTheme.palette.primary.main,
                                          mr: 1.5
                                        }} />
                                        {employee.employee_name}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                      {renderStatusChip(employee.status)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                        
                        {/* Other Sections */}
                        {renderListSection("مراجعة التدريب الأهلي", currentReport.training_review_items)}
                        {renderListSection("الزيارات الإشرافية", currentReport.supervisory_visits)}
                        {renderListSection("أعمال غير اعتيادية", currentReport.unusual_work_items)}
                        {renderListSection("المهام اليومية", currentReport.daily_tasks)}
                        {renderDiplomaSection("تسجيلات الدبلومات", currentReport.diploma_registrations)}
                        {renderDiplomaSection("حضور الدبلومات", currentReport.diploma_attendance)}
                        {renderDiplomaSection("موافقات الدبلومات", currentReport.diploma_approvals)}
                        {renderListSection("الشكاوي", currentReport.complaints)}
                        {renderListSection("المقترحات", currentReport.suggestions)}
                      </>
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          py: 6,
                          textAlign: 'center',
                          backgroundColor: alpha(customTheme.palette.primary.light, 0.1),
                          borderRadius: 2,
                          border: `2px dashed ${alpha(customTheme.palette.primary.main, 0.3)}`
                        }}
                      >
                        <WarningIcon sx={{ fontSize: 60, color: customTheme.palette.warning.main, mb: 2 }} />
                        <Typography 
                          variant="h6" 
                          color="textSecondary" 
                          sx={{ mb: 2, fontWeight: 500 }}
                        >
                          لا توجد تقارير متاحة للفرع {selectedBranchName} بتاريخ {format(selectedDate, 'yyyy-MM-dd')}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={handleBackToList}
                          sx={{ 
                            mt: 2,
                            backgroundColor: customTheme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: customTheme.palette.primary.dark,
                            }
                          }}
                          startIcon={<ArrowBackIosIcon sx={{ fontSize: '1rem' }} />}
                        >
                          العودة إلى قائمة الفروع
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    {/* Compact Statistics Cards */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ 
                          height: '100%',
                          background: `linear-gradient(135deg, ${alpha(customTheme.palette.primary.light, 0.2)} 0%, ${alpha(customTheme.palette.primary.light, 0.05)} 100%)`,
                          boxShadow: `0 4px 12px ${alpha(customTheme.palette.primary.light, 0.2)}`,
                          p: 1,
                          minHeight: 90,
                          border: `1px solid ${alpha(customTheme.palette.primary.light, 0.3)}`,
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(customTheme.palette.primary.light, 0.3)}`,
                          }
                        }}>
                          <CardContent sx={{ 
                            p: '8px !important',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            justifyContent: 'center'
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 1,
                              gap: 1
                            }}>
                              <BusinessIcon 
                                fontSize="small" 
                                sx={{ 
                                  color: customTheme.palette.primary.dark,
                                  fontSize: isSmallMobile ? '1rem' : '1.25rem'
                                }} 
                              />
                              <Typography 
                                color="textSecondary" 
                                variant="caption" 
                                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                              >
                                إجمالي الفروع
                              </Typography>
                            </Box>
                            <Typography 
                              variant={isSmallMobile ? "h5" : "h4"} 
                              fontWeight="bold"
                              sx={{ 
                                textAlign: 'center',
                                color: customTheme.palette.primary.dark,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              {stats.totalBranches}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ 
                          height: '100%',
                          background: `linear-gradient(135deg, ${alpha(customTheme.palette.success.light, 0.2)} 0%, ${alpha(customTheme.palette.success.light, 0.05)} 100%)`,
                          boxShadow: `0 4px 12px ${alpha(customTheme.palette.success.light, 0.2)}`,
                          p: 1,
                          minHeight: 90,
                          border: `1px solid ${alpha(customTheme.palette.success.light, 0.3)}`,
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(customTheme.palette.success.light, 0.3)}`,
                          }
                        }}>
                          <CardContent sx={{ 
                            p: '8px !important',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            justifyContent: 'center'
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 1,
                              gap: 1
                            }}>
                              <CheckCircleIcon 
                                fontSize="small" 
                                sx={{ 
                                  color: customTheme.palette.success.dark,
                                  fontSize: isSmallMobile ? '1rem' : '1.25rem'
                                }} 
                              />
                              <Typography 
                                color="textSecondary" 
                                variant="caption" 
                                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                              >
                                المقدمة
                              </Typography>
                            </Box>
                            <Typography 
                              variant={isSmallMobile ? "h5" : "h4"} 
                              fontWeight="bold" 
                              sx={{ 
                                textAlign: 'center',
                                color: customTheme.palette.success.dark,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              {stats.withReports}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ 
                          height: '100%',
                          background: `linear-gradient(135deg, ${alpha(customTheme.palette.error.light, 0.2)} 0%, ${alpha(customTheme.palette.error.light, 0.05)} 100%)`,
                          boxShadow: `0 4px 12px ${alpha(customTheme.palette.error.light, 0.2)}`,
                          p: 1,
                          minHeight: 90,
                          border: `1px solid ${alpha(customTheme.palette.error.light, 0.3)}`,
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(customTheme.palette.error.light, 0.3)}`,
                          }
                        }}>
                          <CardContent sx={{ 
                            p: '8px !important',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            justifyContent: 'center'
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 1,
                              gap: 1
                            }}>
                              <WarningIcon 
                                fontSize="small" 
                                sx={{ 
                                  color: customTheme.palette.error.dark,
                                  fontSize: isSmallMobile ? '1rem' : '1.25rem'
                                }} 
                              />
                              <Typography 
                                color="textSecondary" 
                                variant="caption" 
                                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                              >
                                غير المقدمة
                              </Typography>
                            </Box>
                            <Typography 
                              variant={isSmallMobile ? "h5" : "h4"} 
                              fontWeight="bold" 
                              sx={{ 
                                textAlign: 'center',
                                color: customTheme.palette.error.dark,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              {stats.withoutReports}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ 
                          height: '100%',
                          background: `linear-gradient(135deg, ${alpha(customTheme.palette.warning.light, 0.2)} 0%, ${alpha(customTheme.palette.warning.light, 0.05)} 100%)`,
                          boxShadow: `0 4px 12px ${alpha(customTheme.palette.warning.light, 0.2)}`,
                          p: 1,
                          minHeight: 90,
                          border: `1px solid ${alpha(customTheme.palette.warning.light, 0.3)}`,
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(customTheme.palette.warning.light, 0.3)}`,
                          }
                        }}>
                          <CardContent sx={{ 
                            p: '8px !important',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            justifyContent: 'center'
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 1,
                              gap: 1
                            }}>
                              <AssessmentIcon 
                                fontSize="small" 
                                sx={{ 
                                  color: customTheme.palette.warning.dark,
                                  fontSize: isSmallMobile ? '1rem' : '1.25rem'
                                }} 
                              />
                              <Typography 
                                color="textSecondary" 
                                variant="caption" 
                                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                              >
                                نسبة الإنجاز
                              </Typography>
                            </Box>
                            <Typography 
                              variant={isSmallMobile ? "h5" : "h4"} 
                              fontWeight="bold" 
                              sx={{ 
                                textAlign: 'center',
                                color: customTheme.palette.warning.dark,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              {stats.percentageSubmitted}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Filter Section - Compact */}
                    <Box sx={{ 
                      mb: 2, 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: 2,
                      alignItems: isMobile ? 'stretch' : 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: customTheme.palette.primary.dark }}>
                          الفروع المتاحة
                        </Typography>
                        <Chip 
                          label={filteredBranches.length} 
                          sx={{ 
                            fontWeight: 700, 
                            backgroundColor: customTheme.palette.primary.light,
                            color: customTheme.palette.primary.dark
                          }} 
                          size="small"
                        />
                      </Box>
                      
                      <ToggleButtonGroup
                        value={reportFilter}
                        exclusive
                        onChange={handleReportFilterChange}
                        aria-label="report filter"
                        size="small"
                        sx={{
                          '& .MuiToggleButton-root': {
                            border: `1px solid ${alpha(customTheme.palette.primary.light, 0.5)}`,
                            px: 1.5,
                            py: 0.5,
                            fontSize: '0.75rem',
                            color: customTheme.palette.primary.dark,
                            '&.Mui-selected': {
                              backgroundColor: customTheme.palette.primary.main,
                              color: customTheme.palette.primary.contrastText,
                              '&:hover': {
                                backgroundColor: customTheme.palette.primary.dark,
                              }
                            },
                            '&:hover': {
                              backgroundColor: alpha(customTheme.palette.primary.light, 0.2),
                            }
                          }
                        }}
                      >
                        <ToggleButton value="all" aria-label="all branches">
                          الكل
                        </ToggleButton>
                        <ToggleButton value="with" aria-label="branches with reports">
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <CheckCircleIcon fontSize="small" sx={{ color: customTheme.palette.success.dark }} />
                            <Box component="span">مع تقرير</Box>
                          </Stack>
                        </ToggleButton>
                        <ToggleButton value="without" aria-label="branches without reports">
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <WarningIcon fontSize="small" sx={{ color: customTheme.palette.error.dark }} />
                            <Box component="span">بدون تقرير</Box>
                          </Stack>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    
                    {branchLoading || dateLoading ? (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        height: 300,
                        flexDirection: 'column',
                        gap: 2,
                        backgroundColor: alpha(customTheme.palette.primary.light, 0.05),
                        borderRadius: 2,
                        border: `1px dashed ${alpha(customTheme.palette.primary.light, 0.3)}`
                      }}>
                        <CircularProgress size={50} thickness={4} sx={{ color: customTheme.palette.primary.main }} />
                        <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
                          جاري تحميل بيانات الفروع...
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <TableContainer 
                          component={Paper} 
                          sx={{ 
                            borderRadius: 2,
                            border: `1px solid ${alpha(customTheme.palette.primary.light, 0.3)}`,
                            boxShadow: `0 4px 12px ${alpha(customTheme.palette.primary.light, 0.1)}`,
                            mb: 2,
                            maxHeight: 'none',
                            overflow: 'visible'
                          }}
                        >
                          <Table stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: customTheme.palette.primary.main,
                                  color: customTheme.palette.primary.contrastText,
                                  fontSize: '0.9rem',
                                  py: 2
                                }}>
                                  اسم الفرع
                                </TableCell>
                                <TableCell sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: customTheme.palette.primary.main,
                                  color: customTheme.palette.primary.contrastText,
                                  fontSize: '0.9rem',
                                  py: 2,
                                  textAlign: 'center'
                                }}>
                                  كود الفرع
                                </TableCell>
                                <TableCell sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: customTheme.palette.primary.main,
                                  color: customTheme.palette.primary.contrastText,
                                  fontSize: '0.9rem',
                                  py: 2,
                                  textAlign: 'center'
                                }}>
                                  التاريخ
                                </TableCell>
                                <TableCell sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: customTheme.palette.primary.main,
                                  color: customTheme.palette.primary.contrastText,
                                  fontSize: '0.9rem',
                                  py: 2,
                                  textAlign: 'center'
                                }}>
                                  حالة التقرير
                                </TableCell>
                                <TableCell sx={{ 
                                  fontWeight: 'bold', 
                                  backgroundColor: customTheme.palette.primary.main,
                                  color: customTheme.palette.primary.contrastText,
                                  fontSize: '0.9rem',
                                  py: 2,
                                  textAlign: 'center'
                                }}>
                                  الإجراءات
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {paginatedBranches.map((branch) => (
                                <TableRow 
                                  key={branch.guid}
                                  sx={{ 
                                    '&:nth-of-type(even)': { 
                                      backgroundColor: alpha(customTheme.palette.primary.light, 0.05) 
                                    },
                                    '&:hover': {
                                      backgroundColor: alpha(customTheme.palette.primary.light, 0.1)
                                    }
                                  }}
                                >
                                  <TableCell sx={{ py: 2, fontWeight: 500 }}>
                                    {branch.name}
                                  </TableCell>
                                  <TableCell sx={{ py: 2, textAlign: 'center', fontWeight: 500 }}>
                                    {branch.code}
                                  </TableCell>
                                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
                                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                                      <TodayIcon fontSize="small" sx={{ color: customTheme.palette.primary.main }} />
                                      <Typography variant="body2">
                                        {format(selectedDate, 'yyyy-MM-dd')}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
                                    <Chip
                                      label={branchesWithReports.includes(branch.guid) ? 'تم التقرير' : 'لم يتم'}
                                      sx={{ 
                                        fontWeight: 700,
                                        backgroundColor: branchesWithReports.includes(branch.guid) 
                                          ? alpha(customTheme.palette.success.light, 0.3)
                                          : alpha(customTheme.palette.error.light, 0.3),
                                        color: branchesWithReports.includes(branch.guid) 
                                          ? customTheme.palette.success.dark
                                          : customTheme.palette.error.dark,
                                        border: `1px solid ${branchesWithReports.includes(branch.guid) 
                                          ? alpha(customTheme.palette.success.main, 0.3)
                                          : alpha(customTheme.palette.error.main, 0.3)}`
                                      }}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<DescriptionIcon />}
                                      onClick={() => fetchReports(branch.guid)}
                                      disabled={loading || dateLoading || !branchesWithReports.includes(branch.guid)}
                                      sx={{
                                        backgroundColor: branchesWithReports.includes(branch.guid) 
                                          ? customTheme.palette.primary.main 
                                          : alpha(customTheme.palette.grey[400], 0.5),
                                        color: branchesWithReports.includes(branch.guid) 
                                          ? customTheme.palette.primary.contrastText
                                          : customTheme.palette.text.disabled,
                                        borderRadius: 2,
                                        px: 2,
                                        '&:hover': {
                                          backgroundColor: branchesWithReports.includes(branch.guid)
                                            ? customTheme.palette.primary.dark
                                            : alpha(customTheme.palette.grey[400], 0.7),
                                        },
                                        '&.Mui-disabled': {
                                          backgroundColor: alpha(customTheme.palette.grey[400], 0.3),
                                          color: alpha(customTheme.palette.text.disabled, 0.5)
                                        }
                                      }}
                                    >
                                      {branchesWithReports.includes(branch.guid) ? 'عرض التقرير' : 'غير متاح'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        {/* Custom Pagination */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          p: 2,
                          backgroundColor: alpha(customTheme.palette.primary.light, 0.05),
                          borderRadius: 2,
                          border: `1px solid ${alpha(customTheme.palette.primary.light, 0.3)}`
                        }}>
                          <Typography variant="body2" color="textSecondary">
                            عرض {Math.min(rowsPerPage, filteredBranches.length - page * rowsPerPage)} من {filteredBranches.length} فرع
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                              الصفوف لكل صفحة:
                            </Typography>
                            <TextField
                              select
                              value={rowsPerPage}
                              onChange={handleChangeRowsPerPage}
                              size="small"
                              sx={{ width: 80 }}
                              SelectProps={{
                                native: true,
                              }}
                            >
                              {[5, 10, 15, 30].map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </TextField>
                            
                            <Pagination
                              count={Math.ceil(filteredBranches.length / rowsPerPage)}
                              page={page + 1}
                              onChange={(e, value) => handleChangePage(e, value - 1)}
                              color="primary"
                              size={isSmallMobile ? "small" : "medium"}
                              sx={{
                                '& .MuiPaginationItem-root': {
                                  borderRadius: 1,
                                  '&.Mui-selected': {
                                    backgroundColor: customTheme.palette.primary.main,
                                    color: customTheme.palette.primary.contrastText,
                                    fontWeight: 'bold'
                                  }
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Container>
          </LocalizationProvider>
        </Box>
      </Box>
      <ExportReportsDialog
  open={exportOpen}
  onClose={() => setExportOpen(false)}
  theme={customTheme}
/>

    </ThemeProvider>
  );
};

export default BranchReportsPage;