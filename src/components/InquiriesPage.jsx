import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip, Avatar,
  IconButton, Collapse, FormControl, InputLabel, Select, MenuItem,
  Pagination, Stack, Divider, Tooltip, Badge, InputAdornment, useTheme
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  WatchLater as WatchLaterIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Note as NoteIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import axios from 'axios';
import { format } from 'date-fns';
import arLocale from 'date-fns/locale/ar-SA';

const InquiriesPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const user = JSON.parse(localStorage.getItem('user'));
  const [calls, setCalls] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [dialogCall, setDialogCall] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [openFollowForm, setOpenFollowForm] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentsInfo, setStudentsInfo] = useState({});
  const [loadingStudents, setLoadingStudents] = useState({});
  
  // Filter and pagination states
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  const [showFilters, setShowFilters] = useState(false);

  // Visual contract: shared light/dark surfaces without changing page logic.
  const darkBorder = '#67C99D';
  const primaryColor = isDark ? darkBorder : '#80b49e';
  const primaryDark = isDark ? '#4fb889' : '#6a9a87';
  const primaryLight = isDark ? darkBorder : '#9ac9b5';

  const backgroundColor = isDark
    ? (theme.palette.background?.default || '#0b1712')
    : '#f8fbfa';

  const surfaceColor = isDark
    ? (theme.palette.surfaces?.card || '#10251d')
    : '#ffffff';

  const sectionColor = isDark
    ? (theme.palette.surfaces?.section || '#143026')
    : '#f0f7f4';

  const nestedColor = isDark
    ? (theme.palette.surfaces?.nested || '#183a2d')
    : '#f8fbfa';

  const hoverColor = isDark
    ? (theme.palette.surfaces?.hover || '#1c4435')
    : '#e8f4ef';

  const selectedColor = isDark
    ? (theme.palette.surfaces?.selected || '#20503d')
    : '#f0f7f4';

  const textPrimary = isDark ? '#F1FAF6' : '#2c3e50';
  const textSecondary = isDark ? '#BCD6CA' : '#5d6d7e';
  const permanentBorder = isDark ? darkBorder : primaryLight;

  const menuPaperSx = {
    backgroundColor: surfaceColor,
    color: textPrimary,
    border: `1px solid ${permanentBorder}`,
    backgroundImage: 'none',
    '& .MuiMenuItem-root': {
      color: textPrimary,
      '&:hover': { backgroundColor: hoverColor },
      '&.Mui-selected': {
        backgroundColor: selectedColor,
        '&:hover': { backgroundColor: hoverColor }
      }
    }
  };

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const [callsRes, usersRes, followUpsRes] = await Promise.all([
        axios.get('https://api1.sstli.com/api/call/all'),
        axios.get('https://api1.sstli.com/api/userinfo'),
        axios.get('https://api1.sstli.com/api/followcall')
      ]);

      setCalls(callsRes.data);
      setUsers(usersRes.data);
      setFollowUps(followUpsRes.data);

      // ✅ هنا مبقيناش نجيب بيانات الطلبة كلها مرة واحدة
      setStudentsInfo({}); 
      setLoadingStudents({});

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

const loadStudentInfo = async (accountGuid) => {
  if (!accountGuid) return null;

  // ✅ لو موجودة قبل كده (حتى لو null) متجيبهاش تاني
  if (Object.prototype.hasOwnProperty.call(studentsInfo, accountGuid)) {
    return studentsInfo[accountGuid];
  }

  // ✅ لو لسه بيحملها متعملش طلب جديد
  if (loadingStudents[accountGuid]) return null;

  setLoadingStudents(prev => ({ ...prev, [accountGuid]: true }));

  try {
    const { data } = await axios.get(
      `https://api1.sstli.com/api/StudyInfo/by-account/${accountGuid}`
    );

    setStudentsInfo(prev => ({ ...prev, [accountGuid]: data }));
    return data;
  } catch (error) {
    setStudentsInfo(prev => ({ ...prev, [accountGuid]: null }));
    return null;
  } finally {
    setLoadingStudents(prev => ({ ...prev, [accountGuid]: false }));
  }
};

  // Get user full name by GUID
  const getUserName = (guid) => {
    const foundUser = users.find(u => u.guid === guid);
    return foundUser ? foundUser.fullName : 'غير معروف';
  };

  // Filter calls to show only those forwarded to current user
  const baseFilteredCalls = calls.filter(call => 
    call.forwardCall && call.supervisorGuid === user.guid
  );

  // Apply additional filters
  const filteredCalls = baseFilteredCalls.filter(call => {
    // Search term filter (student name or notes)
    const studentInfo = studentsInfo[call.accountGuid];
    const studentNameMatch = studentInfo ? 
      studentInfo.studentName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const notesMatch = call.notes ? 
      call.notes.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    // Status filter
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'completed' && call.callStatus === 0) || 
      (statusFilter === 'pending' && call.callStatus === 1);
    
    // Type filter
    const typeMatch = typeFilter === 'all' || 
      (typeFilter === 'general' && call.callType === 0) ||
      (typeFilter === 'academic' && call.callType === 1) ||
      (typeFilter === 'complaint' && call.callType === 2);
    
      const callDate = new Date(call.callDate);
      const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
      
      // Reset time parts for proper date comparison
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      callDate.setHours(12, 0, 0, 0); // Set to midday to avoid timezone issues
    
      const dateMatch = 
        (!startDate && !endDate) || // No date filter
        (startDate && !endDate && callDate >= startDate) || // Only start date
        (!startDate && endDate && callDate <= endDate) || // Only end date
        (startDate && endDate && callDate >= startDate && callDate <= endDate); // Both dates
    
      return (studentNameMatch || notesMatch || searchTerm === '') && 
             statusMatch && 
             typeMatch && 
             dateMatch;
    });
  // Pagination
  const count = Math.ceil(filteredCalls.length / rowsPerPage);
  const paginatedCalls = filteredCalls.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userJob = currentUser?.userJop;

  // Get follow-ups for a specific call
  const getFollowUpsForCall = (callGuid) => {
    return followUps.filter(f => f.callGuid === callGuid);
  };

  const getStatusText = (status) => {
    switch(status) {
      case 0: return 'مكتملة';
      case 1: return 'قيد المتابعة';
      default: return 'غير معروف';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 0: return <CheckCircleIcon color="success" fontSize="small" />;
      case 1: return <WatchLaterIcon color="warning" fontSize="small" />;
      default: return null;
    }
  };

  const getTypeText = (type) => {
    switch(type) {
      case 0: return 'استفسار عام';
      case 1: return 'استفسار دراسي';
      case 2: return 'شكوى';
      default: return 'غير معروف';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 0: return <DescriptionIcon sx={{ color: primaryColor }} fontSize="small" />;
      case 1: return <NoteIcon sx={{ color: primaryDark }} fontSize="small" />;
      case 2: return <DescriptionIcon sx={{ color: '#e74c3c' }} fontSize="small" />;
      default: return null;
    }
  };

const handleViewDetails = async (call) => {
  // ✅ حمّل بيانات الطالب وقت الضغط
  await loadStudentInfo(call.accountGuid);

  setDialogCall({
    ...call,
    callerName: getUserName(call.userGuid),
    supervisorName: getUserName(call.supervisorGuid),
    followUps: getFollowUpsForCall(call.guid)
  });
  setDetailsDialogOpen(true);
};


  const handleFollowUp = (call) => {
    setSelectedCall(call);
    setOpenFollowForm(true);
  };

  const handleCloseFollowForm = () => {
    setOpenFollowForm(false);
    setSelectedCall(null);
    setFollowUpNote('');
    setFollowUpStatus('');
  };

const submitFollowUp = async () => {
  if (!selectedCall || !selectedCall.guid || !user?.guid) return;

  setIsSubmitting(true);
  const payload = {
    callGuid: selectedCall.guid,
    followUpNotes: followUpNote,
    stauts: followUpStatus === "1" ? 1 : 0, // This line was reversed - corrected now
    userGuid: user.guid
  };

  try {
    await axios.post('https://api1.sstli.com/api/callfollowup/add', payload);
    const followUpsRes = await axios.get('https://api1.sstli.com/api/followcall');
    setFollowUps(followUpsRes.data);

    if (followUpStatus === "0") { // Changed this condition to match the corrected status
      setCalls(calls.map(call => 
        call.guid === selectedCall.guid ? { ...call, callStatus: 0 } : call
      ));
    }

    await import('sweetalert2').then(Swal => {
      Swal.default.fire({
        icon: 'success',
        title: 'تمت الإضافة',
        text: '✅ تمت إضافة المتابعة بنجاح'
      });
    });

    handleCloseFollowForm();
  } catch (error) {
    console.error('Error adding follow-up:', error);
    await import('sweetalert2').then(Swal => {
      Swal.default.fire({
        icon: 'error',
        title: 'فشل الإضافة',
        text: '❌ حدث خطأ أثناء الإضافة'
      });
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCompleteCall = async (callGuid) => {
    try {
      await axios.put(`https://api1.sstli.com/api/call/complete/${callGuid}`);
      setCalls(calls.map(call => 
        call.guid === callGuid ? { ...call, callStatus: 0 } : call
      ));
      await import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'success',
          title: 'تم الإنجاز',
          text: 'تم تحديث حالة المكالمة إلى مكتملة'
        });
      });
    } catch (error) {
      console.error('Error completing call:', error);
      await import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل في تحديث حالة المكالمة'
        });
      });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter({ startDate: null, endDate: null });
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // دالة للتحقق إذا كان الطالب لا يزال قيد التحميل
  const isStudentLoading = (accountGuid) => {
    return loadingStudents[accountGuid] === true;
  };

  return (
    <NavigationShell variant="standard" ><Box sx={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor,
      color: textPrimary,
      direction: 'rtl',
      '& .MuiPaper-root': {
        backgroundImage: 'none',
        ...(isDark && {
          backgroundColor: surfaceColor,
          color: textPrimary,
          borderColor: permanentBorder
        })
      },
      '& .MuiOutlinedInput-root': {
        color: textPrimary,
        backgroundColor: isDark ? nestedColor : surfaceColor,
        '& fieldset': { borderColor: permanentBorder },
        '&:hover fieldset': { borderColor: isDark ? darkBorder : primaryColor },
        '&.Mui-focused fieldset': { borderColor: isDark ? darkBorder : primaryDark }
      },
      '& .MuiInputLabel-root': {
        color: textSecondary,
        '&.Mui-focused': { color: primaryColor }
      },
      '& .MuiSvgIcon-root': {
        ...(isDark && { color: 'inherit' })
      },
      '& .MuiTableCell-root': {
        color: textPrimary,
        borderColor: isDark ? 'rgba(103,201,157,.42)' : 'rgba(128,180,158,.22)'
      },
      '& .MuiDivider-root': {
        borderColor: isDark ? 'rgba(103,201,157,.55)' : primaryLight
      }
    }}>
      
      <Box sx={{
        flexGrow: 1,
        p: 3,
        transition: 'margin 0.3s ease',
        ...navigationContentSx
      }}>
        <Paper elevation={2} sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          backgroundColor: surfaceColor,
          background: isDark ? surfaceColor : `linear-gradient(135deg, ${surfaceColor} 0%, ${sectionColor} 100%)`,
          border: `1px solid ${permanentBorder}`
        }}>
          <Box sx={uiLayout.withUiSx({ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }, uiLayout.pageHeaderSx)}>
            <Typography variant="h4" fontWeight="bold" sx={{ 
              fontFamily: 'Cairo, sans-serif',
              color: primaryDark,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <PhoneIcon fontSize="large" /> المكالمات المحولة إليك
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={uiLayout.withUiSx({ 
                  borderRadius: 2,
                  borderColor: primaryColor,
                  color: primaryDark,
                  '&:hover': {
                    borderColor: primaryDark,
                    backgroundColor: primaryLight + '20'
                  }
                }, uiLayout.buttonSx)}
              >
                {showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
              </Button>
              <Tooltip title="تحديث البيانات">
                <IconButton 
                  onClick={() => window.location.reload()}
                  sx={{ 
                    borderRadius: 2,
                    color: primaryColor,
                    '&:hover': {
                      backgroundColor: primaryLight + '20'
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Search and Filters Section */}
          <Box sx={{ mb: 3 }}>
            <TextField InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
              placeholder="ابحث باسم الطالب أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: primaryColor }} />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryLight
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryColor
                  }
                }
              }}
              sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
            />

            <Collapse in={showFilters}>
              <Paper elevation={0} sx={{ 
                p: 2, 
                mb: 2, 
                borderRadius: 2,
                backgroundColor: sectionColor,
                border: `1px solid ${permanentBorder}`
              }}>
                <Box sx={uiLayout.withUiSx({ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  columnGap: 2,
                  rowGap: 1.5,
                  alignItems: 'center'
                }, uiLayout.filterBarSx)}>
                  <FormControl sx={uiLayout.withUiSx({ minWidth: 120 }, uiLayout.formFieldSx)} size="small">
                    <InputLabel sx={{ color: primaryDark }}>حالة المكالمة</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      label="حالة المكالمة"
                      MenuProps={{ PaperProps: { sx: menuPaperSx } }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: primaryLight
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: primaryColor
                        }
                      }}
                    >
                      <MenuItem value="all">الكل</MenuItem>
                      <MenuItem value="completed">مكتملة</MenuItem>
                      <MenuItem value="pending">قيد المتابعة</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={uiLayout.withUiSx({ minWidth: 120 }, uiLayout.formFieldSx)} size="small">
                    <InputLabel sx={{ color: primaryDark }}>نوع المكالمة</InputLabel>
                    <Select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                      }}
                      label="نوع المكالمة"
                      MenuProps={{ PaperProps: { sx: menuPaperSx } }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: primaryLight
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: primaryColor
                        }
                      }}
                    >
                      <MenuItem value="all">الكل</MenuItem>
                      <MenuItem value="general">عام</MenuItem>
                      <MenuItem value="academic">دراسي</MenuItem>
                      <MenuItem value="complaint">شكوى</MenuItem>
                    </Select>
                  </FormControl>

                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arLocale}>
                    <DatePicker
                      label="من تاريخ"
                      value={dateFilter.startDate}
                      onChange={(newValue) => {
                        setDateFilter({...dateFilter, startDate: newValue});
                        setPage(1);
                      }}
                      renderInput={(params) => (
                        <TextField InputLabelProps={{ shrink: true }} 
                          {...params} 
                          size="small" 
                          sx={uiLayout.withUiSx({ width: 150 }, uiLayout.formFieldSx)}
                          InputProps={{
                            sx: {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryLight
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor
                              }
                            }
                          }}
                        />
                      )}
                    />
                    <DatePicker
                      label="إلى تاريخ"
                      value={dateFilter.endDate}
                      onChange={(newValue) => {
                        setDateFilter({...dateFilter, endDate: newValue});
                        setPage(1);
                      }}
                      renderInput={(params) => (
                        <TextField InputLabelProps={{ shrink: true }} 
                          {...params} 
                          size="small" 
                          sx={uiLayout.withUiSx({ width: 150 }, uiLayout.formFieldSx)}
                          InputProps={{
                            sx: {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryLight
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor
                              }
                            }
                          }}
                        />
                      )}
                      minDate={dateFilter.startDate}
                    />
                  </LocalizationProvider>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={handleResetFilters}
                    sx={uiLayout.withUiSx({ 
                      borderRadius: 2,
                      borderColor: '#e74c3c',
                      color: '#e74c3c',
                      '&:hover': {
                        borderColor: '#c0392b',
                        backgroundColor: '#e74c3c10'
                      }
                    }, uiLayout.buttonSx)}
                  >
                    إعادة الضبط
                  </Button>
                </Box>
              </Paper>
            </Collapse>
          </Box>

          {/* Results Count */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              عرض {paginatedCalls.length} من أصل {filteredCalls.length} مكالمة
            </Typography>
            <Pagination
              count={count}
              page={page}
              onChange={handlePageChange}
              sx={{
                '& .MuiPaginationItem-root': {
                  fontFamily: 'Cairo, sans-serif',
                  color: primaryDark,
                  '&.Mui-selected': {
                    backgroundColor: primaryColor,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: primaryDark
                    }
                  }
                }
              }}
            />
          </Box>

          {/* Main Table */}
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flexDirection: 'column',
              p: 6,
              gap: 2
            }}>
              <CircularProgress sx={{ color: primaryColor }} size={60} />
              <Typography variant="h6" sx={{ color: primaryDark }}>
                جاري تحميل البيانات...
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                يتم الآن جلب المكالمات المحولة إليك
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={uiLayout.withUiSx({ 
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(128, 180, 158, 0.1)',
              border: `1px solid ${permanentBorder}`
            }, uiLayout.tableContainerSx)}>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: isDark ? nestedColor : primaryDark,
                    '& th': { 
                      color: isDark ? textPrimary : 'white',
                      fontWeight: 'bold',
                      fontFamily: 'Cairo, sans-serif',
                      fontSize: '1rem',
                      padding: '16px 8px',
                      borderBottom: `2px solid ${isDark ? darkBorder : '#ffffff'}`
                    }
                  }}>
                    <TableCell align="center" sx={{ width: '10%'}}>النوع</TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}>الموظف</TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}>التاريخ</TableCell>
                    <TableCell align="center" sx={{ width: '10%' }}>الحالة</TableCell>
                    <TableCell align="center" sx={{ width: '25%' }}>الطالب</TableCell>
                    <TableCell align="center" sx={{ width: '25%' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCalls.length > 0 ? (
                    paginatedCalls.map((call, index) => {
                      const callFollowUps = getFollowUpsForCall(call.guid);
                      const hasFollowUps = callFollowUps.length > 0;
                      const studentInfo = studentsInfo[call.accountGuid];
                      const isLoading = isStudentLoading(call.accountGuid);
                      
                      return (
                        <React.Fragment key={index}>
                          <TableRow hover sx={{ 
                            '&:last-child td': { borderBottom: hasFollowUps ? 0 : undefined },
                            backgroundColor: expandedRow === call.guid ? selectedColor : surfaceColor,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: hoverColor
                            }
                          }}>
                            <TableCell align="center">
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: 1
                              }}>
                                {getTypeIcon(call.callType)}
                                <Typography sx={{ color: textPrimary, fontWeight: 500 }}>
                                  {getTypeText(call.callType)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                avatar={<Avatar sx={{ bgcolor: primaryColor, fontSize: '0.8rem' }}>
                                  {getUserName(call.userGuid).charAt(0)}
                                </Avatar>}
                                label={getUserName(call.userGuid)}
                                variant="outlined"
                                sx={{ 
                                  borderRadius: 2,
                                  borderColor: primaryLight,
                                  color: textPrimary,
                                  backgroundColor: nestedColor
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title={format(new Date(call.callDate), 'PPPPp', { locale: arLocale })}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  gap: 0.5
                                }}>
                                  <EventIcon sx={{ color: primaryColor }} fontSize="small" />
                                  <Typography sx={{ color: textPrimary }}>
                                    {format(new Date(call.callDate), 'yyyy/MM/dd', { locale: arLocale })}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: 0.5
                              }}>
                                {getStatusIcon(call.callStatus)}
                                <Typography sx={{ 
                                  color: call.callStatus === 0 ? '#27ae60' : '#f39c12',
                                  fontWeight: 500
                                }}>
                                  {getStatusText(call.callStatus)}
                                </Typography>
                              </Box>
                            </TableCell>
<TableCell align="center">
  {(() => {
    const accountGuid = call.accountGuid;
    const studentInfo = studentsInfo[accountGuid];
    const isLoading = loadingStudents[accountGuid] === true;

    if (!accountGuid) return <Typography sx={{ color: textSecondary, fontStyle: 'italic' }}>—</Typography>;

    // ✅ لو لسه محمّلش الطالب قبل كده: اعرض زر
    if (!Object.prototype.hasOwnProperty.call(studentsInfo, accountGuid)) {
      return (
        <Button
          size="small"
          variant="outlined"
          onClick={() => loadStudentInfo(accountGuid)}
          sx={uiLayout.withUiSx({ borderRadius: 2, borderColor: primaryLight, color: primaryDark }, uiLayout.buttonSx)}
        >
          عرض بيانات الطالب
        </Button>
      );
    }

    // ✅ أثناء التحميل
    if (isLoading) {
      return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={18} sx={{ color: primaryColor }} />
          <Typography sx={{ color: textSecondary, fontSize: 13 }}>جاري تحميل بيانات الطالب...</Typography>
        </Box>
      );
    }

    // ✅ لو مفيش بيانات
    if (!studentInfo) {
      return <Typography sx={{ color: textSecondary, fontStyle: 'italic' }}>لا توجد بيانات</Typography>;
    }

    // ✅ لو فيه بيانات
    return (
      <Box
        sx={{
          border: `1px solid ${permanentBorder}`,
          borderRadius: 2,
          p: 1.5,
          backgroundColor: nestedColor,
          fontFamily: 'Cairo',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: primaryColor,
            backgroundColor: sectionColor
          }
        }}
      >
        <Typography fontWeight="bold" fontSize={14} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, color: primaryDark }}>
          <PersonIcon fontSize="small" sx={{ color: primaryColor }} />
          {studentInfo.studentName}
        </Typography>
        <Typography fontSize={13} sx={{ color: textSecondary }}>
          الرقم القومي: <bdi dir="ltr">{studentInfo.nationalId}</bdi>
        </Typography>
        <Typography fontSize={13} sx={{ color: textSecondary }}>
          الجوال: <bdi dir="ltr">{studentInfo.studentTel}</bdi>
        </Typography>
      </Box>
    );
  })()}
</TableCell>

                            <TableCell align="center">
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1,
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                              }}>
                                <Tooltip title="عرض التفاصيل">
                                  <Button 
                                    variant="outlined" 
                                    size="small" 
                                    onClick={() => handleViewDetails(call)}
                                    startIcon={<DescriptionIcon fontSize="small" />}
                                    sx={uiLayout.withUiSx({ 
                                      borderRadius: 2,
                                      minWidth: 'auto',
                                      borderColor: primaryLight,
                                      color: primaryDark,
                                      '&:hover': {
                                        borderColor: primaryColor,
                                        backgroundColor: primaryLight + '20'
                                      }
                                    }, uiLayout.buttonSx)}
                                  />
                                </Tooltip>
                                
                                {call.callStatus === 1 && (
                                  <Tooltip title="إضافة متابعة">
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      onClick={() => handleFollowUp(call)}
                                      startIcon={<AddIcon fontSize="small" />}
                                      sx={uiLayout.withUiSx({ 
                                        borderRadius: 2,
                                        minWidth: 'auto',
                                        backgroundColor: primaryColor,
                                        '&:hover': {
                                          backgroundColor: primaryDark
                                        }
                                      }, uiLayout.buttonSx)}
                                    />
                                  </Tooltip>
                                )}
                                
                                {call.callStatus === 1 && userJob === 17 && (
                                  <Tooltip title="إكمال المكالمة">
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      color="success"
                                      onClick={() => handleCompleteCall(call.guid)}
                                      startIcon={<CheckCircleIcon fontSize="small" />}
                                      sx={uiLayout.withUiSx({ 
                                        borderRadius: 2,
                                        minWidth: 'auto',
                                        backgroundColor: '#27ae60',
                                        '&:hover': {
                                          backgroundColor: '#219a52'
                                        }
                                      }, uiLayout.buttonSx)}
                                    />
                                  </Tooltip>
                                )}
                                
                                {hasFollowUps && (
                                  <Tooltip title={expandedRow === call.guid ? "إخفاء المتابعات" : "عرض المتابعات"}>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => setExpandedRow(expandedRow === call.guid ? null : call.guid)}
                                      sx={{ 
                                        borderRadius: 1,
                                        backgroundColor: expandedRow === call.guid ? primaryLight + '40' : 'inherit',
                                        color: primaryDark,
                                        '&:hover': {
                                          backgroundColor: primaryLight + '20'
                                        }
                                      }}
                                    >
                                      <Badge badgeContent={callFollowUps.length} color="primary">
                                        {expandedRow === call.guid ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                      </Badge>
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                          
                          {expandedRow === call.guid && hasFollowUps && (
                            <TableRow>
                              <TableCell colSpan={6} sx={{ 
                                p: 0, 
                                backgroundColor: nestedColor,
                                borderTop: `1px solid ${permanentBorder}`
                              }}>
                                <Collapse in={true} timeout="auto" unmountOnExit>
                                  <Box sx={uiLayout.withUiSx({ p: 2 }, uiLayout.tableContainerSx)}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ 
                                      mb: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      color: primaryDark
                                    }}>
                                      <ArrowForwardIcon sx={{ color: primaryColor }} />
                                      سجل المتابعات
                                    </Typography>
                                    
                                    <Table size="small" sx={{ 
                                      backgroundColor: surfaceColor,
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      border: `1px solid ${permanentBorder}`
                                    }}>
                                      <TableHead>
                                        <TableRow sx={{ backgroundColor: sectionColor }}>
                                          <TableCell align="center" sx={{ width: '40%', color: primaryDark, fontWeight: 'bold' }}>الملاحظات</TableCell>
                                          <TableCell align="center" sx={{ width: '15%', color: primaryDark, fontWeight: 'bold' }}>الحالة</TableCell>
                                          <TableCell align="center" sx={{ width: '20%', color: primaryDark, fontWeight: 'bold' }}>المستخدم</TableCell>
                                          <TableCell align="center" sx={{ width: '25%', color: primaryDark, fontWeight: 'bold' }}>التاريخ</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {callFollowUps.map((followUp, i) => (
                                          <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: nestedColor } }}>
                                            <TableCell align="center">
                                              <Typography sx={{ color: textPrimary }}>
                                                {followUp.followUpNotes || '—'}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Chip
                                                label={followUp.stauts === 0 ? 'مكتملة' : 'قيد المتابعة'}
                                                color={followUp.stauts === 0 ? 'success' : 'warning'}
                                                size="small"
                                                sx={{ 
                                                  borderRadius: 1,
                                                  fontWeight: 'bold'
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell align="center">
                                              <Chip 
                                                avatar={<Avatar sx={{ bgcolor: primaryColor, fontSize: "0.75rem" }}>
                                                  {followUp.userFullName?.charAt(0)}
                                                </Avatar>}
                                                label={followUp.userFullName}
                                                variant="outlined"
                                                size="small"
                                                sx={{ 
                                                  borderRadius: 1,
                                                  borderColor: primaryLight,
                                                  color: textPrimary
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell align="center">
                                              <Typography sx={{ color: textSecondary, fontSize: '0.8rem' }}>
                                                {format(new Date(followUp.createdAt), 'yyyy/MM/dd hh:mm a', { locale: arLocale })}
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ p: 6 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <PhoneIcon fontSize="large" sx={{ color: primaryLight }} />
                          <Typography variant="h6" sx={{ color: textSecondary }}>
                            لا توجد مكالمات متاحة
                          </Typography>
                          <Typography variant="body2" sx={{ color: textSecondary }}>
                            حاول تغيير معايير البحث الخاصة بك
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination at bottom */}
          {filteredCalls.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 3
            }}>
              <Pagination
                count={count}
                page={page}
                onChange={handlePageChange}
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontFamily: 'Cairo, sans-serif',
                    color: primaryDark,
                    '&.Mui-selected': {
                      backgroundColor: primaryColor,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: primaryDark
                      }
                    }
                  }
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>

      {/* Follow-up Dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx} open={openFollowForm} onClose={handleCloseFollowForm} fullWidth maxWidth="sm"
        PaperProps={{ sx: {
          borderRadius: 3,
          backgroundColor: surfaceColor,
          color: textPrimary,
          border: `1px solid ${permanentBorder}`,
          backgroundImage: 'none',
          overflow: 'hidden'
        } }}>
        <DialogTitle sx={{ 
          background: isDark
            ? `linear-gradient(135deg, ${nestedColor} 0%, ${sectionColor} 100%)`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
          color: isDark ? textPrimary : 'white',
          borderBottom: `1px solid ${permanentBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontFamily: 'Cairo'
        }}>
          <AddIcon /> إضافة متابعة جديدة
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2.5, display: 'grid', gap: 1.75, backgroundColor: surfaceColor, color: textPrimary }}>
          <TextField InputLabelProps={{ shrink: true }}
            label="ملاحظات المتابعة"
            multiline
            fullWidth
            minRows={4}
            margin="normal"
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NoteIcon sx={{ color: primaryColor }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: isDark ? nestedColor : surfaceColor,
                color: textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryLight
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryColor
                }
              }
            }}
            sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
          />
          <FormControl sx={uiLayout.formFieldSx} fullWidth margin="normal">
            <InputLabel sx={{ color: primaryDark }}>حالة المتابعة</InputLabel>
            <Select
              value={followUpStatus}
              onChange={(e) => setFollowUpStatus(e.target.value)}
              label="حالة المتابعة"
              MenuProps={{ PaperProps: { sx: menuPaperSx } }}
              startAdornment={
                <InputAdornment position="start">
                  <WatchLaterIcon sx={{ color: primaryColor }} />
                </InputAdornment>
              }
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryLight
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryColor
                }
              }}
            >
              {userJob === 17 && (
              <MenuItem value="0">  {/* Complete */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CheckCircleIcon sx={{ color: '#27ae60' }} fontSize="small" />
    <Typography>مكتملة</Typography>
  </Box>
</MenuItem>
              )}
             <MenuItem value="1">  {/* Follow up later */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <WatchLaterIcon sx={{ color: '#f39c12' }} fontSize="small" />
    <Typography>متابعة لاحقًا</Typography>
  </Box>
</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={uiLayout.withUiSx({
          p: 2,
          gap: 1,
          backgroundColor: surfaceColor,
          borderTop: `1px solid ${permanentBorder}`
        }, uiLayout.dialogActionsSx)}>
          <Button 
            onClick={handleCloseFollowForm} 
            variant="outlined"
            sx={uiLayout.withUiSx({ 
              borderRadius: 2,
              borderColor: primaryLight,
              color: primaryDark,
              '&:hover': {
                borderColor: primaryColor,
                backgroundColor: primaryLight + '20'
              }
            }, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button 
            onClick={submitFollowUp} 
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckCircleIcon />}
            sx={uiLayout.withUiSx({ 
              borderRadius: 2,
              backgroundColor: primaryColor,
              '&:hover': {
                backgroundColor: primaryDark
              },
              '&:disabled': {
                backgroundColor: primaryLight
              }
            }, uiLayout.buttonSx)}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ المتابعة'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call Details Dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx} 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: {
          borderRadius: 3,
          backgroundColor: surfaceColor,
          color: textPrimary,
          border: `1px solid ${permanentBorder}`,
          backgroundImage: 'none',
          overflow: 'hidden'
        } }}
      >
        {dialogCall && (
          <>
            <DialogTitle sx={{ 
              background: isDark
                ? `linear-gradient(135deg, ${nestedColor} 0%, ${sectionColor} 100%)`
                : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              color: isDark ? textPrimary : 'white',
              borderBottom: `1px solid ${permanentBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontFamily: 'Cairo'
            }}>
              <DescriptionIcon /> تفاصيل المكالمة
            </DialogTitle>
            <DialogContent sx={{ pt: 3, pb: 2.5, backgroundColor: surfaceColor, color: textPrimary }}>
              <TableContainer sx={uiLayout.tableContainerSx}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '30%', color: primaryDark }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon(dialogCall.callType)}
                          نوع الاتصال:
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: textPrimary }}>{getTypeText(dialogCall.callType)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: primaryDark }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ color: primaryColor }} fontSize="small" />
                          الموظف:
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          avatar={<Avatar sx={{ bgcolor: primaryColor }}>{dialogCall.callerName?.charAt(0)}</Avatar>}
                          label={dialogCall.callerName}
                          variant="outlined"
                          sx={{ 
                            borderColor: primaryLight,
                            color: textPrimary
                          }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: primaryDark }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon sx={{ color: primaryColor }} fontSize="small" />
                          التاريخ:
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: textPrimary }}>
                        {format(new Date(dialogCall.callDate), 'PPPPp', { locale: arLocale })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: primaryDark }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(dialogCall.callStatus)}
                          الحالة:
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(dialogCall.callStatus)}
                          color={dialogCall.callStatus === 0 ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: primaryDark }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NoteIcon sx={{ color: primaryColor }} fontSize="small" />
                          ملاحظات:
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: textPrimary }}>
                        {dialogCall.notes || 'لا توجد ملاحظات'}
                      </TableCell>
                    </TableRow>
                    {dialogCall.complainDetails && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: primaryDark }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon sx={{ color: '#e74c3c' }} fontSize="small" />
                            تفاصيل الشكوى:
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: textPrimary }}>{dialogCall.complainDetails}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {dialogCall.followUps && dialogCall.followUps.length > 0 && (
                <>
                  <Divider sx={{ my: 3, borderColor: primaryLight }} />
                  <Typography variant="h6" sx={{ 
                    mb: 2, 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: primaryDark
                  }}>
                    <ArrowForwardIcon sx={{ color: primaryColor }} />
                    المتابعات المسجلة
                  </Typography>
                  <TableContainer component={Paper} sx={uiLayout.withUiSx({ borderRadius: 2, border: `1px solid ${permanentBorder}` }, uiLayout.tableContainerSx)}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: sectionColor }}>
                          <TableCell align="center" sx={{ color: primaryDark, fontWeight: 'bold' }}>الملاحظات</TableCell>
                          <TableCell align="center" sx={{ color: primaryDark, fontWeight: 'bold' }}>الحالة</TableCell>
                          <TableCell align="center" sx={{ color: primaryDark, fontWeight: 'bold' }}>المستخدم</TableCell>
                          <TableCell align="center" sx={{ color: primaryDark, fontWeight: 'bold' }}>التاريخ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dialogCall.followUps.map((followUp, i) => (
                          <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: nestedColor } }}>
                            <TableCell align="center" sx={{ color: textPrimary }}>
                              {followUp.followUpNotes || '—'}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={followUp.stauts === 0 ? 'مكتملة' : 'قيد المتابعة'}
                                color={followUp.stauts === 0 ? 'success' : 'warning'}
                                size="small"
                                sx={{ borderRadius: 1, fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                avatar={<Avatar sx={{ bgcolor: primaryColor, fontSize: "0.75rem" }}>
                                  {followUp.userFullName?.charAt(0)}
                                </Avatar>}
                                label={followUp.userFullName}
                                variant="outlined"
                                size="small"
                                sx={{ 
                                  borderRadius: 1,
                                  borderColor: primaryLight,
                                  color: textPrimary
                                }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ color: textSecondary, fontSize: '0.8rem' }}>
                              {format(new Date(followUp.createdAt), 'yyyy/MM/dd hh:mm a', { locale: arLocale })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </DialogContent>
            <DialogActions sx={uiLayout.withUiSx({
              p: 2,
              gap: 1,
              backgroundColor: surfaceColor,
              borderTop: `1px solid ${permanentBorder}`
            }, uiLayout.dialogActionsSx)}>
              <Button 
                onClick={() => setDetailsDialogOpen(false)} 
                variant="contained"
                sx={uiLayout.withUiSx({ 
                  borderRadius: 2,
                  backgroundColor: primaryColor,
                  '&:hover': {
                    backgroundColor: primaryDark
                  }
                }, uiLayout.buttonSx)}
              >
                إغلاق
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box></NavigationShell>
  );
};

export default InquiriesPage;