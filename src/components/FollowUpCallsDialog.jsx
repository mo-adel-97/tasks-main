import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Collapse, IconButton, Box, TextField, Select, MenuItem, FormControl,
  InputLabel, CircularProgress, Pagination, Chip, Tooltip, Avatar,
  TablePagination, InputAdornment, Menu, ListItemIcon, ListItemText,
  Card, CardContent, Grid, Alert
} from '@mui/material';
import {
  ExpandMore, ExpandLess, FilterList, Search, CheckCircleOutline,
  PendingActions, ClearAll, Refresh, MoreVert, DoneAll,
  Phone, PhoneForwarded, SupervisorAccount, Person
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';

export default function FollowUpCallsDialog({ open, onClose }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const userJob = user?.userJop;
  const [users, setUsers] = useState([]);

  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [studentsInfo, setStudentsInfo] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);

  const [openFollowForm, setOpenFollowForm] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCalls, setTotalCalls] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [forwardFilter, setForwardFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const openFilterMenu = Boolean(anchorEl);

  // Load calls and follow-ups
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setIsSubmitting(true);
      const [callsRes, followUpsRes, usersRes] = await Promise.all([
        axios.get('https://api1.sstli.com/api/call/all'),
        axios.get('https://api1.sstli.com/api/followcall'),
        axios.get('https://api1.sstli.com/api/userinfo')
      ]);

      // ترتيب المكالمات من الأحدث للأقدم
      const sortedCalls = callsRes.data.sort((a, b) => 
        new Date(b.callDate) - new Date(a.callDate)
      );
      
      const filteredCallsData = sortedCalls.filter(c => c.callStatus === 1);
      setTotalCalls(filteredCallsData.length);
      setCalls(filteredCallsData);
      setFilteredCalls(filteredCallsData);
      setFollowUps(followUpsRes.data);
      setUsers(usersRes.data);

      // Load student info for each call
      const studentInfoPromises = filteredCallsData.map(call => 
        call.accountGuid 
          ? axios.get(`https://api1.sstli.com/api/StudyInfo/by-account/${call.accountGuid}`)
              .then(res => ({ [call.accountGuid]: res.data }))
              .catch(() => ({ [call.accountGuid]: null }))
          : Promise.resolve({})
      );

      const studentResults = await Promise.all(studentInfoPromises);
      const mergedStudentInfo = studentResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setStudentsInfo(mergedStudentInfo);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'خطأ', 'فشل في تحميل البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAlert = async (icon, title, text) => {
    const { default: Swal } = await import('sweetalert2');
    Swal.fire({ icon, title, text });
  };

  const getUserFullName = (guid) => {
    if (!guid) return '—';
    const user = users.find(u => u.guid === guid);
    return user ? user.fullName : '—';
  };

  const getFollowUpsForCall = (callGuid) => {
    return followUps.filter(f => f.callGuid === callGuid);
  };

  // ✅ دالة لتحديد نوع المكالمة
  const getCallType = (callType) => {
    switch (callType) {
      case 0: return { text: 'أستفسار عام', color: 'primary', icon: '❓' };
      case 1: return { text: 'أستفسار دراسي', color: 'info', icon: '📚' };
      case 2: return { text: 'شكوي', color: 'error', icon: '⚠️' };
      default: return { text: 'غير معروف', color: 'default', icon: '❔' };
    }
  };

  // ✅ دالة لمعلومات التوجيه
  const getForwardInfo = (call) => {
    if (!call.forwardCall) {
      return { 
        text: 'غير ممررة', 
        color: 'default', 
        icon: <Phone sx={{ fontSize: 16 }} /> 
      };
    }
    
    let forwardText = 'ممررة';
    let forwardColor = 'info';
    let icon = <PhoneForwarded sx={{ fontSize: 16 }} />;
    
    switch (call.forwardTo) {
      case 'sales':
        forwardText = `ممررة للمبيعات: ${getUserFullName(call.supervisorGuid)}`;
        forwardColor = 'secondary';
        icon = <Person sx={{ fontSize: 16 }} />;
        break;
      case 'supervisor':
        forwardText = `ممررة للمشرف: ${getUserFullName(call.supervisorGuid)}`;
        forwardColor = 'warning';
        icon = <SupervisorAccount sx={{ fontSize: 16 }} />;
        break;
      default:
        forwardText = `ممررة: ${getUserFullName(call.supervisorGuid)}`;
        forwardColor = 'info';
    }
    
    return { text: forwardText, color: forwardColor, icon };
  };

  const handleOpenFollowForm = (call) => {
    setSelectedCall(call);
    setFollowUpNote('');
    setFollowUpStatus('');
    setOpenFollowForm(true);
  };

  const handleCloseFollowForm = () => {
    setOpenFollowForm(false);
    setSelectedCall(null);
  };

  const submitFollowUp = async () => {
    if (!selectedCall?.guid || !user?.guid) return;

    setIsSubmitting(true);
    const payload = {
      callGuid: selectedCall.guid,
      followUpNotes: followUpNote,
      stauts: followUpStatus === "1" ? 1 : 0,
      userGuid: user.guid
    };

    try {
      await axios.post('https://api1.sstli.com/api/callfollowup/add', payload);
      const updatedFollowUps = await axios.get('https://api1.sstli.com/api/followcall');
      setFollowUps(updatedFollowUps.data);

      if (followUpStatus === "1") {
        setCalls(prev => prev.filter(call => call.guid !== selectedCall.guid));
        setFilteredCalls(prev => prev.filter(call => call.guid !== selectedCall.guid));
        setTotalCalls(prev => prev - 1);
      }

      await showAlert('success', 'تم الحفظ', 'تمت إضافة المتابعة بنجاح');
      handleCloseFollowForm();
    } catch (err) {
      console.error(err);
      await showAlert('error', 'خطأ', 'فشل في حفظ المتابعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...calls];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(call => {
        const student = studentsInfo[call.accountGuid] || {};
        return (
          (call.notes && call.notes.toLowerCase().includes(term)) ||
          (student.studentName && student.studentName.toLowerCase().includes(term)) ||
          (student.nationalId && student.nationalId.includes(term)) ||
          (student.studentTel && student.studentTel.includes(term)) ||
          (getUserFullName(call.userGuid).toLowerCase().includes(term))
        );
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(call => call.callType === parseInt(typeFilter));
    }

    // Forward filter
    if (forwardFilter !== 'all') {
      if (forwardFilter === 'not_forwarded') {
        result = result.filter(call => !call.forwardCall);
      } else if (forwardFilter === 'forwarded') {
        result = result.filter(call => call.forwardCall);
      } else if (forwardFilter === 'sales') {
        result = result.filter(call => call.forwardTo === 'sales');
      } else if (forwardFilter === 'supervisor') {
        result = result.filter(call => call.forwardTo === 'supervisor');
      }
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(call => call.callDate?.split('T')[0] === today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(call => {
        const callDate = new Date(call.callDate);
        return callDate >= weekAgo;
      });
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter(call => {
        const callDate = new Date(call.callDate);
        return callDate >= monthAgo;
      });
    }

    setFilteredCalls(result);
    setTotalCalls(result.length);
    setPage(0);
  }, [searchTerm, statusFilter, typeFilter, forwardFilter, dateFilter, calls, studentsInfo]);

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setForwardFilter('all');
    setDateFilter('all');
    handleFilterMenuClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return format(parseISO(dateString), 'yyyy-MM-dd', { locale: arSA });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    return format(parseISO(timeString), 'hh:mm a', { locale: arSA });
  };

  // Calculate paginated data
  const paginatedCalls = useMemo(() => {
    return filteredCalls.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredCalls, page, rowsPerPage]);

  // ✅ إحصائيات سريعة
  const stats = useMemo(() => ({
    total: calls.length,
    general: calls.filter(call => call.callType === 0).length,
    study: calls.filter(call => call.callType === 1).length,
    complaint: calls.filter(call => call.callType === 2).length,
    forwarded: calls.filter(call => call.forwardCall).length,
    today: calls.filter(call => {
      const today = new Date().toISOString().split('T')[0];
      return call.callDate?.split('T')[0] === today;
    }).length
  }), [calls]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontWeight: 'bold', 
          color: 'primary.main', 
          fontFamily: "Cairo",
          bgcolor: 'background.paper',
          boxShadow: 1,
          py: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PendingActions sx={{ marginInlineEnd: 1, fontSize: 28 }} />
              <Typography variant="h6" component="div">
                مكالمات تحتاج إلى متابعة
              </Typography>
            </Box>
            
            <Chip 
              label={totalCalls > 99 ? `+99 (${totalCalls})` : totalCalls}
              color="primary"
              variant="outlined"
              size="medium"
              sx={{ 
                fontWeight: 'bold', 
                fontSize: '0.9rem',
                px: 1,
                borderWidth: 2
              }}
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          {/* ✅ بطاقات الإحصائيات */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ bgcolor: '#e3f2fd', textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                    إجمالي المكالمات
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ bgcolor: '#fff3e0', textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {stats.complaint}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                    مكالمات شكوى
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ bgcolor: '#e8f5e8', textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {stats.study}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                    استفسارات دراسية
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ bgcolor: '#fce4ec', textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="secondary.main">
                    {stats.forwarded}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                    مكالمات ممررة
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ bgcolor: '#f3e5f5', textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {stats.general}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                    استفسارات عامة
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ bgcolor: '#e0f2f1', textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {stats.today}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                    مكالمات اليوم
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ✅ فلترة متقدمة */}
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <FilterList sx={{ marginInlineEnd: 1 }} />
                <Typography variant="h6" fontFamily="Cairo">فلترة متقدمة</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="🔍 بحث شامل"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>نوع المكالمة</InputLabel>
                    <Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      label="نوع المكالمة"
                    >
                      <MenuItem value="all">الكل</MenuItem>
                      <MenuItem value="0">استفسار عام</MenuItem>
                      <MenuItem value="1">استفسار دراسي</MenuItem>
                      <MenuItem value="2">شكوى</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>حالة التوجيه</InputLabel>
                    <Select
                      value={forwardFilter}
                      onChange={(e) => setForwardFilter(e.target.value)}
                      label="حالة التوجيه"
                    >
                      <MenuItem value="all">الكل</MenuItem>
                      <MenuItem value="not_forwarded">غير ممررة</MenuItem>
                      <MenuItem value="forwarded">ممررة</MenuItem>
                      <MenuItem value="sales">ممررة للمبيعات</MenuItem>
                      <MenuItem value="supervisor">ممررة للمشرف</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>الفترة</InputLabel>
                    <Select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      label="الفترة"
                    >
                      <MenuItem value="all">الكل</MenuItem>
                      <MenuItem value="today">اليوم</MenuItem>
                      <MenuItem value="week">آخر 7 أيام</MenuItem>
                      <MenuItem value="month">آخر 30 يوم</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" gap={1} sx={{ mt: 0.5 }}>
                    <Button 
                      variant="contained" 
                      onClick={() => {}} 
                      sx={{ flex: 1 }}
                    >
                      تطبيق
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={resetFilters}
                    >
                      مسح
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {filteredCalls.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 4,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2
            }}>
              <PendingActions sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" color="text.secondary" fontFamily="Cairo">
                لا توجد مكالمات متابعة
              </Typography>
              <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'كل المكالمات معالجة'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 120 }}>📅 التاريخ</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 100 }}>⏱ الوقت</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 120 }}>📞 نوع المكالمة</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 150 }}>👤 المستخدم</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 150 }}>🔄 حالة التوجيه</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 150 }}>📝 الملاحظات</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 150 }}>📚 الطالب</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 80 }}>تفاصيل</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold', minWidth: 120 }}>🔧 معالجة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCalls.map((call, index) => {
                      const student = studentsInfo[call.accountGuid] || {};
                      const callFollowUps = getFollowUpsForCall(call.guid);
                      const callTypeInfo = getCallType(call.callType);
                      const forwardInfo = getForwardInfo(call);
                      
                      return (
                        <React.Fragment key={call.guid}>
                          <TableRow hover sx={{ '&:last-child td': { borderBottom: expandedRow === index ? 0 : undefined } }}>
                            <TableCell align="center" sx={{ fontFamily: 'Cairo' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {formatDate(call.callDate)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ fontFamily: 'Cairo' }}>
                              {formatTime(call.callTime)}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                icon={<span>{callTypeInfo.icon}</span>}
                                label={callTypeInfo.text}
                                color={callTypeInfo.color}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title={getUserFullName(call.userGuid)} arrow>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 30, 
                                      height: 30, 
                                      marginInlineEnd: 1,
                                      bgcolor: 'primary.main',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    {getUserFullName(call.userGuid).charAt(0)}
                                  </Avatar>
                                  <Typography sx={{ fontFamily: 'Cairo', fontSize: '0.8rem' }}>
                                    <bdi dir="ltr">{getUserFullName(call.userGuid).split(' ')[0]}</bdi>
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                icon={forwardInfo.icon}
                                label={forwardInfo.text}
                                color={forwardInfo.color}
                                size="small"
                                variant="filled"
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ fontFamily: 'Cairo', maxWidth: 200 }}>
                              <Tooltip title={call.notes || 'لا توجد ملاحظات'} arrow>
                                <Typography noWrap sx={{ 
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  color: call.notes ? 'text.primary' : 'text.secondary',
                                  fontSize: '0.8rem'
                                }}>
                                  {call.notes || '—'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                sx={{
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 2,
                                  p: 1,
                                  backgroundColor: 'background.default',
                                  fontFamily: 'Cairo',
                                  width: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center'
                                }}
                              >
                                <Typography fontWeight="bold" fontSize={14} sx={{ mb: 0.5 }}>
                                  {student.studentName || '—'}
                                </Typography>
                                {student.nationalId && (
                                  <Typography fontSize={12} color="text.secondary">
                                    الرقم القومي: <bdi dir="ltr">{student.nationalId}</bdi>
                                  </Typography>
                                )}
                                {student.studentTel && (
                                  <Typography fontSize={12} color="text.secondary">
                                    جــوال: <bdi dir="ltr">{student.studentTel}</bdi>
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title={expandedRow === index ? 'إخفاء التفاصيل' : 'عرض التفاصيل'} arrow>
                                <IconButton 
                                  onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                                  size="small"
                                  color={expandedRow === index ? 'primary' : 'default'}
                                >
                                  {expandedRow === index ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              <Button 
                                variant="contained" 
                                color="primary" 
                                size="small" 
                                onClick={() => handleOpenFollowForm(call)} 
                                sx={{ 
                                  fontFamily: "Cairo",
                                  borderRadius: 2,
                                  px: 2,
                                  boxShadow: 'none',
                                  '&:hover': { boxShadow: 'none' },
                                  fontSize: '0.7rem'
                                }}
                                startIcon={<PendingActions fontSize="small" />}
                              >
                                متابعة
                              </Button>
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell colSpan={9} sx={{ p: 0, borderTop: 0 }}>
                              <Collapse in={expandedRow === index} timeout="auto" unmountOnExit>
                                <Box sx={{ 
                                  margin: 2,
                                  p: 2,
                                  backgroundColor: 'background.default',
                                  borderRadius: 2,
                                  border: 1,
                                  borderColor: 'divider'
                                }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2
                                  }}>
                                    <Typography variant="subtitle1" sx={{ 
                                      fontWeight: 'bold', 
                                      fontFamily: 'Cairo',
                                      color: 'primary.main'
                                    }}>
                                      📌 سجل المتابعات ({callFollowUps.length})
                                    </Typography>
                                    <Chip 
                                      label={callFollowUps.length > 0 ? 'قيد المتابعة' : 'بدون متابعات'} 
                                      size="small"
                                      color={callFollowUps.length > 0 ? 'warning' : 'default'}
                                      variant="outlined"
                                    />
                                  </Box>

                                  {callFollowUps.length === 0 ? (
                                    <Typography sx={{ 
                                      fontFamily: 'Cairo',
                                      textAlign: 'center',
                                      color: 'text.secondary',
                                      py: 2
                                    }}>
                                      لا توجد متابعات مسجلة لهذه المكالمة
                                    </Typography>
                                  ) : (
                                    <Table size="small" sx={{ 
                                      backgroundColor: 'background.paper',
                                      borderRadius: 1
                                    }}>
                                      <TableHead>
                                        <TableRow>
                                          <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold' }}>📅 التاريخ</TableCell>
                                          <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold' }}>📝 الملاحظة</TableCell>
                                          <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold' }}>👤 المستخدم</TableCell>
                                          <TableCell align="center" sx={{ fontFamily: "Cairo", fontWeight: 'bold' }}>الحالة</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {callFollowUps.map((follow, i) => (
                                          <TableRow key={i} hover>
                                            <TableCell align="center" sx={{ fontFamily: 'Cairo' }}>
                                              {formatDate(follow.createdAt)}
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontFamily: 'Cairo' }}>
                                              {follow.followUpNotes}
                                            </TableCell>
                                            <TableCell align="center">
                                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Avatar 
                                                  sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    marginInlineEnd: 1,
                                                    bgcolor: 'secondary.main',
                                                    fontSize: '0.7rem'
                                                  }}
                                                >
                                                  {follow.userFullName?.charAt(0) || '—'}
                                                </Avatar>
                                                <Typography sx={{ fontFamily: 'Cairo', fontSize: '0.8rem' }}>
                                                  {follow.userFullName || '—'}
                                                </Typography>
                                              </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Chip 
                                                label={follow.stauts === 0 ? 'مكتملة' : 'قيد المتابعة'} 
                                                size="small"
                                                color={follow.stauts === 0 ? 'success' : 'warning'}
                                                variant="outlined"
                                              />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}

                                  {/* ✅ تفاصيل إضافية للمكالمة */}
                                  {call.callType === 2 && call.complainDetails && (
                                    <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                                      <Typography variant="subtitle2" sx={{ fontFamily: 'Cairo', fontWeight: 'bold', color: 'white', mb: 1 }}>
                                        🗣️ تفاصيل الشكوى:
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontFamily: 'Cairo', color: 'white' }}>
                                        {call.complainDetails}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 2,
                px: 1
              }}>
                <Typography variant="body2" color="text.secondary" fontFamily="Cairo">
                  عرض {Math.min(rowsPerPage, filteredCalls.length - page * rowsPerPage)} من أصل {filteredCalls.length} مكالمة
                </Typography>
                
                <TablePagination
                  component="div"
                  count={filteredCalls.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                  labelRowsPerPage="صفوف لكل صفحة:"
                  sx={{ fontFamily: 'Cairo' }}
                  labelDisplayedRows={({ from, to, count }) => (
                    <Typography fontFamily="Cairo">
                      {from}-{to} من {count}
                    </Typography>
                  )}
                />
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={onClose} 
            color="secondary" 
            variant="outlined"
            sx={{ 
              fontFamily: "Cairo",
              borderRadius: 2,
              px: 3,
              borderWidth: 2,
              '&:hover': { borderWidth: 2 }
            }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Follow-up Form Dialog */}
      <Dialog 
        open={openFollowForm} 
        onClose={handleCloseFollowForm} 
        fullWidth 
        maxWidth="sm"
        sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          fontFamily: "Cairo", 
          fontWeight: 'bold',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PendingActions sx={{ marginInlineEnd: 1 }} />
            إضافة متابعة للمكالمة
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedCall && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontFamily: 'Cairo', fontWeight: 'bold', mb: 1 }}>
                تفاصيل المكالمة الأصلية
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Cairo' }}>
                <strong>التاريخ:</strong> {formatDate(selectedCall.callDate)}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Cairo' }}>
                <strong>النوع:</strong> {getCallType(selectedCall.callType).text}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Cairo' }}>
                <strong>الملاحظات:</strong> {selectedCall.notes || '—'}
              </Typography>
              {selectedCall.callType === 2 && selectedCall.complainDetails && (
                <Typography variant="body2" sx={{ fontFamily: 'Cairo' }}>
                  <strong>تفاصيل الشكوى:</strong> {selectedCall.complainDetails}
                </Typography>
              )}
            </Box>
          )}
          
          <TextField
            label="ملاحظات المتابعة"
            multiline
            fullWidth
            rows={4}
            margin="normal"
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
            sx={{ fontFamily: 'Cairo', '& textarea': { fontFamily: 'Cairo' } }}
            InputLabelProps={{ sx: { fontFamily: 'Cairo' } }}
          />
          
          <FormControl fullWidth margin="normal" sx={{ mt: 2 }}>
            <InputLabel sx={{ fontFamily: 'Cairo' }}>الحالة</InputLabel>
            <Select
              value={followUpStatus}
              onChange={(e) => setFollowUpStatus(e.target.value)}
              label="الحالة"
              sx={{ fontFamily: 'Cairo', borderRadius: 2 }}
            >
              {userJob === 17 && (
                <MenuItem value="0" sx={{ fontFamily: 'Cairo' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutline sx={{ marginInlineEnd: 1, color: 'success.main' }} />
                    مكتملة
                  </Box>
                </MenuItem>
              )}
              <MenuItem value="1" sx={{ fontFamily: 'Cairo' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PendingActions sx={{ marginInlineEnd: 1, color: 'warning.main' }} />
                  متابعة لاحقًا
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseFollowForm} 
            color="secondary" 
            variant="outlined"
            sx={{ 
              fontFamily: "Cairo",
              borderRadius: 2,
              px: 3,
              '&:hover': { borderWidth: 2 }
            }}
          >
            إلغاء
          </Button>
          {isSubmitting ? (
            <CircularProgress size={24} color="primary" />
          ) : (
            <Button 
              onClick={submitFollowUp} 
              color="primary" 
              variant="contained"
              disabled={!followUpStatus}
              sx={{ 
                fontFamily: "Cairo",
                borderRadius: 2,
                px: 3,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
              startIcon={<PendingActions />}
            >
              حفظ المتابعة
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}